# ArcTable

ArcTable is a table-ordering system for small shops and table-service venues with Arc USDC settlement.

Guests open a table-specific menu from a QR code, place one or more orders, and pay with Arc Mainnet USDC. The merchant can choose prepaid ordering or pay-after-served ordering for each store.

The project is designed as a practical store workflow rather than a simple wallet transfer tool.

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
- Test checkout mode: wallet-free flow for testing the store workflow
- Languages: English and Japanese UI toggle
- Help pages: concise customer guide, store setup guide, and merchant operations guide
- Merchant-editable store settings: payout address, payment timing, item name, description, photo URL, USDC price, stock count, and customer screen colors
- Stock handling: items can be marked `Sold Out` without removing them from the menu

## Basic Store Workflow

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

- `Test checkout`: no wallet is required. This mode is useful for testing the table-ordering workflow before using live payments. Orders become paid after the customer confirms receipt.
- `Arc USDC`: the customer pays on Arc Mainnet. A valid Arc-compatible payout address is required in store settings.

For real payment flows, use `Arc USDC` mode. `Test checkout` is included for setup checks and operational testing.

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

- ChatGPT was used for product concept discussion, MVP scoping, UX decisions, and Arc Microgrants positioning.
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

---

# ArcTable（日本語）

ArcTableは、小さなお店やテーブル接客のある店舗向けの、Arc USDC決済対応テーブルオーダーシステムです。

お客様はテーブルごとのQRコードからメニューを開き、1つまたは複数の商品を注文し、Arc Mainnet USDCで支払います。店舗は、店舗ごとに事前会計または提供後会計を選択できます。

このプロジェクトは、単なるウォレット送金ツールではなく、実際の店舗業務に近いワークフローとして設計しています。

## Arcを使う理由

ArcTableは、テーブル注文の決済レイヤーとしてArc Mainnetを使用します。事前会計では、お客様が支払ってから注文が店舗に入ります。提供後会計では、店舗が注文を提供済みにし、お客様が受け取りを確認した後、Arc上で店舗の受取アドレスへUSDCを送金します。アプリはArcの取引レシートを確認してから、店舗画面の注文を`PAID`に更新します。

これにより、小さなお店でも次の流れを実現できます。

1. テーブルQRを読み取る。
2. スマートフォンから注文する。
3. 店舗が商品を提供する。
4. 店舗設定に応じて、注文前または提供後にArc USDCで支払う。
5. 店舗側で`PAID`を確認する。

## MVP範囲

- テーブルQR URL: `?store=main-store&table=1`のようなURLで各テーブルを識別
- テーブルURL設定: テーブル数を設定し、テーブルごとの注文URLとQRコードを生成
- お客様画面: テーブル番号の表示、メニュー閲覧、数量付き注文、Arc USDC支払い
- お客様の注文履歴: 現在のブラウザ内で注文履歴を表示
- 店舗画面: テーブル番号付き注文の受信、`Served`への変更、キャンセル、`PAID`確認
- 売上締め: 支払済み売上を締め、締め済み注文を通常注文一覧から外し、日付別に確認
- ストレージ: 開発環境ではローカルJSON、本番ではUpstash Redis互換RESTストレージ
- 決済: 接続ウォレットからArc Mainnet USDCを送金
- 支払いタイミング: Arc USDCモードで、店舗が事前会計または提供後会計を選択
- 取引証跡: 支払済み注文と売上レポート詳細にArcの取引URLを表示
- テスト会計モード: ウォレットなしで店舗フローを確認可能
- 言語: 英語と日本語のUI切り替え
- 使い方ページ: お客様向け、店舗設定、受注・売上の簡潔なガイド
- 店舗編集項目: 受取アドレス、支払いタイミング、商品名、説明、写真URL、USDC価格、在庫数、お客様画面の色
- 在庫管理: 商品を削除せずに`Sold Out`として表示し、注文不可にできる

## 基本的な店舗ワークフロー

1. 店舗ワークスペースを作成する。
2. 作成後に表示される管理用URLを保存する。
3. 設定画面を開き、支払いモードと支払いタイミングを設定する。
4. Arc USDCモードでは、店舗の受取アドレスを入力する。
5. 商品名、説明、写真URL、USDC価格、任意の在庫数を設定する。
6. テーブルURL設定を開き、テーブルごとのお客様用URLを生成する。
7. 表示されたQRコードを対応するテーブルで使用する。
8. 店舗画面を1つの端末で開く。
9. お客様用スマートフォンまたは別ブラウザタブでテーブルURLを開く。
10. 1つまたは複数の商品を注文する。
11. 提供後会計の場合、店舗が注文を`Served`にし、お客様が受け取り確認後にArc USDCで支払う。
12. 複数の提供済み注文がある場合、お客様は選択してまとめて支払うことができる。
13. 事前会計の場合、お客様が先に支払い、店舗には`PAID`として注文が入る。
14. 店舗画面で注文が`PAID`に更新されることを確認する。
15. 店舗側の注文項目から取引URLを開く、またはコピーする。
16. 支払済み売上を締め、日付別の売上レポートを確認する。

## 支払いモード

ArcTableには2つの支払いモードがあります。

- `Test checkout`: ウォレット不要のモードです。実決済を使う前に、テーブルオーダーの流れを確認するために使えます。お客様が受け取り確認をすると支払済みになります。
- `Arc USDC`: お客様がArc Mainnet上で支払います。店舗設定にArc対応の受取アドレスが必要です。

実際の支払いフローでは`Arc USDC`モードを使用します。`Test checkout`は設定確認や運用テスト用です。

Arc USDCの店舗は、2つの支払いタイミングを選択できます。

- `Pay before order`: お客様がウォレットを接続し、注文が店舗に入る前に支払います。店舗には`PAID`として注文が入ります。
- `Pay after served`: お客様が先に注文し、店舗が提供済みにした後、お客様が受け取りを確認して支払います。複数の提供済み注文をまとめて支払うこともできます。

## 店舗操作

店舗側では次の操作ができます。

- 店舗ダッシュボードへ戻るための管理用URLを保存する。
- テーブル別QRコード用のテーブルURLを設定する。
- 商品名、説明、写真、価格、在庫数を編集する。
- お客様が見るテーブル画面の背景色とボタン色をカスタマイズする。
- Arc USDC注文の事前会計または提供後会計を選択する。
- テーブル番号付きの注文を受け取る。
- 注文を`Served`にする。
- お客様からのキャンセル依頼や在庫切れ時に、未払い注文をキャンセルする。
- `Sold Out`の商品をメニューに表示したまま注文不可にする。
- 支払済み注文のArc取引URLを開く。
- 支払済み売上を締め、通常の注文一覧から移動する。
- 日付別売上レポートで、日別合計、商品別内訳、注文詳細、取引証跡を確認する。

## ストレージ診断

本番デプロイではUpstash Redis互換RESTストレージを使用してください。環境変数を設定して再デプロイした後、次のエンドポイントで共有ストレージ接続を確認できます。

```text
https://your-domain.example/api/store?diagnostics=1
```

正常なUpstash接続では次のように返ります。

```json
{"ok":true,"mode":"upstash-redis","redisConfigured":true,"result":"PONG"}
```

## 環境変数

WalletConnect / Reown AppKit:

```text
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

本番環境の共有ストレージ:

```text
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

このアプリは、`KV_REST_API_URL`や`KV_REST_API_TOKEN`などのVercel KV形式の別名にも対応しています。

## 対象外

予約、クーポン、NFT、ポイント、ユーザーアカウント、レビュー、複数店舗管理、高度な分析、メニュー写真のファイルアップロードは、このMVPでは意図的に対象外にしています。

## 既知の制限

- メニュー写真はファイルアップロードではなく、外部画像URLとして保存します。
- ローカル開発では`data/stores`内のJSONファイルを使用します。本番ではRedis互換ストレージを使用してください。
- MVPにはアカウント単位の複数店舗ダッシュボードはありません。各店舗ワークスペースは管理用URLから開きます。
- 管理用URLが店舗ダッシュボードへ戻る唯一の方法です。このMVPにはログイン機能はありません。
- お客様の識別情報とお客様側の注文履歴は、お客様自身のブラウザlocalStorageに保存されます。このMVPでは、お客様が自分のスマートフォンでQRを読み取る想定です。共有テーブル端末を使う場合は、来客ごとにブラウザ状態を消去するか、将来的に来店セッション型のテーブルURLへ置き換える必要があります。
- テーブルIDは`?table=1`のようなテーブルQR URLから取得し、お客様の注文画面と店舗側の注文記録に表示されます。
- 在庫数はMVP向けのシンプルな商品単位の在庫です。注文時に減り、店舗が未払い注文をキャンセルした場合に戻ります。

## ロードマップ

- On-chain sales report anchoring: 日次締めレポートのハッシュだけをArc上に記録する機能。店舗は詳細な注文データを非公開のまま保持しつつ、締め時点でその売上レポートが存在していたことを改ざん耐性のある形で証明できます。
- Store-local wallet warning history: 未払いまたは放置されたウォレット接続注文を店舗内で記録し、次回来店時に警告マークを表示し、繰り返しがある場合に段階的に強める機能。グローバルなブラックリストではなく、店舗単位の履歴として扱います。

## 開発プロセス

ArcTableはChatGPTとCodexの支援を受けて開発しました。

- ChatGPTは、プロダクトコンセプト、MVP範囲、UX判断、Arc Microgrants向けの位置付けに使用しました。
- Codexは、コードベース調査、実装、デバッグ、リファクタリング、ビルド検証、README更新に使用しました。

この実装は、以前の店舗・イベント向け注文プロトタイプから、Arc MainnetのテーブルオーダーとUSDC決済に特化したアプリへ発展しました。

## 開発

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

開くURL:

```text
http://localhost:3000
```

確認:

```bash
npm run lint
npm run build
```
