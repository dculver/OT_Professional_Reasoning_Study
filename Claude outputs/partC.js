/* =====================================================================
   CHUNK 2 + 3 + 4 INTEGRATION LAYER  (no eye tracking)
   Mounts the Option-B engine (above) as jsPsych trials, adds the RTA
   reconstruction-replay trial after each case (mic + Whisper + re-anchor),
   and the one-file Chunk 4 export. Two analyzed streams: action+content and
   RTA. No WebGazer, no calibration, no gaze capture. Uses window.Reanchor.
   ===================================================================== */

CONFIG.RTA_SILENCE_MS = 15000;   /* OPEN a-priori parameter (placeholder). */

/* =====================================================================
   RTA SPEECH-TRIGGERED AUTO-PAUSE + PAUSE INSTRUMENTATION  (rta_autopause_spec)
   All participant-facing values below are exposed as NAMED CONSTANTS and are
   DECISIONS OWNED BY DENNIS -- the defaults are the spec's proposed starting
   values, not finalized choices. Sign-off items are tagged  <<SIGN-OFF>>.
   ===================================================================== */
CONFIG.RTA_AUTOPAUSE_ENABLED    = true;    /* master switch for speech-triggered auto-pause */
CONFIG.RTA_AUTOPAUSE_CONFIRM_MS = 400;     /* <<SIGN-OFF>> confirm window: speech must persist this long
                                              past onset for a provisional pause to CONFIRM (else rescind).
                                              Spec A3 proposed default; pilot-tune against real audio. */
CONFIG.RTA_CLOCK_SAMPLE_MS      = 50;      /* <<SIGN-OFF>> playback-position ring-buffer cadence (spec A2). */
CONFIG.RTA_VAD_ONSET_BACKDATE_MS= 64;      /* onset estimate = detector-fire wall minus this (one Silero
                                              frame ~32ms + pre-speech pad). Logged raw so latency is
                                              characterizable (spec A2/C1); not a data-defining choice. */
CONFIG.RTA_ENERGY_GATE          = 0.04;    /* RMS threshold for the ENERGY fallback detector (no Silero). */
/* <<SIGN-OFF>> The prompt shown when the replay pauses (manual OR confirmed auto-pause).
   NOTE / DISCREPANCY: the current build shows NO prompt on a manual pause -- it only
   freezes the replay. The spec ("the same prompt a manual pause produces") assumes a
   prompt exists, so this ADDS one on both routes. Wording is a draft for your approval. */
CONFIG.RTA_PAUSE_PROMPT         = "Go ahead — explain what you were thinking here. Press Resume when you're ready to continue.";
/* <<SIGN-OFF>> The uniform announcement shown before the RTA replay begins (spec A6). Draft. */
CONFIG.RTA_AUTOPAUSE_ANNOUNCE   = "As your session plays back, the replay will stop on its own whenever you start talking, so you can explain your thinking. You can also stop it yourself at any time with the Pause button. When you're done speaking, press Resume to continue.";

const CASES_IN_ORDER = [PATRICIA, FLORENCE, YVONNE];

/* Per-case captured records assembled for the final export. Keyed by case id. */
study.cases = {};

/* ---------- FULLSCREEN GUARDIAN ----------
   Fullscreen can drop mid-study (Esc, a native dialog, a permission prompt). Re-
   entering requires a user gesture, so if we detect an exit while the study is
   live, show a blocking "return to full screen" panel with a button. */
function installFullscreenGuardian(){
  if(window.__fsGuardInstalled) return; window.__fsGuardInstalled = true;
  function isFs(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function reqFs(){ const el=document.documentElement; const fn=el.requestFullscreen||el.webkitRequestFullscreen;
    if(fn){ try{ const p=fn.call(el); if(p&&p.catch) p.catch(function(){}); }catch(e){} } }
  function overlay(show){
    let o=document.getElementById("fs_return");
    if(show){
      if(!o){ o=document.createElement("div"); o.id="fs_return";
        Object.assign(o.style,{position:"fixed",inset:"0",background:"#0f172a",color:"#fff",zIndex:2147483000,
          display:"flex",alignItems:"center",justifyContent:"center",font:"16px system-ui",textAlign:"left",padding:"0 24px"});
        o.innerHTML='<div style="max-width:520px;line-height:1.7">'
          +'<h2 style="color:#93c5fd;margin:0 0 12px">Please return to full screen</h2>'
          +'<p style="margin:0 0 20px">This study runs in full screen so the whole interface fits. Your progress is saved — click below to continue.</p>'
          +'<button id="fs_return_btn" style="background:#1565c0;color:#fff;border:0;border-radius:8px;padding:12px 26px;font:700 15px system-ui;cursor:pointer">Return to full screen</button></div>';
        document.body.appendChild(o);
        document.getElementById("fs_return_btn").onclick=reqFs;
      }
      o.style.display="flex";
    } else if(o){ o.style.display="none"; }
  }
  document.addEventListener("fullscreenchange", function(){ if(study.__fsActive) overlay(!isFs()); });
  document.addEventListener("webkitfullscreenchange", function(){ if(study.__fsActive) overlay(!isFs()); });
}

/* Fresh #app host inside a trial's #ot_mount (engine renders into #app). */
function mountAppInto(hostId){
  const host = document.getElementById(hostId);
  host.innerHTML = '<div id="app"></div>';
  return host;
}

/* Analyzed data only (event_log + descriptive state). Recon is NOT included. */
function serializeCaseData(){
  return {
    case_id:CASE.id, case_role:CASE.role, case_name:CASE.name,
    synthesis:{
      impression:state.synthesis.impression,
      impression_last_edit:state.synthesis.impression_stamp,
      impression_revisions:state.synthesis.impression_revisions,
      desired_outcomes:state.synthesis.desired_outcomes.map(o=>({id:o.id, text:o.text, otpf4_outcome_type:o.otpf4_outcome_type, ts:o.ts}))
    },
    occupations:state.occupations,
    entries:state.entries.map(e=>({id:e.id, type:e.type, excerpt:e.excerpt, provenance_src:e.src, mechanism:e.mechanism, otpf4_aspect:e.aspect, occupation_id:e.occId, ts:e.ts})),
    intervention_plan:state.plan,
    event_log:state.log
  };
}

/* Remove any body-appended engine overlays so they never bleed between trials. */
function cleanupOverlays(){
  if(typeof removePop==="function"){ try{ removePop(); }catch(e){} }
  if(typeof removeCoach==="function"){ try{ removeCoach(); }catch(e){} }
  const cl = document.getElementById("cl"); if(cl) cl.remove();
  document.querySelectorAll(".pop,.coach,#rp_hud,#rp_cursor,#rp_net,#rp_continue,#rp_busy,#rp_pop,#rp_empty").forEach(el=>el.remove());
  if(window.CSS && CSS.highlights){ CSS.highlights.clear(); }
}

/* ---------- TASK TRIAL ---------- */
let pendingCaseData=null, pendingRecon=null;

function submitCase(){
  pendingCaseData = serializeCaseData();
  pendingRecon = { deltas: state.recon.deltas.slice(), cursor: state.recon.cursor.slice() };
  cleanupOverlays();
  jsPsych.finishTrial();
}

/* Banner Submit for REAL cases (practice ends via the walkthrough Continue). */
function addBannerSubmit(){
  if(isPractice()) return;
  const banner = document.querySelector("#app .banner");
  if(!banner || banner.querySelector(".case-submit")) return;
  const btn = document.createElement("button");
  btn.className = "case-submit";
  btn.textContent = "Submit case and continue";
  btn.style.cssText = "margin-left:auto;padding:10px 20px;background:#1e6bb8;color:#fff;border:none;border-radius:7px;font-weight:700;font-size:14px;cursor:pointer";
  banner.style.display = "flex"; banner.style.alignItems = "center";
  banner.appendChild(btn);
  btn.addEventListener("click", ()=>{
    // Required text fields (none are optional): the clinical impression, the
    // plan-level prioritization/goal/immediate boxes, and -- for every barrier
    // the participant chose to address -- its approach, method, and grading.
    const p = state.plan || {};
    const missing = [];
    if(!(state.synthesis.impression||"").trim()) missing.push("Write a clinical impression.");
    if(!(p.prioritization||"").trim())            missing.push("Complete the prioritization box.");
    if(!(p.goal||"").trim())                       missing.push("Complete the long-term goal box.");
    if(!(p.immediate||"").trim())                  missing.push("Complete the immediate-attention box.");
    const incompleteBars = (p.selectedBarrierIds||[]).filter(id=>{
      const pb = (p.perBarrier||{})[id] || {};
      return !((pb.approach||"").trim() && (pb.method||"").trim() && (pb.grading||"").trim());
    });
    if(incompleteBars.length) missing.push("Fill approach, method, and grading for every barrier you're addressing (" + incompleteBars.length + " still incomplete).");
    if(missing.length){
      window.alert("Please complete the following before submitting this case:\n\n• " + missing.join("\n• "));
      return;
    }
    const ok = window.confirm(
      "Submit this case and continue to the replay? You will not be able to return to it.\n\n" +
      "Recorded so far:\n" +
      "  " + state.occupations.length + " occupation(s)\n" +
      "  " + state.entries.length + " support/barrier classification(s)\n" +
      "  " + state.synthesis.desired_outcomes.length + " desired outcome(s)");
    if(ok) submitCase();
  });
}

function makeCaseTrial(caseObj){
  return {
    type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS",
    stimulus: '<div id="ot_mount"></div>',
    data: { trial_tag:"case", case_id:caseObj.id, case_role:caseObj.role, case_name:caseObj.name },
    on_load: function(){
      mountAppInto("ot_mount");
      CASE = caseObj; state = freshState(); seq = 0; beginCaseClock();
      renderCase();
      attachCursorSampling();     // cursor track (replay reconstruction only; not analyzed)
      setupWalkthrough();         // practice only (no-op for real cases)
      addBannerSubmit();          // real cases only
    },
    on_finish: function(data){
      if(pendingCaseData){ data.case_data = pendingCaseData; }
      data.case_started_offset_ms = study.session_started_at_ms ? (Date.now() - study.session_started_at_ms) : null;
      const rec = study.cases[caseObj.id] = study.cases[caseObj.id] || {};
      rec.task = pendingCaseData;
      rec.case_started_offset_ms = data.case_started_offset_ms;
      rec.recon = pendingRecon;          // replay-only; NEVER exported
      pendingCaseData = null; pendingRecon = null;
    }
  };
}

/* ---------- WHISPER (post-replay transcription) ---------- */
/* Decode a recorded audio Blob to 16 kHz mono Float32 for the Whisper worker. */
function pcm16kFromBlob(blob){
  return blob.arrayBuffer().then(buf=>{
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    return ac.decodeAudioData(buf).then(audio=>{
      try{ ac.close && ac.close(); }catch(e){}
      const rate = 16000;
      const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(audio.duration*rate)), rate);
      const src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start(0);
      return off.startRendering().then(rendered=>rendered.getChannelData(0));
    });
  });
}
let __whisperSeq = 0;
/* Returns { text, chunks:[{text, timestamp:[s,e]}] }. Robust to a missing/failed
   worker (resolves empty) so the study never blocks on transcription. */
function transcribeAudio(float32){
  const S = (s)=>{ if(window.setWhisperStatus) window.setWhisperStatus(s); };
  return new Promise((resolve)=>{
    if(typeof __whisperWorker === "undefined" || !__whisperWorker){ S('error'); resolve({text:"", chunks:[]}); return; }
    let done=false; const id = ++__whisperSeq;
    const settle=(data)=>{ if(done) return; done=true; resolve({ text:(data&&data.text)||"", chunks:(data&&data.chunks)||[] }); };
    S('transcribing');
    window.__onWhisperResult = (data)=>{ const t=(data&&data.text)||""; S(t&&t.trim()?'transcribed':'empty'); settle(data); };
    window.__onWhisperError  = ()=>{ S('error'); settle({text:"", chunks:[]}); };   // worker/model failure -> resolve empty, never hang
    try{ __whisperWorker.postMessage({ type:'transcribe', audioData:float32, id }); }
    catch(e){ S('error'); settle({text:"", chunks:[]}); }
    setTimeout(()=>{ S('error'); settle({text:"", chunks:[]}); }, 180000);
  });
}

/* ---------- RTA REPLAY: show the raw text selection (highlighting) ----------
   Every >=3-char selection opens the classify popup, captured as pop_open with a
   loc. We paint that selected text during the popup-open window so the participant
   sees themselves highlighting text even when they never classify it. */
var __selHL = (typeof Highlight!=="undefined") ? new Highlight() : null;
function ensureSelReg(){
  try{
    if(__selHL && window.CSS && CSS.highlights){ CSS.highlights.set("ot-selection", __selHL);
      if(!document.getElementById("rp_sel_style")){ var s=document.createElement("style"); s.id="rp_sel_style";
        s.textContent="::highlight(ot-selection){background-color:#bcd4ff;}"; document.head.appendChild(s); } }
  }catch(e){}
}
/* Follow the participant's focus: gently scroll the field they just touched into
   view within its panel, so edits below the fold aren't missed on replay. */
function replayFollowActive(recon, tMs){
  try{
    var last=null;
    for(var i=0;i<recon.deltas.length;i++){ var d=recon.deltas[i]; if(d.t>tMs) break; last=d; }
    if(!last) return;
    var sel=null;
    switch(last.op){
      case "impression": sel="#synthesis_impression"; break;
      case "plan_field": sel = last.field==="goal"?"#ip_goal":last.field==="immediate"?"#ip_immediate":last.field==="prioritization"?"#ip_prioritization":null; break;
      case "plan_barrier": sel='[data-bid="'+last.bid+'"][data-f="'+last.field+'"]'; break;
      case "occ_add": case "occ_input": sel="#occ_input"; break;
      case "occ_desc_input": sel="#occ_desc"; break;
    }
    if(sel){ var el=document.querySelector(sel); if(el && el.scrollIntoView){ el.scrollIntoView({block:"nearest", inline:"nearest"}); } }
  }catch(e){}
}

/* ---------- RTA REPLAY: reconstruct the transient classify popup ----------
   The classify popup (highlight -> Support/Barrier -> mechanism -> OTPF-4 aspect
   -> occupation -> confirm) is captured as pop_* deltas during the task. Here we
   fold them back into the popup's visible state at time t and render a NON-
   interactive replica, so the participant re-sees (and can narrate) the actual
   classification decision, not just its result. */
function popupAt(recon, tMs){
  let p = null;
  for(const d of recon.deltas){
    if(d.t > tMs) break;
    switch(d.op){
      case "pop_open":   p = { excerpt:d.excerpt, src:d.src, loc:d.loc, step:"choice",
                               valence:null, mech:"", aspect:"", occId:"" }; break;
      case "pop_choice": if(p){ p.valence=d.valence; p.step="mech"; } break;
      case "pop_back":   if(p){ p.step="choice"; } break;
      case "pop_mech":   if(p){ p.mech=d.value; } break;
      case "pop_aspect": if(p){ p.aspect=d.value; } break;
      case "pop_occ":    if(p){ p.occId=d.occId; } break;
      case "pop_close":  p = null; break;
      case "entry_add":  p = null; break;   // confirming a classification closes the popup
    }
  }
  return p;
}
function renderReplayPopup(recon, tMs){
  const p = popupAt(recon, tMs);
  let el = document.getElementById("rp_pop");
  if(!p){ if(el) el.remove(); try{ if(__selHL) __selHL.clear(); }catch(e){} return; }
  if(!el){ el=document.createElement("div"); el.id="rp_pop"; el.className="pop"; document.body.appendChild(el); }
  el.style.pointerEvents="none"; el.style.zIndex="10001";
  const _esc = (typeof esc==="function") ? esc : (s)=>String(s==null?"":s);
  if(p.step==="choice" && typeof choiceStep==="function"){
    el.innerHTML = choiceStep(p.excerpt);
  } else {
    const isBar = p.valence==="barrier";
    const mechQ = isBar ? "What is getting in the way of this occupation?" : "What capacity or resource enables this?";
    const occQ  = isBar ? "A barrier to which occupation?" : "This supports which occupation?";
    let occName = "";
    try{ const o=(state.occupations||[]).find(x=>x.id===p.occId); occName = o?o.name:""; }catch(e){}
    el.innerHTML =
      '<div class="q">'+mechQ+'</div>'
      + '<input type="text" value="'+_esc(p.mech||"")+'" disabled />'
      + '<div class="q">'+occQ+'</div>'
      + '<select disabled>'+(occName? '<option>'+_esc(occName)+'</option>' : '<option>— select occupation —</option>')+'</select>'
      + '<button class="confirm" disabled>'+(isBar?'Add barrier':'Add support')+'</button>';
  }
  // Position at the source text's current rect (the source tab is active while the
  // popup is open). Fall back to a fixed corner if the range can't be resolved.
  try{
    const r = (p.loc && typeof rangeFromOffsets==="function") ? rangeFromOffsets(p.loc) : null;
    // paint the raw selection (highlighting) for the whole popup-open window
    try{ if(__selHL){ __selHL.clear(); if(r) __selHL.add(r); ensureSelReg(); } }catch(e){}
    const rect = r ? r.getBoundingClientRect() : null;
    if(rect && (rect.width||rect.height)){
      const w=el.offsetWidth||290, h=el.offsetHeight||170, pad=10;
      let left=rect.left+rect.width/2-w/2, top=rect.bottom+8;
      if(top+h>window.innerHeight-pad) top=rect.top-h-8;
      left=Math.max(pad,Math.min(left,window.innerWidth-w-pad)); top=Math.max(pad,top);
      el.style.left=left+"px"; el.style.top=top+"px";
    } else { el.style.left="40px"; el.style.top="120px"; }
  }catch(e){ el.style.left="40px"; el.style.top="120px"; }
}

/* ---------- RTA RECONSTRUCTION-REPLAY TRIAL ---------- */
function makeReplayTrial(caseObj){
  return {
    type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS",
    stimulus: '<div id="ot_mount"></div>',
    data: { trial_tag:"rta_replay", case_id:caseObj.id, case_role:caseObj.role, case_name:caseObj.name },
    on_load: function(){
      const store = study.cases[caseObj.id] || (study.cases[caseObj.id] = {});
      const rec = store.recon || { deltas:[], cursor:[] };
      const offset = store.case_started_offset_ms != null ? store.case_started_offset_ms : null;

      mountAppInto("ot_mount");
      CASE = caseObj; state = freshState(); seq = 0;
      walk = null;   // no practice walkthrough during replay
      const __cl = document.getElementById("cl"); if(__cl) __cl.remove();

      // EMPTY-RECON GUARD: never show a silent blank replay. If no actions were
      // recorded for this case, say so plainly and let the participant continue.
      if(!rec || !rec.deltas || !rec.deltas.length){
        cleanupOverlays();
        const g=document.createElement("div"); g.id="rp_empty";
        Object.assign(g.style,{position:'fixed',inset:'0',background:'#0f172a',color:'#fff',display:'flex',
          alignItems:'center',justifyContent:'center',zIndex:10006,font:'16px system-ui',textAlign:'left',padding:'0 24px'});
        g.innerHTML='<div style="max-width:560px;line-height:1.7">'
          +'<h2 style="color:#ffd8a8;margin:0 0 12px">Nothing to replay for this case</h2>'
          +'<p style="margin:0 0 20px">No actions were recorded for this case, so there is nothing to play back or narrate here. This is not your fault — you can continue to the next step.</p>'
          +'<button id="rp_empty_go" style="background:#1e8e4e;color:#fff;border:0;border-radius:8px;padding:11px 22px;font:700 15px system-ui;cursor:pointer">Continue</button>'
          +'</div>';
        document.body.appendChild(g);
        document.getElementById("rp_empty_go").onclick=function(){ cleanupOverlays(); jsPsych.finishTrial(); };
        return;
      }

      // Reserve the bottom 64px (the playback bar's height) so the replayed
      // interface sits ABOVE the bar and no field is hidden under it.
      const __mnt = document.getElementById("ot_mount"); if(__mnt) __mnt.style.bottom = "64px";
      window.__rtaReplaying = true;   // suppress capture (cursor/scroll) during replay

      const cap = (window.Reanchor ? window.Reanchor.makeNarrationCapture() : null);
      const audio = { stream:null, recorder:null, chunks:[], startWall:null, map:[], vadTimer:null, ac:null, analyser:null,
                      vadObj:null, vadReady:false, lastEnergy:0, speechSegs:[], energyTrace:[], _et:0, _segOn:null };

      function sampleClock(){ try{ audio.map.push({ wall:Date.now(), playT:Replay._state().playT }); }catch(e){} }
      function playTAtWall(wall){
        if(!audio.map.length) return 0;
        let best = audio.map[0];
        for(const m of audio.map){ if(Math.abs(m.wall-wall) < Math.abs(best.wall-wall)) best = m; }
        return best.playT;
      }
      const clockTimer = setInterval(sampleClock, 100);

      /* ===================================================================
         AUTO-PAUSE + PAUSE INSTRUMENTATION (rta_autopause_spec, all in partC).
         Uses ONLY the Replay engine's public API (pause/resume/_state/noteSpeech)
         and re-binds the HUD toggle -- no changes to the read-only engine. The
         engine's clock already freezes playT on pause and re-anchors on resume,
         so a rescinded pause resumes from the exact frozen position (spec A8/A4).
         =================================================================== */
      function apSafeState(){ try{ return Replay._state(); }catch(e){ return { playT:0, playing:false }; } }
      const ap = {
        enabled: !!CONFIG.RTA_AUTOPAUSE_ENABLED,
        buf: [],                 // ring buffer of {wall, playT} for onset back-dating (A2)
        bufTimer: null,
        state: 'none',           // none | provisional | confirmed
        pending: null,           // the open pause record
        confirmTimer: null,
        speaking: false,         // current detector speaking edge-state
        pauses: [],              // B1: one record per pause event
        seg: { list: [], cur: null },   // B2: speech x playback-state segments
        micDenied: false,
        counter: 0,
        started: false
      };
      // ---- A2: continuously sampled playback-position ring buffer ----
      function apSampleBuf(){
        try{ ap.buf.push({ wall: performance.now(), playT: apSafeState().playT });
          if(ap.buf.length > 600) ap.buf.shift(); }catch(e){}
      }
      // Resolve a (back-dated) wall time to the playback position it corresponds to.
      function apResolve(wall){
        if(!ap.buf.length) return Math.round(apSafeState().playT||0);
        let best = ap.buf[0];
        for(let i=0;i<ap.buf.length;i++){ if(Math.abs(ap.buf[i].wall-wall) < Math.abs(best.wall-wall)) best = ap.buf[i]; }
        return Math.round(best.playT);
      }
      // ---- B2: segment boundaries for speech x replay-running/paused ----
      function apSegUpdate(isSpeaking){
        const st = apSafeState();
        const label = (isSpeaking?'speech':'silence') + '_' + (st.playing?'playing':'paused');
        const cur = ap.seg.cur, now = performance.now();
        if(!cur || cur.label !== label){
          if(cur){ cur.end_wall = Math.round(now); cur.end_playT = Math.round(st.playT); ap.seg.list.push(cur); }
          ap.seg.cur = { label:label, start_wall:Math.round(now), start_playT:Math.round(st.playT) };
        }
      }
      function apSegClose(){ const cur=ap.seg.cur; if(cur){ const st=apSafeState(); cur.end_wall=Math.round(performance.now()); cur.end_playT=Math.round(st.playT); ap.seg.list.push(cur); ap.seg.cur=null; } }

      // ---- Unified detector hook: called each VAD/energy frame with a boolean ----
      function apOnSpeechFrame(isSpeaking){
        if(isSpeaking){ try{ Replay.noteSpeech(apSafeState().playT); }catch(e){} }  // keep silence-net fed every speaking frame
        apSegUpdate(isSpeaking);
        if(isSpeaking && !ap.speaking){ ap.speaking = true; apRisingEdge(); }
        else if(!isSpeaking && ap.speaking){ ap.speaking = false; apFallingEdge(); }
      }
      function apNewRecord(trigger, detector){
        return { pause_id: caseObj.id + '_p' + (++ap.counter),
                 participant_id: (study.sub_id_from_url || null),
                 case_id: caseObj.id,
                 trigger_type: trigger,               // manual | vad_auto | fullscreen_guard | other
                 detector: detector,                  // silero | energy | null(manual)
                 vad_fire_wall_ms: null, speech_onset_wall_ms: null,
                 pause_effective_wall_ms: null, onset_to_pause_lag_ms: null,
                 playback_position_ms: null,          // THE TASK-TIME COORDINATE (write once)
                 status: null, resume_wall_ms: null, pause_duration_ms: null,
                 speech_duration_in_pause_ms: 0, prompt_shown: false }; // NOTE: coordinate written once (spec B1)
      }
      // Speech onset while the replay is running -> FIRE FAST (provisional pause).
      function apRisingEdge(){
        if(!ap.enabled) return;
        const st = apSafeState();
        if(ap.state !== 'none') return;    // already paused/pending: speech is captured via B2 (spec A9)
        if(!st.playing) return;            // speech before start / after end / while paused: not a new pause (A9)
        const fireWall  = performance.now();
        const onsetWall = fireWall - CONFIG.RTA_VAD_ONSET_BACKDATE_MS;
        const rec = apNewRecord('vad_auto', (audio.vadReady ? 'silero' : 'energy'));
        rec.vad_fire_wall_ms     = Math.round(fireWall);
        rec.speech_onset_wall_ms = Math.round(onsetWall);
        rec.playback_position_ms = apResolve(onsetWall);          // resolved at ONSET, not at pause-exec (A2)
        try{ Replay.pause(); }catch(e){}
        rec.pause_effective_wall_ms = Math.round(performance.now());
        rec.onset_to_pause_lag_ms   = rec.pause_effective_wall_ms - rec.speech_onset_wall_ms;
        rec.status = 'provisional';
        ap.pending = rec; ap.state = 'provisional';
        ap.confirmTimer = setTimeout(apConfirm, CONFIG.RTA_AUTOPAUSE_CONFIRM_MS);
      }
      // Speech stopped: if still provisional, the pause is a false trigger -> rescind.
      function apFallingEdge(){
        if(ap.state === 'provisional'){ if(ap.confirmTimer){ clearTimeout(ap.confirmTimer); ap.confirmTimer=null; } apRescind(); }
      }
      function apConfirm(){
        if(ap.state !== 'provisional' || !ap.pending) return;
        ap.confirmTimer = null; ap.state = 'confirmed';
        ap.pending.status = 'confirmed'; ap.pending.prompt_shown = true;
        ap.pauses.push(ap.pending);          // pushed by reference; resume fields filled on resume
        apShowPrompt();
        apUpdateToggleLabel();
      }
      function apRescind(){
        const rec = ap.pending; ap.pending = null; ap.state = 'none';
        if(rec){ rec.status = 'rescinded'; rec.resume_wall_ms = Math.round(performance.now());
                 rec.pause_duration_ms = rec.resume_wall_ms - rec.pause_effective_wall_ms; ap.pauses.push(rec); }
        try{ Replay.resume(); }catch(e){}    // resumes from the exact frozen position (A8)
        apUpdateToggleLabel();
      }
      // ---- Manual pause parity: re-bind the HUD toggle so a manual pause shows the
      //      same prompt and is logged the same way (trigger_type 'manual'). ----
      function apManualPause(){
        if(ap.state === 'provisional'){ if(ap.confirmTimer){ clearTimeout(ap.confirmTimer); ap.confirmTimer=null; }
          // promote the in-flight provisional to a confirmed manual pause
        }
        if(ap.state === 'confirmed') return;
        const st = apSafeState();
        const rec = ap.pending || apNewRecord('manual', null);
        if(!ap.pending){ rec.playback_position_ms = Math.round(st.playT); }
        rec.trigger_type = (rec.trigger_type==='vad_auto' ? 'vad_auto' : 'manual');
        try{ Replay.pause(); }catch(e){}
        if(rec.pause_effective_wall_ms == null) rec.pause_effective_wall_ms = Math.round(performance.now());
        rec.status = 'confirmed'; rec.prompt_shown = true;
        if(ap.pauses.indexOf(rec) < 0) ap.pauses.push(rec);
        ap.pending = rec; ap.state = 'confirmed';
        apShowPrompt(); apUpdateToggleLabel();
      }
      function apResume(){
        if(ap.state === 'provisional'){ if(ap.confirmTimer){ clearTimeout(ap.confirmTimer); ap.confirmTimer=null; } apRescind(); return; }
        if(ap.state === 'confirmed' && ap.pending){
          const rec = ap.pending; ap.pending = null; ap.state = 'none';
          rec.resume_wall_ms = Math.round(performance.now());
          rec.pause_duration_ms = rec.resume_wall_ms - (rec.pause_effective_wall_ms || rec.resume_wall_ms);
          apHidePrompt(); try{ Replay.resume(); }catch(e){} apUpdateToggleLabel(); return;
        }
        try{ Replay.resume(); }catch(e){} apUpdateToggleLabel();
      }
      function apWireToggle(){
        const btn = document.getElementById('rp_toggle'); if(!btn) return;
        btn.onclick = function(){ if(apSafeState().playing) apManualPause(); else apResume(); };
      }
      function apUpdateToggleLabel(){
        const btn = document.getElementById('rp_toggle'); if(btn) btn.textContent = apSafeState().playing ? 'Pause' : 'Resume';
      }
      // ---- Pause prompt overlay (persistent until resume) ----
      function apShowPrompt(){
        let p = document.getElementById('rp_pause_prompt');
        if(!p){ p = document.createElement('div'); p.id = 'rp_pause_prompt'; document.body.appendChild(p);
          Object.assign(p.style,{position:'fixed',left:'50%',bottom:'88px',transform:'translateX(-50%)',
            maxWidth:'560px',background:'#0b3d2e',color:'#eafff4',font:'600 15px system-ui',padding:'12px 18px',
            borderRadius:'10px',zIndex:10004,boxShadow:'0 6px 22px rgba(0,0,0,.3)',textAlign:'center',lineHeight:'1.5'}); }
        p.textContent = CONFIG.RTA_PAUSE_PROMPT; p.style.display = '';
      }
      function apHidePrompt(){ const p = document.getElementById('rp_pause_prompt'); if(p) p.style.display = 'none'; }
      // ---- B3: per-case aggregate, computed at collection time ----
      function apMedian(arr){ if(!arr.length) return null; const a=arr.slice().sort((x,y)=>x-y); const m=Math.floor(a.length/2);
        return a.length%2 ? a[m] : Math.round((a[m-1]+a[m])/2); }
      function apAggregate(){
        apSegClose();
        const st = apSafeState();
        const confirmed = ap.pauses.filter(p=>p.status==='confirmed');
        const rescinded = ap.pauses.filter(p=>p.status==='rescinded');
        const manual    = ap.pauses.filter(p=>p.trigger_type==='manual');
        let speechPlay=0, speechPause=0;
        ap.seg.list.forEach(s=>{ const dur=Math.max(0,(s.end_wall||s.start_wall)-s.start_wall);
          if(s.label==='speech_playing') speechPlay+=dur; else if(s.label==='speech_paused') speechPause+=dur; });
        const totalSpeech = speechPlay + speechPause;
        const pauseDurs = confirmed.map(p=>p.pause_duration_ms).filter(x=>x!=null);
        const lags = ap.pauses.filter(p=>p.trigger_type==='vad_auto' && p.onset_to_pause_lag_ms!=null).map(p=>p.onset_to_pause_lag_ms);
        return {
          n_pauses_total: ap.pauses.length,
          n_pauses_manual: manual.length,
          n_pauses_vad_confirmed: ap.pauses.filter(p=>p.trigger_type==='vad_auto'&&p.status==='confirmed').length,
          n_pauses_vad_rescinded: rescinded.filter(p=>p.trigger_type==='vad_auto').length,
          n_silence_prompts_fired: (function(){ try{ return apSafeState().fires ? apSafeState().fires.length : 0; }catch(e){ return 0; } })(),
          total_replay_runtime_ms: Math.round(st.playT||0),
          total_paused_ms: pauseDurs.reduce((a,b)=>a+b,0),
          speech_ms_while_playing: Math.round(speechPlay),
          speech_ms_while_paused: Math.round(speechPause),
          proportion_speech_while_playing: totalSpeech>0 ? Math.round(1000*speechPlay/totalSpeech)/1000 : 0,
          mean_pause_duration_ms: pauseDurs.length ? Math.round(pauseDurs.reduce((a,b)=>a+b,0)/pauseDurs.length) : null,
          median_onset_to_pause_lag_ms: apMedian(lags),
          clock_sample_cadence_ms: CONFIG.RTA_CLOCK_SAMPLE_MS,
          confirm_window_ms: CONFIG.RTA_AUTOPAUSE_CONFIRM_MS,
          autopause_enabled: ap.enabled,
          mic_denied: ap.micDenied,
          detector_primary: (audio.vadReady ? 'silero' : 'energy')
        };
      }
      function apFinalizeOpen(){   // close any pause still open at end of replay
        if(ap.confirmTimer){ clearTimeout(ap.confirmTimer); ap.confirmTimer=null; }
        if(ap.state==='provisional' && ap.pending){ ap.pending.status='rescinded';
          ap.pending.resume_wall_ms=Math.round(performance.now());
          ap.pending.pause_duration_ms=ap.pending.resume_wall_ms-ap.pending.pause_effective_wall_ms;
          ap.pauses.push(ap.pending); ap.pending=null; }
        else if(ap.state==='confirmed' && ap.pending){ ap.pending.resume_wall_ms=Math.round(performance.now());
          ap.pending.pause_duration_ms=ap.pending.resume_wall_ms-(ap.pending.pause_effective_wall_ms||ap.pending.resume_wall_ms); ap.pending=null; }
        ap.state='none';
      }
      function apStart(){   // called right after Replay.start(): HUD exists, playback running
        if(ap.started) return; ap.started = true;
        apSampleBuf();
        ap.bufTimer = setInterval(apSampleBuf, CONFIG.RTA_CLOCK_SAMPLE_MS);
        apWireToggle();
      }
      function apStop(){ if(ap.bufTimer){ clearInterval(ap.bufTimer); ap.bufTimer=null; } apFinalizeOpen(); }

      function startAudio(){
        return navigator.mediaDevices.getUserMedia({ audio:true }).then(stream=>{
          audio.stream = stream;
          try{ audio.recorder = new MediaRecorder(stream); }catch(e){ audio.recorder = null; }
          if(audio.recorder){
            audio.recorder.ondataavailable = e=>{ if(e.data && e.data.size) audio.chunks.push(e.data); };
            audio.startWall = Date.now(); audio.recorder.start(1000);
          }
          try{
            const AC = window.AudioContext || window.webkitAudioContext;
            audio.ac = new AC();
            const node = audio.ac.createMediaStreamSource(stream);
            audio.analyser = audio.ac.createAnalyser(); audio.analyser.fftSize = 1024; node.connect(audio.analyser);
            const buf = new Uint8Array(audio.analyser.fftSize);
            // ENERGY GATE: now the FALLBACK + a logged secondary signal. It drives the
            // silence-net only while Silero isn't live (audio.vadReady false); it always
            // logs a downsampled RMS trace so the detector can be validated post-hoc.
            audio.vadTimer = setInterval(()=>{
              audio.analyser.getByteTimeDomainData(buf);
              let sum=0; for(let i=0;i<buf.length;i++){ const v=(buf[i]-128)/128; sum+=v*v; }
              const rms = Math.sqrt(sum/buf.length); audio.lastEnergy = rms;
              const nowMs = audio.ac ? audio.ac.currentTime*1000 : Date.now();
              if(nowMs - audio._et > 500){ audio._et = nowMs; try{ audio.energyTrace.push({ playT:Replay._state().playT, rms:Math.round(rms*1000)/1000 }); }catch(e){} }
              if(!audio.vadReady){ apOnSpeechFrame(rms > CONFIG.RTA_ENERGY_GATE); }   // energy = fallback detector for auto-pause
            }, 150);
            // SILERO VAD (primary, self-hosted via window.vad). Fire-and-forget so replay
            // never blocks on model load; energy covers the gap until it's ready. If the
            // library/model is absent or init throws, vadReady stays false and energy stays
            // in charge -- the silence-net never breaks.
            (function initSilero(){
              try{
                if(!(window.vad && window.vad.AudioNodeVAD)) return;   // library absent -> energy fallback
                var opts = {
                  baseAssetPath:    location.origin + '/js/vendor/vad/',
                  onnxWASMBasePath: location.origin + '/js/vendor/vad/',
                  positiveSpeechThreshold: 0.5, negativeSpeechThreshold: 0.35,
                  onSpeechStart: function(){ audio.vadReady = true; try{ audio._segOn = Replay._state().playT; Replay.noteSpeech(audio._segOn); }catch(e){} },
                  onSpeechEnd:   function(){ try{ if(audio._segOn!=null){ audio.speechSegs.push({ on:audio._segOn, off:Replay._state().playT }); audio._segOn=null; } }catch(e){} },
                  onFrameProcessed: function(probs){ audio.vadReady = true;
                    var s = probs && (probs.isSpeech!=null ? probs.isSpeech : (typeof probs==='number'?probs:0));
                    apOnSpeechFrame(s > 0.5); }   // Silero frames drive the two-stage auto-pause
                };
                window.vad.AudioNodeVAD.new(audio.ac, opts).then(function(v){
                  audio.vadObj = v;
                  try{ node.connect(v.getNode ? v.getNode() : v.node); }catch(e){}
                  try{ v.start(); }catch(e){}
                }).catch(function(){ audio.vadReady = false; });
              }catch(e){ audio.vadReady = false; }
            })();
          }catch(e){}
        }).catch(e=>{ ap.micDenied = true; /* no mic -> auto-pause disabled, manual pause only; flagged in aggregate (A9) */ });
      }
      function stopAudio(){
        if(audio.vadTimer) clearInterval(audio.vadTimer);
        try{ if(audio._segOn!=null){ audio.speechSegs.push({ on:audio._segOn, off:Replay._state().playT }); audio._segOn=null; } }catch(e){}
        try{ if(audio.vadObj){ if(audio.vadObj.pause) audio.vadObj.pause(); else if(audio.vadObj.destroy) audio.vadObj.destroy(); } }catch(e){}
        try{ audio.ac && audio.ac.close(); }catch(e){}
        return new Promise(res=>{
          if(!audio.recorder || audio.recorder.state === "inactive"){ if(audio.stream) audio.stream.getTracks().forEach(t=>t.stop()); res(null); return; }
          audio.recorder.onstop = ()=>{ if(audio.stream) audio.stream.getTracks().forEach(t=>t.stop()); res(new Blob(audio.chunks, { type: audio.recorder.mimeType || "audio/webm" })); };
          try{ audio.recorder.stop(); }catch(e){ res(null); }
        });
      }

      let finishing=false, ended=false;
      function endOnce(arr){ if(ended) return; ended=true; storeAndEnd(arr||[]); }
      function finishReplay(){
        if(finishing) return; finishing=true;
        clearInterval(clockTimer);
        apStop(); apHidePrompt();
        // PRACTICE: the practice narration is not analyzed, so there is nothing to
        // transcribe. Release the mic and advance immediately -- no "processing"
        // wait, and no dependency on the Whisper model being loaded.
        if(caseObj.role === "Practice"){
          const t=setTimeout(()=>endOnce([]), 4000);   // safety: never hang
          stopAudio().catch(()=>{}).then(()=>{ clearTimeout(t); endOnce([]); });
          return;
        }
        showBusy("Processing your narration. This can take up to a minute. Please don't close this tab.");
        // Absolute backstop: the study advances even if transcription never returns.
        const hardCap = setTimeout(()=>endOnce([]), 240000);
        stopAudio().then(blob=>{
          if(!blob || !cap){ clearTimeout(hardCap); endOnce([]); return; }
          pcm16kFromBlob(blob).then(pcm=>transcribeAudio(pcm)).then(res=>{
            const chunks = (res.chunks && res.chunks.length) ? res.chunks : (res.text ? [{text:res.text, timestamp:[0,0]}] : []);
            chunks.forEach(ch=>{
              const s = (ch.timestamp && ch.timestamp[0]!=null) ? ch.timestamp[0] : 0;
              const wall = (audio.startWall || Date.now()) + s*1000;
              cap.noteUtterance((ch.text||"").trim(), playTAtWall(wall), { paused:false, kind:'final' });
            });
            clearTimeout(hardCap); endOnce(window.Reanchor.reanchorAll(cap.getNarration(), offset));
          }).catch(()=>{ clearTimeout(hardCap); endOnce([]); });
        }).catch(()=>{ clearTimeout(hardCap); endOnce([]); });
      }
      function storeAndEnd(reanchored){
        window.__rtaReplaying = false;
        store.rta = { narration:reanchored, silence_prompts:(function(){ try{ return Replay._state().fires; }catch(e){ return []; } })(),
                      vad: { primary_engine:(audio.vadReady?'silero':'energy'),
                             speech_segments: audio.speechSegs.slice(),
                             energy_rms_trace: audio.energyTrace.slice() },
                      pauses: ap.pauses.slice(),                 // B1: per-pause-event records
                      speech_state: ap.seg.list.slice(),         // B2: speech x playback-state segments
                      pause_aggregate: apAggregate() };          // B3: per-case aggregate
        cleanupOverlays();
        jsPsych.finishTrial();
      }

      function showContinue(cb){
        if(document.getElementById("rp_continue")) return;
        const b=document.createElement("button"); b.id="rp_continue"; b.textContent="Finish narrating and continue";
        b.style.cssText="position:fixed;right:16px;bottom:74px;z-index:10003;background:#1e8e4e;color:#fff;border:0;border-radius:8px;padding:10px 18px;font:700 14px system-ui;cursor:pointer";
        b.onclick=cb; document.body.appendChild(b);
      }
      function showBusy(msg){
        let d=document.getElementById("rp_busy");
        if(!d){ d=document.createElement("div"); d.id="rp_busy"; document.body.appendChild(d);
          Object.assign(d.style,{position:'fixed',inset:'0',background:'rgba(15,23,42,.94)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10005,font:'16px system-ui',textAlign:'center',padding:'0 24px'}); }
        d.textContent=msg;
      }
      // ---- A6: uniform auto-pause announcement, shown before playback begins,
      //      identical wording for every participant and active on the practice
      //      case as well as the analyzed cases. Blocking, single button. ----
      function apShowAnnouncement(cb){
        const g=document.createElement("div"); g.id="rp_announce";
        Object.assign(g.style,{position:'fixed',inset:'0',background:'rgba(15,23,42,.96)',color:'#fff',display:'flex',
          alignItems:'center',justifyContent:'center',zIndex:10007,font:'16px system-ui',textAlign:'left',padding:'0 24px'});
        g.innerHTML='<div style="max-width:600px;line-height:1.7">'
          +'<h2 style="color:#ffd8a8;margin:0 0 14px">Talk through your thinking</h2>'
          +'<p style="margin:0 0 22px;font-size:16px">'+CONFIG.RTA_AUTOPAUSE_ANNOUNCE+'</p>'
          +'<button id="rp_announce_go" style="background:#1e8e4e;color:#fff;border:0;border-radius:8px;padding:12px 24px;font:700 15px system-ui;cursor:pointer">Start the replay</button>'
          +'</div>';
        document.body.appendChild(g);
        document.getElementById("rp_announce_go").onclick=function(){ g.remove(); cb(); };
      }

      function beginReplay(){
        Replay.start(rec, { silenceThresholdMs: CONFIG.RTA_SILENCE_MS, onDone: function(){ apFinalizeOpen(); showContinue(finishReplay); } });
        apStart();
      }
      startAudio().then(()=>{
        apShowAnnouncement(beginReplay);
      });
    },
    on_finish: function(data){
      const store = study.cases[caseObj.id];
      data.rta_narration = (store && store.rta && store.rta.narration) || [];
      data.rta_silence_prompts = (store && store.rta && store.rta.silence_prompts) || [];
      data.rta_vad = (store && store.rta && store.rta.vad) || null;
      data.rta_pauses = (store && store.rta && store.rta.pauses) || [];
      data.rta_speech_state = (store && store.rta && store.rta.speech_state) || [];
      data.rta_pause_aggregate = (store && store.rta && store.rta.pause_aggregate) || null;
    }
  };
}

/* ---------- CHUNK 4: ONE-FILE EXPORT ---------- */
function buildSessionExport(){
  return {
    schema:"ot_prof_reasoning_v1",
    study_id: study.sub_id_from_url || null,
    generated_at: new Date().toISOString(),
    session:{
      started_at:study.started_at, user_agent:study.user_agent,
      session_started_at_ms:study.session_started_at_ms,
      group:study.group, year_in_program:study.year_in_program, url_params:study.url_params,
      task_viewport:study.task_viewport,
      browser_check:study.browser_check, permissions:study.permissions,
      rta_silence_threshold_ms: CONFIG.RTA_SILENCE_MS,
      rta_autopause: { enabled: CONFIG.RTA_AUTOPAUSE_ENABLED, confirm_window_ms: CONFIG.RTA_AUTOPAUSE_CONFIRM_MS,
                       clock_sample_ms: CONFIG.RTA_CLOCK_SAMPLE_MS, onset_backdate_ms: CONFIG.RTA_VAD_ONSET_BACKDATE_MS,
                       energy_gate_rms: CONFIG.RTA_ENERGY_GATE }
    },
    cases: CASES_IN_ORDER.map(c=>{
      const rec = study.cases[c.id] || {};
      return {
        case_id:c.id, case_role:c.role, case_name:c.name,
        analyzed:(c.role!=="Practice"),
        case_started_offset_ms: rec.case_started_offset_ms != null ? rec.case_started_offset_ms : null,
        task: rec.task || null,                                   // Stream 1: event_log + descriptive state
        rta: (rec.rta && rec.rta.narration) || [],                // Stream 2: re-anchored think-aloud
        rta_silence_prompts: (rec.rta && rec.rta.silence_prompts) || [],
        rta_vad: (rec.rta && rec.rta.vad) || null,
        rta_pauses: (rec.rta && rec.rta.pauses) || [],            // B1: per-pause-event records
        rta_speech_state: (rec.rta && rec.rta.speech_state) || [],// B2: speech x playback-state segments
        rta_pause_aggregate: (rec.rta && rec.rta.pause_aggregate) || null  // B3: per-case aggregate
      };
    })
    /* NOTE: state.recon (deltas + cursor) is intentionally NOT exported. */
  };
}
function makeExportTrial(){
  return {
    type: jsPsychHtmlKeyboardResponse, choices:"NO_KEYS",
    stimulus: '<div></div>',   // required by the plugin; on_load renders the real screen
    data:{ trial_tag:"export" },
    on_load: function(){
      study.__fsActive = false;   // study over: stop guarding fullscreen
      const __fsr=document.getElementById("fs_return"); if(__fsr) __fsr.remove();
      cleanupOverlays();
      const payload = buildSessionExport();
      const fname = "ot_session_" + (study.sub_id_from_url || "anon") + "_" + Date.now() + ".json";
      const blob = new Blob([JSON.stringify(payload)], { type:"application/json" });
      const url = URL.createObjectURL(blob);

      // Qualtrics return URL (append sub_id if we have one, so the survey can match the file).
      const qBase = CONFIG.QUALTRICS_UPLOAD_URL;
      const qConfigured = qBase && qBase.indexOf("REPLACE") < 0;
      let qUrl = qBase;
      if (qConfigured && study.sub_id_from_url) {
        qUrl = qBase + (qBase.indexOf("?") >= 0 ? "&" : "?") + "sub_id=" + encodeURIComponent(study.sub_id_from_url);
      }

      document.body.innerHTML =
        '<div style="max-width:660px;margin:5% auto;font-family:system-ui;color:#17232e;text-align:left;padding:0 22px;line-height:1.6">'
        + '<h2 style="color:#1565c0;margin:0 0 6px">You have finished both cases. Thank you.</h2>'
        + '<p style="font-size:16px;margin:0 0 20px">Two quick steps complete your participation. Please do them in order, and do not close this tab until you have finished Step 2.</p>'

        + '<div style="background:#eef4fb;border:1px solid #cfe0f2;border-radius:10px;padding:16px 18px;margin:0 0 16px">'
        +   '<p style="margin:0 0 6px;font-weight:700;color:#12507f">Step 1 - Download your session file</p>'
        +   '<p style="margin:0 0 12px;font-size:15px">Click the green button. A file named <strong>' + fname + '</strong> will be saved to your computer (usually your Downloads folder). Remember where it goes - you will upload it in Step 2.</p>'
        +   '<a id="dl" href="' + url + '" download="' + fname + '" style="display:inline-block;background:#1e8e4e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px">Download my session file</a>'
        +   '<p id="dl_done" style="display:none;margin:10px 0 0;color:#16692f;font-weight:700">Downloaded. Now continue to Step 2.</p>'
        + '</div>'

        + '<div style="background:#f6f8fa;border:1px solid #dfe6ec;border-radius:10px;padding:16px 18px;margin:0 0 20px">'
        +   '<p style="margin:0 0 6px;font-weight:700;color:#12507f">Step 2 - Return to the survey and upload the file</p>'
        +   '<p style="margin:0 0 12px;font-size:15px">Click the button below to go back to the survey. There you will be asked to upload the file you just downloaded (<strong>' + fname + '</strong>).</p>'
        +   (qConfigured
              ? '<button id="go_q" disabled style="background:#1565c0;color:#fff;border:0;border-radius:8px;padding:12px 24px;font-weight:700;font-size:15px;cursor:pointer;opacity:.5">Return to the survey to upload</button>'
                + '<p id="go_hint" style="margin:10px 0 0;font-size:13px;color:#7a8894">Download your file first (Step 1), then this button turns on.</p>'
              : '<p style="margin:0;color:#c0392b;font-weight:600">[Survey return URL not set yet - configure CONFIG.QUALTRICS_UPLOAD_URL. Your downloaded file is still saved.]</p>')
        + '</div>'

        + '<p style="font-size:13px;color:#7a8894">If the download did not start, click the green button again. If you cannot find the file, check your Downloads folder for <strong>' + fname + '</strong>.</p>'
        + '</div>';

      const dl = document.getElementById("dl");
      const dlDone = document.getElementById("dl_done");
      const goQ = document.getElementById("go_q");
      if (dl) dl.addEventListener("click", function(){
        if (dlDone) dlDone.style.display = "block";
        if (goQ) { goQ.disabled = false; goQ.style.opacity = "1"; }
        const hint = document.getElementById("go_hint"); if (hint) hint.style.display = "none";
      });
      if (goQ) goQ.addEventListener("click", function(){ if (qConfigured) window.location.href = qUrl; });
    }
  };
}

/* ---------- TIMELINE: task + replay per case, then export ---------- */
CASES_IN_ORDER.forEach(c=>{ timeline.push(makeCaseTrial(c)); timeline.push(makeReplayTrial(c)); });
timeline.push(makeExportTrial());

jsPsych.run(timeline);
