"use client";

import { useMemo, useState, useRef } from "react";
import { CoordinatorShell } from "../components/coordinator-shell";
import { useAppContext } from "../context/app-context";

export default function StudentsPage() {
  const { workshops, workshopStudents, upsertWorkshopStudentsFromCsv } = useAppContext();
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allStudents = useMemo(() => {
    return workshops.flatMap((workshop) =>
      (workshopStudents[workshop.id] ?? []).map((student) => ({
        ...student,
        workshopName: workshop.name,
        workshopId: workshop.id,
      })),
    );
  }, [workshops, workshopStudents]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return allStudents;
    return allStudents.filter(
      (s) =>
        s.studentId.toLowerCase().includes(q) ||
        `${s.preferredName ?? s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [allStudents, search]);

  const totalStudents = allStudents.length;

  function parseCSV(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return null;
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idIdx = header.findIndex((h) => ["studentid", "student_id", "student id", "id"].includes(h));
    const firstIdx = header.findIndex((h) => ["firstname", "first_name", "first name", "givenname"].includes(h));
    const lastIdx = header.findIndex((h) => ["lastname", "last_name", "last name", "surname"].includes(h));
    const emailIdx = header.findIndex((h) => ["email", "emailaddress", "email address"].includes(h));
    const preferredIdx = header.findIndex((h) => ["preferredname", "preferred_name", "preferred name"].includes(h));
    if (idIdx === -1 || emailIdx === -1) return null;

    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        studentId: idIdx >= 0 ? (cols[idIdx] ?? "") : "",
        firstName: firstIdx >= 0 ? (cols[firstIdx] ?? "") : "",
        lastName: lastIdx >= 0 ? (cols[lastIdx] ?? "") : "",
        email: emailIdx >= 0 ? (cols[emailIdx] ?? "") : "",
        preferredName: preferredIdx >= 0 ? cols[preferredIdx] : undefined,
      };
    }).filter((s) => s.studentId && s.email);
  }

  const targetWorkshopId = selectedWorkshopId || workshops[0]?.id;

  async function handleFile(file: File) {
    if (!targetWorkshopId) return;
    const text = await file.text();
    const students = parseCSV(text);
    if (students) upsertWorkshopStudentsFromCsv(targetWorkshopId, students);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function downloadTemplate() {
    const csv = "StudentID,FirstName,LastName,Email,PreferredName\n22001234,Emma,Wilson,emma.wilson@student.uwa.edu.au,Emma";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-roster-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <CoordinatorShell>
      <header className="prototype-header">
        <h1>Student Management</h1>
        <p>Import and manage student rosters</p>
      </header>

      {/* Top two-column section */}
      <section className="real-page-panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Import card */}
        <article className="prototype-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3f5efb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <h2 className="section-card-title" style={{ margin: 0 }}>Import Students</h2>
          </div>

          {/* Workshop selector */}
          {workshops.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#5a6a81", display: "block", marginBottom: 6 }}>
                Import into workshop
              </label>
              <select
                value={selectedWorkshopId || workshops[0]?.id}
                onChange={(e) => setSelectedWorkshopId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #dbe3f1",
                  fontSize: 14,
                  color: "#33445f",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? "#3f5efb" : "#c8d3e8"}`,
              borderRadius: 12,
              padding: "36px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging ? "#f0f3ff" : "#fafbff",
              marginBottom: 12,
              transition: "all 0.15s",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9aaac4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p style={{ fontWeight: 600, color: "#33445f", marginBottom: 4 }}>Drop CSV file here, or click to browse</p>
            <p style={{ fontSize: 13, color: "#708097" }}>CSV format required</p>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileInput} />
          </div>

          <button
            type="button"
            onClick={downloadTemplate}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 10,
              border: "1px solid #dbe3f1",
              background: "#f4f6fb",
              color: "#33445f",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Download CSV Template
          </button>
        </article>

        {/* Workshop summary card */}
        <article className="prototype-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#e8f8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <h2 className="section-card-title" style={{ margin: 0 }}>Workshop Summary</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {workshops.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>No workshops created yet.</p>
            ) : (
              workshops.map((workshop) => {
                const count = workshopStudents[workshop.id]?.length ?? 0;
                return (
                  <div key={workshop.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--panel-border)" }}>
                    <span style={{ fontSize: 15, color: "#33445f" }}>{workshop.name}</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "#172033" }}>{count}</span>
                  </div>
                );
              })
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#33445f" }}>Total Students</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#172033" }}>{totalStudents}</span>
            </div>
          </div>
        </article>
      </section>

      {/* Roster table */}
      <section className="real-page-panel">
        <article className="prototype-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 className="section-card-title" style={{ margin: 0 }}>Current Student Roster</h2>
            <input
              type="search"
              placeholder="Search by name, ID or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid #dbe3f1",
                fontSize: 14,
                color: "#33445f",
                width: 260,
                outline: "none",
              }}
            />
          </div>

          {allStudents.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", padding: "24px 0", textAlign: "center" }}>
              No students imported yet. Upload a CSV above to get started.
            </p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", padding: "24px 0", textAlign: "center" }}>
              No students match your search.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--panel-border)" }}>
                  {["Student ID", "Name", "Email", "Workshop"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#5a6a81", letterSpacing: "0.03em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <tr key={`${student.workshopId}-${student.studentId}`} style={{ borderBottom: "1px solid var(--panel-border)", background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                    <td style={{ padding: "14px 12px", fontSize: 14, color: "#33445f", fontWeight: 600 }}>{student.studentId}</td>
                    <td style={{ padding: "14px 12px", fontSize: 14, color: "#172033" }}>{student.preferredName ?? student.firstName} {student.lastName}</td>
                    <td style={{ padding: "14px 12px", fontSize: 14, color: "#708097" }}>{student.email}</td>
                    <td style={{ padding: "14px 12px", fontSize: 14, color: "#33445f" }}>{student.workshopName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>
    </CoordinatorShell>
  );
}
