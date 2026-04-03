"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navigationItems } from "../data/mock-data";

type AppShellProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, action, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">CITS5206</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--navy)]">
                UWA Participation Marking System
              </h1>
            </div>
            <span className="status-pill">Live prototype</span>
          </div>

          <nav className="mt-8 space-y-3">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl border px-4 py-4 ${
                    isActive
                      ? "border-[var(--gold)] bg-[rgba(252,163,17,0.14)] shadow-[0_14px_30px_rgba(252,163,17,0.16)]"
                      : "border-[var(--line)] bg-white/70 hover:-translate-y-0.5 hover:border-[rgba(20,33,61,0.2)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-[var(--navy)]">{item.label}</span>
                    <span className="font-mono text-xs text-[var(--ink-soft)]">
                      {item.href === "/" ? "00" : item.href === "/marking" ? "01" : "02"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.description}</p>
                </Link>
              );
            })}
          </nav>

          <div className="panel-muted mt-8 p-4">
            <p className="eyebrow">Assigned Scope</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
              <li>`T-201` Touch-friendly 0-3 marking flow</li>
              <li>`T-401` Week selection and weighting dashboard</li>
            </ul>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="panel overflow-hidden p-6 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">Frontend Prototype</p>
                <h2 className="section-heading mt-2">{title}</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--ink-soft)]">
                  {description}
                </p>
              </div>
              {action}
            </div>
          </section>

          {children}
        </main>
      </div>
    </div>
  );
}
