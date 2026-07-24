import { slugify } from "./slug";

export function assertNonNegativeInt(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

export function assertPositivePriceCents(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer (cents)`);
  }
  return value;
}

export function assertOptionalMemberPrice(
  priceCents: number,
  memberPriceCents: number | undefined,
): number | undefined {
  if (memberPriceCents === undefined) {
    return undefined;
  }
  assertPositivePriceCents(memberPriceCents, "memberPriceCents");
  if (memberPriceCents > priceCents) {
    throw new Error("memberPriceCents cannot exceed priceCents");
  }
  return memberPriceCents;
}

export function nextUniqueSlug(
  name: string,
  existingSlugs: ReadonlySet<string>,
): string {
  const base = slugify(name) || "item";
  if (!existingSlugs.has(base)) {
    return base;
  }
  let n = 2;
  while (existingSlugs.has(`${base}-${n}`)) {
    n += 1;
  }
  return `${base}-${n}`;
}

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function isLowStock(
  quantity: number,
  lowStockThreshold: number,
): boolean {
  return quantity <= lowStockThreshold;
}
