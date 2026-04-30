import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type AnyCtx = {
  auth: {
    getUserIdentity: () => Promise<{
      subject: string;
      email?: string;
      name?: string;
    } | null>;
  };
  db: {
    query: (table: string) => any;
    insert: (table: string, value: Record<string, unknown>) => Promise<string>;
    patch: (id: string, value: Record<string, unknown>) => Promise<void>;
  };
};

export async function getCurrentUserOrThrow(
  ctx: AnyCtx,
): Promise<{ _id: Id<"users">; clerkUserId: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication required");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q: any) =>
      q.eq("clerkUserId", identity.subject),
    )
    .unique();
  if (!user) throw new Error("User profile not found");
  return user;
}

export async function getOrCreateCurrentUser(
  ctx: AnyCtx,
): Promise<{ _id: Id<"users">; clerkUserId: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication required");
  const now = Date.now();
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q: any) =>
      q.eq("clerkUserId", identity.subject),
    )
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, {
      email: identity.email,
      name: identity.name,
      updatedAt: now,
    });
    return existing;
  }
  const userId = await ctx.db.insert("users", {
    clerkUserId: identity.subject,
    email: identity.email,
    name: identity.name,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: userId as Id<"users">, clerkUserId: identity.subject };
}

export const current = query({
  args: {},
  handler: async (ctx) => getCurrentUserOrThrow(ctx as unknown as AnyCtx),
});

export const upsertCurrent = mutation({
  args: { email: v.optional(v.string()), name: v.optional(v.string()) },
  handler: async (ctx) => getOrCreateCurrentUser(ctx as unknown as AnyCtx),
});
