"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CoordinatorShell } from "../../components/coordinator-shell";
import { useAppContext, type Score } from "../../context/app-context";

export function WorkshopDetailView() {
  const params = useParams<{ workshopId: string }>();
  const { workshops, workshopStudents, sessionMarks, configWeeks, maxWeeklyScore } = useAppContext();

  const workshop = workshops.find((item) => item.id === params.workshopId);

  if (!workshop) {
    return (
      <CoordinatorShell>
        <header className="prototype-header">
          <h1>Workshop not found</h1>
          <p>The workshop you requested does not exist.</p>
        </header>
      </CoordinatorShell>
    );
  }

  const enabledWeekIds = configWeeks.filter((w) => w.enabled).map((w) => w.id);
  const students = workshopStudents[workshop.id] ?? [];

  // Summary stats
  const totalStudents = students.length;
  const weeksCompleted = enabledWeekIds.filter((weekId) =>
    students.length > 0 && students.every((s) => sessionMarks[weekId]?.[s.studentId] !== undefined),
  ).length;
  const totalEnabledWeeks = enabledWeekIds.length;

  const allScores = students.flatMap((s) =>
    enabledWeekIds
      .map((weekId) => sessionMarks[weekId]?.[s.studentId])
      .filter((score): score is Score => score !== undefined),
  );
  const maxPossible = totalStudents * totalEnabledWeeks * maxWeeklyScore;
  const totalScore = allScores.reduce<number>((sum, s) => sum + s, 0);
  const overallProgress = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
  const avgScore = allScores.length > 0
    ? (totalScore / allScores.length).toFixed(2)
    : "0.00";

  return (
    <CoordinatorShell>
      <header className="prototype-header">
        <Link href="/workshops" className="marking-breadcrumb">← Back to All Workshops</Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1>{workshop.name}</h1>
            {workshop.tutorName && (
              <p style={{ marginTop: 4, fontSize: 15, color: "var(--ink-soft)" }}>
                Tutor: <strong style={{ color: "var(--navy)" }}>{workshop.tutorName}</strong>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Summary stat cards */}
      <section className="real-page-panel">
        <div className="dashboard-metric-grid">
          <div className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label">Students</p>
            <p className="dashboard-metric-value">{totalStudents}</p>
          </div>
          <div className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label">Weeks Completed</p>
            <p className="dashboard-metric-value">{weeksCompleted} / {totalEnabledWeeks}</p>
          </div>
          <div className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label">Overall Progress</p>
            <p className="dashboard-metric-value">{overallProgress}%</p>
          </div>
          <div className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label">Avg Score</p>
            <p className="dashboard-metric-value">{avgScore}</p>
          </div>
        </div>
      </section>

      {/* Students table */}
      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Students</h2>
          {students.length === 0 ? (
            <p className="dashboard-empty">No students uploaded for this workshop yet.</p>
          ) : (
            <div className="review-table-wrapper">
              <table className="review-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Weeks Completed</th>
                    <th>Total Score</th>
                    <th>Average</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const studentScores = enabledWeekIds
                      .map((weekId) => sessionMarks[weekId]?.[student.studentId])
                      .filter((score): score is Score => score !== undefined);

                    const weeksMarked = studentScores.length;
                    const studentTotal = studentScores.reduce<number>((sum, s) => sum + s, 0);
                    const studentAvg = weeksMarked > 0
                      ? (studentTotal / weeksMarked).toFixed(2)
                      : "0.00";

                    return (
                      <tr key={student.studentId}>
                        <td>{student.studentId}</td>
                        <td>{student.preferredName || student.firstName} {student.lastName}</td>
                        <td>{weeksMarked} / {totalEnabledWeeks}</td>
                        <td style={{ fontWeight: 700 }}>{studentTotal}</td>
                        <td>{studentAvg}</td>
                        <td>
                          <Link
                            href={`/workshops/${workshop.id}/students/${student.studentId}`}
                            style={{ color: "var(--nav-accent)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
                          >
                            View Details
                          </Link>
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
