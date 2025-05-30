import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutClient } from "./layout-client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Options-Technical Hybrid Dashboard",
  description: "A comprehensive trading platform combining options analytics and technical analysis",
  keywords: "options trading, technical analysis, stock scanner, market data, trading dashboard",
  authors: [{ name: "Options Dashboard Team" }],
  openGraph: {
    title: "Options-Technical Hybrid Dashboard",
    description: "Advanced trading platform for options and technical analysis",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}