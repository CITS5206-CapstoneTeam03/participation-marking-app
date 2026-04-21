"use client";

import { useState } from "react";
import { AppShell } from "../components/app-shell";
import { useAppContext } from "../context/app-context";

export default function ConfigPage() {
  const { configWeeks: weeks, setConfigWeeks: setWeeks, maxWeeklyScore, setMaxWeeklyScore } = useAppContext();
  const [saved, setSaved] = useState(false);

  const selectedWeeks = weeks.filter((week) => week.enabled);
  const totalPoints = selectedWeeks.length * maxWeeklyScore;

  const toggleWeek = (weekId: string) => {
    setSaved(false);
    setWeeks(
      weeks.map((week) =>
        week.id === weekId && !week.locked ? { ...week, enabled: !week.enabled } : week,
      ),
    );
  };

  const lockWeeks = (targetWeeks: string[]) => {
    setSaved(false);
    setWeeks(
      weeks.map((week) =>
        targetWeeks.includes(week.id) ? { ...week, locked: true, enabled: true } : week,
      ),
    );
  };

  return (
    <AppShell
      title="Unit Configuration"
      description="Admin configuration screen for enabling participation weeks, adjusting the maximum weekly score, and locking confirmed week ranges."
      action={
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5"
        >
          Save configuration
        </button>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Participation Weeks</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--navy)]">
                Select markable weeks
              </h3>
            </div>

            <label className="panel-muted flex items-center gap-3 px-4 py-3">
              <span className="text-sm font-semibold text-[var(--navy)]">Max weekly score</span>
              <input
                type="range"
                min="1"
                max="3"
                value={maxWeeklyScore}
                onChange={(event) => {
                  setSaved(false);
                  setMaxWeeklyScore(Number(event.target.value));
                }}
                className="accent-[var(--gold)]"
              />
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--navy)]">
                {maxWeeklyScore}
              </span>
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {weeks.map((week) => (
              <button
                key={week.id}
                type="button"
                onClick={() => toggleWeek(week.id)}
                className={`rounded-3xl border p-4 text-left ${
                  week.enabled
                    ? "border-[var(--gold)] bg-[rgba(252,163,17,0.14)]"
                    : "border-[var(--line)] bg-white/80"
                } ${week.locked ? "cursor-not-allowed opacity-75" : "hover:-translate-y-0.5"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-semibold text-[var(--navy)]">{week.label}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      week.locked
                        ? "bg-[rgba(20,33,61,0.1)] text-[var(--navy)]"
                        : week.enabled
                          ? "bg-white text-[var(--navy)]"
                          : "bg-[rgba(20,33,61,0.06)] text-[var(--ink-soft)]"
                    }`}
                  >
                    {week.locked ? "Locked" : week.enabled ? "Selected" : "Optional"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                  {week.locked
                    ? "Locked weeks stay enabled and cannot be edited."
                    : "Tap to include or exclude this week from participation marking."}
                </p>
              </button>
            ))}
          </div>
        </article>

        <article className="space-y-6">
          <div className="panel p-5 lg:p-6">
            <p className="eyebrow">Configuration Summary</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--navy)]">
              Weighting dashboard
            </h3>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/80 p-4">
                <p className="eyebrow">Selected Weeks</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-[var(--navy)]">
                  {selectedWeeks.length}
                </p>
              </div>
              <div className="rounded-3xl bg-white/80 p-4">
                <p className="eyebrow">Total Participation Points</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-[var(--mint)]">
                  {totalPoints}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-white/80 p-4">
              <p className="eyebrow">Selected weeks</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedWeeks.map((week) => (
                  <span
                    key={week.id}
                    className="rounded-full bg-[rgba(42,157,143,0.14)] px-3 py-2 text-sm font-semibold text-[var(--mint)]"
                  >
                    {week.label}
                  </span>
                ))}
              </div>
            </div>

            {saved ? (
              <div className="mt-6 rounded-3xl border border-[rgba(42,157,143,0.22)] bg-[rgba(42,157,143,0.1)] p-4 text-sm font-semibold text-[var(--mint)]">
                Configuration saved successfully.
              </div>
            ) : null}
          </div>

          <div className="panel p-5 lg:p-6">
            <p className="eyebrow">Lock Controls</p>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => lockWeeks(["week-1", "week-2", "week-3", "week-4", "week-6"])}
                className="rounded-3xl bg-[rgba(252,163,17,0.14)] px-4 py-4 text-left hover:-translate-y-0.5"
              >
                <span className="block text-sm font-semibold text-[var(--navy)]">Week 6 Lock</span>
                <span className="mt-1 block text-sm text-[var(--ink-soft)]">
                  Confirm and lock Weeks 1-6 after moderation.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  lockWeeks(["week-1", "week-2", "week-3", "week-4", "week-6", "week-9", "week-10", "week-11", "week-12"])
                }
                className="rounded-3xl bg-[rgba(20,33,61,0.08)] px-4 py-4 text-left hover:-translate-y-0.5"
              >
                <span className="block text-sm font-semibold text-[var(--navy)]">Week 12 Lock</span>
                <span className="mt-1 block text-sm text-[var(--ink-soft)]">
                  Confirm the final participation set and freeze all configured weeks.
                </span>
              </button>
            </div>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
