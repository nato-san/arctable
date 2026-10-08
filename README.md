# ArcTable

ArcTable is a table-ordering system for restaurants with per-order Arc USDC settlement.

Guests open a table-specific menu from a QR code, place an order, and confirm receipt after the item is served. The merchant dashboard receives table-numbered orders, marks them as served, and sees the order update to `PAID` after the guest completes an Arc Mainnet USDC payment.

## MVP Scope

- Table QR URLs: identify each table with URLs like `?store=main-store&table=1`
- Guest view: browse menu, place order, confirm receipt, pay with Arc USDC
- Merchant view: receive table-numbered orders, mark `Served`, confirm `PAID`
- Storage: local JSON in development or Upstash Redis-compatible REST storage
- Payment: Arc Mainnet native USDC transfer
- Languages: English and Japanese UI toggle

## Out of Scope

Reservations, inventory, coupons, NFTs, points, user accounts, reviews, multi-store management, and advanced analytics are intentionally excluded from this MVP.

## Development

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open:

```text
http://localhost:3000
```

Verify:

```bash
npm run lint
npm run build
```
