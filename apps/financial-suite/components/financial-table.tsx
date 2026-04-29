"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  FinancialCategory,
  FinancialItem,
  formatCurrency,
  parseCurrency,
} from "@/lib/financial-calculations";

type EditableItem = FinancialItem & {
  _id?: Id<"financialItems">;
  monthKey: string;
};

const CATEGORY_LABELS: Record<FinancialCategory, string> = {
  income: "Income",
  fixed_bill: "Fixed bills",
  variable_expense: "Variable expenses",
  credit_card: "Credit cards",
  loan: "Loans",
  envelope: "Envelopes",
};

export function FinancialTable({
  category,
  items,
  monthKey,
}: {
  category: FinancialCategory;
  items: EditableItem[];
  monthKey: string;
}) {
  const upsertItem = useMutation(api.financial.upsertFinancialItem);
  const deleteItem = useMutation(api.financial.deleteFinancialItem);
  const [rows, setRows] = useState<EditableItem[]>(items);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => setRows(items), [items]);

  const total = useMemo(
    () => rows.reduce((sum, item) => sum + item.amountCents, 0),
    [rows],
  );

  function updateRow(index: number, updates: Partial<EditableItem>) {
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...updates } : row,
    );
    setRows(nextRows);
    const row = nextRows[index];
    const localId = row._id ?? `${category}-${index}`;
    setSavingId(localId);
    window.setTimeout(async () => {
      await upsertItem({
        itemId: row._id,
        monthKey,
        category: row.category,
        label: row.label,
        amountCents: row.amountCents,
        paidCents: row.paidCents,
        balanceCents: row.balanceCents,
        creditLimitCents: row.creditLimitCents,
        verified: row.verified,
      });
      setSavingId(null);
    }, 400);
  }

  return (
    <section
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ fontSize: 18, margin: 0 }}>{CATEGORY_LABELS[category]}</h2>
        <strong>{formatCurrency(total)}</strong>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {rows.map((row, index) => (
          <div
            key={row._id ?? `${row.label}-${index}`}
            style={{
              display: "grid",
              gap: 8,
              gridTemplateColumns: "2fr 1fr auto auto",
            }}
          >
            <input
              aria-label="Label"
              value={row.label}
              onChange={(event) =>
                updateRow(index, { label: event.target.value })
              }
            />
            <input
              aria-label="Amount"
              value={(row.amountCents / 100).toString()}
              onChange={(event) =>
                updateRow(index, {
                  amountCents: parseCurrency(event.target.value),
                })
              }
            />
            <label>
              <input
                checked={row.verified ?? false}
                type="checkbox"
                onChange={(event) =>
                  updateRow(index, { verified: event.target.checked })
                }
              />{" "}
              Verified
            </label>
            <button
              disabled={!row._id}
              onClick={() => row._id && deleteItem({ itemId: row._id })}
              type="button"
            >
              Delete
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setRows([
              ...rows,
              {
                category,
                label: "New item",
                amountCents: 0,
                monthKey,
                verified: false,
              },
            ])
          }
          style={{ justifySelf: "start" }}
          type="button"
        >
          Add row
        </button>
        {savingId ? (
          <small style={{ color: "var(--muted)" }}>Saving {savingId}...</small>
        ) : (
          <small style={{ color: "var(--muted)" }}>Saved</small>
        )}
      </div>
    </section>
  );
}
