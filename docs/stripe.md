# Stripe Payment Integration — PrepMate

**Stack:** NestJS + TypeORM + PostgreSQL + React (Vite)

> Use Stripe if you plan to target international users (USD/EUR). For India-only, prefer Razorpay.

---

## 1. Account Setup

1. Sign up at [stripe.com](https://stripe.com)
2. No KYC needed to start — you can test immediately
3. For payouts, complete identity verification in the dashboard
4. Go to **Dashboard → Developers → API Keys**
5. Save your `Publishable Key` and `Secret Key`

---

## 2. Environment Variables

### server/.env
```env
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### client/.env
```env
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

> Never expose `STRIPE_SECRET_KEY` on the frontend.

---

## 3. Install Dependencies

```bash
# server
cd server
npm install stripe

# client
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 4. Database Changes

Add these columns to the `user` entity:

### server/src/users/entities/user.entity.ts

```ts
@Column({ default: 'free' })
plan: string; // 'free' | 'pro'

@Column({ type: 'timestamp', nullable: true })
planExpiresAt: Date | null;

@Column({ type: 'text', nullable: true })
stripeCustomerId: string | null;

@Column({ type: 'text', nullable: true })
stripeSubscriptionId: string | null;
```

---

## 5. Backend — Payment Module

### 5.1 Create the module

```bash
cd server
nest generate module payment
nest generate controller payment
nest generate service payment
```

### 5.2 server/src/payment/payment.service.ts

```ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createCheckoutSession(userId: string, userEmail: string) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'PrepMate Pro' },
            unit_amount: 999, // $9.99 in cents
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { userId },
      success_url: `${this.configService.get('CLIENT_URL')}/dashboard?payment=success`,
      cancel_url: `${this.configService.get('CLIENT_URL')}/dashboard?payment=cancelled`,
    });

    return { sessionUrl: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata.userId;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await this.usersRepository.update(userId, {
        plan: 'pro',
        planExpiresAt: expiresAt,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await this.usersRepository.update(
        { stripeSubscriptionId: subscription.id },
        { plan: 'free', planExpiresAt: null },
      );
    }

    return { received: true };
  }

  async cancelSubscription(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
    await this.usersRepository.update(userId, {
      plan: 'free',
      planExpiresAt: null,
      stripeSubscriptionId: null,
    });

    return { success: true, message: 'Subscription cancelled' };
  }
}
```

### 5.3 server/src/payment/payment.controller.ts

```ts
import {
  Controller, Post, Body, Req, UseGuards, Headers, RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  createCheckoutSession(@Req() req) {
    return this.paymentService.createCheckoutSession(req.user.id, req.user.email);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  cancelSubscription(@Req() req) {
    return this.paymentService.cancelSubscription(req.user.id);
  }

  // Webhook — NO JWT guard, Stripe signs this itself
  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentService.handleWebhook(req.rawBody, signature);
  }
}
```

### 5.4 Enable rawBody in main.ts

Stripe webhook verification requires the raw request body:

```ts
// server/src/main.ts
const app = await NestFactory.create(AppModule, { rawBody: true });
```

### 5.5 server/src/payment/payment.module.ts

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
```

Register in `app.module.ts`:
```ts
imports: [..., PaymentModule],
```

---

## 6. Gate Free Users on the Backend

In your interview session service, add a plan check:

```ts
const user = await this.usersRepository.findOne({ where: { id: userId } });

// Expire pro plan if past date
if (user.plan === 'pro' && user.planExpiresAt && user.planExpiresAt < new Date()) {
  await this.usersRepository.update(userId, { plan: 'free' });
  user.plan = 'free';
}

const FREE_SESSION_LIMIT = 5;

if (user.plan === 'free') {
  const sessionCount = await this.sessionRepository.count({ where: { userId } });
  if (sessionCount >= FREE_SESSION_LIMIT) {
    throw new ForbiddenException('Free plan limit reached. Upgrade to Pro.');
  }
}
```

---

## 7. Frontend — Checkout Button

### client/src/components/UpgradeToPro.jsx

```jsx
import axios from 'axios';

export default function UpgradeToPro() {
  const handleUpgrade = async () => {
    try {
      const { data } = await axios.post(
        '/api/payment/create-checkout-session',
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Redirect to Stripe's hosted checkout page
      window.location.href = data.sessionUrl;
    } catch (err) {
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <button onClick={handleUpgrade}>
      Upgrade to Pro — $9.99/month
    </button>
  );
}
```

After payment, Stripe redirects back to your `success_url`. Read the query param to show a success message:

```jsx
// In Dashboard.jsx
const params = new URLSearchParams(window.location.search);
if (params.get('payment') === 'success') {
  toast.success('You are now on Pro!');
}
```

---

## 8. Webhook Setup (Important)

Stripe sends events (payment success, subscription cancelled) to your backend via webhook.

### Local testing with Stripe CLI:
```bash
# Install Stripe CLI, then:
stripe listen --forward-to localhost:3000/payment/webhook
```

This gives you a temporary `STRIPE_WEBHOOK_SECRET` — paste it into your `.env`.

### Production:
1. Go to **Stripe Dashboard → Developers → Webhooks → Add Endpoint**
2. URL: `https://your-backend.com/payment/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copy the **Signing Secret** → paste as `STRIPE_WEBHOOK_SECRET` in your `.env`

---

## 9. API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payment/create-checkout-session` | JWT | Redirects to Stripe checkout |
| POST | `/payment/cancel` | JWT | Cancels active subscription |
| POST | `/payment/webhook` | Stripe signature | Handles Stripe events |

---

## 10. Testing (Test Mode)

Use these test card details on Stripe's checkout page:
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/34`)
- **CVV:** Any 3 digits
- **ZIP:** Any 5 digits

To test a declined card: `4000 0000 0000 0002`

---

## 11. Going Live Checklist

- [ ] Identity verification completed on Stripe dashboard
- [ ] Replace test keys with live keys in `.env`
- [ ] Production webhook endpoint registered and `STRIPE_WEBHOOK_SECRET` updated
- [ ] Backend deployed on HTTPS
- [ ] Test a real $1 payment end to end
- [ ] Handle `invoice.payment_failed` webhook for subscription renewal failures (optional)

---

## Razorpay vs Stripe — Quick Comparison

| | Razorpay | Stripe |
|---|---|---|
| Best for | India (INR) | International (USD/EUR) |
| UPI support | Yes | No |
| Setup difficulty | Easy | Moderate (webhooks required) |
| KYC | Required for payouts | Required for payouts |
| Transaction fee | ~2% | 2.9% + $0.30 |
| Test mode | Instant | Instant |
