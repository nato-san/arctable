"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import Image from "next/image";
import { formatEther, parseEther, type Address } from "viem";
import { useAppKit } from "@reown/appkit/react";
import { sendTransaction, switchChain } from "wagmi/actions";
import { useAccount, useBalance } from "wagmi";
import type { Customer, CustomerTheme, StoreResponse, StoreState, PaymentMode, PaymentRecord, Shop, ShopStats } from "@/lib/store-types";
import { ARC_MAINNET_CHAIN_ID, ARC_MAINNET_EXPLORER_URL } from "@/lib/arc-mainnet-config";
import { wagmiAdapter } from "./providers";

type Screen = "home" | "customer" | "merchant" | "settings" | "tables" | "customer-help" | "settings-help" | "merchant-help";
type Lang = "en" | "ja";

const copy = {
  en: {
    back: "Back",
    settings: "Settings",
    tables: "Tables",
    createTitle: "Set up table ordering with Arc payments",
    createDemo: "Create Store",
    setupTitle: "Setup",
    setupStep1: "1. Create a store workspace",
    setupStep2: "2. Configure menu items and payout wallet",
    setupStep3: "3. Use table-specific QR URLs",
    storeId: "Store ID",
    customerView: "Customer View",
    merchantView: "Merchant View",
    settlementToken: "Settlement token",
    payAfterServed: "Pay with Arc USDC after service",
    demoMode: "Test checkout",
    customerNotice: "Payment is requested after the order is served.",
    walletTitle: "USDC wallet",
    connectWallet: "Connect wallet",
    connectedWallet: "Connected wallet",
    receivedPay: "Received / Pay",
    paidSynced: "PAID. The merchant dashboard has been updated.",
    orderSubmitted: "Order submitted",
    orderComplete: "Payment complete",
    thankYou: "Thank you.",
    orderId: "Order ID",
    preparing: "Store setup required",
    ordering: "Ordering",
    order: "Order",
    tableOrderUrl: "Table Order URL",
    tableUrls: "Table URLs",
    tableUrlSettings: "Table URL settings",
    howToUse: "How to use",
    customerHelp: "Customer guide",
    settingsHelp: "Setup guide",
    merchantHelp: "Orders & sales guide",
    customerTheme: "Table screen theme",
    customerBackgroundColor: "Background color",
    customerButtonColor: "Button color",
    customerThemeHelp: "This changes the customer table order screen. Use colors with clear contrast.",
    tableCount: "Number of tables",
    tableCountHelp: "Generate one customer order URL for each table. Put each URL into a QR code and place it on the table.",
    qrCode: "QR code",
    scanQr: "Scan to open this table order screen.",
    copyTableUrl: "Copy table URL",
    copied: "Copied",
    transactionUrl: "Transaction URL",
    copyTransactionUrl: "Copy transaction URL",
    cancelOrder: "Cancel order",
    soldOut: "Sold Out",
    managerUrl: "Private Manager URL",
    copiedUrl: "Copy URL",
    copiedManagerUrl: "Copy manager URL",
    saveManagerUrlTitle: "Save this private manager URL",
    saveManagerUrlWarning:
      "This app does not use accounts. If you lose this URL, you cannot return to this store dashboard.",
    adminLocked: "Private manager URL is required to open this store dashboard.",
    returnStore: "Return to saved store",
    newStore: "New Store",
    store: "STORE",
    todaySales: "TODAY SALES",
    count: "COUNT",
    network: "NETWORK",
    receive: "RECEIVE",
    notSet: "Not set",
    setRecipient: "Set a payout wallet before enabling on-chain orders.",
    noOrders: "No orders yet",
    orderHistory: "Order history",
    storeName: "Store name",
    paymentMode: "Payment mode",
    selected: "Selected",
    arcModeHelp: "With Arc USDC, the customer pays from their wallet on Arc Mainnet after the order is served.",
    demoModeHelp: "Use this mode for demos without wallets. Orders become paid after the customer confirms receipt.",
    menu: "Menu",
    emoji: "Icon",
    itemName: "Item name",
    description: "Description",
    photoUrl: "Photo URL",
    tokenPrice: "USDC price",
    stock: "Stock",
    stockHelp: "Leave blank for unlimited stock. Set 0 to show Sold Out.",
    buttonText: "Button text",
    recipient: "Arc USDC payout address",
    recipientRequired: "A payout address is required for Arc USDC.",
    delete: "Delete",
    addMenu: "+ Add menu item",
    save: "Save",
    saveHelp: "Changes appear on the merchant screen after saving.",
    saveBack: "Save and open merchant view",
    resetTitle: "Reset orders",
    resetHelp: "Keep menu settings, and clear orders and payment history.",
    resetOrders: "Reset orders and history",
    manageTitle: "Store workspace",
    manageHelp: "Return to the start screen to create another store workspace, or delete this one.",
    backTop: "Back to start",
    deleteDemo: "Delete this store",
    confirmOrderTitle: "Order with USDC?",
    quantity: "Quantity",
    orderedMessage: "Order submitted",
    payAfterServedNote: "Payment is made with Arc USDC after the item is served.",
    cancel: "Cancel",
    readying: "Preparing",
    yen: "JPY",
    loading: "Loading shared store data",
    loadFailed: "Could not connect to shared store data",
    sendingOrder: "Sending order to the store",
    orderFailed: "Could not place order",
    storeUnavailable: "Could not connect to the store",
    itemMissing: "Item not found",
    walletRequired: "Connect a USDC wallet first",
    recipientMissing: "The store payout address is missing",
    confirmServed: "Confirming receipt",
    confirmServedPay: "Confirming receipt and opening payment",
    notServed: "This order has not been marked served yet",
    walletConfirm: "Confirm payment in your wallet",
    arcConfirm: "Confirming payment on Arc",
    paymentFailed: "Could not verify payment",
    walletConnecting: "Connecting USDC wallet",
    walletFailed: "Could not connect wallet",
    updatingOrder: "Updating order status",
    updateFailed: "Could not update order status",
    cancelFailed: "Could not cancel order",
    recordFailed: "Could not record the update",
    saving: "Saving settings",
    saveFailed: "Could not save settings",
    resetting: "Resetting orders and history",
    resetFailed: "Could not reset",
    deleteConfirm: "Delete this store? Orders and sales records will also be deleted.",
    deleting: "Deleting store",
    deleteFailed: "Could not delete store",
    creating: "Creating a new store",
    statusCustomerConfirmed: "Receipt confirmed",
    statusRecorded: "Ordered",
    statusPendingWallet: "Wallet pending",
    statusSubmitted: "Submitted / confirming",
    statusCompleted: "Complete",
    statusRejected: "Cancelled",
    statusFailed: "Failed",
  },
  ja: {
    back: "戻る",
    settings: "設定",
    tables: "テーブル",
    createTitle: "Arc決済対応のテーブルオーダーを設定",
    createDemo: "店舗を作成",
    setupTitle: "セットアップ",
    setupStep1: "1. 店舗ワークスペースを作成",
    setupStep2: "2. メニューと受取ウォレットを設定",
    setupStep3: "3. テーブル別QR URLを利用",
    storeId: "店舗ID",
    customerView: "注文画面",
    merchantView: "店舗画面",
    settlementToken: "決済トークン",
    payAfterServed: "提供後にArc USDCで支払い",
    demoMode: "テスト会計",
    customerNotice: "商品提供後に会計します。",
    walletTitle: "USDCウォレット",
    connectWallet: "ウォレット接続",
    connectedWallet: "接続中のウォレット",
    receivedPay: "受け取り確認 / 支払いへ",
    paidSynced: "PAID。店舗画面にも反映されています。",
    orderSubmitted: "注文を送信しました",
    orderComplete: "支払い完了",
    thankYou: "ありがとうございました。",
    orderId: "注文ID",
    preparing: "店舗側の準備が必要です",
    ordering: "注文中",
    order: "注文する",
    tableOrderUrl: "テーブル注文URL",
    tableUrls: "テーブルURL",
    tableUrlSettings: "テーブルURL設定",
    howToUse: "使い方",
    customerHelp: "お客様向け",
    settingsHelp: "設定方法",
    merchantHelp: "受注・売上",
    customerTheme: "テーブル画面テーマ",
    customerBackgroundColor: "背景色",
    customerButtonColor: "ボタン色",
    customerThemeHelp: "お客様が見るテーブル注文画面に反映されます。見やすい色を選んでください。",
    tableCount: "テーブル数",
    tableCountHelp: "テーブルごとの注文URLを作成します。各URLをQRコードにして、対応するテーブルに置いてください。",
    qrCode: "QRコード",
    scanQr: "読み取ると、このテーブルの注文画面が開きます。",
    copyTableUrl: "テーブルURLをコピー",
    copied: "コピーしました",
    transactionUrl: "取引URL",
    copyTransactionUrl: "取引URLをコピー",
    cancelOrder: "キャンセル",
    soldOut: "Sold Out",
    managerUrl: "管理用URL",
    copiedUrl: "URLをコピー",
    copiedManagerUrl: "管理用URLをコピー",
    saveManagerUrlTitle: "この管理用URLを保存してください",
    saveManagerUrlWarning:
      "ログイン機能はないため、このURLを紛失すると店舗管理画面に戻れません。必ず安全な場所に保存してください。",
    adminLocked: "この店舗の管理画面を開くには管理用URLが必要です。",
    returnStore: "保存済み店舗に戻る",
    newStore: "新しい店舗",
    store: "店舗",
    todaySales: "本日の売上",
    count: "件数",
    network: "ネットワーク",
    receive: "受取先",
    notSet: "未設定",
    setRecipient: "オンチェーン注文を有効にする前に受取ウォレットを設定してください。",
    noOrders: "まだ注文はありません",
    orderHistory: "注文履歴",
    storeName: "店舗名",
    paymentMode: "支払いモード",
    selected: "選択中",
    arcModeHelp: "Arc USDCでは、商品提供後にお客様のウォレットからArc Mainnetで支払います。",
    demoModeHelp: "ウォレットを使わないデモ用です。お客様が受け取り確認をすると支払済みになります。",
    menu: "メニュー",
    emoji: "アイコン",
    itemName: "商品名",
    description: "説明",
    photoUrl: "写真URL",
    tokenPrice: "USDC価格",
    stock: "在庫数",
    stockHelp: "空欄なら在庫制限なし。0にするとSold Out表示になります。",
    buttonText: "ボタン文言",
    recipient: "Arc USDC受取アドレス",
    recipientRequired: "Arc USDCで使うには受取アドレスが必要です。",
    delete: "削除",
    addMenu: "+ メニューを追加",
    save: "保存",
    saveHelp: "保存後に店舗画面へ反映されます。",
    saveBack: "保存して店舗画面へ",
    resetTitle: "注文リセット",
    resetHelp: "メニュー設定を残し、注文と決済履歴を削除します。",
    resetOrders: "注文と履歴をリセット",
    manageTitle: "店舗ワークスペース",
    manageHelp: "開始画面へ戻って別の店舗を作成するか、この店舗を削除できます。",
    backTop: "開始画面へ戻る",
    deleteDemo: "この店舗を削除",
    confirmOrderTitle: "USDCで注文しますか？",
    quantity: "数量",
    orderedMessage: "注文しました",
    payAfterServedNote: "支払いは商品提供後にArc USDCで行います。",
    cancel: "キャンセル",
    readying: "準備中",
    yen: "円",
    loading: "共有データを読み込み中",
    loadFailed: "共有データに接続できません",
    sendingOrder: "注文を店舗へ送信中",
    orderFailed: "注文できませんでした",
    storeUnavailable: "店舗に接続できません",
    itemMissing: "商品が見つかりません",
    walletRequired: "先にUSDCウォレットを接続してください",
    recipientMissing: "店舗の受取アドレスがありません",
    confirmServed: "受取を確認中",
    confirmServedPay: "受取を確認して支払いへ進みます",
    notServed: "まだ提供済みではありません",
    walletConfirm: "ウォレットで支払いを確認してください",
    arcConfirm: "Arcで支払いを確認中",
    paymentFailed: "支払いを確認できませんでした",
    walletConnecting: "USDCウォレットに接続中",
    walletFailed: "ウォレットに接続できませんでした",
    updatingOrder: "注文状態を更新中",
    updateFailed: "注文状態を更新できません",
    cancelFailed: "注文をキャンセルできませんでした",
    recordFailed: "記録できませんでした",
    saving: "設定を保存中",
    saveFailed: "設定を保存できません",
    resetting: "注文と履歴をリセット中",
    resetFailed: "リセットできません",
    deleteConfirm: "この店舗を削除しますか？注文や売上の記録も削除されます。",
    deleting: "店舗を削除中",
    deleteFailed: "店舗を削除できません",
    creating: "新しい店舗を作成中",
    statusCustomerConfirmed: "受取確認済み",
    statusRecorded: "注文済み",
    statusPendingWallet: "ウォレット確認待ち",
    statusSubmitted: "送信済み / 確認中",
    statusCompleted: "完了",
    statusRejected: "キャンセル",
    statusFailed: "失敗",
  },
} as const;

type Copy = { [Key in keyof typeof copy.en]: string };

const INITIAL_EXCHANGE_RATE = 100;
const CUSTOMER_STORAGE_KEY = "arctable-customer-id";
const STORE_STORAGE_KEY = "arctable-restaurant-id";
const ADMIN_TOKEN_STORAGE_KEY = "arctable-admin-token";
const LANGUAGE_STORAGE_KEY = "arctable-language";

const fallbackShops: Shop[] = [
  {
    id: "burger",
    emoji: "🍔",
    name: "Burger",
    description: "Classic table burger",
    imageUrl: "/menu/burger.jpg",
    priceJpy: 800,
    actionLabel: "Order",
  },
  {
    id: "coffee",
    emoji: "☕",
    name: "Coffee",
    description: "Hot drip coffee",
    imageUrl: "/menu/coffee.jpg",
    priceJpy: 300,
    actionLabel: "Order",
  },
  {
    id: "cake",
    emoji: "🍰",
    name: "Cake",
    description: "Today's dessert",
    imageUrl: "/menu/cake.jpg",
    priceJpy: 500,
    actionLabel: "Order",
  },
];

const DEFAULT_CUSTOMER_THEME: CustomerTheme = {
  backgroundColor: "#f5f7f6",
  buttonColor: "#0f6b57",
};

const initialState: StoreState = {
  storeName: "ArcTable Store",
  adminToken: "",
  tableCount: 6,
  customerTheme: DEFAULT_CUSTOMER_THEME,
  exchangeRateJpyPerUsdc: INITIAL_EXCHANGE_RATE,
  paymentMode: "demo",
  recipientAddress: "",
  shops: fallbackShops,
  customers: [],
  payments: [],
};

const fallbackCustomer: Customer = {
  id: "loading",
  name: "Guest",
  balanceUsdc: 10,
  createdAt: new Date(0).toISOString(),
};

function normalizeStoreId(value?: string | null) {
  const normalized = (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return normalized;
}

function getStoreId() {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalizeStoreId(params.get("store"));
  const fromStorage = normalizeStoreId(window.localStorage.getItem(STORE_STORAGE_KEY));
  const storeId = fromUrl || fromStorage;

  if (storeId) {
    window.localStorage.setItem(STORE_STORAGE_KEY, storeId);
  }

  return storeId;
}

function getStoredAdminToken(storeId: string) {
  if (typeof window === "undefined" || !storeId) {
    return "";
  }

  return window.localStorage.getItem(`${ADMIN_TOKEN_STORAGE_KEY}:${storeId}`) || "";
}

function getAdminToken(storeId: string) {
  if (typeof window === "undefined" || !storeId) {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("admin") || "";
  const adminToken = fromUrl || getStoredAdminToken(storeId);

  if (adminToken) {
    window.localStorage.setItem(`${ADMIN_TOKEN_STORAGE_KEY}:${storeId}`, adminToken);
  }

  return adminToken;
}

function getCustomerId(storeId: string) {
  if (typeof window === "undefined") {
    return fallbackCustomer.id;
  }

  const storageKey = `${CUSTOMER_STORAGE_KEY}:${storeId}`;
  const saved = window.localStorage.getItem(storageKey);
  const customerId = saved || createId("customer");
  window.localStorage.setItem(storageKey, customerId);
  return customerId;
}

function getScreenParam(value: string | null): Screen | null {
  return value === "customer" ||
    value === "merchant" ||
    value === "settings" ||
    value === "tables" ||
    value === "customer-help" ||
    value === "settings-help" ||
    value === "merchant-help"
    ? value
    : null;
}

function getLangParam(value: string | null): Lang | null {
  return value === "en" || value === "ja" ? value : null;
}

function getStoreApiUrl(storeId: string, customerId?: string, adminToken?: string) {
  const params = new URLSearchParams({
    storeId,
  });

  if (customerId) {
    params.set("customerId", customerId);
  }

  if (adminToken) {
    params.set("admin", adminToken);
  }

  return `/api/store?${params.toString()}`;
}

async function fetchStore(storeId: string, customerId?: string, adminToken?: string) {
  const response = await fetch(getStoreApiUrl(storeId, customerId, adminToken), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("store_fetch_failed");
  }

  return (await response.json()) as StoreResponse;
}

function formatUsdc(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function calculateUsdcPrice(priceJpy: number, exchangeRateJpyPerUsdc: number) {
  return priceJpy / Math.max(1, exchangeRateJpyPerUsdc);
}

function usdcToStoredPrice(value: number, exchangeRateJpyPerUsdc: number) {
  return Math.round(Math.max(0, value) * Math.max(1, exchangeRateJpyPerUsdc));
}

function getTransactionUrl(transactionHash: string) {
  return `${ARC_MAINNET_EXPLORER_URL}/tx/${transactionHash}`;
}

function normalizeQuantity(value: number | "") {
  return Math.max(1, Math.min(99, Math.floor(Number(value) || 1)));
}

function isSoldOut(shop: Shop) {
  return typeof shop.stock === "number" && shop.stock <= 0;
}

function hasEnoughMenuStock(shop: Shop, quantity: number) {
  return typeof shop.stock !== "number" || shop.stock >= quantity;
}

function canCancelOrder(status: PaymentRecord["status"]) {
  return ["ordered", "served", "customer_confirmed", "pending_wallet"].includes(status);
}

function isRevenueOrder(status: PaymentRecord["status"]) {
  return status === "paid" || status === "completed";
}

function isAddressLike(value?: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || "");
}

function normalizeTheme(theme?: CustomerTheme): CustomerTheme {
  return {
    backgroundColor: /^#[0-9a-fA-F]{6}$/.test(theme?.backgroundColor || "")
      ? theme?.backgroundColor || DEFAULT_CUSTOMER_THEME.backgroundColor
      : DEFAULT_CUSTOMER_THEME.backgroundColor,
    buttonColor: /^#[0-9a-fA-F]{6}$/.test(theme?.buttonColor || "")
      ? theme?.buttonColor || DEFAULT_CUSTOMER_THEME.buttonColor
      : DEFAULT_CUSTOMER_THEME.buttonColor,
  };
}

function getReadableTextColor(backgroundColor: string) {
  const normalized = backgroundColor.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#17201d" : "#ffffff";
}

function toUsdcAmount(value: number) {
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function shortHash(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createAdminToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return `${Date.now()}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
}

async function sendArcPayment(
  recipientAddress: string | undefined,
  priceUsdc: number,
  connectedAddress: string | null,
) {
  if (!connectedAddress) {
    throw new Error("wallet_missing");
  }

  if (!isAddressLike(recipientAddress)) {
    throw new Error("recipient_missing");
  }

  await switchChain(wagmiAdapter.wagmiConfig, {
    chainId: ARC_MAINNET_CHAIN_ID,
  });

  const hash = await sendTransaction(wagmiAdapter.wagmiConfig, {
    to: recipientAddress as Address,
    value: parseEther(toUsdcAmount(priceUsdc)),
    chainId: ARC_MAINNET_CHAIN_ID,
  });

  return hash;
}

export default function Home() {
  const { open } = useAppKit();
  const { address: walletAddress, isConnected } = useAccount();
  const { data: walletBalance } = useBalance({
    address: walletAddress,
    chainId: ARC_MAINNET_CHAIN_ID,
    query: { enabled: Boolean(walletAddress) },
  });
  const [lang, setLang] = useState<Lang>("en");
  const t: Copy = copy[lang];
  const [screen, setScreen] = useState<Screen>("home");
  const [storeId, setStoreId] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [tableId, setTableId] = useState("1");
  const [store, setStore] = useState<StoreState>(initialState);
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(fallbackCustomer);
  const [selectedShopId, setSelectedShopId] = useState(fallbackShops[0].id);
  const [confirmShopId, setConfirmShopId] = useState<string | null>(null);
  const [confirmQuantity, setConfirmQuantity] = useState<number | "">(1);
  const [successItemName, setSuccessItemName] = useState<string | null>(null);
  const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(copy.en.loading);
  const [walletMessage, setWalletMessage] = useState("");
  const isManagerScreen = screen === "merchant" || screen === "settings" || screen === "tables" || screen === "settings-help" || screen === "merchant-help";

  useEffect(() => {
    const activeStoreId = getStoreId();
    const params = new URLSearchParams(window.location.search);
    const screenFromUrl = getScreenParam(params.get("screen"));
    const savedLang = getLangParam(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    const langFromUrl = getLangParam(params.get("lang"));
    window.setTimeout(() => {
      setTableId(params.get("table") || "1");
      setLang(langFromUrl || savedLang || "en");
      if (screenFromUrl) {
        setScreen(screenFromUrl);
      }
      setStoreId(activeStoreId);
      setAdminToken(getAdminToken(activeStoreId));
      if (!activeStoreId) {
        setStatusMessage("");
      }
    }, 0);
  }, []);

  useEffect(() => {
    if (!storeId) {
      return;
    }

    let isActive = true;
    const customerId = screen === "customer" || screen === "customer-help" ? getCustomerId(storeId) : undefined;

    async function refresh() {
      try {
        let activeAdminToken = getAdminToken(storeId);
        setAdminToken(activeAdminToken);
        const nextStore = await fetchStore(storeId, customerId, activeAdminToken);
        if (!isActive) {
          return;
        }
        if (isManagerScreen && nextStore.adminAuthorized === false) {
          setStatusMessage(t.adminLocked);
          setScreen("home");
          return;
        }
        if (isManagerScreen && !activeAdminToken) {
          activeAdminToken = createAdminToken();
          window.localStorage.setItem(`${ADMIN_TOKEN_STORAGE_KEY}:${storeId}`, activeAdminToken);
          const params = new URLSearchParams(window.location.search);
          params.set("store", storeId);
          params.set("admin", activeAdminToken);
          params.set("screen", screen);
          params.set("lang", lang);
          window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
          setAdminToken(activeAdminToken);
          await fetch("/api/store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "settings",
              storeId,
              adminToken: activeAdminToken,
              storeName: nextStore.storeName,
              tableCount: nextStore.tableCount,
              customerTheme: normalizeTheme(nextStore.customerTheme),
              exchangeRateJpyPerUsdc: nextStore.exchangeRateJpyPerUsdc,
              paymentMode: nextStore.paymentMode,
              recipientAddress: nextStore.recipientAddress || "",
              shops: nextStore.shops,
            }),
          });
        }
        if (screen !== "settings") {
          setStore({
            storeName: nextStore.storeName,
            adminToken: activeAdminToken,
            tableCount: nextStore.tableCount,
            customerTheme: normalizeTheme(nextStore.customerTheme),
            exchangeRateJpyPerUsdc: nextStore.exchangeRateJpyPerUsdc,
            paymentMode: nextStore.paymentMode,
            recipientAddress: nextStore.recipientAddress,
            shops: nextStore.shops,
            customers: nextStore.customers,
            payments: nextStore.payments,
          });
        }
        if (nextStore.currentCustomer) {
          setCurrentCustomer(nextStore.currentCustomer);
        }
        setSelectedShopId((current) => nextStore.shops.find((shop) => shop.id === current)?.id || nextStore.shops[0]?.id || "");
        if (screen !== "settings") {
          setStatusMessage("");
        }
      } catch {
        if (isActive && screen !== "settings") {
          setStatusMessage(t.loadFailed);
        }
      }
    }

    void refresh();
    const shouldKeepRefreshing = screen === "customer" || screen === "customer-help" || screen === "merchant";
    const timer = shouldKeepRefreshing ? window.setInterval(refresh, 5000) : null;

    return () => {
      isActive = false;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [storeId, screen, lang, t.adminLocked, t.loadFailed, isManagerScreen]);

  const effectiveSelectedShopId = store.shops.some((shop) => shop.id === selectedShopId)
    ? selectedShopId
    : store.shops[0]?.id || "";
  const confirmShop = store.shops.find((shop) => shop.id === confirmShopId) || null;
  const successPayment = successPaymentId ? store.payments.find((payment) => payment.id === successPaymentId) || null : null;
  const activeCustomerOrder =
    store.payments.find(
      (payment) =>
        payment.customerId === currentCustomer.id &&
        ["ordered", "served", "customer_confirmed", "pending_wallet", "submitted"].includes(payment.status),
    ) || null;

  const shopStats = useMemo(() => {
    return store.shops.map((shop) => {
      const records = store.payments.filter((payment) => payment.shopId === shop.id);
      const confirmedRecords = records.filter(
        (payment) =>
          payment.status === "paid" ||
          payment.status === "completed",
      );
      const sales = confirmedRecords.reduce((sum, payment) => sum + payment.priceUsdc * payment.quantity, 0);

      return {
        shop,
        records,
        sales,
        count: confirmedRecords.length,
      };
    });
  }, [store.payments, store.shops]);

  const storeTotal = shopStats.reduce((sum, item) => sum + item.sales, 0);
  const selectedStats = shopStats.find((item) => item.shop.id === effectiveSelectedShopId) || shopStats[0];

  async function refreshStore() {
    if (!storeId) {
      return;
    }

    const customerId = screen === "customer" || screen === "customer-help" ? getCustomerId(storeId) : undefined;
    const nextStore = await fetchStore(storeId, customerId, adminToken);
    setStore({
      storeName: nextStore.storeName,
      adminToken,
      tableCount: nextStore.tableCount,
      customerTheme: normalizeTheme(nextStore.customerTheme),
      exchangeRateJpyPerUsdc: nextStore.exchangeRateJpyPerUsdc,
      paymentMode: nextStore.paymentMode,
      recipientAddress: nextStore.recipientAddress,
      shops: nextStore.shops,
      customers: nextStore.customers,
      payments: nextStore.payments,
    });
    if (nextStore.currentCustomer) {
      setCurrentCustomer(nextStore.currentCustomer);
    }
  }

  function changeLanguage(nextLang: Lang) {
    setLang(nextLang);
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    const params = new URLSearchParams(window.location.search);
    params.set("lang", nextLang);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  async function completePurchase(shop: Shop) {
    if (!storeId) {
      return;
    }

    const quantity = normalizeQuantity(confirmQuantity);
    if (!hasEnoughMenuStock(shop, quantity)) {
      setStatusMessage(t.soldOut);
      return;
    }

    const orderCustomerId = getCustomerId(storeId);
    if (currentCustomer.id !== orderCustomerId) {
      setCurrentCustomer((current) => ({ ...current, id: orderCustomerId }));
    }
    setConfirmShopId(null);
    setConfirmQuantity(1);
    setStatusMessage(t.sendingOrder);

    try {
      const response = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase",
          storeId,
          customerId: orderCustomerId,
          shopId: shop.id,
          mode: store.paymentMode,
          status: "ordered",
          tableId,
          quantity,
        }),
      });

      if (!response.ok) {
        setStatusMessage(t.orderFailed);
        await refreshStore();
        return;
      }

      setSuccessItemName(shop.name);
      const result = (await response.clone().json().catch(() => null)) as { payment?: PaymentRecord; state?: StoreResponse } | null;
      setSuccessPaymentId(result?.payment?.id || null);
      if (result?.state) {
        setStore({
          storeName: result.state.storeName,
          adminToken,
          tableCount: result.state.tableCount,
          customerTheme: normalizeTheme(result.state.customerTheme),
          exchangeRateJpyPerUsdc: result.state.exchangeRateJpyPerUsdc,
          paymentMode: result.state.paymentMode,
          recipientAddress: result.state.recipientAddress,
          shops: result.state.shops,
          customers: result.state.customers,
          payments: result.state.payments,
        });
      }
      setStatusMessage("");
      await refreshStore();
    } catch {
      setStatusMessage(t.storeUnavailable);
    }
  }

  async function confirmServedAndPay(order: PaymentRecord) {
    if (!storeId) {
      return;
    }

    const shop = store.shops.find((item) => item.id === order.shopId);
    if (!shop) {
      setStatusMessage(t.itemMissing);
      return;
    }

    if (store.paymentMode === "arc-mainnet" && (!walletAddress || !isConnected)) {
      setStatusMessage(t.walletRequired);
      await open({ view: "Connect" });
      return;
    }

    if (store.paymentMode === "arc-mainnet" && !isAddressLike(store.recipientAddress)) {
      setStatusMessage(t.recipientMissing);
      return;
    }

    try {
      setStatusMessage(store.paymentMode === "arc-mainnet" ? t.confirmServedPay : t.confirmServed);
      const confirmResponse = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_served_order",
          storeId,
          orderId: order.id,
          payerAddress: walletAddress,
        }),
      });

      if (!confirmResponse.ok) {
        setStatusMessage(t.notServed);
        await refreshStore();
        return;
      }

      if (store.paymentMode === "demo") {
        setSuccessPaymentId(order.id);
        setSuccessItemName(order.itemName);
        setStatusMessage("");
        await refreshStore();
        return;
      }

      setStatusMessage(t.walletConfirm);
      const transactionHash = await sendArcPayment(store.recipientAddress, order.priceUsdc, walletAddress || null);

      setStatusMessage(t.arcConfirm);
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_onchain_order",
          storeId,
          orderId: order.id,
          transactionHash,
        }),
      });

      const [{ createPublicClient, http }, { arcMainnet }] = await Promise.all([
        import("viem"),
        import("@/lib/arc-mainnet"),
      ]);
      const publicClient = createPublicClient({
        chain: arcMainnet,
        transport: http(),
      });
      await publicClient.waitForTransactionReceipt({ hash: transactionHash });

      const verifyResponse = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_onchain_order",
          storeId,
          orderId: order.id,
          transactionHash,
        }),
      });

      if (!verifyResponse.ok) {
        setStatusMessage(t.paymentFailed);
        await refreshStore();
        return;
      }

      setSuccessPaymentId(order.id);
      setSuccessItemName(order.itemName);
      setStatusMessage("");
      await refreshStore();
    } catch (error) {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject_onchain_order",
          storeId,
          orderId: order.id,
          errorMessage: error instanceof Error ? error.message : "wallet rejected",
        }),
      }).catch(() => undefined);
      setStatusMessage(store.paymentMode === "arc-mainnet" ? t.paymentFailed : t.updateFailed);
      await refreshStore();
    }
  }

  async function connectWallet() {
    setWalletMessage(t.walletConnecting);

    try {
      await open({ view: "Connect" });
      setWalletMessage("");
    } catch {
      setWalletMessage(t.walletFailed);
    }
  }

  async function completeHandOver(orderId: string) {
    if (!storeId) {
      return;
    }

    setStatusMessage(t.updatingOrder);
    try {
      const response = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "serve_order", storeId, orderId, adminToken }),
      });

      if (!response.ok) {
        setStatusMessage(t.updateFailed);
        return;
      }

      setStatusMessage("");
      await refreshStore();
    } catch {
      setStatusMessage(t.recordFailed);
    }
  }

  async function cancelStoreOrder(orderId: string) {
    if (!storeId) {
      return;
    }

    setStatusMessage(t.updatingOrder);
    try {
      const response = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel_order",
          storeId,
          orderId,
          adminToken,
          errorMessage: "Cancelled by store",
        }),
      });

      if (!response.ok) {
        setStatusMessage(t.cancelFailed);
        await refreshStore();
        return;
      }

      setStatusMessage("");
      await refreshStore();
    } catch {
      setStatusMessage(t.cancelFailed);
    }
  }

  async function saveSettings(
    nextSettings: Pick<StoreState, "storeName" | "tableCount" | "customerTheme" | "exchangeRateJpyPerUsdc" | "paymentMode" | "recipientAddress" | "shops">,
  ) {
    if (!storeId) {
      return false;
    }

    const settingsToSave = {
      ...nextSettings,
      customerTheme: normalizeTheme(nextSettings.customerTheme),
      recipientAddress: nextSettings.paymentMode === "arc-mainnet" ? nextSettings.recipientAddress : "",
    };
    setStore((current) => ({ ...current, ...settingsToSave }));
    setStatusMessage(t.saving);

    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "settings",
          storeId,
          adminToken,
          ...settingsToSave,
        }),
      });
      setStatusMessage("");
      return true;
    } catch {
      setStatusMessage(t.saveFailed);
      return false;
    }
  }

  async function resetDemo() {
    if (!storeId) {
      return;
    }

    setSuccessItemName(null);
    setConfirmShopId(null);
    setConfirmQuantity(1);
    setStatusMessage(t.resetting);

    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", storeId, adminToken }),
      });
      setStatusMessage("");
      await refreshStore();
    } catch {
      setStatusMessage(t.resetFailed);
    }
  }

  function goToCreationTop(options: { clearStore?: boolean } = {}) {
    if (typeof window === "undefined") {
      return;
    }

    window.history.pushState(null, "", window.location.pathname);
    if (options.clearStore) {
      window.localStorage.removeItem(STORE_STORAGE_KEY);
      if (storeId) {
        window.localStorage.removeItem(`${ADMIN_TOKEN_STORAGE_KEY}:${storeId}`);
      }
      setStoreId("");
      setAdminToken("");
      setStore(initialState);
    }
    setCurrentCustomer(fallbackCustomer);
    setSuccessItemName(null);
    setSuccessPaymentId(null);
    setConfirmShopId(null);
    setStatusMessage("");
    setScreen("home");
  }

  async function deleteCurrentStore() {
    if (!storeId || typeof window === "undefined") {
      return;
    }

    const shouldDelete = window.confirm(t.deleteConfirm);
    if (!shouldDelete) {
      return;
    }

    setStatusMessage(t.deleting);

    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_store", storeId, adminToken }),
      });
      goToCreationTop({ clearStore: true });
    } catch {
      setStatusMessage(t.deleteFailed);
    }
  }

  function createNewStore() {
    if (typeof window === "undefined") {
      return;
    }

    const nextStoreId = createId("store").replace(/[^a-z0-9-]/g, "-").slice(0, 32);
    const nextAdminToken = createAdminToken();
    const params = new URLSearchParams(window.location.search);
    params.set("store", nextStoreId);
    params.set("screen", "settings");
    params.set("lang", lang);
    params.set("admin", nextAdminToken);
    window.localStorage.setItem(STORE_STORAGE_KEY, nextStoreId);
    window.localStorage.setItem(`${ADMIN_TOKEN_STORAGE_KEY}:${nextStoreId}`, nextAdminToken);
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
    setStore({ ...initialState, adminToken: nextAdminToken });
    setCurrentCustomer(fallbackCustomer);
    setSuccessItemName(null);
    setSuccessPaymentId(null);
    setConfirmShopId(null);
    setStatusMessage(t.creating);
    setStoreId(nextStoreId);
    setAdminToken(nextAdminToken);
    setScreen("settings");
  }

  function goBackFromHeader() {
    if (screen === "customer-help") {
      setScreen("customer");
      return;
    }
    if (screen === "settings-help") {
      setScreen("settings");
      return;
    }
    if (screen === "merchant-help") {
      setScreen("merchant");
      return;
    }
    setScreen(screen === "settings" || screen === "tables" ? "merchant" : "home");
  }

  return (
    <main className="min-h-dvh bg-[#f5f7f6] text-[#17201d]">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
        {screen !== "home" ? (
          <header className="sticky top-0 z-20 border-b border-[#d9e3df] bg-[#f5f7f6]/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <button
                className="touch-button small-button"
                type="button"
                onClick={goBackFromHeader}
              >
                {t.back}
              </button>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0f6b57]">ArcTable</p>
                <p className="max-w-[13rem] truncate text-lg font-bold sm:max-w-none">{store.storeName}</p>
              </div>
              {screen === "merchant" ? (
                <div className="flex items-center gap-2">
                  <button className="touch-button small-button hidden sm:block" type="button" onClick={() => goToCreationTop()}>
                    TOP
                  </button>
                  <button className="touch-button small-button hidden sm:block" type="button" onClick={() => setScreen("tables")}>
                    {t.tables}
                  </button>
                  <button className="touch-button small-button hidden sm:block" type="button" onClick={() => setScreen("merchant-help")}>
                    {t.howToUse}
                  </button>
                  <button className="touch-button small-button" type="button" onClick={() => setScreen("settings")}>
                    {t.settings}
                  </button>
                  <LanguageToggle lang={lang} onChange={changeLanguage} />
                </div>
              ) : (
                <LanguageToggle lang={lang} onChange={changeLanguage} />
              )}
            </div>
          </header>
        ) : null}

        {screen === "home" ? (
          <HomeScreen
            storeName={store.storeName}
            storeId={storeId}
            adminToken={adminToken}
            statusMessage={statusMessage}
            lang={lang}
            t={t}
            onLanguageChange={changeLanguage}
            onCreateStore={createNewStore}
            onNavigate={setScreen}
          />
        ) : null}

        {screen === "customer" ? (
          <CustomerScreen
            customer={currentCustomer}
            paymentMode={store.paymentMode}
            recipientAddress={store.recipientAddress}
            customerTheme={normalizeTheme(store.customerTheme)}
            shops={store.shops}
            orderHistory={store.payments}
            tableId={tableId}
            activeOrder={activeCustomerOrder}
            successItemName={successItemName}
            successPayment={successPayment}
            statusMessage={statusMessage}
            walletMessage={walletMessage}
            walletAddress={walletAddress || null}
            walletBalanceUsdc={walletBalance ? Number(formatEther(walletBalance.value)) : null}
            t={t}
            lang={lang}
            onConnectWallet={() => void connectWallet()}
            onCloseSuccess={() => {
              setSuccessItemName(null);
              setSuccessPaymentId(null);
            }}
            onPickShop={(shopId) => setConfirmShopId(shopId)}
            onConfirmServedOrder={(order) => void confirmServedAndPay(order)}
            onOpenHelp={() => setScreen("customer-help")}
          />
        ) : null}

        {screen === "merchant" ? (
          <MerchantScreen
            storeId={storeId}
            adminToken={adminToken}
            selectedShopId={effectiveSelectedShopId}
            selectedStats={selectedStats}
            shopStats={shopStats}
            total={storeTotal}
            paymentMode={store.paymentMode}
            recipientAddress={store.recipientAddress}
            t={t}
            lang={lang}
            onSelectShop={setSelectedShopId}
            onOpenTables={() => setScreen("tables")}
            onOpenHelp={() => setScreen("merchant-help")}
            onCompleteOrder={(orderId) => void completeHandOver(orderId)}
            onCancelOrder={(orderId) => void cancelStoreOrder(orderId)}
          />
        ) : null}

        {screen === "tables" ? (
          <TablesScreen
            store={store}
            storeId={storeId}
            adminToken={adminToken}
            lang={lang}
            statusMessage={statusMessage}
            t={t}
            onSaveTableCount={async (tableCount) => {
              const didSave = await saveSettings({
                storeName: store.storeName,
                tableCount,
                customerTheme: normalizeTheme(store.customerTheme),
                exchangeRateJpyPerUsdc: store.exchangeRateJpyPerUsdc,
                paymentMode: store.paymentMode,
                recipientAddress: store.recipientAddress || "",
                shops: store.shops,
              });
              if (didSave) {
                setStore((current) => ({ ...current, tableCount }));
              }
            }}
          />
        ) : null}

        {screen === "settings" ? (
          <SettingsScreen
            store={store}
            storeId={storeId}
            adminToken={adminToken}
            lang={lang}
            statusMessage={statusMessage}
            t={t}
            onSaveSettings={async (nextSettings) => {
              const didSave = await saveSettings(nextSettings);
              if (didSave) {
                setScreen("merchant");
              }
            }}
            onResetDemo={() => void resetDemo()}
            onOpenHelp={() => setScreen("settings-help")}
            onBackToTop={goToCreationTop}
            onDeleteStore={() => void deleteCurrentStore()}
          />
        ) : null}

        {screen === "customer-help" ? (
          <CustomerHelpScreen t={t} paymentMode={store.paymentMode} customerTheme={normalizeTheme(store.customerTheme)} />
        ) : null}
        {screen === "settings-help" ? <SettingsHelpScreen t={t} /> : null}
        {screen === "merchant-help" ? <MerchantHelpScreen t={t} paymentMode={store.paymentMode} /> : null}
      </div>

      {confirmShop ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/45 px-4">
          <section className="w-full max-w-sm rounded-lg bg-white p-5 text-center shadow-2xl">
            <div className="mx-auto grid size-14 place-items-center rounded-md bg-[#eef4f1] text-2xl">{confirmShop.emoji}</div>
            <h2 className="mt-3 text-2xl font-bold">
              {confirmShop.name} / {formatUsdc(calculateUsdcPrice(confirmShop.priceJpy * normalizeQuantity(confirmQuantity), store.exchangeRateJpyPerUsdc))} USDC
            </h2>
            <p className="mt-2 text-lg font-bold text-[#17201d]">{t.confirmOrderTitle}</p>
            <label className="mt-4 block text-left text-sm font-black text-[#53625d]" htmlFor="confirm-quantity">
              {t.quantity}
            </label>
            <input
              id="confirm-quantity"
              className="text-field mt-2 text-center text-2xl font-black"
              min="1"
              max="99"
              step="1"
              type="number"
              value={confirmQuantity}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => {
                if (event.target.value === "") {
                  setConfirmQuantity("");
                  return;
                }
                const nextValue = Number(event.target.value);
                setConfirmQuantity(Number.isFinite(nextValue) ? normalizeQuantity(nextValue) : "");
              }}
              onBlur={() => setConfirmQuantity((current) => normalizeQuantity(current))}
            />
            {store.paymentMode === "arc-mainnet" ? (
              <p className="mt-2 rounded-md bg-[#e7f4ef] px-3 py-2 text-sm font-bold text-[#0f6b57]">
                {t.payAfterServedNote}
              </p>
            ) : null}
            {!hasEnoughMenuStock(confirmShop, normalizeQuantity(confirmQuantity)) ? (
              <p className="mt-2 rounded-md bg-[#fff4f1] px-3 py-2 text-sm font-bold text-[#b62e22]">
                {t.soldOut}
              </p>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                className="touch-button cancel-button"
                type="button"
                onClick={() => {
                  setConfirmShopId(null);
                  setConfirmQuantity(1);
                }}
              >
                {t.cancel}
              </button>
              <button
                className="touch-button buy-button"
                type="button"
                disabled={
                  !hasEnoughMenuStock(confirmShop, normalizeQuantity(confirmQuantity)) ||
                  (store.paymentMode === "arc-mainnet" && !isAddressLike(store.recipientAddress))
                }
                onClick={() => completePurchase(confirmShop)}
              >
                {t.order}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function HomeScreen({
  storeName,
  storeId,
  adminToken,
  statusMessage,
  lang,
  t,
  onLanguageChange,
  onCreateStore,
  onNavigate,
}: {
  storeName: string;
  storeId: string;
  adminToken: string;
  statusMessage: string;
  lang: Lang;
  t: Copy;
  onLanguageChange: (lang: Lang) => void;
  onCreateStore: () => void;
  onNavigate: (screen: Screen) => void;
}) {
  if (!storeId) {
    return (
      <section className="flex flex-1 flex-col px-5 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f6b57]">ArcTable</p>
            <LanguageToggle lang={lang} onChange={onLanguageChange} />
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-[#17201d] sm:text-5xl">
            {t.createTitle}
          </h1>
        </div>

        <div className="grid flex-1 content-center gap-4">
          <a
            className="role-button bg-white"
            href={`/?screen=settings&lang=${lang}`}
            onPointerDown={onCreateStore}
          >
            <span className="grid size-12 place-items-center rounded-md bg-[#0f6b57] text-xl text-white">＋</span>
            <span>{t.createDemo}</span>
          </a>
          <div className="rounded-lg border border-[#d9e3df] bg-white p-5 shadow-sm">
            <p className="text-lg font-bold text-[#17201d]">{t.setupTitle}</p>
            <div className="mt-3 grid gap-2 text-left text-base font-medium leading-7 text-[#53625d]">
              <p>{t.setupStep1}</p>
              <p>{t.setupStep2}</p>
              <p>{t.setupStep3}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const managerUrl =
    typeof window === "undefined" || !adminToken
      ? ""
      : `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(storeId)}&screen=merchant&lang=${lang}&admin=${encodeURIComponent(adminToken)}`;

  return (
    <section className="flex flex-1 flex-col px-5 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f6b57]">ArcTable</p>
          <LanguageToggle lang={lang} onChange={onLanguageChange} />
        </div>
        <h1 className="mt-2 text-4xl font-bold leading-tight text-[#17201d] sm:text-5xl">{storeName}</h1>
        {storeId ? (
          <p className="mt-3 inline-block rounded-md border border-[#d9e3df] bg-white px-4 py-2 text-sm font-bold text-[#53625d]">
            {t.storeId}: {storeId}
          </p>
        ) : null}
      </div>

      {statusMessage ? (
        <p className="mb-4 rounded-lg border border-[#d9e3df] bg-white px-4 py-3 text-center text-sm font-bold text-[#53625d]">
          {statusMessage}
        </p>
      ) : null}

      {managerUrl ? (
        <div className="mb-4 rounded-lg border border-[#0f6b57]/30 bg-[#e7f4ef] p-4">
          <p className="text-lg font-black text-[#0f6b57]">{t.saveManagerUrlTitle}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#53625d]">{t.saveManagerUrlWarning}</p>
          <CopyButton
            className="mt-3 rounded-md bg-[#0f6b57] px-4 py-3 text-sm font-black text-white"
            copiedLabel={t.copied}
            label={t.copiedManagerUrl}
            text={managerUrl}
          />
        </div>
      ) : null}

      <div className="grid flex-1 content-center gap-4 sm:grid-cols-2">
        <a
          className="role-button bg-white"
          href={`/?store=${storeId}&screen=customer&lang=${lang}`}
          onPointerDown={() => onNavigate("customer")}
        >
          <span className="grid size-12 place-items-center rounded-md bg-[#e7f4ef] text-base font-bold text-[#0f6b57]">QR</span>
          <span>{t.customerView}</span>
        </a>
        <a
          className="role-button bg-[#17201d] text-white"
          href={managerUrl || `/?store=${storeId}&screen=merchant&lang=${lang}`}
          onPointerDown={() => onNavigate("merchant")}
        >
          <span className="grid size-12 place-items-center rounded-md bg-white/12 text-base font-bold text-white">POS</span>
          <span className="text-white">{t.merchantView}</span>
        </a>
        <button className="role-button bg-white sm:col-span-2" type="button" onClick={onCreateStore}>
          <span className="grid size-12 place-items-center rounded-md bg-[#0f6b57] text-xl text-white">＋</span>
          <span>{t.newStore}</span>
        </button>
      </div>
    </section>
  );
}

function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-md border border-[#d9e3df] bg-white text-xs font-bold">
      {(["en", "ja"] as const).map((item) => (
        <button
          key={item}
          className={`px-3 py-2 ${lang === item ? "bg-[#17201d] text-white" : "text-[#53625d]"}`}
          type="button"
          onClick={() => onChange(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function CopyButton({
  text,
  label,
  copiedLabel,
  className,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  className: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text) {
      return;
    }

    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      className={`${className} transition active:translate-y-px active:scale-[0.98] ${copied ? "ring-2 ring-[#0f6b57]/40" : ""}`}
      type="button"
      onClick={() => void handleCopy()}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

function HelpPage({
  title,
  intro,
  sections,
  dark = false,
  backgroundColor,
}: {
  title: string;
  intro: string;
  sections: { title: string; items: string[] }[];
  dark?: boolean;
  backgroundColor?: string;
}) {
  return (
    <section className={`flex-1 px-4 py-5 ${dark ? "bg-[#17201d] text-white" : ""}`} style={backgroundColor ? { backgroundColor } : undefined}>
      <div className={`rounded-lg border p-5 shadow-sm ${dark ? "border-white/10 bg-[#22312c]" : "border-[#d9e3df] bg-white"}`}>
        <p className={`text-xs font-black uppercase tracking-[0.18em] ${dark ? "text-[#99dac7]" : "text-[#0f6b57]"}`}>
          ArcTable
        </p>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className={`mt-3 text-base font-bold leading-7 ${dark ? "text-white/75" : "text-[#53625d]"}`}>{intro}</p>
      </div>

      <div className="mt-4 grid gap-4">
        {sections.map((section, sectionIndex) => (
          <article
            key={section.title}
            className={`rounded-lg border p-5 shadow-sm ${dark ? "border-white/10 bg-[#101715]" : "border-[#d9e3df] bg-white"}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-md text-sm font-black ${
                  dark ? "bg-[#f8d45d] text-[#23190b]" : "bg-[#e7f4ef] text-[#0f6b57]"
                }`}
              >
                {sectionIndex + 1}
              </span>
              <div>
                <h2 className="text-xl font-black">{section.title}</h2>
                <div className={`mt-3 grid gap-2 text-base font-bold leading-7 ${dark ? "text-white/75" : "text-[#53625d]"}`}>
                  {section.items.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CustomerHelpScreen({ t, paymentMode, customerTheme }: { t: Copy; paymentMode: PaymentMode; customerTheme: CustomerTheme }) {
  const isJa = t.back === "戻る";

  return (
    <HelpPage
      backgroundColor={customerTheme.backgroundColor}
      title={isJa ? "注文の使い方" : "How to order"}
      intro={
        isJa
          ? "テーブルのQRから開いた画面で、商品を選んで注文します。支払いは商品が届いた後に進みます。"
          : "Open the table QR page, choose an item, and place the order. Payment happens after the item is served."
      }
      sections={[
        {
          title: isJa ? "商品を選ぶ" : "Choose an item",
          items: isJa
            ? ["メニューから商品を選びます。", "数量を入力してOKすると、店舗に注文が送信されます。", "Sold Outの商品は注文できません。"]
            : ["Select an item from the menu.", "Enter the quantity and confirm to send the order to the store.", "Sold Out items cannot be ordered."],
        },
        {
          title: isJa ? "届いたら確認" : "Confirm when served",
          items: isJa
            ? ["店舗が商品を提供済みにすると、受け取り確認ボタンが出ます。", "商品が届いたことを確認してからボタンを押してください。"]
            : ["After the store marks the order as served, a receipt confirmation button appears.", "Tap it only after the item has arrived."],
        },
        {
          title: isJa ? "支払い" : "Payment",
          items:
            paymentMode === "arc-mainnet"
              ? isJa
                ? ["受け取り確認後、ウォレットでArc USDC支払いを確認します。", "支払いが完了すると、店舗側にもPAIDとして反映されます。"]
                : ["After confirming receipt, approve the Arc USDC payment in your wallet.", "When payment completes, the store dashboard updates to PAID."]
              : isJa
                ? ["テスト会計ではウォレットは使いません。", "受け取り確認後、支払済みとして店舗側に反映されます。"]
                : ["Test checkout does not use a wallet.", "After receipt confirmation, the store dashboard marks the order as paid."],
        },
      ]}
    />
  );
}

function SettingsHelpScreen({ t }: { t: Copy }) {
  const isJa = t.back === "戻る";

  return (
    <HelpPage
      title={isJa ? "店舗設定の使い方" : "Store setup guide"}
      intro={
        isJa
          ? "店舗名、決済方法、メニュー、テーブルQRを設定します。最後に保存すると店舗画面へ反映されます。"
          : "Set the store name, payment mode, menu items, and table QR URLs. Save changes to update the store dashboard."
      }
      sections={[
        {
          title: isJa ? "管理用URLを保存" : "Save the manager URL",
          items: isJa
            ? ["ログイン機能はありません。", "管理用URLを紛失すると店舗管理画面に戻れません。", "お客様用QRには管理用URLを使わないでください。"]
            : ["There is no login system.", "If the manager URL is lost, the store dashboard cannot be reopened.", "Do not use the manager URL for customer QR codes."],
        },
        {
          title: isJa ? "決済方法を選ぶ" : "Choose payment mode",
          items: isJa
            ? ["テスト会計はウォレットなしで動作確認できます。", "Arc USDCを使う場合は、Arc Mainnetの受取アドレスを入力します。"]
            : ["Test checkout lets you demo the flow without a wallet.", "For Arc USDC, enter the payout address on Arc Mainnet."],
        },
        {
          title: isJa ? "メニューを設定" : "Edit menu items",
          items: isJa
            ? ["商品名、説明、写真URL、USDC価格、在庫数を入力します。", "在庫数を空欄にすると無制限、0にするとSold Outになります。", "写真URLは公開されている画像URLを使います。"]
            : ["Enter each item name, description, photo URL, USDC price, and stock.", "Leave stock blank for unlimited, or set it to 0 to show Sold Out.", "Photo URLs should be public image URLs."],
        },
        {
          title: isJa ? "テーブルQRを作る" : "Create table QR codes",
          items: isJa
            ? ["テーブルURL画面でテーブル数を設定します。", "各テーブルのQRを表示し、印刷またはスクリーンショットでテーブルに置きます。"]
            : ["Set the number of tables on the Table URLs page.", "Use each table QR code for printouts or screenshots placed on the matching table."],
        },
      ]}
    />
  );
}

function MerchantHelpScreen({ t, paymentMode }: { t: Copy; paymentMode: PaymentMode }) {
  const isJa = t.back === "戻る";

  return (
    <HelpPage
      title={isJa ? "受注・売上の使い方" : "Orders & sales guide"}
      intro={
        isJa
          ? "店舗画面では注文の受付、提供済みへの変更、キャンセル、売上確認ができます。"
          : "The store dashboard handles incoming orders, serving status, cancellations, and paid sales totals."
      }
      dark
      sections={[
        {
          title: isJa ? "注文を受ける" : "Receive orders",
          items: isJa
            ? ["お客様がQRから注文すると、Ordersにテーブル番号付きで表示されます。", "注文内容、数量、時刻、注文IDを確認できます。"]
            : ["When a customer orders from a table QR, it appears in Orders with the table number.", "You can check the item, quantity, time, and order ID."],
        },
        {
          title: isJa ? "提供済みにする" : "Mark as served",
          items: isJa
            ? ["商品をテーブルへ届けたらServedを押します。", "その後、お客様の画面で受け取り確認と支払いに進めます。"]
            : ["Tap Served after bringing the item to the table.", "The customer can then confirm receipt and proceed to payment."],
        },
        {
          title: isJa ? "キャンセル" : "Cancel orders",
          items: isJa
            ? ["未提供・未決済の注文はキャンセルできます。", "在庫切れやお客様からのキャンセル依頼に使います。", "キャンセルした注文は売上に含まれません。"]
            : ["Unserved and unpaid orders can be cancelled.", "Use this for out-of-stock situations or customer cancellation requests.", "Cancelled orders are not counted as sales."],
        },
        {
          title: isJa ? "売上と取引確認" : "Sales and transaction checks",
          items:
            paymentMode === "arc-mainnet"
              ? isJa
                ? ["Paid Totalは支払い完了した注文だけを集計します。", "Arc USDC支払い後は、注文内に取引URLが表示されます。"]
                : ["Paid Total only counts completed paid orders.", "After Arc USDC payment, the order shows a transaction URL."]
              : isJa
                ? ["テスト会計では、受け取り確認後に支払済みとして集計されます。", "本番デモ前にはArc USDCモードと受取アドレスを確認してください。"]
                : ["In test checkout, orders are counted as paid after receipt confirmation.", "Before the final demo, check Arc USDC mode and the payout address."],
        },
      ]}
    />
  );
}

function CustomerScreen({
  customer,
  paymentMode,
  recipientAddress,
  customerTheme,
  shops,
  orderHistory,
  tableId,
  activeOrder,
  successItemName,
  successPayment,
  statusMessage,
  walletMessage,
  walletAddress,
  walletBalanceUsdc,
  t,
  lang,
  onConnectWallet,
  onPickShop,
  onConfirmServedOrder,
  onOpenHelp,
  onCloseSuccess,
}: {
  customer: Customer;
  paymentMode: PaymentMode;
  recipientAddress?: string;
  customerTheme: CustomerTheme;
  shops: Shop[];
  orderHistory: PaymentRecord[];
  tableId: string;
  activeOrder: PaymentRecord | null;
  successItemName: string | null;
  successPayment: PaymentRecord | null;
  statusMessage: string;
  walletMessage: string;
  walletAddress: string | null;
  walletBalanceUsdc: number | null;
  t: Copy;
  lang: Lang;
  onConnectWallet: () => void;
  onPickShop: (shopId: string) => void;
  onConfirmServedOrder: (order: PaymentRecord) => void;
  onOpenHelp: () => void;
  onCloseSuccess: () => void;
}) {
  const customerOrders = orderHistory
    .filter((payment) => payment.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const theme = normalizeTheme(customerTheme);
  const themedButtonStyle = {
    backgroundColor: theme.buttonColor,
    color: getReadableTextColor(theme.buttonColor),
  };

  return (
    <section className="flex-1 px-4 py-5" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="mb-4 rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-[#17201d]">Table {tableId}</p>
            <p className="mt-2 text-sm font-medium text-[#53625d]">
              {paymentMode === "arc-mainnet" ? t.payAfterServed : t.demoMode}
            </p>
          </div>
          <button className="touch-button small-button" type="button" onClick={onOpenHelp}>
            {t.howToUse}
          </button>
        </div>
      </div>

      {paymentMode === "demo" ? (
        <div className="rounded-lg border border-[#d9e3df] bg-white p-5 shadow-sm">
          <p className="text-base font-bold text-[#17201d]">{customer.name}</p>
          <p className="text-xl font-bold text-[#17201d]">{t.customerNotice}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#b8d9cf] bg-[#e7f4ef] p-5 shadow-sm">
          <p className="text-base font-bold text-[#0f6b57]">{customer.name}</p>
          <p className="text-xl font-bold text-[#0f6b57]">{t.walletTitle}</p>
          {walletAddress ? (
            <>
              <p className="mt-2 font-mono text-2xl font-bold">{shortHash(walletAddress)}</p>
              <p className="mt-1 text-4xl font-bold">{walletBalanceUsdc === null ? "--" : formatUsdc(walletBalanceUsdc)} USDC</p>
            </>
          ) : (
            <button className="touch-button buy-button mt-3 w-full text-lg" type="button" style={themedButtonStyle} onClick={onConnectWallet}>
              {t.connectWallet}
            </button>
          )}
          <p className="mt-2 text-sm font-medium text-[#35685c]">{t.connectedWallet}</p>
          {walletMessage ? <p className="mt-2 text-sm font-bold text-[#0f6b57]">{walletMessage}</p> : null}
        </div>
      )}

      {statusMessage ? (
        <p className="mt-3 rounded-lg border border-[#d9e3df] bg-white px-4 py-3 text-center text-base font-bold text-[#53625d]">
          {statusMessage}
        </p>
      ) : null}

      {activeOrder ? (
        <section className="mt-4 rounded-lg border border-[#d9e3df] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0f6b57]">Current Order</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{activeOrder.itemName}</h2>
              <p className="mt-1 text-sm font-medium text-[#53625d]">
                Order {activeOrder.id.slice(-8)} / {formatUsdc(activeOrder.priceUsdc)} USDC
              </p>
            </div>
            <span className="rounded-full bg-[#eef4f1] px-3 py-2 text-sm font-bold text-[#53625d]">
              {statusLabel(activeOrder.status, t)}
            </span>
          </div>
          {activeOrder.status === "served" ? (
            <button
              className="touch-button buy-button mt-4 w-full text-lg"
              type="button"
              style={themedButtonStyle}
              onClick={() => onConfirmServedOrder(activeOrder)}
            >
              {t.receivedPay}
            </button>
          ) : null}
          {activeOrder.status === "paid" ? (
            <p className="mt-4 rounded-lg bg-[#e7f4ef] px-4 py-3 text-center text-base font-bold text-[#0f6b57]">
              {t.paidSynced}
            </p>
          ) : null}
        </section>
      ) : null}

      {successItemName ? (
        <section className="mt-4 rounded-lg border border-[#b8d9cf] bg-[#e7f4ef] p-5 text-center shadow-sm">
          <h2 className="text-2xl font-bold">
            {successPayment?.status === "completed" || successPayment?.status === "paid" ? t.orderComplete : t.orderedMessage}
          </h2>
          <p className="mt-2 text-lg font-medium">
            {successPayment?.status === "completed" ? (
              t.thankYou
            ) : (
              `${successItemName} ${t.orderedMessage}`
            )}
          </p>
          {successPayment ? (
            <div className="mt-3 rounded-lg bg-white/80 px-3 py-3 text-sm font-bold text-[#0f6b57]">
              <p>{t.orderId} {successPayment.id.slice(-8)}</p>
              <p>
                {successPayment.itemName} ×{successPayment.quantity} / {formatUsdc(successPayment.priceUsdc)} USDC
              </p>
              {successPayment.transactionHash ? <p>Tx {shortHash(successPayment.transactionHash)}</p> : null}
              <p>
                {successPayment.status === "completed"
                  ? t.statusCompleted
                  : successPayment.status === "paid"
                    ? "PAID"
                    : statusLabel(successPayment.status, t)}
              </p>
            </div>
          ) : null}
          <button className="touch-button mt-4 bg-white" type="button" onClick={onCloseSuccess}>
            OK
          </button>
        </section>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {shops.map((shop) => {
          const priceUsdc = calculateUsdcPrice(shop.priceJpy, INITIAL_EXCHANGE_RATE);
          const hasRecipient = isAddressLike(recipientAddress);
          const soldOut = isSoldOut(shop);
          const canBuy = !activeOrder && !soldOut && (paymentMode === "arc-mainnet" ? hasRecipient : true);
          const buttonLabel =
            soldOut
              ? t.soldOut
              : paymentMode === "arc-mainnet"
              ? !hasRecipient
                ? t.preparing
                : activeOrder
                  ? t.ordering
                  : t.order
              : canBuy
                ? (lang === "en" ? "Order" : t.order)
                : t.ordering;

          function handleShopButton() {
            if (canBuy) {
              onPickShop(shop.id);
            }
          }

          return (
            <article key={shop.id} className="rounded-lg border border-[#d9e3df] bg-white p-5 shadow-sm">
              {shop.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={shop.name}
                  className="mb-4 aspect-[4/3] w-full rounded-md object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  src={shop.imageUrl}
                />
              ) : null}
              <div className="flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-md bg-[#eef4f1] text-2xl">{shop.emoji}</div>
                <div>
                  <h2 className="text-2xl font-bold">{shop.name}</h2>
              <p className="text-base font-medium text-[#53625d]">{shop.description}</p>
              {typeof shop.stock === "number" ? (
                <p className={`mt-2 text-sm font-black ${soldOut ? "text-[#b62e22]" : "text-[#0f6b57]"}`}>
                  {soldOut ? t.soldOut : `${t.stock}: ${shop.stock}`}
                </p>
              ) : null}
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-[#17201d]">{formatUsdc(priceUsdc)} USDC</p>
              <button
                className="touch-button buy-button mt-4 w-full text-lg"
                type="button"
                disabled={!canBuy}
                style={canBuy ? themedButtonStyle : undefined}
                onClick={handleShopButton}
              >
                {buttonLabel}
              </button>
            </article>
          );
        })}
      </div>

      <section className="mt-5 rounded-lg border border-[#d9e3df] bg-white shadow-sm">
        <div className="border-b border-[#d9e3df] px-4 py-3">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#0f6b57]">{t.orderHistory}</h2>
        </div>
        <div className="divide-y divide-[#d9e3df]">
          {customerOrders.length > 0 ? (
            customerOrders.slice(0, 10).map((record) => (
              <div key={record.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-lg font-black text-[#17201d]">
                    {record.itemName} ×{record.quantity}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-[#53625d]">
                    <span>{formatTime(record.createdAt)}</span>
                    <span>{t.orderId} {record.id.slice(-8)}</span>
                    {record.tableId ? <span>Table {record.tableId}</span> : null}
                    {record.transactionHash ? (
                      <a
                        className="text-[#0f6b57] underline"
                        href={getTransactionUrl(record.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Tx {shortHash(record.transactionHash)}
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="rounded-full bg-[#eef4f1] px-3 py-2 text-xs font-black text-[#53625d]">
                    {statusLabel(record.status, t)}
                  </span>
                  <span className="font-mono text-lg font-black text-[#0f6b57]">
                    {formatUsdc(record.priceUsdc)} USDC
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-sm font-bold text-[#53625d]">{t.noOrders}</p>
          )}
        </div>
      </section>
    </section>
  );
}

function MerchantScreen({
  storeId,
  adminToken,
  selectedShopId,
  selectedStats,
  shopStats,
  total,
  paymentMode,
  recipientAddress,
  t,
  lang,
  onSelectShop,
  onOpenTables,
  onOpenHelp,
  onCompleteOrder,
  onCancelOrder,
}: {
  storeId: string;
  adminToken: string;
  selectedShopId: string;
  selectedStats?: {
    shop: Shop;
    records: ShopStats["records"];
    sales: number;
    count: number;
  };
  shopStats: {
    shop: Shop;
    records: ShopStats["records"];
    sales: number;
    count: number;
  }[];
  total: number;
  paymentMode: PaymentMode;
  recipientAddress?: string;
  t: Copy;
  lang: Lang;
  onSelectShop: (shopId: string) => void;
  onOpenTables: () => void;
  onOpenHelp: () => void;
  onCompleteOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}) {
  if (!selectedStats) {
    return null;
  }

  const allRecords = shopStats
    .flatMap(({ records }) => records)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const storeUrl =
    typeof window === "undefined" || !storeId
      ? ""
      : `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(storeId)}&table=1&screen=customer&lang=${lang}`;
  const managerUrl =
    typeof window === "undefined" || !storeId || !adminToken
      ? ""
      : `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(storeId)}&screen=merchant&lang=${lang}&admin=${encodeURIComponent(adminToken)}`;

  return (
    <section className="flex-1 bg-[#17201d] px-4 py-5 text-white">
      <div className="rounded-lg border border-white/10 bg-[#22312c] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#99dac7]">Paid Total</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-4xl font-black">{formatUsdc(total)} USDC</p>
          <p className="pb-1 text-sm font-bold text-white/70">
            {paymentMode === "arc-mainnet" ? "Arc Mainnet / On-chain" : "Test checkout"}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-[#22312c] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#99dac7]">{t.tableOrderUrl}</p>
        <p className="mt-2 break-all font-mono text-sm font-black text-white/80">{storeUrl || t.readying}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <CopyButton
            className="rounded-md bg-[#f8d45d] px-3 py-3 text-sm font-black text-[#23190b]"
            copiedLabel={t.copied}
            label={t.copiedUrl}
            text={storeUrl}
          />
          <button
            className="rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white"
            type="button"
            onClick={onOpenTables}
          >
            {t.tableUrls}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          className="rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white"
          type="button"
          onClick={onOpenHelp}
        >
          {t.merchantHelp}
        </button>
        <button
          className="rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white"
          type="button"
          onClick={onOpenTables}
        >
          {t.tableUrls}
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-[#f8d45d]/40 bg-[#2a2f25] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f8d45d]">{t.managerUrl}</p>
        <p className="mt-2 text-sm font-bold leading-6 text-white/80">{t.saveManagerUrlWarning}</p>
        <p className="mt-2 break-all font-mono text-sm font-black text-white/80">{managerUrl || t.readying}</p>
        <CopyButton
          className="mt-3 rounded-md bg-[#f8d45d] px-3 py-3 text-sm font-black text-[#23190b]"
          copiedLabel={t.copied}
          label={t.copiedManagerUrl}
          text={managerUrl}
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {shopStats.map(({ shop }) => (
          <button
            key={shop.id}
            className={`shrink-0 rounded-md px-4 py-3 text-left text-sm font-black ${
              selectedShopId === shop.id ? "bg-[#f8d45d] text-[#23190b]" : "bg-white/10 text-white"
            }`}
            type="button"
            onClick={() => onSelectShop(shop.id)}
          >
            <span className="mr-2 text-lg">{shop.emoji}</span>
            {shop.name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label={t.store} value={`${selectedStats.shop.emoji} ${selectedStats.shop.name}`} />
        <Metric label={t.todaySales} value={`${formatUsdc(selectedStats.sales)} USDC`} />
        <Metric label={t.count} value={`${selectedStats.count}`} />
      </div>

      <div className={`mt-3 grid gap-3 ${paymentMode === "arc-mainnet" ? "sm:grid-cols-2" : ""}`}>
        <Metric label={t.network} value={paymentMode === "arc-mainnet" ? "Arc Mainnet / On-chain" : "Test checkout"} />
        {paymentMode === "arc-mainnet" ? (
          <Metric
            label={t.receive}
            value={recipientAddress ? shortHash(recipientAddress) : t.notSet}
          />
        ) : null}
      </div>

      {paymentMode === "arc-mainnet" && !isAddressLike(recipientAddress) ? (
        <p className="mt-3 rounded-lg border border-[#f8d45d]/40 bg-[#f8d45d]/15 px-4 py-3 text-sm font-black text-[#f8d45d]">
          {t.setRecipient}
        </p>
      ) : null}

      <section className="mt-5 rounded-lg border border-white/10 bg-[#101715]">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#99dac7]">Orders</h2>
        </div>
        <div className="divide-y divide-white/10">
          {allRecords.length > 0 ? (
            allRecords.slice(0, 12).map((record) => (
              <div key={record.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[4rem_1fr_auto] sm:items-center">
                <p className="font-mono text-sm text-white/70">{formatTime(record.createdAt)}</p>
                <div>
                  <p className="font-bold">
                    {record.itemName} ×{record.quantity}
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-1 text-xs">{statusLabel(record.status, t)}</span>
                  </p>
                  <p className="text-xs font-bold text-[#99dac7]">{formatUsdc(record.priceUsdc)} USDC</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs font-black text-white/65">
                    <span>Order {record.id.slice(-8)}</span>
                    {record.tableId ? <span>Table {record.tableId}</span> : null}
                    {record.recipientAddress ? <span>To {shortHash(record.recipientAddress)}</span> : null}
                    {record.blockNumber ? <span>Block {record.blockNumber}</span> : null}
                  </div>
                  {record.transactionHash ? (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <a
                        className="inline-block text-xs font-black text-[#f8d45d] underline"
                        href={getTransactionUrl(record.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Tx {shortHash(record.transactionHash)}
                      </a>
                      {record.payerAddress ? (
                        <span className="font-mono text-xs font-black text-white/65">
                          From {shortHash(record.payerAddress)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {record.transactionHash ? (
                    <div className="mt-3 rounded-md border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#99dac7]">{t.transactionUrl}</p>
                      <a
                        className="mt-2 block break-all font-mono text-xs font-black text-white/75 underline"
                        href={getTransactionUrl(record.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {getTransactionUrl(record.transactionHash)}
                      </a>
                      <CopyButton
                        className="mt-3 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white"
                        copiedLabel={t.copied}
                        label={t.copyTransactionUrl}
                        text={getTransactionUrl(record.transactionHash)}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="text-left sm:text-right">
                  <p className={`font-mono text-lg font-black ${isRevenueOrder(record.status) ? "text-[#f8d45d]" : "text-white/55"}`}>
                    {isRevenueOrder(record.status) ? `+${formatUsdc(record.priceUsdc)} USDC` : statusLabel(record.status, t)}
                  </p>
                  {record.status === "ordered" ? (
                    <button
                      className="mt-2 rounded-md bg-[#f8d45d] px-3 py-2 text-sm font-black text-[#23190b]"
                      type="button"
                      onClick={() => onCompleteOrder(record.id)}
                    >
                      Served
                    </button>
                  ) : null}
                  {canCancelOrder(record.status) ? (
                    <button
                      className="mt-2 rounded-md bg-white/10 px-3 py-2 text-sm font-black text-white"
                      type="button"
                      onClick={() => onCancelOrder(record.id)}
                    >
                      {t.cancelOrder}
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-10 text-center text-sm font-bold text-white/55">{t.noOrders}</p>
          )}
        </div>
      </section>
    </section>
  );
}

function statusLabel(status: PaymentRecord["status"], t: Copy) {
  if (status === "ordered") {
    return "ORDERED";
  }
  if (status === "served") {
    return "SERVED";
  }
  if (status === "customer_confirmed") {
    return t.statusCustomerConfirmed;
  }
  if (status === "paid") {
    return "PAID";
  }
  if (status === "recorded") {
    return t.statusRecorded;
  }
  if (status === "pending_wallet") {
    return t.statusPendingWallet;
  }
  if (status === "submitted") {
    return t.statusSubmitted;
  }
  if (status === "confirmed") {
    return "PAID";
  }
  if (status === "completed") {
    return t.statusCompleted;
  }
  if (status === "rejected") {
    return t.statusRejected;
  }
  return t.statusFailed;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">{label}</p>
      <p className="mt-2 break-words text-2xl font-black">{value}</p>
    </div>
  );
}

function TableQrCode({ url, label }: { url: string; label: string }) {
  const qrDataUrl = useMemo(() => {
    if (!url) {
      return "";
    }

    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    return qr.createDataURL(8, 2);
  }, [url]);

  if (!qrDataUrl) {
    return null;
  }

  return (
    <div className="shrink-0 rounded-lg border border-[#d9e3df] bg-white p-3 shadow-sm">
      <Image className="h-36 w-36" src={qrDataUrl} alt={label} width={144} height={144} unoptimized />
    </div>
  );
}

function TablesScreen({
  store,
  storeId,
  adminToken,
  lang,
  statusMessage,
  t,
  onSaveTableCount,
}: {
  store: StoreState;
  storeId: string;
  adminToken: string;
  lang: Lang;
  statusMessage: string;
  t: Copy;
  onSaveTableCount: (tableCount: number) => Promise<void>;
}) {
  const [draftTableCount, setDraftTableCount] = useState(store.tableCount || 6);
  const tableCount = Math.max(1, Math.min(99, Math.floor(draftTableCount || 1)));
  const managerUrl =
    typeof window === "undefined" || !storeId || !adminToken
      ? ""
      : `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(storeId)}&screen=merchant&lang=${lang}&admin=${encodeURIComponent(adminToken)}`;

  function tableUrl(tableNumber: number) {
    if (typeof window === "undefined" || !storeId) {
      return "";
    }

    return `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(storeId)}&table=${tableNumber}&screen=customer&lang=${lang}`;
  }

  return (
    <section className="flex-1 px-4 py-5">
      {statusMessage ? (
        <p className="mb-4 rounded-lg border border-[#d9e3df] bg-white px-4 py-3 text-center text-sm font-bold text-[#53625d]">
          {statusMessage}
        </p>
      ) : null}

      <div className="rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-black text-[#17201d]">{t.tableUrlSettings}</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-[#53625d]">{t.tableCountHelp}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr] sm:items-end">
          <div>
            <label className="field-label" htmlFor="table-count">
              {t.tableCount}
            </label>
            <input
              id="table-count"
              className="text-field mt-2 text-center text-2xl font-black"
              min="1"
              max="99"
              step="1"
              type="number"
              value={draftTableCount}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                setDraftTableCount(Number.isFinite(nextValue) ? Math.max(1, Math.min(99, Math.floor(nextValue))) : 1);
              }}
            />
          </div>
          <button
            className="touch-button buy-button"
            type="button"
            onClick={() => void onSaveTableCount(tableCount)}
          >
            {t.save}
          </button>
        </div>
      </div>

      {managerUrl ? (
        <div className="mt-4 rounded-lg border border-[#0f6b57]/30 bg-[#e7f4ef] p-4">
          <p className="text-lg font-black text-[#0f6b57]">{t.managerUrl}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#53625d]">{t.saveManagerUrlWarning}</p>
          <p className="mt-3 break-all rounded-md bg-white p-3 font-mono text-xs font-bold text-[#17201d]">{managerUrl}</p>
          <CopyButton
            className="mt-3 rounded-md bg-[#0f6b57] px-4 py-3 text-sm font-black text-white"
            copiedLabel={t.copied}
            label={t.copiedManagerUrl}
            text={managerUrl}
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {Array.from({ length: tableCount }, (_, index) => index + 1).map((tableNumber) => {
          const url = tableUrl(tableNumber);

          return (
            <article key={tableNumber} className="rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <TableQrCode url={url} label={`${t.qrCode}: Table ${tableNumber}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-[#17201d]">Table {tableNumber}</p>
                  <p className="mt-1 text-sm font-bold text-[#53625d]">{t.scanQr}</p>
                  <p className="mt-2 break-all rounded-md bg-[#f5f7f6] p-3 font-mono text-xs font-bold text-[#53625d]">
                    {url}
                  </p>
                  <CopyButton
                    className="mt-3 rounded-md bg-[#0f6b57] px-4 py-3 text-sm font-black text-white"
                    copiedLabel={t.copied}
                    label={t.copyTableUrl}
                    text={url}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SettingsScreen({
  store,
  storeId,
  adminToken,
  lang,
  statusMessage,
  t,
  onSaveSettings,
  onResetDemo,
  onOpenHelp,
  onBackToTop,
  onDeleteStore,
}: {
  store: StoreState;
  storeId: string;
  adminToken: string;
  lang: Lang;
  statusMessage: string;
  t: Copy;
  onSaveSettings: (
    nextSettings: Pick<StoreState, "storeName" | "tableCount" | "customerTheme" | "exchangeRateJpyPerUsdc" | "paymentMode" | "recipientAddress" | "shops">,
  ) => Promise<void>;
  onResetDemo: () => void;
  onOpenHelp: () => void;
  onBackToTop: () => void;
  onDeleteStore: () => void;
}) {
  const [draft, setDraft] = useState(() => ({
    storeName: store.storeName,
    tableCount: store.tableCount || 6,
    customerTheme: normalizeTheme(store.customerTheme),
    exchangeRateJpyPerUsdc: store.exchangeRateJpyPerUsdc,
    paymentMode: store.paymentMode,
    recipientAddress: store.recipientAddress || "",
    shops: store.shops,
  }));
  const managerUrl =
    typeof window === "undefined" || !storeId || !adminToken
      ? ""
      : `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(storeId)}&screen=merchant&lang=${lang}&admin=${encodeURIComponent(adminToken)}`;

  function handlePrice(event: FormEvent<HTMLInputElement>, shop: Shop) {
    const value = Number(event.currentTarget.value);
    updateDraftShop(shop.id, {
      priceJpy: Number.isFinite(value)
        ? usdcToStoredPrice(value, draft.exchangeRateJpyPerUsdc)
        : shop.priceJpy,
    });
  }

  function updateDraftShop(shopId: string, nextShop: Partial<Shop>) {
    setDraft((current) => ({
      ...current,
      shops: current.shops.map((shop) => (shop.id === shopId ? { ...shop, ...nextShop } : shop)),
    }));
  }

  function addDraftShop() {
    const shop: Shop = {
      id: createId("shop"),
      emoji: "•",
      name: "New Item",
      description: "One serving",
      imageUrl: "",
      priceJpy: usdcToStoredPrice(1, draft.exchangeRateJpyPerUsdc),
      actionLabel: "Order",
    };

    setDraft((current) => ({
      ...current,
      shops: [...current.shops, shop],
    }));
  }

  function deleteDraftShop(shopId: string) {
    setDraft((current) => {
      if (current.shops.length <= 1) {
        return current;
      }

      return {
        ...current,
        shops: current.shops.filter((shop) => shop.id !== shopId),
      };
    });
  }

  return (
    <section className="flex-1 px-4 py-5">
      {statusMessage ? (
        <p className="mb-4 rounded-lg border border-[#d9e3df] bg-white px-4 py-3 text-center text-sm font-bold text-[#53625d]">
          {statusMessage}
        </p>
      ) : null}

      {managerUrl ? (
        <div className="mb-4 rounded-lg border border-[#0f6b57]/30 bg-[#e7f4ef] p-4">
          <p className="text-lg font-black text-[#0f6b57]">{t.saveManagerUrlTitle}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#53625d]">{t.saveManagerUrlWarning}</p>
          <p className="mt-3 break-all rounded-md bg-white p-3 font-mono text-xs font-bold text-[#17201d]">{managerUrl}</p>
            <CopyButton
              className="mt-3 rounded-md bg-[#0f6b57] px-4 py-3 text-sm font-black text-white"
              copiedLabel={t.copied}
              label={t.copiedManagerUrl}
              text={managerUrl}
            />
        </div>
      ) : null}

      <button className="touch-button small-button mb-4 w-full text-left" type="button" onClick={onOpenHelp}>
        {t.settingsHelp}
      </button>

      <div className="rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <label className="field-label" htmlFor="store-name">
          {t.storeName}
        </label>
        <input
          id="store-name"
          className="text-field mt-2"
          value={draft.storeName}
          onChange={(event) => setDraft((current) => ({ ...current, storeName: event.target.value }))}
        />
      </div>

      <div className="mt-4 rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="field-label">{t.tableUrlSettings}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#53625d]">{t.tableCountHelp}</p>
          </div>
          <a
            className="touch-button small-button text-center"
            href={`/?store=${storeId}&screen=tables&lang=${lang}&admin=${encodeURIComponent(adminToken)}`}
          >
            {t.tableUrls}
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <p className="field-label">{t.customerTheme}</p>
        <p className="mt-2 text-sm font-medium leading-6 text-[#53625d]">{t.customerThemeHelp}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="rounded-lg border border-[#d9e3df] p-3">
            <span className="field-label">{t.customerBackgroundColor}</span>
            <div className="mt-3 flex items-center gap-3">
              <input
                className="h-12 w-16 rounded-md border border-[#d9e3df] bg-white p-1"
                type="color"
                value={draft.customerTheme.backgroundColor}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    customerTheme: {
                      ...current.customerTheme,
                      backgroundColor: event.target.value,
                    },
                  }))
                }
              />
              <span className="font-mono text-sm font-black text-[#53625d]">{draft.customerTheme.backgroundColor}</span>
            </div>
          </label>
          <label className="rounded-lg border border-[#d9e3df] p-3">
            <span className="field-label">{t.customerButtonColor}</span>
            <div className="mt-3 flex items-center gap-3">
              <input
                className="h-12 w-16 rounded-md border border-[#d9e3df] bg-white p-1"
                type="color"
                value={draft.customerTheme.buttonColor}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    customerTheme: {
                      ...current.customerTheme,
                      buttonColor: event.target.value,
                    },
                  }))
                }
              />
              <span className="font-mono text-sm font-black text-[#53625d]">{draft.customerTheme.buttonColor}</span>
            </div>
          </label>
        </div>
        <div
          className="mt-4 rounded-lg border border-[#d9e3df] p-4"
          style={{ backgroundColor: draft.customerTheme.backgroundColor }}
        >
          <button
            className="rounded-md px-4 py-3 text-sm font-black"
            type="button"
            style={{
              backgroundColor: draft.customerTheme.buttonColor,
              color: getReadableTextColor(draft.customerTheme.buttonColor),
            }}
          >
            {t.order}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <p className="field-label">{t.settlementToken}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className={`touch-button border text-base ${
              draft.paymentMode === "demo"
                ? "border-[#0f6b57] bg-[#e7f4ef] text-[#0f6b57]"
                : "border-[#d9e3df] bg-white text-[#53625d]"
            }`}
            type="button"
            aria-pressed={draft.paymentMode === "demo"}
            onClick={() => setDraft((current) => ({ ...current, paymentMode: "demo", recipientAddress: "" }))}
          >
            <span className="block">{t.demoMode}</span>
            {draft.paymentMode === "demo" ? <span className="mt-1 block text-xs">{t.selected}</span> : null}
          </button>
          <button
            className={`touch-button border text-base ${
              draft.paymentMode === "arc-mainnet"
                ? "border-[#0f6b57] bg-[#e7f4ef] text-[#0f6b57]"
                : "border-[#d9e3df] bg-white text-[#53625d]"
            }`}
            type="button"
            aria-pressed={draft.paymentMode === "arc-mainnet"}
            onClick={() => setDraft((current) => ({ ...current, paymentMode: "arc-mainnet" }))}
          >
            <span className="block">Arc USDC</span>
            {draft.paymentMode === "arc-mainnet" ? <span className="mt-1 block text-xs">{t.selected}</span> : null}
          </button>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#53625d]">
          {draft.paymentMode === "arc-mainnet" ? t.arcModeHelp : t.demoModeHelp}
        </p>
        {draft.paymentMode === "arc-mainnet" ? (
          <div className="mt-4">
            <label className="field-label" htmlFor="store-recipient">
              {t.recipient}
            </label>
            <input
              id="store-recipient"
              className="text-field mt-2 font-mono text-sm"
              placeholder="0x..."
              value={draft.recipientAddress}
              onChange={(event) => setDraft((current) => ({ ...current, recipientAddress: event.target.value.trim() }))}
            />
            {!isAddressLike(draft.recipientAddress) ? (
              <p className="mt-2 text-sm font-bold text-[#b62e22]">{t.recipientRequired}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{t.menu}</h2>
      </div>

      <div className="mt-3 grid gap-4">
        {draft.shops.map((shop) => (
          <article key={shop.id} className="rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
            <div className="grid grid-cols-[4.5rem_1fr] gap-3">
              <div>
                <label className="field-label" htmlFor={`${shop.id}-emoji`}>
                  {t.emoji}
                </label>
                <input
                  id={`${shop.id}-emoji`}
                  className="text-field mt-2 text-center text-3xl"
                  maxLength={4}
                  value={shop.emoji}
                  onChange={(event) => updateDraftShop(shop.id, { emoji: event.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor={`${shop.id}-name`}>
                  {t.itemName}
                </label>
                <input
                  id={`${shop.id}-name`}
                  className="text-field mt-2"
                  value={shop.name}
                  onChange={(event) => updateDraftShop(shop.id, { name: event.target.value })}
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor={`${shop.id}-image-url`}>
                  {t.photoUrl}
                </label>
                <input
                  id={`${shop.id}-image-url`}
                  className="text-field mt-2"
                  placeholder="https://example.com/menu-photo.jpg"
                  value={shop.imageUrl || ""}
                  onChange={(event) => updateDraftShop(shop.id, { imageUrl: event.target.value.trim() })}
                />
                {shop.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={shop.name}
                    className="mt-3 aspect-[4/3] w-full max-w-sm rounded-md border border-[#d9e3df] object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    src={shop.imageUrl}
                  />
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor={`${shop.id}-description`}>
                  {t.description}
                </label>
                <textarea
                  id={`${shop.id}-description`}
                  className="text-field mt-2 min-h-24 resize-y leading-6"
                  value={shop.description}
                  onChange={(event) => updateDraftShop(shop.id, { description: event.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor={`${shop.id}-price`}>
                  {t.tokenPrice}
                </label>
                <input
                  id={`${shop.id}-price`}
                  className="text-field mt-2"
                  min="0"
                  step="0.01"
                  type="number"
                  value={calculateUsdcPrice(shop.priceJpy, draft.exchangeRateJpyPerUsdc)}
                  onInput={(event) => handlePrice(event, shop)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor={`${shop.id}-stock`}>
                  {t.stock}
                </label>
                <input
                  id={`${shop.id}-stock`}
                  className="text-field mt-2"
                  min="0"
                  step="1"
                  type="number"
                  value={shop.stock ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    updateDraftShop(shop.id, {
                      stock: value === "" ? undefined : Math.max(0, Math.floor(Number(value) || 0)),
                    });
                  }}
                />
                <p className="mt-2 text-xs font-bold leading-5 text-[#53625d]">{t.stockHelp}</p>
              </div>
              <div>
                <label className="field-label" htmlFor={`${shop.id}-action`}>
                  {t.buttonText}
                </label>
                <input
                  id={`${shop.id}-action`}
                  className="text-field mt-2"
                  value={shop.actionLabel}
                  onChange={(event) => updateDraftShop(shop.id, { actionLabel: event.target.value })}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="rounded-md border border-[#d9e3df] px-4 py-3 text-sm font-bold text-[#b62e22] disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={draft.shops.length <= 1}
                onClick={() => deleteDraftShop(shop.id)}
              >
                {t.delete}
              </button>
            </div>
          </article>
        ))}
        <button className="touch-button border border-[#d9e3df] bg-white text-lg shadow-sm" type="button" onClick={addDraftShop}>
          {t.addMenu}
        </button>
      </div>

      <section className="mt-5 rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">{t.save}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#53625d]">
          {t.saveHelp}
        </p>
        <button
          className="touch-button buy-button mt-4 w-full text-lg"
          type="button"
          onClick={() => void onSaveSettings(draft)}
        >
          {t.saveBack}
        </button>
      </section>

      <section className="mt-5 rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">{t.resetTitle}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#53625d]">
          {t.resetHelp}
        </p>
        <button className="touch-button cancel-button mt-4" type="button" onClick={onResetDemo}>
          {t.resetOrders}
        </button>
      </section>

      <section className="mt-5 rounded-lg border border-[#d9e3df] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">{t.manageTitle}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#53625d]">
          {t.manageHelp}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="touch-button cancel-button" type="button" onClick={onBackToTop}>
            {t.backTop}
          </button>
          <button
            className="touch-button border border-[#d9e3df] bg-white text-[#b62e22]"
            type="button"
            onClick={onDeleteStore}
          >
            {t.deleteDemo}
          </button>
        </div>
      </section>
    </section>
  );
}
