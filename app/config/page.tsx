"use client";

import { useState } from "react";
import { CoordinatorShell } from "../components/coordinator-shell";
import { useAppContext } from "../context/app-context";
import { replaceEnabledWeeks, updateCurrentSystemConfig } from "../lib/services/participation";

export default function ConfigPage() {
  const {
    configWeeks: weeks,
    setConfigWeeks: setWeeks,
    maxWeeklyScore,
    setMaxWeeklyScore,
    totalAssessmentWeighting,
    setTotalAssessmentWeighting,
    currentUserId,
  } = useAppContext();

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"unit" | "students">("unit");

  const selectedWeeks = weeks.filter((w) => w.enabled);
  const totalPoints = selectedWeeks.length * maxWeeklyScore;

  const toggleWeek = (weekId: string) => {
    setSaved(false);
    setSaveError(null);
    setWeeks(weeks.map((w) => (w.id === weekId && !w.locked ? { ...w, enabled: !w.enabled } : w)));
  };

  const week6Ids = ["week-1", "week-2", "week-3", "week-4", "week-5", "week-6"];
  const week12Ids = ["week-7", "week-8", "week-9", "week-10", "week-11", "week-12"];

  const week6Targets = weeks.filter((w) => week6Ids.includes(w.id));
  const week12Targets = weeks.filter((w) => week12Ids.includes(w.id));

  const week6AllLocked = week6Targets.length > 0 && week6Targets.every((w) => w.locked);
  const week12AllLocked = week12Targets.length > 0 && week12Targets.every((w) => w.locked);

  const toggleWeek6Lock = () => {
    setSaved(false);
    setSaveError(null);
    if (week6AllLocked) {
      setWeeks(weeks.map((w) => (week6Ids.includes(w.id) ? { ...w, locked: false } : w)));
    } else {
      // Locking should never force week selection; preserve existing enabled states.
      setWeeks(weeks.map((w) => (week6Ids.includes(w.id) ? { ...w, locked: true } : w)));
    }
  };

  const toggleWeek12Lock = () => {
    setSaved(false);
    setSaveError(null);
    if (week12AllLocked) {
      setWeeks(weeks.map((w) => (week12Ids.includes(w.id) ? { ...w, locked: false } : w)));
    } else {
      // Locking should never force week selection; preserve existing enabled states.
      setWeeks(weeks.map((w) => (week12Ids.includes(w.id) ? { ...w, locked: true } : w)));
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      await replaceEnabledWeeks(selectedWeeks.map((week) => week.weekNumber));
      await updateCurrentSystemConfig({
        max_weekly_score: maxWeeklyScore,
        total_participation_points: totalAssessmentWeighting,
        is_configured: selectedWeeks.length > 0,
        week6_lock_enabled: week6AllLocked,
        week12_lock_enabled: week12AllLocked,
        updated_by_user_id: currentUserId,
      });
      setSaved(true);
    } catch {
      setSaveError("Saved locally. Backend configuration could not be updated from this frontend session.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CoordinatorShell>
      {/* Page header */}
      <div className="prototype-header mb-6 flex items-end justify-between gap-4">
        <div>
          <h1>Settings</h1>
          <p>Manage unit configuration and student management</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={saveConfiguration}
            disabled={isSaving}
            className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {isSaving ? "Saving..." : "Save configuration"}
          </button>
          <p className="text-xs text-[var(--ink-soft)]">Changes are auto-saved</p>
        </div>
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

      {saved && activeTab === "unit" && (
        <div className="config-save-banner">Configuration saved successfully.</div>
      )}
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
                <label htmlFor="max-weekly-score" className="config-field-label">
                  Max Weekly Score
                </label>
                <input
                  id="max-weekly-score"
                  type="number"
                  min={1}
                  max={3}
                  value={maxWeeklyScore}
                  onChange={(e) => {
                    setSaved(false);
                    setSaveError(null);
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v) && v >= 1 && v <= 3) setMaxWeeklyScore(v);
                  }}
                  className="config-field-input"
                />
              </div>

              <div className="config-field">
                <label htmlFor="total-weighting" className="config-field-label">
                  Total Assessment Weighting (%)
                </label>
                <input
                  id="total-weighting"
                  type="number"
                  min={0}
                  max={100}
                  value={totalAssessmentWeighting}
                  onChange={(e) => {
                    setSaved(false);
                    setSaveError(null);
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v))
                      setTotalAssessmentWeighting(Math.min(100, Math.max(0, v)));
                  }}
                  className="config-field-input"
                />
              </div>

              <div className="config-field">
                <label htmlFor="total-points" className="config-field-label">
                  Total Participation Points
                </label>
                <input
                  id="total-points"
                  type="number"
                  value={totalPoints}
                  readOnly
                  className="config-field-input"
                />
                <p className="config-calc-hint">
                  Auto-calculated: {selectedWeeks.length} weeks × {maxWeeklyScore} = {totalPoints}
                </p>
              </div>

              <div className="config-field">
                <label htmlFor="per-point-value" className="config-field-label">
                  Grade Value per Point
                </label>
                <input
                  id="per-point-value"
                  type="text"
                  value={totalPoints > 0 ? `${(totalAssessmentWeighting / totalPoints).toFixed(2)}%` : "—"}
                  readOnly
                  className="config-field-input"
                />
                <p className="config-calc-hint">
                  Auto-calculated: {totalAssessmentWeighting}% ÷ {totalPoints} pts
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
            Student roster management coming in a future release.
          </p>
        </div>
      )}
    </CoordinatorShell>
  );
}
