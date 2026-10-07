"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatEther, parseEther, type Address } from "viem";
import { useAppKit } from "@reown/appkit/react";
import { sendTransaction, switchChain } from "wagmi/actions";
import { useAccount, useBalance } from "wagmi";
import type { Customer, StoreResponse, StoreState, PaymentMode, PaymentRecord, Shop, ShopStats } from "@/lib/store-types";
import { ARC_MAINNET_CHAIN_ID, ARC_MAINNET_EXPLORER_URL } from "@/lib/arc-mainnet-config";
import { wagmiAdapter } from "./providers";

type Screen = "home" | "customer" | "merchant" | "settings";
type Lang = "en" | "ja";

const copy = {
  en: {
    back: "Back",
    settings: "Settings",
    createTitle: "Launch a table ordering demo",
    createDemo: "Create Store Demo",
    setupTitle: "Setup",
    setupStep1: "1. Create a store demo URL",
    setupStep2: "2. Configure menu items and payout wallet",
    setupStep3: "3. Use table-specific QR URLs",
    storeId: "Store ID",
    customerView: "Customer View",
    merchantView: "Merchant View",
    settlementToken: "Settlement token",
    payAfterServed: "Pay with Arc USDC after service",
    demoMode: "Demo mode",
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
    copiedUrl: "Copy URL",
    newStore: "New Store",
    store: "STORE",
    todaySales: "TODAY SALES",
    count: "COUNT",
    network: "NETWORK",
    receive: "RECEIVE",
    notSet: "Not set",
    setRecipient: "Set a payout wallet before enabling on-chain orders.",
    noOrders: "No orders yet",
    storeName: "Store demo name",
    paymentMode: "Payment mode",
    selected: "Selected",
    arcModeHelp: "With Arc USDC, the customer pays from their wallet on Arc Mainnet after the order is served.",
    menu: "Menu",
    emoji: "Icon",
    itemName: "Item name",
    description: "Description",
    tokenPrice: "USDC price",
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
    manageTitle: "Store demo management",
    manageHelp: "Return to the start screen to create another store demo, or delete this one.",
    backTop: "Back to start",
    deleteDemo: "Delete this store demo",
    confirmOrderTitle: "Order with USDC?",
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
    recordFailed: "Could not record the update",
    saving: "Saving settings",
    saveFailed: "Could not save settings",
    resetting: "Resetting orders and history",
    resetFailed: "Could not reset",
    deleteConfirm: "Delete this store demo? Orders and sales records will also be deleted.",
    deleting: "Deleting store demo",
    deleteFailed: "Could not delete store demo",
    creating: "Creating a new store demo",
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
    createTitle: "テーブルオーダー店舗デモを開始",
    createDemo: "店舗デモを作成",
    setupTitle: "セットアップ",
    setupStep1: "1. 店舗デモURLを作成",
    setupStep2: "2. メニューと受取ウォレットを設定",
    setupStep3: "3. テーブル別QR URLを利用",
    storeId: "店舗ID",
    customerView: "注文画面",
    merchantView: "店舗画面",
    settlementToken: "決済トークン",
    payAfterServed: "提供後にArc USDCで支払い",
    demoMode: "デモモード",
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
    copiedUrl: "URLをコピー",
    newStore: "新しい店舗",
    store: "店舗",
    todaySales: "本日の売上",
    count: "件数",
    network: "ネットワーク",
    receive: "受取先",
    notSet: "未設定",
    setRecipient: "オンチェーン注文を有効にする前に受取ウォレットを設定してください。",
    noOrders: "まだ注文はありません",
    storeName: "店舗デモ名",
    paymentMode: "支払いモード",
    selected: "選択中",
    arcModeHelp: "Arc USDCでは、商品提供後にお客様のウォレットからArc Mainnetで支払います。",
    menu: "メニュー",
    emoji: "アイコン",
    itemName: "商品名",
    description: "説明",
    tokenPrice: "USDC価格",
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
    manageTitle: "店舗デモ管理",
    manageHelp: "開始画面へ戻って別の店舗デモを作成するか、このデモを削除できます。",
    backTop: "開始画面へ戻る",
    deleteDemo: "この店舗デモを削除",
    confirmOrderTitle: "USDCで注文しますか？",
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
    recordFailed: "記録できませんでした",
    saving: "設定を保存中",
    saveFailed: "設定を保存できません",
    resetting: "注文と履歴をリセット中",
    resetFailed: "リセットできません",
    deleteConfirm: "この店舗デモを削除しますか？注文や売上の記録も削除されます。",
    deleting: "店舗デモを削除中",
    deleteFailed: "店舗デモを削除できません",
    creating: "新しい店舗デモを作成中",
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
const LANGUAGE_STORAGE_KEY = "arctable-language";

const fallbackShops: Shop[] = [
  {
    id: "burger",
    emoji: "🍔",
    name: "Burger",
    description: "Classic table burger",
    priceJpy: 800,
    actionLabel: "Order",
  },
  {
    id: "coffee",
    emoji: "☕",
    name: "Coffee",
    description: "Hot drip coffee",
    priceJpy: 300,
    actionLabel: "Order",
  },
  {
    id: "cake",
    emoji: "🍰",
    name: "Cake",
    description: "Today's dessert",
    priceJpy: 500,
    actionLabel: "Order",
  },
];

const initialState: StoreState = {
  storeName: "ArcTable Demo",
  exchangeRateJpyPerUsdc: INITIAL_EXCHANGE_RATE,
  paymentMode: "demo",
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
  const storeId = fromUrl;

  if (storeId) {
    window.localStorage.setItem(STORE_STORAGE_KEY, storeId);
  }

  return storeId;
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
  return value === "customer" || value === "merchant" || value === "settings" ? value : null;
}

function getLangParam(value: string | null): Lang | null {
  return value === "en" || value === "ja" ? value : null;
}

function getStoreApiUrl(storeId: string, customerId?: string) {
  const params = new URLSearchParams({
    storeId,
  });

  if (customerId) {
    params.set("customerId", customerId);
  }

  return `/api/store?${params.toString()}`;
}

async function fetchStore(storeId: string, customerId: string) {
  const response = await fetch(getStoreApiUrl(storeId, customerId), {
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

function isAddressLike(value?: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || "");
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

async function sendArcPayment(
  shop: Shop,
  priceUsdc: number,
  connectedAddress: string | null,
) {
  if (!connectedAddress) {
    throw new Error("wallet_missing");
  }

  if (!isAddressLike(shop.recipientAddress)) {
    throw new Error("recipient_missing");
  }

  await switchChain(wagmiAdapter.wagmiConfig, {
    chainId: ARC_MAINNET_CHAIN_ID,
  });

  const hash = await sendTransaction(wagmiAdapter.wagmiConfig, {
    to: shop.recipientAddress as Address,
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
  const [tableId, setTableId] = useState("1");
  const [store, setStore] = useState<StoreState>(initialState);
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(fallbackCustomer);
  const [selectedShopId, setSelectedShopId] = useState(fallbackShops[0].id);
  const [confirmShopId, setConfirmShopId] = useState<string | null>(null);
  const [successItemName, setSuccessItemName] = useState<string | null>(null);
  const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(copy.en.loading);
  const [walletMessage, setWalletMessage] = useState("");

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
    const customerId = getCustomerId(storeId);

    async function refresh() {
      try {
        const nextStore = await fetchStore(storeId, customerId);
        if (!isActive) {
          return;
        }
        if (screen !== "settings") {
          setStore({
            storeName: nextStore.storeName,
            exchangeRateJpyPerUsdc: nextStore.exchangeRateJpyPerUsdc,
            paymentMode: nextStore.paymentMode,
            shops: nextStore.shops,
            customers: nextStore.customers,
            payments: nextStore.payments,
          });
        }
        setCurrentCustomer(nextStore.currentCustomer);
        setSelectedShopId((current) => nextStore.shops.find((shop) => shop.id === current)?.id || nextStore.shops[0]?.id || "");
        if (screen !== "settings") {
          setStatusMessage("");
        }
      } catch {
        if (isActive) {
          setStatusMessage(t.loadFailed);
        }
      }
    }

    void refresh();
    const shouldKeepRefreshing = screen === "customer" || screen === "merchant";
    const timer = shouldKeepRefreshing ? window.setInterval(refresh, 5000) : null;

    return () => {
      isActive = false;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [storeId, screen, t.loadFailed]);

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

    const nextStore = await fetchStore(storeId, currentCustomer.id);
    setStore({
      storeName: nextStore.storeName,
      exchangeRateJpyPerUsdc: nextStore.exchangeRateJpyPerUsdc,
      paymentMode: nextStore.paymentMode,
      shops: nextStore.shops,
      customers: nextStore.customers,
      payments: nextStore.payments,
    });
    setCurrentCustomer(nextStore.currentCustomer);
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

    setConfirmShopId(null);
    setStatusMessage(t.sendingOrder);

    try {
      const response = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase",
          storeId,
          customerId: currentCustomer.id,
          shopId: shop.id,
          mode: store.paymentMode,
          status: "ordered",
          tableId,
        }),
      });

      if (!response.ok) {
        setStatusMessage(t.orderFailed);
        await refreshStore();
        return;
      }

      setSuccessItemName(shop.name);
      const result = (await response.clone().json().catch(() => null)) as { payment?: PaymentRecord } | null;
      setSuccessPaymentId(result?.payment?.id || null);
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

    if (store.paymentMode === "arc-mainnet" && !isAddressLike(shop.recipientAddress)) {
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
      const transactionHash = await sendArcPayment(shop, order.priceUsdc, walletAddress || null);

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
        body: JSON.stringify({ action: "serve_order", storeId, orderId }),
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

  async function saveSettings(
    nextSettings: Pick<StoreState, "storeName" | "exchangeRateJpyPerUsdc" | "paymentMode" | "shops">,
  ) {
    if (!storeId) {
      return false;
    }

    setStore((current) => ({ ...current, ...nextSettings }));
    setStatusMessage(t.saving);

    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "settings",
          storeId,
          ...nextSettings,
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
    setStatusMessage(t.resetting);

    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", storeId }),
      });
      setStatusMessage("");
      await refreshStore();
    } catch {
      setStatusMessage(t.resetFailed);
    }
  }

  function goToCreationTop() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(STORE_STORAGE_KEY);
    window.history.pushState(null, "", window.location.pathname);
    setStoreId("");
    setStore(initialState);
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
        body: JSON.stringify({ action: "delete_store", storeId }),
      });
      goToCreationTop();
    } catch {
      setStatusMessage(t.deleteFailed);
    }
  }

  function createNewStore() {
    if (typeof window === "undefined") {
      return;
    }

    const nextStoreId = createId("store").replace(/[^a-z0-9-]/g, "-").slice(0, 32);
    const params = new URLSearchParams(window.location.search);
    params.set("store", nextStoreId);
    params.set("screen", "settings");
    params.set("lang", lang);
    window.localStorage.setItem(STORE_STORAGE_KEY, nextStoreId);
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
    setStore(initialState);
    setCurrentCustomer(fallbackCustomer);
    setSuccessItemName(null);
    setSuccessPaymentId(null);
    setConfirmShopId(null);
    setStatusMessage(t.creating);
    setStoreId(nextStoreId);
    setScreen("settings");
  }

  return (
    <main className="min-h-dvh bg-[#fff8e8] text-[#20140c]">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
        {screen !== "home" ? (
          <header className="sticky top-0 z-20 border-b border-[#ead7aa] bg-[#fff8e8]/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <button
                className="touch-button small-button"
                type="button"
                onClick={() => setScreen(screen === "settings" ? "merchant" : "home")}
              >
                {t.back}
              </button>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#96631d]">ArcTable</p>
                <p className="max-w-[13rem] truncate text-lg font-black sm:max-w-none">{store.storeName}</p>
              </div>
              {screen === "merchant" ? (
                <div className="flex items-center gap-2">
                  <button className="touch-button small-button hidden sm:block" type="button" onClick={goToCreationTop}>
                    TOP
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
            shops={store.shops}
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
          />
        ) : null}

        {screen === "merchant" ? (
          <MerchantScreen
            storeId={storeId}
            selectedShopId={effectiveSelectedShopId}
            selectedStats={selectedStats}
            shopStats={shopStats}
            total={storeTotal}
            paymentMode={store.paymentMode}
            t={t}
            lang={lang}
            onSelectShop={setSelectedShopId}
            onCompleteOrder={(orderId) => void completeHandOver(orderId)}
            onCreateNewStore={createNewStore}
          />
        ) : null}

        {screen === "settings" ? (
          <SettingsScreen
            store={store}
            statusMessage={statusMessage}
            t={t}
            onSaveSettings={async (nextSettings) => {
              const didSave = await saveSettings(nextSettings);
              if (didSave) {
                setScreen("merchant");
              }
            }}
            onResetDemo={() => void resetDemo()}
            onBackToTop={goToCreationTop}
            onDeleteStore={() => void deleteCurrentStore()}
          />
        ) : null}
      </div>

      {confirmShop ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/45 px-4">
          <section className="w-full max-w-sm rounded-[24px] bg-white p-5 text-center shadow-2xl">
            <div className="text-6xl">{confirmShop.emoji}</div>
            <h2 className="mt-3 text-2xl font-black">
              {confirmShop.name} / {formatUsdc(calculateUsdcPrice(confirmShop.priceJpy, store.exchangeRateJpyPerUsdc))} USDC
            </h2>
            <p className="mt-2 text-lg font-black text-[#20140c]">{t.confirmOrderTitle}</p>
            {store.paymentMode === "arc-mainnet" ? (
              <p className="mt-2 rounded-[14px] bg-[#d8f8c7] px-3 py-2 text-sm font-black text-[#32611f]">
                {t.payAfterServedNote}
              </p>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="touch-button cancel-button" type="button" onClick={() => setConfirmShopId(null)}>
                {t.cancel}
              </button>
              <button
                className="touch-button buy-button"
                type="button"
                disabled={
                  store.paymentMode === "arc-mainnet" && !isAddressLike(confirmShop.recipientAddress)
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
  lang,
  t,
  onLanguageChange,
  onCreateStore,
  onNavigate,
}: {
  storeName: string;
  storeId: string;
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
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a3f2c]">ArcTable</p>
            <LanguageToggle lang={lang} onChange={onLanguageChange} />
          </div>
          <h1 className="mt-2 text-4xl font-black leading-tight text-[#25130a] sm:text-6xl">
            {t.createTitle}
          </h1>
        </div>

        <div className="grid flex-1 content-center gap-4">
          <a
            className="role-button bg-[#ffdf63]"
            href={`/?store=arctable-demo&screen=settings&lang=${lang}`}
            onPointerDown={onCreateStore}
          >
            <span className="text-7xl">🍽️</span>
            <span>{t.createDemo}</span>
          </a>
          <div className="rounded-[24px] bg-white p-5 text-center shadow-sm">
            <p className="text-lg font-black text-[#7b4b21]">{t.setupTitle}</p>
            <div className="mt-3 grid gap-2 text-left text-base font-bold leading-7 text-[#6b4b2f]">
              <p>{t.setupStep1}</p>
              <p>{t.setupStep2}</p>
              <p>{t.setupStep3}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col px-5 py-8">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a3f2c]">ArcTable</p>
        <h1 className="mt-2 text-4xl font-black leading-tight text-[#25130a] sm:text-6xl">{storeName}</h1>
        {storeId ? (
          <p className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-black text-[#7b4b21]">
            {t.storeId}: {storeId}
          </p>
        ) : null}
      </div>

      <div className="grid flex-1 content-center gap-4 sm:grid-cols-2">
        <a
          className="role-button bg-[#ffdf63]"
          href={`/?store=${storeId}&screen=customer&lang=${lang}`}
          onPointerDown={() => onNavigate("customer")}
        >
          <span className="text-7xl">📱</span>
          <span>{t.customerView}</span>
        </a>
        <a
          className="role-button bg-[#7bd7c6]"
          href={`/?store=${storeId}&screen=merchant&lang=${lang}`}
          onPointerDown={() => onNavigate("merchant")}
        >
          <span className="text-7xl">🏪</span>
          <span>{t.merchantView}</span>
        </a>
      </div>
    </section>
  );
}

function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-md border border-[#ead7aa] bg-white text-xs font-black">
      {(["en", "ja"] as const).map((item) => (
        <button
          key={item}
          className={`px-3 py-2 ${lang === item ? "bg-[#20140c] text-white" : "text-[#6b4b2f]"}`}
          type="button"
          onClick={() => onChange(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function CustomerScreen({
  customer,
  paymentMode,
  shops,
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
  onCloseSuccess,
}: {
  customer: Customer;
  paymentMode: PaymentMode;
  shops: Shop[];
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
  onCloseSuccess: () => void;
}) {
  return (
    <section className="flex-1 px-4 py-5">
      <div className="mb-4 rounded-[24px] bg-white p-4 text-center shadow-sm">
        <p className="text-lg font-black text-[#8a3b1e]">Table {tableId}</p>
        <p className="mt-2 text-sm font-black text-[#7b4b21]">
          {paymentMode === "arc-mainnet" ? t.payAfterServed : t.demoMode}
        </p>
      </div>

      {paymentMode === "demo" ? (
        <div className="rounded-[28px] bg-[#ffed9f] p-5 text-center shadow-sm">
          <p className="text-base font-black text-[#8a3b1e]">{customer.name}</p>
          <p className="text-xl font-black text-[#8a3b1e]">{t.customerNotice}</p>
        </div>
      ) : (
        <div className="rounded-[28px] bg-[#d8f8c7] p-5 text-center shadow-sm">
          <p className="text-base font-black text-[#32611f]">{customer.name}</p>
          <p className="text-xl font-black text-[#32611f]">{t.walletTitle}</p>
          {walletAddress ? (
            <>
              <p className="mt-2 font-mono text-2xl font-black">{shortHash(walletAddress)}</p>
              <p className="mt-1 text-4xl font-black">{walletBalanceUsdc === null ? "--" : formatUsdc(walletBalanceUsdc)} USDC</p>
            </>
          ) : (
            <button className="touch-button buy-button mt-3 w-full text-xl" type="button" onClick={onConnectWallet}>
              {t.connectWallet}
            </button>
          )}
          <p className="mt-2 text-sm font-bold text-[#47713a]">{t.connectedWallet}</p>
          {walletMessage ? <p className="mt-2 text-sm font-black text-[#32611f]">{walletMessage}</p> : null}
        </div>
      )}

      {statusMessage ? (
        <p className="mt-3 rounded-[18px] bg-white px-4 py-3 text-center text-base font-black text-[#7b4b21]">
          {statusMessage}
        </p>
      ) : null}

      {activeOrder ? (
        <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8a3b1e]">Current Order</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">{activeOrder.itemName}</h2>
              <p className="mt-1 text-sm font-bold text-[#755032]">
                Order {activeOrder.id.slice(-8)} / {formatUsdc(activeOrder.priceUsdc)} USDC
              </p>
            </div>
            <span className="rounded-full bg-[#fff0c2] px-3 py-2 text-sm font-black text-[#7b4b21]">
              {statusLabel(activeOrder.status, t)}
            </span>
          </div>
          {activeOrder.status === "served" ? (
            <button
              className="touch-button buy-button mt-4 w-full text-xl"
              type="button"
              onClick={() => onConfirmServedOrder(activeOrder)}
            >
              {t.receivedPay}
            </button>
          ) : null}
          {activeOrder.status === "paid" ? (
            <p className="mt-4 rounded-[18px] bg-[#d8f8c7] px-4 py-3 text-center text-base font-black text-[#32611f]">
              {t.paidSynced}
            </p>
          ) : null}
        </section>
      ) : null}

      {successItemName ? (
        <section className="mt-4 rounded-[28px] bg-[#d8f8c7] p-5 text-center shadow-sm">
          <p className="text-5xl">🎉</p>
          <h2 className="mt-2 text-3xl font-black">
            {successPayment?.status === "completed" || successPayment?.status === "paid" ? t.orderComplete : t.orderSubmitted}
          </h2>
          <p className="mt-2 text-xl font-bold">
            {successPayment?.status === "completed" ? (
              t.thankYou
            ) : (
              `${successItemName} ${t.orderSubmitted}`
            )}
          </p>
          {successPayment ? (
            <div className="mt-3 rounded-[18px] bg-white/70 px-3 py-3 text-sm font-black text-[#32611f]">
              <p>{t.orderId} {successPayment.id.slice(-8)}</p>
              <p>
                {successPayment.itemName} / {formatUsdc(successPayment.priceUsdc)} USDC
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
          const hasRecipient = isAddressLike(shop.recipientAddress);
          const canBuy = !activeOrder && (paymentMode === "arc-mainnet" ? hasRecipient : true);
          const buttonLabel =
            paymentMode === "arc-mainnet"
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
            <article key={shop.id} className="rounded-[28px] border-4 border-white bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="grid size-20 place-items-center rounded-[24px] bg-[#fff0c2] text-5xl">{shop.emoji}</div>
                <div>
                  <h2 className="text-3xl font-black">{shop.name}</h2>
                  <p className="text-xl font-bold text-[#755032]">{shop.description}</p>
                </div>
              </div>
              <p className="mt-1 text-center text-5xl font-black text-[#c33d2d]">{formatUsdc(priceUsdc)} USDC</p>
              <button
                className="touch-button buy-button mt-4 w-full text-3xl"
                type="button"
                disabled={!canBuy}
                onClick={handleShopButton}
              >
                {buttonLabel}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MerchantScreen({
  storeId,
  selectedShopId,
  selectedStats,
  shopStats,
  total,
  paymentMode,
  t,
  lang,
  onSelectShop,
  onCompleteOrder,
  onCreateNewStore,
}: {
  storeId: string;
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
  t: Copy;
  lang: Lang;
  onSelectShop: (shopId: string) => void;
  onCompleteOrder: (orderId: string) => void;
  onCreateNewStore: () => void;
}) {
  if (!selectedStats) {
    return null;
  }

  const storeUrl =
    typeof window === "undefined" || !storeId
      ? ""
      : `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(storeId)}&table=1&screen=customer&lang=${lang}`;

  return (
    <section className="flex-1 bg-[#17201d] px-4 py-5 text-white">
      <div className="rounded-lg border border-white/10 bg-[#22312c] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#99dac7]">Paid Total</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-4xl font-black">{formatUsdc(total)} USDC</p>
          <p className="pb-1 text-sm font-bold text-white/70">
            {paymentMode === "arc-mainnet" ? "Arc Mainnet / On-chain" : "Arc Mainnet / Demo"}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-[#22312c] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#99dac7]">{t.tableOrderUrl}</p>
        <p className="mt-2 break-all font-mono text-sm font-black text-white/80">{storeUrl || t.readying}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="rounded-md bg-[#f8d45d] px-3 py-3 text-sm font-black text-[#23190b]"
            type="button"
            onClick={() => {
              if (storeUrl) {
                void navigator.clipboard?.writeText(storeUrl);
              }
            }}
          >
            {t.copiedUrl}
          </button>
          <button
            className="rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white"
            type="button"
            onClick={onCreateNewStore}
          >
            {t.newStore}
          </button>
        </div>
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

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Metric label={t.network} value={paymentMode === "arc-mainnet" ? "Arc Mainnet / On-chain" : "Arc Mainnet / Demo"} />
        <Metric
          label={t.receive}
          value={selectedStats.shop.recipientAddress ? shortHash(selectedStats.shop.recipientAddress) : t.notSet}
        />
      </div>

      {paymentMode === "arc-mainnet" && !isAddressLike(selectedStats.shop.recipientAddress) ? (
        <p className="mt-3 rounded-lg border border-[#f8d45d]/40 bg-[#f8d45d]/15 px-4 py-3 text-sm font-black text-[#f8d45d]">
          {t.setRecipient}
        </p>
      ) : null}

      <section className="mt-5 rounded-lg border border-white/10 bg-[#101715]">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#99dac7]">Orders</h2>
        </div>
        <div className="divide-y divide-white/10">
          {selectedStats.records.length > 0 ? (
            selectedStats.records.slice(0, 12).map((record) => (
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
                        href={`${ARC_MAINNET_EXPLORER_URL}/tx/${record.transactionHash}`}
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
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-mono text-lg font-black text-[#f8d45d]">+{formatUsdc(record.priceUsdc)} USDC</p>
                  {record.status === "ordered" ? (
                    <button
                      className="mt-2 rounded-md bg-[#f8d45d] px-3 py-2 text-sm font-black text-[#23190b]"
                      type="button"
                      onClick={() => onCompleteOrder(record.id)}
                    >
                      Served
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

function SettingsScreen({
  store,
  statusMessage,
  t,
  onSaveSettings,
  onResetDemo,
  onBackToTop,
  onDeleteStore,
}: {
  store: StoreState;
  statusMessage: string;
  t: Copy;
  onSaveSettings: (
    nextSettings: Pick<StoreState, "storeName" | "exchangeRateJpyPerUsdc" | "paymentMode" | "shops">,
  ) => Promise<void>;
  onResetDemo: () => void;
  onBackToTop: () => void;
  onDeleteStore: () => void;
}) {
  const [draft, setDraft] = useState(() => ({
    storeName: store.storeName,
    exchangeRateJpyPerUsdc: store.exchangeRateJpyPerUsdc,
    paymentMode: store.paymentMode,
    shops: store.shops,
  }));

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
      emoji: "🍽️",
      name: "New Item",
      description: "One serving",
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
        <p className="mb-4 rounded-lg bg-[#fff0c2] px-4 py-3 text-center text-sm font-black text-[#7b4b21]">
          {statusMessage}
        </p>
      ) : null}

      <div className="rounded-lg bg-white p-4 shadow-sm">
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

      <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
        <p className="field-label">{t.settlementToken}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className={`touch-button border-4 text-base ${
              draft.paymentMode === "demo"
                ? "border-[#d84630] bg-[#ffdf63] text-[#23190b] shadow-[0_6px_0_rgba(91,52,20,0.18)]"
                : "border-[#ead7aa] bg-[#f7efe2] text-[#6b4b2f]"
            }`}
            type="button"
            aria-pressed={draft.paymentMode === "demo"}
            onClick={() => setDraft((current) => ({ ...current, paymentMode: "demo" }))}
          >
            <span className="block">{t.demoMode}</span>
            {draft.paymentMode === "demo" ? <span className="mt-1 block text-xs">{t.selected}</span> : null}
          </button>
          <button
            className={`touch-button border-4 text-base ${
              draft.paymentMode === "arc-mainnet"
                ? "border-[#d84630] bg-[#7bd7c6] text-[#12352f] shadow-[0_6px_0_rgba(91,52,20,0.18)]"
                : "border-[#ead7aa] bg-[#f7efe2] text-[#6b4b2f]"
            }`}
            type="button"
            aria-pressed={draft.paymentMode === "arc-mainnet"}
            onClick={() => setDraft((current) => ({ ...current, paymentMode: "arc-mainnet" }))}
          >
            <span className="block">Arc USDC</span>
            {draft.paymentMode === "arc-mainnet" ? <span className="mt-1 block text-xs">{t.selected}</span> : null}
          </button>
        </div>
        <p className="mt-3 text-sm font-bold leading-6 text-[#6b4b2f]">
          {t.arcModeHelp}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black">{t.menu}</h2>
      </div>

      <div className="mt-3 grid gap-4">
        {draft.shops.map((shop) => (
          <article key={shop.id} className="rounded-lg bg-white p-4 shadow-sm">
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

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label" htmlFor={`${shop.id}-description`}>
                  {t.description}
                </label>
                <input
                  id={`${shop.id}-description`}
                  className="text-field mt-2"
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

            <div className="mt-3">
              <label className="field-label" htmlFor={`${shop.id}-recipient`}>
                {t.recipient}
              </label>
              <input
                id={`${shop.id}-recipient`}
                className="text-field mt-2 font-mono text-sm"
                placeholder="0x..."
                value={shop.recipientAddress || ""}
                onChange={(event) => updateDraftShop(shop.id, { recipientAddress: event.target.value.trim() })}
              />
              {draft.paymentMode === "arc-mainnet" && !isAddressLike(shop.recipientAddress) ? (
                <p className="mt-2 text-sm font-black text-[#b62e22]">{t.recipientRequired}</p>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="rounded-md border border-[#d84630] px-4 py-3 text-sm font-black text-[#b62e22] disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={draft.shops.length <= 1}
                onClick={() => deleteDraftShop(shop.id)}
              >
                {t.delete}
              </button>
            </div>
          </article>
        ))}
        <button className="touch-button border-4 border-white bg-[#ffdf63] text-xl shadow-[0_8px_0_rgba(91,52,20,0.14)]" type="button" onClick={addDraftShop}>
          {t.addMenu}
        </button>
      </div>

      <section className="mt-5 rounded-lg border border-[#ead7aa] bg-[#fff0c2] p-4">
        <h2 className="text-lg font-black">{t.save}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-[#6b4b2f]">
          {t.saveHelp}
        </p>
        <button
          className="touch-button buy-button mt-4 w-full text-xl"
          type="button"
          onClick={() => void onSaveSettings(draft)}
        >
          {t.saveBack}
        </button>
      </section>

      <section className="mt-5 rounded-lg border border-[#ead7aa] bg-[#fff0c2] p-4">
        <h2 className="text-lg font-black">{t.resetTitle}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-[#6b4b2f]">
          {t.resetHelp}
        </p>
        <button className="touch-button cancel-button mt-4" type="button" onClick={onResetDemo}>
          {t.resetOrders}
        </button>
      </section>

      <section className="mt-5 rounded-lg border border-[#ead7aa] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black">{t.manageTitle}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-[#6b4b2f]">
          {t.manageHelp}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="touch-button cancel-button" type="button" onClick={onBackToTop}>
            {t.backTop}
          </button>
          <button
            className="touch-button border-2 border-[#d84630] bg-white text-[#b62e22]"
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
