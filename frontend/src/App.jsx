import { useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import CourseCard from "./components/CourseCard.jsx";
import AvailabilityGrid, { cellsToBlocks } from "./components/AvailabilityGrid.jsx";
import PreferencesPanel from "./components/PreferencesPanel.jsx";
import TermHeatmap from "./components/TermHeatmap.jsx";
import ScheduleView from "./components/ScheduleView.jsx";
import { generateScheduleLocal } from "./lib/scheduler.js";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function weeksFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

let uid = 1;

export default function App() {
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState([{ id: uid++, name: "", items: [] }]);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [preferences, setPreferences] = useState({
    sessionLength: 60,
    dailyMaxHours: 3,
    startDate: today(),
    endDate: weeksFromNow(8),
    bufferDays: 1,
  });
  const [schedule, setSchedule] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const allItems = useMemo(
    () => courses.flatMap((c) => c.items.map((it) => ({ ...it, courseName: c.name || "Untitled course" }))),
    [courses]
  );

  function updateCourse(id, next) {
    setCourses((cs) => cs.map((c) => (c.id === id ? next : c)));
  }
  function addCourse() {
    setCourses((cs) => [...cs, { id: uid++, name: "", items: [] }]);
  }
  function removeCourse(id) {
    setCourses((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      const availability = cellsToBlocks(selectedCells);
      // Runs entirely client-side — no network call, no API key. Wrapped in
      // a tiny delay purely so the "Building schedule…" state is visible;
      // the calculation itself is effectively instant.
      await new Promise((r) => setTimeout(r, 150));
      const result = generateScheduleLocal({ items: allItems, availability, preferences });
      setSchedule(result);
      setStep(3);
    } catch (e) {
      setGenError(e.message || "Something went wrong generating the schedule.");
    } finally {
      setGenerating(false);
    }
  }

  const canProceedStep1 = allItems.length > 0;
  const canGenerate = allItems.length > 0 && selectedCells.size > 0;

  return (
    <div className="min-h-screen bg-paper">
      <Header step={step} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        {step === 1 && (
          <section className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink">Bring in your syllabi</h1>
              <p className="mt-1.5 max-w-xl text-sm text-ink/60">
                Paste the text of a syllabus or upload a PDF/txt file per course. This runs entirely in your
                browser — it looks for dated items (exams, assignments, readings) using pattern matching, no AI
                and no network call involved. Review what it finds and fix or add anything it misses below.
              </p>
            </div>

            <div className="space-y-4">
              {courses.map((c, i) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  colorIndex={i}
                  onChange={(next) => updateCourse(c.id, next)}
                  onRemove={() => removeCourse(c.id)}
                />
              ))}
            </div>

            <button onClick={addCourse} className="btn-secondary">
              + Add another course
            </button>

            <div className="flex items-center justify-between border-t border-line pt-6">
              <span className="font-mono text-xs text-ink/50">{allItems.length} items captured so far</span>
              <button className="btn-primary" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Next: set availability →
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink">When can you study?</h1>
              <p className="mt-1.5 max-w-xl text-sm text-ink/60">
                Click and drag across the grid to mark your weekly free time. This pattern repeats across the whole
                term window below.
              </p>
            </div>

            <div className="card p-5">
              <AvailabilityGrid selected={selectedCells} onChange={setSelectedCells} />
              <p className="mt-3 font-mono text-[11px] text-ink/40">
                {selectedCells.size} hour-slots selected/week
              </p>
            </div>

            <div className="card p-5">
              <p className="field-label mb-3">Preferences</p>
              <PreferencesPanel preferences={preferences} onChange={setPreferences} />
            </div>

            <div className="card p-5">
              <TermHeatmap items={allItems} startDate={preferences.startDate} endDate={preferences.endDate} />
            </div>

            {genError && (
              <p className="rounded-sm border border-brick/40 bg-brick/5 px-4 py-3 font-mono text-xs text-brick">
                {genError}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-line pt-6">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="btn-primary" disabled={!canGenerate || generating} onClick={handleGenerate}>
                {generating ? "Building schedule…" : "Generate schedule →"}
              </button>
            </div>
          </section>
        )}

        {step === 3 && schedule && (
          <section>
            <ScheduleView schedule={schedule} />
            <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                ← Adjust availability
              </button>
              <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
