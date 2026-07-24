const STEPS = ["Syllabi", "Availability", "Schedule"];

export default function Header({ step }) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">Syllabus</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-brass-dark">study planner</span>
        </div>
        <nav className="flex items-center gap-1 font-mono text-xs">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={label} className="flex items-center">
                <div
                  className={`flex items-center gap-2 rounded-sm px-2.5 py-1 ${
                    active ? "bg-pine text-paper" : done ? "text-pine" : "text-ink/35"
                  }`}
                >
                  <span>{String(n).padStart(2, "0")}</span>
                  <span className="hidden uppercase tracking-wider sm:inline">{label}</span>
                </div>
                {n < STEPS.length && <span className="mx-1 text-ink/20">—</span>}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
