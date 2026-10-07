import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPublicClient, formatEther, getAddress, http, parseEther, type Hash } from "viem";
import { arcMainnet } from "./arc-mainnet";
import type { Customer, StoreState, PaymentMode, PaymentRecord, Shop } from "./store-types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORES_DIR = path.join(DATA_DIR, "stores");
const DEFAULT_STORE_ID = "demo-store";
const INITIAL_BALANCE = 50;
const INITIAL_EXCHANGE_RATE = 100;

export const defaultShops: Shop[] = [
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
  shops: defaultShops,
  customers: [],
  payments: [],
};

export function calculateUsdcPrice(priceJpy: number, exchangeRateJpyPerUsdc: number) {
  return priceJpy / Math.max(1, exchangeRateJpyPerUsdc);
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeStoreId(value?: string | null) {
  const normalized = (value || DEFAULT_STORE_ID)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return normalized || DEFAULT_STORE_ID;
}

function isAddressLike(value?: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || "");
}

function toUsdcAmount(value: number) {
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizePayment(payment: PaymentRecord): PaymentRecord {
  const status = (payment as { status: string }).status;

  if (status === "pending") {
    return { ...payment, status: payment.transactionHash ? "submitted" : "pending_wallet" };
  }

  return {
    ...payment,
    mode: payment.mode === "arc-mainnet" ? "arc-mainnet" : payment.mode === "demo" ? "demo" : "arc-mainnet",
    status: status === "confirmed" ? "paid" : status === "recorded" ? "ordered" : payment.status,
    priceUsdc: typeof payment.priceUsdc === "number" ? payment.priceUsdc : 0,
    exchangeRateJpyPerUsdc:
      typeof payment.exchangeRateJpyPerUsdc === "number"
        ? payment.exchangeRateJpyPerUsdc
        : INITIAL_EXCHANGE_RATE,
  };
}

export function createCustomer(customerId: string, count: number): Customer {
  return {
    id: customerId,
    name: `Guest ${count + 1}`,
    balanceUsdc: INITIAL_BALANCE,
    createdAt: new Date().toISOString(),
  };
}

function getRedisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.STORAGE_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.STORAGE_KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.STORAGE_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.STORAGE_KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url: url.replace(/\/$/, ""), token };
}

function getRedisKey(storeId: string) {
  return `arctable:restaurant:${normalizeStoreId(storeId)}`;
}

function getStoreFile(storeId: string) {
  return path.join(STORES_DIR, `${normalizeStoreId(storeId)}.json`);
}

async function readStoredState(storeId: string) {
  const redis = getRedisConfig();

  if (redis) {
    const response = await fetch(`${redis.url}/get/${encodeURIComponent(getRedisKey(storeId))}`, {
      headers: {
        Authorization: `Bearer ${redis.token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("redis_read_failed");
    }

    const payload = (await response.json()) as { result: string | null };
    return payload.result;
  }

  return readFile(getStoreFile(storeId), "utf8");
}

async function saveState(storeId: string, state: StoreState) {
  const redis = getRedisConfig();

  if (redis) {
    const response = await fetch(`${redis.url}/set/${encodeURIComponent(getRedisKey(storeId))}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redis.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });

    if (!response.ok) {
      throw new Error("redis_write_failed");
    }

    return;
  }

  await mkdir(STORES_DIR, { recursive: true });
  await writeFile(getStoreFile(storeId), JSON.stringify(state, null, 2));
}

export async function deleteStoreState(storeId: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const redis = getRedisConfig();

  if (redis) {
    const response = await fetch(`${redis.url}/del/${encodeURIComponent(getRedisKey(normalizedStoreId))}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redis.token}`,
      },
    });

    if (!response.ok) {
      throw new Error("redis_delete_failed");
    }

    return { ok: true as const, storeId: normalizedStoreId };
  }

  try {
    await unlink(getStoreFile(normalizedStoreId));
  } catch {
    // Deleting an already-missing store should still return the user to the app top.
  }

  return { ok: true as const, storeId: normalizedStoreId };
}

function normalizeState(parsed: Partial<StoreState>): StoreState {
  const customers = Array.isArray(parsed.customers)
    ? parsed.customers.map((customer) => {
        return {
          ...customer,
          balanceUsdc: typeof customer.balanceUsdc === "number" ? customer.balanceUsdc : INITIAL_BALANCE,
        };
      })
    : [];

  return {
    storeName: parsed.storeName || initialState.storeName,
    exchangeRateJpyPerUsdc:
      typeof parsed.exchangeRateJpyPerUsdc === "number" && parsed.exchangeRateJpyPerUsdc > 0
        ? parsed.exchangeRateJpyPerUsdc
        : initialState.exchangeRateJpyPerUsdc,
    paymentMode: parsed.paymentMode === "arc-mainnet" ? "arc-mainnet" : "demo",
    shops: Array.isArray(parsed.shops) && parsed.shops.length > 0 ? parsed.shops : defaultShops,
    customers,
    payments: Array.isArray(parsed.payments) ? parsed.payments.map(normalizePayment) : [],
  };
}

export async function readState(storeId = DEFAULT_STORE_ID): Promise<StoreState> {
  const normalizedStoreId = normalizeStoreId(storeId);

  try {
    const raw = await readStoredState(normalizedStoreId);
    if (!raw) {
      throw new Error("store_not_found");
    }

    const parsed = JSON.parse(raw) as Partial<StoreState>;

    return normalizeState(parsed);
  } catch {
    await saveState(normalizedStoreId, initialState);
    return initialState;
  }
}

export async function ensureCustomer(storeId: string, customerId: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const currentCustomer = state.customers.find((customer) => customer.id === customerId);

  if (currentCustomer) {
    return { ...state, storeId: normalizedStoreId, currentCustomer };
  }

  const nextCustomer = createCustomer(customerId, state.customers.length);
  const nextState = {
    ...state,
    customers: [...state.customers, nextCustomer],
  };
  await saveState(normalizedStoreId, nextState);

  return { ...nextState, storeId: normalizedStoreId, currentCustomer: nextCustomer };
}

export async function updateSettings(
  storeId: string,
  nextSettings: Pick<StoreState, "storeName" | "exchangeRateJpyPerUsdc" | "paymentMode" | "shops">,
) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const nextState: StoreState = {
    ...state,
    storeName: nextSettings.storeName,
    exchangeRateJpyPerUsdc: Math.max(1, nextSettings.exchangeRateJpyPerUsdc),
    paymentMode: nextSettings.paymentMode,
    shops: nextSettings.shops.length > 0 ? nextSettings.shops : state.shops,
  };

  await saveState(normalizedStoreId, nextState);
  return nextState;
}

type PurchaseChainData = {
  mode?: PaymentMode;
  status?: PaymentRecord["status"];
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  payerAddress?: string;
  tableId?: string;
};

export async function recordPurchase(storeId: string, customerId: string, shopId: string, chainData: PurchaseChainData = {}) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const customer = state.customers.find((item) => item.id === customerId);
  const shop = state.shops.find((item) => item.id === shopId);

  if (!customer || !shop) {
    return { ok: false as const, reason: "not_found", state };
  }

  const priceUsdc = calculateUsdcPrice(shop.priceJpy, state.exchangeRateJpyPerUsdc);

  const payment: PaymentRecord = {
    id: createId("pay"),
    tableId: chainData.tableId,
    customerId: customer.id,
    customerName: customer.name,
    shopId: shop.id,
    itemName: shop.name,
    priceJpy: shop.priceJpy,
    priceUsdc,
    exchangeRateJpyPerUsdc: state.exchangeRateJpyPerUsdc,
    quantity: 1,
    createdAt: new Date().toISOString(),
    mode: chainData.mode || state.paymentMode,
    status: chainData.status || "ordered",
    recipientAddress: shop.recipientAddress,
    payerAddress: chainData.payerAddress,
    transactionHash: chainData.transactionHash,
    blockNumber: chainData.blockNumber,
    gasUsed: chainData.gasUsed,
  };

  const nextState: StoreState = {
    ...state,
    payments: [payment, ...state.payments],
  };
  await saveState(normalizedStoreId, nextState);

  return { ok: true as const, payment, state: nextState };
}

export async function createOnchainOrder(
  storeId: string,
  customerId: string,
  shopId: string,
  payerAddress: string,
  tableId?: string,
) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const customer = state.customers.find((item) => item.id === customerId);
  const shop = state.shops.find((item) => item.id === shopId);

  if (!customer || !shop) {
    return { ok: false as const, reason: "not_found", state };
  }

  if (!isAddressLike(shop.recipientAddress)) {
    return { ok: false as const, reason: "recipient_missing", state };
  }

  if (!isAddressLike(payerAddress)) {
    return { ok: false as const, reason: "payer_missing", state };
  }

  const priceUsdc = calculateUsdcPrice(shop.priceJpy, state.exchangeRateJpyPerUsdc);
  const now = new Date().toISOString();
  const payment: PaymentRecord = {
    id: createId("order"),
    tableId,
    customerId: customer.id,
    customerName: customer.name,
    shopId: shop.id,
    itemName: shop.name,
    priceJpy: shop.priceJpy,
    priceUsdc,
    exchangeRateJpyPerUsdc: state.exchangeRateJpyPerUsdc,
    quantity: 1,
    createdAt: now,
    mode: "arc-mainnet",
    status: "pending_wallet",
    recipientAddress: shop.recipientAddress,
    payerAddress,
  };

  const nextState = {
    ...state,
    payments: [payment, ...state.payments],
  };
  await saveState(normalizedStoreId, nextState);

  return { ok: true as const, payment, state: nextState };
}

export async function markOrderSubmitted(storeId: string, orderId: string, transactionHash: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const payment = state.payments.find((item) => item.id === orderId);

  if (!payment || payment.mode !== "arc-mainnet") {
    return { ok: false as const, reason: "not_found", state };
  }

  const now = new Date().toISOString();
  const nextState: StoreState = {
    ...state,
    payments: state.payments.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: "submitted",
            transactionHash,
            submittedAt: now,
          }
        : item,
    ),
  };
  await saveState(normalizedStoreId, nextState);

  return { ok: true as const, payment: nextState.payments.find((item) => item.id === orderId), state: nextState };
}

export async function rejectOrder(storeId: string, orderId: string, errorMessage?: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const now = new Date().toISOString();
  const nextState: StoreState = {
    ...state,
    payments: state.payments.map((item) =>
      item.id === orderId && item.status !== "paid" && item.status !== "completed"
        ? {
            ...item,
            status: "rejected",
            completedAt: now,
            errorMessage,
          }
        : item,
    ),
  };
  await saveState(normalizedStoreId, nextState);

  return { ok: true as const, state: nextState };
}

export async function verifyOnchainOrder(storeId: string, orderId: string, transactionHash: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const payment = state.payments.find((item) => item.id === orderId);

  if (!payment || payment.mode !== "arc-mainnet") {
    return { ok: false as const, reason: "not_found", state };
  }

  if (!payment.recipientAddress || !payment.payerAddress) {
    return { ok: false as const, reason: "payment_details_missing", state };
  }

  const publicClient = createPublicClient({
    chain: arcMainnet,
    transport: http(),
  });
  const [tx, receipt] = await Promise.all([
    publicClient.getTransaction({ hash: transactionHash as Hash }),
    publicClient.getTransactionReceipt({ hash: transactionHash as Hash }),
  ]);
  const expectedValue = parseEther(toUsdcAmount(payment.priceUsdc));
  const fromMatches = getAddress(tx.from) === getAddress(payment.payerAddress);
  const toMatches = tx.to ? getAddress(tx.to) === getAddress(payment.recipientAddress) : false;
  const valueMatches = tx.value >= expectedValue;
  const confirmed = receipt.status === "success" && fromMatches && toMatches && valueMatches;
  const now = new Date().toISOString();
  const nextStatus: PaymentRecord["status"] = confirmed ? "paid" : "failed";
  const nextState: StoreState = {
    ...state,
    payments: state.payments.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: nextStatus,
            transactionHash,
            blockNumber: Number(receipt.blockNumber),
            gasUsed: receipt.gasUsed.toString(),
            confirmedAt: confirmed ? now : item.confirmedAt,
            errorMessage: confirmed
              ? undefined
              : `Tx check failed: from=${fromMatches}, to=${toMatches}, value=${valueMatches}, receipt=${receipt.status}, value=${formatEther(tx.value)} USDC`,
          }
        : item,
    ),
  };
  await saveState(normalizedStoreId, nextState);

  return { ok: confirmed, reason: confirmed ? undefined : "tx_verification_failed", state: nextState };
}

export async function completeOrder(storeId: string, orderId: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const payment = state.payments.find((item) => item.id === orderId);

  if (!payment) {
    return { ok: false as const, reason: "not_found", state };
  }

  const canComplete =
    payment.status === "paid" || payment.status === "completed";

  if (!canComplete) {
    return { ok: false as const, reason: "not_confirmed", state };
  }

  const now = new Date().toISOString();
  const nextState: StoreState = {
    ...state,
    payments: state.payments.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: "completed",
            completedAt: item.completedAt || now,
          }
        : item,
    ),
  };
  await saveState(normalizedStoreId, nextState);

  return { ok: true as const, state: nextState };
}

export async function serveOrder(storeId: string, orderId: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const payment = state.payments.find((item) => item.id === orderId);

  if (!payment) {
    return { ok: false as const, reason: "not_found", state };
  }

  if (payment.status !== "ordered") {
    return { ok: false as const, reason: "not_ordered", state };
  }

  const now = new Date().toISOString();
  const nextState: StoreState = {
    ...state,
    payments: state.payments.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: "served",
            completedAt: now,
          }
        : item,
    ),
  };
  await saveState(normalizedStoreId, nextState);

  return { ok: true as const, state: nextState };
}

export async function confirmServedOrder(storeId: string, orderId: string, payerAddress?: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const payment = state.payments.find((item) => item.id === orderId);

  if (!payment) {
    return { ok: false as const, reason: "not_found", state };
  }

  if (payment.status !== "served") {
    return { ok: false as const, reason: "not_served", state };
  }

  const nextState: StoreState = {
    ...state,
    payments: state.payments.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: payment.mode === "arc-mainnet" ? "customer_confirmed" : "paid",
            payerAddress: payerAddress || item.payerAddress,
          }
        : item,
    ),
  };
  await saveState(normalizedStoreId, nextState);

  return { ok: true as const, payment: nextState.payments.find((item) => item.id === orderId), state: nextState };
}

export async function resetStoreActivity(storeId: string) {
  const normalizedStoreId = normalizeStoreId(storeId);
  const state = await readState(normalizedStoreId);
  const nextState: StoreState = {
    ...state,
    customers: state.customers.map((customer) => ({ ...customer, balanceUsdc: INITIAL_BALANCE })),
    payments: [],
  };

  await saveState(normalizedStoreId, nextState);
  return nextState;
}
