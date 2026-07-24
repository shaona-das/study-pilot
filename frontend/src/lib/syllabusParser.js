import { findDate } from "./dateUtils.js";

const TYPE_RULES = [
  { type: "exam", pattern: /\bfinal\s+exam\b|\bmidterm\b|\bexam\b/i },
  { type: "quiz", pattern: /\bquiz(zes)?\b/i },
  { type: "project", pattern: /\bproject\b/i },
  { type: "paper", pattern: /\bpaper\b|\bessay\b/i },
  { type: "presentation", pattern: /\bpresentation\b|\bpresent(s|ing)?\b/i },
  { type: "reading", pattern: /\breading(s)?\b|\bchapter(s)?\b|\bread\b/i },
  { type: "assignment", pattern: /\bassignment\b|\bhomework\b|\bhw\b|\bproblem\s?set\b|\bpset\b|\blab\b|\bdue\b/i },
];

const HOUR_ESTIMATES = {
  exam: 6,
  quiz: 1.5,
  assignment: 3,
  project: 8,
  reading: 1,
  paper: 5,
  presentation: 3,
  other: 2,
};

function detectType(text) {
  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(text)) return rule.type;
  }
  return "other";
}

function detectWeight(text) {
  const m = text.match(/\b(\d{1,3})\s?%/);
  return m ? `${m[1]}%` : "";
}

function estimateHours(type, weightText, chunk) {
  let hours = HOUR_ESTIMATES[type] ?? 2;
  const weightNum = parseInt(weightText, 10);
  if (!isNaN(weightNum) && weightNum >= 20) hours *= 1.4;
  if (/\bfinal\b/i.test(chunk)) hours *= 1.3;
  return Math.round(hours * 2) / 2; // round to nearest 0.5
}

function cleanTitle(chunk, dateMatchText) {
  let title = chunk;
  if (dateMatchText) {
    title = title.replace(dateMatchText, "");
  }
  title = title
    .replace(/^[\s\-•*·:;,.]+/, "")
    .replace(/[\s\-:;,.]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (title.length > 90) title = title.slice(0, 87).trim() + "…";
  if (!title) title = "Untitled item";
  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function splitIntoChunks(text) {
  // Split on newlines first, then split any long/paragraph-style line into
  // sentence-like chunks so dense syllabi still get individual items.
  const lines = text.split(/\r?\n/);
  const chunks = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.length > 160) {
      const sentences = trimmed.split(/(?<=[.;])\s+(?=[A-Z0-9])/);
      chunks.push(...sentences.map((s) => s.trim()).filter(Boolean));
    } else {
      chunks.push(trimmed);
    }
  }
  return chunks;
}

function guessCourseName(text) {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0);
  if (!firstLine) return "";
  const trimmed = firstLine.trim();
  if (trimmed.length <= 80 && !/[.]{1}\s/.test(trimmed)) {
    return trimmed.replace(/^syllabus\s*[:\-–]?\s*/i, "").trim();
  }
  return "";
}

/**
 * Fully local, offline syllabus parser. Scans line-by-line (splitting dense
 * paragraphs into sentence-like chunks) for anything with a recognizable
 * date, tags a type by keyword, pulls a grade weight if stated, and assigns
 * a rough hour estimate by item type. No network calls, no AI.
 */
export function parseSyllabusLocal(text) {
  const today = new Date();
  const chunks = splitIntoChunks(text);
  const items = [];
  let idCounter = 0;

  for (const chunk of chunks) {
    const dateResult = findDate(chunk, today);
    if (!dateResult) continue;

    const type = detectType(chunk);
    const weight = detectWeight(chunk);
    const title = cleanTitle(chunk, dateResult.matchText);
    const estimatedHours = estimateHours(type, weight, chunk);

    items.push({
      id: `local-${Date.now()}-${idCounter++}`,
      title,
      type,
      dueDate: dateResult.iso,
      estimatedHours,
      weight,
      notes: "",
    });
  }

  return { courseName: guessCourseName(text), items };
}
