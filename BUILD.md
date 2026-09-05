# Building & running the OT professional-reasoning instrument

This repo now contains everything needed to **run** and **rebuild** the instrument.

## Layout

| File / dir | Role |
|---|---|
| `index_full.html` | The built, servable instrument. **Generated — do not edit by hand.** |
| `assemble.py` | The assembler. Reads the four source files below, applies its patches, and writes `index_full.html`. |
| `chunk2.html` | Upstream scaffolding source (head, jsPsych init, permission/fullscreen flow). Assembler input. |
| `harness.html` | Upstream engine source (OT reasoning engine + RTA replay controller). Assembler input. |
| `partC.js` | The main editable integration layer: mounts the engine as jsPsych trials, the RTA replay (mic + Whisper + re-anchor), **the speech-triggered auto-pause + pause instrumentation**, and the one-file export. Most changes happen here. |
| `clean_pg.js` | The simplified (mic-only) permission-gate snippet the assembler injects. |
| `setup_vad.sh` | One-time download of the self-hosted Silero VAD runtime into `js/vendor/vad/`. |
| `test_autopause.js` | Headless logic tests for the auto-pause module (`node test_autopause.js`). |
| `js/` | Served vendor assets: jsPsych core + plugins, `reanchor.js`. `js/vendor/vad/` is populated by `setup_vad.sh`. |

## Rebuild

```bash
python3 assemble.py          # writes index_full.html (+ blk_*.js, disposable syntax-check artifacts)
node test_autopause.js       # optional: verify the auto-pause logic (33 assertions)
```

`blk_0.js … blk_3.js` are throwaway files the assembler writes so each inline `<script>` can be
syntax-checked with `node --check`; they are not used at runtime and can be deleted or gitignored.

## Enable the Silero VAD (recommended)

```bash
bash setup_vad.sh            # downloads onnxruntime-web + @ricky0123/vad-web into js/vendor/vad/
```

Without it, speech-triggered auto-pause still works but falls back to the RMS **energy** detector
(cruder). The export's `rta_vad.primary_engine` reads `"silero"` when the neural VAD is active,
`"energy"` otherwise.

## Whisper (transcription)

Loads from a CDN at runtime, pinned to a fixed model revision (see the `MODEL_REVISION` constant in
the head). Nothing to install locally; each participant's browser fetches and caches it once.

## Tunable auto-pause parameters

All exposed as named `CONFIG.RTA_*` constants at the top of `partC.js` (confirm window, ring-buffer
cadence, onset back-date, energy gate, pause prompt, and the pre-replay announcement). Edit there,
then re-run `python3 assemble.py`.
