import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Alpha Phi | Zeta Phi",
  description: "Alpha Phi Zeta Phi chapter resources and new member education.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
