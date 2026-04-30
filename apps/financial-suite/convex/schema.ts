import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const financialCategory = v.union(
  v.literal("income"),
  v.literal("fixed_bill"),
  v.literal("variable_expense"),
  v.literal("credit_card"),
  v.literal("loan"),
  v.literal("envelope"),
);

export default defineSchema({
  users: defineTable({
    ownerId: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  months: defineTable({
    ownerId: v.string(),
    monthKey: v.string(),
    displayName: v.string(),
    timezone: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("closed"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_month", ["ownerId", "monthKey"]),

  financialItems: defineTable({
    ownerId: v.string(),
    monthId: v.id("months"),
    monthKey: v.string(),
    category: financialCategory,
    label: v.string(),
    amountCents: v.number(),
    paidCents: v.optional(v.number()),
    balanceCents: v.optional(v.number()),
    creditLimitCents: v.optional(v.number()),
    dueDay: v.optional(v.number()),
    verified: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_month", ["ownerId", "monthKey"])
    .index("by_owner_month_category", ["ownerId", "monthKey", "category"]),

  accounts: defineTable({
    ownerId: v.string(),
    monthKey: v.string(),
    name: v.string(),
    kind: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("credit"),
      v.literal("loan"),
      v.literal("cash"),
    ),
    institution: v.optional(v.string()),
    balanceCents: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_month", ["ownerId", "monthKey"]),

  snapshots: defineTable({
    ownerId: v.string(),
    monthKey: v.string(),
    summary: v.any(),
    createdAt: v.number(),
  }).index("by_owner_month", ["ownerId", "monthKey"]),

  aiChangeSets: defineTable({
    ownerId: v.string(),
    monthKey: v.string(),
    prompt: v.string(),
    status: v.union(
      v.literal("proposed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("applied"),
    ),
    proposedChanges: v.array(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_month", ["ownerId", "monthKey"]),

  auditEvents: defineTable({
    ownerId: v.string(),
    monthKey: v.optional(v.string()),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_owner_month", ["ownerId", "monthKey"]),
});
