# ArcTable

ArcTable is a table-ordering system for restaurants with per-order Arc USDC settlement.

Guests open a table-specific menu from a QR code, place an order, and confirm receipt after the item is served. The merchant dashboard receives table-numbered orders, marks them as served, and sees the order update to `PAID` after the guest completes an Arc Mainnet USDC payment.

The project was built for Arc Microgrants as a practical restaurant workflow rather than a generic wallet transfer demo.

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
- Table URL settings: set the number of tables and generate one customer URL per table
- Guest view: show the table number, browse menu, place order with quantity, confirm receipt, pay with Arc USDC
- Guest order history: keep the guest's current browser order history visible
- Merchant view: receive table-numbered orders, mark `Served`, cancel orders, confirm `PAID`
- Storage: local JSON in development or Upstash Redis-compatible REST storage
- Payment: Arc Mainnet USDC transfer through the connected wallet
- Transaction evidence: merchant orders show the Arc transaction URL after payment
- Test checkout mode: wallet-free flow for demoing the restaurant workflow
- Languages: English and Japanese UI toggle
- Merchant-editable store settings: payout address, item name, description, photo URL, USDC price, and stock count
- Stock handling: items can be marked `Sold Out` without removing them from the menu

## Demo Flow

1. Create a store workspace.
2. Save the private manager URL shown after store creation.
3. Open Settings and configure the payment mode.
4. For Arc USDC mode, add the store payout address.
5. Add menu items, descriptions, photo URLs, USDC prices, and optional stock counts.
6. Open Table URL settings and generate table-specific customer URLs.
7. Put each table URL into a QR code for the matching table.
8. Open the merchant view on one device.
9. Open a table URL on a customer phone or browser tab.
10. Place an order.
11. In the merchant view, mark the order as `Served`.
12. In the customer view, confirm receipt and pay with Arc USDC.
13. Confirm that the merchant dashboard updates the order to `PAID`.
14. Open or copy the transaction URL from the merchant order item.

## Payment Modes

ArcTable has two payment modes:

- `Test checkout`: no wallet is required. This mode is useful for rehearsing the table-ordering workflow. Orders become paid after the customer confirms receipt.
- `Arc USDC`: the customer pays on Arc Mainnet after the merchant marks the order as served. A valid Arc-compatible payout address is required in store settings.

The hackathon submission focuses on the `Arc USDC` mode. `Test checkout` is included only as a demonstration aid.

## Merchant Operations

Merchants can:

- Save a private manager URL for returning to the store dashboard.
- Configure table URLs for table-specific QR codes.
- Edit menu item names, descriptions, photos, prices, and stock counts.
- Receive orders with table numbers.
- Mark orders as `Served`.
- Cancel unpaid orders if a guest requests cancellation or an item is unavailable.
- See `Sold Out` items remain visible but unavailable to order.
- Open the Arc transaction URL for paid orders.

## Storage Diagnostics

Production deployments should use Upstash Redis-compatible REST storage. After setting environment variables and redeploying, this endpoint can be used to verify the shared storage connection:

```text
https://your-domain.example/api/store?diagnostics=1
```

A healthy Upstash connection returns:

```json
{"ok":true,"mode":"upstash-redis","redisConfigured":true,"result":"PONG"}
```

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

Reservations, coupons, NFTs, points, user accounts, reviews, multi-store management, advanced analytics, and file uploads for menu photos are intentionally excluded from this MVP.

## Known Limitations

- Menu photos are stored as external image URLs rather than uploaded image files.
- Local development uses JSON files in `data/stores`. Production should use Redis-compatible storage.
- The MVP is designed for a single restaurant workspace per shared `store` ID.
- The private manager URL is the only way to return to a store dashboard. There is no login system in this MVP.
- Guest identity and guest-side order history are stored in the customer's own browser localStorage. This MVP assumes guests scan the QR with their own phone. If a shared table device is used, the browser state should be cleared between guests or replaced later with a visit/session-based table URL.
- Table identity comes from the table QR URL, such as `?table=1`, and is shown on the guest order screen and merchant order records.
- Stock counts are simple menu-level counts for the MVP. They are reduced when an order is placed and restored when the merchant cancels an unpaid order.

## Development Process

ArcTable was developed with the help of ChatGPT and Codex.

- ChatGPT was used for product concept discussion, MVP scoping, UX decisions, and hackathon positioning.
- Codex was used for codebase inspection, implementation, debugging, refactoring, build verification, and README updates.

The implementation evolved from an earlier restaurant/festival-style ordering prototype into a focused Arc Mainnet table-ordering and USDC settlement app.

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
