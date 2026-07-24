import { describe, expect, it } from "vitest";
import {
  assertCartQuantity,
  clampCartQuantityToStock,
  sumLineCents,
} from "../cart";

describe("cart helpers", () => {
  it("requires positive quantity", () => {
    expect(assertCartQuantity(2)).toBe(2);
    expect(() => assertCartQuantity(0)).toThrow();
    expect(() => assertCartQuantity(-1)).toThrow();
  });

  it("clamps to stock", () => {
    expect(clampCartQuantityToStock(2, 5)).toBe(2);
    expect(() => clampCartQuantityToStock(6, 5)).toThrow(/Only 5/);
    expect(() => clampCartQuantityToStock(1, 0)).toThrow(/out of stock/);
  });

  it("sums line totals", () => {
    expect(
      sumLineCents([
        { unitPriceCents: 100, quantity: 2 },
        { unitPriceCents: 250, quantity: 1 },
      ]),
    ).toBe(450);
  });
});
