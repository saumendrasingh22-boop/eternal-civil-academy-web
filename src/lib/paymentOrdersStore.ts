export type PaymentOrderStatus = "Pending Verification" | "Approved" | "Rejected";

export interface UpiPaymentOrder {
  id: string;
  itemId: string;
  itemType: "premium_notes" | "test_series" | "answer_evaluation" | "batch";
  itemTitle: string;
  priceInr: number;
  studentName: string;
  studentContact: string;
  utrNumber: string;
  status: PaymentOrderStatus;
  createdAt: string;
}

const ORDERS_STORAGE_KEY = "eca_upi_payment_orders_v3";

export const DEFAULT_UPI_ORDERS: UpiPaymentOrder[] = [];

export function loadUpiOrders(): UpiPaymentOrder[] {
  if (typeof window === "undefined") return DEFAULT_UPI_ORDERS;
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return DEFAULT_UPI_ORDERS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_UPI_ORDERS;
  }
}

export function saveUpiOrders(orders: UpiPaymentOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("eca-upi-orders-updated"));
}

export function submitUpiOrder(
  order: Omit<UpiPaymentOrder, "id" | "status" | "createdAt">
): UpiPaymentOrder {
  const existing = loadUpiOrders();
  const newOrder: UpiPaymentOrder = {
    ...order,
    id: `ORD-${Date.now().toString().slice(-6)}`,
    status: "Pending Verification",
    createdAt: new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  saveUpiOrders([newOrder, ...existing]);
  return newOrder;
}

export function getItemUnlockState(itemId: string): {
  status: "locked" | "pending" | "approved" | "rejected";
  utr?: string;
} {
  const orders = loadUpiOrders().filter((o) => o.itemId === itemId);
  if (orders.length === 0) return { status: "locked" };
  const approved = orders.find((o) => o.status === "Approved");
  if (approved) return { status: "approved", utr: approved.utrNumber };
  const pending = orders.find((o) => o.status === "Pending Verification");
  if (pending) return { status: "pending", utr: pending.utrNumber };
  return { status: "rejected", utr: orders[0].utrNumber };
}
