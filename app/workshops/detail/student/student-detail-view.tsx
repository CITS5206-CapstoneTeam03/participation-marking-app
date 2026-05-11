"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CoordinatorShell } from "../../../components/coordinator-shell";
import { useAppContext, type Score } from "../../../context/app-context";

function getStatus(gradePct: number): { label: string; sub: string; color: string } {
  if (gradePct >= 50) return { label: "On Track", sub: "≥ 50%", color: "#16a34a" };
  return { label: "At Risk", sub: "< 50%", color: "#ea580c" };
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div style={{
      width: 96, height: 96, borderRadius: 16, background: "#3f5efb",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 32, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: "id" | "email" | "workshop"; label: string; value: string }) {
  const iconEl = icon === "id"
    ? <span style={{ fontWeight: 800, fontSize: 13 }}>#</span>
    : icon === "email"
      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "#f4f6fb", borderRadius: 10, padding: "8px 14px",
    }}>
      <span style={{ color: "var(--nav-accent)", display: "flex", alignItems: "center" }}>{iconEl}</span>
      <div>
        <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        <p style={{ fontSize: 14, color: "var(--navy)", margin: 0, fontWeight: 600 }}>{value}</p>
      </div>
    </div>
  );
}

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: "inline-block", padding: "3px 10px", borderRadius: 99,
    background: bg, color, fontSize: 12, fontWeight: 600,
  };
}

export function StudentDetailView() {
  const searchParams = useSearchParams();
  const workshopId = searchParams.get("workshopId") ?? "";
  const studentId = searchParams.get("studentId") ?? "";

  const { workshops, workshopStudents, sessionMarks, configWeeks, maxWeeklyScore } = useAppContext();

  const workshop = workshops.find((w) => w.id === workshopId);
  const students = workshop ? (workshopStudents[workshop.id] ?? []) : [];
  const student = students.find((s) => s.studentId === studentId);

  if (!workshop || !student) {
    return (
      <CoordinatorShell>
        <header className="prototype-header">
          <Link href="/workshops" className="marking-breadcrumb">← Back to Workshops</Link>
          <h1>Student not found</h1>
        </header>
      </CoordinatorShell>
    );
  }

  const displayName = `${student.preferredName ?? student.firstName} ${student.lastName}`;
  const enabledWeeks = configWeeks.filter((w) => w.enabled);

  const weekScores = enabledWeeks.map((week) => ({
    week,
    score: sessionMarks[week.id]?.[student.studentId],
  }));

  const markedScores = weekScores
    .filter((e) => e.score !== undefined)
    .map((e) => e.score as Score);

  const totalScore = markedScores.reduce<number>((sum, s) => sum + s, 0);
  const maxPossible = enabledWeeks.length * maxWeeklyScore;
  const avgPerWeek = markedScores.length > 0 ? (totalScore / markedScores.length).toFixed(1) : "0.0";
  const gradePct = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
  const status = getStatus(gradePct);

  return (
    <CoordinatorShell>
      <header className="prototype-header">
        <Link href={`/workshops/detail?id=${workshop.id}`} className="marking-breadcrumb">
          ← Back to {workshop.name}
        </Link>
      </header>

      {/* Profile card */}
      <section className="real-page-panel">
        <article className="prototype-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <InitialsAvatar name={displayName} />
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", margin: 0 }}>{displayName}</h1>
              <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                <InfoChip icon="id" label="Student ID" value={student.studentId} />
                <InfoChip icon="email" label="Email" value={student.email} />
                <InfoChip icon="workshop" label="Workshop" value={workshop.name} />
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* Stat cards */}
      <section className="real-page-panel">
        <div className="dashboard-metric-grid">
          <div className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label" style={{ color: "#6366f1" }}>Total Score</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: "#6366f1", margin: "10px 0 4px" }}>{totalScore}</p>
            <p className="dashboard-metric-helper">out of {maxPossible} points</p>
          </div>
          <div className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label" style={{ color: "#16a34a" }}>Average</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: "#16a34a", margin: "10px 0 4px" }}>{avgPerWeek}</p>
            <p className="dashboard-metric-helper">per week</p>
          </div>
          <div className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label" style={{ color: "var(--nav-accent)" }}>Grade</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: "var(--nav-accent)", margin: "10px 0 4px" }}>
              {gradePct.toFixed(1)}%
            </p>
            <p className="dashboard-metric-helper">overall completion</p>
          </div>
          <div className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label" style={{ color: status.color }}>Status</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: status.color, margin: "10px 0 4px" }}>{status.label}</p>
            <p className="dashboard-metric-helper">{status.sub}</p>
          </div>
        </div>
      </section>

      {/* Progress bar */}
      <section className="real-page-panel">
        <article className="prototype-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", margin: 0 }}>Overall Progress</p>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>
              {totalScore} / {maxPossible} points ({gradePct.toFixed(1)}%)
            </p>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: "#e8edf5", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${gradePct}%`,
              borderRadius: 99,
              background: "linear-gradient(90deg, #3f5efb, #6366f1)",
              transition: "width 0.4s ease",
            }} />
          </div>
        </article>
      </section>

      {/* Weekly breakdown */}
      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Weekly Participation Marks</h2>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
            Detailed breakdown of participation scores by week
          </p>
          {enabledWeeks.length === 0 ? (
            <p className="dashboard-empty">No participation weeks configured.</p>
          ) : (
            <div className="review-table-wrapper">
              <table className="review-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Score</th>
                    <th>Out of</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weekScores.map(({ week, score }) => {
                    const marked = score !== undefined;
                    const absent = marked && score === 0;
                    return (
                      <tr key={week.id}>
                        <td style={{ fontWeight: 600 }}>{week.label}</td>
                        <td style={{ fontWeight: 700, color: marked ? "var(--navy)" : "var(--ink-soft)" }}>
                          {marked ? score : "—"}
                        </td>
                        <td style={{ color: "var(--ink-soft)" }}>{maxWeeklyScore}</td>
                        <td>
                          {!marked ? (
                            <span style={badgeStyle("#e8edf5", "#708097")}>Not marked</span>
                          ) : absent ? (
                            <span style={badgeStyle("#fff7ed", "#c2410c")}>Absent</span>
                          ) : score! >= maxWeeklyScore ? (
                            <span style={badgeStyle("#f0fdf4", "#16a34a")}>Full marks</span>
                          ) : (
                            <span style={badgeStyle("#eff6ff", "#2563eb")}>Marked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </CoordinatorShell>
  );
}
