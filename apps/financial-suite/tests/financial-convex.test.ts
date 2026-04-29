import { describe, expect, it, vi } from "vitest";
import {
  copyPreviousMonthHandler,
  deleteFinancialItemHandler,
  listMonthItemsHandler,
  upsertFinancialItemHandler,
} from "../convex/financial";

type TestMonth = {
  _id: string;
  ownerId: string;
  monthKey: string;
  timezone?: string;
};

type TestItem = {
  _id: string;
  ownerId: string;
  monthId?: string;
  monthKey: string;
  category: "income" | "fixed_bill";
  label: string;
  amountCents: number;
  paidCents?: number;
  verified?: boolean;
};

function createMockCtx({
  ownerId,
  months = [],
  items = [],
}: {
  ownerId: string | null;
  months?: TestMonth[];
  items?: TestItem[];
}) {
  const dbMonths = [...months];
  const dbItems = [...items];
  const inserts: Array<{ table: string; value: any }> = [];
  const patches: Array<{ id: string; value: any }> = [];
  const deletes: string[] = [];

  const db = {
    get: vi.fn(async (id: string) => {
      return (
        dbItems.find((item) => item._id === id) ??
        dbMonths.find((month) => month._id === id) ??
        null
      );
    }),
    insert: vi.fn(async (table: string, value: any) => {
      inserts.push({ table, value });
      const id = `${table}_${inserts.length}`;
      if (table === "months") {
        dbMonths.push({ _id: id, ...value });
      }
      if (table === "financialItems") {
        dbItems.push({ _id: id, ...value });
      }
      return id;
    }),
    patch: vi.fn(async (id: string, value: any) => {
      patches.push({ id, value });
      const index = dbItems.findIndex((item) => item._id === id);
      if (index >= 0) dbItems[index] = { ...dbItems[index], ...value };
    }),
    delete: vi.fn(async (id: string) => {
      deletes.push(id);
    }),
    query: vi.fn((table: string) => ({
      withIndex: vi.fn((_indexName: string, buildQuery: any) => {
        const filters: Record<string, unknown> = {};
        const q = {
          eq(field: string, value: unknown) {
            filters[field] = value;
            return q;
          },
        };
        buildQuery(q);
        const matches = <T extends Record<string, unknown>>(record: T) =>
          Object.entries(filters).every(
            ([field, value]) => record[field] === value,
          );

        return {
          unique: vi.fn(async () => {
            if (table === "months") {
              return dbMonths.find((month) => matches(month)) ?? null;
            }
            return null;
          }),
          collect: vi.fn(async () => {
            if (table === "financialItems") {
              return dbItems.filter((item) => matches(item));
            }
            return [];
          }),
        };
      }),
    })),
  };

  return {
    auth: {
      getUserIdentity: vi.fn(async () =>
        ownerId ? { subject: ownerId } : null,
      ),
    },
    db,
    inserts,
    patches,
    deletes,
  };
}

describe("financial Convex access control", () => {
  it("rejects unauthenticated item listing", async () => {
    const ctx = createMockCtx({ ownerId: null });

    await expect(
      listMonthItemsHandler(ctx, { monthKey: "2026-04" }),
    ).rejects.toThrow("Unauthorized");
  });

  it("does not patch another user's item", async () => {
    const ctx = createMockCtx({
      ownerId: "user_a",
      months: [{ _id: "month_1", ownerId: "user_a", monthKey: "2026-04" }],
      items: [
        {
          _id: "item_1",
          ownerId: "user_b",
          monthKey: "2026-04",
          category: "fixed_bill",
          label: "Rent",
          amountCents: 140000,
        },
      ],
    });

    await expect(
      upsertFinancialItemHandler(ctx, {
        itemId: "item_1",
        monthKey: "2026-04",
        category: "fixed_bill",
        label: "Rent",
        amountCents: 150000,
      }),
    ).rejects.toThrow("Item not found");
    expect(ctx.patches).toHaveLength(0);
  });

  it("only lists the authenticated user's month items", async () => {
    const ctx = createMockCtx({
      ownerId: "user_a",
      items: [
        {
          _id: "item_1",
          ownerId: "user_a",
          monthKey: "2026-04",
          category: "income",
          label: "Salary",
          amountCents: 500000,
        },
        {
          _id: "item_2",
          ownerId: "user_b",
          monthKey: "2026-04",
          category: "income",
          label: "Other salary",
          amountCents: 600000,
        },
        {
          _id: "item_3",
          ownerId: "user_a",
          monthKey: "2026-05",
          category: "fixed_bill",
          label: "Rent",
          amountCents: 140000,
        },
      ],
    });

    await expect(
      listMonthItemsHandler(ctx, { monthKey: "2026-04" }),
    ).resolves.toEqual([
      expect.objectContaining({ _id: "item_1", ownerId: "user_a" }),
    ]);
  });

  it("does not delete another user's item", async () => {
    const ctx = createMockCtx({
      ownerId: "user_a",
      items: [
        {
          _id: "item_1",
          ownerId: "user_b",
          monthKey: "2026-04",
          category: "income",
          label: "Salary",
          amountCents: 500000,
        },
      ],
    });

    await expect(
      deleteFinancialItemHandler(ctx, { itemId: "item_1" }),
    ).rejects.toThrow("Item not found");
    expect(ctx.deletes).toHaveLength(0);
  });
});

describe("financial month copy", () => {
  it("rejects copies into a month that already has target items", async () => {
    const ctx = createMockCtx({
      ownerId: "user_a",
      months: [{ _id: "month_2", ownerId: "user_a", monthKey: "2026-05" }],
      items: [
        {
          _id: "item_1",
          ownerId: "user_a",
          monthKey: "2026-05",
          category: "fixed_bill",
          label: "Rent",
          amountCents: 140000,
        },
      ],
    });

    await expect(
      copyPreviousMonthHandler(ctx, {
        fromMonthKey: "2026-04",
        toMonthKey: "2026-05",
      }),
    ).rejects.toThrow("Target month already has items");
    expect(
      ctx.inserts.filter((insert) => insert.table === "financialItems"),
    ).toHaveLength(0);
  });
});
