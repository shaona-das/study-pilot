# Syllabus — Free, Local Study Scheduler

A study-schedule generator that reads course syllabi and your weekly availability and
produces a day-by-day plan — **entirely in the browser**. No backend, no API key, no
AI calls, no cost, ever. Everything you see was computed on your own device.

This is a from-scratch rewrite of an earlier AI-powered version of this app. See
["How this differs from the AI version"](#how-this-differs-from-the-ai-version) below
for the honest tradeoffs.

## How it works

1. **Parse syllabi** — paste text or upload a `.pdf`/`.txt` per course. A local
   pattern-matching parser (`src/lib/syllabusParser.js`) scans for lines with a
   recognizable date, tags a type (exam/assignment/reading/etc.) by keyword, pulls a
   grade weight if stated, and assigns a rough hour estimate by item type. Everything
   lands in an editable table — fix anything it missed or got wrong, or add items by
   hand.
2. **Set availability** — click-drag a weekly grid of free time, set session length,
   daily max hours, and the term's start/end dates. A heatmap shows workload density
   across the term so crunch weeks are obvious before you generate anything.
3. **Generate schedule** — a deterministic earliest-deadline-first algorithm
   (`src/lib/scheduler.js`) places study sessions only inside your declared free time,
   never past a due date, prioritizing sooner/heavier-weighted items, spreading big
   items across multiple sessions rather than cramming them into one block. It flags
   anything it couldn't fit (not enough available time) or couldn't schedule at all
   (no due date given).

## Running it

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. That's it — no `.env` file, no second process to run.

## Deploying to GitHub Pages (free) — recommended: GitHub Actions

This repo includes `.github/workflows/deploy.yml`, which builds the app and deploys
it to GitHub Pages **automatically, on GitHub's servers, every time you push to
`main`** — no local build step, no `npm run deploy`, nothing to run on your own
computer. This is the right approach if you're managing the repo through GitHub's
web interface rather than git on the command line.

One-time setup after pushing this repo (with the `.github/workflows/deploy.yml` file
included) to GitHub:
1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not "Deploy
   from a branch" — that option expects pre-built files sitting on a branch, which is
   what caused the 404 if you tried that route before).
3. Go to the **Actions** tab. You should see a "Deploy to GitHub Pages" run kick off
   automatically (or push any small change to trigger it, e.g. edit the README and
   commit). Wait for it to finish — the checkmark turns green.
4. Your site is now live at `https://<your-username>.github.io/<your-repo-name>/`.

From then on, every push to `main` re-builds and re-deploys automatically.

### Alternative: deploy manually from your own computer

If you'd rather build locally and push the result yourself:

```bash
cd frontend
npm install
npm run deploy
```

This uses the `gh-pages` package to build and push `frontend/dist/` to a `gh-pages`
branch. If you use this route instead, set **Settings → Pages → Source** to **Deploy
from a branch**, branch **gh-pages**, folder **/ (root)**.

Don't mix the two approaches — pick GitHub Actions *or* the manual `gh-pages` branch,
not both, since they expect different Pages source settings.

### Why the 404 happened

- **"Deploy from a branch" serves files as-is — it doesn't build anything.** Uploading
  raw source through GitHub's web UI (or pushing it without ever running `npm run
  deploy`) means there's no compiled `index.html`/JS bundle sitting on the branch Pages
  was told to serve, hence the 404.
- **Asset paths would also break under a subpath** even once something is being
  served, since GitHub Pages project sites live at `yourname.github.io/repo-name/`,
  not the domain root. `vite.config.js` here sets `base: "./"` so built asset paths
  are relative and resolve correctly either way — already handled, nothing to change.

## Other free static hosts

Since this produces a plain `dist/` folder (`npm run build` in `frontend/`), any of
these work too:
- **Vercel** or **Netlify** — connect the repo, set root directory to `frontend`,
  build command `npm run build`, output directory `dist`. Auto-deploys on push.
- **Cloudflare Pages** — same idea.

No server process, no environment variables, no ongoing cost with any of these.

## How this differs from the AI version

The scheduling step is arguably **better** this way — it's a real constraint-solving
algorithm, so it's guaranteed to never double-book a slot or place a session after its
deadline, which an LLM occasionally gets wrong on a large schedule.

The parsing step is the real tradeoff. Syllabi are inconsistent by nature — dates
written as "Oct 15," "10/15," or "the Tuesday after fall break," due dates buried in
paragraphs instead of listed cleanly, grading weight described in prose rather than a
number. The local parser (regex + keyword matching) handles clean, listy syllabi well
and will miss or mis-tag things in denser or more narrative ones. There's no partial
credit for "close, but it understood context." A few concrete limits:
- Numeric dates are assumed to be **US-style MM/DD**, so `03/04` is read as March 4th.
- "Week 6" style references aren't resolved to a date — they're skipped, since the
  parser doesn't know the term's start date at that point in the flow.
- Hour estimates are fixed per item type (exam vs. reading vs. assignment, etc.),
  not adjusted for how genuinely hard a given exam or paper sounds.

The editable table and "+ Add item manually" button exist specifically to absorb this
gap — expect to spend a bit more time reviewing/fixing parsed items for messier
syllabi than you would with an LLM doing the reading.

## Project structure

```
frontend/
  src/App.jsx                  3-step flow & top-level state
  src/lib/
    dateUtils.js                date-finding regex + ISO date resolution
    syllabusParser.js           local heuristic syllabus parser (no AI)
    scheduler.js                deterministic earliest-deadline-first scheduler
    pdfText.js                  browser-side PDF text extraction (pdf.js), lazy-loaded
  src/components/
    CourseCard.jsx               syllabus input + editable extracted items
    AvailabilityGrid.jsx         click-drag weekly free-time grid
    PreferencesPanel.jsx         session length / daily max / term dates
    TermHeatmap.jsx              workload-density visualization
    ScheduleView.jsx             final day-by-day schedule
```

## Notes

- There's no persistence layer — refreshing the page clears state. Adding
  `localStorage` (works fine here, since this is a real deployed app rather than a
  Claude.ai artifact) would be a natural next step if you want the plan to survive a
  refresh.
- No auth needed, since there's no backend or API cost to protect.
- PDF parsing runs via [pdf.js](https://mozilla.github.io/pdf.js/) and is loaded lazily
  (only when someone actually uploads a PDF), so it doesn't add to the initial page
  weight for people just pasting text.
