"use client";

import { useMemo } from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { AssistantPanel } from "@/components/ai/assistant-panel";
import { AnalyticsStrip } from "./analytics-strip";
import { LedgerSection } from "./ledger-section";
import { MonthPicker } from "./month-picker";
import { createSampleLedger } from "./sample-data";

export function DashboardShell({ monthKey }: { monthKey: string }) {
  const ledger = useMemo(() => createSampleLedger(monthKey), [monthKey]);

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        margin: "0 auto",
        maxWidth: 1280,
        padding: 16,
      }}
    >
      <header
        style={{
          alignItems: "center",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Financial Audit Tracker</h1>
          <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
            Auto-save enabled. Changes update the working ledger as you type.
          </p>
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
          <MonthPicker monthKey={monthKey} />
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <AnalyticsStrip ledger={ledger} />

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "minmax(0, 1fr) 340px",
        }}
      >
        <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
          <LedgerSection
            title="Fixed Bills"
            section="fixed"
            items={ledger.items}
          />
          <LedgerSection
            title="Variable Expenses"
            section="variable"
            items={ledger.items}
          />
          <LedgerSection
            title="Credit Cards"
            section="credit"
            items={ledger.items}
          />
          <LedgerSection title="Loans" section="loan" items={ledger.items} />
          <LedgerSection
            title="Envelopes"
            section="envelope"
            items={ledger.items}
          />
        </div>
        <AssistantPanel ledger={ledger} />
      </div>
    </div>
  );
}
