# PrepMate — Payment Strategy & Feature Plan

This document defines the full payment strategy for PrepMate, covering pricing, plan structure, coupon system, and all additional payment features. Implementation details live in `razorpay.md` and `stripe.md`.

---

## 1. Payment Gateways

| Gateway | Region | Currency | Use Case |
|---------|--------|----------|----------|
| **Razorpay** | India | INR (₹) | All Indian users — UPI, cards, netbanking, wallets |
| **Stripe** | International | USD ($) | Non-Indian users — cards, Apple Pay, Google Pay |

Gateway is selected automatically based on the user's country at checkout.

---

## 2. Pricing

### Razorpay (INR)

| Plan | Price | Billed |
|------|-------|--------|
| Free | ₹0 | — |
| Pro Monthly | **₹299 / month** | Every month |
| Pro Annual | **₹3,229 / year** | Once a year *(₹269/month — 10% off)* |

> Annual saving: ₹359 compared to paying monthly for 12 months.

### Stripe (USD)

| Plan | Price | Billed |
|------|-------|--------|
| Free | $0 | — |
| Pro Monthly | **$4.99 / month** | Every month |
| Pro Annual | **$53.99 / year** | Once a year *($4.50/month — 10% off)* |

> Annual saving: ~$6 compared to paying monthly for 12 months.

---

## 3. Free vs Pro — Feature Limits

| Feature | Free | Pro |
|---------|------|-----|
| Interview sessions | 5 total | Unlimited |
| Question types | Basic | All (HR, Technical, DSA, System Design) |
| AI feedback | Basic | Detailed with scoring |
| Voice input | No | Yes |
| Session history | Last 3 | Full history |
| Resume-based questions | No | Yes |
| Priority support | No | Yes |

---

## 4. Coupon / Discount Code System

### 4.1 Coupon Types

| Type | Example Code | Behavior |
|------|-------------|----------|
| Percentage off | `WELCOME20` | 20% off any plan |
| Fixed amount off | `FLAT100` | ₹100 / $1.50 off |
| Plan-specific | `ANNUAL10` | Only applies to annual plan |
| One-time use per user | `BETA2024` | Single use per user |
| Multi-use | `PREPMATE` | Can be used by many users |
| Expiring | `LAUNCH50` | Valid only until a set date |

### 4.2 Coupon Fields (Database)

```
id, code, type (percent | fixed),
discount_value, applies_to (monthly | annual | all),
max_uses, uses_count, valid_from, valid_until,
is_active, created_at
```

### 4.3 Flow

1. User enters coupon code at checkout
2. Backend validates: active, not expired, usage limit not hit, plan matches
3. Discount applied to order amount before charging
4. `uses_count` incremented on successful payment

### 4.4 Razorpay Coupons

Razorpay does not have a native coupon system — implement coupon validation entirely on the backend before creating the order. Pass the discounted amount to `razorpay.orders.create()`.

### 4.5 Stripe Coupons

Stripe has a native Coupon + Promotion Code system. Create coupons in the Stripe Dashboard or via API and apply them at checkout session creation:

```ts
// Option A: apply a specific coupon
discounts: [{ coupon: 'COUPON_ID' }]

// Option B: show a promo code field on Stripe's hosted checkout
allow_promotion_codes: true
```

---

## 5. Subscription Plans

### 5.1 Monthly

- Charged every 30 days
- Can be cancelled anytime — access continues until end of billing period
- No penalty for cancellation

### 5.2 Annual

- Charged once per year upfront
- 10% discount applied automatically at checkout
- On cancellation: access continues until year end, no mid-year refund

### 5.3 Subscription Lifecycle Events

| Event | Action |
|-------|--------|
| Payment success | Set `plan = 'pro'`, set `planExpiresAt` |
| Subscription renewed | Extend `planExpiresAt` |
| Payment failed | Start 3-day grace period, send email |
| Grace period expired | Downgrade to free |
| Subscription cancelled | Keep pro until period end, then downgrade |

---

## 6. Free Trial

- **Duration:** 7 days
- No credit card required to start
- Trial ends → user stays on free plan (no auto-charge)
- Each user gets only one trial (tracked by `trialUsed: boolean` on user entity)
- Show clear trial countdown in the UI: *"3 days left in your trial"*

---

## 7. Grace Period on Payment Failure

- On renewal failure, do **not** immediately downgrade
- Send email: *"Payment failed — update your card"*
- Allow **3-day grace period** with full Pro access
- Retry payment once on day 3
- If still failed → downgrade to free + send final email
- **Stripe:** handles retry and dunning natively via Dashboard → Billing → Revenue Recovery
- **Razorpay:** implement with a scheduled cron job

---

## 8. Invoice & Receipts

- **Stripe:** generates PDF invoices automatically — available in the customer portal
- **Razorpay:** use the Razorpay Invoices API or generate with `pdfkit`
- Email invoice to user on every successful payment
- Users can download invoice history from their settings page
- Include: invoice number, plan name, billing period, amount paid, GST

> **GST Note:** 18% GST applies on digital services for Indian users. If annual Razorpay revenue exceeds ₹20L, GST registration is mandatory.

---

## 9. Refund Policy

- **Window:** 7 days from purchase date
- **Eligible:** First-time purchases only (not renewals)
- **Process:**
  - User submits refund request from the settings page
  - Backend checks: within 7 days + no more than 2 sessions used
  - If eligible: issue full refund, downgrade to free immediately
  - If not eligible: show reason clearly
- Stripe: `stripe.refunds.create({ payment_intent: id })`
- Razorpay: `razorpay.payments.refund(paymentId, { amount })`

---

## 10. Customer Portal (Self-Serve)

Users manage their subscription from the account settings page:

- View current plan and next billing date
- Switch between monthly / annual
- Update payment method
- Download invoices
- Apply coupon code
- Cancel subscription
- Request refund (within 7-day window)

**Stripe:** Use the hosted **Stripe Customer Portal** (`stripe.billingPortal.sessions.create()`) — handles most of this out of the box.

**Razorpay:** Build these screens manually.

---

## 11. Feature Flags

Control which features are live without a redeploy:

```env
PAYMENT_ENABLED=true
TRIAL_ENABLED=true
COUPONS_ENABLED=true
```

---

## 12. Implementation Priority

| Priority | Feature |
|----------|---------|
| P0 (Launch) | Monthly + annual plans, Razorpay + Stripe |
| P0 (Launch) | Coupon codes |
| P0 (Launch) | Free trial (7 days) |
| P1 (Post-launch) | Grace period on payment failure |
| P1 (Post-launch) | Customer portal, invoice downloads |
| P2 (Later) | Refund flow UI |
