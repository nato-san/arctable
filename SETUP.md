# ArcTable Setup

ArcTable is a table-ordering MVP for restaurants with Arc Mainnet USDC payment.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- Shared API route
- viem
- wagmi
- Reown AppKit / WalletConnect
- Arc Mainnet

## Run Locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

For the same Mac:

```text
http://127.0.0.1:3000
```

For phone testing, open the app from the Mac's local network address while both devices are on the same Wi-Fi.

## Shared Store Data

The shared API lives at `src/app/api/store`. The current MVP uses the `store` ID as the shared restaurant workspace ID.

```text
https://example.vercel.app/?store=main-store&table=1
```

Devices that open the same `store` ID participate in the same restaurant workspace. The `table` value is saved as the table number for customer orders.

Local file storage:

```text
data/stores/{storeId}.json
```

For Vercel deployments, the API also supports Upstash Redis environment variables.

## Production Environment

Wallet connection:

```text
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

Shared order storage:

```text
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

Vercel KV-compatible aliases are also supported:

```text
KV_REST_API_URL=your_kv_rest_url
KV_REST_API_TOKEN=your_kv_rest_token
```

## Arc Mainnet

- Chain ID: `5042`
- RPC URL: `https://rpc.mainnet.arc.io`
- Currency: `USDC`
- Explorer: `https://explorer.arc.io`

In the MVP, the guest pays only after the merchant marks the order as served and the guest confirms receipt. The server checks the transaction receipt, sender, recipient, and value before marking the order as `PAID`.

## Checks

```bash
npm run lint
npm run build
```
