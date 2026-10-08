export type Shop = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  imageUrl?: string;
  priceJpy: number;
  actionLabel: string;
  recipientAddress?: string;
};

export type Customer = {
  id: string;
  name: string;
  balanceUsdc: number;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  tableId?: string;
  customerId: string;
  customerName: string;
  shopId: string;
  itemName: string;
  priceJpy: number;
  priceUsdc: number;
  exchangeRateJpyPerUsdc: number;
  quantity: number;
  createdAt: string;
  mode: "demo" | "arc-mainnet";
  status:
    | "ordered"
    | "served"
    | "customer_confirmed"
    | "pending_wallet"
    | "submitted"
    | "paid"
    | "completed"
    | "failed"
    | "rejected"
    | "recorded"
    | "confirmed";
  recipientAddress?: string;
  payerAddress?: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  submittedAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  errorMessage?: string;
};

export type PaymentMode = "demo" | "arc-mainnet";

export type StoreState = {
  storeName: string;
  exchangeRateJpyPerUsdc: number;
  paymentMode: PaymentMode;
  shops: Shop[];
  customers: Customer[];
  payments: PaymentRecord[];
};

export type StoreResponse = StoreState & {
  storeId: string;
  currentCustomer: Customer;
};

export type ShopStats = {
  shop: Shop;
  records: PaymentRecord[];
  sales: number;
  count: number;
};
