# OT Professional-Reasoning Study - Working Map (CLAUDE.md)

> Quick operational map for this repo. Long-form context lives in the handoff docs
> (Section 11). If this file and those docs disagree, the handoff docs win and this
> file should be corrected.
> Last reconciled: 2026-08-31. EYE TRACKING REMOVED 2026-08-31 (Dennis's decision):
> no WebGazer / webcam / chinrest / calibration / gaze capture. The study is now
> TWO-STREAM (action+content + RTA). RQA was gaze-only and is dropped; any gaze-
> dependent RQ needs revisiting (see 8/9). An earlier version of this file described
> a BioWorld/emic-etic/OSF/dashboard design that is also ABANDONED - do not restore.

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

## 2. Two data streams (analyzed)
- Action + content-of-action: click/selection/text events WITH content. ONA/TMA Stream 1 (coded).
- RTA (retrospective think-aloud): Whisper transcription of replay narration. ONA/TMA Stream 2 (coded).
Both feed the network model with a SINGLE SHARED CODEBOOK (required for multimodality).
NO gaze stream - eye tracking removed 2026-08-31. See decision log A-B.

## 3. Instrument architecture
Single-page jsPsych tool, GitHub Pages hosted. FLUID layout (vw/vh flexbox). Five
panels: case_material, occupations, performance, synthesis, intervention. (These were
the gaze AOIs; with gaze removed they are simply the interface panels - no rect
capture, no AOI-adequacy.)

Two-record architecture (do NOT conflate):
- state.log   = analyzed events (Option B: each carries t, t_clock, kind, enriched
                labels + stable ids). Feeds coding / ONA / TMA.
- state.recon = {deltas, cursor}. REPLAY-ONLY. Never analyzed, never exported.
                deltas = 12 op types; cursor = ~8 Hz {x,y,aoi,t} (mouse cursor, for
                the RTA reconstruction only - NOT eye gaze).

Time model: case-relative clock (first event ~0 ms). case_started_offset_ms captured
at case start (session clock = study.session_started_at_ms, set at fullscreen).
offset_into_session = case_started_offset_ms + t. RTA utterances are re-anchored onto
the shared task-time axis at the replay-moment shown (decision log C).

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

## 6. Build status
- index_full.html = THE instrument (single file). Flow: capability gate -> browser
  check -> microphone permission -> FULLSCREEN (interface fit; sets session clock +
  task_viewport) -> Whisper warmup -> Practice(Patricia) -> Case 1(Florence) ->
  Case 2(Yvonne), each task followed by its RTA replay -> one-file export. Two
  streams (action+content + RTA). NO webcam / calibration / chinrest / gaze / screen
  recording. Browser gate CAPABILITY-BASED (any modern desktop browser; desktop-only;
  needs mic + WASM + fullscreen). Assembled from the Option-B engine + js/reanchor.js
  + an integration/replay/export layer. Syntax/structure-verified only; jsPsych /
  Whisper / mic UNTESTED in sandbox - live verification in Dennis's env pending.
  Once verified, promote index_full.html -> index.html for deploy.
- RTA replay (Chunk 3): reconstructed from state.recon ALONE (no video). Engine =
  js/replay_engine.js (reconstructStateAt). Re-anchoring = js/reanchor.js. Mic +
  Whisper capture wired in. NEEDS live verification (mic/Whisper across browsers).
- Export (Chunk 4): event_log + descriptive state + re-anchored RTA per case +
  session metadata -> in-browser JSON download. recon NOT exported. End-of-study
  screen = gated 2-step (download session file -> return-to-survey redirect, sub_id
  appended). QUALTRICS_UPLOAD_URL still a placeholder -> PENDING from Dennis (ASK AGAIN).
- HISTORICAL (pre-gaze-removal; STILL CONTAIN webgazer/calibration; superseded by
  index_full.html): index_chunk1.html, index_chunk2.html, OT_Replay_Harness_chunk3.html.

## 7. Data pipeline (target)
Browser (jsPsych) -> Firebase Firestore (transient buffer, purged) -> institutional
OneDrive/SharePoint (master custody) -> Qualtrics (Drake-governed file upload) ->
OSF (archival/preregistration only, not a live sink).
Export carries: event_log + descriptive state + re-anchored RTA per case + session/
case metadata (ids, case_started_offset_ms, task_viewport). NO gaze, NO AOI rects.
state.recon is NEVER exported. NO screen recording and no video anywhere -- the RTA
replay is reconstructed from state.recon.
Analysis: R (rENA / tma for ONA/TMA); nCoder (app.n-coder.org) for the regex
classifier + IRR. (crqa/RQA was gaze-only -> dropped.)

## 8. Codebook / analysis framing (IMPORTANT)
- Two-level abductive codebook. Schell's professional-reasoning tracks (Fleming/
  Mattingly) are the ORGANIZING THEORETICAL FRAME, not segment-level codes. Concrete
  observable codes are generated abductively from pooled faculty+student data; data
  holds veto power. Coders assign segment-level codes, not category labels.
- DO NOT reintroduce: emic/etic framing, Winne & Hadwin SRL phases, or
  TASK-DEF / GOAL-SET / ENACTING / ADAPT. (Artifacts of the abandoned prior design.)
- RQ framework (PREDATES gaze removal - REVISIT): Structure (directed network
  comparison), Differences (mixed ANOVA / t-tests), Consistency (ICCs), Relational
  (cross-stream DET-X correlations).
- FLAG (2026-08-31): with gaze removed, RQA is dropped and the "Relational (cross-
  stream DET-X)" RQ + any gaze-dependent RQ must be revisited with Dr. Cooper.
- Density gate (open): explanation-stream density is a joint property of data +
  codebook grain; compute after the codebook exists; the student (sparser) group
  gates the comparison. If too thin: coarsen codebook or invoke pre-approved collapse
  to multimodal ONA.
- Fusion caution (verified): naive multimodal ONA can UNDERPERFORM unimodal; the ONA
  fallback is not "safe."
- SVD vs means rotation: FLAGGED for Dr. Cooper (affects relational cross-stream RQs).

## 9. Open a-priori decisions (must be justified, not defaulted)
- Silence-net threshold (CONFIG.RTA_SILENCE_MS, 15000 ms placeholder; van Gog used
  5 s; TA convention ~15 s). Needs a paradigm-transfer justification.
- Density gate value; SVD vs means (Cooper); RQA/gaze-RQ rework (see 8 flag).
- (AOI adequacy / gaze quality: REMOVED with eye tracking 2026-08-31.)
Citation hygiene: confirm Strohmaier 2020 byline/pages; resolve which Jennett paper
is Sinnott ref [29]; add verified sources to Zotero Methods only on approval.

## 10. Key files and constants
- index_full.html   = THE instrument (no gaze); test this. Promote to index.html when verified.
- index_chunk2.html = HISTORICAL pre-gaze-removal scaffolding+engine (still has webgazer).
- index_chunk1.html = HISTORICAL opening/calibration (still has webgazer).
- index.html        = OLD BioWorld build (superseded). Still the GitHub Pages root;
  leave until index_full.html is verified, then overwrite it (promotion).
- _archive/         = abandoned experimental-dashboard artifacts moved out of the
  working tree: _archive/dashboard/ (compiled shinylive) and _archive/R_Source_Code/
  app.R (the between-cases R Shiny feedback dashboard). Not part of the current design.
- js/replay_engine.js = RTA reconstruction fold (reconstructStateAt, applyDelta,
  cursorAt, replayKeyframes). Deterministic, Node-testable.
- js/reanchor.js    = RTA re-anchoring capture (narration {text, playT} + re-anchor
  transform onto shared task-time axis). Node-testable.
- OT_Reasoning_Prototype_v2.html = ENGINE SOURCE OF TRUTH (edit here, re-extract;
  do NOT hand-edit an embedded engine). [not currently in this repo]
Constants: WHISPER_MODEL = Xenova/whisper-small.en; RTA_SILENCE_MS = 15000 (open a-priori);
QUALTRICS_UPLOAD_URL = placeholder. Head loads only: jspsych, html-keyboard-response,
initialize-microphone, browser-check (+ js/reanchor.js). permissionGate is mic-only.

## 11. Handoff docs (long-form source of truth)
In the connected "files for cowork" folder / OT_Study_Cowork_Handoff.zip:
- OT_Study_Project_State_README.md   (orientation - read first)
- OT_Study_Decision_Log_Session_Export.md (settled decisions, tagged)
- OT_Study_Sources_Reference.md      (verified citations, Zotero keys)
- OT_Study_CrossCase_Parity_Checklist.md (equivalence items for OT case-review)
NOTE: these handoff docs predate the 2026-08-31 gaze removal; where they describe
gaze/WebGazer/RQA/AOI-adequacy, that is superseded by this file.

## 12. Environment / working constraints
- jsPsych + Whisper + mic CANNOT run in the cowork sandbox (syntax/structure checks
  only); full stack is tested in Dennis's GitHub Pages environment.
- Zotero MCP works only when Dennis's Zotero desktop is running (local API port
  23119). Library ID 1. Collections: Methods PUHACP8V, Lit Review 2D2QDB8H,
  OT Pro Reason KVIC2B8W.
- Instrument build is assembled in a scratch pipeline (chunk2 scaffolding + Option-B
  engine + reanchor + integration layer). Do not hand-edit an embedded engine copy.
- Data-text hygiene: no em-dashes / non-ASCII in participant-facing or data text;
  use "study", not "experiment".

## 13. Standing constraints (how to work with Dennis)
- No unilateral research-design decisions. Surface explicit forks with a defended
  recommendation; get approval before proceeding.
- Ground methods claims in literature, not memory. Verify DOIs against primary
  records. Never fabricate. Never add to Zotero without explicit approval.
- Dennis writes ALL dissertation prose himself. Do not draft dissertation sections.
  Assistance = pressure-testing, methods explanation, source verification, error
  catching, stats/ONA/TMA mechanics.
- Be direct and brutally honest; no sugar-coating, no padding. Encourage only when
  genuinely warranted. Dense, technically precise responses.
