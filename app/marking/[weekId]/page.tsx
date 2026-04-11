import Link from "next/link";
import { notFound } from "next/navigation";
import { TutorShell } from "../../components/tutor-shell";
import { MarkingSession } from "../../components/marking-session";
import { WeekDropdown } from "../../components/week-dropdown";
import { getMarksForWeek, getWeekById, isWeekEnabled, participationWeeks } from "../../data/mock-data";

export function generateStaticParams() {
  return participationWeeks.map((week) => ({ weekId: week.id }));
}

type WeekMarkingPageProps = {
  params: Promise<{ weekId: string }>;
};

export default async function WeekMarkingPage({ params }: WeekMarkingPageProps) {
  const { weekId } = await params;
  const week = getWeekById(weekId);

  // TODO: replace isWeekEnabled with an API call once week config is persisted server-side
  if (!week || !isWeekEnabled(weekId)) {
    notFound();
  }

  const students = getMarksForWeek(week.id);

  return (
    <TutorShell>
      <header className="prototype-header marking-page-header">
        <div>
          <h1>Mark Participation</h1>
          <p>
            {week.workshop} – {week.label}
          </p>
        </div>

        {/* Week switcher + Review All */}
        <div className="marking-header-controls">
          <WeekDropdown currentWeekId={weekId} />
          <Link href={`/marking/${weekId}/review`} className="review-all-btn">
            Review All
          </Link>
        </div>
      </header>

      <div className="real-page-panel">
        <MarkingSession
          students={students}
          weekId={weekId}
          weekLabel={week.label}
        />
      </div>
    </TutorShell>
  );
}
