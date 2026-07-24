import { useState } from "react";
import { parseSyllabusLocal } from "../lib/syllabusParser.js";

const TYPES = ["exam", "quiz", "assignment", "project", "reading", "paper", "presentation", "other"];

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

export default function CourseCard({ course, onChange, onRemove, colorIndex }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleParse(file) {
    if (!file && !text.trim()) return;
    setLoading(true);
    setError("");
    try {
      let sourceText = text;
      if (file) {
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const { extractPdfText } = await import("../lib/pdfText.js");
          sourceText = await extractPdfText(file);
        } else {
          sourceText = await file.text();
        }
      }
      if (!sourceText.trim()) {
        throw new Error("Couldn't find any text in that file.");
      }
      const result = parseSyllabusLocal(sourceText);
      if (result.items.length === 0) {
        setError("No dated items found. Try pasting text with clearer dates (e.g. \"Oct 15 — Midterm\"), or add items manually below.");
      }
      onChange({
        ...course,
        name: course.name || result.courseName || course.name,
        items: [
          ...course.items,
          ...result.items,
        ],
      });
      setText("");
    } catch (e) {
      setError(e.message || "Something went wrong parsing that syllabus.");
    } finally {
      setLoading(false);
    }
  }

  function updateItem(id, patch) {
    onChange({ ...course, items: course.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }

  function removeItem(id) {
    onChange({ ...course, items: course.items.filter((it) => it.id !== id) });
  }

  function addBlankItem() {
    onChange({
      ...course,
      items: [
        ...course.items,
        {
          id: `manual-${Date.now()}`,
          title: "",
          type: "assignment",
          dueDate: "",
          estimatedHours: 2,
          weight: "",
          notes: "",
        },
      ],
    });
  }

  const swatch = ["bg-pine", "bg-brass", "bg-brick", "bg-pine-light", "bg-brass-dark"][colorIndex % 5];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line bg-paper/60 px-5 py-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${swatch}`} />
        <input
          className="flex-1 bg-transparent font-display text-lg font-medium text-ink placeholder:text-ink/30 focus:outline-none"
          placeholder="Course name (e.g. CS 301: Algorithms)"
          value={course.name}
          onChange={(e) => onChange({ ...course, name: e.target.value })}
        />
        <button
          onClick={onRemove}
          className="font-mono text-xs uppercase tracking-wider text-ink/40 hover:text-brick"
        >
          remove
        </button>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <textarea
            className="field-input min-h-[84px] flex-1 resize-y font-mono text-xs leading-relaxed"
            placeholder="Paste syllabus text here — assignments, exam dates, readings, anything with a due date…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex shrink-0 flex-col gap-2 sm:w-40">
            <button className="btn-primary w-full" disabled={loading || !text.trim()} onClick={() => handleParse()}>
              {loading ? "Parsing…" : "Parse text"}
            </button>
            <label className="btn-secondary w-full cursor-pointer">
              Upload file
              <input
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleParse(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
        {error && <p className="font-mono text-xs text-brick">{error}</p>}

        {course.items.length > 0 && (
          <div className="overflow-hidden rounded-sm border border-line">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/50 font-mono text-[10px] uppercase tracking-wider text-ink/45">
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Due</th>
                  <th className="px-3 py-2 font-medium">Est. hrs</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {course.items.map((it) => (
                  <tr key={it.id} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[it.type] || "bg-ink/40"}`} />
                        <input
                          className="w-full bg-transparent py-1 text-sm focus:outline-none"
                          value={it.title}
                          onChange={(e) => updateItem(it.id, { title: e.target.value })}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        className="bg-transparent py-1 font-mono text-xs uppercase focus:outline-none"
                        value={it.type}
                        onChange={(e) => updateItem(it.id, { type: e.target.value })}
                      >
                        {TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="date"
                        className="bg-transparent py-1 font-mono text-xs focus:outline-none"
                        value={it.dueDate || ""}
                        onChange={(e) => updateItem(it.id, { dueDate: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-14 bg-transparent py-1 font-mono text-xs focus:outline-none"
                        value={it.estimatedHours ?? ""}
                        onChange={(e) => updateItem(it.id, { estimatedHours: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => removeItem(it.id)} className="text-ink/30 hover:text-brick">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button onClick={addBlankItem} className="font-mono text-xs uppercase tracking-wider text-pine hover:text-pine-dark">
          + Add item manually
        </button>
      </div>
    </div>
  );
}
