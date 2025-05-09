"use client";

import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "./components/app-header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppHeader />
          <main className="container py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
