import Link from "next/link";
import { TutorShell } from "./components/tutor-shell";

export default function Home() {
  return (
    <TutorShell>
      <header className="prototype-header">
        <h1>Mark Participation</h1>
        <p>Select the workshop assigned to you before choosing the week to mark.</p>
      </header>

      <section className="real-page-panel">
        <article className="prototype-card workshop-picker-card">
          <h2 className="section-card-title">Select Workshop</h2>
          <Link href="/marking" className="workshop-option">
            <span className="workshop-option-title">Workshop 01</span>
            <span className="workshop-option-subtitle">35 students</span>
          </Link>
        </article>
      </section>
    </TutorShell>
  );
}
