import type { AuthConfig } from "convex/server";

const clerkIssuerDomain =
  process.env["CLERK" + "_JWT_ISSUER_DOMAIN"] ??
  "https://example.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
