/* =====================================================================
   INTEGRATION LAYER (partC)
   Mounts the engine (above) as jsPsych trials and adds, after each case, a
   SEGMENTED CUED RETROSPECTIVE THINK-ALOUD (approved by Dennis 2026-11-11):
     - after the case is submitted, the participant sees a list of their own
       actions plus long pauses;
     - selecting an item plays back that stretch of their session (from the end
       of the previous item through the action), reconstructed from state.recon;
     - they then record a short think-aloud or choose "Nothing to add"
       (every item needs one or the other);
     - each recording is transcribed in a background queue (per recording, so
       no single long transcription can time out a whole case).
   Progress is autosaved in the browser so a closed tab resumes where it left
   off; a checkpoint file is offered after Case 1; one final file at the end.
   Two analyzed streams: action+content (event_log) and think-aloud (rta).
   No eye tracking, no screen recording, no speech-triggered auto-pause.
   ===================================================================== */

/* ---------------------------------------------------------------------
   PARAMETERS.  Items tagged <<SIGN-OFF>> are decisions owned by Dennis;
   values marked "approved" were decided 2026-11-11.
   --------------------------------------------------------------------- */
CONFIG.RTA_SILENCE_MS            = 10000;  /* approved 2026-09-10: silence before the keep-talking reminder (now: during a recording) */
CONFIG.TA_PAUSE_MS               = 20000;  /* approved: no input of any kind for at least this long becomes its own item */
CONFIG.TA_FINAL_MIN_MS           = 3000;   /* a trailing stretch after the last item shorter than this is not listed */
CONFIG.TA_INCLUDE = {                      /* approved: extra action kinds that get their own item */
  removals: true, barrier_selections: true, abandoned_highlights: true
};
CONFIG.TA_SILENCE_RMS            = 0.02;   /* <<SIGN-OFF>> mic level below this counts as silence for the reminder timer */
CONFIG.TA_MIC_DEAD_RMS           = 0.005;  /* <<SIGN-OFF>> if a whole recording never exceeds this, treat the mic as not working */
CONFIG.TA_EXPORT_AUDIO           = false;  /* <<SIGN-OFF / IRB>> include each analyzed recording's audio (base64) in the session file.
                                              Also turned on for one link by adding &export_audio=1 (e.g. the colleague retest);
                                              the file records it in session.think_aloud.audio_exported and url_params. When on,
                                              audio stays in browser storage until the participant finishes (not just until
                                              transcribed), then is erased with everything else. */
CONFIG.TA_AUDIO_BPS              = 32000;  /* recording bitrate (bits/s). Speech-grade Opus; keeps exported audio small. The
                                              browser may round it; the achieved rate is logged per recording (actual_bps). */
CONFIG.UPLOAD_WARN_BYTES         = 45000000; /* Qualtrics file-upload limit is 50 MB; above this the download screens warn */
CONFIG.TA_PRACTICE_MAX_ITEMS     = 3;      /* approved 2026-11-23: the practice think-aloud shows only the first 3 items */
CONFIG.TA_PRACTICE_MIN_RECORDINGS = 1;     /* approved 2026-11-23: at least one practice item must be recorded (checks the mic);
                                              waived if the participant continues without a mic or two practice recordings are silent */
CONFIG.TA_PERSIST_PENDING_AUDIO  = true;   /* <<SIGN-OFF / IRB>> keep a recording in browser storage ONLY until it is
                                              transcribed, so a closed tab cannot lose untranscribed speech */
CONFIG.TA_TRANSCRIBE_TIMEOUT_MIN_MS = 180000;  /* per-recording timeout floor ... */
CONFIG.TA_TRANSCRIBE_TIMEOUT_X      = 12;      /* ... or this multiple of the recording's length, whichever is larger */
CONFIG.TA_FINAL_WAIT_MAX_MS      = 600000; /* end of session: longest wait for outstanding transcriptions before the file is offered anyway */
CONFIG.AUTOSAVE_EXPIRY_DAYS      = 7;      /* unfinished saved progress older than this is discarded */
CONFIG.CHECKPOINT_AFTER_CASE_ID  = 1;      /* approved: checkpoint file after Case 1 (Florence) */

/* Qualtrics upload survey the participant is returned to at the end; sub_id is appended. */
CONFIG.QUALTRICS_UPLOAD_URL      = "https://drake.qualtrics.com/jfe/form/SV_eFCf1kuYCcGTFS6";
CONFIG.QUALTRICS_RETURN_DELAY_S  = 5;

/* ---------------------------------------------------------------------
   PARTICIPANT-FACING TEXT.  All <<SIGN-OFF>> drafts. ASCII only, first person
   ("I"), "study" not "experiment" (repo data-text hygiene rule).
   {secs} is filled from CONFIG.RTA_SILENCE_MS so message and behavior agree.
   --------------------------------------------------------------------- */
CONFIG.TA_TEXT = {
  intro_title: "Talk through your thinking",
  intro_body:
    "You will now see a list of the things you did in this case, along with any long pauses. " +
    "The items play one at a time, in the order you did them. Each one shows that part of your session. When it finishes, press <b>Record</b>, " +
    "explain what you were thinking at that point, then press <b>Done</b>. If you have nothing to add for an item, " +
    "press <b>Nothing to add</b>. Every item needs one or the other, in order, before you can finish. " +
    "You can watch an earlier item again, but you cannot add to it once you have moved on. " +
    "If about {secs} seconds pass without any sound while you are recording, a short prompt will remind you to keep talking.",
  /* Approved wording (2026-09-10), with its two em-dashes replaced by parentheses to meet the ASCII rule. */
  reasoning_reminder:
    "As you talk, focus on explaining <b>what you were thinking</b> (the reasoning behind what you did) " +
    "rather than narrating your actions on the screen or justifying them after the fact. There are no right or " +
    "wrong responses; I am interested in how you think, not in a correct answer.",
  practice_prefix: "<b>This is only for practice.</b> ",
  /* <<SIGN-OFF>> practice think-aloud (2026-11-23) */
  practice_intro_note: "For the practice, you will see only your first {n} actions. Please record your thinking for at least one of them, so you can check that your microphone works.",
  practice_need_recording: "For the practice, please record at least one item before you finish, so you can check that your microphone works.",
  start_button: "Start",
  start_button_practice: "Start the practice think-aloud",
  record_prompt: "Explain what you were thinking at this point. Press Done when you have finished.",
  silence_prompt: "Please keep describing what you were thinking, or press Done if you have finished.",
  mic_dead: "I did not hear anything in that recording. Please check that your microphone is on and not muted, then record again, or choose Nothing to add.",
  watch_first: "Watch this part of your session first. Record and Nothing to add become available when it finishes.",
  finish_confirm: "You have responded to every item. Finish the think-aloud for this case? You will not be able to return to it.",
  finish_button: "Finish think-aloud",
  /* approved 2026-11-12: responses strictly in action order (wording <<SIGN-OFF>>) */
  in_order: "Please respond to the items in order. This one opens when you reach it.",
  already_answered: "You already responded to this item. You can watch it again, but you cannot add to it now. Your next item is waiting in the list.",
  slip_fix: "You chose Nothing to add for this item. If that was a mistake, you can press Record now, before you respond to the next item.",
  all_done_note: "Every item has a response. You can watch any item again, or press {finish} when you are ready.",
  label: {
    occupation_add:         'You added the occupation "{name}"',
    classify:               'You marked "{excerpt}" as a {valence} for {occupations}',
    desired_outcome_add:    'You added the desired outcome "{text}"',
    impression:             'You wrote or revised your clinical impression',
    plan_field:             'You wrote your plan: {field}',
    occupation_remove:      'You removed the occupation "{name}"',
    entry_remove:           'You removed the {valence} "{excerpt}"',
    desired_outcome_remove: 'You removed the desired outcome "{text}"',
    barrier_on:             'You chose to address the barrier "{mech}" in your plan',
    barrier_off:            'You took the barrier "{mech}" out of your plan',
    abandoned_highlight:    'You highlighted "{excerpt}" but did not classify it',
    pause:                  'A pause with no activity ({secs} seconds)',
    final_review:           'Your final look at the case before submitting'
  },
  plan_field: {
    prioritization: "why you prioritized these barriers",
    goal:           "your long-term goals",
    immediate:      "what needs the most immediate attention",
    approach:       'the approach for "{mech}"',
    method:         'the method for "{mech}"',
    grading:        'grading for "{mech}"'
  },
  checkpoint_title: "Save your progress",
  checkpoint_body:
    "Before Case 2, please download a copy of your work so far. If you finish both cases, you will download " +
    "one final file at the end, and that is the one to upload. If you have to stop before finishing, open the " +
    "upload page below and upload this file.",
  checkpoint_upload_link: "Open the upload page (only if you have to stop now)",
  resume_title: "Welcome back",
  resume_body: "Your progress was saved. You will continue where you left off. The next screens will ask for full screen and your microphone again.",
  file_too_large: "Your file is larger than the survey normally accepts. Please download it and keep it. " +
    "If the survey will not accept it, contact the research team and they will collect it another way."
};

const CASES_IN_ORDER = [PATRICIA, FLORENCE, YVONNE];
const DEV = !!(study.url_params && study.url_params.dev === "1");   /* ?dev=1: diagnostics panel + partial download */
if(study.url_params && study.url_params.export_audio === "1") CONFIG.TA_EXPORT_AUDIO = true;
/* TEST MODE (approved 2026-11-23): &test_nomic=1 skips the microphone step and runs every think-aloud
   without a microphone (Nothing to add only), so automated testers whose browsers have no microphone
   can exercise everything else. Shown on screen and recorded in the file; never in participant links. */
const TEST_NOMIC = !!(study.url_params && study.url_params.test_nomic === "1");   /* per-link audio export (see CONFIG.TA_EXPORT_AUDIO) */

/* Per-case captured records assembled for the export. Keyed by case id. */
study.cases = {};
study.resumes = [];

/* Fill {placeholders}; ASCII-safe truncation for labels. */
function taFmt(tpl, vals){ return String(tpl).replace(/\{(\w+)\}/g, function(_, k){ return (vals && vals[k] != null) ? String(vals[k]) : ""; }); }
function taTrunc(s, n){ s = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 3) + "..." : s; }
function taEsc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[c]; }); }
function mmss(ms){ var s = Math.max(0, Math.round((ms || 0) / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

/* ---------- IN-PAGE MODAL ----------
   Replaces window.alert / window.confirm. Native dialogs can knock the page out
   of full screen (and are blocked in some embedded contexts), which threw the
   participant onto the "return to full screen" overlay mid-task. */
function uiModal(opts){
  opts = opts || {};
  return new Promise(function(resolve){
    var ov = document.createElement("div"); ov.className = "ui-modal-ov";
    Object.assign(ov.style, { position:"fixed", inset:"0", background:"rgba(15,23,42,.55)", zIndex:2147483100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"0 20px", font:"15px system-ui" });
    var box = document.createElement("div");
    Object.assign(box.style, { background:"#fff", color:"#17232e", borderRadius:"12px", maxWidth:"560px", width:"100%",
      padding:"22px 24px", boxShadow:"0 18px 48px rgba(0,0,0,.3)", lineHeight:"1.6", textAlign:"left" });
    box.innerHTML = (opts.title ? '<h3 style="margin:0 0 10px;color:#12507f;font-size:18px">' + opts.title + '</h3>' : "") +
                    '<div style="margin:0 0 18px">' + (opts.html || "") + '</div>';
    var row = document.createElement("div"); Object.assign(row.style, { display:"flex", gap:"10px", justifyContent:"flex-end", flexWrap:"wrap" });
    var buttons = opts.buttons && opts.buttons.length ? opts.buttons : [{ label:"OK", value:true, primary:true }];
    var primaryBtn = null;
    buttons.forEach(function(b){
      var el = document.createElement("button"); el.textContent = b.label;
      Object.assign(el.style, { padding:"10px 20px", borderRadius:"8px", font:"700 14px system-ui", cursor:"pointer",
        border: b.primary ? "0" : "1px solid #c7d3de", background: b.primary ? "#1e6bb8" : "#fff", color: b.primary ? "#fff" : "#17232e" });
      el.onclick = function(){ ov.remove(); document.removeEventListener("keydown", onKey, true); resolve(b.value); };
      if(b.primary) primaryBtn = el;
      row.appendChild(el);
    });
    function onKey(e){ if(e.key === "Enter" && primaryBtn){ e.preventDefault(); primaryBtn.click(); } }
    document.addEventListener("keydown", onKey, true);
    box.appendChild(row); ov.appendChild(box); document.body.appendChild(ov);
    if(primaryBtn) setTimeout(function(){ try{ primaryBtn.focus(); }catch(e){} }, 0);
  });
}

/* ---------- FULLSCREEN GUARDIAN ----------
   Fullscreen can drop mid-study (Esc, a permission prompt). Re-entering requires
   a user gesture, so show a blocking "return to full screen" panel. */
function installFullscreenGuardian(){
  if(window.__fsGuardInstalled) return; window.__fsGuardInstalled = true;
  function isFs(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function reqFs(){ var el = document.documentElement, fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if(fn){ try{ var p = fn.call(el); if(p && p.catch) p.catch(function(){}); }catch(e){} } }
  function overlay(show){
    var o = document.getElementById("fs_return");
    if(show){
      if(!o){ o = document.createElement("div"); o.id = "fs_return";
        Object.assign(o.style, { position:"fixed", inset:"0", background:"#0f172a", color:"#fff", zIndex:2147483000,
          display:"flex", alignItems:"center", justifyContent:"center", font:"16px system-ui", textAlign:"left", padding:"0 24px" });
        o.innerHTML = '<div style="max-width:520px;line-height:1.7">'
          + '<h2 style="color:#93c5fd;margin:0 0 12px">Please return to full screen</h2>'
          + '<p style="margin:0 0 20px">This study runs in full screen so the whole interface fits. Your progress is saved. Click below to continue.</p>'
          + '<button id="fs_return_btn" style="background:#1565c0;color:#fff;border:0;border-radius:8px;padding:12px 26px;font:700 15px system-ui;cursor:pointer">Return to full screen</button></div>';
        document.body.appendChild(o);
        document.getElementById("fs_return_btn").onclick = reqFs;
      }
      o.style.display = "flex";
    } else if(o){ o.style.display = "none"; }
  }
  document.addEventListener("fullscreenchange", function(){ if(study.__fsActive) overlay(!isFs()); });
  document.addEventListener("webkitfullscreenchange", function(){ if(study.__fsActive) overlay(!isFs()); });
}

/* ---------- LEAVE-PAGE GUARD ----------
   While the study is live, closing or reloading the tab asks the browser's own
   "leave site?" question. Autosave still protects the work if they leave. */
(function(){
  window.addEventListener("beforeunload", function(e){
    try{ if(typeof Persist !== "undefined") Persist.saveNow(); }catch(err){}
    if(study.__guardUnload){ e.preventDefault(); e.returnValue = ""; return ""; }
  });
  window.addEventListener("pagehide", function(){ try{ if(typeof Persist !== "undefined") Persist.saveNow(); }catch(err){} });
  document.addEventListener("visibilitychange", function(){ if(document.hidden){ try{ if(typeof Persist !== "undefined") Persist.saveNow(); }catch(err){} } });
})();

/* Fresh #app host inside a trial's #ot_mount (engine renders into #app). */
function mountAppInto(hostId){
  var host = document.getElementById(hostId);
  host.innerHTML = '<div id="app"></div>';
  return host;
}

/* Remove any body-appended overlays so they never bleed between trials. */
function cleanupOverlays(){
  if(typeof removePop === "function"){ try{ removePop(); }catch(e){} }
  if(typeof removeCoach === "function"){ try{ removeCoach(); }catch(e){} }
  var cl = document.getElementById("cl"); if(cl) cl.remove();
  document.querySelectorAll(".pop,.coach,#rp_hud,#rp_cursor,#rp_net,#rp_continue,#rp_busy,#rp_pop,#rp_empty,#ta_bar,#ta_list,#ta_intro,#ta_note,#ta_cursor").forEach(function(el){ el.remove(); });
  if(window.CSS && CSS.highlights){ try{ CSS.highlights.clear(); }catch(e){} }
}

/* Analyzed data only (event_log + descriptive state). Recon is NOT included. */
function serializeCaseData(){
  return {
    case_id:CASE.id, case_role:CASE.role, case_name:CASE.name,
    synthesis:{
      impression:state.synthesis.impression,
      impression_last_edit:state.synthesis.impression_stamp,
      impression_revisions:state.synthesis.impression_revisions,
      desired_outcomes:state.synthesis.desired_outcomes.map(function(o){ return { id:o.id, text:o.text, otpf4_outcome_type:o.otpf4_outcome_type, ts:o.ts }; })
    },
    occupations:state.occupations,
    entries:state.entries.map(function(e){ return { id:e.id, type:e.type, excerpt:e.excerpt, provenance_src:e.src, mechanism:e.mechanism,
      otpf4_aspect:e.aspect, occupation_ids:(e.occIds||[]).slice(), ts:e.ts }; }),
    intervention_plan:state.plan,
    event_log:state.log
  };
}

/* Engine state -> JSON-safe copy (live DOM Ranges dropped; entries keep loc). */
function cloneForSave(obj){ return JSON.parse(JSON.stringify(obj, function(k, v){ return (k === "range") ? undefined : v; })); }

/* ---------- DEV PANEL (?dev=1 only) ----------
   Shows transcription queue status and offers a download of everything so far,
   so a test session that stops early still produces a file. Never shown to
   participants (their link has no dev parameter). */
function devPanel(){
  if(!DEV) return;
  var p = document.getElementById("dev_panel");
  if(!p){ p = document.createElement("div"); p.id = "dev_panel";
    Object.assign(p.style, { position:"fixed", left:"8px", top:"8px", zIndex:2147483200, background:"rgba(17,24,39,.92)", color:"#e5e7eb",
      font:"11px ui-monospace,Menlo,monospace", padding:"6px 8px", borderRadius:"6px", maxWidth:"320px", pointerEvents:"none", opacity:".85" });
    document.body.appendChild(p); }
  var q = TQ.stats();
  p.innerHTML = 'DEV  queue: ' + q.queued + ' queued, ' + (q.busy ? 1 : 0) + ' running | done ' + q.done + ', empty ' + q.empty +
    ', error ' + q.error + ', timeout ' + q.timeout + (q.lastRtf != null ? ' | last rtf ' + q.lastRtf.toFixed(2) : '') +
    '<br><button id="dev_dl" style="margin-top:4px;font:11px ui-monospace,Menlo,monospace;pointer-events:auto">download data so far</button>' +
    ' <span id="dev_save">' + (Persist.lastSave ? 'saved ' + Math.round((Date.now() - Persist.lastSave) / 1000) + 's ago' : 'not saved') + '</span>';
  document.getElementById("dev_dl").onclick = function(){ downloadJSON(buildSessionExport("dev"), "ot_session_" + (study.sub_id_from_url || "anon") + "_DEV_" + Date.now() + ".json"); };
}
if(DEV){ setInterval(function(){ try{ devPanel(); }catch(e){} }, 1000); }

function downloadJSON(payload, fname){
  var blob = new Blob([JSON.stringify(payload)], { type:"application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a"); a.href = url; a.download = fname; document.body.appendChild(a); a.click();
  setTimeout(function(){ a.remove(); }, 0);
  return url;
}

/* =====================================================================
   AUTOSAVE / RESUME (approved 2026-11-11)
   One snapshot per participant (keyed by the sub_id from the Qualtrics link)
   in the browser's IndexedDB. Saved every few seconds while work changes, on
   every step boundary, and when the tab is hidden or closed. On reload with the
   same link, the session resumes where it left off: completed steps are skipped,
   an interrupted case is restored to its exact state (its clock skips the gap,
   which is logged), and an interrupted think-aloud keeps every response so far.
   Cleared after the final file is downloaded; abandoned snapshots expire.
   Without a sub_id there is nothing to key on, so nothing is saved.
   ===================================================================== */
const Flow = {
  done: [],          // completed steps: "case:<id>", "ta:<id>", "checkpoint"
  live: null,        // function returning the in-progress step's state (or null)
  resume: null,      // in-progress step restored from a snapshot, consumed by its trial
  markDone: function(step){ if(this.done.indexOf(step) < 0) this.done.push(step); this.live = null; Persist.bump(); Persist.saveNow(); }
};

const Persist = (function(){
  var DB = "ot_prof_reasoning", SNAP = "sessions", AUDIO = "pending_audio";
  var db = null, key = null, timer = null, lastSig = null, api = { lastSave:null, enabled:false, saveStats:{ n:0, maxSyncMs:0, failures:0 } };
  /* Finished cases never change once done (apart from late transcripts), so they are
     written to their own record only when they change (casesVersion), not on every
     save. The periodic save covers just the session header and the step in progress.
     Measured 2026-11-12: re-copying everything each save froze the page 70-90 ms per
     save for a heavy session on a fast machine. */
  var casesVersion = 0, savedCasesVersion = -1, lastInput = 0;
  ["keydown","input","pointerdown","wheel"].forEach(function(t){ document.addEventListener(t, function(){ lastInput = Date.now(); }, { capture:true, passive:true }); });
  api.bump = function(){ casesVersion++; };

  function idbOpen(){
    return new Promise(function(res){
      try{
        if(!window.indexedDB){ res(false); return; }
        var rq = indexedDB.open(DB, 1);
        rq.onupgradeneeded = function(){ var d = rq.result;
          if(!d.objectStoreNames.contains(SNAP)) d.createObjectStore(SNAP);
          if(!d.objectStoreNames.contains(AUDIO)) d.createObjectStore(AUDIO); };
        rq.onsuccess = function(){ db = rq.result; res(true); };
        rq.onerror = function(){ res(false); };
        rq.onblocked = function(){ res(false); };
      }catch(e){ res(false); }
    });
  }
  function op(store, mode, fn){
    return new Promise(function(res){
      if(!db){ res(null); return; }
      try{
        var t = db.transaction(store, mode), s = t.objectStore(store), r = fn(s), out = null;
        if(r) r.onsuccess = function(){ out = r.result; };
        t.oncomplete = function(){ res(out === undefined ? null : out); };
        t.onerror = function(){ res(null); }; t.onabort = function(){ res(null); };
      }catch(e){ res(null); }
    });
  }

  api.init = function(studyId){
    if(!studyId) return Promise.resolve(null);
    key = String(studyId);
    var timeout = new Promise(function(res){ setTimeout(function(){ res("timeout"); }, 2500); });
    return Promise.race([idbOpen(), timeout]).then(function(ok){
      if(ok !== true) return null;
      api.enabled = true;
      // expire abandoned snapshots (any participant) older than the limit
      var cutoff = Date.now() - CONFIG.AUTOSAVE_EXPIRY_DAYS * 86400000;
      return op(SNAP, "readonly", function(s){ return s.getAll(); }).then(function(all){
        var stale = (all || []).filter(function(x){ return x && x.kind !== "cases" && x.saved_at < cutoff; }).map(function(x){ return x.study_id; });
        return Promise.all(stale.map(function(id){ return api.clear(id); }));
      }).then(function(){ return op(SNAP, "readonly", function(s){ return s.get(key); }); })
        .then(function(snap){
          if(!snap || snap.completed) return null;
          return op(SNAP, "readonly", function(s){ return s.get(key + "|cases"); }).then(function(c){
            snap.cases = (c && c.cases) || snap.cases || {};          // (older single-record saves carried cases inline)
            casesVersion = 0; savedCasesVersion = 0;                   // the stored copy is current
            return snap; });
        });
    }).catch(function(){ return null; });
  };

  api.snapshot = function(){
    var live = null; try{ live = Flow.live ? Flow.live() : null; }catch(e){ live = null; }
    return {
      v: 1, study_id: key, saved_at: Date.now(), completed: false,
      session: {
        started_at: study.started_at, user_agent: study.user_agent, session_started_at_ms: study.session_started_at_ms,
        group: study.group, year_in_program: study.year_in_program, url_params: study.url_params,
        task_viewport: study.task_viewport, browser_check: study.browser_check, permissions: study.permissions,
        resumes: study.resumes
      },
      done: Flow.done.slice(),
      live: live
    };
  };

  api.saveNow = function(){
    if(!api.enabled || !key) return Promise.resolve(false);
    var t0 = performance.now(), snap, casesRec = null, ver = casesVersion;
    try{
      snap = api.snapshot();
      if(ver !== savedCasesVersion) casesRec = { kind:"cases", study_id:key, saved_at:Date.now(), cases: cloneForSave(study.cases) };
    }catch(e){ api.saveStats.failures++; return Promise.resolve(false); }
    var p = op(SNAP, "readwrite", function(s){ if(casesRec) s.put(casesRec, key + "|cases"); return s.put(snap, key); });
    var sync = performance.now() - t0;                       // time the page was blocked
    api.saveStats.n++; if(sync > api.saveStats.maxSyncMs) api.saveStats.maxSyncMs = Math.round(sync);
    return p.then(function(r){
      if(r !== null){ api.lastSave = Date.now(); if(casesRec) savedCasesVersion = ver; } else api.saveStats.failures++;
      return r !== null; });
  };
  /* Periodic save while something is changing. sig() is a cheap change counter. */
  /* Saves when something changed AND the participant has paused input for 1.2 s, so
     the brief copy lands between keystrokes; never more than 20 s without a save while
     work is changing. sig() is a cheap change counter. */
  api.startAutosave = function(sig){
    if(timer) clearInterval(timer);
    timer = setInterval(function(){
      var s = null; try{ s = sig(); }catch(e){}
      if(s === lastSig) return;
      var now = Date.now();
      if(now - lastInput >= 1200 || now - (api.lastSave || 0) >= 20000){ lastSig = s; api.saveNow(); }
    }, 1000);
  };
  api.clear = function(id){
    var k = String(id || key);
    return op(SNAP, "readwrite", function(s){ s.delete(k + "|cases"); return s.delete(k); }).then(function(){
      return op(AUDIO, "readonly", function(s){ return s.getAllKeys(); }); }).then(function(keys){
      var mine = (keys || []).filter(function(x){ return String(x).indexOf(k + "|") === 0; });
      return Promise.all(mine.map(function(x){ return op(AUDIO, "readwrite", function(s){ return s.delete(x); }); }));
    });
  };
  api.markCompleted = function(){ if(timer) clearInterval(timer); return api.clear(key); };
  /* Not-yet-transcribed audio (CONFIG.TA_PERSIST_PENDING_AUDIO), or all analyzed audio until the end when
     CONFIG.TA_EXPORT_AUDIO is on (it is read back only to build the session file). */
  api.putAudio = function(recId, blob){ if(!api.enabled || !(CONFIG.TA_PERSIST_PENDING_AUDIO || CONFIG.TA_EXPORT_AUDIO)) return Promise.resolve(null);
    return op(AUDIO, "readwrite", function(s){ return s.put(blob, key + "|" + recId); }); };
  api.getAudio = function(recId){ return op(AUDIO, "readonly", function(s){ return s.get(key + "|" + recId); }); };
  api.delAudio = function(recId){ return op(AUDIO, "readwrite", function(s){ return s.delete(key + "|" + recId); }); };
  return api;
})();

/* Restore study-level state from a snapshot. Steps already done are skipped by
   the timeline; an interrupted step is handed to its trial via Flow.resume. */
function restoreFromSnapshot(snap){
  var s = snap.session || {};
  ["started_at","session_started_at_ms","group","year_in_program","url_params","task_viewport"].forEach(function(k){ if(s[k] != null) study[k] = s[k]; });
  study.resumes = (s.resumes || []).slice();
  study.resumes.push({ resumed_at_wall_ms: Date.now(), last_saved_at_wall_ms: snap.saved_at, gap_ms: Date.now() - snap.saved_at,
                       live_step: snap.live ? (snap.live.kind + ":" + snap.live.case_id) : null, done_before: (snap.done || []).slice() });
  study.cases = snap.cases || {};
  Flow.done = (snap.done || []).slice();
  Flow.resume = snap.live || null;
}

function makeResumeNoticeTrial(){
  return {
    type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS", data: { trial_tag: "resume_notice" },
    stimulus: '<div style="max-width:620px;margin:10% auto;text-align:left;color:#1d2a38;font-family:system-ui">'
      + '<h2 style="color:#1565c0">' + CONFIG.TA_TEXT.resume_title + '</h2>'
      + '<p style="font-size:17px;line-height:1.7">' + CONFIG.TA_TEXT.resume_body + '</p>'
      + '<button id="resume_go" style="margin-top:10px;padding:13px 28px;background:#1565c0;color:#fff;border:0;border-radius:6px;font-weight:700;font-size:15px;cursor:pointer">Continue</button></div>',
    on_load: function(){ document.getElementById("resume_go").onclick = function(){ jsPsych.finishTrial(); }; }
  };
}

/* =====================================================================
   TRANSCRIPTION QUEUE
   Each think-aloud recording is transcribed separately, one at a time, in the
   background (the Whisper worker), while the participant keeps working. Results
   are matched to recordings by job id, never by arrival order. Every recording
   carries its own status and timing in the export:
     queued | decoding | transcribing | done | empty | error | timeout |
     decode_error | lost_on_reload
   plus processing_ms and rtf (processing time / audio length) so real-world
   speed on participants' machines is measured, not assumed.
   A timeout restarts the worker (a stuck worker would otherwise block the queue).
   ===================================================================== */
function pcm16kFromBlob(blob){
  return blob.arrayBuffer().then(function(buf){
    var AC = window.AudioContext || window.webkitAudioContext;
    var ac = new AC();
    return ac.decodeAudioData(buf).then(function(audio){
      try{ ac.close && ac.close(); }catch(e){}
      var rate = 16000;
      var off = new OfflineAudioContext(1, Math.max(1, Math.ceil(audio.duration * rate)), rate);
      var src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start(0);
      return off.startRendering().then(function(r){ return new Float32Array(r.getChannelData(0)); });
    });
  });
}

const TQ = (function(){
  var jobs = [], busy = false, seq = 0, pending = {}, stats = { done:0, empty:0, error:0, timeout:0, lastRtf:null }, listeners = [];
  window.__onWhisperResult = function(data){ route(data, null); };
  window.__onWhisperError  = function(data){ route(data, (data && data.message) || "worker error"); };
  function route(data, err){
    if(!data || data.id == null) return;               // warmup message (no job id)
    var r = pending[data.id]; if(!r) return;            // a job we already gave up on
    delete pending[data.id];
    r(err ? { error: err } : { text: data.text || "", chunks: data.chunks || [] });
  }
  function notify(){ listeners.forEach(function(f){ try{ f(); }catch(e){} }); }
  function restartWorker(){
    try{ if(typeof __whisperWorker !== "undefined" && __whisperWorker) __whisperWorker.terminate(); }catch(e){}
    try{ __whisperWorker = null; __workerReady = false; initWhisperWorker(); }catch(e){}
  }
  function run(job){
    var rec = job.rec, t = rec.transcription;
    t.status = "decoding"; t.started_wall_ms = Date.now(); notify();
    return pcm16kFromBlob(job.blob).then(function(pcm){
      t.audio_samples_16k = pcm.length; t.status = "transcribing"; notify();
      try{ if(typeof __whisperWorker === "undefined" || !__whisperWorker) initWhisperWorker(); }catch(e){}
      var id = ++seq;
      var limit = Math.max(CONFIG.TA_TRANSCRIBE_TIMEOUT_MIN_MS, CONFIG.TA_TRANSCRIBE_TIMEOUT_X * (rec.duration_ms || 0));
      return new Promise(function(resolve){
        pending[id] = resolve;
        try{ __whisperWorker.postMessage({ type:"transcribe", audioData: pcm, id: id }); }
        catch(e){ delete pending[id]; resolve({ error: String(e) }); return; }
        setTimeout(function(){ if(pending[id]){ delete pending[id]; resolve({ timeout: true }); } }, limit);
      });
    }, function(e){ return { decode_error: String(e) }; }).then(function(res){
      t.finished_wall_ms = Date.now(); t.processing_ms = t.finished_wall_ms - t.started_wall_ms;
      if(res.decode_error){ t.status = "decode_error"; t.error = res.decode_error; stats.error++; }
      else if(res.timeout){ t.status = "timeout"; stats.timeout++; restartWorker(); }
      else if(res.error){ t.status = "error"; t.error = res.error; stats.error++; }
      else {
        t.text = (res.text || "").trim(); t.chunks = res.chunks || [];
        t.status = t.text ? "done" : "empty"; if(t.text) stats.done++; else stats.empty++;
        t.rtf = rec.duration_ms ? Math.round(1000 * t.processing_ms / rec.duration_ms) / 1000 : null; stats.lastRtf = t.rtf;
      }
      // speech is no longer needed in browser storage once the attempt is finished
      if((t.status === "done" || t.status === "empty") && !CONFIG.TA_EXPORT_AUDIO) Persist.delAudio(rec.rec_id);
    });
  }
  function pump(){
    if(busy) return;
    var job = jobs.shift(); if(!job){ notify(); return; }
    busy = true; notify();
    run(job).catch(function(e){ job.rec.transcription.status = "error"; job.rec.transcription.error = String(e); })
      .then(function(){ busy = false;
        var c = study.cases && study.cases[job.ctx.caseId]; if(c && c.ta) Persist.bump();   /* finished think-aloud changed */
        Persist.saveNow(); notify(); pump(); });
  }
  return {
    model: function(){ return (CONFIG.WHISPER_MODEL || "") + "@fa16a75f5d91e83ecb6a2ccb690f14d91ef00ca4"; },
    enqueue: function(rec, blob, ctx){
      rec.transcription = Object.assign(rec.transcription || {}, { status:"queued", queued_wall_ms: Date.now(), model: this.model() });
      jobs.push({ rec: rec, blob: blob, ctx: ctx || {} }); notify(); pump();
    },
    /* jobs still outstanding, optionally for one case */
    outstanding: function(caseId){
      var n = jobs.filter(function(j){ return caseId == null || j.ctx.caseId === caseId; }).length;
      return n + (busy ? 1 : 0);
    },
    onChange: function(f){ listeners.push(f); },
    offChange: function(f){ listeners = listeners.filter(function(x){ return x !== f; }); },
    stats: function(){ return { queued: jobs.length, busy: busy, done: stats.done, empty: stats.empty, error: stats.error, timeout: stats.timeout, lastRtf: stats.lastRtf }; },
    /* resolve when no jobs remain or maxMs passes; onProgress(remaining) */
    waitIdle: function(maxMs, onProgress){
      var self = this, t0 = Date.now();
      return new Promise(function(res){
        (function check(){
          var left = self.outstanding();
          if(onProgress) try{ onProgress(left); }catch(e){}
          if(left === 0) return res(true);
          if(Date.now() - t0 >= maxMs) return res(false);
          setTimeout(check, 500);
        })();
      });
    }
  };
})();

/* Audio kept for the session file (only when CONFIG.TA_EXPORT_AUDIO). Held in memory
   and in browser storage; it is NOT part of the saved study state, so autosaves never
   copy it. collectExportAudio() reads it back (memory first, then storage, which covers
   a reload) and returns { map: rec_id -> data URL, stats }. Practice and silent
   recordings are never included. */
const AudioKeep = (function(){ var m = {}; return { set: function(id, b){ m[id] = b; }, get: function(id){ return m[id] || null; } }; })();
function collectExportAudio(){
  if(!CONFIG.TA_EXPORT_AUDIO) return Promise.resolve(null);
  var recs = [];
  CASES_IN_ORDER.forEach(function(c){
    if(c.role === "Practice") return;
    var rec = study.cases[c.id] || {}, ta = rec.ta || (typeof liveOf === "function" ? (liveOf("ta", c.id) || {}).ta : null);
    ((ta && ta.items) || []).forEach(function(it){ (it.recordings || []).forEach(function(r){ if(!r.silent) recs.push(r); }); });
  });
  var stats = { n_recordings: recs.length, n_included: 0, n_missing: 0, audio_bytes: 0, missing: [] }, map = {};
  function toDataUrl(b){ return new Promise(function(res){ try{ var fr = new FileReader(); fr.onload = function(){ res(String(fr.result || "")); }; fr.onerror = function(){ res(null); }; fr.readAsDataURL(b); }catch(e){ res(null); } }); }
  return Promise.all(recs.map(function(r){
    var b = AudioKeep.get(r.rec_id);
    return (b ? Promise.resolve(b) : Persist.getAudio(r.rec_id)).then(function(blob){
      if(!blob){ stats.n_missing++; stats.missing.push(r.rec_id); return; }
      return toDataUrl(blob).then(function(u){ if(u){ map[r.rec_id] = u; stats.n_included++; stats.audio_bytes += blob.size; } else { stats.n_missing++; stats.missing.push(r.rec_id); } });
    }, function(){ stats.n_missing++; stats.missing.push(r.rec_id); });
  })).then(function(){ return { map: map, stats: stats }; });
}

/* After a resume: any recording whose transcription had not finished is
   re-queued from browser storage, or marked lost (and its item reopened so the
   participant can respond again) if the audio is not there. */
function requeuePendingTranscriptions(){
  Object.keys(study.cases || {}).forEach(function(cid){
    var ta = study.cases[cid] && study.cases[cid].ta; if(ta) requeueItems(ta.items || [], cid, ta.analyzed, false);
  });
  if(Flow.resume && Flow.resume.kind === "ta" && Flow.resume.ta) requeueItems(Flow.resume.ta.items || [], Flow.resume.case_id, Flow.resume.ta.analyzed, true);
}
/* canReopen: only an interrupted (still open) think-aloud can send the participant
   back to an item; a finished one just records the loss. */
function requeueItems(items, caseId, analyzed, canReopen){
  items.forEach(function(it){
    (it.recordings || []).forEach(function(rec){
      var st = rec.transcription && rec.transcription.status;
      if(!analyzed || !st || ["queued","decoding","transcribing"].indexOf(st) < 0) return;
      Persist.getAudio(rec.rec_id).then(function(blob){
        if(blob){ TQ.enqueue(rec, blob, { caseId: caseId, itemId: it.item_id }); }
        else {
          rec.transcription.status = "lost_on_reload";
          var usable = (it.recordings || []).some(function(r){ return r !== rec && r.transcription && (r.transcription.status === "done" || r.transcription.status === "empty" || r.transcription.status === "queued"); });
          if(canReopen && !usable && it.response === "recorded"){ it.response = null; it.reopened_after_reload = true; }
        }
      });
    });
  });
}

/* =====================================================================
   THINK-ALOUD ITEM LIST  (pure function: no DOM, Node-testable)
   Items, in task order:
     action       one per listed action. Included kinds (approved 2026-11-11):
                  occupation_add, classify, desired_outcome_add, impression
                  (synthesis_revision), plan field (plan_revision), removals,
                  barrier selections, abandoned highlights. Tab switches excluded.
                  Consecutive revisions of the SAME text field with nothing else
                  listed between them form one item (one editing stretch), so
                  typing with brief hesitations is not split into many items.
     pause        a stretch with no input of any kind (no event, edit, scroll,
                  popup activity, or mouse sample) of >= pauseMs.
     final_review the stretch after the last item up to submission, if >= finalMinMs.
   Clip windows cover the whole case without gaps or overlap: each item's clip
   runs from the end of the previous item to the end of this one. A pause item's
   clip plays its lead-in, then shows the (unchanging) screen of the pause as a
   still: by definition nothing changes on screen during it.
   ===================================================================== */
function buildThinkAloudItems(task, recon, opts){
  opts = opts || {};
  var PAUSE = opts.pauseMs || 20000, FINAL_MIN = (opts.finalMinMs != null ? opts.finalMinMs : 3000);
  var INC = opts.include || {}, TX = opts.text || {}, L = TX.label || {}, PF = TX.plan_field || {};
  var fmt = opts.fmt || function(t, v){ return String(t).replace(/\{(\w+)\}/g, function(_, k){ return v && v[k] != null ? v[k] : ""; }); };
  var tr = opts.trunc || function(s, n){ s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n - 3) + "..." : s; };
  var log = (task && task.event_log) || [];
  var deltas = ((recon && recon.deltas) || []).map(function(d, i){ return { d: d, i: i }; })
                 .sort(function(a, b){ return (a.d.t - b.d.t) || (a.i - b.i); }).map(function(x){ return x.d; });
  var cursor = (recon && recon.cursor) || [];

  // entry id -> {type, mechanism, excerpt} from the replay record (classify events carry no id in older logs)
  var entryInfo = {};
  deltas.forEach(function(d){ if(d.op === "entry_add") entryInfo[d.id] = { type: d.type, mechanism: d.mechanism, excerpt: d.excerpt }; });
  log.forEach(function(e){ if(e.kind === "classify" && e.detail && e.detail.entry_id && !entryInfo[e.detail.entry_id])
    entryInfo[e.detail.entry_id] = { type: e.detail.type, mechanism: e.detail.mechanism, excerpt: e.detail.excerpt }; });
  function mechOf(id, d){ var m = (d && d.mechanism) || (entryInfo[id] && entryInfo[id].mechanism) || (entryInfo[id] && entryInfo[id].excerpt) || "barrier"; return tr(m, 60); }

  var lastT = 0;
  log.forEach(function(e){ if(e.t > lastT) lastT = e.t; });
  deltas.forEach(function(d){ if(d.t > lastT) lastT = d.t; });
  cursor.forEach(function(c){ if(c.t > lastT) lastT = c.t; });
  var caseEnd = Math.max(opts.caseEndT || 0, lastT);

  // ---- raw actions ----
  var raw = [];
  log.forEach(function(e, idx){
    var d = e.detail || {}, a = null;
    switch(e.kind){
      case "occupation_add": a = { kind: e.kind, label: fmt(L.occupation_add, { name: tr(d.name, 60) }) }; break;
      case "classify": {
        var occs = (d.occupations && d.occupations.length) ? d.occupations.filter(Boolean).join(", ") : (d.occupation || "an occupation");
        a = { kind: e.kind, entry_id: d.entry_id || null,
              label: fmt(L.classify, { excerpt: tr(d.excerpt, 70), valence: (d.type === "barrier" ? "barrier" : "support"), occupations: tr(occs, 60) }) };
        break; }
      case "desired_outcome_add": a = { kind: e.kind, label: fmt(L.desired_outcome_add, { text: tr(d.text, 70) }) }; break;
      case "synthesis_revision": a = { kind: e.kind, group: "impression", label: fmt(L.impression, {}) }; break;
      case "plan_revision": {
        var f = d.field, ftxt = PF[f] ? fmt(PF[f], { mech: mechOf(d.barrier_id, null) }) : String(f || "");
        a = { kind: e.kind, group: "plan|" + (d.scope || "") + "|" + (f || "") + "|" + (d.barrier_id || ""), field: f, barrier_id: d.barrier_id || null,
              label: fmt(L.plan_field, { field: ftxt }) };
        break; }
      case "occupation_remove": if(INC.removals) a = { kind: e.kind, label: fmt(L.occupation_remove, { name: tr(d.occupation, 60) }) }; break;
      case "entry_remove": if(INC.removals){ var inf = entryInfo[d.id] || {};
        a = { kind: e.kind, entry_id: d.id, label: fmt(L.entry_remove, { valence: ((d.entry_type || inf.type) === "barrier" ? "barrier" : "support"), excerpt: tr(d.entry || inf.excerpt, 70) }) }; }
        break;
      case "desired_outcome_remove": if(INC.removals) a = { kind: e.kind, label: fmt(L.desired_outcome_remove, { text: tr(d.outcome, 70) }) }; break;
      case "barrier_select": if(INC.barrier_selections)
        a = { kind: e.kind, entry_id: d.id, on: !!d.on, label: fmt(d.on ? L.barrier_on : L.barrier_off, { mech: mechOf(d.id, d) }) };
        break;
    }
    if(a){ a.t = e.t; a.event_indices = [idx]; raw.push(a); }
  });

  // abandoned highlights: a popup opened on a selection, then closed (or replaced
  // by another selection) without a classification being added
  if(INC.abandoned_highlights){
    var open = null;
    var flush = function(t){ if(open && !open.committed) raw.push({ kind: "abandoned_highlight", t: t, opened_t: open.t, excerpt: open.excerpt, src: open.src,
                                event_indices: [], label: fmt(L.abandoned_highlight, { excerpt: tr(open.excerpt, 70) }) }); };
    deltas.forEach(function(d){
      if(d.op === "pop_open"){ flush(d.t); open = { t: d.t, excerpt: d.excerpt, src: d.src, committed: false }; }
      else if(d.op === "entry_add"){ if(open) open.committed = true; }
      else if(d.op === "pop_close"){ flush(d.t); open = null; }
    });
    flush(caseEnd);
  }
  raw.sort(function(a, b){ return (a.t - b.t) || ((a.event_indices[0] == null ? 1e15 : a.event_indices[0]) - (b.event_indices[0] == null ? 1e15 : b.event_indices[0])); });

  // ---- inactivity: every timestamp of any input is "activity" ----
  var acts = [0];
  log.forEach(function(e){ acts.push(e.t); });
  deltas.forEach(function(d){ acts.push(d.t); });
  cursor.forEach(function(c){ acts.push(c.t); });
  acts.push(caseEnd);
  acts = acts.filter(function(x){ return typeof x === "number" && isFinite(x) && x >= 0 && x <= caseEnd; }).sort(function(a, b){ return a - b; });
  var gaps = [], pauses = [];
  for(var i = 0; i + 1 < acts.length; i++){
    var g = acts[i + 1] - acts[i];
    if(g >= 2000) gaps.push([acts[i], acts[i + 1]]);
    if(g >= PAUSE) pauses.push({ start: acts[i], end: acts[i + 1] });
  }

  // ---- merge into items ----
  var anchors = raw.map(function(a){ return { t: a.t, ord: 0, a: a }; })
    .concat(pauses.map(function(p){ return { t: p.start, ord: 1, p: p }; }))
    .sort(function(x, y){ return (x.t - y.t) || (x.ord - y.ord); });
  var items = [], boundary = 0;
  anchors.forEach(function(an){
    if(an.a){
      var a = an.a, prev = items[items.length - 1];
      if(prev && prev.kind === "action" && a.group && prev.group === a.group){
        prev.clip_end_t = a.t; prev.action.t = a.t; prev.action.event_indices = prev.action.event_indices.concat(a.event_indices);
        prev.action.n_merged++; boundary = a.t; return;
      }
      var act = { kind: a.kind, t: a.t, t_first: a.t, event_indices: a.event_indices.slice(), n_merged: 1 };
      ["entry_id","on","field","barrier_id","excerpt","src","opened_t"].forEach(function(k){ if(a[k] !== undefined) act[k] = a[k]; });
      items.push({ kind: "action", label: a.label, group: a.group || null, action: act, clip_start_t: boundary, clip_end_t: a.t });
      boundary = a.t;
    } else {
      var p = an.p, secs = Math.round((p.end - p.start) / 1000);
      items.push({ kind: "pause", label: fmt(L.pause, { secs: secs }), clip_start_t: boundary, clip_end_t: p.end, still_start_t: p.start, still_ms: p.end - p.start });
      boundary = p.end;
    }
  });
  if(caseEnd - boundary >= FINAL_MIN) items.push({ kind: "final_review", label: fmt(L.final_review, {}), clip_start_t: boundary, clip_end_t: caseEnd });
  items.forEach(function(it, k){
    it.item_id = "it" + (k + 1); it.index = k;
    it.response = null; it.watched = false; it.views = 0; it.recordings = [];
  });

  // ---- inactivity summary (for recalibrating the pause threshold) ----
  var bins = [[2,5],[5,10],[10,15],[15,20],[20,30],[30,60],[60,1e9]].map(function(b){
    var gs = gaps.filter(function(x){ var s = (x[1] - x[0]) / 1000; return s >= b[0] && s < b[1]; });
    return { from_s: b[0], to_s: (b[1] >= 1e9 ? null : b[1]), n: gs.length, total_ms: gs.reduce(function(s, x){ return s + x[1] - x[0]; }, 0) };
  });
  var thresholds = [10, 15, 20, 30, 45, 60].map(function(s){
    return { threshold_s: s, n_pause_items: gaps.filter(function(x){ return (x[1] - x[0]) >= s * 1000; }).length };
  });
  return {
    items: items,
    gap_summary: {
      case_duration_ms: caseEnd, pause_threshold_ms: PAUSE, n_items: items.length,
      n_items_by_kind: items.reduce(function(m, it){ var k = it.kind === "action" ? it.action.kind : it.kind; m[k] = (m[k] || 0) + 1; return m; }, {}),
      inactivity_bins: bins, pause_items_at_threshold: thresholds,
      inactivity_ge_5s: gaps.filter(function(x){ return x[1] - x[0] >= 5000; }).map(function(x){ return { start_t: x[0], end_t: x[1] }; })
    }
  };
}
if(typeof module !== "undefined" && module.exports) module.exports = { buildThinkAloudItems: buildThinkAloudItems };

/* =====================================================================
   CLIP PLAYER
   Plays a bounded stretch [from, to] of a case, reconstructed from state.recon,
   on a replay surface that has EXACTLY the task's layout (same width and height
   as the case viewport), uniformly scaled to fit above the control bar. The
   cursor and the classify-popup replica live inside that surface, so recorded
   screen coordinates line up with the content.
   Efficiency (the old replay rebuilt the whole interface on every keyframe,
   including every mouse sample, about 8 times a second):
     - the state fold is incremental (only new deltas are applied);
     - the interface is rebuilt only when its structure changes; typing,
       scrolling, and popup activity update the existing page in place;
     - a seek is a single rebuild.
   True tempo (1 ms of playback = 1 ms of the session). A stalled frame is
   capped at 250 ms so a hidden tab or a slow frame pauses rather than skips.
   ===================================================================== */
const Clip = (function(){
  var LIGHT = { impression:1, plan_field:1, plan_barrier:1, occ_input:1, occ_desc_input:1, scroll:1 };
  var POP   = { pop_open:1, pop_choice:1, pop_back:1, pop_mech:1, pop_aspect:1, pop_occ:1, pop_close:1 };
  var BAR_H = 84, LIST_W = 320, PREROLL_MS = 1500;
  var recon = null, deltas = [], cursor = [], S = null, di = 0, ci = -1, foldT = -Infinity;
  var mount = null, W = 0, H = 0, scale = 1, cursorEl = null;
  var playing = false, raf = null, lastTs = null, playT = 0, clip = null, onEnd = null, onTick = null, done = false;
  var selHL = (typeof Highlight !== "undefined") ? new Highlight() : null;

  function load(r, mnt, vp){
    recon = r || { deltas: [], cursor: [] };
    deltas = (recon.deltas || []).map(function(d, i){ return { d: d, i: i }; }).sort(function(a, b){ return (a.d.t - b.d.t) || (a.i - b.i); }).map(function(x){ return x.d; });
    cursor = (recon.cursor || []).slice().sort(function(a, b){ return a.t - b.t; });
    mount = mnt; W = (vp && vp.w) || window.innerWidth; H = (vp && vp.h) || window.innerHeight;
    layout(); reset();
    if(!cursorEl){ cursorEl = document.createElement("div"); cursorEl.id = "ta_cursor"; }
    Object.assign(cursorEl.style, { position:"absolute", width:"18px", height:"18px", borderRadius:"50%", border:"2px solid #d95a30",
      background:"rgba(217,90,48,.25)", zIndex:10000, pointerEvents:"none", transform:"translate(-50%,-50%)",
      transition:"left .08s linear, top .08s linear", display:"none" });
    mount.appendChild(cursorEl);
    try{ if(selHL && window.CSS && CSS.highlights){ CSS.highlights.set("ot-selection", selHL);
      if(!document.getElementById("ta_sel_style")){ var s = document.createElement("style"); s.id = "ta_sel_style";
        s.textContent = "::highlight(ot-selection){background-color:#bcd4ff;}"; document.head.appendChild(s); } } }catch(e){}
    window.addEventListener("resize", layout);
  }
  function layout(){
    if(!mount) return;
    /* the action list occupies the right LIST_W px and the control bar the bottom BAR_H px */
    var availW = Math.max(300, window.innerWidth - LIST_W), availH = Math.max(200, window.innerHeight - BAR_H);
    scale = Math.min(availW / W, availH / H, 1);
    var ox = Math.max(0, (availW - W * scale) / 2), oy = Math.max(0, (availH - H * scale) / 2);
    Object.assign(mount.style, { inset:"auto", left:"0px", top:"0px", right:"auto", bottom:"auto", width: W + "px", height: H + "px",
      transformOrigin:"0 0", transform:"translate(" + ox + "px," + oy + "px) scale(" + scale + ")" });
  }
  function reset(){ S = reconstructStateAt({ deltas: [] }, -1); di = 0; ci = -1; foldT = -Infinity; }
  function foldTo(t){
    if(t < foldT) reset();
    var ch = { any:false, structural:false, light:{}, pop:false };
    while(di < deltas.length && deltas[di].t <= t){
      var d = deltas[di++]; applyDelta(S, d); ch.any = true;
      if(POP[d.op]) ch.pop = true; else if(LIGHT[d.op]) ch.light[d.op] = 1; else ch.structural = true;
    }
    foldT = t; return ch;
  }
  /* S -> the engine's live `state`, mirroring the old hydrateAndRender (plus the
     occupation description, which the old replay dropped). */
  function syncState(){
    state.occupations = S.occupations.map(function(o){ return { id:o.id, name:o.name, description:o.description }; });
    state.entries = S.entries.map(function(e){ return { id:e.id, type:e.type, excerpt:e.excerpt, src:e.src, mechanism:e.mechanism, aspect:e.aspect,
      occIds:(e.occIds || []).slice(), loc:e.loc, range:null }; });
    state.synthesis.impression = S.synthesis.impression;
    state.synthesis.desired_outcomes = S.synthesis.desired_outcomes.map(function(o){ return { id:o.id, text:o.text, otpf4_outcome_type:o.otpf4_outcome_type }; });
    state.plan.selectedBarrierIds = S.plan.selectedBarrierIds.slice();
    state.plan.perBarrier = JSON.parse(JSON.stringify(S.plan.perBarrier || {}));
    ["prioritization","approach","method","type","grading","goal","immediate"].forEach(function(k){ if(k in S.plan) state.plan[k] = S.plan[k]; });
  }
  function setVal(sel, v){ var el = mount.querySelector(sel); if(el && el.value !== (v || "")){ el.value = v || ""; if(el.tagName === "TEXTAREA") el.scrollTop = el.scrollHeight; } }
  function applyScroll(){
    if(!S.scroll) return;
    Object.keys(S.scroll).forEach(function(k){ var pb = mount.querySelector("#" + k + " .panel-body"); if(pb && Math.abs(pb.scrollTop - S.scroll[k]) > 1) pb.scrollTop = S.scroll[k]; });
  }
  function fullRender(t){
    syncState();
    renderCase();
    mount.querySelectorAll(".tab").forEach(function(x){ x.classList.toggle("active", x.dataset.tab === S.activeTab); });
    mount.querySelectorAll(".tabpage").forEach(function(pp){ pp.classList.toggle("active", pp.getAttribute("data-page") === S.activeTab); });
    setVal("#occ_input", S.occInput); setVal("#occ_desc", S.occDesc);
    state.entries.forEach(function(e){ e.range = e.loc ? rangeFromOffsets(e.loc) : null; });
    if(typeof refreshHighlights === "function") refreshHighlights();
    applyScroll();
    renderPopup(t);
    var app = document.getElementById("app"); if(app) app.style.pointerEvents = "none";
  }
  function lightRender(light){
    if(light.impression){ state.synthesis.impression = S.synthesis.impression; setVal("#synthesis_impression", S.synthesis.impression); }
    if(light.plan_field){ ["prioritization","goal","immediate"].forEach(function(k){ state.plan[k] = S.plan[k]; setVal("#ip_" + k, S.plan[k]); }); }
    if(light.plan_barrier){
      state.plan.perBarrier = JSON.parse(JSON.stringify(S.plan.perBarrier || {}));
      mount.querySelectorAll("[data-bid][data-f]").forEach(function(el){ var pb = S.plan.perBarrier[el.dataset.bid] || {}, v = pb[el.dataset.f] || "";
        if(el.value !== v){ el.value = v; if(el.tagName === "TEXTAREA") el.scrollTop = el.scrollHeight; } });
    }
    if(light.occ_input) setVal("#occ_input", S.occInput);
    if(light.occ_desc_input) setVal("#occ_desc", S.occDesc);
    if(light.scroll) applyScroll();
  }

  /* ---- classify-popup replica (non-interactive), folded from pop_* deltas ---- */
  function popupAt(tMs){
    var p = null;
    for(var i = 0; i < deltas.length && deltas[i].t <= tMs; i++){
      var d = deltas[i];
      switch(d.op){
        case "pop_open":   p = { excerpt:d.excerpt, src:d.src, loc:d.loc, step:"choice", valence:null, mech:"", occIds:[] }; break;
        case "pop_choice": if(p){ p.valence = d.valence; p.step = "mech"; } break;
        case "pop_back":   if(p){ p.step = "choice"; } break;
        case "pop_mech":   if(p){ p.mech = d.value; } break;
        case "pop_occ":    if(p){ p.occIds = d.occIds || (d.occId ? [d.occId] : []); } break;
        case "pop_close":  p = null; break;
        case "entry_add":  p = null; break;
      }
    }
    return p;
  }
  function renderPopup(tMs){
    var p = popupAt(tMs), el = mount.querySelector("#rp_pop");
    if(!p){ if(el) el.remove(); try{ if(selHL) selHL.clear(); }catch(e){} return; }
    if(!el){ el = document.createElement("div"); el.id = "rp_pop"; el.className = "pop"; mount.appendChild(el); }
    el.style.pointerEvents = "none"; el.style.zIndex = "10001";
    if(p.step === "choice" && typeof choiceStep === "function"){ el.innerHTML = choiceStep(p.excerpt); }
    else {
      var isBar = p.valence === "barrier";
      var mechQ = isBar ? "What is getting in the way of this occupation?" : "What capacity or resource enables this?";
      var occQ  = isBar ? "A barrier to which occupation(s)? Select all that apply." : "This supports which occupation(s)? Select all that apply.";
      var occs = (state.occupations || []).map(function(o){ return '<label class="pk-occ"><input type="checkbox" disabled ' + (p.occIds.indexOf(o.id) >= 0 ? "checked" : "") + '/><span>' + taEsc(o.name) + '</span></label>'; }).join("");
      el.innerHTML = '<div class="q">' + mechQ + '</div><textarea rows="4" disabled>' + taEsc(p.mech || "") + '</textarea>'
        + '<div class="q">' + occQ + '</div><div class="pk-occs">' + occs + '</div>'
        + '<button class="confirm" disabled>' + (isBar ? "Add barrier" : "Add support") + '</button>';
      var ta = el.querySelector("textarea"); if(ta) ta.scrollTop = ta.scrollHeight;
    }
    var r = null; try{ r = (p.loc && typeof rangeFromOffsets === "function") ? rangeFromOffsets(p.loc) : null; }catch(e){}
    try{ if(selHL){ selHL.clear(); if(r) selHL.add(r); } }catch(e){}
    var rect = r ? r.getBoundingClientRect() : null, m = mount.getBoundingClientRect();
    if(rect && (rect.width || rect.height)){
      var L = (rect.left - m.left) / scale, T = (rect.top - m.top) / scale, B = (rect.bottom - m.top) / scale, Wd = rect.width / scale;
      var w = el.offsetWidth || 290, h = el.offsetHeight || 220, pad = 10;
      var left = L + Wd / 2 - w / 2, top = B + 8;
      if(top + h > H - pad) top = T - h - 8;
      left = Math.max(pad, Math.min(left, W - w - pad)); top = Math.max(pad, Math.min(top, H - h - pad));
      el.style.left = left + "px"; el.style.top = top + "px";
    } else { el.style.left = "40px"; el.style.top = "120px"; }
  }

  function positionCursor(t){
    if(ci >= 0 && cursor[ci] && cursor[ci].t > t) ci = -1;
    while(ci + 1 < cursor.length && cursor[ci + 1].t <= t) ci++;
    var c = ci >= 0 ? cursor[ci] : null;
    if(c){ cursorEl.style.display = ""; cursorEl.style.left = c.x + "px"; cursorEl.style.top = c.y + "px"; }
    else cursorEl.style.display = "none";
  }
  function seek(t){ playT = t; if(t < foldT) reset(); foldTo(t); fullRender(t); positionCursor(t); }

  /* c: { from, to, still } -- still: show the frame at `still` and stop there (pause items) */
  function play(c, cbEnd, cbTick){
    stop(); clip = c; onEnd = cbEnd || null; onTick = cbTick || null; done = false;
    var from = c.from;
    seek(from);
    var stopAt = (c.still != null) ? c.still : c.to;
    if(stopAt <= from){ finish(); return; }
    playing = true; lastTs = null; raf = requestAnimationFrame(tick);
  }
  function tick(ts){
    if(!playing) return;
    if(lastTs == null) lastTs = ts;
    var dt = Math.min(ts - lastTs, 250); lastTs = ts;
    var stopAt = (clip.still != null) ? clip.still : clip.to;
    playT = Math.min(stopAt, playT + dt);
    var ch = foldTo(playT);
    if(ch.structural) fullRender(playT);
    else { if(Object.keys(ch.light).length) lightRender(ch.light); if(ch.pop) renderPopup(playT); }
    positionCursor(playT);
    if(onTick) try{ onTick(playT, clip); }catch(e){}
    if(playT >= stopAt){ playing = false; finish(); return; }
    raf = requestAnimationFrame(tick);
  }
  function finish(){ if(done) return; done = true; playing = false; if(onEnd) try{ onEnd(); }catch(e){} }
  function pause(){ playing = false; if(raf) cancelAnimationFrame(raf); raf = null; }
  function resume(){ if(!clip || done || playing) return; playing = true; lastTs = null; raf = requestAnimationFrame(tick); }
  function stop(){ pause(); clip = null; }
  function teardown(){ stop(); window.removeEventListener("resize", layout); try{ if(cursorEl) cursorEl.remove(); }catch(e){}
    try{ if(selHL) selHL.clear(); }catch(e){} var pp = mount && mount.querySelector("#rp_pop"); if(pp) pp.remove(); }

  return { load:load, play:play, pause:pause, resume:resume, stop:stop, seek:seek, teardown:teardown, layout:layout,
           isPlaying:function(){ return playing; }, isDone:function(){ return done; }, position:function(){ return playT; },
           PREROLL_MS: PREROLL_MS, BAR_H: BAR_H, LIST_W: LIST_W, scale:function(){ return scale; },
           _debug:function(){ return { di:di, foldT:foldT, nDeltas:deltas.length, scale:scale, W:W, H:H }; } };
})();

/* =====================================================================
   SEGMENTED THINK-ALOUD TRIAL (one per case, after the case is submitted)
   Screen: the replay surface (scaled copy of the task screen), the action
   list on the right (always visible), a control bar at the bottom.
   Per item: watch the clip -> Record ... Done, or Nothing to add.
   Every item needs a response before Finish is enabled (approved 2026-11-11).
   STRICT ORDER (Dennis, 2026-11-12): items are answered only in action order, so
   narration is never given about an action after narrating a later one. Earlier
   items can be re-watched but not added to. One exception (assumed, pending
   Dennis's confirmation): the item answered just before can change Nothing to add
   into a recording until the next item is answered (an accidental click), logged
   as slip_fix. Later items are locked.
   Record / Nothing to add unlock only after the clip has played to its end
   once, so every participant sees each cue before responding.
   ===================================================================== */
function makeThinkAloudTrial(caseObj){
  return {
    type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS",
    stimulus: '<div id="ot_mount"></div>',
    data: { trial_tag:"think_aloud", case_id:caseObj.id, case_role:caseObj.role, case_name:caseObj.name },
    on_load: function(){ runThinkAloud(caseObj); },
    on_finish: function(data){ var ta = study.cases[caseObj.id] && study.cases[caseObj.id].ta; data.ta_n_items = ta ? ta.items.length : 0; }
  };
}

function runThinkAloud(caseObj){
  var analyzed = (caseObj.role !== "Practice");
  var store = study.cases[caseObj.id] || (study.cases[caseObj.id] = {});
  var rec = store.recon || { deltas: [], cursor: [] };
  var X = CONFIG.TA_TEXT;
  var TA, resumed = false;

  if(Flow.resume && Flow.resume.kind === "ta" && String(Flow.resume.case_id) === String(caseObj.id) && Flow.resume.ta){
    TA = Flow.resume.ta; Flow.resume = null; resumed = true;
  } else {
    var built = buildThinkAloudItems(store.task, rec, { pauseMs: CONFIG.TA_PAUSE_MS, finalMinMs: CONFIG.TA_FINAL_MIN_MS, include: CONFIG.TA_INCLUDE,
      text: X, fmt: taFmt, trunc: taTrunc, caseEndT: store.case_ended_t });
    /* practice (approved 2026-11-23): only the first CONFIG.TA_PRACTICE_MAX_ITEMS items */
    var shown = analyzed ? built.items : built.items.slice(0, CONFIG.TA_PRACTICE_MAX_ITEMS);
    TA = { format: "segmented_cued_retrospective_v1", analyzed: analyzed, items: shown, items_available: built.items.length, gap_summary: built.gap_summary,
           events: [], phase_started_wall_ms: Date.now(), phase_ended_wall_ms: null, intro_done: false, current: null, rec_seq: 0,
           mic_errors: [] };
  }
  function ev(type, extra){ TA.events.push(Object.assign({ type: type, wall_ms: Date.now(), phase_ms: Date.now() - TA.phase_started_wall_ms,
    item_id: (TA.current != null && TA.items[TA.current]) ? TA.items[TA.current].item_id : null }, extra || {})); }
  Flow.live = function(){ return { kind: "ta", case_id: caseObj.id, ta: cloneForSave(TA) }; };
  if(DEV) window.__TA = TA;   /* ?dev=1 only: inspect the live think-aloud from the console */
  Persist.startAutosave(function(){ return TA.events.length + ":" + TA.items.filter(function(i){ return i.response; }).length; });
  if(resumed) ev("resumed");
  /* A practice think-aloud saved by an older version (before the 3-item limit) is cut to the
     limit on resume, so a participant resuming across a code update is never held to the long list. */
  if(resumed && !analyzed && TA.items.length > CONFIG.TA_PRACTICE_MAX_ITEMS){
    if(TA.items_available == null) TA.items_available = TA.items.length;
    TA.items = TA.items.slice(0, CONFIG.TA_PRACTICE_MAX_ITEMS);
    if(TA.current != null && TA.current >= TA.items.length) TA.current = null;
    ev("practice_list_capped_on_resume", { kept: TA.items.length, available: TA.items_available });
  }
  if(TEST_NOMIC && !TA.no_mic){ TA.no_mic = true; ev("test_mode_no_mic"); }   /* test mode: think-aloud without a microphone */

  // ---- nothing to narrate: never show an empty screen ----
  if(!TA.items.length){
    cleanupOverlays();
    uiModal({ title: "Nothing to replay for this case", html: "No actions were recorded for this case, so there is nothing to talk through here. This is not your fault. You can continue to the next step.",
              buttons: [{ label: "Continue", value: true, primary: true }] }).then(function(){ finish(); });
    return;
  }

  // ---- surface ----
  var mnt = mountAppInto("ot_mount");
  CASE = caseObj; state = freshState(); seq = 0; walk = null;
  var cl0 = document.getElementById("cl"); if(cl0) cl0.remove();
  window.__rtaReplaying = true;
  /* backdrop matches the replayed page; keep the speech-model chip clear of the action list */
  if(!document.getElementById("ta_style")){ var tst = document.createElement("style"); tst.id = "ta_style";
    tst.textContent = "body.ta-active{background:#e6ecf1} body.ta-active #whisper_status{right:" + (Clip.LIST_W + 12) + "px !important}";
    document.head.appendChild(tst); }
  document.body.classList.add("ta-active");
  Clip.load(rec, mnt, store.viewport || study.task_viewport);
  Clip.seek(0);

  var mode = "idle";      // idle | playing | paused | ready | recording | saving | advancing
  var mic = { stream: null, ac: null, an: null, buf: null };
  var R = null;           // active recording
  var advanceTimer = null;

  // ---- control bar + list ----
  var bar = document.createElement("div"); bar.id = "ta_bar";
  Object.assign(bar.style, { position:"fixed", left:"0", right:"0", bottom:"0", height: Clip.BAR_H + "px", background:"#0f172a", color:"#fff",
    display:"flex", alignItems:"center", gap:"14px", padding:"0 16px", zIndex:10005, font:"14px system-ui", boxSizing:"border-box" });
  document.body.appendChild(bar);
  var list = document.createElement("div"); list.id = "ta_list";
  Object.assign(list.style, { position:"fixed", top:"0", right:"0", bottom: Clip.BAR_H + "px", width: Clip.LIST_W + "px", background:"#f8fafc",
    borderLeft:"1px solid #d6dee6", zIndex:10004, display:"flex", flexDirection:"column", font:"13px system-ui", color:"#17232e", boxSizing:"border-box" });
  document.body.appendChild(list);
  var note = document.createElement("div"); note.id = "ta_note";
  Object.assign(note.style, { position:"fixed", left:"16px", bottom:(Clip.BAR_H + 12) + "px", maxWidth:"560px", background:"#0b3d2e", color:"#eafff4",
    font:"600 15px system-ui", padding:"11px 16px", borderRadius:"10px", zIndex:10006, boxShadow:"0 6px 22px rgba(0,0,0,.3)", lineHeight:"1.5", display:"none" });
  document.body.appendChild(note);
  var noteTimer = null;
  function showNote(text, ms, tone){ note.textContent = text; note.style.background = tone === "warn" ? "#7c2d12" : (tone === "info" ? "#1e3a5f" : "#0b3d2e");
    note.style.display = ""; clearTimeout(noteTimer); if(ms) noteTimer = setTimeout(hideNote, ms); }
  function hideNote(){ note.style.display = "none"; clearTimeout(noteTimer); }

  function btn(label, kind){ var b = document.createElement("button"); b.textContent = label;
    var bg = { primary:"#1e8e4e", rec:"#c0392b", plain:"#334155", finish:"#1565c0" }[kind || "plain"];
    Object.assign(b.style, { background: bg, color:"#fff", border:"0", borderRadius:"7px", padding:"10px 16px", font:"700 14px system-ui", cursor:"pointer", whiteSpace:"nowrap" });
    return b; }
  function enable(b, on){ b.disabled = !on; b.style.opacity = on ? "1" : ".4"; b.style.cursor = on ? "pointer" : "not-allowed"; }

  var info = document.createElement("div"); Object.assign(info.style, { flex:"1 1 auto", minWidth:"0", lineHeight:"1.35" });
  var bPlay = btn("Pause"), bReplay = btn("Replay"), bRec = btn("Record", "rec"), bNothing = btn("Nothing to add"), bDone = btn("Done", "primary"), bFinish = btn(X.finish_button, "finish");
  bPlay.id = "ta_play"; bReplay.id = "ta_replay"; bRec.id = "ta_rec"; bNothing.id = "ta_nothing"; bDone.id = "ta_done"; bFinish.id = "ta_finish";
  var recBox = document.createElement("div"); Object.assign(recBox.style, { display:"none", alignItems:"center", gap:"10px" });
  recBox.innerHTML = '<span style="width:12px;height:12px;border-radius:50%;background:#ef4444;display:inline-block"></span>'
    + '<span id="ta_rec_time" style="font-variant-numeric:tabular-nums;min-width:44px">0:00</span>'
    + '<span style="width:90px;height:8px;background:#334155;border-radius:4px;overflow:hidden;display:inline-block"><span id="ta_level" style="display:block;height:100%;width:0;background:#22c55e"></span></span>';
  recBox.appendChild(bDone);
  [info, bPlay, bReplay, bRec, bNothing, recBox, bFinish].forEach(function(n){ bar.appendChild(n); });

  function item(){ return TA.current != null ? TA.items[TA.current] : null; }
  /* the next item awaiting a response (items.length when all are answered) */
  function frontier(){ for(var i = 0; i < TA.items.length; i++){ if(!TA.items[i].response) return i; } return TA.items.length; }
  /* a slip fix is allowed only on the most recently answered item, only from Nothing to add,
     and only while the item after it is still unanswered */
  function slipFixable(it){ return !!it && it.response === "nothing_to_add" && TA.last_answered_id === it.item_id
    && it.index === frontier() - 1; }
  function canRecord(it){ return !!it && (it.index === frontier() || slipFixable(it)); }
  /* practice: at least CONFIG.TA_PRACTICE_MIN_RECORDINGS recorded items, unless the participant continued
     without a microphone or two practice recordings were silent (so nobody can get stuck here) */
  function nRecorded(){ return TA.items.filter(function(i){ return i.response === "recorded"; }).length; }
  function nSilent(){ var n = 0; TA.items.forEach(function(i){ (i.recordings || []).forEach(function(r){ if(r.silent) n++; }); }); return n; }
  function needRecording(){ return !analyzed && !TA.no_mic && nSilent() < 2 && nRecorded() < (CONFIG.TA_PRACTICE_MIN_RECORDINGS || 0); }
  function nothingBlocked(){ return needRecording() && (TA.items.length - nResponded()) <= ((CONFIG.TA_PRACTICE_MIN_RECORDINGS || 0) - nRecorded()); }
  function canNothing(it){ return !!it && it.index === frontier() && !nothingBlocked(); }
  /* a pause is shown as its span (start to end), matching where its narration is anchored */
  function itemTime(it){ return it.kind === "pause" && it.still_start_t != null ? mmss(it.still_start_t) + ' to ' + mmss(it.clip_end_t) : mmss(it.clip_end_t); }
  function nResponded(){ return TA.items.filter(function(i){ return !!i.response; }).length; }
  function renderBar(){
    var it = item(), n = TA.items.length;
    info.innerHTML = it ? '<div style="opacity:.75;font-size:12px">Item ' + (it.index + 1) + ' of ' + n + ' &middot; ' + (it.kind === "pause" ? 'from ' : 'at ') + itemTime(it) + ' in the case</div>'
      + '<div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + taEsc(it.label) + '</div>'
      : '<div style="font-weight:700">Select an item in the list to begin.</div>';
    var rec_ = (mode === "recording" || mode === "saving");
    [bPlay, bReplay, bRec, bNothing].forEach(function(b){ b.style.display = rec_ ? "none" : ""; });
    recBox.style.display = rec_ ? "flex" : "none";
    bPlay.textContent = (mode === "paused") ? "Play" : "Pause";
    enable(bPlay, !!it && (mode === "playing" || mode === "paused"));
    enable(bReplay, !!it && mode !== "saving");
    enable(bRec, !!it && !TA.no_mic && it.watched && canRecord(it) && (mode === "ready" || mode === "idle"));
    enable(bNothing, !!it && it.watched && canNothing(it) && (mode === "ready" || mode === "idle"));
    enable(bDone, mode === "recording");
    var left = n - nResponded();
    bFinish.textContent = left ? (X.finish_button + " (" + left + " left)") : X.finish_button;
    enable(bFinish, left === 0 && !rec_);
  }
  function renderList(){
    var n = TA.items.length, k = nResponded(), fr = frontier();
    var rows = TA.items.map(function(it, i){
      var cur = (i === TA.current), locked = (i > fr && !it.response), st = it.response === "recorded" ? ["#16a34a","Recorded"] : it.response === "nothing_to_add" ? ["#64748b","Nothing to add"]
              : it.watched ? ["#d97706","Watched"] : locked ? ["#e2e8f0","Not yet"] : ["#2563eb","Up next"];
      return '<div class="ta-row" data-i="' + i + '"' + (locked ? ' data-locked="1"' : '') + ' style="display:flex;gap:9px;align-items:flex-start;padding:9px 12px;border-bottom:1px solid #e2e8f0;'
        + (locked ? 'cursor:default;opacity:.5;' : 'cursor:pointer;') + (cur ? 'background:#e0ecf8;' : '') + (it.kind === "pause" ? 'font-style:italic;' : '') + '">'
        + '<span style="flex:0 0 22px;color:#64748b;font-variant-numeric:tabular-nums">' + (i + 1) + '</span>'
        + '<span style="flex:1 1 auto;min-width:0"><span style="display:block;line-height:1.35">' + taEsc(it.label) + '</span>'
        + '<span style="display:flex;gap:6px;align-items:center;margin-top:3px;font-size:11.5px;color:#475569;font-style:normal">'
        + '<span style="width:9px;height:9px;border-radius:50%;background:' + st[0] + ';display:inline-block"></span>' + st[1]
        + '<span style="margin-left:auto;white-space:nowrap">' + itemTime(it) + '</span></span></span></div>';
    }).join("");
    list.innerHTML = '<div style="padding:14px 14px 10px;border-bottom:1px solid #d6dee6;background:#fff">'
      + '<div style="font-weight:700;font-size:15px;color:#12507f">Your actions in this case</div>'
      + '<div style="margin-top:4px;color:#475569">' + k + ' of ' + n + ' done</div>'
      + '<div style="margin-top:7px;height:7px;background:#e2e8f0;border-radius:4px;overflow:hidden"><div style="height:100%;width:' + (100 * k / n) + '%;background:#16a34a"></div></div></div>'
      + '<div id="ta_rows" style="flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain">' + rows + '</div>';
    list.querySelectorAll(".ta-row").forEach(function(r){ r.onclick = function(){
      if(r.dataset.locked){ ev("locked_click", { index: +r.dataset.i }); showNote(X.in_order, 4000, "info"); return; }
      select(+r.dataset.i); }; });
    var curRow = list.querySelector('.ta-row[data-i="' + TA.current + '"]'); if(curRow) curRow.scrollIntoView({ block:"nearest" });
  }
  function render(){ renderBar(); renderList(); }

  // ---- playback ----
  function select(i){
    if(mode === "recording" || mode === "saving") return;
    if(i > frontier() && !TA.items[i].response) return;   /* later items are locked (an answered later item exists only after a lost recording reopened an earlier one) */
    clearTimeout(advanceTimer);
    TA.current = i; var it = item(); it.views++; if(it.first_shown_wall_ms == null) it.first_shown_wall_ms = Date.now();
    ev("item_select", { index: i });
    playItem();
  }
  function playItem(){
    var it = item(); if(!it) return;
    hideNote();
    var stopAt = (it.kind === "pause") ? it.still_start_t : it.clip_end_t;
    var from = Math.max(0, Math.min(it.clip_start_t, stopAt - Clip.PREROLL_MS));
    mode = "playing"; render();
    ev("clip_play", { from_t: from, to_t: it.clip_end_t, still_t: (it.kind === "pause" ? it.still_start_t : null) });
    Clip.play({ from: from, to: it.clip_end_t, still: (it.kind === "pause" ? it.still_start_t : null) }, function(){
      var it2 = item(); if(!it2 || it2 !== it) return;
      if(!it.watched){ it.watched = true; it.watched_wall_ms = Date.now(); }
      mode = "ready"; ev("clip_end"); render();
      if(it.index === frontier() && nothingBlocked()) showNote(X.practice_need_recording, 0, "info");
      else if(slipFixable(it)) showNote(X.slip_fix, 0, "info");
      else if(it.response && frontier() < TA.items.length) showNote(X.already_answered, 0, "info");
      else if(it.kind === "pause") showNote("No clicks, typing, scrolling, or mouse movement for " + Math.round(it.still_ms / 1000) + " seconds here.", 0, "info");
      Persist.saveNow();
    });
  }
  bPlay.onclick = function(){ if(mode === "playing"){ Clip.pause(); mode = "paused"; ev("clip_pause"); }
                              else if(mode === "paused"){ Clip.resume(); mode = "playing"; ev("clip_resume"); } render(); };
  bReplay.onclick = function(){ if(!item() || mode === "recording" || mode === "saving") return; clearTimeout(advanceTimer); item().views++; ev("clip_replay"); playItem(); };
  bNothing.onclick = function(){
    var it = item(); if(!it) return;
    if(!it.watched){ showNote(X.watch_first, 4000, "info"); return; }
    if(it.index === frontier() && nothingBlocked()){ showNote(X.practice_need_recording, 6000, "info"); return; }
    if(!canNothing(it)) return;
    it.response = "nothing_to_add"; it.nothing_to_add_wall_ms = Date.now(); TA.last_answered_id = it.item_id; ev("nothing_to_add");
    Persist.saveNow(); advance();
  };

  // ---- microphone ----
  /* Resolves true when the mic is available. After repeated failures the participant
     may continue without it (every item then needs Nothing to add; logged), so a
     broken microphone can never trap them on this screen. */
  var micFails = 0;
  function ensureMic(){
    if(TA.no_mic) return Promise.resolve(false);
    if(mic.stream && mic.stream.active) return Promise.resolve(true);
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function(s){
      mic.stream = s;
      try{ var AC = window.AudioContext || window.webkitAudioContext; mic.ac = new AC(); var src = mic.ac.createMediaStreamSource(s);
        mic.an = mic.ac.createAnalyser(); mic.an.fftSize = 1024; src.connect(mic.an); mic.buf = new Uint8Array(mic.an.fftSize); }catch(e){ mic.an = null; }
      return true;
    }).catch(function(e){
      micFails++;
      TA.mic_errors.push({ wall_ms: Date.now(), error: (e && e.name) || String(e) }); ev("mic_error", { error: (e && e.name) || String(e) });
      var buttons = [{ label: "Try again", value: "retry", primary: true }];
      if(micFails >= 3) buttons.unshift({ label: "Continue without my microphone", value: "skip" });
      return uiModal({ title: "Microphone needed", html: "I cannot access your microphone. If your browser shows a blocked-microphone icon in the address bar, click it and choose Allow. Then press Try again.",
                       buttons: buttons }).then(function(v){
        if(v === "skip"){ TA.no_mic = true; ev("continued_without_mic"); return false; }
        return ensureMic();
      });
    });
  }
  function rms(){ if(!mic.an) return 0; mic.an.getByteTimeDomainData(mic.buf); var s = 0; for(var i = 0; i < mic.buf.length; i++){ var v = (mic.buf[i] - 128) / 128; s += v * v; } return Math.sqrt(s / mic.buf.length); }

  // ---- recording ----
  bRec.onclick = function(){
    var it = item(); if(!it) return;
    if(!it.watched){ showNote(X.watch_first, 4000, "info"); return; }
    if(!canRecord(it)) return;
    ensureMic().then(function(ok){
      if(!ok){ showNote("Your microphone is not available, so please choose Nothing to add for each item.", 6000, "warn"); return; }
      try{ if(mic.ac && mic.ac.state === "suspended") mic.ac.resume(); }catch(e){}
      var mr; try{ mr = new MediaRecorder(mic.stream, { audioBitsPerSecond: CONFIG.TA_AUDIO_BPS }); }
      catch(e0){ try{ mr = new MediaRecorder(mic.stream); }catch(e){ ev("recorder_error", { error: String(e) }); showNote("Recording is not available in this browser.", 6000, "warn"); return; } }
      TA.rec_seq = (TA.rec_seq || 0) + 1;
      var r = { rec_id: String(caseObj.id) + "_" + it.item_id + "_r" + TA.rec_seq, item_id: it.item_id, started_wall_ms: Date.now(),
                started_phase_ms: Date.now() - TA.phase_started_wall_ms, ended_wall_ms: null, duration_ms: null, mime: mr.mimeType || null,
                peak_rms: 0, silent: false, silence_prompts_ms: [], level_trace: [],
                transcription: { status: analyzed ? "pending" : "not_transcribed_practice" } };
      var ctx = { r: r, mr: mr, chunks: [], t0: performance.now(), lastSound: performance.now(), timer: null, it: it };
      R = ctx;
      mr.ondataavailable = function(e){ if(e.data && e.data.size) ctx.chunks.push(e.data); };
      mr.start(1000);
      r.mime = mr.mimeType || r.mime || null;   /* some browsers report the format only after start */
      mode = "recording"; ev("record_start", { rec_id: r.rec_id }); render();
      showNote(X.record_prompt, 0);
      var lastTrace = 0;
      R.timer = setInterval(function(){
        if(!R) return;
        var lv = rms(), now = performance.now(), el = now - R.t0;
        if(lv > R.r.peak_rms) R.r.peak_rms = lv;
        if(el - lastTrace >= 500){ lastTrace = el; R.r.level_trace.push(Math.round(lv * 1000) / 1000); }
        var t = document.getElementById("ta_rec_time"); if(t) t.textContent = mmss(el);
        var m = document.getElementById("ta_level"); if(m) m.style.width = Math.min(100, Math.round(lv * 600)) + "%";
        if(lv >= CONFIG.TA_SILENCE_RMS) R.lastSound = now;
        if(now - R.lastSound >= CONFIG.RTA_SILENCE_MS){
          R.lastSound = now; R.r.silence_prompts_ms.push(Math.round(el)); ev("silence_prompt", { rec_id: R.r.rec_id, at_ms: Math.round(el) });
          showNote(X.silence_prompt, 5000, "info"); setTimeout(function(){ if(R && mode === "recording") showNote(X.record_prompt, 0); }, 5000);
        }
      }, 100);
    });
  };
  bDone.onclick = function(){
    if(!R || mode !== "recording") return;
    var cur = R; mode = "saving"; render(); hideNote(); clearInterval(cur.timer);
    cur.mr.onstop = function(){
      var r = cur.r, it = cur.it; R = null;
      r.ended_wall_ms = Date.now(); r.duration_ms = r.ended_wall_ms - r.started_wall_ms;
      r.peak_rms = Math.round(r.peak_rms * 1000) / 1000;
      var blob = new Blob(cur.chunks, { type: r.mime || "audio/webm" });
      r.bytes = blob.size; r.requested_bps = CONFIG.TA_AUDIO_BPS;
      r.actual_bps = r.duration_ms ? Math.round(blob.size * 8000 / r.duration_ms) : null;
      if(CONFIG.TA_EXPORT_AUDIO && analyzed) AudioKeep.set(r.rec_id, blob);   /* in memory for the file; also in browser storage */
      it.recordings.push(r);
      ev("record_stop", { rec_id: r.rec_id, duration_ms: r.duration_ms, peak_rms: r.peak_rms });
      if(r.peak_rms < CONFIG.TA_MIC_DEAD_RMS){
        r.silent = true; r.transcription = { status: "not_transcribed_silent" }; ev("mic_dead", { rec_id: r.rec_id });
        mode = "ready"; render();
        uiModal({ title: "I did not hear anything", html: X.mic_dead, buttons: [{ label: "OK", value: true, primary: true }] });
        Persist.saveNow(); return;
      }
      if(it.response === "nothing_to_add"){ it.slip_fix_wall_ms = Date.now(); ev("slip_fix", { rec_id: r.rec_id }); }
      it.response = "recorded"; it.responded_wall_ms = Date.now(); TA.last_answered_id = it.item_id;
      if(analyzed){ Persist.putAudio(r.rec_id, blob); TQ.enqueue(r, blob, { caseId: caseObj.id, itemId: it.item_id }); }
      Persist.saveNow();
      mode = "ready"; advance();
    };
    try{ cur.mr.stop(); }catch(e){ cur.mr.onstop(); }
  };

  // ---- flow ----
  function advance(){
    render();
    var i = frontier();
    if(i < TA.items.length){
      /* "advancing": Record / Nothing to add stay disabled during the short gap, so a quick
         click cannot add a second recording to the item just finished */
      mode = "advancing"; render(); advanceTimer = setTimeout(function(){ select(i); }, 800); return; }
    mode = "idle"; render();
    showNote(taFmt(X.all_done_note, { finish: X.finish_button }), 0, "info");
  }
  bFinish.onclick = function(){
    if(nResponded() < TA.items.length || mode === "recording" || mode === "saving") return;
    uiModal({ title: X.finish_button, html: X.finish_confirm, buttons: [{ label: "Keep reviewing", value: false }, { label: "Finish", value: true, primary: true }] })
      .then(function(ok){ if(ok) finish(); });
  };
  function finish(){
    clearTimeout(advanceTimer);
    try{ Clip.teardown(); }catch(e){}
    try{ if(mic.stream) mic.stream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){}
    try{ if(mic.ac) mic.ac.close(); }catch(e){}
    document.removeEventListener("visibilitychange", onVis);
    TA.phase_ended_wall_ms = Date.now(); ev("finish");
    store.ta = TA;
    window.__rtaReplaying = false;
    document.body.classList.remove("ta-active");
    cleanupOverlays();
    Flow.markDone("ta:" + caseObj.id);
    jsPsych.finishTrial();
  }
  function onVis(){
    if(document.hidden){ ev("hidden"); if(mode === "playing"){ Clip.pause(); mode = "paused"; render(); } }
    else ev("visible");
  }
  document.addEventListener("visibilitychange", onVis);

  // ---- intro ----
  function startList(){
    TA.intro_done = true; render();
    select(Math.min(frontier(), TA.items.length - 1));
  }
  render();
  if(TA.intro_done){ ensureMic().then(startList); return; }
  var secs = Math.round(CONFIG.RTA_SILENCE_MS / 1000);
  var g = document.createElement("div"); g.id = "ta_intro";
  Object.assign(g.style, { position:"fixed", inset:"0", background:"rgba(15,23,42,.96)", color:"#fff", display:"flex", alignItems:"center",
    justifyContent:"center", zIndex:10007, font:"16px system-ui", textAlign:"left", padding:"0 24px" });
  g.innerHTML = '<div style="max-width:660px;line-height:1.7">'
    + '<h2 style="color:#ffd8a8;margin:0 0 14px">' + X.intro_title + '</h2>'
    + '<p style="margin:0 0 18px">' + taFmt(X.intro_body, { secs: secs }) + '</p>'
    + (analyzed ? '' : '<p style="margin:0 0 18px">' + taFmt(X.practice_intro_note, { n: Math.min(CONFIG.TA_PRACTICE_MAX_ITEMS, TA.items.length) }) + '</p>')
    + '<div style="background:rgba(255,216,168,.12);border:1px solid #ffd8a8;border-radius:10px;padding:14px 18px;margin:0 0 22px;font-size:15px">'
    + (analyzed ? "" : X.practice_prefix) + X.reasoning_reminder + '</div>'
    + '<button id="ta_intro_go" style="background:#1e8e4e;color:#fff;border:0;border-radius:8px;padding:12px 24px;font:700 15px system-ui;cursor:pointer">'
    + (analyzed ? X.start_button : X.start_button_practice) + '</button></div>';
  document.body.appendChild(g);
  ev("intro_shown");
  document.getElementById("ta_intro_go").onclick = function(){
    ensureMic().then(function(){ try{ if(mic.ac && mic.ac.state === "suspended") mic.ac.resume(); }catch(e){} g.remove(); ev("intro_done"); startList(); });
  };
}

/* =====================================================================
   CASE (TASK) TRIAL
   ===================================================================== */
let pendingCaseData = null, pendingRecon = null, pendingCaseEndT = null;

function submitCase(){
  pendingCaseEndT = nowRel();
  if(typeof removePop === "function"){ try{ removePop(); }catch(e){} }   // closes an open popup (logs pop_close) BEFORE the snapshot
  pendingCaseData = serializeCaseData();
  pendingRecon = { deltas: state.recon.deltas.slice(), cursor: state.recon.cursor.slice() };
  cleanupOverlays();
  jsPsych.finishTrial();
}

/* Banner Submit for REAL cases (practice ends via the walkthrough Continue). */
function addBannerSubmit(){
  if(isPractice()) return;
  var banner = document.querySelector("#app .banner");
  if(!banner || banner.querySelector(".case-submit")) return;
  var btn = document.createElement("button");
  btn.className = "case-submit";
  btn.textContent = "Submit case and continue";
  btn.style.cssText = "margin-left:auto;padding:10px 20px;background:#1e6bb8;color:#fff;border:none;border-radius:7px;font-weight:700;font-size:14px;cursor:pointer";
  banner.style.display = "flex"; banner.style.alignItems = "center";
  banner.appendChild(btn);
  btn.addEventListener("click", function(){
    // Required text fields (none are optional): the clinical impression, the
    // plan-level prioritization/goal/immediate boxes, and -- for every barrier
    // the participant chose to address -- its approach, method, and grading.
    var p = state.plan || {}, missing = [];
    if(!(state.synthesis.impression || "").trim()) missing.push("Write a clinical impression.");
    if(!(p.prioritization || "").trim())            missing.push("Complete the prioritization box.");
    if(!(p.goal || "").trim())                       missing.push("Complete the long-term goal box.");
    if(!(p.immediate || "").trim())                  missing.push("Complete the immediate-attention box.");
    var incompleteBars = (p.selectedBarrierIds || []).filter(function(id){
      var pb = (p.perBarrier || {})[id] || {};
      return !((pb.approach || "").trim() && (pb.method || "").trim() && (pb.grading || "").trim());
    });
    if(incompleteBars.length) missing.push("Fill approach, method, and grading for every barrier you're addressing (" + incompleteBars.length + " still incomplete).");
    if(missing.length){
      uiModal({ title: "Before you submit", html: "<p style=\"margin:0 0 8px\">Please complete the following before submitting this case:</p><ul style=\"margin:0;padding-left:20px\">"
        + missing.map(function(m){ return "<li>" + m + "</li>"; }).join("") + "</ul>", buttons: [{ label: "OK", value: true, primary: true }] });
      return;
    }
    uiModal({ title: "Submit this case?",
      html: "Submit this case and continue to the think-aloud? You will not be able to return to it.<br><br>Recorded so far:<br>"
        + state.occupations.length + " occupation(s)<br>" + state.entries.length + " support/barrier classification(s)<br>"
        + state.synthesis.desired_outcomes.length + " desired outcome(s)",
      buttons: [{ label: "Keep working", value: false }, { label: "Submit", value: true, primary: true }] })
      .then(function(ok){ if(ok) submitCase(); });
  });
}

function makeCaseTrial(caseObj){
  return {
    type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS",
    stimulus: '<div id="ot_mount"></div>',
    data: { trial_tag:"case", case_id:caseObj.id, case_role:caseObj.role, case_name:caseObj.name },
    on_load: function(){
      study.__guardUnload = true;
      mountAppInto("ot_mount");
      var rec = study.cases[caseObj.id] = study.cases[caseObj.id] || {};
      var res = (Flow.resume && Flow.resume.kind === "case" && String(Flow.resume.case_id) === String(caseObj.id)) ? Flow.resume : null;
      CASE = caseObj;
      if(res){
        Flow.resume = null;
        state = res.state; seq = res.seq || 0;
        caseStart = Date.now() - (res.last_t || 0);   // the case clock continues from the last saved moment: time away is skipped (and logged)
        rec.case_started_offset_ms = res.case_started_offset_ms; rec.viewport = res.viewport;
      } else {
        state = freshState(); seq = 0; beginCaseClock();
        /* FIX: this was previously recorded when the case ENDED (in on_finish), which
           shifted every session_offset_t in both streams by the case's duration. */
        rec.case_started_offset_ms = study.session_started_at_ms ? (Date.now() - study.session_started_at_ms) : null;
        rec.viewport = { w: window.innerWidth, h: window.innerHeight };
      }
      renderCase();
      if(res){
        state.entries.forEach(function(e){ e.range = e.loc ? rangeFromOffsets(e.loc) : null; });
        if(typeof refreshHighlights === "function") refreshHighlights();
        logEvent("session_resumed", { gap_wall_ms: Date.now() - (res.saved_wall_ms || Date.now()), resumed_at_t: res.last_t || 0 });
      }
      attachCursorSampling();     // cursor track (replay reconstruction only; not analyzed)
      setupWalkthrough();         // practice only (no-op for real cases)
      addBannerSubmit();          // real cases only
      Flow.live = function(){ return { kind:"case", case_id: caseObj.id, state: cloneForSave(state), seq: seq, last_t: nowRel(), saved_wall_ms: Date.now(),
                                       case_started_offset_ms: rec.case_started_offset_ms, viewport: rec.viewport }; };
      Persist.startAutosave(function(){ return state.log.length + ":" + state.recon.deltas.length + ":" + state.recon.cursor.length; });
      Persist.saveNow();
    },
    on_finish: function(data){
      var rec = study.cases[caseObj.id];
      rec.task = pendingCaseData; rec.recon = pendingRecon; rec.case_ended_t = pendingCaseEndT;
      data.case_started_offset_ms = rec.case_started_offset_ms;
      pendingCaseData = null; pendingRecon = null; pendingCaseEndT = null;
      Flow.markDone("case:" + caseObj.id);
    }
  };
}

/* =====================================================================
   EXPORT (schema ot_prof_reasoning_v2)
   v2 vs v1: rta is now the flattened think-aloud narration from the segmented
   protocol (same core fields: text, case_relative_t, session_offset_t, plus the
   item it belongs to); rta_items / rta_events / rta_phase / rta_gap_summary /
   rta_transcription_summary are new; case_started_offset_ms is now correct;
   entries carry occupation_ids[]; the old auto-pause fields are gone.
   ===================================================================== */
function taAnchor(it){ return it.kind === "pause" ? it.still_start_t : it.clip_end_t; }
function flattenNarration(ta, offset){
  var out = [];
  (ta && ta.items || []).forEach(function(it){
    var t = taAnchor(it);
    (it.recordings || []).forEach(function(r){
      var tr = r.transcription || {};
      if(tr.status !== "done") return;
      var chunks = (tr.chunks && tr.chunks.length) ? tr.chunks : [{ text: tr.text, timestamp: [0, null] }];
      chunks.forEach(function(ch, j){
        var txt = String(ch.text || "").trim(); if(!txt) return;
        out.push({ text: txt, case_relative_t: t, session_offset_t: (offset != null ? offset + t : null), paused: null, kind: "final",
                   item_id: it.item_id, item_index: it.index, item_kind: it.kind, action_kind: it.action ? it.action.kind : null,
                   clip_start_t: it.clip_start_t, clip_end_t: it.clip_end_t, rec_id: r.rec_id, chunk_index: j,
                   chunk_start_s: (ch.timestamp ? ch.timestamp[0] : null), chunk_end_s: (ch.timestamp ? ch.timestamp[1] : null),
                   recorded_wall_ms: r.started_wall_ms });
      });
    });
  });
  return out;
}
function transcriptionSummary(ta){
  var s = { n_recordings: 0, n_silent: 0, audio_ms: 0, by_status: {}, median_rtf: null };
  var rtfs = [];
  (ta && ta.items || []).forEach(function(it){ (it.recordings || []).forEach(function(r){
    s.n_recordings++; if(r.silent) s.n_silent++; s.audio_ms += (r.duration_ms || 0);
    var st = (r.transcription && r.transcription.status) || "none"; s.by_status[st] = (s.by_status[st] || 0) + 1;
    if(r.transcription && r.transcription.rtf != null) rtfs.push(r.transcription.rtf); }); });
  if(rtfs.length){ rtfs.sort(function(a, b){ return a - b; }); var m = Math.floor(rtfs.length / 2); s.median_rtf = rtfs.length % 2 ? rtfs[m] : (rtfs[m - 1] + rtfs[m]) / 2; }
  return s;
}
function exportItems(ta, audio){
  return (ta && ta.items || []).map(function(it){
    var c = JSON.parse(JSON.stringify(it, function(k, v){ return (k === "audio_b64") ? undefined : v; }));
    if(audio && audio.map) (c.recordings || []).forEach(function(r){ if(audio.map[r.rec_id]) r.audio_b64 = audio.map[r.rec_id]; });
    c.anchor_t = taAnchor(it); return c;
  });
}
function liveOf(kind, caseId){ try{ var l = Flow.live ? Flow.live() : null; return (l && l.kind === kind && String(l.case_id) === String(caseId)) ? l : null; }catch(e){ return null; } }
function caseExport(c, audio){
  var rec = study.cases[c.id] || {};
  var ta = rec.ta || (liveOf("ta", c.id) || {}).ta || null;
  var task = rec.task || null;
  if(!task){ var lc = liveOf("case", c.id); if(lc){ try{ task = Object.assign(serializeCaseData(), { in_progress: true }); }catch(e){ task = null; } } }   /* an export must never throw */
  var off = rec.case_started_offset_ms != null ? rec.case_started_offset_ms : null;
  return {
    case_id: c.id, case_role: c.role, case_name: c.name, analyzed: (c.role !== "Practice"),
    completed: { task: Flow.done.indexOf("case:" + c.id) >= 0, think_aloud: Flow.done.indexOf("ta:" + c.id) >= 0 },
    case_started_offset_ms: off, case_ended_t: rec.case_ended_t != null ? rec.case_ended_t : null, task_viewport: rec.viewport || null,
    task: task,                                                    // Stream 1: event_log + descriptive state
    rta: ta ? flattenNarration(ta, off) : [],                      // Stream 2: think-aloud narration, anchored per item
    rta_items: ta ? exportItems(ta, audio) : [],
    rta_events: ta ? ta.events : [],
    rta_phase: ta ? { format: ta.format, started_wall_ms: ta.phase_started_wall_ms, ended_wall_ms: ta.phase_ended_wall_ms,
                      duration_ms: (ta.phase_ended_wall_ms && ta.phase_started_wall_ms) ? ta.phase_ended_wall_ms - ta.phase_started_wall_ms : null,
                      intro_done: !!ta.intro_done, no_mic: !!ta.no_mic, mic_errors: ta.mic_errors || [],
                      order_enforced: true, items_available: ta.items_available != null ? ta.items_available : (ta.items || []).length,
                      n_slip_fixes: (ta.items || []).filter(function(i){ return i.slip_fix_wall_ms != null; }).length,
                      n_reopened_after_reload: (ta.items || []).filter(function(i){ return i.reopened_after_reload; }).length,
                      n_locked_clicks: (ta.events || []).filter(function(e){ return e.type === "locked_click"; }).length } : null,
    rta_gap_summary: ta ? ta.gap_summary : null,
    rta_transcription_summary: ta ? transcriptionSummary(ta) : null
  };
}
/* audio: result of collectExportAudio() (omit for no audio) */
function buildSessionExport(kind, audio){
  return {
    schema: "ot_prof_reasoning_v2",
    export_kind: kind || "final",
    study_id: study.sub_id_from_url || null,
    generated_at: new Date().toISOString(),
    session: {
      started_at: study.started_at, user_agent: study.user_agent,
      session_started_at_ms: study.session_started_at_ms,
      group: study.group, year_in_program: study.year_in_program, url_params: study.url_params,
      task_viewport: study.task_viewport, browser_check: study.browser_check, permissions: study.permissions,
      test_mode: TEST_NOMIC ? { test_nomic: true } : null,
      resumes: study.resumes || [], checkpoint_downloaded_wall_ms: study.checkpoint_downloaded_wall_ms || null, checkpoint_bytes: study.checkpoint_bytes || null,
      steps_done: Flow.done.slice(),
      audio_export: audio ? audio.stats : null,
      autosave: { enabled: Persist.enabled, saves: Persist.saveStats.n, max_blocking_ms: Persist.saveStats.maxSyncMs, failures: Persist.saveStats.failures },
      think_aloud: { format: "segmented_cued_retrospective_v1", pause_threshold_ms: CONFIG.TA_PAUSE_MS, final_min_ms: CONFIG.TA_FINAL_MIN_MS,
                     include: CONFIG.TA_INCLUDE, preroll_ms: Clip.PREROLL_MS, silence_reminder_ms: CONFIG.RTA_SILENCE_MS,
                     silence_rms: CONFIG.TA_SILENCE_RMS, mic_dead_rms: CONFIG.TA_MIC_DEAD_RMS, audio_exported: !!CONFIG.TA_EXPORT_AUDIO, audio_bps: CONFIG.TA_AUDIO_BPS,
                     practice_max_items: CONFIG.TA_PRACTICE_MAX_ITEMS, practice_min_recordings: CONFIG.TA_PRACTICE_MIN_RECORDINGS,
                     pending_audio_persisted: !!CONFIG.TA_PERSIST_PENDING_AUDIO, transcription_model: TQ.model(),
                     transcribe_timeout_min_ms: CONFIG.TA_TRANSCRIBE_TIMEOUT_MIN_MS, transcribe_timeout_x: CONFIG.TA_TRANSCRIBE_TIMEOUT_X }
    },
    cases: CASES_IN_ORDER.map(function(c){ return caseExport(c, audio); })
    /* NOTE: state.recon (deltas + cursor) is intentionally NOT exported. */
  };
}
function qualtricsUrl(){
  var qBase = CONFIG.QUALTRICS_UPLOAD_URL;
  if(!qBase || qBase.indexOf("REPLACE") >= 0) return null;
  return study.sub_id_from_url ? qBase + (qBase.indexOf("?") >= 0 ? "&" : "?") + "sub_id=" + encodeURIComponent(study.sub_id_from_url) : qBase;
}

/* ---------- CHECKPOINT (after Case 1's think-aloud) ---------- */
function makeCheckpointTrial(){
  return {
    type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS", stimulus: "<div></div>", data: { trial_tag: "checkpoint" },
    on_load: function(){
      Flow.live = null;
      var X = CONFIG.TA_TEXT, q = qualtricsUrl();
      var fname = "ot_session_" + (study.sub_id_from_url || "anon") + "_checkpoint_" + Date.now() + ".json";
      var el = jsPsych.getDisplayElement();
      el.innerHTML = '<div style="max-width:660px;margin:6% auto;font-family:system-ui;color:#17232e;text-align:left;padding:0 22px;line-height:1.6">'
        + '<h2 style="color:#1565c0;margin:0 0 10px">' + X.checkpoint_title + '</h2>'
        + '<p style="font-size:16px;margin:0 0 18px">' + X.checkpoint_body + '</p>'
        + '<button id="cp_dl" disabled style="opacity:.6;background:#1e8e4e;color:#fff;border:0;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer">Download my progress file</button>'
        + '<p id="cp_done" style="display:none;margin:10px 0 0;color:#16692f;font-weight:700">Downloaded.</p>'
        + '<p id="cp_big" style="display:none;margin:12px 0 0;color:#9a3412;font-weight:600">' + X.file_too_large + '</p>'
        + (q ? '<p style="margin:22px 0 0;font-size:14px"><a href="' + q + '" target="_blank" rel="noopener">' + X.checkpoint_upload_link + '</a></p>' : '')
        + '<div style="margin-top:26px"><button id="cp_go" disabled style="background:#1565c0;color:#fff;border:0;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;opacity:.45;cursor:not-allowed">Continue to Case 2</button></div>'
        + '</div>';
      var go = document.getElementById("cp_go");
      var cpAudio = null, cpBtn = document.getElementById("cp_dl");
      collectExportAudio().then(function(a){ cpAudio = a; }, function(){ cpAudio = null; }).then(function(){ cpBtn.disabled = false; cpBtn.style.opacity = "1"; });
      cpBtn.onclick = function(){
        if(cpBtn.disabled) return;
        var cpPayload = buildSessionExport("checkpoint", cpAudio), cpBytes = new Blob([JSON.stringify(cpPayload)]).size;
        study.checkpoint_bytes = cpBytes;
        if(cpBytes > CONFIG.UPLOAD_WARN_BYTES) document.getElementById("cp_big").style.display = "block";
        downloadJSON(cpPayload, fname);
        study.checkpoint_downloaded_wall_ms = Date.now();
        document.getElementById("cp_done").style.display = "block";
        go.disabled = false; go.style.opacity = "1"; go.style.cursor = "pointer";
      };
      go.onclick = function(){ if(go.disabled) return; Flow.markDone("checkpoint"); jsPsych.finishTrial(); };
    }
  };
}

/* ---------- FINAL EXPORT ---------- */
function makeExportTrial(){
  return {
    type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS", stimulus: "<div></div>", data: { trial_tag: "export" },
    on_load: function(){
      Flow.live = null;
      study.__fsActive = false;   // study over: stop guarding fullscreen
      var fsr = document.getElementById("fs_return"); if(fsr) fsr.remove();
      cleanupOverlays();
      var el = jsPsych.getDisplayElement();
      var wrap = '<div style="max-width:660px;margin:5% auto;font-family:system-ui;color:#17232e;text-align:left;padding:0 22px;line-height:1.6">';
      // Wait for any recordings still being transcribed (with progress), then offer the file.
      el.innerHTML = wrap + '<h2 style="color:#1565c0;margin:0 0 6px">You have finished both cases. Thank you.</h2>'
        + '<p id="ex_wait" style="font-size:16px">Preparing your session file...</p></div>';
      var start = Date.now();
      TQ.waitIdle(CONFIG.TA_FINAL_WAIT_MAX_MS, function(left){
        var w = document.getElementById("ex_wait");
        if(w) w.innerHTML = left ? ("Preparing your session file: still processing <b>" + left + "</b> of your recordings. This can take a few minutes. Please keep this tab open.")
                                 : "Preparing your session file...";
      }).then(function(allDone){ study.final_wait_ms = Date.now() - start; study.final_wait_complete = allDone;
        return collectExportAudio().then(null, function(){ return null; }); }).then(function(a){ showDownload(a); });

      function showDownload(audio){
        var payload = buildSessionExport("final", audio);
        var fname = "ot_session_" + (study.sub_id_from_url || "anon") + "_" + Date.now() + ".json";
        var fileBlob = new Blob([JSON.stringify(payload)], { type: "application/json" }), tooBig = fileBlob.size > CONFIG.UPLOAD_WARN_BYTES;
        study.final_bytes = fileBlob.size; if(DEV) console.log("[export] final file bytes", fileBlob.size);
        var url = URL.createObjectURL(fileBlob);
        var qUrl = qualtricsUrl(), qConfigured = !!qUrl;
        el.innerHTML = wrap
          + '<h2 style="color:#1565c0;margin:0 0 6px">You have finished both cases. Thank you.</h2>'
          + '<p style="font-size:16px;margin:0 0 20px">One step completes your participation: download your session file below.'
          + (qConfigured ? ' You will then be returned to the survey automatically to upload it.' : '')
          + ' Please do not close this tab until you have uploaded your file.</p>'
          + '<div style="background:#eef4fb;border:1px solid #cfe0f2;border-radius:10px;padding:16px 18px;margin:0 0 16px">'
          +   '<p style="margin:0 0 6px;font-weight:700;color:#12507f">Download your session file</p>'
          +   '<p style="margin:0 0 12px;font-size:15px">Click the green button. A file named <strong>' + fname + '</strong> will be saved to your computer (usually your Downloads folder). Remember where it goes - you will upload it to the survey.</p>'
          +   '<a id="dl" href="' + url + '" download="' + fname + '" style="display:inline-block;background:#1e8e4e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px">Download my session file</a>'
          +   '<p id="dl_done" style="display:none;margin:10px 0 0;color:#16692f;font-weight:700">Downloaded.</p>'
          +   (tooBig ? '<p id="dl_big" style="margin:12px 0 0;color:#9a3412;font-weight:600">' + CONFIG.TA_TEXT.file_too_large + '</p>' : '')
          + '</div>'
          + '<div style="background:#f6f8fa;border:1px solid #dfe6ec;border-radius:10px;padding:16px 18px;margin:0 0 20px">'
          +   (qConfigured
                ? '<p id="return_msg" style="margin:0;font-size:15px;color:#12507f">After you download the file, you will be returned to the survey automatically, where you will be asked to upload it (<strong>' + fname + '</strong>).</p>'
                : '<p style="margin:0;color:#c0392b;font-weight:600">[Survey return URL not set yet - configure CONFIG.QUALTRICS_UPLOAD_URL. Your downloaded file is still saved.]</p>')
          + '</div>'
          + '<p style="font-size:13px;color:#7a8894">If the download did not start, click the green button again. If you cannot find the file, check your Downloads folder for <strong>' + fname + '</strong>.</p>'
          + '</div>';
        var dl = document.getElementById("dl"), dlDone = document.getElementById("dl_done"), returning = false;
        function startReturnCountdown(){
          if(returning || !qConfigured) return; returning = true;
          var msg = document.getElementById("return_msg"), n = Math.max(1, Math.round(CONFIG.QUALTRICS_RETURN_DELAY_S || 5));
          (function tick(){
            if(n <= 0){ study.__guardUnload = false; Persist.markCompleted().then(function(){ window.location.href = qUrl; }, function(){ window.location.href = qUrl; }); return; }
            if(msg) msg.innerHTML = 'Returning you to the survey in <strong>' + n + '</strong> second' + (n === 1 ? '' : 's') + ' to upload your file. If the download did not start, click the green button again.';
            n -= 1; setTimeout(tick, 1000);
          })();
        }
        if(dl) dl.addEventListener("click", function(){ if(dlDone) dlDone.style.display = "block"; if(!qConfigured) study.__guardUnload = false; startReturnCountdown(); });
      }
    }
  };
}

/* =====================================================================
   STARTUP: check for saved progress, then build the remaining timeline.
   The intro steps (full screen, browser check, microphone, speech model)
   always run, including on resume (full screen needs a fresh click).
   ===================================================================== */
function buildTimeline(resuming){
  if(TEST_NOMIC){
    for(var k = timeline.length - 1; k >= 0; k--){ var tg = timeline[k] && timeline[k].data && timeline[k].data.trial_tag;
      if(tg === "permission_gate_microphone" || tg === "init_microphone") timeline.splice(k, 1); }
    study.permissions = study.permissions || {}; study.permissions.microphone = { state: "skipped_test_mode", t: new Date().toISOString() };
    var tb = document.createElement("div"); tb.id = "test_mode_banner"; tb.textContent = "TEST MODE: no microphone. Not for participants.";
    Object.assign(tb.style, { position:"fixed", left:"8px", top:"8px", zIndex:2147483000, background:"#b91c1c", color:"#fff",
      font:"700 12px system-ui", padding:"4px 8px", borderRadius:"5px", pointerEvents:"none", opacity:".9" });
    document.body.appendChild(tb);
  }
  if(resuming) timeline.unshift(makeResumeNoticeTrial());
  CASES_IN_ORDER.forEach(function(c){
    if(Flow.done.indexOf("case:" + c.id) < 0) timeline.push(makeCaseTrial(c));
    if(Flow.done.indexOf("ta:" + c.id) < 0) timeline.push(makeThinkAloudTrial(c));
    if(String(c.id) === String(CONFIG.CHECKPOINT_AFTER_CASE_ID) && Flow.done.indexOf("checkpoint") < 0) timeline.push(makeCheckpointTrial());
  });
  timeline.push(makeExportTrial());
}
Persist.init(study.sub_id_from_url).then(function(snap){
  if(snap){ restoreFromSnapshot(snap); requeuePendingTranscriptions(); }
  buildTimeline(!!snap);
  jsPsych.run(timeline);
});
