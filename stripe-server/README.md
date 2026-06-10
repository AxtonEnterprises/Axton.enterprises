# Axton Enterprises Stripe Integration

This implementation creates Stripe Products/Prices, starts a Stripe Checkout Session, records legal agreement metadata, and handles `checkout.session.completed` webhooks.

## What this does

- Creates four plans: Starter, Growth, Professional, Commerce.
- Creates one recurring monthly Price and one one-time setup Price for each plan.
- Creates Checkout Sessions in `subscription` mode with both prices in one checkout.
- Enables Managed Payments using `managed_payments[enabled]=true` and the Stripe preview header from the blueprint.
- Stores the selected plan, customer details, business name, project description, and agreement acceptance in Checkout metadata.
- Listens for `checkout.session.completed` and appends a record to `stripe-checkout-events.jsonl`.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Add your keys from the Stripe Dashboard:

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
BASE_URL=http://localhost:4242
PORT=4242
```

Do not commit `.env` to GitHub.

4. Create the Stripe Products and Prices:

```bash
npm run create:stripe-products
```

This creates `stripe-resource-ids.json`. In production, store those IDs in your database or environment variables.

5. Start the server:

```bash
npm start
```

6. Open:

```text
http://localhost:4242/checkout.html
```

## Webhook testing

Use the Stripe CLI:

```bash
stripe listen --forward-to localhost:4242/webhook
```

Copy the webhook signing secret into `.env` as `STRIPE_WEBHOOK_SECRET`.

## Production notes

GitHub Pages cannot run this backend because it requires `STRIPE_SECRET_KEY`. Deploy the backend to Cloudflare Workers, Render, Railway, Fly.io, or another server environment. Keep the static frontend on GitHub Pages if desired, but `/create-checkout-session` must point to your backend URL.

## Important legal note

The legal agreement included in the checkout page is a starter template. Have an attorney review it before relying on it for real customers.
