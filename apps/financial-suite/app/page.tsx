import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main
      style={{
        display: "grid",
        gap: 24,
        margin: "0 auto",
        maxWidth: 980,
        padding: 32,
      }}
    >
      <section style={{ display: "grid", gap: 16 }}>
        <h1 style={{ fontSize: 44, lineHeight: 1, margin: 0 }}>
          Financial Suite
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 18,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          A private monthly finance workspace with live edits, debt and budget
          analytics, and AI-reviewed changes.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              style={{
                background: "var(--accent)",
                border: 0,
                borderRadius: 6,
                color: "white",
                padding: "10px 14px",
                width: 160,
              }}
            >
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">Open dashboard</Link>
        </SignedIn>
      </section>
    </main>
  );
}
