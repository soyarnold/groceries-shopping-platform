import { assertNonNegativeInt } from "./catalog";

/** Cart line quantity must be a positive integer. */
export function assertCartQuantity(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("quantity must be a positive integer");
  }
  return quantity;
}

/** Cap quantity by available stock when stock is known. */
export function clampCartQuantityToStock(
  quantity: number,
  stock: number | null | undefined,
): number {
  const qty = assertCartQuantity(quantity);
  if (stock === null || stock === undefined) {
    return qty;
  }
  const available = assertNonNegativeInt(stock, "stock");
  if (available < 1) {
    throw new Error("Product is out of stock");
  }
  if (qty > available) {
    throw new Error(`Only ${available} in stock`);
  }
  return qty;
}

export function sumLineCents(
  lines: ReadonlyArray<{ unitPriceCents: number; quantity: number }>,
): number {
  return lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
}
