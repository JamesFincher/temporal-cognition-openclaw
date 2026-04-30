import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const metadataValue = v.union(v.string(), v.number(), v.boolean());

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  months: defineTable({
    ownerId: v.id("users"),
    monthKey: v.string(),
    incomeCents: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("archived"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_month", ["ownerId", "monthKey"])
    .index("by_owner_created", ["ownerId", "createdAt"]),

  ledgerItems: defineTable({
    ownerId: v.id("users"),
    monthId: v.id("months"),
    section: v.union(
      v.literal("income"),
      v.literal("fixed"),
      v.literal("variable"),
      v.literal("credit"),
      v.literal("loan"),
      v.literal("envelope"),
    ),
    category: v.string(),
    name: v.string(),
    budgetCents: v.number(),
    actualCents: v.number(),
    dueDay: v.optional(v.number()),
    verified: v.boolean(),
    sortOrder: v.number(),
    metadata: v.optional(v.record(v.string(), metadataValue)),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_month_section", ["monthId", "section"])
    .index("by_owner_month", ["ownerId", "monthId"])
    .index("by_month_verified", ["monthId", "verified"]),

  variableEntries: defineTable({
    ownerId: v.id("users"),
    monthId: v.id("months"),
    category: v.string(),
    amountCents: v.number(),
    spentAt: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_month_category", ["monthId", "category"])
    .index("by_owner_spent_at", ["ownerId", "spentAt"]),

  aiOperationBatches: defineTable({
    ownerId: v.id("users"),
    monthId: v.id("months"),
    prompt: v.string(),
    status: v.union(
      v.literal("proposed"),
      v.literal("applied"),
      v.literal("rejected"),
    ),
    operations: v.array(v.any()),
    createdAt: v.number(),
    appliedAt: v.optional(v.number()),
  })
    .index("by_month_status", ["monthId", "status"])
    .index("by_owner_created", ["ownerId", "createdAt"]),

  auditEvents: defineTable({
    ownerId: v.id("users"),
    monthId: v.id("months"),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    operation: v.string(),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    source: v.union(
      v.literal("manual"),
      v.literal("ai_approved"),
      v.literal("clone"),
    ),
    createdAt: v.number(),
  })
    .index("by_month_created", ["monthId", "createdAt"])
    .index("by_entity", ["entityType", "entityId"]),
});
