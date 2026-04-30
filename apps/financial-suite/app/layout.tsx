import type { Metadata } from "next";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Suite",
  description: "Authenticated AI-assisted monthly financial tracker",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_ZHVtbXkuY2xlcmsk";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body>
          <ConvexClientProvider>
            <header
              style={{
                alignItems: "center",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 24px",
              }}
            >
              <strong>Financial Suite</strong>
              <SignedOut>
                <SignInButton mode="modal" />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </header>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
