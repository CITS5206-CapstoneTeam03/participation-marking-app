"use client";

import { useState } from "react";
import Link from "next/link";
import { CoordinatorShell } from "../components/coordinator-shell";
import { useAppContext } from "../context/app-context";

export default function ConfigPage() {
  const {
    configWeeks: weeks,
    setConfigWeeks: setWeeks,
    maxWeeklyScore,
    totalParticipationPoints,
    totalAssessmentWeighting,
    saveSystemConfig,
    saveEnabledWeeks,
  } = useAppContext();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"unit" | "students">("unit");

  const selectedWeeks = weeks.filter((w) => w.enabled);
  const totalPoints = totalParticipationPoints;
  const totalPointsLabel = totalPoints ?? "Not configured";
  const gradeValuePerPoint =
    totalPoints && totalPoints > 0
      ? `${(totalAssessmentWeighting / totalPoints).toFixed(2)}%`
      : "Not configured";

  const markSaving = () => {
    setSaveError(null);
  };

  const markSaved = () => {
    setSaveError(null);
  };

  const markSaveFailed = () => {
    setSaveError("Unable to save configuration.");
  };

  const persistWeeks = (nextWeeks: typeof weeks) => {
    void saveEnabledWeeks(nextWeeks).then(markSaved).catch(markSaveFailed);
  };

  const persistSystemConfig = (options: Parameters<typeof saveSystemConfig>[0]) => {
    void saveSystemConfig(options).then(markSaved).catch(markSaveFailed);
  };

  const toggleWeek = (weekId: string) => {
    markSaving();
    const nextWeeks = weeks.map((w) => (w.id === weekId && !w.locked ? { ...w, enabled: !w.enabled } : w));
    setWeeks(nextWeeks);
    persistWeeks(nextWeeks);
  };

  const week6Ids = ["week-1", "week-2", "week-3", "week-4", "week-5", "week-6"];
  const week12Ids = ["week-7", "week-8", "week-9", "week-10", "week-11", "week-12"];

  const week6Targets = weeks.filter((w) => week6Ids.includes(w.id));
  const week12Targets = weeks.filter((w) => week12Ids.includes(w.id));

  const week6AllLocked = week6Targets.length > 0 && week6Targets.every((w) => w.locked);
  const week12AllLocked = week12Targets.length > 0 && week12Targets.every((w) => w.locked);

  const toggleWeek6Lock = () => {
    markSaving();
    let nextWeeks: typeof weeks;
    if (week6AllLocked) {
      nextWeeks = weeks.map((w) => (week6Ids.includes(w.id) ? { ...w, locked: false } : w));
    } else {
      // Locking should never force week selection; preserve existing enabled states.
      nextWeeks = weeks.map((w) => (week6Ids.includes(w.id) ? { ...w, locked: true } : w));
    }
    setWeeks(nextWeeks);
    persistSystemConfig({ weeks: nextWeeks });
  };

  const toggleWeek12Lock = () => {
    markSaving();
    let nextWeeks: typeof weeks;
    if (week12AllLocked) {
      nextWeeks = weeks.map((w) => (week12Ids.includes(w.id) ? { ...w, locked: false } : w));
    } else {
      // Locking should never force week selection; preserve existing enabled states.
      nextWeeks = weeks.map((w) => (week12Ids.includes(w.id) ? { ...w, locked: true } : w));
    }
    setWeeks(nextWeeks);
    persistSystemConfig({ weeks: nextWeeks });
  };

  return (
    <CoordinatorShell>
      {/* Page header */}
      <div className="prototype-header mb-6 flex items-end justify-between gap-4">
        <div>
          <h1>Settings</h1>
          <p>Manage unit configuration and student management</p>
        </div>
        <p className="text-xs text-[var(--ink-soft)]">Changes are auto-saved</p>
      </div>
      <div className="config-tabs">
        <button
          type="button"
          className={`config-tab${activeTab === "unit" ? " active" : ""}`}
          onClick={() => setActiveTab("unit")}
        >
          Unit Configuration
        </button>
        <button
          type="button"
          className={`config-tab${activeTab === "students" ? " active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Student Management
        </button>
      </div>

      {saveError && activeTab === "unit" && (
        <div className="config-save-banner">{saveError}</div>
      )}

      {activeTab === "unit" && (
        <div className="config-layout">
          {/* ── Left: Participation Weeks ── */}
          <div className="panel p-7">
            <p className="text-lg font-bold tracking-tight text-[var(--navy)]">
              Participation Weeks
            </p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Select which weeks will have participation assessment
            </p>

            <div className="config-weeks-grid">
              {weeks.map((week) => (
                <button
                  key={week.id}
                  type="button"
                  disabled={week.locked}
                  onClick={() => toggleWeek(week.id)}
                  aria-pressed={week.enabled}
                  className={`config-week-tile${week.locked ? " locked" : week.enabled ? " enabled" : ""}`}
                >
                  {week.label}
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              Selected:{" "}
              <strong className="text-[var(--navy)]">{selectedWeeks.length}</strong> of {weeks.length} weeks
            </p>
          </div>

          {/* ── Right: Scoring + Milestones ── */}
          <div className="config-side-stack">
            {/* Scoring */}
            <div className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: "#eef2ff" }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--nav-accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                </div>
                <span className="config-card-title">Scoring</span>
              </div>

              <div className="config-field">
                <label htmlFor="max-weekly-score" className="config-field-label">Max Weekly Score</label>
                <input
                  id="max-weekly-score"
                  type="text"
                  value={maxWeeklyScore}
                  readOnly
                  className="config-field-input"
                />
              </div>

              <div className="config-field">
                <label htmlFor="total-weighting" className="config-field-label">
                  Total Assessment Weighting (%)
                </label>
                <input
                  id="total-weighting"
                  type="text"
                  value={totalAssessmentWeighting}
                  readOnly
                  className="config-field-input"
                />
              </div>

              <div className="config-field">
                <label htmlFor="total-points" className="config-field-label">
                  Total Participation Points
                </label>
                <input
                  id="total-points"
                  type="text"
                  value={totalPointsLabel}
                  readOnly
                  className="config-field-input"
                />
                <p className="config-calc-hint">
                  From backend configuration
                </p>
              </div>

              <div className="config-field">
                <label htmlFor="per-point-value" className="config-field-label">
                  Grade Value per Point
                </label>
                <input
                  id="per-point-value"
                  type="text"
                  value={gradeValuePerPoint}
                  readOnly
                  className="config-field-input"
                />
                <p className="config-calc-hint">
                  Based on backend participation points
                </p>
              </div>
            </div>

            {/* Milestones */}
            <div className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: "#fff8e1" }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dd7a00"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <span className="config-card-title">Milestones</span>
              </div>

              <div className="config-milestone-list">
                <div className="config-milestone-item">
                  <div>
                    <p className="config-milestone-name">Week 6 Lock</p>
                    <p className="config-milestone-sub">First half semester</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleWeek6Lock}
                    data-locked={String(week6AllLocked)}
                    className="config-milestone-badge"
                    title={week6AllLocked ? "Click to unlock Weeks 1–6" : "Click to lock Weeks 1–6"}
                  >
                    {week6AllLocked ? "Locked" : "Unlocked"}
                  </button>
                </div>

                <div className="config-milestone-item">
                  <div>
                    <p className="config-milestone-name">Week 12 Lock</p>
                    <p className="config-milestone-sub">End of semester</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleWeek12Lock}
                    data-locked={String(week12AllLocked)}
                    className="config-milestone-badge"
                    title={week12AllLocked ? "Click to unlock Weeks 7–12" : "Click to lock Weeks 7–12"}
                  >
                    {week12AllLocked ? "Locked" : "Unlocked"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="panel p-7">
          <p className="text-lg font-bold tracking-tight text-[var(--navy)]">Student Management</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Import and manage student rosters for each workshop.
          </p>
          <Link
            href="/students"
            style={{
              display: "inline-block",
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 10,
              background: "#3f5efb",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Go to Student Management →
          </Link>
        </div>
      )}
    </CoordinatorShell>
  );
}
