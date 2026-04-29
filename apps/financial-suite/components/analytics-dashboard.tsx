"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  FinancialItem,
  calculateBudgetHealth,
  calculateDebtUtilization,
  calculateMonthSummary,
  formatCurrency,
} from "@/lib/financial-calculations";

export function AnalyticsDashboard({ items }: { items: FinancialItem[] }) {
  const summary = useMemo(() => calculateMonthSummary(items), [items]);
  const debtUtilization = useMemo(
    () => calculateDebtUtilization(items),
    [items],
  );
  const health = calculateBudgetHealth(summary);
  const chartData = [
    { name: "Income", value: summary.incomeCents / 100 },
    { name: "Bills", value: summary.fixedBillsCents / 100 },
    { name: "Variable", value: summary.variableExpensesCents / 100 },
    { name: "Debt", value: summary.minimumDebtPaymentsCents / 100 },
  ];

  return (
    <section
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        display: "grid",
        gap: 16,
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 18, margin: 0 }}>Analytics</h2>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        <Metric
          label="Cashflow"
          value={formatCurrency(summary.cashflowCents)}
        />
        <Metric label="Budget health" value={health} />
        <Metric label="Debt utilization" value={`${debtUtilization}%`} />
        <Metric
          label="Verified"
          value={`${summary.verifiedCount}/${summary.totalItems}`}
        />
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#0f766e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{ border: "1px solid var(--line)", borderRadius: 6, padding: 12 }}
    >
      <div style={{ color: "var(--muted)", fontSize: 12 }}>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}
