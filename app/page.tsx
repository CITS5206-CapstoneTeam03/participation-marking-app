import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", active: false },
  { label: "Mark Participation", active: true },
  { label: "Analytics", active: false },
];

function NavIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="prototype-shell">
      <aside className="prototype-sidebar">
        <div className="prototype-logo">
          <Image src="/uwa-logo.png" alt="UWA logo" width={52} height={52} priority />
          <div>
            <p className="text-[15px] font-semibold leading-5 text-[#172033]">UWA Participation</p>
            <p className="text-[15px] leading-5 text-[#5a6a81]">Marking System</p>
          </div>
        </div>

        <nav className="prototype-nav">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href="/"
              className={`prototype-nav-link ${item.active ? "active" : ""}`}
            >
              <NavIcon active={item.active} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="prototype-sidebar-footer">
          <p className="mb-3 text-sm font-medium text-[#5a6a81]">View Mode</p>
          <div className="mode-toggle">
            <div className="mode-chip">Coordinator</div>
            <div className="mode-chip active">Tutor</div>
          </div>

          <div className="mt-4">
            <p className="text-[15px] font-semibold text-[#172033]">Dr. Joachim Strand</p>
            <p className="text-sm text-[#708097]">Coordinator</p>
            <p className="mt-1 text-sm font-medium text-[#3f5efb]">Viewing as: tutor</p>
          </div>
        </div>
      </aside>

      <main className="prototype-main">
        <header className="prototype-header">
          <h1>Mark Participation</h1>
          <p>Select the workshop assigned to you before choosing the week to mark.</p>
        </header>

        <section className="real-page-panel">
          <article className="prototype-card workshop-picker-card">
            <h2>Select Workshop</h2>
            <Link href="/" className="workshop-option">
              <span className="workshop-option-title">Workshop 01</span>
              <span className="workshop-option-subtitle">35 students</span>
            </Link>
          </article>
        </section>
      </main>
    </div>
  );
}
