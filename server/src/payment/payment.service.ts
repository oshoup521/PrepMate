import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');
import { UsersService } from '../users/users.service';

export const SESSION_PACKS = {
  starter: { amountPaise: 22500, sessions: 5,  label: 'Starter' },
  popular: { amountPaise: 52500, sessions: 15, label: 'Popular' },
  power:   { amountPaise: 90000, sessions: 30, label: 'Power'   },
} as const;

export type PackKey = keyof typeof SESSION_PACKS;

export const CUSTOM_MIN_SESSIONS = 1;
export const CUSTOM_MAX_SESSIONS = 100;

// Marginal (bracket) pricing — each bracket's rate applies only to sessions
// that fall inside it. Packs remain the best deal by a small margin, which
// nudges users toward the curated options while still supporting custom qty.
const CUSTOM_BRACKETS: ReadonlyArray<{ upTo: number; paisePerSession: number }> = [
  { upTo: 5,   paisePerSession: 5000 }, // 1–5:   ₹50/session (retail anchor)
  { upTo: 15,  paisePerSession: 3000 }, // 6–15:  ₹30/session
  { upTo: 30,  paisePerSession: 2500 }, // 16–30: ₹25/session
  { upTo: 100, paisePerSession: 2200 }, // 31+:   ₹22/session
];

export function calculateCustomPricePaise(sessions: number): number {
  if (
    !Number.isInteger(sessions) ||
    sessions < CUSTOM_MIN_SESSIONS ||
    sessions > CUSTOM_MAX_SESSIONS
  ) {
    throw new BadRequestException(
      `sessions must be an integer between ${CUSTOM_MIN_SESSIONS} and ${CUSTOM_MAX_SESSIONS}`,
    );
  }
  let remaining = sessions;
  let prevCap = 0;
  let totalPaise = 0;
  for (const b of CUSTOM_BRACKETS) {
    const bracketSize = b.upTo - prevCap;
    const take = Math.min(remaining, bracketSize);
    totalPaise += take * b.paisePerSession;
    remaining -= take;
    prevCap = b.upTo;
    if (remaining <= 0) break;
  }
  return totalPaise;
}

type OrderInput = { pack?: PackKey; sessions?: number };

function resolveOrderInput(input: OrderInput): {
  sessions: number;
  amountPaise: number;
  label: string;
  kind: 'pack' | 'custom';
  packKey?: PackKey;
} {
  const hasPack = !!input.pack;
  const hasSessions = typeof input.sessions === 'number';
  if (hasPack === hasSessions) {
    throw new BadRequestException('Provide exactly one of `pack` or `sessions`');
  }
  if (hasPack) {
    const p = SESSION_PACKS[input.pack as PackKey];
    return {
      sessions: p.sessions,
      amountPaise: p.amountPaise,
      label: p.label,
      kind: 'pack',
      packKey: input.pack,
    };
  }
  const s = input.sessions as number;
  return {
    sessions: s,
    amountPaise: calculateCustomPricePaise(s),
    label: `Custom · ${s} session${s === 1 ? '' : 's'}`,
    kind: 'custom',
  };
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private razorpay: Razorpay;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    });
  }

  async createOrder(input: OrderInput) {
    const resolved = resolveOrderInput(input);
    const receiptTag = resolved.kind === 'pack' ? resolved.packKey : `custom${resolved.sessions}`;
    const order = await this.razorpay.orders.create({
      amount: resolved.amountPaise,
      currency: 'INR',
      receipt: `prepmate_${receiptTag}_${Date.now()}`,
    });
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      sessions: resolved.sessions,
      label: resolved.label,
    };
  }

  async verifyAndAddCredits(
    userId: string,
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    input: OrderInput,
  ) {
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') ?? '';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      this.logger.warn(`Invalid Razorpay signature for user ${userId}`);
      throw new BadRequestException('Payment verification failed: invalid signature');
    }

    const { sessions, kind } = resolveOrderInput(input);
    await this.usersService.addSessionCredits(userId, sessions, razorpay_payment_id, razorpay_order_id);
    this.logger.log(`User ${userId} purchased ${kind} (+${sessions} sessions)`);
    return { success: true, sessionsAdded: sessions };
  }
}
