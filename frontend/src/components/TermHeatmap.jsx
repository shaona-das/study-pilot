const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function toDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? null : d;
}

function isoDay(d) {
  return d.toISOString().slice(0, 10);
}

// Monday-indexed day-of-week (0 = Mon ... 6 = Sun)
function mondayIndex(d) {
  return (d.getDay() + 6) % 7;
}

function intensityClass(hours) {
  if (hours <= 0) return "bg-surface";
  if (hours < 1) return "bg-brass-light/50";
  if (hours < 2.5) return "bg-brass";
  if (hours < 5) return "bg-brass-dark";
  return "bg-brick";
}

export default function TermHeatmap({ items, startDate, endDate }) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end || end < start) {
    return <p className="font-mono text-xs text-ink/40">Set a term start and end date to see the workload map.</p>;
  }

  // Sum estimated hours per due-date.
  const loadByDay = {};
  for (const it of items) {
    if (!it.dueDate) continue;
    loadByDay[it.dueDate] = (loadByDay[it.dueDate] || 0) + (Number(it.estimatedHours) || 0.5);
  }

  // Align grid start to the Monday on/before `start`.
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - mondayIndex(start));

  const totalDays = Math.round((end - gridStart) / 86400000) + 1;
  const weekCount = Math.ceil(totalDays / 7);

  const weeks = Array.from({ length: weekCount }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(gridStart);
      date.setDate(date.getDate() + w * 7 + d);
      const iso = isoDay(date);
      const inRange = date >= start && date <= end;
      return { iso, hours: loadByDay[iso] || 0, inRange };
    })
  );

  const dueItemsCount = items.filter((it) => it.dueDate).length;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink/50">
          The term at a glance — {dueItemsCount} dated items
        </span>
        <div className="flex items-center gap-1 font-mono text-[10px] text-ink/40">
          <span>light</span>
          <span className="h-2.5 w-2.5 bg-surface" />
          <span className="h-2.5 w-2.5 bg-brass-light/50" />
          <span className="h-2.5 w-2.5 bg-brass" />
          <span className="h-2.5 w-2.5 bg-brass-dark" />
          <span className="h-2.5 w-2.5 bg-brick" />
          <span>heavy</span>
        </div>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] pr-1">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="flex h-3 w-3 items-center font-mono text-[8px] text-ink/30">
              {i % 2 === 0 ? l : ""}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) => (
              <div
                key={di}
                title={cell.inRange ? `${cell.iso} — ${cell.hours}h due` : ""}
                className={`h-3 w-3 rounded-[2px] ${cell.inRange ? intensityClass(cell.hours) : "bg-transparent"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
