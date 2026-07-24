import { query } from "./_generated/server";
import { v } from "convex/values";

export const getForCurrentUser = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      author: v.string(),
      body: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const email = identity.email;
    if (!email) {
      return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_author", (q) => q.eq("author", email))
      .collect();
  },
});
