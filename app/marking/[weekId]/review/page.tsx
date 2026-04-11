import Link from "next/link";
import { notFound } from "next/navigation";
import { TutorShell } from "../../../components/tutor-shell";
import { ReviewSession } from "../../../components/review-session";
import { getMarksForWeek, getWeekById, isWeekEnabled, participationWeeks } from "../../../data/mock-data";

export function generateStaticParams() {
  return participationWeeks.map((week) => ({ weekId: week.id }));
}

type ReviewPageProps = {
  params: Promise<{ weekId: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { weekId } = await params;
  const week = getWeekById(weekId);

  // TODO: replace isWeekEnabled with an API call once week config is persisted server-side
  if (!week || !isWeekEnabled(weekId)) {
    notFound();
  }

  const students = getMarksForWeek(week.id);

  return (
    <TutorShell>
      <header className="prototype-header">
        <Link href={`/marking/${weekId}`} className="marking-breadcrumb">
          ← Back to Marking
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h1>Review &amp; Submit</h1>
            <p>
              {week.workshop} · {week.label}
            </p>
          </div>
        </div>
      </header>

      <div className="real-page-panel">
        <ReviewSession
          students={students}
          weekId={weekId}
          weekLabel={week.label}
        />
      </div>
    </TutorShell>
  );
}
