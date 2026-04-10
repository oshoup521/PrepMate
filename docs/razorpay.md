# Razorpay Integration Plan — PrepMate

**For:** Indian users (INR)
**Plans:** Monthly ₹299 · Annual ₹3,229 (10% off)

---

## Phase 1 — Basic Monthly Payment

Goal: a user can pay ₹299 and get upgraded to Pro.

### Account & Config
- [ ] Sign up at razorpay.com, complete KYC (or use Test Mode until KYC clears)
- [ ] Generate API keys from Dashboard → Settings → API Keys
- [ ] Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `server/.env`
- [ ] Add `VITE_RAZORPAY_KEY_ID` to `client/.env`

### Database
- [ ] Add `plan` column to User entity — values: `'free' | 'pro'`, default `'free'`
- [ ] Add `planExpiresAt` column — timestamp, nullable
- [ ] Add `razorpayPaymentId` column — text, nullable
- [ ] Add `razorpayOrderId` column — text, nullable
- [ ] Run migration

### Backend
- [ ] Install `razorpay` npm package on the server
- [ ] Generate payment module, service, controller with Nest CLI
- [ ] `POST /payment/create-order` — creates a Razorpay order for ₹299 (29900 paise)
- [ ] `POST /payment/verify` — verifies Razorpay signature using HMAC SHA256, sets `plan = 'pro'` and `planExpiresAt = now + 30 days`
- [ ] Both endpoints protected by JWT guard

### Plan Gating
- [ ] In the interview session service, check user's plan before allowing a new session
- [ ] If `plan = 'free'` and session count >= 5, throw `ForbiddenException`
- [ ] If `plan = 'pro'` and `planExpiresAt` is past, reset to `'free'` first

### Frontend
- [ ] Load Razorpay checkout script dynamically (CDN, no npm package needed)
- [ ] "Upgrade to Pro" button — calls `create-order`, opens Razorpay modal, on success calls `verify`
- [ ] Show success message and refresh user state after verification

### Test
- [ ] Use test card `4111 1111 1111 1111` / any expiry / CVV `999` / OTP `1234`
- [ ] Confirm `plan` and `planExpiresAt` update correctly in the DB
- [ ] Confirm free user hitting session limit gets the right error

---

## Phase 2 — Add Annual Plan

Goal: user can choose between monthly (₹299) and annual (₹3,229).

### Database
- [ ] Add `billingCycle` column to User entity — values: `'monthly' | 'annual'`, default `'monthly'`
- [ ] Run migration

### Backend
- [ ] Update `create-order` to accept `plan: 'monthly' | 'annual'` in the request body
- [ ] Monthly amount: 29900 paise · Annual amount: 322900 paise
- [ ] Update `verify` to set `planExpiresAt = now + 30 days` for monthly, `now + 365 days` for annual
- [ ] Store `billingCycle` on the user after successful payment

### Frontend
- [ ] Add plan toggle on the upgrade screen — Monthly vs Annual
- [ ] Show annual saving: *"Save ₹359 — 10% off"*
- [ ] Pass selected plan to `create-order` request

### Test
- [ ] Pay for monthly — confirm expiry is ~30 days from now
- [ ] Pay for annual — confirm expiry is ~365 days from now
- [ ] Confirm `billingCycle` stores correctly

---

## Phase 3 — Coupon System

Goal: admin can create coupon codes, users can apply them at checkout for a discount.

### Database
- [ ] Create `Coupon` entity with fields: `code`, `type` (percent/fixed), `discountValue`, `appliesTo` (monthly/annual/all), `maxUses` (nullable), `isOneTimePerUser`, `usesCount`, `validFrom`, `validUntil`, `isActive`
- [ ] Create `UserCouponUsage` entity with fields: `userId`, `couponId`, `usedAt` — tracks which users have used one-time coupons
- [ ] Run migration

### Backend
- [ ] `GET /payment/validate-coupon?code=X&plan=Y` — validates the coupon and returns the discounted amount (does not apply it yet, just previews)
  - Checks: active, not expired, usage limit not hit, plan match, not already used by this user (if `isOneTimePerUser`)
- [ ] Update `create-order` to accept optional `couponCode` — validate coupon, apply discount to order amount before calling `razorpay.orders.create()`
- [ ] Update `verify` to increment `coupon.usesCount` and insert a `UserCouponUsage` row after successful payment
- [ ] Coupon validation logic must run on the backend — never trust a discounted amount from the frontend

### Coupon Creation (No Admin UI in v1)
- [ ] Create coupon records directly in the DB or via a seed script
- [ ] Example coupons to seed: `WELCOME20` (20% off, one-time per user), `ANNUAL10` (10% off annual only), `FLAT100` (₹100 off monthly)

### Frontend
- [ ] Add coupon code input field on the upgrade screen
- [ ] "Apply" button calls `validate-coupon` and shows the new price if valid, or an error if not
- [ ] Pass `couponCode` along with `plan` in the `create-order` request

### Test
- [ ] Seed a coupon, apply it at checkout, confirm the Razorpay order amount is the discounted value
- [ ] Confirm `usesCount` increments in DB after payment
- [ ] Try using a one-time coupon twice with the same user — should be rejected on second use
- [ ] Try an expired / maxed-out coupon — should be rejected

---

## API Endpoints (Final)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payment/create-order` | JWT | Creates order — accepts `plan` and optional `couponCode` |
| POST | `/payment/verify` | JWT | Verifies signature, upgrades user, records coupon usage |
| GET | `/payment/validate-coupon` | JWT | Previews discount for a coupon code + plan combo |

---

## Going Live Checklist

- [ ] KYC completed on Razorpay dashboard
- [ ] Swap test keys for live keys in `.env`
- [ ] Backend on HTTPS
- [ ] Coupon seeds applied to production DB
- [ ] End-to-end test with a real ₹1 payment
- [ ] Webhook for `payment.failed` set up (needed for Phase 4 — grace period)
