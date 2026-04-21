import { MarkingView } from "./marking-view";

export async function generateStaticParams() {
  // Providing a sample week ID for static export.
  return [{ weekId: "week-1" }];
}

export default function WeekMarkingPage() {
  return <MarkingView />;
}
