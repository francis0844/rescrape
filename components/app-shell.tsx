"use client";

import {
  ClipboardCheck,
  Gauge,
  KeyRound,
  ListChecks,
  LogOut,
  Search,
  Settings,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/keywords", label: "Keywords", icon: ListChecks },
  { href: "/sources/search", label: "Search", icon: Search },
  { href: "/sources/scan", label: "Scan", icon: ShieldCheck },
  { href: "/sources/review", label: "Review", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings }
];

type AppShellProps = {
  children: React.ReactNode;
  email?: string | null;
};

export function AppShell({ children, email }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-name">ReScrape</p>
          <p className="brand-meta">Source Searching</p>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className="nav-link"
                data-active={isActive}
                href={item.href}
                key={item.href}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="operator-email">
            <KeyRound size={14} aria-hidden="true" /> {email ?? "Signed in"}
          </div>
          <form action={signOut}>
            <SubmitButton className="button button-secondary" pendingLabel="Signing out...">
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
