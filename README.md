# Groceries Shopping Platform

Multi-tenant grocery storefront and admin on **Next.js 16**, **Convex**, **Clerk Organizations**, and **Stripe** (sandbox → Projects).

- One Clerk Organization = one store
- Shoppers use personal accounts (org membership optional)
- Platform **Plus** membership unlocks member pricing across stores
- Checkout is **per store** via Stripe Checkout Sessions + webhooks

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io)
- Clerk application with Organizations enabled (`membership optional`)
- Convex account
- Stripe CLI (for local webhooks) and a Stripe sandbox

## Quick start

```bash
pnpm install
pnpm run dev:backend   # terminal 1 — Convex watcher
pnpm run dev           # terminal 2 — Next.js
```

Optional local Stripe webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_…` into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Environment

Copy [`.env.example`](.env.example) → `.env.local` and fill values. **Never commit `.env.local`.**

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Next.js | Clerk |
| `CLERK_FRONTEND_API_URL` | Next.js + Convex | JWT issuer for Convex auth |
| `NEXT_PUBLIC_CONVEX_URL` / `CONVEX_DEPLOYMENT` | Next.js / CLI | Convex deployment |
| `NEXT_PUBLIC_APP_URL` | Next.js | App origin (webhooks success URLs) |
| `APP_BASE_URL` | Convex | Same origin for Stripe redirect URLs |
| `STRIPE_SECRET_KEY` | Next.js + Convex | Stripe API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Next.js | Stripe.js (if needed) |
| `STRIPE_WEBHOOK_SECRET` | Next.js | Verify Stripe signatures |
| `STRIPE_WEBHOOK_BRIDGE_SECRET` | Next.js + Convex | Shared secret for Next → Convex webhook bridge |
| `STRIPE_MEMBERSHIP_PRICE_ID` | Convex (+ optional local) | Platform Plus recurring Price id |

Set Convex-only vars with:

```bash
npx convex env set KEY value
```

Clerk JWT template for Convex must include `aud` matching Convex and org claims (`org_id`, `org_role`) used by admin routes.

## Local smoke checklist

1. Create a Clerk Organization and open `/admin` → **Create store record**
2. Click **Seed demo catalog** (admin only)
3. Browse `/` → store slug → add to cart / favorites
4. Pay with Stripe Checkout (card `4242…`); keep `stripe listen` running
5. Confirm order moves to **paid** under `/orders` and Admin → Orders
6. Subscribe on `/membership` (Plus); confirm member prices on catalog

```bash
pnpm run lint
pnpm test
```

## Seed data

`seed.seedDemoCatalog` inserts Produce / Dairy / Pantry demo products (with member prices + inventory) for the **active org**. Skips if products already exist unless `force: true`.

## Stripe: sandbox → Projects

This app is key-driven. Migrating off the temporary sandbox does **not** require code changes:

1. Claim or create a durable Stripe account / [Stripe Project](https://docs.stripe.com/projects)
2. Replace `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local` and Convex
3. Recreate (or migrate) the Plus **Price** and set `STRIPE_MEMBERSHIP_PRICE_ID`
4. Point production webhooks at `https://<your-domain>/api/stripe/webhook` and update `STRIPE_WEBHOOK_SECRET`
5. Keep `STRIPE_WEBHOOK_BRIDGE_SECRET` as a long random shared secret (rotate if leaked)
6. Ensure Billing Portal is configured in the new account (Manage billing on `/membership`)

Variable **names** stay the same whether keys come from a sandbox or Projects sync into `.env.local`.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm run dev` | Next.js app |
| `pnpm run dev:backend` | `convex dev` |
| `pnpm run lint` | Biome check |
| `pnpm test` | Vitest (Convex lib unit tests) |
| `pnpm run build` | Production Next.js build |

## Out of scope (v1)

- Stripe Connect / per-store payouts
- Per-store paid memberships
- Delivery logistics
