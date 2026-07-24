const TYPE_DOT = {
  exam: "bg-brick",
  quiz: "bg-brick-light",
  assignment: "bg-pine",
  project: "bg-pine-dark",
  reading: "bg-brass-light",
  paper: "bg-brass",
  presentation: "bg-brass-dark",
  other: "bg-ink/40",
};

function formatDateHeading(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function to12h(t) {
  const [h, m] = t.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
}

export default function ScheduleView({ schedule }) {
  const byDate = {};
  for (const b of schedule.blocks) {
    (byDate[b.date] ||= []).push(b);
  }
  const dates = Object.keys(byDate).sort();

  const totalHours = schedule.blocks.reduce((sum, b) => {
    const [sh, sm] = b.startTime.split(":").map(Number);
    const [eh, em] = b.endTime.split(":").map(Number);
    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
  }, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Your schedule</h2>
        <span className="font-mono text-xs text-ink/50">
          {schedule.blocks.length} sessions · {totalHours.toFixed(1)}h total · {dates.length} days
        </span>
      </div>

      {schedule.notes && (
        <div className="mb-6 rounded-sm border border-brass/40 bg-brass-light/10 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-brass-dark">Planner notes</p>
          <p className="mt-1 text-sm text-ink/80">{schedule.notes}</p>
        </div>
      )}

      <div className="space-y-6">
        {dates.map((date) => (
          <div key={date} className="flex gap-4">
            <div className="w-32 shrink-0 pt-1 font-mono text-xs text-ink/50">{formatDateHeading(date)}</div>
            <div className="flex-1 space-y-2 border-l border-line pl-4">
              {byDate[date]
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((b, i) => (
                  <div key={i} className="card flex items-start gap-3 px-4 py-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[b.type] || "bg-ink/40"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-body text-sm font-medium text-ink">{b.itemTitle}</span>
                        <span className="font-mono text-xs text-ink/50">
                          {to12h(b.startTime)}–{to12h(b.endTime)}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-ink/40">
                        {b.courseName} · {b.type}
                      </p>
                      {b.focus && <p className="mt-1 text-sm text-ink/70">{b.focus}</p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
