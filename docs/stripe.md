# Stripe Integration Plan — PrepMate

**For:** International users (USD)
**Plans:** Monthly $4.99 · Annual $53.99 (~$4.50/month, 10% off)

> Implement Razorpay first. Mirror the same phases here once Razorpay is stable.

---

## Phase 1 — Basic Monthly Subscription

Goal: an international user can pay $4.99/month and get upgraded to Pro.

### Account & Config
- [ ] Sign up at stripe.com — no KYC needed to test immediately
- [ ] Get API keys from Dashboard → Developers → API Keys
- [ ] Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `server/.env`
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` to `client/.env`
- [ ] Create a **Product** in Stripe Dashboard: "PrepMate Pro"
- [ ] Create a **Price** under that product: $4.99/month recurring

### Database
- [ ] Add `plan` column to User entity — `'free' | 'pro'`, default `'free'` (shared with Razorpay)
- [ ] Add `planExpiresAt` — timestamp, nullable
- [ ] Add `stripeCustomerId` — text, nullable
- [ ] Add `stripeSubscriptionId` — text, nullable
- [ ] Run migration (skip if already done for Razorpay)

### Backend
- [ ] Install `stripe` npm package on the server
- [ ] Install `@stripe/stripe-js` and `@stripe/react-stripe-js` on the client
- [ ] Generate payment module (or add to existing one)
- [ ] `POST /payment/stripe/create-checkout-session` — creates a Stripe Checkout Session with the monthly price ID, redirects user to Stripe-hosted page
- [ ] `POST /payment/stripe/webhook` — handles Stripe events (no JWT guard — Stripe signs this itself)
  - `checkout.session.completed` → set `plan = 'pro'`, `planExpiresAt = now + 30 days`, save `stripeCustomerId` and `stripeSubscriptionId`
  - `customer.subscription.deleted` → reset `plan = 'free'`, clear `planExpiresAt`
- [ ] Enable `rawBody: true` in `main.ts` — Stripe webhook verification requires the raw request body

### Plan Gating
- [ ] Same logic as Razorpay — check plan and expiry before allowing a session (can be shared)

### Frontend
- [ ] "Upgrade to Pro" button — calls `create-checkout-session`, redirects to Stripe's hosted checkout page
- [ ] After payment, Stripe redirects back to your `success_url` (e.g. `/dashboard?payment=success`)
- [ ] Read `payment=success` query param on dashboard to show a success toast

### Webhook Local Testing
- [ ] Install Stripe CLI
- [ ] Run `stripe listen --forward-to localhost:3000/payment/stripe/webhook`
- [ ] Copy the temporary webhook secret into `.env` as `STRIPE_WEBHOOK_SECRET`

### Test
- [ ] Use test card `4242 4242 4242 4242` / any future expiry / any CVV
- [ ] Confirm redirect back to dashboard after payment
- [ ] Confirm `plan`, `planExpiresAt`, `stripeCustomerId`, `stripeSubscriptionId` update in DB
- [ ] Simulate `customer.subscription.deleted` via Stripe CLI — confirm user is downgraded

---

## Phase 2 — Add Annual Plan

Goal: user can choose between monthly ($4.99) and annual ($53.99).

### Stripe Dashboard Setup
- [ ] Create a second **Price** under the same "PrepMate Pro" product: $53.99/year recurring
- [ ] Note both price IDs — monthly price ID and annual price ID

### Database
- [ ] Add `billingCycle` column to User entity — `'monthly' | 'annual'`, default `'monthly'`
- [ ] Run migration (skip if already done for Razorpay phase)

### Backend
- [ ] Update `create-checkout-session` to accept `plan: 'monthly' | 'annual'` in the request body
- [ ] Use the matching Stripe price ID based on the selected plan
- [ ] Update webhook handler: set `planExpiresAt = now + 30 days` for monthly, `now + 365 days` for annual
- [ ] Store `billingCycle` on user after successful webhook

### Frontend
- [ ] Add plan toggle — Monthly vs Annual with prices
- [ ] Show annual saving: *"Save ~$6 — 10% off"*
- [ ] Pass selected plan to `create-checkout-session` request

### Test
- [ ] Checkout with monthly — confirm expiry ~30 days, `billingCycle = 'monthly'`
- [ ] Checkout with annual — confirm expiry ~365 days, `billingCycle = 'annual'`

---

## Phase 3 — Coupon System

Goal: admin can create coupon codes in Stripe, users apply them at checkout.

> Stripe has a native coupon system — no custom DB entity needed unlike Razorpay.

### Stripe Dashboard Setup
- [ ] Go to Dashboard → Product Catalog → Coupons → Create coupon
- [ ] Create your launch coupons (e.g. `WELCOME20` — 20% off, `ANNUAL10` — 10% off annual)
- [ ] For each coupon, also create a **Promotion Code** — this is the user-facing code (e.g. `WELCOME20`)

### Backend
- [ ] Two options — pick one:
  - **Option A (simpler):** Add `allow_promotion_codes: true` to the Checkout Session — Stripe shows a promo code field on their hosted page, no backend coupon validation needed
  - **Option B (custom):** Accept `couponCode` in `create-checkout-session`, look up the Stripe coupon via API, and attach `discounts: [{ coupon: id }]` to the session
- [ ] Option A is recommended for v1 — Stripe handles validation, display, and tracking automatically

### Frontend (Option A)
- [ ] No changes needed — Stripe's hosted checkout page shows the promo code field automatically
- [ ] Optionally add a note on the upgrade screen: *"Have a coupon? Enter it on the next page"*

### Frontend (Option B — if custom)
- [ ] Add coupon input field before redirecting to Stripe
- [ ] Validate on backend, show discount preview, then redirect

### Test
- [ ] Create a test coupon in Stripe Dashboard
- [ ] Apply it during test checkout — confirm discounted amount is charged
- [ ] Check coupon redemption count updates in Stripe Dashboard

---

## API Endpoints (Final)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payment/stripe/create-checkout-session` | JWT | Redirects to Stripe hosted checkout — accepts `plan` |
| POST | `/payment/stripe/webhook` | Stripe signature | Handles subscription events |
| POST | `/payment/stripe/cancel` | JWT | Cancels active subscription |

---

## Going Live Checklist

- [ ] Identity verification completed on Stripe dashboard (required for payouts)
- [ ] Swap test keys for live keys in `.env`
- [ ] Register production webhook endpoint: Dashboard → Developers → Webhooks → Add Endpoint
  - URL: `https://your-backend.com/payment/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Copy production webhook signing secret to `.env`
- [ ] Backend on HTTPS
- [ ] End-to-end test with a real $1 payment
