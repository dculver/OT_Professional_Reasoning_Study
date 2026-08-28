# OT Professional-Reasoning Study - Working Map (CLAUDE.md)

> Quick operational map for this repo. Long-form context lives in the handoff docs
> (Section 11). If this file and those docs disagree, the handoff docs win and this
> file should be corrected.
> Last reconciled: 2026-08-25. The prior version of this file (BioWorld interface,
> emic/etic + Winne-Hadwin coding, OSF/DataPipe, condition/dashboard) described an
> ABANDONED design and has been fully superseded. Do not restore it.

## 1. What the study is
Descriptive Quantitative Ethnography (QE) study of OT professional reasoning.
Compares experts (OT faculty) vs near-novices (OT students) as they work clinical
cases in a custom browser instrument. NOT experimental, NOT a pilot. No intervention
and no feedback dashboard is shown to participants. Expert-vs-novice is the central
inferential contrast; measurement equivalence across the two groups is load-bearing
throughout (check every design choice against "does this vary with the group
contrast I am testing?").
Researcher: Dennis Culver (Drake University / Des Moines University).
Advisor: Dr. Robyn Cooper.

## 2. Three data streams
- Gaze: WebGazer (webcam) -> AOI transitions. Feeds RQA only.
- Action + content-of-action: click/selection/text events WITH content. ONA/TMA Stream 1 (coded).
- RTA (retrospective think-aloud): Whisper transcription of replay narration. ONA/TMA Stream 2 (coded).
Two analytic streams for the network model; a SINGLE SHARED CODEBOOK across both
(required for the analysis to be multimodal). See decision log A-B.

## 3. Instrument architecture
Single-page jsPsych tool, GitHub Pages hosted. Five panel-level AOIs, FLUID layout
(vw/vh flexbox), NOT a fixed pixel canvas (settled; decision log D):
  case_material, occupations, performance, synthesis, intervention
AOI rectangles are snapshotted per session (snapshotAOIRects) because absolute px
vary with viewport; the relative layout is fixed.

Two-record architecture (do NOT conflate):
- state.log   = analyzed events (Option B: each carries t, t_clock, kind, enriched
                labels + stable ids). Feeds coding / ONA / TMA.
- state.recon = {deltas, cursor}. REPLAY-ONLY. Never analyzed, never exported.
                deltas = 12 op types; cursor = ~8 Hz {x,y,aoi,t}.

Time model: case-relative clock (first event ~0 ms). case_started_offset_ms captured
at case start. offset_into_session = case_started_offset_ms + t. RTA utterances are
re-anchored onto the shared task-time axis at the replay-moment shown (decision log C).

## 4. Cases
- Florence = Case 1 (post L total shoulder arthroplasty; RA). ANALYZED.
- Yvonne   = Case 2 (post L radical mastectomy; SLE). ANALYZED.
- Patricia = Practice only (zone II flexor tendon repair). NOT analyzed; norming.
Cases adapted from an AOTA Press textbook (Hutchinson, first author, 2022).
Case order in code: PATRICIA -> FLORENCE -> YVONNE (CASES_IN_ORDER).

## 5. Reasoning task (what a participant does per case)
Name occupations -> highlight case text and classify each selection as a Support or
Barrier (name the mechanism, optional OTPF-4 aspect tag, link to an occupation) ->
Synthesis (clinical impression with captured revision trajectory; desired outcomes,
optional OTPF-4 outcome-type tag) -> Intervention plan (select own barriers, justify
prioritization; per barrier: approach [OTPF-4 Table 13], method, type [Table 12],
grading; one measurable occupation-based long-term goal; immediate-attention note).
NOTE: OTPF-4 tags are data-capture affordances, NOT the analytic codebook (see 8).

## 6. Build status (chunks)
- Chunk 1 (index_chunk1.html): capability gate -> browser check -> permissions ->
  FULLSCREEN (before calibration; viewport fix) -> chinrest -> 13-pt calibration/
  validation. Gaze CONDITIONAL on fullscreen height >= 660 px (GAZE_MIN_HEIGHT);
  below it the session runs no-gaze. Browser gate is CAPABILITY-BASED (any modern
  desktop browser - Chrome/Edge/Firefox/Safari; desktop-only, requires mic + WASM +
  fullscreen); browser-family exclusion removed. NO screen recording (replay is reconstructed
  from state.recon). Session clock anchor = study.session_started_at_ms, set at the
  fullscreen step; case_started_offset_ms and RTA re-anchoring compute from it. BUILT.
- Chunk 2 (index_chunk2.html): Chunk 1 scaffolding + reasoning engine mounted as
  Option-B wrapper trials (Practice -> Case 1 -> Case 2). CURRENT INTEGRATION POINT.
  BUILT. (Duplicates Chunk 1's first ~720 lines; chunk1 is subsumed.)
- Chunk 3 (RTA reconstruction replay): engine PROVEN (js/replay_engine.js +
  OT_Replay_Harness_chunk3.html; Playwright-verified reconstruction). Replay rebuilt
  from state.recon ALONE - no screen recording. Narration re-anchor capture in
  js/reanchor.js (headless-tested). Mic + Whisper capture and re-anchoring are wired
  into the integrated build (below). NEEDS live verification.
- Chunk 4 (one-file save/export): built into the integrated build - event_log +
  descriptive state + raw gaze {x,y,t} + metadata + re-anchored RTA per case ->
  in-browser JSON download; Qualtrics upload URL is a placeholder. recon NOT exported.
- INTEGRATED BUILD: index_full.html = Chunks 1-4 in one file (opening/calibration ->
  Practice(Patricia) -> Case 1(Florence) -> Case 2(Yvonne), each task followed by its
  RTA replay -> export). Assembled from chunk2 scaffolding + the Option-B engine +
  reanchor + a new integration/replay/export layer. Syntax-verified only; jsPsych/
  WebGazer/Whisper/mic UNTESTED in sandbox - live verification in Dennis's env pending.
  Once verified, promote index_full.html -> index.html for deploy.

## 7. Data pipeline (target)
Browser (jsPsych) -> Firebase Firestore (transient buffer, purged) -> institutional
OneDrive/SharePoint (master custody) -> Qualtrics (Drake-governed file upload) ->
OSF (archival/preregistration only, not a live sink).
Export carries: event_log + descriptive state + raw gaze {x,y,t} + session/case
metadata (ids, AOI rects, gaze_tracked, case_started_offset_ms, viewport).
state.recon is NEVER exported. NO screen recording and no video anywhere -- the RTA replay is reconstructed from state.recon.
Analysis: R (crqa for RQA; rENA/tma for ONA/TMA); nCoder (app.n-coder.org) for the
regex classifier + IRR.

## 8. Codebook / analysis framing (IMPORTANT)
- Two-level abductive codebook. Schell's professional-reasoning tracks (Fleming/
  Mattingly) are the ORGANIZING THEORETICAL FRAME, not segment-level codes. Concrete
  observable codes are generated abductively from pooled faculty+student data; data
  holds veto power. Coders assign segment-level codes, not category labels.
- DO NOT reintroduce: emic/etic framing, Winne & Hadwin SRL phases, or
  TASK-DEF / GOAL-SET / ENACTING / ADAPT. (Artifacts of the abandoned prior design.)
- RQ framework: Structure (directed network comparison), Differences (mixed ANOVA /
  t-tests), Consistency (ICCs), Relational (cross-stream DET-X correlations).
- Density gate (open): explanation-stream density is a joint property of data +
  codebook grain; compute after the codebook exists; the student (sparser) group
  gates the comparison. If too thin: coarsen codebook or invoke pre-approved collapse
  to multimodal ONA.
- Fusion caution (verified): naive multimodal ONA can UNDERPERFORM unimodal; the ONA
  fallback is not "safe."
- SVD vs means rotation: FLAGGED for Dr. Cooper (affects relational cross-stream RQs).

## 9. Open a-priori decisions (must be justified, not defaulted)
- Silence-net threshold (currently 15000 ms placeholder; van Gog used 5 s; TA
  convention ~15 s). Needs a paradigm-transfer justification.
- AOI adequacy: COMPUTED at capture in index_full.html (captureAOIGeometry in
  snapshotAOIRects path) - per-panel + worst-case min = panel min-dimension /
  mean_offset_px, additive, px preserved, null when gaze off. aoi_rects_start_norm
  also stored (rect / task_viewport, diagnostic). Mid-case fullscreen/resize guard
  logs viewport_events + sets viewport_changed_after_calibration. OPEN a-priori
  decision: the adequacy THRESHOLD (>=1 / >=1.5 / >=2) - only the ratio is stored,
  the pass/fail cutoff is chosen in analysis.
- Density gate value; SVD vs means (Cooper).
Citation hygiene: confirm Strohmaier 2020 byline/pages; resolve which Jennett paper
is Sinnott ref [29]; add verified sources to Zotero Methods only on approval.

## 10. Key files and constants
- index_full.html  = INTEGRATED build (Chunks 1-4); test this. Promote to index.html when verified.
- index_chunk2.html = prior integration point (opening + engine, no replay/export).
- index_chunk1.html = opening/consent/calibration (subsumed by chunk2).
- index.html        = OLD BioWorld build (superseded). Still the GitHub Pages root;
  leave until index_full.html is verified, then overwrite it (promotion).
- _archive/          = abandoned experimental-dashboard artifacts moved out of the
  working tree: _archive/dashboard/ (compiled shinylive) and _archive/R_Source_Code/
  app.R (the between-cases R Shiny feedback dashboard). Not part of the current design.
- js/replay_engine.js = Chunk 3 reconstruction fold (reconstructStateAt, applyDelta,
  cursorAt, replayKeyframes). Deterministic, Node-testable.
- js/reanchor.js    = Chunk 3 RTA re-anchoring capture (narration {text, playT} +
  re-anchor transform onto shared task-time axis). Node-testable.
- OT_Replay_Harness_chunk3.html = standalone replay test rig (engine + controller +
  real interface). Inject a recon record via window.__RECON__.
- OT_Reasoning_Prototype_v2.html = ENGINE SOURCE OF TRUTH (edit here, re-extract into
  chunk2; do NOT hand-edit chunk2's embedded engine). [not currently in this repo]
Constants: WHISPER_MODEL = Xenova/whisper-small.en; GAZE_MIN_HEIGHT = 660;
SCREEN_FPS = 15; RTA_MAX_SECONDS = 240; QUALTRICS_UPLOAD_URL = placeholder.

## 11. Handoff docs (long-form source of truth)
In the connected "files for cowork" folder / OT_Study_Cowork_Handoff.zip:
- OT_Study_Project_State_README.md   (orientation - read first)
- OT_Study_Decision_Log_Session_Export.md (settled decisions, tagged)
- OT_Study_Sources_Reference.md      (verified citations, Zotero keys)
- OT_Study_CrossCase_Parity_Checklist.md (equivalence items for OT case-review)

## 12. Environment / working constraints
- jsPsych + WebGazer + Whisper + mic CANNOT run in the cowork sandbox. Only the
  prototype (OT_Reasoning_Prototype_v2.html) is Playwright-testable; full stack is
  tested in Dennis's GitHub Pages environment.
- Zotero MCP works only when Dennis's Zotero desktop is running (local API port
  23119). Library ID 1. Collections: Methods PUHACP8V, Lit Review 2D2QDB8H,
  OT Pro Reason KVIC2B8W.
- Engine change propagation: edit prototype (source of truth) -> re-extract into
  chunk2. Do not hand-edit chunk2's embedded engine.
- Data-text hygiene: no em-dashes / non-ASCII in participant-facing or data text;
  use "study", not "experiment".

## 13. Standing constraints (how to work with Dennis)
- No unilateral research-design decisions. Surface explicit forks with a defended
  recommendation; get approval before proceeding.
- Ground methods claims in literature, not memory. Verify DOIs against primary
  records. Never fabricate. Never add to Zotero without explicit approval.
- Dennis writes ALL dissertation prose himself. Do not draft dissertation sections.
  Assistance = pressure-testing, methods explanation, source verification, error
  catching, stats/ONA/RQA/TMA mechanics.
- Be direct and brutally honest; no sugar-coating, no padding. Encourage only when
  genuinely warranted. Dense, technically precise responses.
