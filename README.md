# ArcTable

ArcTable is a table-ordering system for restaurants with per-order Arc USDC settlement.

Guests open a table-specific menu from a QR code, place an order, and confirm receipt after the item is served. The merchant dashboard receives table-numbered orders, marks them as served, and sees the order update to `PAID` after the guest completes an Arc Mainnet USDC payment.

## Why Arc

ArcTable uses Arc Mainnet as the settlement layer for restaurant orders. The customer does not pay at menu selection time. Instead, the merchant first marks an order as served, the customer confirms receipt, and then the customer sends USDC on Arc to the merchant payout address. The app checks the Arc transaction receipt before updating the merchant dashboard to `PAID`.

This creates a practical flow for small restaurants:

1. Scan table QR.
2. Order from the phone.
3. Merchant serves the item.
4. Customer confirms receipt.
5. Customer pays with Arc USDC.
6. Merchant sees `PAID`.

## MVP Scope

- Table QR URLs: identify each table with URLs like `?store=main-store&table=1`
- Guest view: show the table number, browse menu, place order, confirm receipt, pay with Arc USDC
- Merchant view: receive table-numbered orders, mark `Served`, confirm `PAID`
- Storage: local JSON in development or Upstash Redis-compatible REST storage
- Payment: Arc Mainnet native USDC transfer
- Languages: English and Japanese UI toggle
- Merchant-editable store settings: payout address, item name, description, photo URL, and USDC price

## Demo Flow

1. Create a store workspace.
2. Open Settings and add the store payout address, menu items, descriptions, photo URLs, and prices.
3. Open the merchant view and copy the table order URL.
4. Open the table order URL on a customer phone or browser tab.
5. Place an order.
6. In the merchant view, mark the order as `Served`.
7. In the customer view, confirm receipt and pay with Arc USDC.
8. Confirm that the merchant dashboard updates the order to `PAID`.

## Environment Variables

WalletConnect / Reown AppKit:

```text
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

Shared storage for production deployments:

```text
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

The app also accepts Vercel KV-style aliases such as `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

## Out of Scope

Reservations, inventory, coupons, NFTs, points, user accounts, reviews, multi-store management, and advanced analytics are intentionally excluded from this MVP.

## Known Limitations

- Menu photos are stored as external image URLs rather than uploaded image files.
- Local development uses JSON files in `data/stores`. Production should use Redis-compatible storage.
- The MVP is designed for a single restaurant workspace per shared `store` ID.
- Guest identity and guest-side order history are stored in the customer's own browser localStorage. This MVP assumes guests scan the QR with their own phone. If a shared table device is used, the browser state should be cleared between guests or replaced later with a visit/session-based table URL.
- Table identity comes from the table QR URL, such as `?table=1`, and is shown on the guest order screen and merchant order records.

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
