"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CoordinatorShell } from "../../components/coordinator-shell";
import { participationWeeks } from "../../data/mock-data";
import { useAppContext, type Score, type WorkshopRecord } from "../../context/app-context";
import { getUsers } from "../../lib/services/user";
import { getWorkshopById, getWorkshopStudents } from "../../lib/services/workshop";

export function WorkshopDetailView() {
  const searchParams = useSearchParams();
  const workshopId = searchParams.get("id") ?? "";

  const { workshops, workshopStudents, sessionMarks, configWeeks, maxWeeklyScore } = useAppContext();
  const [apiWorkshop, setApiWorkshop] = useState<WorkshopRecord | null>(null);
  const [loadedWorkshopId, setLoadedWorkshopId] = useState<string | null>(null);
  const [loadedStudentData, setLoadedStudentData] = useState<{
    workshopId: string;
    students: {
      studentId: string;
      firstName: string;
      lastName: string;
      preferredName?: string;
      email: string;
    }[];
  } | null>(null);

  const contextWorkshop = workshops.find((w) => w.id === workshopId) ?? null;
  const loadedApiWorkshop = apiWorkshop?.id === workshopId ? apiWorkshop : null;
  const workshop = contextWorkshop ?? loadedApiWorkshop;
  const hasLoadedWorkshop = Boolean(contextWorkshop) || loadedWorkshopId === workshopId;

  useEffect(() => {
    if (!workshopId || contextWorkshop) {
      return;
    }

    let isCurrent = true;

    Promise.all([getWorkshopById(workshopId), getUsers()])
      .then(([workshopDto, users]) => {
        if (!isCurrent) return;
        const tutor = workshopDto.tutor_user_id
          ? users.find((user) => user.user_id === workshopDto.tutor_user_id)
          : null;
        setApiWorkshop({
          id: String(workshopDto.workshop_id),
          name: workshopDto.workshop_name,
          tutorName: tutor?.display_name ?? null,
          tutorEmail: tutor?.email ?? null,
        });
        setLoadedWorkshopId(workshopId);
      })
      .catch(() => {
        if (!isCurrent) return;
        setApiWorkshop(null);
        setLoadedWorkshopId(workshopId);
      });

    return () => {
      isCurrent = false;
    };
  }, [contextWorkshop, workshopId]);

  useEffect(() => {
    if (!workshopId) {
      return;
    }

    let isCurrent = true;

    getWorkshopStudents(workshopId)
      .then((studentDtos) => {
        if (!isCurrent) return;
        setLoadedStudentData({
          workshopId,
          students: studentDtos
            .filter((student) => student.status === "active")
            .map((student) => ({
              studentId: student.student_id,
              firstName: student.first_name,
              lastName: student.last_name,
              preferredName: student.preferred_name ?? undefined,
              email: student.email,
            })),
        });
      })
      .catch(() => {
        if (!isCurrent) return;
        setLoadedStudentData({
          workshopId,
          students: [],
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [workshopId]);

  if (!hasLoadedWorkshop) {
    return null;
  }

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

  const enabledWeekIds = new Set(configWeeks.filter((w) => w.enabled).map((w) => w.id));
  const workshopWeekIds = participationWeeks
    .filter((week) => enabledWeekIds.has(week.id))
    .map((week) => week.id);
  const contextStudents = workshopStudents[workshop.id] ?? [];
  const students = loadedStudentData?.workshopId === workshopId
    ? loadedStudentData.students
    : contextStudents;
  const hasLoadedStudents = loadedStudentData?.workshopId === workshopId || contextStudents.length > 0;

  const totalStudents = students.length;
  const weeksCompleted = workshopWeekIds.filter((weekId) =>
    students.length > 0 && students.every((s) => sessionMarks[weekId]?.[s.studentId] !== undefined),
  ).length;
  const totalEnabledWeeks = workshopWeekIds.length;

  const allScores = students.flatMap((s) =>
    workshopWeekIds
      .map((weekId) => sessionMarks[weekId]?.[s.studentId])
      .filter((score): score is Score => score !== undefined),
  );
  const maxPossible = totalStudents * totalEnabledWeeks * maxWeeklyScore;
  const totalScore = allScores.reduce<number>((sum, s) => sum + s, 0);
  const overallProgress = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
  const avgScore = allScores.length > 0 ? (totalScore / allScores.length).toFixed(2) : "0.00";

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

      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Students</h2>
          {!hasLoadedStudents ? (
            <p className="dashboard-empty">Loading students...</p>
          ) : students.length === 0 ? (
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
                    const studentScores = workshopWeekIds
                      .map((weekId) => sessionMarks[weekId]?.[student.studentId])
                      .filter((score): score is Score => score !== undefined);

                    const weeksMarked = studentScores.length;
                    const studentTotal = studentScores.reduce<number>((sum, s) => sum + s, 0);
                    const studentAvg = weeksMarked > 0 ? (studentTotal / weeksMarked).toFixed(2) : "0.00";

                    return (
                      <tr key={student.studentId}>
                        <td>{student.studentId}</td>
                        <td>{student.preferredName ?? student.firstName} {student.lastName}</td>
                        <td>{weeksMarked} / {totalEnabledWeeks}</td>
                        <td style={{ fontWeight: 700 }}>{studentTotal}</td>
                        <td>{studentAvg}</td>
                        <td>
                          <Link
                            href={`/workshops/detail/student?workshopId=${workshop.id}&studentId=${student.studentId}`}
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
