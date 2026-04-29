import { describe, expect, it } from "vitest";
import { importLegacyFields } from "../lib/legacy-import";

describe("legacy import", () => {
  it("maps flat data-field payloads to typed records", () => {
    const result = importLegacyFields(
      {
        "income-paycheck-amount": "$4,000",
        "bill-rent-amount": "1400",
        "credit-visa-balance": "$900",
        "credit-visa-limit": "$3,000",
        "login-bank-user": "private",
      },
      "2025-08",
    );

    expect(result.items).toHaveLength(3);
    expect(
      result.items.find((item) => item.label === "Paycheck")?.amountCents,
    ).toBe(400000);
    expect(
      result.items.find((item) => item.label === "Visa")?.creditLimitCents,
    ).toBe(300000);
    expect(result.skippedSensitiveFields).toEqual(["login-bank-user"]);
  });
});
