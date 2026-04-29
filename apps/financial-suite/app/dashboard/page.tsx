"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { AiCommandPanel } from "@/components/ai-command-panel";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { FinancialTable } from "@/components/financial-table";
import { MonthSelector } from "@/components/month-selector";
import { FinancialCategory, FinancialItem } from "@/lib/financial-calculations";

const CATEGORIES: FinancialCategory[] = [
  "income",
  "fixed_bill",
  "variable_expense",
  "credit_card",
  "loan",
  "envelope",
];

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const rawItems = useQuery(api.financial.listMonthItems, { monthKey });
  const items = useMemo(
    () => (rawItems ?? []) as Array<Doc<"financialItems"> & FinancialItem>,
    [rawItems],
  );

  return (
    <main
      style={{
        display: "grid",
        gap: 16,
        margin: "0 auto",
        maxWidth: 1200,
        padding: 24,
      }}
    >
      <MonthSelector monthKey={monthKey} onMonthChange={setMonthKey} />
      <AnalyticsDashboard items={items} />
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          {CATEGORIES.map((category) => (
            <FinancialTable
              category={category}
              items={items.filter((item) => item.category === category)}
              key={category}
              monthKey={monthKey}
            />
          ))}
        </div>
        <AiCommandPanel monthKey={monthKey} />
      </div>
    </main>
  );
}
