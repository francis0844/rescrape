"use client";

import {
  ClipboardCheck,
  Database,
  Gauge,
  History,
  KeyRound,
  ListChecks,
  LogOut,
  Rows3,
  Search,
  Send,
  Settings,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const phaseNavigation = [
  {
    number: "01",
    label: "Sources",
    status: "Live",
    href: "/sources/search",
    items: [
      { href: "/keywords", label: "Keywords", icon: ListChecks },
      { href: "/sources/search", label: "Search", icon: Search },
      { href: "/sources/scan", label: "Scan", icon: ShieldCheck },
      { href: "/sources/review", label: "Review", icon: ClipboardCheck }
    ]
  },
  {
    number: "02",
    label: "Extraction",
    status: "Preview",
    href: "/extraction/jobs",
    items: [
      { href: "/extraction/jobs", label: "Extraction jobs", icon: Database },
      { href: "/extraction/records", label: "Records", icon: Rows3 }
    ]
  },
  {
    number: "03",
    label: "Delivery",
    status: "Preview",
    href: "/delivery/destinations",
    items: [
      { href: "/delivery/destinations", label: "Destinations", icon: Send },
      { href: "/delivery/runs", label: "Deliveries", icon: History }
    ]
  }
];

type AppShellProps = {
  children: React.ReactNode;
  email?: string | null;
};

function getActivePhase(pathname: string) {
  if (pathname.startsWith("/delivery")) return 3;
  if (pathname.startsWith("/extraction")) return 2;
  return 1;
}

export function AppShell({ children, email }: AppShellProps) {
  const pathname = usePathname();
  const activePhase = getActivePhase(pathname);
  const isPrototype = activePhase > 1;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <Link className="brand-name" href="/dashboard">
            <span className="brand-mark" aria-hidden="true">R</span>
            ReScrape
          </Link>
          <p className="brand-meta">Governed web research</p>
        </div>

        <Link
          aria-current={pathname === "/dashboard" ? "page" : undefined}
          className="nav-link nav-link-overview"
          data-active={pathname === "/dashboard"}
          href="/dashboard"
        >
          <Gauge size={17} aria-hidden="true" />
          <span>Pipeline overview</span>
        </Link>

        <nav className="phase-nav" aria-label="Product phases">
          {phaseNavigation.map((phase) => (
            <section className="phase-nav-group" key={phase.number}>
              <Link className="phase-nav-heading" href={phase.href}>
                <span className="phase-number">{phase.number}</span>
                <span className="phase-name">{phase.label}</span>
                <span className="phase-status" data-status={phase.status.toLowerCase()}>
                  {phase.status}
                </span>
              </Link>
              <div className="nav-list">
                {phase.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className="nav-link"
                      data-active={isActive}
                      href={item.href}
                      key={item.href}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link
            aria-current={pathname === "/settings" ? "page" : undefined}
            className="nav-link"
            data-active={pathname === "/settings"}
            href="/settings"
          >
            <Settings size={17} aria-hidden="true" />
            <span>Settings</span>
          </Link>
          <div className="operator-email">
            <KeyRound size={14} aria-hidden="true" /> {email ?? "Signed in"}
          </div>
          <form action={signOut}>
            <SubmitButton className="button sidebar-signout" pendingLabel="Signing out...">
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>

      <div className="workspace-shell">
        <header className="pipeline-header">
          <nav className="pipeline-rail" aria-label="Research pipeline">
            {phaseNavigation.map((phase, index) => {
              const phaseNumber = index + 1;
              return (
                <Link
                  className="pipeline-stage"
                  data-active={phaseNumber === activePhase}
                  data-complete={phaseNumber < activePhase}
                  href={phase.href}
                  key={phase.number}
                >
                  <span className="pipeline-stage-number">
                    {phaseNumber < activePhase ? "✓" : phase.number}
                  </span>
                  <span>
                    <strong>{phase.label}</strong>
                    <small>
                      {phaseNumber === 1
                        ? "Find and approve sources"
                        : phaseNumber === 2
                          ? "Extract evidence-backed records"
                          : "Send data where it belongs"}
                    </small>
                  </span>
                  <span className="phase-status" data-status={phase.status.toLowerCase()}>
                    {phase.status}
                  </span>
                </Link>
              );
            })}
          </nav>
          {isPrototype ? (
            <p className="prototype-notice" role="status">
              Static prototype · No crawling, AI calls, or deliveries will run
            </p>
          ) : null}
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
