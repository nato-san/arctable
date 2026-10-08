import { NextRequest, NextResponse } from "next/server";
import {
  completeOrder,
  confirmServedOrder,
  createOnchainOrder,
  deleteStoreState,
  ensureCustomer,
  markOrderSubmitted,
  readState,
  recordPurchase,
  rejectOrder,
  resetStoreActivity,
  serveOrder,
  normalizeStoreId,
  updateSettings,
  verifyOnchainOrder,
} from "@/lib/store-store";
import type { PaymentMode, PaymentRecord, Shop } from "@/lib/store-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoreAction = {
  storeId?: string;
} & (
  | {
      action: "purchase";
      customerId: string;
      shopId: string;
      mode?: PaymentMode;
      status?: PaymentRecord["status"];
      transactionHash?: string;
      blockNumber?: number;
      gasUsed?: string;
      payerAddress?: string;
      tableId?: string;
    }
  | {
      action: "create_onchain_order";
      customerId: string;
      shopId: string;
      payerAddress: string;
      tableId?: string;
    }
  | {
      action: "submit_onchain_order";
      orderId: string;
      transactionHash: string;
    }
  | {
      action: "verify_onchain_order";
      orderId: string;
      transactionHash: string;
    }
  | {
      action: "reject_onchain_order";
      orderId: string;
      errorMessage?: string;
    }
  | {
      action: "serve_order";
      orderId: string;
    }
  | {
      action: "confirm_served_order";
      orderId: string;
      payerAddress?: string;
    }
  | {
      action: "complete_order";
      orderId: string;
    }
  | {
      action: "settings";
      storeName: string;
      exchangeRateJpyPerUsdc: number;
      paymentMode: PaymentMode;
      recipientAddress?: string;
      shops: Shop[];
    }
  | {
      action: "reset";
    }
  | {
      action: "delete_store";
    }
);

function getStoreId(request: NextRequest, body?: { storeId?: string }) {
  return normalizeStoreId(body?.storeId || request.nextUrl.searchParams.get("storeId"));
}

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  const storeId = getStoreId(request);

  if (customerId) {
    const state = await ensureCustomer(storeId, customerId);
    return NextResponse.json(state);
  }

  return NextResponse.json({
    ...(await readState(storeId)),
    storeId,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as StoreAction;
  const storeId = getStoreId(request, body);

  if (body.action === "purchase") {
    const result = await recordPurchase(storeId, body.customerId, body.shopId, {
      mode: body.mode,
      status: body.status,
      transactionHash: body.transactionHash,
      blockNumber: body.blockNumber,
      gasUsed: body.gasUsed,
      payerAddress: body.payerAddress,
      tableId: body.tableId,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (body.action === "create_onchain_order") {
    const result = await createOnchainOrder(storeId, body.customerId, body.shopId, body.payerAddress, body.tableId);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (body.action === "submit_onchain_order") {
    const result = await markOrderSubmitted(storeId, body.orderId, body.transactionHash);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (body.action === "verify_onchain_order") {
    try {
      const result = await verifyOnchainOrder(storeId, body.orderId, body.transactionHash);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          reason: "tx_verification_error",
          message: error instanceof Error ? error.message : "unknown",
        },
        { status: 400 },
      );
    }
  }

  if (body.action === "reject_onchain_order") {
    const result = await rejectOrder(storeId, body.orderId, body.errorMessage);
    return NextResponse.json(result);
  }

  if (body.action === "serve_order") {
    const result = await serveOrder(storeId, body.orderId);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (body.action === "confirm_served_order") {
    const result = await confirmServedOrder(storeId, body.orderId, body.payerAddress);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (body.action === "complete_order") {
    const result = await completeOrder(storeId, body.orderId);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (body.action === "settings") {
    const state = await updateSettings(storeId, {
      storeName: body.storeName,
      exchangeRateJpyPerUsdc: body.exchangeRateJpyPerUsdc,
      paymentMode: body.paymentMode,
      recipientAddress: body.recipientAddress || "",
      shops: body.shops,
    });
    return NextResponse.json({ ok: true, state });
  }

  if (body.action === "reset") {
    const state = await resetStoreActivity(storeId);
    return NextResponse.json({ ok: true, state });
  }

  if (body.action === "delete_store") {
    const result = await deleteStoreState(storeId);
    return NextResponse.json(result);
  }

  return NextResponse.json({ ok: false, reason: "unknown_action" }, { status: 400 });
}
