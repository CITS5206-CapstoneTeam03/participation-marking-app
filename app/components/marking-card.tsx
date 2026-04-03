"use client";

import { useState } from "react";
import type { StudentMark } from "../data/mock-data";

const scoreOptions = [
  {
    value: 0,
    label: "0",
    title: "Absent",
    helper: "No participation evidence",
    tone: "border-[rgba(231,111,81,0.24)] bg-[rgba(231,111,81,0.1)] text-[var(--rose)]",
  },
  {
    value: 1,
    label: "1",
    title: "Minimal",
    helper: "Present, little contribution",
    tone: "border-[rgba(252,163,17,0.24)] bg-[rgba(252,163,17,0.12)] text-[var(--navy)]",
  },
  {
    value: 2,
    label: "2",
    title: "Solid",
    helper: "Consistent, useful input",
    tone: "border-[rgba(42,157,143,0.24)] bg-[rgba(42,157,143,0.1)] text-[var(--mint)]",
  },
  {
    value: 3,
    label: "3",
    title: "Excellent",
    helper: "Strong leadership and initiative",
    tone: "border-[rgba(20,33,61,0.18)] bg-[rgba(20,33,61,0.08)] text-[var(--navy)]",
  },
] as const;

type MarkingCardProps = {
  student: StudentMark;
};

export function MarkingCard({ student }: MarkingCardProps) {
  const [selectedScore, setSelectedScore] = useState(student.score);

  return (
    <article className="panel p-5 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">{student.name}</h3>
            <span className="rounded-full bg-[rgba(20,33,61,0.08)] px-3 py-1 font-mono text-xs text-[var(--ink-soft)]">
              {student.studentNumber}
            </span>
            <span className="rounded-full bg-[rgba(252,163,17,0.14)] px-3 py-1 text-xs font-semibold text-[var(--navy)]">
              {student.team}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">{student.notes}</p>
        </div>

        <div className="panel-muted flex min-w-[180px] gap-4 px-4 py-3">
          <div>
            <p className="eyebrow">Previous Avg</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--navy)]">{student.previousAverage.toFixed(1)}</p>
          </div>
          <div>
            <p className="eyebrow">Selected</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--mint)]">{selectedScore}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {scoreOptions.map((option) => {
          const isSelected = selectedScore === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedScore(option.value as StudentMark["score"])}
              className={`touch-option rounded-3xl border p-4 text-left ${
                isSelected
                  ? `${option.tone} -translate-y-0.5 shadow-[0_16px_36px_rgba(20,33,61,0.12)]`
                  : "border-[var(--line)] bg-white hover:-translate-y-0.5 hover:border-[rgba(20,33,61,0.2)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold">{option.label}</p>
                  <p className="mt-1 text-sm font-semibold">{option.title}</p>
                </div>
                {isSelected ? (
                  <span className="rounded-full bg-white/80 px-2 py-1 font-mono text-xs">Saved</span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{option.helper}</p>
            </button>
          );
        })}
      </div>
    </article>
  );
}
