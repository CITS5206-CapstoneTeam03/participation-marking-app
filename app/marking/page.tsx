"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TutorShell } from "../components/tutor-shell";
// TODO(T-API): replace participationWeeks with GET /weeks API response once backend is integrated
import { participationWeeks } from "../data/mock-data";
import { useAppContext } from "../context/app-context";

export default function MarkingPage() {
  const router = useRouter();
  const { configWeeks, workshops, workshopStudents, currentUserName, sessionMarks, setActiveWorkshopId } = useAppContext();

  // Only show weeks the UC has enabled that also have a corresponding participationWeek entry
  const enabledIds = new Set(configWeeks.filter((w) => w.enabled && !w.locked).map((w) => w.id));
  const assignedWorkshops = useMemo(
    () => workshops.filter((workshop) => workshop.tutorName && workshop.tutorName === currentUserName),
    [workshops, currentUserName],
  );
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

  const selectedWorkshop = assignedWorkshops.find((workshop) => workshop.id === selectedWorkshopId) ?? assignedWorkshops[0];

  const visibleWeeks = selectedWorkshop
    ? participationWeeks.filter((week) => enabledIds.has(week.id))
    : [];
  const selectedWorkshopStudentCount = selectedWorkshop ? (workshopStudents[selectedWorkshop.id]?.length ?? 0) : 0;
  const selectedWorkshopStudentIds = useMemo(
    () => new Set((selectedWorkshop ? (workshopStudents[selectedWorkshop.id] ?? []) : []).map((student) => student.studentId)),
    [selectedWorkshop, workshopStudents],
  );

  return (
    <TutorShell>
      <header className="prototype-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h1>Mark Participation</h1>
          <p style={{ marginTop: "6px" }}>Select workshop and week to begin marking</p>
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
          <h2 className="week-select-title" style={{ marginBottom: "12px" }}>Select Workshop</h2>
          {assignedWorkshops.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", padding: "8px 0 20px" }}>
              No workshop assigned to your tutor view yet. Ask the Unit Coordinator to assign you.
            </p>
          ) : (
            <div className="dashboard-list" style={{ marginBottom: "18px" }}>
              {assignedWorkshops.map((workshop) => (
                <button
                  key={workshop.id}
                  type="button"
                  className="dashboard-list-row"
                  onClick={() => setSelectedWorkshopId(workshop.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderColor: selectedWorkshop?.id === workshop.id ? "#a9b7ff" : "var(--panel-border)",
                    background: selectedWorkshop?.id === workshop.id ? "#eef2ff" : "#f7f9fc",
                  }}
                >
                  <div>
                    <p className="dashboard-list-title">{workshop.name}</p>
                    <p className="dashboard-list-sub">{workshopStudents[workshop.id]?.length ?? 0} students</p>
                  </div>
                </button>
              ))}
            </div>
          )}

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
                Showing {visibleWeeks.length} week{visibleWeeks.length !== 1 ? "s" : ""} for {selectedWorkshop?.name ?? "assigned workshop"}
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
                const total = selectedWorkshopStudentCount;
                const marked = Object.keys(sessionMarks[week.id] ?? {}).filter((sid) =>
                  selectedWorkshopStudentIds.has(sid),
                ).length;
                const isComplete = total > 0 && marked >= total;

                return (
                  <button
                    key={week.id}
                    type="button"
                    className={`week-card${isComplete ? " week-card--complete" : ""}`}
                    onClick={() => {
                      if (selectedWorkshop) setActiveWorkshopId(selectedWorkshop.id);
                      router.push(`/marking/${week.id}`);
                    }}
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
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </TutorShell>
  );
}
