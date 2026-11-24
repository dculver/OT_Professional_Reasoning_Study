# Stress kit: automated participants with real speech

This kit runs complete simulated participants through the study tool on your Mac. Each one works the practice and both cases, "speaks" real audio into a simulated microphone during every think-aloud, uses the **real** speech model, and downloads the final session file. The kit then checks the file and writes a report covering:

- whether the participant finished, and whether every think-aloud item and every recording is complete;
- **transcription accuracy**: the kit knows exactly what was said for each recording, so it scores each transcript (word error rate) and checks clinical terms like "arthroplasty" and "edema";
- **transcription speed** on your Mac, with a projection for slower laptops;
- memory, browser storage, autosave freezes, transcription backlog, and file size.

Nothing in the study tool is changed. The microphone is simulated only inside the test browser the kit controls.

## One-time setup (about 10 minutes)

1. **Install Node.js** (the "LTS" version) from https://nodejs.org if `node -v` in Terminal doesn't print a version.
2. In **Terminal**, go to this folder and install the test browser:
   ```
   cd ~/Documents/GitHub/proof-of-concept/stress_kit
   npm install
   npx playwright install chromium
   ```

## Make the speech clips

```
./make_clips.sh
```

This creates 15 clips from `clips/script.txt` using the Mac's built-in voice. The script lines are think-aloud-style sentences with OT vocabulary. Edit `clips/script.txt` to change them.

**Strongly recommended: add your own voice.** A synthetic voice is clearer than a real person, so it makes the speech model look better than it will be with participants.

- Record 10 or more clips with **Voice Memos** or **QuickTime**: talk like a think-aloud participant, 10 to 60 seconds each, natural pauses included.
- Put the audio files in `clips/own/`.
- Next to each one, add a `.txt` file **with the same name** containing exactly what you said, for example `own/clip01.m4a` and `own/clip01.txt`.
- Run `./make_clips.sh` again. Your clips are mixed in with the synthetic ones.

`clips/terms.txt` lists the clinical terms the report checks. Add any you care about.

## Run it

Quick check first (one participant, shorter cases, about 20 to 30 minutes; the first run also downloads the speech model):

```
node soak.js --participants 1 --actions 20
```

Overnight soak (keeps the Mac awake; several hours):

```
caffeinate -i node soak.js --participants 5 --actions 60
```

| Option | Default | Meaning |
|---|---|---|
| `--participants N` | 1 | how many simulated participants, one after another |
| `--actions N` | 40 | roughly how many actions per case (60+ is a long, realistic session) |
| `--record-ratio R` | 0.6 | share of think-aloud items answered with a recording (the rest get "Nothing to add") |
| `--audio-export` | off | also test audio export (`&export_audio=1`) |
| `--url <link>` | this repo | test the live site instead, e.g. your GitHub Pages `index_full.html` |
| `--headed` | off | show the browser so you can watch |
| `--clips <folder>` | `clips` | use a different clip folder |

By default the kit serves the files in this repo, so it tests your latest local version. Use `--url` to test exactly what participants will get.

## Read the results

Everything goes to `soak_out/<date-time>/`:

- `report.md`: verdict, transcription accuracy and speed, per-participant checks, and the worst transcriptions side by side with what was said;
- `metrics_<participant>.csv`: memory, storage, transcription queue, and save timing every 15 seconds;
- the downloaded session files (`_checkpoint.json`, `_final.json`), which you can also run through the merge script;
- `<participant>_failure.png`: a screenshot if a participant got stuck;
- `log.txt`: the run log.

The kit exits with an error code if any check failed.

**What to look for:**

- **Verdict**: every check should pass.
- **Word error rate**: lower is better (0.10 means about 1 word in 10 is wrong). Compare your own voice against the synthetic one. Look at the "worst transcriptions" table for clinical terms the model mangles.
- **Processing speed (rtf)**: this is processing time divided by audio length. The report estimates how much slower than your Mac a participant's laptop can be before transcription falls behind. If that number is small (under about 3), the speech model may be too slow for older student laptops, and audio export becomes essential as a backup.

## What it does not test

- real microphones, rooms, and voices other than your clips;
- Safari, Firefox, and Edge (the kit uses Chromium; test those by hand);
- genuinely slow laptops (use the projection, then confirm on the oldest laptop you can borrow);
- campus networks (open the live link on Drake and DMU Wi-Fi and confirm the speech model downloads).

Test sessions use IDs starting with `SOAKTEST_`. The kit blocks every connection to Qualtrics, so test sessions can never reach or upload to the survey.
