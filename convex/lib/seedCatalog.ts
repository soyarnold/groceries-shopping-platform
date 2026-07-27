import { slugify } from "./slug";

export type SeedProduct = {
  name: string;
  description: string;
  unit: string;
  priceCents: number;
  memberPriceCents?: number;
  quantity: number;
  lowStockThreshold: number;
};

export type SeedCategory = {
  name: string;
  sortOrder: number;
  products: SeedProduct[];
};

/** Demo grocery catalog used by `seed.seedDemoCatalog` (admin only). */
export const DEMO_SEED_CATALOG: SeedCategory[] = [
  {
    name: "Produce",
    sortOrder: 0,
    products: [
      {
        name: "Honeycrisp Apples",
        description: "Crisp, sweet apples — sold by the pound.",
        unit: "lb",
        priceCents: 349,
        memberPriceCents: 299,
        quantity: 40,
        lowStockThreshold: 8,
      },
      {
        name: "Baby Spinach",
        description: "Washed and ready-to-eat greens.",
        unit: "bag",
        priceCents: 399,
        memberPriceCents: 349,
        quantity: 25,
        lowStockThreshold: 5,
      },
      {
        name: "Ripe Avocados",
        description: "Hass avocados, ready today.",
        unit: "each",
        priceCents: 199,
        memberPriceCents: 149,
        quantity: 60,
        lowStockThreshold: 12,
      },
    ],
  },
  {
    name: "Dairy",
    sortOrder: 1,
    products: [
      {
        name: "Organic Whole Milk",
        description: "Half gallon of organic whole milk.",
        unit: "half-gal",
        priceCents: 549,
        memberPriceCents: 499,
        quantity: 30,
        lowStockThreshold: 6,
      },
      {
        name: "Cage-Free Eggs",
        description: "Dozen large brown eggs.",
        unit: "dozen",
        priceCents: 529,
        memberPriceCents: 459,
        quantity: 45,
        lowStockThreshold: 10,
      },
    ],
  },
  {
    name: "Pantry",
    sortOrder: 2,
    products: [
      {
        name: "Sourdough Loaf",
        description: "Fresh-baked country sourdough.",
        unit: "loaf",
        priceCents: 649,
        quantity: 18,
        lowStockThreshold: 4,
      },
      {
        name: "Extra Virgin Olive Oil",
        description: "500ml bottle, cold-pressed.",
        unit: "bottle",
        priceCents: 1299,
        memberPriceCents: 1099,
        quantity: 20,
        lowStockThreshold: 4,
      },
      {
        name: "Basmati Rice",
        description: "2 lb bag of aromatic basmati.",
        unit: "bag",
        priceCents: 799,
        memberPriceCents: 699,
        quantity: 35,
        lowStockThreshold: 8,
      },
    ],
  },
];

export type SeedCatalogSummary = {
  categoryCount: number;
  productCount: number;
  withMemberPrice: number;
  slugs: string[];
};

/** Pure summary used by seed smoke tests and the seed mutation return value. */
export function summarizeSeedCatalog(
  catalog: SeedCategory[] = DEMO_SEED_CATALOG,
): SeedCatalogSummary {
  const slugs: string[] = [];
  let productCount = 0;
  let withMemberPrice = 0;

  for (const category of catalog) {
    const categorySlug = slugify(category.name);
    if (!categorySlug) {
      throw new Error(`Invalid category name: ${category.name}`);
    }
    for (const product of category.products) {
      const productSlug = slugify(product.name);
      if (!productSlug) {
        throw new Error(`Invalid product name: ${product.name}`);
      }
      if (product.priceCents <= 0) {
        throw new Error(`Invalid price for ${product.name}`);
      }
      if (
        product.memberPriceCents !== undefined &&
        product.memberPriceCents > product.priceCents
      ) {
        throw new Error(`Member price exceeds retail for ${product.name}`);
      }
      if (product.quantity < 0 || product.lowStockThreshold < 0) {
        throw new Error(`Invalid inventory for ${product.name}`);
      }
      slugs.push(`${categorySlug}/${productSlug}`);
      productCount += 1;
      if (product.memberPriceCents !== undefined) {
        withMemberPrice += 1;
      }
    }
  }

  const unique = new Set(slugs);
  if (unique.size !== slugs.length) {
    throw new Error("Seed catalog has duplicate category/product slugs");
  }

  return {
    categoryCount: catalog.length,
    productCount,
    withMemberPrice,
    slugs,
  };
}
