# Multimodal OT Clinical Reasoning Study — Proof of Concept

## What this project is
A doctoral dissertation study at Drake University (Dennis Culver). The study captures three synchronized data streams — eye gaze (WebGazer), interaction logs (jsPsych click events), and retrospective think-aloud audio (Whisper) — as OT students work through EHR-style clinical cases. Data feeds a T/ONA (Transmodal Ordered Network Analysis) comparing student reasoning patterns to a faculty expert model. An R Shiny feedback dashboard is shown to the experimental group between cases.

## Theoretical framework
- **Emic codes** (Schell's EMPR): SCIENTIFIC, NARRATIVE, PRAGMATIC — what *type* of OT reasoning
- **Etic codes** (Winne & Hadwin SRL): TASK-DEF, GOAL-SET, ENACTING, MONITOR — what *regulatory function*
- AOIs in the EHR carry BOTH emic and etic codes simultaneously (`logClick(aoi, emic, etic, action, detail)`)
- MONITOR is verbal-only — no screen region maps to it
- Primary analysis: T/ONA via `tma` R package (per-stream temporal windows: gaze ~1.5s, clicks ~4s, verbal ~9s)
- Secondary analysis: Categorical RQA via `crqa` R package on gaze AOI dwell sequences

## File structure
```
proof-of-concept/
├── index.html          # Main jsPsych experiment (BioWorld EHR interface)
├── CLAUDE.md           # This file
├── js/                 # jsPsych plugins, WebGazer, extension files
├── img/                # Case images (if any)
├── R_Source_Code/
│   └── app.R           # R Shiny feedback dashboard
├── dashboard/          # Compiled shinylive output (from shinylive::export)
│   └── index.html      # Loaded in iframe by the experiment
└── .git/
```

## Key constants in index.html
- `OSF_EXPERIMENT_ID`: `"7to0EiezFvtE"` — DataPipe experiment ID
- `CONFIG.WHISPER_MODEL`: `"Xenova/whisper-small.en"` — ~240MB, caches after first load
- `CONFIG.FORCE_CONDITION`: `"dashboard"` — set to `null` for true randomization
- `STREAM_WINDOW_MS`: gaze=1500ms, click=4000ms, verbal=9000ms (per-stream transmodal windows)

## How to re-export the dashboard after editing app.R
```r
setwd("/path/to/proof-of-concept")   # or wherever the repo root is
shinylive::export("R_Source_Code", "dashboard")
```
Then hard-refresh the experiment (Cmd+Shift+R / Ctrl+Shift+R).

## How to serve the experiment locally (required — file:// won't work)
```bash
cd /path/to/proof-of-concept
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```
WebGazer, getDisplayMedia, and getUserMedia all require HTTPS or localhost. GitHub Pages provides HTTPS.

## Data pipeline
1. **jsPsych** captures gaze (`webgazer_data`), clicks (`click_events`), and triggers Whisper transcription after each RTA
2. **`gazeToDwells`** converts raw gaze `{x,y,t}` samples → AOI dwell events `{t, aoi, code, source:"gaze"}`
3. **`logClick(aoi, emic, etic, action, detail)`** logs panel interactions with both code dimensions
4. After Case 1: data is written to **IndexedDB** (`OT_Simulation_DB`) for the Shiny dashboard to read
5. After each case's RTA: **per-case OSF upload** (`CODE_case1_timestamp.json`, partial:true)
6. At experiment end: **consolidated OSF upload** (`CODE_full_timestamp.json`, partial:false)
7. All uploads via **DataPipe** → OSF. Audio and video never leave the participant's machine.

## Current experiment flow
1. Browser gate (Chrome/Edge desktop only)
2. Self-generated longitudinal code (or ?sub_id= from URL)
3. Microphone permission
4. WebGazer init + 13-point calibration (3-attempt escalating: 130px/80%, 165px/70%, 200px/60%; proceeds-and-flags, never terminates)
5. Whisper model download (whisper-small.en, shown as loading screen)
6. SR instruction screen (stimulated recall explanation)
7. Practice trial (simplified BioWorld scheduling scenario, non-clinical)
8. Practice RTA + debrief
9. **Case 1** (Evelyn Soto — stroke, inpatient rehab):
   - startRec screen: "Step 1: Go Fullscreen" button → requestFullscreen() → fullscreenchange → "Step 2: Start Recording" button → getDisplayMedia()
   - BioWorld EHR case (hypothesis manager, belief meter, evidence table, assessments, library, intervention plan)
   - Case 1 RTA (replay with letterbox-aware gaze overlay)
   - Per-case OSF upload (background)
10. IndexedDB handoff (Case 1 data → dashboard)
11. Mid-session recalibration (1–2 attempts, lenient 200px threshold)
12. Dashboard (experimental group only, iframe → ./dashboard/index.html)
13. **Case 2** (Marcus Tran — C6 SCI, inpatient rehab)
14. Case 2 RTA
15. Per-case OSF upload (background)
16. Final consolidated OSF upload

## BioWorld cases
- **BW_CASES[1]**: Evelyn Soto, stroke (L MCA), inpatient rehab, right hemiparesis
- **BW_CASES[2]**: Marcus Tran, C6 SCI incomplete (AIS D), inpatient rehab
- Each case has: Problem tab, Chart tab (assessments with Send to Evidence), Library tab, Plan tab
- AOIs: bw_problem, bw_chart, bw_library, bw_plan, bw_hyp (hypothesis), bw_belief (belief meter), bw_ev (evidence)

## AOI → code map (emic / etic)
| AOI | Emic | Etic |
|-----|------|------|
| bw_problem | NARRATIVE | TASK-DEF |
| bw_chart | SCIENTIFIC | TASK-DEF |
| bw_library | SCIENTIFIC | GOAL-SET |
| bw_hyp | SCIENTIFIC | GOAL-SET |
| bw_belief | SCIENTIFIC | MONITOR |
| bw_ev | NARRATIVE | ENACTING |
| bw_plan | PRAGMATIC | ENACTING |

## R Shiny dashboard (app.R)
- Reads Case 1 data from IndexedDB via JavaScript → Shiny.setInputValue
- Computes a real per-stream transmodal co-occurrence network from the student's actual data
- Compares to a **hardcoded pretend faculty model** (proof-of-concept only)
- Five visuals: centroid quadrant plot, plain-language gaps list, radar chart, adjacency heatmap, tiered connection table
- Uses: shiny, bslib, jsonlite, dplyr, ggplot2, S7 (webR/ggplot2 bug fix — do not remove)
- Does NOT use: plotly, echarts4r, reactable (unreliable under webR/shinylive)
- Do NOT use `font_google()` in bs_theme — network call fails under shinylive

## Known issues / things still to do
- [ ] Confirm OSF data is actually landing (DataPipe experiment must have data collection enabled + valid OSF token)
- [ ] Run grounding_tma_test.R Layer B (rENA model) — needs a run-and-fix pass
- [ ] Layer C of grounding test (tma package) — requires `ls("package:tma")` + `?tma::accumulate` output to finalize
- [ ] Replace pretend faculty model in app.R with real ONA output once faculty data is collected
- [ ] Validate Whisper transcription accuracy on real OT terminology (tenodesis, hemiparesis, Dycem, etc.)
- [ ] Save `_gaze_raw` to OSF (currently deleted after RTA) — needed for quality control and RQA
- [ ] Block randomization instead of coin-flip (DataPipe supports balanced assignment)
- [ ] Pilot on lowest-spec machine expected in the study

## Key citations
- T/ONA: Tan, Ruis, Marquart, Cai, Knowles & Shaffer (2023, ICQE, DOI: 10.1007/978-3-031-31726-2_8)
- Transmodal analysis: Shaffer, Wang & Ruis (2025, *Journal of Learning Analytics*, DOI: 10.18608/jla.2025.8423)
- WebGazer + jsPsych validation: Yang & Krajbich (2021, *Judgment and Decision Making*, Vol 16 No 6)
- Calibration protocol: Yang & Krajbich (2021) — 3-attempt escalating, 130/165/200px
- AOI methodology: Anderson et al. (2013, *Behavior Research Methods*, DOI: 10.3758/s13428-012-0299-5)
- RQA on gaze: Coco & Dale (2014, *Frontiers in Psychology*, DOI: 10.3389/fpsyg.2014.00510)
- Stimulated recall: Gass & Mackey (2017, 2nd ed., Routledge); Lyle (2003, *BERJ*, DOI: 10.1080/0141192032000137349)
- SRL framework: Winne & Hadwin (1998); Greene & Azevedo (2007, *Review of Educational Research*)
- OT clinical reasoning: Schell's Ecological Model of Professional Reasoning (EMPR)

## Advisor
Dennis's advisor is a decision point for unresolved theoretical framework questions. The emic-etic framing (Schell as emic, Winne & Hadwin as etic) was confirmed as the study's original theoretical contribution.
