import { configWeeks } from "../../../data/mock-data";
import { ReviewView } from "./review-view";

export async function generateStaticParams() {
  return configWeeks.map((w) => ({ weekId: w.id }));
}

export default function ReviewPage() {
  return <ReviewView />;
}
