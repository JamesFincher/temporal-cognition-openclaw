import {
  FinancialCategory,
  FinancialItem,
  parseCurrency,
} from "./financial-calculations";

export interface LegacyImportResult {
  monthKey: string;
  items: FinancialItem[];
  skippedSensitiveFields: string[];
  notes: string[];
}

const CATEGORY_BY_PREFIX: Record<string, FinancialCategory> = {
  income: "income",
  bill: "fixed_bill",
  fixed: "fixed_bill",
  variable: "variable_expense",
  expense: "variable_expense",
  card: "credit_card",
  credit: "credit_card",
  loan: "loan",
  envelope: "envelope",
};

const SENSITIVE_FIELD_PATTERN =
  /(account|login|password|routing|ssn|secret|token)/i;

export function importLegacyFields(
  fields: Record<string, string | number | null | undefined>,
  monthKey: string,
): LegacyImportResult {
  const itemsByKey = new Map<string, FinancialItem>();
  const skippedSensitiveFields: string[] = [];
  const notes: string[] = [];

  for (const [field, value] of Object.entries(fields)) {
    if (SENSITIVE_FIELD_PATTERN.test(field)) {
      skippedSensitiveFields.push(field);
      continue;
    }

    const [prefix, rawName = "item", rawMetric = "amount"] =
      field.split(/[-_.:]/);
    const category = CATEGORY_BY_PREFIX[prefix.toLowerCase()];
    if (!category) {
      notes.push(`Skipped unrecognized field: ${field}`);
      continue;
    }

    const key = `${category}:${rawName}`;
    const current = itemsByKey.get(key) ?? {
      category,
      label: humanize(rawName),
      amountCents: 0,
    };
    const cents = parseCurrency(value);

    if (/balance/i.test(rawMetric)) current.balanceCents = cents;
    else if (/limit/i.test(rawMetric)) current.creditLimitCents = cents;
    else if (/paid/i.test(rawMetric)) current.paidCents = cents;
    else current.amountCents = cents;

    itemsByKey.set(key, current);
  }

  return {
    monthKey,
    items: [...itemsByKey.values()],
    skippedSensitiveFields,
    notes,
  };
}

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
