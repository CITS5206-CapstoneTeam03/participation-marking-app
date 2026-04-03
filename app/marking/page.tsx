import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { participationWeeks } from "../data/mock-data";

export default function MarkingPage() {
  return (
    <AppShell
      title="Mark Participation"
      description="Select a workshop week to open the marking screen. Tutors can quickly see which weeks are locked, in progress, or ready for marking."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {participationWeeks.map((week) => (
          <article key={week.id} className="panel p-5 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{week.workshop}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--navy)]">
                  {week.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{week.date}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  week.status === "locked"
                    ? "bg-[rgba(20,33,61,0.1)] text-[var(--navy)]"
                    : week.status === "in-progress"
                      ? "bg-[rgba(252,163,17,0.16)] text-[var(--navy)]"
                      : "bg-[rgba(42,157,143,0.14)] text-[var(--mint)]"
                }`}
              >
                {week.status}
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold tracking-tight text-[var(--navy)]">{week.completion}%</p>
                <p className="text-sm text-[var(--ink-soft)]">{week.submissions}</p>
              </div>
              <Link
                href={`/marking/${week.id}`}
                className={`rounded-full px-4 py-3 text-sm font-semibold ${
                  week.status === "locked"
                    ? "bg-[rgba(20,33,61,0.08)] text-[var(--ink-soft)]"
                    : "bg-[var(--navy)] text-white hover:-translate-y-0.5"
                }`}
              >
                {week.status === "locked" ? "Review marks" : "Open marking"}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
