import Link from "next/link";
import { AppShell } from "./components/app-shell";
import { dashboardMetrics, participationWeeks } from "./data/mock-data";

const toneClasses = {
  navy: "bg-[rgba(20,33,61,0.09)] text-[var(--navy)]",
  gold: "bg-[rgba(252,163,17,0.16)] text-[var(--navy)]",
  mint: "bg-[rgba(42,157,143,0.14)] text-[var(--mint)]",
};

export default function Home() {
  const nextWeek = participationWeeks.find((week) => week.status !== "locked") ?? participationWeeks[0];

  return (
    <AppShell
      title="Dashboard"
      description="A tutor-facing overview of marking progress, available weeks, and quick entry points into the touch-friendly participation flow."
      action={
        <Link
          href={`/marking/${nextWeek.id}`}
          className="inline-flex items-center rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(20,33,61,0.18)]"
        >
          Continue marking {nextWeek.label}
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <article key={metric.label} className="panel p-5 lg:p-6">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[metric.tone]}`}>
              {metric.label}
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-[var(--navy)]">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel p-5 lg:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Weekly Participation Marks</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--navy)]">
                Active participation weeks
              </h3>
            </div>
            <Link
              href="/config"
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] hover:-translate-y-0.5"
            >
              Open unit config
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {participationWeeks.map((week) => (
              <Link
                key={week.id}
                href={`/marking/${week.id}`}
                className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(20,33,61,0.08)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">{week.workshop}</p>
                    <h4 className="mt-2 text-xl font-semibold text-[var(--navy)]">{week.label}</h4>
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

                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{week.date}</p>
                <div className="mt-4 h-2 rounded-full bg-[rgba(20,33,61,0.08)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--mint))]"
                    style={{ width: `${week.completion}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--navy)]">{week.submissions}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel p-5 lg:p-6">
          <p className="eyebrow">Workflow Notes</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--navy)]">
            Shared frontend delivery plan
          </h3>

          <ol className="mt-6 space-y-4 text-sm leading-6 text-[var(--ink-soft)]">
            <li className="rounded-2xl bg-white/80 p-4">
              1. Build the week selection route and lock-state indicators for tutors.
            </li>
            <li className="rounded-2xl bg-white/80 p-4">
              2. Implement the 0-3 marking cards with large tap targets for workshop use.
            </li>
            <li className="rounded-2xl bg-white/80 p-4">
              3. Add the unit configuration dashboard for enabled weeks and score weighting.
            </li>
            <li className="rounded-2xl bg-white/80 p-4">
              4. Swap mock data for API-backed state after backend contracts stabilise.
            </li>
          </ol>

          <Link
            href="/marking"
            className="mt-6 inline-flex items-center rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[var(--navy)] hover:-translate-y-0.5"
          >
            Review week selection flow
          </Link>
        </article>
      </section>
    </AppShell>
  );
}
