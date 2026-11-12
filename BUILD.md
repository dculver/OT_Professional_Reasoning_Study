# Building & running the OT professional-reasoning instrument

This repo contains everything needed to **run** and **rebuild** the instrument.

## Layout

| File / dir | Role |
|---|---|
| `index_full.html` | The built, servable instrument. **Generated — do not edit by hand.** |
| `assemble.py` | The assembler. Reads the four source files below, applies its patches, and writes `index_full.html`. |
| `chunk2.html` | Upstream scaffolding source (head, jsPsych init, permission/fullscreen flow). Assembler input. Read-only. |
| `harness.html` | Upstream engine source (OT reasoning engine). Assembler input. Read-only; change it only through `assemble.py` patches. |
| `partC.js` | The main editable integration layer: mounts the engine as jsPsych trials, the **segmented think-aloud** after each case (action list, clip player, recording, background transcription queue), autosave/resume, the checkpoint file, and the export (schema `ot_prof_reasoning_v2`). Most changes happen here. |
| `clean_pg.js` | The simplified (mic-only) permission-gate snippet the assembler injects. |
| `test_thinkaloud.js` | Headless tests for the think-aloud item builder (`node test_thinkaloud.js`). |
| `js/` | Served vendor assets: jsPsych core + plugins, `reanchor.js`. |

Superseded and safe to delete: `test_autopause.js` (tested the removed auto-pause), `setup_vad.sh` and `js/vendor/vad/` (the Silero VAD is no longer loaded).

## Rebuild

```bash
python3 assemble.py          # writes index_full.html (+ blk_*.js, disposable syntax-check artifacts)
for f in blk_*.js; do node --check "$f"; done
node test_thinkaloud.js      # think-aloud item builder (35 assertions)
```

`blk_0.js … blk_3.js` are throwaway files for `node --check`; gitignore them.

## Whisper (transcription)

Loads from a CDN at runtime (transformers.js @2.17.2, `Xenova/whisper-small.en` pinned to a fixed revision). Each think-aloud recording is transcribed separately in a background queue; status and timing per recording are in the export.

## Tunable parameters

`CONFIG.TA_*` and `CONFIG.RTA_SILENCE_MS` at the top of `partC.js` (pause threshold, included action kinds, silence reminder, mic thresholds, audio export, timeouts) and all participant-facing think-aloud text (`CONFIG.TA_TEXT`). `MECH_MAXLEN` (mechanism field length) is in `assemble.py`. Edit, then re-run `python3 assemble.py`.

## Diagnostics

Add `&dev=1` to the launch URL to show a small status panel (transcription queue, last save) with a "download data so far" button. Never give participants a `dev=1` link.
