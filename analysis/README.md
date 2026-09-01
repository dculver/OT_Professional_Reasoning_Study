# Log merge → nCoder pipeline

`merge_logs_for_ncoder.R` combines the per-participant JSON session logs exported
by the instrument (schema `ot_prof_reasoning_v1`) into one tidy, long-format
dataset ready for **nCoder** code development and, afterward, **rENA/ONA**.

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
Participants upload their session `.json` to Qualtrics. When you're ready to analyze,
bulk-download those uploaded files out of Qualtrics into one folder (e.g. `analysis/logs/`).
That folder is the script's input.

### Option A — RStudio

1. Open `merge_logs_for_ncoder.R`.
2. **Session → Set Working Directory → To Source File Location** (puts you in `analysis/`).
3. **Test first:** click **Source**. With no changes it runs on `sample_logs/` and writes `out/`.
   The console prints the QA summary at the end.
4. **Confirm correctness:** compare `out/ncoder_corpus.csv` to `expected/ncoder_corpus.csv` — they should match.
5. **Real run:** put your participant `.json` files in a folder (e.g. `logs/`), then near the top change
   ```r
   IN_DIR  <- if (length(args) >= 1) args[[1]] else "sample_logs"
   ```
   replacing `"sample_logs"` with `"logs"` (or a full path). Click **Source** again. Output lands in `out/`.

### Option B — Terminal

The two words after the script are just *input folder* and *output folder* (no editing the file):
```bash
cd ~/Documents/GitHub/proof-of-concept/analysis
Rscript merge_logs_for_ncoder.R sample_logs out      # test on the samples
Rscript merge_logs_for_ncoder.R logs results         # real run: logs/ in, results/ out
```

It writes three files into the output folder:

| file | what it is |
|---|---|
| `ncoder_corpus.csv` | **import this into nCoder** — every row that has text (typed reasoning + spoken think-aloud), one line per unit |
| `ona_events_full.csv` | every row including the no-text structural moves (tab switches, selections, removals); the timeline for rENA/ONA |
| `qa_summary.csv` | per participant × case counts; **`rta_empty_FLAG = TRUE` means that case's think-aloud did not transcribe** (blocked/failed Whisper) — check these before analysis |

## What counts as a line (the agreed design)

- **Stream 1 is event-centric.** One row per `event_log` entry, in task-time order.
  Text-bearing events carry their typed text: `occupation_add` → the occupation
  name, `classify` → the mechanism (with the highlighted `excerpt`, `source`,
  `aspect`, and support/barrier `type` kept as metadata columns), `desired_outcome_add`
  → the outcome text, `synthesis_revision` → the impression text, `plan_edit` → the
  plan free-text. No-text moves (`tab_switch`, `entry_remove`, `barrier_select`,
  `occupation_remove`, `desired_outcome_remove`, `desired_outcome_tag`) stay as rows
  with empty text — they're real moves in the ONA but aren't text-coded.
- **Stream 2 is the re-anchored RTA** think-aloud, on the *same* case-relative
  millisecond clock, so spoken and typed reasoning interleave in true task order.
- **Sentence splitting:** the clinical impression (every settled revision) and the
  plan free-text are split into sentences — one coded line per sentence, each tagged
  with its source event `kind` and time. Everything else is one line per event; RTA
  uses Whisper's phrase-level chunks as they come.
- The **practice case** (`analyzed: false`) is excluded automatically.

## Columns

`participant_id, group, year_in_program, case_id, case_name, line_index, time_ms,
session_offset_ms, stream, kind, has_text, segment_index, text, occupation, source,
excerpt, aspect, otpf_type, barrier_on, paused`

- `time_ms` — case-relative ms (orders the timeline within a case).
- `session_offset_ms` — ms from session start (orders across cases).
- `stream` — `action` or `rta`. `kind` — the event kind, or `rta_utterance`.
- For nCoder: use **`text`** as the coded column; keep `participant_id` as the unit
  and `case_id` as the conversation. Add your code columns as you develop them.
- For rENA afterward: same frame — units = `participant_id`, conversation =
  `case_id` (or participant × case), codes = the columns nCoder produces, and
  `group` / `year_in_program` are your comparison metadata.

## Verify the parse on your machine

Because R could not be executed where this was written, the expected output was
produced by an independent reference implementation and is included under
`expected/`. On your first run:

```bash
Rscript merge_logs_for_ncoder.R sample_logs out
# then compare (values should match; ignore trailing-newline/quoting cosmetics):
diff <(sort out/ncoder_corpus.csv) <(sort expected/ncoder_corpus.csv)
diff <(sort out/qa_summary.csv)    <(sort expected/qa_summary.csv)
```

If they match, the script is behaving as designed on your R version. The sample
set includes one participant whose second case has **no** RTA, so you can see the
`rta_empty_FLAG` fire in `qa_summary.csv`.

## Known limitation to be aware of

Intervention-plan free-text is only stored in its **final** form in the log (each
`plan_edit` event records the field and length, not the intermediate text). So a
plan field appears once, at the time of its last edit, with its final text. The
clinical impression is different — every settled revision is captured with its own
timestamp, so the impression's evolution is preserved. If you want the plan's
editing trajectory too, that's a small change to the instrument's capture, not the
R — tell me and I'll add it.
