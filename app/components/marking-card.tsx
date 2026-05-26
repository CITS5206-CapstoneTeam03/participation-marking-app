"use client";

import type { Score, StudentMark } from "../lib/marking-types";

export type { Score };

// Score definitions (FR-3.2 — 0-3 participation scale)
const SCORE_OPTIONS = [
  { value: 0 as Score, label: "Absent" },
  { value: 1 as Score, label: "Present but disengaged" },
  { value: 2 as Score, label: "Active participation" },
  { value: 3 as Score, label: "Highly engaged" },
] as const;

type MarkingCardProps = {
  /** The student being marked (FR-3.1) */
  student: StudentMark;
  /** Currently saved score, or null if unmarked. Controlled by parent. */
  score: Score | null;
  /** Called when the tutor selects a score. T-202 wires auto-advance on top. */
  onSelect: (score: Score) => void;
};

/**
 * Touch-friendly 0-3 marking card (T-201 / FR-3.1, FR-3.2).
 *
 * Intentionally stateless — the parent (MarkingSession) owns score state so
 * that T-202 (auto-advance) and future review/edit modes can compose freely.
 */
export function MarkingCard({ student, score, onSelect }: MarkingCardProps) {
  return (
    <article className="marking-card" aria-label={`Marking card for ${student.name}`}>
      {/* ── Student identity (FR-3.1) ── */}
      <div className="marking-card-identity">
        <StudentAvatar student={student} />
        <div>
          <h2 className="student-name">{student.name}</h2>
          <p className="student-number">{student.studentNumber}</p>
        </div>
      </div>

      {/* ── Score buttons (FR-3.2) ── */}
      <div className="score-grid" role="group" aria-label="Participation score">
        {SCORE_OPTIONS.map((option) => {
          const isSelected = score === option.value;
          return (
            <button
              key={option.value}
              type="button"
              data-score={option.value}
              className={`score-btn${isSelected ? " selected" : ""}`}
              onClick={() => onSelect(option.value)}
              aria-pressed={isSelected}
              aria-label={`Score ${option.value} — ${option.label}`}
            >
              <span className="score-number">{option.value}</span>
              <span className="score-label">{option.label}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

// ── Internal helpers ────────────────────────────────────────────────────────

function StudentAvatar({ student }: { student: StudentMark }) {
  if (!student.photoUrl) {
    const initials = student.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    return (
      <div className="student-avatar-initials" aria-hidden="true">
        {initials || "ST"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={student.photoUrl}
      alt={student.name}
      className="student-avatar-photo"
    />
  );
}
