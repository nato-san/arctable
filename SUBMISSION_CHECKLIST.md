# ArcTable Submission Checklist

Use this checklist for the Arc Microgrants submission.

## 1. Repository

- [x] Public GitHub repository: `https://github.com/nato-san/arctable`
- [x] README explains the product, Arc usage, demo flow, environment variables, and limitations.
- [x] Build passes with `npm run build`.
- [x] Lint passes with `npm run lint`.

## 2. Production Deployment

- [ ] Deploy the GitHub repository to Vercel.
- [ ] Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
- [ ] Set production shared storage with Upstash Redis:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- [ ] Open the deployed URL and create a store workspace.
- [ ] Confirm that a table order URL works in a second browser or phone.

## 3. Arc Mainnet Payment Test

- [ ] Set a valid store-level Arc USDC payout address in Settings.
- [ ] Open the customer table URL.
- [ ] Place an order.
- [ ] Mark the order as `Served` in the merchant view.
- [ ] Confirm receipt in the customer view.
- [ ] Pay with Arc USDC from the wallet.
- [ ] Confirm the merchant view updates to `PAID`.
- [ ] Save the Arc Explorer transaction URL for the submission or demo notes.

## 4. Submission Fields

Suggested short description:

```text
ArcTable is a table-ordering system for restaurants where guests order from a table QR code and pay with USDC on Arc only after the order is served.
```

Suggested longer description:

```text
ArcTable brings Arc USDC settlement into a real restaurant ordering flow. Guests scan a table QR code, order from a phone, and pay on Arc only after the merchant marks the order as served and the guest confirms receipt. The merchant dashboard receives table-numbered orders and updates to PAID after the Arc transaction is verified.
```

Submit:

- Live deployment URL
- Public GitHub repository URL
- Builder profile
- GitHub / X / Farcaster profile
- Arc USDC payout wallet
- Optional Arc Explorer transaction URL from the payment test

## 5. Out of Scope for MVP

Do not add these before submission unless the core demo is already complete:

- Reservations
- Inventory management
- Coupons
- NFTs
- Points
- User accounts
- Reviews
- Multi-store management
- Advanced analytics
