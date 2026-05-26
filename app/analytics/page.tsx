"use client";

import { useEffect, useMemo, useState } from "react";
import { CoordinatorShell } from "../components/coordinator-shell";
import { TutorShell } from "../components/tutor-shell";
import { useAppContext } from "../context/app-context";
import { getMarksByWorkshopAndWeek, exportGradesApi, type MarkDto } from "../lib/services/marks";

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

function escapeCsvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;

  if (/[",\n]/.test(safeText)) {
    return `"${safeText.replace(/"/g, '""')}"`;
  }

  return safeText;
}

function toFileSafeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AnalyticsContent() {
  const {
    viewRole,
    workshops,
    workshopStudents,
    configWeeks,
    maxWeeklyScore,
    totalAssessmentWeighting,
    currentUserName,
  } = useAppContext();

  const [selectedWorkshopId, setSelectedWorkshopId] = useState("all");
  const [marksByWorkshopWeek, setMarksByWorkshopWeek] = useState<Record<string, Record<number, MarkDto[]>>>({});

  // State for CSV export backend upload modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<"semester" | "half_semester">("semester");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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
    if (visibleWorkshops.length === 0 || enabledWeeks.length === 0) {
      return;
    }

    let isCurrent = true;

    Promise.all(
      visibleWorkshops.map(async (workshop) => {
        const weekResults = await Promise.allSettled(
          enabledWeeks.map(async (week) => {
            const marks = await getMarksByWorkshopAndWeek(workshop.id, week.weekNumber);
            return [week.weekNumber, marks] as const;
          }),
        );
        const weekEntries = weekResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        return [workshop.id, Object.fromEntries(weekEntries)] as const;
      }),
    )
      .then((entries) => {
        if (!isCurrent) return;
        setMarksByWorkshopWeek(Object.fromEntries(entries));
      });

    return () => {
      isCurrent = false;
    };
  }, [visibleWorkshops, enabledWeeks]);

  const effectiveWorkshopId =
    selectedWorkshopId === "all" ||
    visibleWorkshops.some((workshop) => workshop.id === selectedWorkshopId)
      ? selectedWorkshopId
      : "all";

  const allRows = useMemo<AnalyticsRow[]>(() => {
    const rows = visibleWorkshops.flatMap((workshop) => {
      const students = workshopStudents[workshop.id] ?? [];

      return students.map((student) => {
        const workshopMarksByWeek = marksByWorkshopWeek[workshop.id] ?? {};
        const recordedScores = enabledWeeks.flatMap((week) =>
          (workshopMarksByWeek[week.weekNumber] ?? [])
            .filter((mark) => mark.student_id === student.studentId)
            .map((mark) => mark.score),
        );

        const totalScore = recordedScores.reduce<number>((sum, score) => sum + score, 0);
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
    marksByWorkshopWeek,
    totalParticipationPoints,
    totalAssessmentWeighting,
  ]);

  const filteredRows = useMemo(() => {
    if (effectiveWorkshopId === "all") {
      return allRows;
    }
    return allRows.filter((row) => row.workshopId === effectiveWorkshopId);
  }, [allRows, effectiveWorkshopId]);

  const totalRecordedMarks = filteredRows.reduce((sum, row) => sum + row.marksRecorded, 0);
  const totalRecordedScore = filteredRows.reduce((sum, row) => sum + row.totalScore, 0);
  const averageScore = totalRecordedMarks > 0 ? totalRecordedScore / totalRecordedMarks : 0;
  const atRiskRows = filteredRows.filter((row) => row.isAtRisk);
  const totalStudents = filteredRows.length;
  const totalWorkshops =
    effectiveWorkshopId === "all" ? visibleWorkshops.length : totalStudents > 0 ? 1 : 0;

  const showWorkshopFilter = viewRole === "coordinator" || visibleWorkshops.length > 1;
  const showWorkshopColumn = viewRole === "coordinator" || effectiveWorkshopId === "all";
  
  const handleExportCsv = () => {
    setShowExportModal(true);
    setSelectedFile(null);
    setExportError(null);
    setIsExporting(false);
  };

  const handleConfirmExport = async () => {
    if (!selectedFile) {
      setExportError("Please select an LMS grade center template file.");
      return;
    }
    setIsExporting(true);
    setExportError(null);

    try {
      const isHalfSemester = exportType === "half_semester";
      const blob = await exportGradesApi(isHalfSemester, selectedFile);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      let downloadFilename = `populated_${selectedFile.name}`;
      if (downloadFilename.endsWith(".xls")) {
        downloadFilename = downloadFilename.slice(0, -4) + ".csv";
      } else if (downloadFilename.endsWith(".xlsx")) {
        downloadFilename = downloadFilename.slice(0, -5) + ".csv";
      }

      link.setAttribute("download", downloadFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Close modal and reset
      setShowExportModal(false);
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Export error:", err);
      let msg = "Export failed. Please ensure the template file is valid and matches Blackboard structure.";
      
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed && parsed.detail) {
            msg = parsed.detail;
          }
        } catch (e) {
          // Fallback to reading text directly if it is not JSON
        }
      } else if (err.message) {
        msg = err.message;
      }
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const metricGridClassName =
    viewRole === "coordinator"
      ? "real-page-panel dashboard-metric-grid"
      : "real-page-panel dashboard-metric-grid dashboard-metric-grid--three";

  return (
    <>
      <header
        className="prototype-header"
        style={{
          alignItems: "flex-start",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1>Analytics & Reporting</h1>
          <p>Student participation insights and statistics</p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          style={{
            background: "#4f46e5",
            border: "none",
            borderRadius: "12px",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 700,
            padding: "12px 18px",
          }}
        >
          Export CSV
        </button>
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
                value={effectiveWorkshopId}
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

      {showExportModal && (
        <div
          className="milestone-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-title"
          onClick={() => !isExporting && setShowExportModal(false)}
        >
          <div
            className="milestone-modal"
            style={{ maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="milestone-modal-icon"
              style={{ background: "rgba(79, 70, 229, 0.12)" }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h2 className="milestone-modal-title" id="export-title">
              Populate LMS Grade Template
            </h2>
            <p className="milestone-modal-body" style={{ marginBottom: "18px" }}>
              Upload your Blackboard Grade Center spreadsheet (.csv, .xls, .xlsx) to automatically fill in the participation marks.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#56657c",
                  marginBottom: "8px",
                }}
              >
                Export Scope
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setExportType("semester")}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: exportType === "semester" ? "2px solid #4f46e5" : "1.5px solid #d7dfeb",
                    background: exportType === "semester" ? "#f5f3ff" : "#ffffff",
                    color: exportType === "semester" ? "#4f46e5" : "#172033",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Full Semester
                </button>
                <button
                  type="button"
                  onClick={() => setExportType("half_semester")}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: exportType === "half_semester" ? "2px solid #4f46e5" : "1.5px solid #d7dfeb",
                    background: exportType === "half_semester" ? "#f5f3ff" : "#ffffff",
                    color: exportType === "half_semester" ? "#4f46e5" : "#172033",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Half Semester (W1-W6)
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#56657c",
                  marginBottom: "8px",
                }}
              >
                Blackboard Template File
              </label>
              <div
                style={{
                  border: "2px dashed #cfd8e8",
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center",
                  background: "#f8fafc",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => document.getElementById("template-file-input")?.click()}
              >
                <input
                  id="template-file-input"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  style={{ display: "none" }}
                />
                <p style={{ margin: 0, fontSize: "14px", color: selectedFile ? "#172033" : "#6b7a90", fontWeight: selectedFile ? 600 : 500 }}>
                  {selectedFile ? selectedFile.name : "Click to browse grade template"}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7a90" }}>
                  Supports .csv, .xls, .xlsx
                </p>
              </div>
            </div>

            {exportError && (
              <p style={{ color: "#dc2626", fontSize: "14px", fontWeight: 600, margin: "0 0 16px" }}>
                {exportError}
              </p>
            )}

            <div className="milestone-modal-actions">
              <button
                type="button"
                className="milestone-modal-btn-primary"
                onClick={handleConfirmExport}
                disabled={isExporting || !selectedFile}
                style={{
                  background: isExporting || !selectedFile ? "#94a3b8" : "#4f46e5",
                  cursor: isExporting || !selectedFile ? "not-allowed" : "pointer",
                }}
              >
                {isExporting ? "Processing..." : "Export & Download"}
              </button>
              <button
                type="button"
                className="workshop-modal-cancel-btn"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                style={{
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "1.5px solid #d7dfeb",
                  background: "#ffffff",
                  color: "#56657c",
                  font: "inherit",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
