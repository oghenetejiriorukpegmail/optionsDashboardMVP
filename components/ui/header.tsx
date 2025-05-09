"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container p-4">
        <Link href="/">
          <span className="font-bold">Options Scanner</span>
        </Link>
      </div>
    </header>
  );
}
