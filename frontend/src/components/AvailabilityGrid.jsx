import { useRef, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 7; // 7am
const END_HOUR = 23; // 11pm
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function key(day, hour) {
  return `${day}-${hour}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// Collapse a set of selected hour-cells into contiguous {day, startTime, endTime} blocks.
export function cellsToBlocks(selected) {
  const blocks = [];
  for (const day of DAYS) {
    const hours = HOURS.filter((h) => selected.has(key(day, h))).sort((a, b) => a - b);
    let runStart = null;
    let prev = null;
    for (const h of hours) {
      if (runStart === null) {
        runStart = h;
      } else if (h !== prev + 1) {
        blocks.push({ day, startTime: `${pad(runStart)}:00`, endTime: `${pad(prev + 1)}:00` });
        runStart = h;
      }
      prev = h;
    }
    if (runStart !== null) {
      blocks.push({ day, startTime: `${pad(runStart)}:00`, endTime: `${pad(prev + 1)}:00` });
    }
  }
  return blocks;
}

export default function AvailabilityGrid({ selected, onChange }) {
  const dragMode = useRef(null); // "add" | "remove"
  const [dragging, setDragging] = useState(false);

  function applyDrag(day, hour) {
    const k = key(day, hour);
    const next = new Set(selected);
    if (dragMode.current === "add") next.add(k);
    else next.delete(k);
    onChange(next);
  }

  function startDrag(day, hour) {
    const k = key(day, hour);
    dragMode.current = selected.has(k) ? "remove" : "add";
    setDragging(true);
    applyDrag(day, hour);
  }

  function endDrag() {
    setDragging(false);
    dragMode.current = null;
  }

  return (
    <div className="select-none overflow-x-auto" onMouseUp={endDrag} onMouseLeave={endDrag}>
      <div className="grid min-w-[560px] grid-cols-[48px_repeat(7,1fr)]">
        <div />
        {DAYS.map((d) => (
          <div key={d} className="pb-2 text-center font-mono text-[11px] uppercase tracking-wider text-ink/50">
            {d}
          </div>
        ))}
        {HOURS.map((h) => (
          <FragmentRow key={h} hour={h} selected={selected} dragging={dragging} startDrag={startDrag} applyDrag={applyDrag} />
        ))}
      </div>
    </div>
  );
}

function FragmentRow({ hour, selected, dragging, startDrag, applyDrag }) {
  return (
    <>
      <div className="pr-2 text-right font-mono text-[10px] text-ink/40" style={{ lineHeight: "24px" }}>
        {hour % 12 === 0 ? 12 : hour % 12}
        {hour < 12 ? "a" : "p"}
      </div>
      {DAYS.map((d) => {
        const active = selected.has(key(d, hour));
        return (
          <div
            key={d}
            onMouseDown={() => startDrag(d, hour)}
            onMouseEnter={() => dragging && applyDrag(d, hour)}
            className={`h-6 cursor-pointer border border-paper transition-colors ${
              active ? "bg-pine hover:bg-pine-dark" : "bg-surface hover:bg-pine/15"
            }`}
          />
        );
      })}
    </>
  );
}

export { DAYS };
