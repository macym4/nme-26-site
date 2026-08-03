import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Aster | Welcome",
  description: "Create an account or sign in to Aster.",
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
