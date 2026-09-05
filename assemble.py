import io, re, sys
chunk2 = io.open("chunk2.html", encoding="utf-8").read()
harness = io.open("harness.html", encoding="utf-8").read()
partC = io.open("partC.js", encoding="utf-8").read()

# ---------- HEAD (from chunk2) ----------
head = chunk2[chunk2.index("<head>"):chunk2.index("</head>")]
# ---- Whisper: load the transformers.js runtime + model weights from the CDN
#      (jsDelivr for the library, pinned @2.17.2; Hugging Face for the
#      whisper-small.en weights). This is the chunk2 default, so NO localization
#      patch is applied -- each participant's browser fetches the model once and
#      caches it. setup_whisper.sh stays in the repo as an optional self-host
#      fallback but is not required. The assert below just guards that the CDN
#      import is still present in the source. ----
assert "      import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';\n      env.allowLocalModels = false;\n      let transcriber = null, MODEL = 'Xenova/whisper-small.en';" in head
# ---- Pin the Hugging Face model to a specific revision (commit hash) so the
#      whisper-small.en weights cannot change under the study during collection.
#      Hash = current main of Xenova/whisper-small.en as of 2025-12-16. ----
assert "      let transcriber = null, MODEL = 'Xenova/whisper-small.en';" in head
head = head.replace(
  "      let transcriber = null, MODEL = 'Xenova/whisper-small.en';",
  "      let transcriber = null, MODEL = 'Xenova/whisper-small.en', MODEL_REVISION = 'fa16a75f5d91e83ecb6a2ccb690f14d91ef00ca4';")
assert "            transcriber = await pipeline('automatic-speech-recognition', MODEL, {\n              progress_callback:" in head
head = head.replace(
  "            transcriber = await pipeline('automatic-speech-recognition', MODEL, {\n              progress_callback:",
  "            transcriber = await pipeline('automatic-speech-recognition', MODEL, {\n              revision: MODEL_REVISION,\n              progress_callback:")
assert "            if (!transcriber) transcriber = await pipeline('automatic-speech-recognition', MODEL);" in head
head = head.replace(
  "            if (!transcriber) transcriber = await pipeline('automatic-speech-recognition', MODEL);",
  "            if (!transcriber) transcriber = await pipeline('automatic-speech-recognition', MODEL, { revision: MODEL_REVISION });")
# patch worker: request timestamps + return chunks
assert "chunk_length_s: 30, stride_length_s: 5 });" in head
head = head.replace("chunk_length_s: 30, stride_length_s: 5 });",
                    "chunk_length_s: 30, stride_length_s: 5, return_timestamps: true });")
assert "self.postMessage({ type:'result', text: out && out.text ? out.text : '' });" in head
head = head.replace("self.postMessage({ type:'result', text: out && out.text ? out.text : '' });",
                    "self.postMessage({ type:'result', text: out && out.text ? out.text : '', chunks: out && out.chunks ? out.chunks : [] });")
assert "else if (type === 'error') console.error('Whisper worker error:', e.data.message);" in head
head = head.replace("else if (type === 'error') console.error('Whisper worker error:', e.data.message);",
                    "else if (type === 'error') { console.error('Whisper worker error:', e.data.message); if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('error'); if (typeof window!=='undefined' && window.__onWhisperError) window.__onWhisperError(e.data); }\n        else if (type === 'result') { if (typeof window!=='undefined' && window.__onWhisperResult) window.__onWhisperResult(e.data); }")
assert "__whisperWorker.onerror = (e) => console.error('Whisper worker onerror:', e);" in head
head = head.replace("__whisperWorker.onerror = (e) => console.error('Whisper worker onerror:', e);",
                    "__whisperWorker.onerror = (e) => { console.error('Whisper worker onerror:', e); if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('error'); if (typeof window!=='undefined' && window.__onWhisperError) window.__onWhisperError({ message: (e && e.message) || 'worker error' }); };")
# progress/ready -> status chip
assert "        if (type === 'progress') __modelProgress = progress || 0;\n        else if (type === 'ready') __workerReady = true;" in head
head = head.replace("        if (type === 'progress') __modelProgress = progress || 0;\n        else if (type === 'ready') __workerReady = true;",
                    "        if (type === 'progress') { __modelProgress = progress || 0; if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('downloading',{progress:__modelProgress}); }\n        else if (type === 'ready') { __workerReady = true; if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('ready'); }")
# init status when the worker starts
assert "function initWhisperWorker() {\n      if (__whisperWorker) return;" in head
head = head.replace("function initWhisperWorker() {\n      if (__whisperWorker) return;",
                    "function initWhisperWorker() {\n      if (__whisperWorker) return;\n      if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('init');")
# ---- Speech-model status chip: a small, honest indicator of whether Whisper is
#      actually loading / ready / transcribing / failed, so an empty transcript is
#      never a silent surprise. Driven by the worker messages above + transcribeAudio.
_CHIP = r'''
    window.__whisperUI = { state:'idle', progress:0, compact:false };
    window.setWhisperStatus = function(state, detail){
      var w = window.__whisperUI; w.state = state;
      if (detail && detail.progress != null) w.progress = detail.progress;
      w.compact = false;
      if (state === 'ready') { clearTimeout(w._c); w._c = setTimeout(function(){ w.compact = true; window.__renderWhisperChip(); }, 5000); }
      if (state === 'transcribed' || state === 'empty') { clearTimeout(w._r); w._r = setTimeout(function(){ window.setWhisperStatus('ready'); }, 6000); }
      window.__renderWhisperChip();
    };
    window.__renderWhisperChip = function(){
      if (!document.body) return;
      var w = window.__whisperUI, st = w.state;
      if (st === 'idle') { var ex=document.getElementById('whisper_status'); if(ex) ex.remove(); return; }
      var el = document.getElementById('whisper_status');
      if (!el) { el = document.createElement('div'); el.id = 'whisper_status';
        el.style.cssText = 'position:fixed;top:10px;right:12px;z-index:10009;font:600 12px system-ui;padding:5px 10px;border-radius:999px;display:flex;align-items:center;gap:6px;box-shadow:0 1px 6px rgba(0,0,0,.15);pointer-events:none;transition:opacity .3s';
        document.body.appendChild(el); }
      var M = { init:['#4b5563','#f3f4f6','Preparing speech model…'],
                downloading:['#92400e','#fef3c7','Loading speech model… '+Math.round(w.progress||0)+'%'],
                ready:['#166534','#dcfce7','Speech model ready'],
                transcribing:['#1e40af','#dbeafe','Transcribing your narration…'],
                transcribed:['#166534','#dcfce7','Narration transcribed'],
                empty:['#92400e','#fef3c7','No speech detected'],
                error:['#991b1b','#fee2e2','Speech model unavailable'] };
      var m = M[st] || M.init;
      el.style.color = m[0]; el.style.background = m[1];
      var dot = '<span style="width:8px;height:8px;border-radius:50%;background:'+m[0]+';display:inline-block;flex:0 0 auto"></span>';
      el.innerHTML = (w.compact && st==='ready') ? dot : dot + '<span>'+m[2]+'</span>';
    };
'''
assert "function warmUpTranscriber() { initWhisperWorker(); }" in head
head = head.replace("function warmUpTranscriber() { initWhisperWorker(); }",
                    "function warmUpTranscriber() { initWhisperWorker(); }\n" + _CHIP)
# occupation description field styling (name input + description textarea stack;
# description shown under the name on each occupation card)
head = head + ('  <style>\n'
  '  .occ-add{flex-wrap:wrap}\n'
  '  #occ_desc{flex:1 1 100%;min-width:0;box-sizing:border-box;resize:vertical;'
  'font-family:inherit;font-size:13px;line-height:1.45;padding:8px 11px;'
  'border:1px solid var(--line);border-radius:7px}\n'
  '  #occ_desc:focus{outline:none;border-color:var(--occ)}\n'
  '  .occ-card{flex-wrap:wrap}\n'
  '  .occ-card .occ-desc{flex:1 1 100%;font-size:12px;color:var(--occ-ink);'
  'opacity:.85;line-height:1.45;margin-top:4px}\n'
  '  </style>\n')
# load the canonical re-anchor module
head = head + '  <script src="js/reanchor.js"></script>\n'
# Silero VAD (self-hosted): onnxruntime-web then the @ricky0123/vad-web bundle, which
# expose window.ort and window.vad. Populated by setup_vad.sh into js/vendor/vad/.
# If these 404 (setup not run), window.vad is undefined and the replay silence-net
# falls back to the energy gate -- the study still runs.
head = head + '  <script src="js/vendor/vad/ort.min.js"></script>\n'
head = head + '  <script src="js/vendor/vad/bundle.min.js"></script>\n'
for _s in ['  <script src="js/webgazer.js"></script>\n',
           '  <script src="js/extension-webgazer.js"></script>\n',
           '  <script src="js/plugin-webgazer-init-camera.js"></script>\n',
           '  <script src="js/plugin-webgazer-init-calibrate.js"></script>\n',
           '  <script src="js/plugin-webgazer-validate.js"></script>\n',
           '  <script src="js/plugin-virtual-chinrest.js"></script>\n']:
    assert _s in head, "head tag missing: "+_s
    head = head.replace(_s, "", 1)
print("head webgazer/chinrest tags removed")
assert '    /* Calibration/validation dot styling (from original) */\n    .jspsych-webgazer-calibrate-point,.jspsych-webgazer-validate-point,\n    .calibration-point,.validation-point,\n    div[id^="calibration-point"],div[id^="validation-point"],#webgazerGazeDot { z-index: 2147483000 !important; }\n' in head, "calibration CSS block not found"
head = head.replace('    /* Calibration/validation dot styling (from original) */\n    .jspsych-webgazer-calibrate-point,.jspsych-webgazer-validate-point,\n    .calibration-point,.validation-point,\n    div[id^="calibration-point"],div[id^="validation-point"],#webgazerGazeDot { z-index: 2147483000 !important; }\n', "", 1)
print("head calibration CSS removed")
for _t in ['  <script src="js/plugin-survey-text.js"></script>\n',
           '  <script src="js/plugin-preload.js"></script>\n',
           '  <script src="js/plugin-call-function.js"></script>\n']:
    assert _t in head, "unused plugin tag missing: "+_t
    head = head.replace(_t, "", 1)
assert '    /* Session-level stream-ended banner (never auto-advances) */\n    #session_stream_warn {\n      position: fixed; inset: 0; z-index: 2147483600; background: rgba(20,30,40,.94);\n      color: #fff; display: flex; align-items: center; justify-content: center; text-align: left;\n    }\n    #session_stream_warn .box { max-width: 620px; padding: 0 24px; }\n    #session_stream_warn h2 { color: #ffb4a2; margin: 0 0 14px; }\n    #session_stream_warn p { font-size: 16px; line-height: 1.7; }\n    #session_stream_warn button {\n      margin-top: 18px; padding: 12px 26px; background: #1e8e4e; color: #fff; border: none;\n      border-radius: 6px; font-weight: 700; font-size: 15px; cursor: pointer;\n    }\n' in head, "session_stream_warn CSS not found"
head = head.replace('    /* Session-level stream-ended banner (never auto-advances) */\n    #session_stream_warn {\n      position: fixed; inset: 0; z-index: 2147483600; background: rgba(20,30,40,.94);\n      color: #fff; display: flex; align-items: center; justify-content: center; text-align: left;\n    }\n    #session_stream_warn .box { max-width: 620px; padding: 0 24px; }\n    #session_stream_warn h2 { color: #ffb4a2; margin: 0 0 14px; }\n    #session_stream_warn p { font-size: 16px; line-height: 1.7; }\n    #session_stream_warn button {\n      margin-top: 18px; padding: 12px 26px; background: #1e8e4e; color: #fff; border: none;\n      border-radius: 6px; font-weight: 700; font-size: 15px; cursor: pointer;\n    }\n', "", 1)
print("head: unused plugins + dead CSS removed")
assert "display:flex;flex-direction:column;overflow:hidden;z-index:1}" in head, "#ot_mount rule not found"
head = head.replace("display:flex;flex-direction:column;overflow:hidden;z-index:1}",
                    "display:flex;flex-direction:column;overflow:hidden;z-index:1;text-align:left}", 1)
print("head: #ot_mount forced text-align:left")

# ---------- PART A (chunk2 scaffolding) ----------
head_end = chunk2.index("</head>")
a_start = chunk2.index("<script>", head_end) + len("<script>")
cut = chunk2.index("/* =====================================================================\n   OT REASONING ENGINE")
partA = chunk2[a_start:cut]
# clean the init on_finish (terminal screen is the export trial)
partA = re.sub(r"var jsPsych = initJsPsych\(\{[\s\S]*?\n\}\);",
    "var jsPsych = initJsPsych({\n  extensions: [{ type: jsPsychExtensionWebgazer }],\n  on_finish: function () { /* terminal screen is the Chunk 4 export trial */ }\n});",
    partA, count=1)
assert "initJsPsych" in partA and "Chunk 4 export trial" in partA

# ---- remove screen recording (replay is reconstructed from recon; no video) ----
def _rm(x, needle, repl="", n=1):
    assert needle in x, "SR-anchor missing: "+needle[:70]
    return x.replace(needle, repl, n)
partA = _rm(partA, '  if (!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function")) missing.push("screen recording (getDisplayMedia)");\n', "")
partA = _rm(partA, "   browsers lacking getDisplayMedia / getUserMedia / WebM MediaRecorder /", "   browsers lacking getUserMedia / WebM MediaRecorder /")
partA = _rm(partA, "The study uses tab-level screen recording and local speech processing that are not supported in ${reason}.",
                   "The study uses local speech processing and eye tracking that are not supported in ${reason}.")
partA = _rm(partA,
  '  recording_started_at: null,      // ms epoch when the session recording began (RTA clock anchor)\n  recording_viewport: null,        // viewport captured right after share+fullscreen settle\n',
  '  session_started_at_ms: null,     // ms epoch session clock anchor (set at fullscreen); RTA/case-offset zero\n  task_viewport: null,             // task viewport captured right after fullscreen settle\n')
i0 = partA.index('const caseMedia = {};'); i1 = partA.index('/* =====================================================================\n   PERMISSION GATE')
partA = partA[:i0] + partA[i1:]
j0 = partA.index('/* =====================================================================\n   SESSION-LEVEL STREAM-ENDED HANDLER'); j1 = partA.index('/* =====================================================================\n   GAZE SCORING HELPER')
partA = partA[:j0] + partA[j1:]
k0 = partA.index('/* 1 \u2014 \u2605 SCREEN SHARE FIRST'); k1 = partA.index('/* 2 \u2014 \u2605 FULLSCREEN')
partA = partA[:k0] + partA[k1:]
partA = _rm(partA, 'btn.disabled = true;\n      try { await document.documentElement.requestFullscreen(); }',
                   'btn.disabled = true; study.session_started_at_ms = Date.now();\n      try { await document.documentElement.requestFullscreen(); }')
partA = _rm(partA, 'study.recording_viewport = { w: vw, h: vh };   // definitive task viewport',
                   'study.task_viewport = { w: vw, h: vh };   // definitive task viewport')
for bad in ['getDisplayMedia','startScreenRecording','stopScreenRecording','attachStreamEndedHandler','recording_started_at','recording_viewport','session_screen_share']:
    assert bad not in partA, "remnant in partA: "+bad
print("partA screen-recording removal OK")

# ---- remove browser-family exclusion (capability-based gate only) ----
partA = _rm(partA,
  '''  let webmOK = false;
  if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
    webmOK = MediaRecorder.isTypeSupported("video/webm") ||
             MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ||
             MediaRecorder.isTypeSupported("video/webm;codecs=vp8");
  }
  if (!webmOK) missing.push("WebM video recording (MediaRecorder)");''',
  '''  const recOK = (typeof MediaRecorder !== "undefined");
  if (!recOK) missing.push("audio recording (MediaRecorder)");''')
partA = _rm(partA,
  '''    if (isMobile)       reason = "mobile browsers (this study must run on a desktop or laptop)";
    else if (isFirefox) reason = "Firefox, which does not support tab-level screen recording";
    else if (isSafari)  reason = "Safari, which does not support the required recording format";
    else                reason = "this browser, which is missing: " + missing.join(", ");''',
  '''    if (isMobile)       reason = "mobile browsers (this study must run on a desktop or laptop)";
    else                reason = "this browser, which is missing: " + missing.join(", ");''')
partA = _rm(partA,
  'This study requires a <strong>Chromium-based desktop browser</strong> such as Google Chrome, Microsoft Edge, Arc, Brave, or Vivaldi.',
  'This study runs in an up-to-date <strong>desktop web browser</strong> such as Chrome, Edge, Firefox, or Safari.')
assert "Chromium-based" not in partA and "webmOK" not in partA and "does not support tab-level screen recording" not in partA
print("partA browser-exclusion removal OK")

# ---- strip stale pivot comment (CONFIG / SESSION STATE header) ----
partA = _rm(partA,
  "   CONFIG / SESSION STATE\n   Experimental scaffolding removed per the pivot: no condition, no phase,\n   no persistent-identifier survey, no OSF/DataPipe. Save = Qualtrics upload.\n",
  "   CONFIG / SESSION STATE\n")
assert "Experimental scaffolding removed per the pivot" not in partA
print("partA stale-comment strip OK")

# ---- remove eye tracking (WebGazer + calibration) ----
partA = _rm(partA,
  "  /* Fullscreen viewport height at/above which gaze tracking is collected.\n     Below this, calibration is skipped and the session runs no-gaze (all\n     other data streams unaffected). Measured against AOI separability vs.\n     the WebGazer error envelope; see the methods chapter. */\n  GAZE_MIN_HEIGHT: 660,\n", "")
partA = _rm(partA,
  "  calibration: {},\n  calibration_viewport: null,\n  fullscreen_viewport: null,       // viewport measured right after programmatic fullscreen\n  gaze_enabled: true,              // set false when fullscreen height < GAZE_MIN_HEIGHT\n  gaze_skip_reason: null,\n  gaze_threshold_used: null,       // the height cutoff this session was judged against (self-documenting)\n  screen_geometry: {},\n", "")
# gazeQualityFromOffsets helper block
g0 = partA.index("/* =====================================================================\n   GAZE SCORING HELPER")
g1 = partA.index("/* =====================================================================\n   jsPsych INIT")
partA = partA[:g0] + partA[g1:]
# jsPsych extension
partA = _rm(partA, "  extensions: [{ type: jsPsychExtensionWebgazer }],\n", "")
# fullscreen step gaze lines
partA = _rm(partA, "        study.fullscreen_viewport = { w: vw, h: vh };\n", "")
partA = _rm(partA, "        study.gaze_threshold_used = CONFIG.GAZE_MIN_HEIGHT;\n", "")
partA = _rm(partA, "        study.gaze_enabled = vh >= CONFIG.GAZE_MIN_HEIGHT;\n", "")
partA = _rm(partA, '        study.gaze_skip_reason = study.gaze_enabled ? null : "viewport_height_below_threshold";\n', "")
# fullscreen comment: strip gaze/calibration references
partA = _rm(partA, "viewport (the definitive task viewport) and decide the gaze branch on it.\n   Calibration runs after this, so the calibration viewport == task viewport. */",
                   "viewport (the task viewport) and set the session clock anchor. */")
# participant-facing copy
partA = _rm(partA, "so the whole interface fits and the eye tracking stays accurate.", "so the whole interface fits.")
partA = _rm(partA, "The study uses local speech processing and eye tracking that are not supported in ${reason}.",
                   "The study uses local speech processing that is not supported in ${reason}.")
# chinrest + calibration consts + gaze branch trial
c0 = partA.index("/* Gaze steps as named consts, mounted inside the conditional block below. */")
c1 = partA.index("/* 6 \u2014 Whisper warmup")
partA = partA[:c0] + partA[c1:]
# sanity: no eye-tracking symbols remain
for bad in ["jsPsychExtensionWebgazer","jsPsychWebgazerInitCamera","jsPsychWebgazerCalibrate","jsPsychWebgazerValidate","jsPsychVirtualChinrest","GAZE_CHINREST","GAZE_CALIBRATION","gazeQualityFromOffsets","GAZE_MIN_HEIGHT","gazer","hinrest","calib",'permissionGate("camera")']:
    assert bad not in partA, "eye-tracking remnant in partA: "+bad
print("partA eye-tracking removal OK")
# activate the fullscreen guardian once fullscreen is entered (after gaze lines are gone)
partA = _rm(partA,
  'study.task_viewport = { w: vw, h: vh };   // definitive task viewport\n        jsPsych.finishTrial();',
  'study.task_viewport = { w: vw, h: vh };   // definitive task viewport\n        study.__fsActive = true; if(typeof installFullscreenGuardian==="function") installFullscreenGuardian();\n        jsPsych.finishTrial();')
print("partA fullscreen guardian activated")
partA = partA.replace("jsPsych INIT (WebGazer extension attached)", "jsPsych INIT", 1)
print("partA init comment cleaned")
partA = partA.replace("Short screens proceed and run\n   no-gaze instead of being turned away. Runs AFTER fullscreen, so it measures\n   the real task viewport.", "Short screens proceed rather than being turned away. Runs after fullscreen,\n   so it measures the real task viewport.", 1)
partA = partA.replace("the RTA needs audio regardless\n   of the gaze branch). Camera is requested later, only in the gaze branch. */", "the RTA needs audio). */", 1)
print("partA stale gaze comments cleaned")
partA = _rm(partA, "  SCREEN_FPS: 15,\n", "")
partA = _rm(partA, "  RTA_MAX_SECONDS: 240,\n", "")
PG = io.open("clean_pg.js", encoding="utf-8").read()
pg0 = partA.index("/* =====================================================================\n   PERMISSION GATE")
pg1 = partA.index("/* =====================================================================\n   jsPsych INIT")
partA = partA[:pg0] + PG + "\n" + partA[pg1:]
assert "permissionGate(kind)" in partA and "Webcam access" not in partA and "estimate where you are looking" not in partA, "permissionGate simplification failed"
print("partA: dead CONFIG removed + permissionGate is mic-only")


# ---------- PART B (harness engine) ----------
fl = harness.index("const FLORENCE = {")
b_close = harness.rindex("</script>")
partB = harness[fl:b_close]
# remove standalone chrome: btn_reset/btn_data handlers (up to the PRACTICE WALKTHROUGH comment)
btn0 = partB.index('document.getElementById("btn_reset").addEventListener')
btn1 = partB.index("/* =====================================================================\n   PRACTICE WALKTHROUGH")
partB = partB[:btn0] + partB[btn1:]
# remove standalone boot
partB = re.sub(r"attachCursorSampling\(\);\s*\n\s*loadCase\(PATRICIA\);", "", partB, count=1)
# remove auto-start
partB = re.sub(r"if \(window\.__RECON__\).*", "", partB, count=1)
# practice Continue -> submitCase (was alert + loadCase(FLORENCE))
before = partB
partB = re.sub(r"removeCoach\(\);\s*\n\s*alert\([\s\S]*?loadCase\(FLORENCE\);",
               "removeCoach(); submitCase();", partB, count=1)
assert partB != before, "practice-continue patch did not apply"
assert "btn_reset" not in partB and "loadCase(PATRICIA)" not in partB and "__RECON__" not in partB
# old reconstructState fold (+ orphaned boot comment) - controller uses reconstructStateAt
_r0 = partB.index("/* ---- RECONSTRUCTION: rebuild the exact state at time tMax")
_r1 = partB.index("/* ===== INJECTED: REPLAY ENGINE =====")
partB = partB[:_r0] + partB[_r1:]
# standalone case switcher: loadCase + renderSwitcher (+ their comment)
_l0 = partB.index("/* Per-case state:")
_l1 = partB.index("/* =====================================================================\n   PRACTICE WALKTHROUGH")
partB = partB[:_l0] + partB[_l1:]
# dead standalone case-registry vars
partB = partB.replace("const CASE_LIST = [PATRICIA, FLORENCE, YVONNE];\n", "", 1)
partB = partB.replace("const stateByCase = {};\n", "", 1)
for _bad in ["function reconstructState(", "function loadCase(", "function renderSwitcher(", "CASE_LIST", "stateByCase", "_replayTab"]:
    assert _bad not in partB, "dead engine remnant in partB: "+_bad
print("partB: dead standalone engine code removed")

# ---- capture group / year / all URL params from the Qualtrics launch link ----
partA = _rm(partA,
  'const study = {\n  sub_id_from_url: new URLSearchParams(location.search).get("sub_id"),',
  'const __q = new URLSearchParams(location.search);\nconst study = {\n  sub_id_from_url: __q.get("sub_id"),\n  group: __q.get("group"),\n  year_in_program: __q.get("year"),\n  url_params: Object.fromEntries(__q.entries()),')
assert '__q.get("group")' in partA
print("partA: URL params (group/year/all) captured into study")

# ---- REPLAY FIXES (partB) ----
# cursor timestamps were epoch (Date.now) -> broke the replay clock, cursor, and progress. Make them case-relative.
partB = partB.replace("state.recon.cursor.push({ x:e.clientX, y:e.clientY, aoi, t:now });",
                      "state.recon.cursor.push({ x:e.clientX, y:e.clientY, aoi, t:nowRel() });", 1)
assert "aoi, t:now });" not in partB, "cursor.t still epoch"
# remove the dev-only 'sim utterance' input from the replay HUD
_d0 = partB.index("    // DEV-ONLY (harness): simulate")
_d1 = partB.index("hud.appendChild(sim);") + len("hud.appendChild(sim);")
_block = partB[_d0:_d1]
partB = partB.replace("\n" + _block, "", 1)
assert "rp_sim" not in partB and "DEV-ONLY" not in partB, "dev sim input still present"
# ---- HUD: clearer "playing" cue. Pure true-tempo is kept; a CSS-driven live
#      pulse + Playing/Paused label means quiet reading pauses never look frozen.
_hud_top = ("function buildHUD(){\n"
  "    if(!document.getElementById('rp_hud_style')){\n"
  "      const stl=document.createElement('style'); stl.id='rp_hud_style';\n"
  "      stl.textContent='@keyframes rp_pulse{0%{opacity:1;transform:scale(1)}50%{opacity:.2;transform:scale(.65)}100%{opacity:1;transform:scale(1)}}'\n"
  "        +'#rp_live .dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#3ddc84;margin-right:7px;vertical-align:middle}'\n"
  "        +'#rp_live.playing .dot{animation:rp_pulse 1.1s ease-in-out infinite}';\n"
  "      document.head.appendChild(stl);\n"
  "    }\n"
  "    hud=document.createElement('div'); hud.id='rp_hud';")
partB = _rm(partB, "function buildHUD(){\n    hud=document.createElement('div'); hud.id='rp_hud';", _hud_top)
partB = _rm(partB,
  'cursor:pointer">Pause</button>\n      <div style="font-variant-numeric:tabular-nums" id="rp_time">',
  'cursor:pointer">Pause</button>\n      <span id="rp_live" class="playing" style="white-space:nowrap;font-weight:600"><span class="dot"></span><span id="rp_live_label">Playing</span></span>\n      <div style="font-variant-numeric:tabular-nums" id="rp_time">')
partB = _rm(partB, '<div style="opacity:.8">Replay \u2014 keep describing what you were thinking</div>',
                   '<div style="opacity:.8">Keep describing what you were thinking</div>')
partB = _rm(partB,
  "    hud.querySelector('#rp_toggle').textContent = playing? 'Pause' : 'Resume';\n  }",
  "    hud.querySelector('#rp_toggle').textContent = playing? 'Pause' : 'Resume';\n"
  "    const live=hud.querySelector('#rp_live'), lbl=hud.querySelector('#rp_live_label');\n"
  "    if(live){ live.className = playing? 'playing' : '';\n"
  "      const dot=live.querySelector('.dot'); if(dot) dot.style.background = playing? '#3ddc84' : '#94a3b8'; }\n"
  "    if(lbl){ lbl.textContent = playing? 'Playing' : 'Paused'; }\n  }")
# ---- hydrateAndRender tail: correct tab-pane switching, replay the occupation
#      input text, repaint highlights (detached by renderCase), reconstruct the
#      classify popup, and follow the participant's active field.
partB = _rm(partB,
  "    // re-apply tab after renderCase rebuilds DOM\n"
  "    if(S.activeTab){ const tb=document.querySelector('.tab[data-tab=\"'+S.activeTab+'\"]'); if(tb){ document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); tb.classList.add('active');\n"
  "       document.querySelectorAll('[data-tabpane]').forEach(pp=>pp.style.display = pp.getAttribute('data-tabpane')===S.activeTab?'':'none'); } }\n"
  "    makeNonInteractive();",
  "    // Re-apply the active tab AND its content pane. Panes are .tabpage[data-page]\n"
  "    // toggled by an .active class -- the old code targeted [data-tabpane]/display,\n"
  "    // so switching the tab button never switched the panel content.\n"
  "    if(S.activeTab){\n"
  "      document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active', x.dataset.tab===S.activeTab));\n"
  "      document.querySelectorAll('.tabpage').forEach(pp=>pp.classList.toggle('active', pp.getAttribute('data-page')===S.activeTab));\n"
  "    }\n"
  "    // replay the occupation name + description being typed into the (transient) inputs\n"
  "    { var __oi=document.getElementById('occ_input'); if(__oi) __oi.value = S.occInput || ''; }\n"
  "    { var __od=document.getElementById('occ_desc'); if(__od) __od.value = S.occDesc || ''; }\n"
  "    // renderCase() rebuilt #app, detaching the highlight ranges resolved above.\n"
  "    // Re-resolve each entry's range against the fresh source DOM and repaint.\n"
  "    state.entries.forEach(e=>{ e.range = e.loc ? rangeFromOffsets(e.loc) : null; });\n"
  "    if(typeof refreshHighlights==='function') refreshHighlights();\n"
  "    if(typeof renderReplayPopup==='function') renderReplayPopup(recon, tMs);\n"
  "    // restore each panel's scroll position -- what the participant had scrolled to,\n"
  "    // so highlights and fields below the fold come into view on replay.\n"
  "    if(S.scroll){ Object.keys(S.scroll).forEach(function(k){ var pb=document.querySelector('#'+k+' .panel-body'); if(pb) pb.scrollTop=S.scroll[k]; }); }\n"
  "    makeNonInteractive();")

# ---- reconstructStateAt: track the transient occupation-input value ----
partB = _rm(partB,
  '    plan: { selectedBarrierIds: [], perBarrier: {}, prioritization:"", approach:"", method:"", type:"", grading:"", goal:"", immediate:"" },\n    activeTab: "profile"',
  '    plan: { selectedBarrierIds: [], perBarrier: {}, prioritization:"", approach:"", method:"", type:"", grading:"", goal:"", immediate:"" },\n    occInput: "",\n    occDesc: "",\n    scroll: {},\n    activeTab: "profile"')
partB = _rm(partB,
  '    case "tab":            S.activeTab = d.tab; break;',
  '    case "tab":            S.activeTab = d.tab; break;\n    case "occ_input":      S.occInput = d.value; break;\n    case "occ_desc_input": S.occDesc = d.value; break;\n    case "scroll":         (S.scroll = S.scroll || {})[d.key] = d.top; break;')

# ---- SCROLL capture: record each scrollable panel's scroll position so replay
#      can restore it (fixes highlights/fields that were below the fold). ----
partB = _rm(partB,
  "  wireSynthesis(); wireTabs(); wireOccupations(); wireOutcomes(); attachSelectionHandlers();",
  "  wireSynthesis(); wireTabs(); wireOccupations(); wireOutcomes(); attachSelectionHandlers(); attachScrollCapture();")
partB = _rm(partB,
  "function openPopover(text, src, rect){",
  "function attachScrollCapture(){\n"
  "  document.querySelectorAll('#app .panel-body').forEach(function(pb){\n"
  "    var panel=pb.closest('.panel'); if(!panel||!panel.id) return;\n"
  "    var key=panel.id, lastTop=-1, lastT=-100000;\n"
  "    pb.addEventListener('scroll', function(){\n"
  "      if(window.__rtaReplaying) return;                 // don't capture programmatic replay scrolls\n"
  "      var now=nowRel(); if(now-lastT<100) return;        // throttle\n"
  "      var top=Math.round(pb.scrollTop); if(top===lastTop) return;\n"
  "      lastTop=top; lastT=now; recordDelta('scroll',{key:key, top:top});\n"
  "    });\n"
  "  });\n"
  "}\n"
  "function openPopover(text, src, rect){")

# ---- wireOccupations: name is now paired with a REQUIRED description (OTPF-4
#      "what do they want / need to do"). Occupation becomes a coded reasoning
#      line, not a bare label. Both name and description typing are captured as
#      replay deltas (occ_input / occ_desc_input). ----
partB = _rm(partB,
  '  const input=document.getElementById("occ_input");\n  const add=()=>{ const name=input.value.trim(); if(!name) return;\n    const id=uid("occ_"); state.occupations.push({id,name}); logEvent("occupation_add",{name}); recordDelta("occ_add",{id,name});\n    input.value=""; renderOccupations(); renderPlan(); };\n  document.getElementById("occ_add").addEventListener("click", add);\n  input.addEventListener("keydown", e=>{ if(e.key==="Enter") add(); });',
  '  const input=document.getElementById("occ_input");\n  const desc=document.getElementById("occ_desc");\n  const add=()=>{ const name=input.value.trim(); const description=(desc?desc.value.trim():""); if(!name) return; if(!description){ if(desc) desc.focus(); return; }\n    const id=uid("occ_"); state.occupations.push({id,name,description}); logEvent("occupation_add",{name,description}); recordDelta("occ_add",{id,name,description});\n    input.value=""; if(desc) desc.value=""; recordDelta("occ_input",{value:""}); recordDelta("occ_desc_input",{value:""}); renderOccupations(); renderPlan(); };\n  document.getElementById("occ_add").addEventListener("click", add);\n  input.addEventListener("input", ()=>recordDelta("occ_input",{value:input.value}));\n  if(desc) desc.addEventListener("input", ()=>recordDelta("occ_desc_input",{value:desc.value}));\n  input.addEventListener("keydown", e=>{ if(e.key==="Enter") add(); });')

# ---- Occupation MARKUP: add the required description textarea (OTPF-4 prompt)
#      beside the name input. The name stays the short label used in the classify
#      "which occupation?" dropdown, cards, and plan; the description is new. ----
partB = _rm(partB,
  '              <input id="occ_input" type="text" maxlength="80" placeholder="Name an occupation…" aria-label="Name an occupation"/>\n              <button class="btn btn-occ" id="occ_add">Add</button>',
  '              <input id="occ_input" type="text" maxlength="80" placeholder="Name an occupation…" aria-label="Name an occupation"/>\n              <textarea id="occ_desc" maxlength="600" rows="2" placeholder="Briefly describe this occupation. What do they want and what do they need to do?" aria-label="Briefly describe this occupation. What do they want and what do they need to do?"></textarea>\n              <button class="btn btn-occ" id="occ_add">Add</button>')

# ---- applyDelta: occ_add now carries the description so replay rebuilds it ----
partB = _rm(partB,
  '    case "occ_add":        S.occupations.push({ id:d.id, name:d.name }); break;',
  '    case "occ_add":        S.occupations.push({ id:d.id, name:d.name, description:d.description }); break;')

# ---- renderOccupations: show the description under the name on each card, and
#      update the empty-state prompt to mention describing. ----
partB = _rm(partB,
  'return `<div class="occ-card"><span class="dot"></span><span class="nm">${esc(o.name)}</span><span class="tally">${n}</span><button class="rm" data-occ="${o.id}" aria-label="Remove ${esc(o.name)}">×</button></div>`;',
  'return `<div class="occ-card"><span class="dot"></span><span class="nm">${esc(o.name)}</span><span class="tally">${n}</span><button class="rm" data-occ="${o.id}" aria-label="Remove ${esc(o.name)}">×</button>${o.description?`<div class="occ-desc">${esc(o.description)}</div>`:""}</div>`;')
partB = _rm(partB,
  '<b>No occupations yet</b>Name the occupations this client needs or wants to do. Supports and barriers you identify link to these.',
  '<b>No occupations yet</b>Name and briefly describe the occupations this client needs or wants to do. Supports and barriers you identify link to these.')

# ---- Practice walkthrough coach-mark: mention the description step ----
partB = _rm(partB,
  '{req:"occupation",     sel:"#occ_input",       h:"Add an occupation",         p:"Name one occupation the client needs or wants to do, then press Add. Everything you classify links to an occupation."},',
  '{req:"occupation",     sel:"#occ_input",       h:"Add an occupation",         p:"Name one occupation the client needs or wants to do, then briefly describe it (what they want and need to do). Press Add. Everything you classify links to an occupation."},')

# ---- Rename the "Chart" tab to "Initial Evaluation" (label only; the internal
#      data-tab/data-page key stays "chart"). Also update the practice coach-marks
#      that name the tab, so the tutorial doesn't reference a tab that no longer
#      exists. The "Chart - X" provenance/source labels are intentionally NOT
#      changed here (they flow into the export `source` field + codebook anchors). ----
partB = _rm(partB,
  '<button class="tab" data-tab="chart" role="tab">Chart</button>',
  '<button class="tab" data-tab="chart" role="tab">Initial Evaluation</button>')
partB = _rm(partB,
  '"Open the Chart & Library tabs"',
  '"Open the Initial Evaluation tab"')
partB = _rm(partB,
  "The case material has three tabs. Open the Chart and the Library at least once so you've seen all of it.",
  "The case material has two tabs. Open the Initial Evaluation tab at least once so you've seen all of it.")

# ---- Rename the provenance/source labels "Chart - X" -> "Initial Evaluation - X"
#      (the origin tag shown on a highlighted excerpt + carried in the export
#      `source`), to match the tab rename. Only these SRC_SECTION values contain
#      "Chart - ", so a scoped replace is safe. ----
assert '"ch_ref":"Chart - Referral"' in partB
partB = partB.replace("Chart - ", "Initial Evaluation - ")

# ---- Intervention plan, per barrier: convert the OTPF-4 "approach" dropdown to a
#      free-text "Describe your approach" field, and REMOVE the OTPF-4 "type"
#      (Table 12) dropdown entirely. Method + grading stay as free text. All four
#      OTPF taxonomy dropdowns (aspect, outcome type, approach, type) are being
#      removed so the tool captures reasoning as prose, not framework labels. ----
_PLAN_NEEDLE = '''      <div class="ip-field"><label>Intervention approach (Table 13)</label>
        <select class="ip" data-bid="${bid}" data-f="approach"><option value="">— select —</option>
          ${APPROACHES.map(a=>`<option ${pb.approach===a?'selected':''}>${a}</option>`).join("")}</select></div>
      <div class="ip-field"><label>Method (incl. safety / environment)</label>
        <textarea data-bid="${bid}" data-f="method" placeholder="2–3 sentences">${esc(pb.method||'')}</textarea></div>
      <div class="ip-field"><label>Intervention type (Table 12)</label>
        <select class="ip" data-bid="${bid}" data-f="type"><option value="">— select —</option>
          ${INTERVENTION_TYPES.map(a=>`<option ${pb.type===a?'selected':''}>${a}</option>`).join("")}</select></div>
      <div class="ip-field"><label>Grading up / down</label>
        <textarea data-bid="${bid}" data-f="grading" placeholder="1–2 sentences">${esc(pb.grading||'')}</textarea></div>'''
_PLAN_REPL = '''      <div class="ip-field"><label>Describe your approach</label>
        <textarea data-bid="${bid}" data-f="approach" placeholder="1–2 sentences">${esc(pb.approach||'')}</textarea></div>
      <div class="ip-field"><label>Method (incl. safety / environment)</label>
        <textarea data-bid="${bid}" data-f="method" placeholder="2–3 sentences">${esc(pb.method||'')}</textarea></div>
      <div class="ip-field"><label>Grading up / down</label>
        <textarea data-bid="${bid}" data-f="grading" placeholder="1–2 sentences">${esc(pb.grading||'')}</textarea></div>'''
partB = _rm(partB, _PLAN_NEEDLE, _PLAN_REPL)

# =====================================================================
# ---- OT-SPECIFIC CLEANUP: remove the Library tab and the OTPF-4 taxonomy
#      dropdowns (aspect, outcome type, intervention type), so the tool captures
#      reasoning as prose rather than framework labels. (Approved by Dennis.) ----
# =====================================================================

# (1) LIBRARY TAB: remove the tab button and its content pane. The panel is now
#     two tabs (Occupational Profile, Initial Evaluation). libCards stays defined
#     but is no longer inserted anywhere (harmless unused string).
partB = _rm(partB,
  '\n            <button class="tab" data-tab="library" role="tab">Library</button>', "")
partB = _rm(partB,
  '\n            <div class="tabpage" data-page="library">${libCards}</div>', "")
# practice checklist: "tabs" seen no longer needs the Library
partB = _rm(partB,
  'tabs: !!(w.tabsSeen.chart && w.tabsSeen.library),',
  'tabs: !!(w.tabsSeen.chart),')

# (2) OTPF-4 ASPECT (classify popup): remove the label+select, the `asp` binding,
#     and set the logged aspect to null.
_ASPECT_UI = '''
    <div class="q">OTPF-4 aspect <span class="opt">(optional)</span></div>
    <select id="pk_aspect"><option value="">— skip —</option>${ASPECTS.map(a=>`<option>${a}</option>`).join("")}</select>'''
partB = _rm(partB, _ASPECT_UI, "")
partB = _rm(partB,
  'const mech=document.getElementById("pk_mech"), asp=document.getElementById("pk_aspect"), occSel=document.getElementById("pk_occ"), go=document.getElementById("pk_go");',
  'const mech=document.getElementById("pk_mech"), occSel=document.getElementById("pk_occ"), go=document.getElementById("pk_go");')
partB = _rm(partB,
  'mechanism:mech.value.trim(), aspect:asp.value||null, occId:occSel.value',
  'mechanism:mech.value.trim(), aspect:null, occId:occSel.value')

# (3) OTPF-4 OUTCOME TYPE (desired outcomes): remove the per-outcome select and its
#     change handler (no more desired_outcome_tag events).
_OUT_SELECT = '''      </div>
      <select class="out-tag" data-out="${o.id}" aria-label="OTPF-4 outcome type (optional)">
        <option value="">OTPF-4 outcome type (optional)…</option>
        ${OUTCOME_TYPES.map(t=>`<option ${o.otpf4_outcome_type===t?'selected':''}>${t}</option>`).join("")}
      </select>
    </div>`).join("");'''
_OUT_SELECT_REPL = '''      </div>
    </div>`).join("");'''
partB = _rm(partB, _OUT_SELECT, _OUT_SELECT_REPL)
_OUT_HANDLER = '''  list.querySelectorAll(".out-tag").forEach(sel=>sel.addEventListener("change",()=>{
    const o=state.synthesis.desired_outcomes.find(x=>x.id===sel.dataset.out);
    if(o){ o.otpf4_outcome_type=sel.value||null; logEvent("desired_outcome_tag",{id:o.id,type:o.otpf4_outcome_type}); recordDelta("outcome_tag",{id:o.id, type:o.otpf4_outcome_type}); }
  }));
'''
partB = _rm(partB, _OUT_HANDLER, "")

# (3b) Plan section-3 heading: drop "type" from the field list.
partB = _rm(partB,
  "3 · For each barrier: approach, method, type, grading",
  "3 · For each barrier: approach, method, grading")

# (3c) Plan step 4: ask for goals (plural), since step 5 asks which to prioritize.
partB = _rm(partB,
  "4 · One objective, measurable, occupation-based long-term goal that addresses a desired outcome",
  "4 · Objective, measurable, occupation-based long-term goals that address the desired outcomes")
partB = _rm(partB,
  '<textarea class="ip" id="ip_goal" placeholder="1–2 sentences">',
  '<textarea class="ip" id="ip_goal" placeholder="one goal per line">')

# (4) checklistState: the per-barrier "complete" test no longer includes `type`.
partB = _rm(partB,
  "return pb.approach&&pb.method&&pb.type&&(pb.grading||'').trim();",
  "return (pb.approach||'').trim()&&(pb.method||'').trim()&&(pb.grading||'').trim();")

# (5) Practice coach-mark text: drop the OTPF-4 tag/type mentions now that those
#     fields are gone.
partB = _rm(partB,
  "In the popup choose Support, name what enables it, optionally tag an OTPF-4 aspect, and link it to an occupation.",
  "In the popup choose Support, name what enables it, and link it to an occupation.")
partB = _rm(partB,
  "Name what's getting in the way, optionally tag an aspect, and link it to an occupation.",
  "Name what's getting in the way and link it to an occupation.")
partB = _rm(partB,
  "then add at least one desired outcome. You can optionally tag each outcome with an OTPF-4 outcome type.",
  "then add at least one desired outcome.")
partB = _rm(partB,
  "fill its approach, method, type, and grading",
  "fill its approach, method, and grading")

# ---- CLASSIFY POPUP CAPTURE: record the transient popup lifecycle as pop_* deltas
#      so the replay can reconstruct it (renderReplayPopup lives in partC). ----
partB = _rm(partB,
  'document.body.appendChild(popEl); positionPop(rect); wireChoiceStep(text, src);',
  'document.body.appendChild(popEl); positionPop(rect); wireChoiceStep(text, src);'
  ' recordDelta("pop_open",{excerpt:text, src:src, loc: serializeRange(pendingRange, src)});')
partB = _rm(partB,
  'function classifyStep(type, text, src){\n  if(!state.occupations.length){ needOccupationsWarn(); return; }\n  const isBar=type==="barrier";',
  'function classifyStep(type, text, src){\n  if(!state.occupations.length){ needOccupationsWarn(); return; }\n  recordDelta("pop_choice",{valence:type});\n  const isBar=type==="barrier";')
partB = _rm(partB,
  'document.getElementById("pk_back").onclick=()=>{ popEl.innerHTML=choiceStep(text); wireChoiceStep(text,src); };',
  'document.getElementById("pk_back").onclick=()=>{ recordDelta("pop_back",{}); popEl.innerHTML=choiceStep(text); wireChoiceStep(text,src); };')
partB = _rm(partB,
  'mech.oninput=check; occSel.onchange=check; mech.focus();',
  'mech.oninput=()=>{ recordDelta("pop_mech",{value:mech.value}); check(); };'
  ' occSel.onchange=()=>{ recordDelta("pop_occ",{occId:occSel.value}); check(); };'
  ' mech.focus();')
partB = _rm(partB,
  'function removePop(){ if(popEl){popEl.remove();popEl=null;} pendingRange=null; }',
  'function removePop(){ if(popEl){ if(state&&state.recon){ try{ recordDelta("pop_close",{}); }catch(e){} } popEl.remove();popEl=null;} pendingRange=null; }')

# ---- IMPRESSION LIVE-TYPING: feed the replay-only recon per keystroke (types out
#      live like plan fields); the analyzed log keeps its settled revisions. ----
partB = _rm(partB,
  '  ta.addEventListener("input", ()=>{ state.synthesis.impression=ta.value; clearTimeout(t); t=setTimeout(snapshot, 800); });',
  '  ta.addEventListener("input", ()=>{ state.synthesis.impression=ta.value; recordDelta("impression",{text:ta.value}); clearTimeout(t); t=setTimeout(snapshot, 800); });')
partB = _rm(partB,
  '    revs.push({version:revs.length+1, text, ts});\n    recordDelta("impression",{text});\n    updateWalkthrough();',
  '    revs.push({version:revs.length+1, text, ts});\n    updateWalkthrough();')

print("partB: replay fixes (cursor time, dev input removed, HUD playing-cue, highlight repaint, popup capture, impression live-typing)")

# ---------- duplicate top-level identifier check A vs B ----------
def top_names(js):
    names=set()
    for m in re.finditer(r"^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)", js, re.M):
        names.add(m.group(1))
    return names
dup = top_names(partA) & top_names(partB)
print("A/B duplicate top-level identifiers:", sorted(dup) if dup else "none")

# ---------- COMPOSE ----------
out = ("<!DOCTYPE html>\n<!-- OT Professional Reasoning Study - FULL INSTRUMENT (Chunks 1-4 integrated). "
       "Assembled from index_chunk2.html scaffolding + Option-B engine/replay + integration layer. -->\n"
       "<html lang=\"en\">\n" + head + "</head>\n<body>\n"
       "<script>\n" + partA + "\n</script>\n"
       "<script>\n" + partB + "\n</script>\n"
       "<script>\n" + partC + "\n</script>\n"
       "</body>\n</html>\n")
io.open("index_full.html","w",encoding="utf-8").write(out)
print("index_full.html bytes:", len(out))

# ---------- write inline scripts for syntax check ----------
scripts = re.findall(r"<script>(.*?)</script>", out, re.S)  # inline only (no src=)
print("inline script blocks:", len(scripts))
for i,s in enumerate(scripts):
    io.open("blk_%d.js"%i,"w",encoding="utf-8").write(s)
