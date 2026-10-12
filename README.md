# ArcTable

ArcTable is a table-ordering system for small shops and table-service venues with Arc USDC settlement.

Guests open a table-specific menu from a QR code, place one or more orders, and pay with Arc Mainnet USDC. The merchant can choose prepaid ordering or pay-after-served ordering for each store.

The project was built for Arc Microgrants as a practical store workflow rather than a generic wallet transfer demo.

## Why Arc

ArcTable uses Arc Mainnet as the settlement layer for table orders. In prepaid mode, the customer pays before the order is accepted by the store. In pay-after-served mode, the merchant first marks an order as served, the customer confirms receipt, and then the customer sends USDC on Arc to the merchant payout address. The app checks the Arc transaction receipt before updating the merchant dashboard to `PAID`.

This creates a practical flow for small shops:

1. Scan table QR.
2. Order from the phone.
3. Merchant serves the item.
4. Customer pays with Arc USDC before ordering or after service, depending on the store setting.
5. Merchant sees `PAID`.

## MVP Scope

- Table QR URLs: identify each table with URLs like `?store=main-store&table=1`
- Table URL settings: set the number of tables and generate one customer URL and QR code per table
- Guest view: show the table number, browse menu, place one or more orders with quantity, and pay with Arc USDC
- Guest order history: keep the guest's current browser order history visible
- Merchant view: receive table-numbered orders, mark `Served`, cancel orders, confirm `PAID`
- Sales closing: close paid sales, hide closed orders from the active order list, and review closed sales by date
- Storage: local JSON in development or Upstash Redis-compatible REST storage
- Payment: Arc Mainnet USDC transfer through the connected wallet
- Payment timing: merchant-selectable prepaid or pay-after-served flow for Arc USDC mode
- Transaction evidence: paid merchant orders and sales report details show the Arc transaction URL after payment
- Test checkout mode: wallet-free flow for demoing the store workflow
- Languages: English and Japanese UI toggle
- Help pages: concise customer guide, store setup guide, and merchant operations guide
- Merchant-editable store settings: payout address, payment timing, item name, description, photo URL, USDC price, stock count, and customer screen colors
- Stock handling: items can be marked `Sold Out` without removing them from the menu

## Demo Flow

1. Create a store workspace.
2. Save the private manager URL shown after store creation.
3. Open Settings and configure the payment mode and payment timing.
4. For Arc USDC mode, add the store payout address.
5. Add menu items, descriptions, photo URLs, USDC prices, and optional stock counts.
6. Open Table URL settings and generate table-specific customer URLs.
7. Use the displayed QR code for the matching table.
8. Open the merchant view on one device.
9. Open a table URL on a customer phone or browser tab.
10. Place one or more orders.
11. If using pay-after-served, mark the order as `Served`, then have the customer confirm receipt and pay with Arc USDC.
12. If multiple served orders are ready, the customer can select and pay them together.
13. If using prepaid, have the customer pay first; the merchant receives the order as `PAID`.
14. Confirm that the merchant dashboard updates the order to `PAID`.
15. Open or copy the transaction URL from the merchant order item.
16. Close paid sales and review the closed sales report by date.

## Payment Modes

ArcTable has two payment modes:

- `Test checkout`: no wallet is required. This mode is useful for rehearsing the table-ordering workflow. Orders become paid after the customer confirms receipt.
- `Arc USDC`: the customer pays on Arc Mainnet. A valid Arc-compatible payout address is required in store settings.

The hackathon submission focuses on the `Arc USDC` mode. `Test checkout` is included only as a demonstration aid.

Arc USDC stores can choose one of two payment timings:

- `Pay before order`: the customer connects a wallet and pays before the order is accepted. The merchant receives the order as `PAID`.
- `Pay after served`: the customer orders first, the merchant marks served items as served, and the customer pays after confirming receipt. Multiple served orders can be paid together.

## Merchant Operations

Merchants can:

- Save a private manager URL for returning to the store dashboard.
- Configure table URLs for table-specific QR codes.
- Edit menu item names, descriptions, photos, prices, and stock counts.
- Customize the customer table screen background and button color.
- Choose prepaid or pay-after-served timing for Arc USDC orders.
- Receive orders with table numbers.
- Mark orders as `Served`.
- Cancel unpaid orders if a guest requests cancellation or an item is unavailable.
- See `Sold Out` items remain visible but unavailable to order.
- Open the Arc transaction URL for paid orders.
- Close paid sales and move them out of the active order list.
- Review closed sales in a date-based sales report page with daily totals, item breakdowns, order details, and transaction evidence.

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
- The MVP does not include an account-level multi-store dashboard. Each store workspace is opened from its private manager URL.
- The private manager URL is the only way to return to a store dashboard. There is no login system in this MVP.
- Guest identity and guest-side order history are stored in the customer's own browser localStorage. This MVP assumes guests scan the QR with their own phone. If a shared table device is used, the browser state should be cleared between guests or replaced later with a visit/session-based table URL.
- Table identity comes from the table QR URL, such as `?table=1`, and is shown on the guest order screen and merchant order records.
- Stock counts are simple menu-level counts for the MVP. They are reduced when an order is placed and restored when the merchant cancels an unpaid order.

## Roadmap

- On-chain sales report anchoring: create a daily closing report hash and record only that hash on Arc. Merchants can keep detailed order data private while still having tamper-evident proof that the sales report existed at closing time.
- Store-local wallet warning history: record unpaid or abandoned wallet-connected orders within a store, show a warning marker on future visits, and escalate after repeated incidents. This is intentionally store-local rather than a global blacklist.

## Development Process

ArcTable was developed with the help of ChatGPT and Codex.

- ChatGPT was used for product concept discussion, MVP scoping, UX decisions, and hackathon positioning.
- Codex was used for codebase inspection, implementation, debugging, refactoring, build verification, and README updates.

The implementation evolved from an earlier store/festival-style ordering prototype into a focused Arc Mainnet table-ordering and USDC settlement app.

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
