"use client";

import { CoordinatorShell } from "../components/coordinator-shell";

export default function StudentsPage() {
  return (
    <CoordinatorShell>
      <div className="prototype-header mb-6">
        <h1>Students</h1>
        <p>View and manage enrolled students across all workshops.</p>
      </div>

      <div className="panel p-7">
        <p className="text-lg font-bold tracking-tight text-[var(--navy)]">Student Roster</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Student roster management is coming in a future release.
        </p>
      </div>
    </CoordinatorShell>
  );
}
