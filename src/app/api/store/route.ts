import { NextRequest, NextResponse } from "next/server";
import {
  completeOrder,
  confirmServedOrder,
  createOnchainOrder,
  deleteStoreState,
  ensureCustomer,
  getStorageDiagnostics,
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
  adminToken?: string;
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
      quantity?: number;
    }
  | {
      action: "create_onchain_order";
      customerId: string;
      shopId: string;
      payerAddress: string;
      tableId?: string;
      quantity?: number;
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
      action: "cancel_order";
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
      tableCount?: number;
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

function logApiError(action: string, error: unknown) {
  console.error(`[api/store] ${action} failed`, error instanceof Error ? error.message : error);
}

function hasAdminAccess(state: { adminToken?: string }, token?: string | null) {
  if (!state.adminToken) {
    return true;
  }

  return Boolean(token && token === state.adminToken);
}

function publicState(state: Awaited<ReturnType<typeof readState>>, customerId?: string | null) {
  const safeState = { ...state };
  delete safeState.adminToken;

  return {
    ...safeState,
    payments: customerId ? state.payments.filter((payment) => payment.customerId === customerId) : [],
  };
}

function merchantState(state: Awaited<ReturnType<typeof readState>>) {
  const safeState = { ...state };
  delete safeState.adminToken;
  return safeState;
}

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId");
    const adminToken = request.nextUrl.searchParams.get("admin");
    const storeId = getStoreId(request);

    if (request.nextUrl.searchParams.get("diagnostics") === "1") {
      return NextResponse.json(await getStorageDiagnostics());
    }

    const state = await readState(storeId);
    const isAdmin = hasAdminAccess(state, adminToken);

    if (customerId) {
      const nextState = await ensureCustomer(storeId, customerId);
      const currentCustomer = nextState.currentCustomer;

      return NextResponse.json({
        ...(isAdmin ? merchantState(nextState) : publicState(nextState, customerId)),
        storeId,
        currentCustomer,
        adminAuthorized: isAdmin,
      });
    }

    return NextResponse.json({
      ...(isAdmin ? merchantState(state) : publicState(state)),
      storeId,
      adminAuthorized: isAdmin,
    });
  } catch (error) {
    logApiError("GET", error);
    return NextResponse.json({ ok: false, reason: "store_read_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StoreAction;
    const storeId = getStoreId(request, body);
    const adminToken = body.adminToken;

    if (body.action === "purchase") {
      const result = await recordPurchase(storeId, body.customerId, body.shopId, {
        mode: body.mode,
        status: body.status,
        transactionHash: body.transactionHash,
        blockNumber: body.blockNumber,
        gasUsed: body.gasUsed,
        payerAddress: body.payerAddress,
        tableId: body.tableId,
        quantity: body.quantity,
      });
      return NextResponse.json(
        { ...result, state: result.state ? publicState(result.state, body.customerId) : undefined },
        { status: result.ok ? 200 : 400 },
      );
    }

  if (body.action === "create_onchain_order") {
    const result = await createOnchainOrder(storeId, body.customerId, body.shopId, body.payerAddress, body.tableId, body.quantity);
    return NextResponse.json(
      { ...result, state: result.state ? publicState(result.state, body.customerId) : undefined },
      { status: result.ok ? 200 : 400 },
    );
  }

  if (body.action === "submit_onchain_order") {
    const result = await markOrderSubmitted(storeId, body.orderId, body.transactionHash);
    return NextResponse.json(
      { ...result, state: result.state ? publicState(result.state, result.payment?.customerId) : undefined },
      { status: result.ok ? 200 : 400 },
    );
  }

  if (body.action === "verify_onchain_order") {
    try {
      const result = await verifyOnchainOrder(storeId, body.orderId, body.transactionHash);
      return NextResponse.json(
        { ...result, state: result.state ? publicState(result.state) : undefined },
        { status: result.ok ? 200 : 400 },
      );
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
    return NextResponse.json({ ...result, state: publicState(result.state) });
  }

  if (body.action === "cancel_order") {
    const state = await readState(storeId);
    if (!hasAdminAccess(state, adminToken)) {
      return NextResponse.json({ ok: false, reason: "admin_required" }, { status: 403 });
    }
    const result = await rejectOrder(storeId, body.orderId, body.errorMessage || "Cancelled by store");
    return NextResponse.json(
      { ...result, state: result.state ? merchantState(result.state) : undefined },
      { status: result.ok ? 200 : 400 },
    );
  }

  if (body.action === "serve_order") {
    const state = await readState(storeId);
    if (!hasAdminAccess(state, adminToken)) {
      return NextResponse.json({ ok: false, reason: "admin_required" }, { status: 403 });
    }
    const result = await serveOrder(storeId, body.orderId);
    return NextResponse.json(
      { ...result, state: result.state ? merchantState(result.state) : undefined },
      { status: result.ok ? 200 : 400 },
    );
  }

  if (body.action === "confirm_served_order") {
    const result = await confirmServedOrder(storeId, body.orderId, body.payerAddress);
    return NextResponse.json(
      { ...result, state: result.state ? publicState(result.state) : undefined },
      { status: result.ok ? 200 : 400 },
    );
  }

  if (body.action === "complete_order") {
    const state = await readState(storeId);
    if (!hasAdminAccess(state, adminToken)) {
      return NextResponse.json({ ok: false, reason: "admin_required" }, { status: 403 });
    }
    const result = await completeOrder(storeId, body.orderId);
    return NextResponse.json(
      { ...result, state: result.state ? merchantState(result.state) : undefined },
      { status: result.ok ? 200 : 400 },
    );
  }

  if (body.action === "settings") {
    const currentState = await readState(storeId);
    if (!hasAdminAccess(currentState, adminToken)) {
      return NextResponse.json({ ok: false, reason: "admin_required" }, { status: 403 });
    }
    const state = await updateSettings(storeId, {
      storeName: body.storeName,
      adminToken: body.adminToken || "",
      tableCount: body.tableCount,
      exchangeRateJpyPerUsdc: body.exchangeRateJpyPerUsdc,
      paymentMode: body.paymentMode,
      recipientAddress: body.recipientAddress || "",
      shops: body.shops,
    });
    return NextResponse.json({ ok: true, state: merchantState(state) });
  }

  if (body.action === "reset") {
    const currentState = await readState(storeId);
    if (!hasAdminAccess(currentState, adminToken)) {
      return NextResponse.json({ ok: false, reason: "admin_required" }, { status: 403 });
    }
    const state = await resetStoreActivity(storeId);
    return NextResponse.json({ ok: true, state: merchantState(state) });
  }

  if (body.action === "delete_store") {
    const state = await readState(storeId);
    if (!hasAdminAccess(state, adminToken)) {
      return NextResponse.json({ ok: false, reason: "admin_required" }, { status: 403 });
    }
    const result = await deleteStoreState(storeId);
    return NextResponse.json(result);
  }

    return NextResponse.json({ ok: false, reason: "unknown_action" }, { status: 400 });
  } catch (error) {
    logApiError("POST", error);
    return NextResponse.json({ ok: false, reason: "store_write_failed" }, { status: 500 });
  }
}
