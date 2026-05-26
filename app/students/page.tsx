"use client";

import { useMemo, useState } from "react";
import { CoordinatorShell } from "../components/coordinator-shell";
import { useAppContext } from "../context/app-context";

export default function StudentsPage() {
  // TODO(backend): replace workshops and workshopStudents with data fetched from
  // GET /api/workshops and GET /api/workshops/:id/students respectively.
  const { workshops, workshopStudents } = useAppContext();
  const [search, setSearch] = useState("");

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
    return allStudents.filter((s) => {
      const displayFirst = s.preferredName?.trim() || s.firstName;
      return (
        s.studentId.toLowerCase().includes(q) ||
        `${displayFirst} ${s.lastName}`.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        (s.preferredName?.toLowerCase() ?? "").includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [allStudents, search]);

  const totalStudents = allStudents.length;

  return (
    <CoordinatorShell>
      <header className="prototype-header">
        <h1>Student Management</h1>
        <p>Manage student rosters</p>
      </header>

      <section className="real-page-panel">
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
              No students found.
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
                    <td style={{ padding: "14px 12px", fontSize: 14, color: "#172033" }}>{student.preferredName?.trim() || student.firstName} {student.lastName}</td>
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
