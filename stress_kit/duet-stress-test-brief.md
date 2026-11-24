# Stress-test brief: OT professional-reasoning study tool

You are stress-testing a browser-based research tool before real participants use it. Your job is to try hard to break it, the way a rushed, distracted, or unusual participant might, and to report clearly what happened. You are not a participant, and nothing you enter is research data.

Work in your own browser. Report in the format in section 8. When something is ambiguous, note it and keep going; do not stop to ask.

---

## 1. Ground rules (read first)

1. **Use only test IDs.** Every link you open must use a `sub_id` that starts with `DUETTEST_` (see section 2). Never invent an ID that looks like a real participant's.
2. **Never upload anything to the survey.** At the end, and on the "Save your progress" screen, the tool links to a Qualtrics survey. If you land on that survey, do not upload a file, answer questions, or submit. Close it and note that you reached it.
3. **Do not contact anyone, send messages, or make purchases.** This task needs only the study website.
4. **Do not edit code or files** in any repository. Test the website only.
5. **Record exact steps.** For every problem, write the steps so someone else can reproduce it.
6. **Downloaded files are evidence.** If your browser can download files, keep every session file the tool gives you and list them in your report with the `sub_id` they belong to. If you cannot download files, say so once and continue.

---

## 2. Setup

**Study URL:** `{{STUDY_URL}}`  *(Dennis fills this in before handing over the brief.)*

Build each test link by adding parameters:

```
{{STUDY_URL}}?sub_id=DUETTEST_<scenario>_<run>&group=<1 or 2>&year=<1, 2 or 3>&test_nomic=1
```

- **`&test_nomic=1` is test mode for browsers without a microphone.** It skips the microphone step, and every think-aloud then runs without recording: **Record** stays disabled and each item is answered with **Nothing to add**. A red "TEST MODE" label appears in the top-left corner. Use it on every link except the first check in section 4.

- `group=1` means student, `group=2` means faculty or practitioner. Alternate between them across runs.
- `year` is the student's year in the program (1 to 3). For faculty runs use `year=1`; it is ignored.
- Use a new `sub_id` for every fresh run, e.g. `DUETTEST_A_01`, `DUETTEST_A_02`. **Reuse the same `sub_id` only when a scenario tells you to** (the resume tests depend on it).
- Optional: add `&dev=1` to show a small diagnostics panel (bottom corner) with a button that downloads everything recorded so far. Use it in scenarios that say so. Real participants never see it.

**Time budget.** One complete run (practice + two cases + their think-alouds) takes roughly 45 to 90 minutes. The think-aloud after each case replays the whole case in segments, so it takes at least as long as the case itself.

---

## 3. What a participant goes through (normal behavior)

Use this to judge what is "expected."

1. **Full screen.** A button puts the browser in full screen. Leaving full screen during a case shows a prompt to return.
2. **Browser check** (automatic).
3. **Microphone access.** The tool asks for microphone permission. A microphone is required.
4. **Speech model download.** A speech-to-text model downloads once (can take a few minutes; a small status chip shows progress).
5. **Practice case (Patricia)**, with on-screen coaching. Not analyzed.
6. **Practice think-aloud.** It shows only the first 3 items, and at least one must be recorded: "Nothing to add" is blocked on the last item until then. If you cannot speak, see section 4.
7. **Case 1 (Florence)**, then its **think-aloud**.
8. **"Save your progress" screen**: download a progress file, then continue.
9. **Case 2 (Yvonne)**, then its **think-aloud**.
10. **Final screen**: download the session file; the tool then redirects to the survey (see rule 2).

**In each case** the screen has five panels:
- **Case material**, with Occupational Profile / Initial Evaluation tabs.
- **Occupations**: add a name and description.
- **Occupational performance analysis**: highlight text in the case material, choose Support or Barrier, write the mechanism, and tick one or more occupations.
- **Synthesis**: the clinical impression and desired outcomes.
- **Intervention plan**: select barriers, then approach / method / grading per barrier, prioritization, goal, and immediate attention.

Every text field must be filled before **Submit case and continue** works.

**In each think-aloud:**
- A list of the participant's actions and long pauses (20 s or more with no input) appears on the right.
- Each item replays that stretch of the case. When the clip ends, **Record** and **Nothing to add** unlock.
- Items must be answered **in order**. Later items are locked; earlier ones can be re-watched but not added to. One exception: right after choosing **Nothing to add**, you may go back to that item and record instead, until you answer the next one.
- **Finish think-aloud** unlocks only when every item has a response.

---

## 4. First check: the microphone (do this before anything else)

Open `{{STUDY_URL}}?sub_id=DUETTEST_MIC_01&group=1&year=1` (**without** `&test_nomic=1`), click through full screen and the browser check, and reach the microphone step.

- If you can allow the microphone and continue: note this, then proceed to section 5.
- If you see **"No microphone found"** or **"Access was blocked"** and cannot get past it: report the exact message and what you tried (allowing permission, Try again). This is expected if your browser has no microphone. Then **run every scenario in section 5 with `&test_nomic=1`** and check that the microphone step is skipped, the TEST MODE label shows, and **Record** stays disabled in every think-aloud.

If you get past the microphone step but have no way to speak, answer think-aloud items with **Nothing to add**, or press **Record**, stay silent a few seconds, then **Done**. Silent recordings are expected to trigger an "I did not hear anything" message. In the practice think-aloud, one recording is required; after two silent recordings the requirement is lifted and **Nothing to add** becomes available. Check that this happens.

---

## 5. Scenarios

Run them in order. Each lists what to do and what to check. Mark every check as PASS, FAIL, or COULD NOT TEST.

### A. Complete run, careful participant (`DUETTEST_A_01`, group=2)
Do everything properly: three or more occupations, six or more support/barrier classifications (at least one linked to two occupations), a three-sentence impression, two desired outcomes, and a full plan for two barriers. Then complete every think-aloud, download the progress file and the final file.

Check:
- Each screen appears in the order in section 3.
- Nothing you entered disappears.
- Both files download.
- The final redirect happens.
- Note how long each part took.

### B. Complete run, rushed participant (`DUETTEST_B_01`, group=1, year=1)
Do the minimum that the tool accepts: one occupation, one classification, short one-word answers everywhere. Then **Nothing to add** for every think-aloud item.

Check:
- The tool enforces required fields.
- Error messages are clear.
- Nothing lets you skip a step.

### C. Interruptions and resume (`DUETTEST_C_01`, same `sub_id` throughout)
1. Partway through Case 1, **reload the page**. Reopen the same link if needed.
   - Check: a "Welcome back" message appears, and your Case 1 work is restored exactly.
2. Partway through Case 1's think-aloud, **close the tab**, wait two minutes, then **open the same link** again.
   - Check: your earlier think-aloud responses are kept, and you resume at the next unanswered item.
3. On the "Save your progress" screen, **reload**.
   - Check: you are not sent back into Case 1.
4. Finish the study. Then **open the same link again**.
   - Report what a finished participant sees.

### D. Full screen, tabs, and window size (`DUETTEST_D_01`)
- During a case, press **Esc** to leave full screen.
  - Check: a prompt to return appears, and you can return.
- Switch to another tab for 30 s and come back.
  - Check: nothing is lost.
- If you can change the window size, try a small window (about 1280×720) and a large one.
  - Check: every panel and button stays usable without scrolling the page.
  - Check: the classify popup never extends past the window edge. Highlight text near the bottom of the case material to test this.

### E. Input abuse (`DUETTEST_E_01`)
Try each and note what happens:
- A 1,000+ character mechanism.
- A very long impression (10+ paragraphs).
- Text containing quotes, apostrophes, `<b>bold</b>`, `<script>alert(1)</script>`, emoji, accented letters, and line breaks.
  - Check: it shows as plain text and never runs or changes formatting.
- Pasting text, as opposed to typing it.
- 20+ occupations.
- 40+ classifications.
- Removing an occupation that has classifications linked to it.
  - Check: the linked entries update sensibly.
- Unselecting a barrier that already has plan text.
- Highlighting the same text twice; highlighting text across a paragraph break.
- Opening the classify popup and then clicking elsewhere without finishing.
- Double-clicking buttons quickly: Add, Submit, Record, Done, Nothing to add.
- Being completely idle for 60 s mid-case.
  - Check: this later appears as a "pause with no activity" item in the think-aloud.

### F. Think-aloud rules (`DUETTEST_F_01`, `&dev=1`)
- Try to open a later, locked item.
  - Check: it does not open, and a note explains why.
- Answer item 1 with **Nothing to add**, then click item 1 again before answering item 2.
  - Check: **Record** is available for item 1 (the one allowed correction).
- After answering item 2, go back to item 1.
  - Check: it replays, but you cannot add to it.
- Try **Finish** before all items are answered.
  - Check: it is disabled.
- Press **Pause / Play / Replay** during clips.
  - Check: the clip behaves sensibly and responses unlock only after a clip has played to its end.
- Use the dev panel's download button midway.
  - Check: a file downloads.

### G. Odd links (fresh IDs each)
- The study URL with **no `sub_id` at all**.
- `sub_id=DUETTEST_G_01` opened in **two tabs at once**: work in both and report what happens.
- A missing `group` or `year`.

Report how far each one gets and anything confusing.

### H. Long session (`DUETTEST_H_01`)
Work in Case 1 for 45+ minutes, steadily adding and editing content (aim for 60+ actions).

Check:
- Typing and clicking stay responsive.
- The think-aloud list builds without long delays.
- Report any slowdowns with timestamps.

### I. Clarity (throughout)
Note any wording that is unclear, any moment you were unsure what to do next, and anything a participant might misread. Quote the exact on-screen text.

---

## 6. Checking downloaded files (if you can open them)

Each session file is JSON. For each one, report:

- `schema` is `ot_prof_reasoning_v2`; `export_kind` is `final` or `checkpoint`; `study_id` matches your `sub_id`.
- `cases` lists `practice`, `1`, and `2` (a checkpoint has Case 2 missing or marked in progress).
- For Cases 1 and 2:
  - `task.event_log` has entries for what you did, with increasing `t` values.
  - Every item in `rta_items` has a `response` of `recorded` or `nothing_to_add`.
- `session.resumes` lists each time you resumed (scenario C should show at least two).
- Nothing you typed is missing or altered (spot-check three entries).
- File size, so very large files stand out.

---

## 7. Not bugs (expected behavior)

- No microphone in your browser: the tool blocks at the microphone step without `&test_nomic=1` (section 4).
- In test mode, **Record** is always disabled and the practice does not require a recording.
- Transcripts show placeholder or empty text, or the status is not "done", when you never spoke.
- The speech model takes several minutes to download the first time.
- The tool asks for full screen and warns when you leave it.
- The final screen redirects to a survey (follow rule 2).
- Practice-case think-aloud recordings are not transcribed.

If you are unsure whether something is a bug, report it and mark it "unsure."

---

## 8. Report format

Start with a short summary:

```
Runs completed: <n> of <n>   |   Browser: <name/version if known>   |   Window size: <if known>
Microphone step: passed / blocked (message: "...")
Blockers found: <n>   Major: <n>   Minor: <n>   Cosmetic: <n>   Unsure: <n>
```

Then a table of scenario checks:

| Scenario | Check | Result (PASS / FAIL / COULD NOT TEST) | Note |
|---|---|---|---|

Then one entry per problem:

```
### [Severity] Short title
- sub_id / scenario:
- Steps to reproduce:
  1.
  2.
- Expected:
- Actual (quote any on-screen text exactly):
- Data affected? (lost / wrong / none / unknown)
- Time observed:
```

**Severity:**
- **Blocker**: a participant could not continue, or data was lost.
- **Major**: wrong or missing data, or a participant would likely get stuck or confused.
- **Minor**: works, but awkward.
- **Cosmetic**: appearance only.

Finish with:
- a list of downloaded files and their `sub_id`s;
- the clarity notes from scenario I;
- anything you could not test, and why.
