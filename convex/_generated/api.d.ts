/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as favorites from "../favorites.js";
import type * as inventory from "../inventory.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_cart from "../lib/cart.js";
import type * as lib_catalog from "../lib/catalog.js";
import type * as lib_membership from "../lib/membership.js";
import type * as lib_orders from "../lib/orders.js";
import type * as lib_org from "../lib/org.js";
import type * as lib_slug from "../lib/slug.js";
import type * as membership from "../membership.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as stores from "../stores.js";
import type * as stripeCheckout from "../stripeCheckout.js";
import type * as stripeMembership from "../stripeMembership.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cart: typeof cart;
  categories: typeof categories;
  favorites: typeof favorites;
  inventory: typeof inventory;
  "lib/auth": typeof lib_auth;
  "lib/cart": typeof lib_cart;
  "lib/catalog": typeof lib_catalog;
  "lib/membership": typeof lib_membership;
  "lib/orders": typeof lib_orders;
  "lib/org": typeof lib_org;
  "lib/slug": typeof lib_slug;
  membership: typeof membership;
  orders: typeof orders;
  products: typeof products;
  stores: typeof stores;
  stripeCheckout: typeof stripeCheckout;
  stripeMembership: typeof stripeMembership;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
