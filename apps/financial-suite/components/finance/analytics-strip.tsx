import { calculateMonthSummary, formatCents } from "@/lib/finance/calculations";
import type { MonthLedger } from "@/lib/finance/types";

export function AnalyticsStrip({ ledger }: { ledger: MonthLedger }) {
  const summary = calculateMonthSummary(ledger);

  return (
    <div className="metric-grid">
      <div className="metric">
        <span>Income</span>
        <strong>{formatCents(summary.incomeCents)}</strong>
      </div>
      <div className="metric">
        <span>Total expenses</span>
        <strong>{formatCents(summary.totalActualExpensesCents)}</strong>
      </div>
      <div className="metric">
        <span>Surplus / deficit</span>
        <strong
          style={{
            color: summary.surplusCents < 0 ? "var(--danger)" : "var(--accent)",
          }}
        >
          {formatCents(summary.surplusCents)}
        </strong>
      </div>
      <div className="metric">
        <span>Budget health</span>
        <strong>{summary.budgetHealthScore}/100</strong>
      </div>
      <div className="metric">
        <span>Credit utilization</span>
        <strong>{Math.round(summary.creditUtilization * 100)}%</strong>
      </div>
      <div className="metric">
        <span>Debt total</span>
        <strong>{formatCents(summary.debtBalanceCents)}</strong>
      </div>
      <div className="metric">
        <span>Envelope progress</span>
        <strong>{Math.round(summary.envelopeProgress * 100)}%</strong>
      </div>
    </div>
  );
}
