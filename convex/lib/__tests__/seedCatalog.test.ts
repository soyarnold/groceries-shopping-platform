import { describe, expect, it } from "vitest";
import { DEMO_SEED_CATALOG, summarizeSeedCatalog } from "../seedCatalog";

describe("demo seed catalog", () => {
  it("has a non-empty grocery catalog", () => {
    expect(DEMO_SEED_CATALOG.length).toBeGreaterThanOrEqual(3);
    const summary = summarizeSeedCatalog();
    expect(summary.productCount).toBeGreaterThanOrEqual(6);
    expect(summary.withMemberPrice).toBeGreaterThan(0);
    expect(summary.slugs.length).toBe(summary.productCount);
  });

  it("uses unique slugs and valid prices", () => {
    const summary = summarizeSeedCatalog();
    expect(new Set(summary.slugs).size).toBe(summary.slugs.length);
    for (const category of DEMO_SEED_CATALOG) {
      for (const product of category.products) {
        expect(product.priceCents).toBeGreaterThan(0);
        if (product.memberPriceCents !== undefined) {
          expect(product.memberPriceCents).toBeLessThanOrEqual(
            product.priceCents,
          );
        }
      }
    }
  });

  it("rejects invalid catalogs", () => {
    expect(() =>
      summarizeSeedCatalog([
        {
          name: "Bad",
          sortOrder: 0,
          products: [
            {
              name: "X",
              description: "x",
              unit: "each",
              priceCents: 100,
              memberPriceCents: 200,
              quantity: 1,
              lowStockThreshold: 0,
            },
          ],
        },
      ]),
    ).toThrow(/Member price exceeds/);
  });
});
