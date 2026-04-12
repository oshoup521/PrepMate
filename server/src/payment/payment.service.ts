import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');
import { UsersService } from '../users/users.service';

export const SESSION_PACKS = {
  starter: { amountPaise: 14900, sessions: 5,  label: 'Starter' },
  popular: { amountPaise: 29900, sessions: 15, label: 'Popular' },
  power:   { amountPaise: 49900, sessions: 30, label: 'Power'   },
} as const;

export type PackKey = keyof typeof SESSION_PACKS;

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

  async createOrder(pack: PackKey) {
    const { amountPaise, sessions, label } = SESSION_PACKS[pack];
    const order = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `prepmate_${pack}_${Date.now()}`,
    });
    return { orderId: order.id, amount: order.amount, currency: order.currency, sessions, label };
  }

  async verifyAndAddCredits(
    userId: string,
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    pack: PackKey,
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

    const { sessions } = SESSION_PACKS[pack];
    await this.usersService.addSessionCredits(userId, sessions, razorpay_payment_id, razorpay_order_id);
    this.logger.log(`User ${userId} purchased ${pack} pack (+${sessions} sessions)`);
    return { success: true, sessionsAdded: sessions };
  }
}
