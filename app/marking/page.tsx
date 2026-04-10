"use client";

import Link from "next/link";
import { TutorShell } from "../components/tutor-shell";
import { participationWeeks, getMarksForWeek } from "../data/mock-data";
import { useAppContext } from "../context/app-context";

export default function MarkingPage() {
  const { configWeeks, getWeekMarkedCount } = useAppContext();

  // Only show weeks the UC has enabled that also have a corresponding participationWeek entry
  const enabledIds = new Set(configWeeks.filter((w) => w.enabled).map((w) => w.id));
  const visibleWeeks = participationWeeks.filter((w) => enabledIds.has(w.id));

  return (
    <TutorShell>
      <header className="prototype-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h1>Mark Participation</h1>
          <p style={{ marginTop: "6px" }}>Select a week to begin marking</p>
        </div>
        <Link
          href="/"
          style={{
            marginTop: "8px",
            flexShrink: 0,
            padding: "10px 20px",
            borderRadius: "12px",
            border: "1.5px solid var(--panel-border)",
            background: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--navy)",
            whiteSpace: "nowrap",
          }}
        >
          Change Workshop
        </Link>
      </header>

      <section className="real-page-panel">
        <div className="week-select-panel">
          {/* Panel header */}
          <div className="week-select-header">
            <div className="week-select-icon" aria-hidden="true">
              {/* Calendar icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3f5efb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2 className="week-select-title">Select Week to Mark</h2>
              <p className="week-select-subtitle">
                Showing all {visibleWeeks.length} week{visibleWeeks.length !== 1 ? "s" : ""} configured by Unit Coordinator
              </p>
            </div>
          </div>

          {/* Week grid */}
          {visibleWeeks.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", padding: "24px 0" }}>
              No weeks have been enabled yet. Ask the Unit Coordinator to configure weeks in Settings.
            </p>
          ) : (
            <div className="week-grid">
              {visibleWeeks.map((week) => {
                const total = getMarksForWeek(week.id).length;
                const marked = getWeekMarkedCount(week.id);
                const isComplete = total > 0 && marked >= total;

                return (
                  <Link
                    key={week.id}
                    href={`/marking/${week.id}`}
                    className={`week-card${isComplete ? " week-card--complete" : ""}`}
                  >
                    {isComplete && (
                      <span className="week-card-check" aria-label="Complete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      </span>
                    )}
                    <p className="week-card-label">Week</p>
                    <p className="week-card-number">{week.weekNumber}</p>
                    <p className="week-card-count">{marked} / {total} marked</p>
                    {isComplete && <p className="week-card-complete-badge">Complete</p>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </TutorShell>
  );
}
