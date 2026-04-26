"use client";

import { useEffect, useMemo, useState } from "react";
import { CoordinatorShell } from "../components/coordinator-shell";
import { TutorShell } from "../components/tutor-shell";
import { useAppContext } from "../context/app-context";
import type { Score } from "../context/app-context";

type AnalyticsRow = {
  studentId: string;
  studentName: string;
  email: string;
  workshopId: string;
  workshopName: string;
  marksRecorded: number;
  totalScore: number;
  averageScore: number | null;
  gradePercentage: number;
  isAtRisk: boolean;
};

function getDisplayName(firstName: string, lastName: string, preferredName?: string) {
  const preferred = preferredName?.trim();
  if (preferred) {
    return `${preferred} ${lastName}`.trim();
  }
  return `${firstName} ${lastName}`.trim();
}

function AnalyticsContent() {
  const {
    viewRole,
    workshops,
    workshopStudents,
    configWeeks,
    sessionMarks,
    maxWeeklyScore,
    totalAssessmentWeighting,
    currentUserName,
  } = useAppContext();

  const [selectedWorkshopId, setSelectedWorkshopId] = useState("all");

  const enabledWeeks = useMemo(() => {
    return configWeeks.filter((week) => week.enabled);
  }, [configWeeks]);

  const totalParticipationPoints = enabledWeeks.length * maxWeeklyScore;

  const visibleWorkshops = useMemo(() => {
    if (viewRole === "coordinator") {
      return workshops;
    }

    return workshops.filter((workshop) => workshop.tutorName === currentUserName);
  }, [viewRole, workshops, currentUserName]);

  useEffect(() => {
    if (
      selectedWorkshopId !== "all" &&
      !visibleWorkshops.some((workshop) => workshop.id === selectedWorkshopId)
    ) {
      setSelectedWorkshopId("all");
    }
  }, [selectedWorkshopId, visibleWorkshops]);

  const allRows = useMemo<AnalyticsRow[]>(() => {
    const rows = visibleWorkshops.flatMap((workshop) => {
      const students = workshopStudents[workshop.id] ?? [];

      return students.map((student) => {
        const recordedScores = enabledWeeks
          .map((week) => sessionMarks[week.id]?.[student.studentId])
          .filter((score): score is Score => score !== undefined);

        const totalScore = recordedScores.reduce((sum, score) => sum + score, 0);
        const averageScore = recordedScores.length > 0 ? totalScore / recordedScores.length : null;
        const gradePercentage =
          totalParticipationPoints > 0
            ? (totalScore / totalParticipationPoints) * totalAssessmentWeighting
            : 0;

        const isAtRisk =
          enabledWeeks.length > 0 &&
          (recordedScores.length === 0 || (averageScore !== null && averageScore < 1.5));

        return {
          studentId: student.studentId,
          studentName: getDisplayName(
            student.firstName,
            student.lastName,
            student.preferredName,
          ),
          email: student.email,
          workshopId: workshop.id,
          workshopName: workshop.name,
          marksRecorded: recordedScores.length,
          totalScore,
          averageScore,
          gradePercentage,
          isAtRisk,
        };
      });
    });

    return [...rows].sort((a, b) => {
      if (a.isAtRisk !== b.isAtRisk) {
        return a.isAtRisk ? -1 : 1;
      }

      if (a.gradePercentage !== b.gradePercentage) {
        return a.gradePercentage - b.gradePercentage;
      }

      return a.studentName.localeCompare(b.studentName);
    });
  }, [
    visibleWorkshops,
    workshopStudents,
    enabledWeeks,
    sessionMarks,
    totalParticipationPoints,
    totalAssessmentWeighting,
  ]);

  const filteredRows = useMemo(() => {
    if (selectedWorkshopId === "all") {
      return allRows;
    }
    return allRows.filter((row) => row.workshopId === selectedWorkshopId);
  }, [allRows, selectedWorkshopId]);

  const totalRecordedMarks = filteredRows.reduce((sum, row) => sum + row.marksRecorded, 0);
  const totalRecordedScore = filteredRows.reduce((sum, row) => sum + row.totalScore, 0);
  const averageScore = totalRecordedMarks > 0 ? totalRecordedScore / totalRecordedMarks : 0;
  const atRiskRows = filteredRows.filter((row) => row.isAtRisk);
  const totalStudents = filteredRows.length;
  const totalWorkshops =
    selectedWorkshopId === "all" ? visibleWorkshops.length : totalStudents > 0 ? 1 : 0;

  const showWorkshopFilter = viewRole === "coordinator" || visibleWorkshops.length > 1;
  const showWorkshopColumn = viewRole === "coordinator" || selectedWorkshopId === "all";

  const metricGridClassName =
    viewRole === "coordinator"
      ? "real-page-panel dashboard-metric-grid"
      : "real-page-panel dashboard-metric-grid dashboard-metric-grid--three";

  return (
    <>
      <header className="prototype-header">
        <h1>Analytics & Reporting</h1>
        <p>Student participation insights and statistics</p>
      </header>

      <section className={metricGridClassName}>
        <article className="prototype-card dashboard-metric-card">
          <p className="dashboard-metric-label">Avg Score</p>
          <p className="dashboard-metric-value">{averageScore.toFixed(2)}</p>
        </article>

        <article className="prototype-card dashboard-metric-card">
          <p className="dashboard-metric-label">Total Students</p>
          <p className="dashboard-metric-value">{totalStudents}</p>
        </article>

        {viewRole === "coordinator" && (
          <article className="prototype-card dashboard-metric-card">
            <p className="dashboard-metric-label">Total Workshops</p>
            <p className="dashboard-metric-value">{totalWorkshops}</p>
          </article>
        )}

        <article className="prototype-card dashboard-metric-card">
          <p className="dashboard-metric-label">At-Risk Students</p>
          <p className="dashboard-metric-value">{atRiskRows.length}</p>
        </article>
      </section>

      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">At-Risk Students</h2>

          {enabledWeeks.length === 0 ? (
            <p className="dashboard-empty">
              No participation weeks are enabled yet. Configure weeks in Settings first.
            </p>
          ) : atRiskRows.length === 0 ? (
            <p className="dashboard-empty">
              No at-risk students identified for the current filter.
            </p>
          ) : (
            <div className="dashboard-list">
              {atRiskRows.slice(0, 8).map((row) => (
                <div key={row.studentId} className="dashboard-list-row">
                  <div>
                    <p className="dashboard-list-title">{row.studentName}</p>
                    <p className="dashboard-list-sub">
                      {row.workshopName} • {row.studentId} • {row.gradePercentage.toFixed(1)}%
                    </p>
                  </div>
                  <span className="dashboard-badge">
                    {row.marksRecorded === 0 ? "No marks yet" : "At Risk"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h2 className="section-card-title" style={{ margin: 0 }}>
              All Students - Detailed Breakdown
            </h2>

            {showWorkshopFilter && (
              <select
                value={selectedWorkshopId}
                onChange={(e) => setSelectedWorkshopId(e.target.value)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #d7dfeb",
                  borderRadius: "10px",
                  color: "#172033",
                  fontSize: "14px",
                  minWidth: "200px",
                  padding: "10px 12px",
                }}
              >
                <option value="all">All Workshops</option>
                {visibleWorkshops.map((workshop) => (
                  <option key={workshop.id} value={workshop.id}>
                    {workshop.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredRows.length === 0 ? (
            <p className="dashboard-empty">
              No student analytics data is available yet for this view.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  minWidth: showWorkshopColumn ? "860px" : "720px",
                  width: "100%",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        borderBottom: "1px solid #e5eaf3",
                        color: "#56657c",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "12px 10px",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      Student
                    </th>

                    {showWorkshopColumn && (
                      <th
                        style={{
                          borderBottom: "1px solid #e5eaf3",
                          color: "#56657c",
                          fontSize: "13px",
                          fontWeight: 700,
                          padding: "12px 10px",
                          textAlign: "left",
                          textTransform: "uppercase",
                        }}
                      >
                        Workshop
                      </th>
                    )}

                    <th
                      style={{
                        borderBottom: "1px solid #e5eaf3",
                        color: "#56657c",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "12px 10px",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      Marks Recorded
                    </th>
                    <th
                      style={{
                        borderBottom: "1px solid #e5eaf3",
                        color: "#56657c",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "12px 10px",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      Avg Score
                    </th>
                    <th
                      style={{
                        borderBottom: "1px solid #e5eaf3",
                        color: "#56657c",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "12px 10px",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      Grade
                    </th>
                    <th
                      style={{
                        borderBottom: "1px solid #e5eaf3",
                        color: "#56657c",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "12px 10px",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`${row.workshopId}-${row.studentId}`}>
                      <td
                        style={{
                          borderBottom: "1px solid #eef2f7",
                          padding: "14px 10px",
                          verticalAlign: "top",
                        }}
                      >
                        <div style={{ color: "#172033", fontSize: "15px", fontWeight: 600 }}>
                          {row.studentName}
                        </div>
                        <div style={{ color: "#6b7a90", fontSize: "13px", marginTop: "2px" }}>
                          {row.studentId}
                        </div>
                      </td>

                      {showWorkshopColumn && (
                        <td
                          style={{
                            borderBottom: "1px solid #eef2f7",
                            color: "#172033",
                            fontSize: "14px",
                            padding: "14px 10px",
                            verticalAlign: "top",
                          }}
                        >
                          {row.workshopName}
                        </td>
                      )}

                      <td
                        style={{
                          borderBottom: "1px solid #eef2f7",
                          color: "#172033",
                          fontSize: "14px",
                          padding: "14px 10px",
                          verticalAlign: "top",
                        }}
                      >
                        {row.marksRecorded} / {enabledWeeks.length}
                      </td>

                      <td
                        style={{
                          borderBottom: "1px solid #eef2f7",
                          color: "#172033",
                          fontSize: "14px",
                          padding: "14px 10px",
                          verticalAlign: "top",
                        }}
                      >
                        {row.averageScore === null ? "—" : row.averageScore.toFixed(2)}
                      </td>

                      <td
                        style={{
                          borderBottom: "1px solid #eef2f7",
                          color: "#172033",
                          fontSize: "14px",
                          padding: "14px 10px",
                          verticalAlign: "top",
                        }}
                      >
                        {row.gradePercentage.toFixed(1)}%
                      </td>

                      <td
                        style={{
                          borderBottom: "1px solid #eef2f7",
                          padding: "14px 10px",
                          verticalAlign: "top",
                        }}
                      >
                        <span
                          style={{
                            background: row.isAtRisk ? "#fff4d6" : "#eaf8ef",
                            borderRadius: "999px",
                            color: row.isAtRisk ? "#9a6700" : "#1f7a44",
                            display: "inline-block",
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "6px 10px",
                          }}
                        >
                          {row.isAtRisk ? "At Risk" : "On Track"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </>
  );
}

export default function AnalyticsPage() {
  const { viewRole } = useAppContext();

  if (viewRole === "coordinator") {
    return (
      <CoordinatorShell>
        <AnalyticsContent />
      </CoordinatorShell>
    );
  }

  return (
    <TutorShell>
      <AnalyticsContent />
    </TutorShell>
  );
}
