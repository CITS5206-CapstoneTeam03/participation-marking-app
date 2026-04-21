"use client";

import { CoordinatorShell } from "../components/coordinator-shell";
import { TutorShell } from "../components/tutor-shell";
import { useAppContext } from "../context/app-context";

function AnalyticsContent() {
  return (
    <>
      <header className="prototype-header">
        <h1>Analytics</h1>
        <p>Participation performance insights will appear here.</p>
      </header>

      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Coming Soon</h2>
          <p className="dashboard-empty">
            This view is under active development. Use Dashboard and Mark Participation for current workflows.
          </p>
        </article>
      </section>
    </>
  );
}

export default function AnalyticsPage() {
  const { viewRole } = useAppContext();

  if (viewRole === "coordinator") {
    return (
      <CoordinatorShell>
        <AnalyticsContent />
      </CoordinatorShell>
    );
  }

  return (
    <TutorShell>
      <AnalyticsContent />
    </TutorShell>
  );
}
