# Razorpay Payment Integration — PrepMate

**Stack:** NestJS + TypeORM + PostgreSQL + React (Vite)

---

## 1. Account Setup

1. Sign up at [razorpay.com](https://razorpay.com)
2. Complete KYC (PAN card + bank account) — takes 1–2 business days
3. Until KYC, use **Test Mode** — it works fully with no real money
4. Go to **Dashboard → Settings → API Keys → Generate Key**
5. Save your `Key ID` and `Key Secret`

---

## 2. Environment Variables

### server/.env
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### client/.env
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
```

> Never expose `KEY_SECRET` on the frontend.

---

## 3. Install Dependencies

```bash
# server
cd server
npm install razorpay

# no frontend package needed — Razorpay uses a CDN script
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
razorpayPaymentId: string | null;

@Column({ type: 'text', nullable: true })
razorpayOrderId: string | null;
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
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async createOrder(userId: string) {
    const amount = 49900; // amount in paise (₹499)
    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
    };

    const order = await this.razorpay.orders.create(options);
    return { orderId: order.id, amount: order.amount, currency: order.currency };
  }

  async verifyPayment(
    userId: string,
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
  ) {
    const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Upgrade user to pro (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.usersRepository.update(userId, {
      plan: 'pro',
      planExpiresAt: expiresAt,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });

    return { success: true, message: 'Plan upgraded to Pro' };
  }
}
```

### 5.3 server/src/payment/payment.controller.ts

```ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  createOrder(@Req() req) {
    return this.paymentService.createOrder(req.user.id);
  }

  @Post('verify')
  verifyPayment(
    @Req() req,
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.paymentService.verifyPayment(
      req.user.id,
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
    );
  }
}
```

### 5.4 server/src/payment/payment.module.ts

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

Register it in `app.module.ts`:
```ts
imports: [..., PaymentModule],
```

---

## 6. Gate Free Users on the Backend

In your interview session service, check the plan before allowing a new session:

```ts
// Example check inside your interview service
const user = await this.usersRepository.findOne({ where: { id: userId } });

// Check if pro plan has expired
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

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function UpgradeToPro() {
  const handleUpgrade = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Failed to load payment gateway. Check your internet connection.');
      return;
    }

    // 1. Create order on backend
    const { data } = await axios.post(
      '/api/payment/create-order',
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );

    // 2. Open Razorpay checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: data.currency,
      name: 'PrepMate',
      description: 'Pro Plan — 1 Month',
      order_id: data.orderId,
      handler: async (response) => {
        // 3. Verify on backend
        await axios.post('/api/payment/verify', response, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('Upgraded to Pro! Refresh the page.');
      },
      prefill: { name: 'User', email: 'user@example.com' },
      theme: { color: '#6366f1' },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button onClick={handleUpgrade}>
      Upgrade to Pro — ₹499/month
    </button>
  );
}
```

---

## 8. API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payment/create-order` | JWT | Creates a Razorpay order |
| POST | `/payment/verify` | JWT | Verifies payment & upgrades plan |

---

## 9. Testing (Test Mode)

Use these test card details:
- **Card Number:** `4111 1111 1111 1111`
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **OTP:** `1234` (on test bank page)

For UPI: use `success@razorpay` as the UPI ID

---

## 10. Going Live Checklist

- [ ] KYC completed on Razorpay dashboard
- [ ] Replace test keys with live keys in `.env`
- [ ] Backend deployed on HTTPS
- [ ] Test a real ₹1 payment end to end
- [ ] Add webhook (optional but recommended) for payment failure handling
