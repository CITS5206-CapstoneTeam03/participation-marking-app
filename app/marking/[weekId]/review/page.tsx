import { ReviewView } from "./review-view";

export async function generateStaticParams() {
  return [{ weekId: "week-1" }];
}

export default function ReviewPage() {
  return <ReviewView />;
}
