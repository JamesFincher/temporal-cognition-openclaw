import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Suite",
  description: "AI-assisted monthly financial tracker with Convex and Clerk.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="app-shell">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
