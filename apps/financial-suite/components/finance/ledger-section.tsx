"use client";

import { useCallback, useState } from "react";
import { EditableMoneyCell } from "./editable-money-cell";
import { formatCents } from "@/lib/finance/calculations";
import type { LedgerItem, LedgerSection as Section } from "@/lib/finance/types";

interface LedgerSectionProps {
  title: string;
  section: Section;
  items: LedgerItem[];
}

export function LedgerSection({ title, section, items }: LedgerSectionProps) {
  const [rows, setRows] = useState(items);
  const updateAmount = useCallback(
    (id: string, field: "budgetCents" | "actualCents", valueCents: number) => {
      setRows((current) =>
        current.map((item) =>
          item.id === id ? { ...item, [field]: valueCents } : item,
        ),
      );
    },
    [],
  );
  const sectionRows = rows.filter((item) => item.section === section);
  const total = sectionRows.reduce(
    (sum, item) => sum + (item.actualCents || item.budgetCents),
    0,
  );

  return (
    <section className="panel" style={{ overflow: "hidden" }}>
      <header
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 12px",
        }}
      >
        <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
        <strong>{formatCents(total)}</strong>
      </header>
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Budget</th>
            <th>Actual</th>
            <th>Due</th>
            <th>Verified</th>
          </tr>
        </thead>
        <tbody>
          {sectionRows.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.name}</strong>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  {item.category}
                </div>
              </td>
              <td>
                <EditableMoneyCell
                  valueCents={item.budgetCents}
                  onCommit={(value) =>
                    updateAmount(item.id, "budgetCents", value)
                  }
                />
              </td>
              <td>
                <EditableMoneyCell
                  valueCents={item.actualCents}
                  onCommit={(value) =>
                    updateAmount(item.id, "actualCents", value)
                  }
                />
              </td>
              <td>{item.dueDay ? String(item.dueDay) : "-"}</td>
              <td>
                <input
                  type="checkbox"
                  checked={item.verified}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((row) =>
                        row.id === item.id
                          ? { ...row, verified: event.target.checked }
                          : row,
                      ),
                    )
                  }
                  aria-label={`Verify ${item.name}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
