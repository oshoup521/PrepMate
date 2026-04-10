import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');
import { UsersService } from '../users/users.service';

const MONTHLY_AMOUNT_PAISE = 29900; // ₹299
const ANNUAL_AMOUNT_PAISE = 322900; // ₹3,229

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

  async createOrder(plan: 'monthly' | 'annual') {
    const amount = plan === 'annual' ? ANNUAL_AMOUNT_PAISE : MONTHLY_AMOUNT_PAISE;
    const order = await this.razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `prepmate_${plan}_${Date.now()}`,
    });
    return { orderId: order.id, amount: order.amount, currency: order.currency };
  }

  async verifyAndUpgrade(
    userId: string,
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    plan: 'monthly' | 'annual',
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

    await this.usersService.upgradeToPro(userId, plan, razorpay_payment_id, razorpay_order_id);
    this.logger.log(`User ${userId} upgraded to pro (${plan})`);
    return { success: true };
  }

  async cancelSubscription(userId: string) {
    await this.usersService.cancelSubscription(userId);
    this.logger.log(`Subscription cancelled for user ${userId}`);
    return { success: true, message: 'Subscription cancelled successfully' };
  }
}
