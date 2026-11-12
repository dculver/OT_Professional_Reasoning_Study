# Log merge → nCoder pipeline

`merge_logs_for_ncoder.R` combines the per-participant JSON session logs exported
by the instrument (schema `ot_prof_reasoning_v2`; older `v1` files are still read)
into one tidy, long-format dataset ready for **nCoder** code development and,
afterward, **rENA/ONA**.

## How to run it

### First-time setup (once)

1. Install **R** ([cran.r-project.org](https://cran.r-project.org)); optionally **RStudio**
   ([posit.co/download/rstudio-desktop](https://posit.co/download/rstudio-desktop)) for a GUI.
2. Install the only dependency — in the R/RStudio console:
   ```r
   install.packages("jsonlite")
   ```
   Everything else is base R.

### Getting the logs
Participants upload their session `.json` to Qualtrics. Use each participant's **final**
file (`export_kind: "final"`). A checkpoint file only matters for someone who stopped
after Case 1. The script warns if it sees a checkpoint or dev file.

### Option A — RStudio

1. Open `merge_logs_for_ncoder.R`.
2. **Session → Set Working Directory → To Source File Location** (puts you in `analysis/`).
3. **Test first:** click **Source**. With no changes it runs on `sample_logs/` and writes `out/`.
4. **Confirm correctness** (see "Verify the parse" below).
5. **Real run:** change `"sample_logs"` near the top to your folder (e.g. `"logs"`) and Source again.
   To change the line settings in RStudio, edit the `LINE_MODE` / `PLAN_MODE` defaults near the top.

### Option B — Terminal

```bash
cd ~/Documents/GitHub/proof-of-concept/analysis
Rscript merge_logs_for_ncoder.R sample_logs out                    # defaults: sentence lines, plan final text
Rscript merge_logs_for_ncoder.R logs results                       # real run
Rscript merge_logs_for_ncoder.R logs results_event event           # event-based lines
Rscript merge_logs_for_ncoder.R logs results_delta sentence delta  # plan text by editing run
```

It writes three files into the output folder:

| file | what it is |
|---|---|
| `ncoder_corpus.csv` | **import this into nCoder**: every row that has text (typed reasoning + spoken think-aloud) |
| `ona_events_full.csv` | every row including no-text structural moves; the timeline for rENA/ONA |
| `qa_summary.csv` | per participant × case counts. **`rta_empty_FLAG = True`** = no think-aloud lines at all; **`rta_not_transcribed` > 0** = that many v2 recordings failed, timed out, or were lost. Check both before analysis. |

## What counts as a line

- **Stream 1 is event-centric.** One row per meaningful `event_log` entry, in task-time order.
  Coded text: `occupation_add` → the occupation **description** (short `name` kept in `occupation`);
  `classify` → the mechanism (excerpt, source, aspect, support/barrier type as metadata; a
  classification linked to several occupations has `occupation` = "A; B");
  `desired_outcome_add` → the outcome text; impression and plan as below.
  No-text moves (`tab_switch`, `entry_remove`, `barrier_select`, `occupation_remove`,
  `desired_outcome_remove`, `session_resumed`) stay as rows with empty text.
- **Clinical impression: one unit per editing run, only what changed** (2026-11-11). A run is
  a stretch of impression typing with nothing else in between; in v2 files it is exactly one
  think-aloud item. The run contributes only the sentences it **added or changed** compared with
  the end of the previous run. Mid-typing snapshots are dropped. (Before this change every
  saved revision was coded in full, so unchanged sentences were re-coded each time the
  participant paused while typing, a typing-speed artifact.) `removed_sentences` counts what
  the run deleted; a run that only deleted text is a no-text row.
- **Plan free-text** (`PLAN_MODE`):
  - `final` (default): each field once, its final text, at its last edit.
  - `delta`: the same editing-run rule as the impression (v2 files; v1 files fall back to
    `final`). Use this if the plan should keep its trajectory. It also fixes an ordering quirk
    of `final`: a field's narration can otherwise sort one line before the field's text,
    because the final-text event is logged 0.7 s after typing stops.
- **Line size** (`LINE_MODE`):
  - `sentence` (default): prose is split into sentences; think-aloud is one line per Whisper chunk.
  - `event`: no splitting; one line per event (an editing run's changed text joined) and one
    line per think-aloud recording.
- **Stream 2 (think-aloud)** sits on the same case-relative clock as Stream 1. In v2 each line
  is anchored at the item it narrates (the action's time, or the start of a pause), so it sorts
  right after that action.
- The **practice case** (`analyzed: false`) is excluded automatically.

## Columns

`participant_id, group, year_in_program, case_id, case_name, line_index, time_ms,
session_offset_ms, stream, kind, has_text, segment_index, text, occupation, source,
excerpt, aspect, otpf_type, barrier_on, paused, event_index, item_id, item_kind, rec_id,
chunk_index, run_events, removed_sentences`

- `time_ms` case-relative ms; `session_offset_ms` ms from session start.
- `stream` `action` or `rta`; `kind` the event kind or `rta_utterance`.
- `event_index` (Stream 1) the 1-based position in the case's `event_log`; for an editing run, its last event.
- `item_id` / `item_kind` (v2) the think-aloud item that covers this action, or that this narration
  belongs to (`action`, `pause`, `final_review`). Lets you aggregate lines by event or item later.
- `rec_id`, `chunk_index` (v2 think-aloud) the recording and Whisper chunk.
- `run_events` number of saved revisions merged into an editing run; `removed_sentences` see above.
- For nCoder: **`text`** is the coded column; unit `participant_id`; conversation `case_id`.

## Verify the parse on your machine

R could not be run where this script was written, so the expected output comes from an
independent reference implementation (`gen_and_reference.py`, which mirrors the R logic) and is
included for all three settings. The samples include two v1 sessions (one with a failed
transcription) and one v2 session (`P021`) that exercises a mid-typing fragment, a pause
splitting the impression into two runs, multi-occupation, plan revisions, a two-chunk
recording, and one failed transcription.

One command, from the `analysis/` folder:

```bash
Rscript verify_against_expected.R
```

It runs the merge in all three settings and compares every output file with the reference,
printing PASS/FAIL per file (quoting differences are ignored). If anything fails, send me the
printed output.
