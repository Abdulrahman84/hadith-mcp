import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hadith MCP — Cited Sunnah Retrieval For AI Builders",
  description:
    "A local TypeScript MCP server for cited hadith lookup, Arabic and English search, source-attributed grades, and auditable SQLite provenance.",
  icons: {
    icon: "/assets/hadith-mcp-mark.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
