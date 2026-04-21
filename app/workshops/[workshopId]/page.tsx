"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CoordinatorShell } from "../../components/coordinator-shell";
import { participationWeeks } from "../../data/mock-data";
import { useAppContext } from "../../context/app-context";

export default function WorkshopDetailPage() {
  const params = useParams<{ workshopId: string }>();
  const { workshops, workshopStudents, sessionMarks, configWeeks } = useAppContext();

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

  const enabledWeekIds = new Set(configWeeks.filter((week) => week.enabled).map((week) => week.id));
  const workshopWeekIds = participationWeeks
    .filter((week) => enabledWeekIds.has(week.id))
    .map((week) => week.id);

  const students = workshopStudents[workshop.id] ?? [];

  return (
    <CoordinatorShell>
      <header className="prototype-header">
        <h1>{workshop.name}</h1>
        <p>Student details and participation summary</p>
      </header>

      <section className="real-page-panel">
        <Link href="/workshops" className="marking-breadcrumb">← Back to Workshops</Link>
      </section>

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
                    <th>Email</th>
                    <th>Weeks Completed</th>
                    <th>Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const scores = workshopWeekIds
                      .map((weekId) => sessionMarks[weekId]?.[student.studentId])
                      .filter((score): score is number => typeof score === "number");

                    const avgScore = scores.length > 0
                      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
                      : 0;

                    return (
                      <tr key={student.studentId}>
                        <td>{student.studentId}</td>
                        <td>{student.preferredName || student.firstName} {student.lastName}</td>
                        <td>{student.email}</td>
                        <td>{scores.length} / {workshopWeekIds.length}</td>
                        <td>{avgScore.toFixed(2)}</td>
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
