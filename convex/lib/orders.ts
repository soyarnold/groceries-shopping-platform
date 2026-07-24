export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "ready"
  | "completed"
  | "canceled"
  | "refunded";

const ADMIN_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  pending_payment: ["canceled"],
  paid: ["preparing", "canceled", "refunded"],
  preparing: ["ready", "canceled"],
  ready: ["completed", "canceled"],
  completed: [],
  canceled: [],
  refunded: [],
};

export function canAdminTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ADMIN_TRANSITIONS[from].includes(to);
}

export function assertAdminTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!canAdminTransition(from, to)) {
    throw new Error(`Cannot move order from ${from} to ${to}`);
  }
}

export function computeOrderTotals(
  lines: ReadonlyArray<{ unitPriceCents: number; quantity: number }>,
): { subtotalCents: number; totalCents: number } {
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
  return { subtotalCents, totalCents: subtotalCents };
}
