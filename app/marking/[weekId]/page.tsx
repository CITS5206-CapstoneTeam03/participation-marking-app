import { configWeeks } from "../../data/mock-data";
import { MarkingView } from "./marking-view";

export async function generateStaticParams() {
  return configWeeks.map((w) => ({ weekId: w.id }));
}

export default function WeekMarkingPage() {
  return <MarkingView />;
}