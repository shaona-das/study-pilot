import { pad2, toISODate } from "./dateUtils.js";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FOCUS_TEMPLATES = {
  exam: "Review material and practice problems for",
  quiz: "Review notes and key concepts for",
  assignment: "Work on",
  project: "Make progress on",
  reading: "Complete the reading for",
  paper: "Draft or revise",
  presentation: "Prepare and rehearse",
  other: "Work on",
};

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(h)}:${pad2(mm)}`;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Builds a day-by-day, earliest-deadline-first study schedule using only
 * arithmetic — no AI, no network call. Items are prioritized by due date
 * (soonest first, then by grade weight, then by remaining hours), and each
 * day's available time is round-robined across eligible items so work gets
 * spread across multiple sessions rather than crammed into one block.
 */
export function generateScheduleLocal({ items, availability, preferences }) {
  const sessionMinutes = preferences.sessionLength || 60;
  const dailyMaxMinutes = (preferences.dailyMaxHours || 3) * 60;
  const bufferDays = preferences.bufferDays ?? 1;
  const start = parseISO(preferences.startDate);
  const end = parseISO(preferences.endDate);

  // Availability grouped by weekday name, sorted by start time.
  const availByDay = {};
  for (const slot of availability) {
    (availByDay[slot.day] ||= []).push(slot);
  }
  for (const day of Object.keys(availByDay)) {
    availByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Working copy of items with a due Date object and remaining minutes.
  const withoutDue = [];
  const work = items
    .filter((it) => {
      if (!it.dueDate) {
        withoutDue.push(it);
        return false;
      }
      return true;
    })
    .map((it) => ({
      ...it,
      dueDateObj: parseISO(it.dueDate),
      remainingMinutes: Math.max(0, Math.round((Number(it.estimatedHours) || 1) * 60)),
      sessionsScheduled: 0,
    }));

  const blocks = [];
  const totalDays = Math.round((end - start) / 86400000) + 1;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(start, i);
    const iso = toISODate(date);
    const dayName = DAY_NAMES[date.getDay()] === "Sun" ? "Sun" : DAY_NAMES[date.getDay()];
    const jsDay = date.getDay();
    const weekdayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][jsDay];
    const slotsToday = (availByDay[weekdayLabel] || []).map((s) => ({
      start: timeToMinutes(s.startTime),
      end: timeToMinutes(s.endTime),
      used: 0,
    }));
    if (slotsToday.length === 0) continue;

    let dayCapacity = dailyMaxMinutes;

    const eligible = () =>
      work
        .filter((it) => {
          if (it.remainingMinutes <= 0) return false;
          const lastEligible = addDays(it.dueDateObj, -bufferDays);
          const effectiveLast = lastEligible < start ? it.dueDateObj : lastEligible;
          return date <= effectiveLast && date >= start;
        })
        .sort((a, b) => {
          if (a.dueDateObj - b.dueDateObj !== 0) return a.dueDateObj - b.dueDateObj;
          const aw = parseInt(a.weight, 10) || 0;
          const bw = parseInt(b.weight, 10) || 0;
          if (bw - aw !== 0) return bw - aw;
          return b.remainingMinutes - a.remainingMinutes;
        });

    function allocateChunk(minutesWanted) {
      for (const slot of slotsToday) {
        const slotRemaining = slot.end - slot.start - slot.used;
        if (slotRemaining <= 0) continue;
        const take = Math.min(minutesWanted, slotRemaining, dayCapacity);
        if (take <= 0) continue;
        const startMin = slot.start + slot.used;
        const endMin = startMin + take;
        slot.used += take;
        dayCapacity -= take;
        return { startTime: minutesToTime(startMin), endTime: minutesToTime(endMin), minutes: take };
      }
      return null;
    }

    let progress = true;
    while (progress && dayCapacity > 0) {
      progress = false;
      for (const item of eligible()) {
        if (dayCapacity <= 0) break;
        const want = Math.min(sessionMinutes, item.remainingMinutes);
        const chunk = allocateChunk(want);
        if (chunk) {
          item.sessionsScheduled += 1;
          blocks.push({
            date: iso,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            itemTitle: item.title,
            courseName: item.courseName,
            type: item.type,
            focus: `${FOCUS_TEMPLATES[item.type] || FOCUS_TEMPLATES.other} "${item.title}".`,
          });
          item.remainingMinutes -= chunk.minutes;
          progress = true;
        }
      }
    }
  }

  const unfinished = work.filter((it) => it.remainingMinutes > 0);
  const noteParts = [];
  if (unfinished.length > 0) {
    const list = unfinished
      .map((it) => `"${it.title}" (${Math.round((it.remainingMinutes / 60) * 10) / 10}h short)`)
      .join(", ");
    noteParts.push(`Not enough available time to fully cover: ${list}. Add more availability or extend the term window.`);
  }
  if (withoutDue.length > 0) {
    noteParts.push(
      `${withoutDue.length} item(s) had no due date and weren't scheduled: ${withoutDue.map((it) => `"${it.title}"`).join(", ")}.`
    );
  }
  if (blocks.length === 0 && noteParts.length === 0) {
    noteParts.push("No sessions could be scheduled — check that your availability overlaps the term window.");
  }

  return { blocks, notes: noteParts.join(" ") };
}
