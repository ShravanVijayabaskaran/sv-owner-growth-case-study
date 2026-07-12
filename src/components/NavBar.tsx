"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

export function NavBar() {
  const pathname = usePathname();
  return (
    <header className="nav">
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, height: 58 }}>
          <Link href="/" style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: "-0.01em" }}>Owner.com</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Product Analytics</span>
          </Link>
          <nav style={{ display: "flex", gap: 4, alignItems: "center", overflowX: "auto", flex: 1 }}>
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
