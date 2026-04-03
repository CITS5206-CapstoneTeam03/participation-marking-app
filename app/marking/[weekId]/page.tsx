import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { MarkingCard } from "../../components/marking-card";
import { getMarksForWeek, getWeekById, participationWeeks } from "../../data/mock-data";

export function generateStaticParams() {
  return participationWeeks.map((week) => ({ weekId: week.id }));
}

type WeekMarkingPageProps = {
  params: Promise<{ weekId: string }>;
};

export default async function WeekMarkingPage({ params }: WeekMarkingPageProps) {
  const { weekId } = await params;
  const week = getWeekById(weekId);

  if (!week) {
    notFound();
  }

  const students = getMarksForWeek(week.id);
  const markedCount = students.filter((student) => student.score >= 0).length;

  return (
    <AppShell
      title={`${week.workshop} - ${week.label}`}
      description="Touch-friendly tutor marking screen with large 0-3 selection targets, student context, and quick progress feedback."
      action={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/marking"
            className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] hover:-translate-y-0.5"
          >
            Back to week selection
          </Link>
          <button
            type="button"
            className="rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[var(--navy)] hover:-translate-y-0.5"
          >
            Confirm & lock {week.label}
          </button>
        </div>
      }
    >
      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="panel p-5 lg:p-6">
          <p className="eyebrow">Week Snapshot</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--navy)]">
            Tutor marking status
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-white/80 p-4">
              <p className="eyebrow">Workshop</p>
              <p className="mt-2 text-lg font-semibold text-[var(--navy)]">{week.workshop}</p>
            </div>
            <div className="rounded-3xl bg-white/80 p-4">
              <p className="eyebrow">Marking Progress</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-[var(--navy)]">{markedCount}</p>
              <p className="text-sm text-[var(--ink-soft)]">Student cards loaded for this prototype route.</p>
            </div>
            <div className="rounded-3xl bg-white/80 p-4">
              <p className="eyebrow">Status</p>
              <p className="mt-2 text-lg font-semibold text-[var(--mint)]">{week.status}</p>
              <p className="text-sm text-[var(--ink-soft)]">{week.submissions}</p>
            </div>
          </div>
        </article>

        <div className="space-y-4">
          {students.map((student) => (
            <MarkingCard key={student.id} student={student} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
