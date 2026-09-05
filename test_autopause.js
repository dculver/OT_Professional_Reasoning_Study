/* Headless logic test for the RTA auto-pause module (rta_autopause_spec Part C,
   items 2 & 5 + state-machine + aggregate). Extracts the REAL ap module from
   partC.js and runs it against a mocked Replay engine + virtual clock, so we are
   testing the shipped code, not a copy. Real-audio latency/false-trigger
   characterization (Part C items 1 & 4) require Dennis's machine. */
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/partC.js', 'utf8');

// Extract the ap module: from `function apSafeState` to end of `function apStop`.
const start = src.indexOf('function apSafeState()');
const stopMarker = 'function apStop(){';
const stopIdx = src.indexOf(stopMarker);
const endOfStop = src.indexOf('\n', src.indexOf('}', src.indexOf('apFinalizeOpen();', stopIdx)));
const block = src.slice(start, endOfStop + 1);
if (start < 0 || stopIdx < 0) { console.error('COULD NOT EXTRACT ap MODULE'); process.exit(2); }

let PASS = 0, FAIL = 0;
function check(name, cond, extra){ if(cond){ PASS++; console.log('  PASS ', name); } else { FAIL++; console.log('  FAIL ', name, extra!=null?JSON.stringify(extra):''); } }

// ---- Virtual clock + scheduler ----
function makeEnv(){
  let VNOW = 0, seq = 1;
  const timeouts = [], intervals = [];
  const Replay = {
    playT: 0, playing: false, _fires: [],
    pause(){ this.playing = false; }, resume(){ this.playing = true; },
    seek(){}, noteSpeech(){},
    _state(){ return { playT: this.playT, playing: this.playing, fires: this._fires.slice() }; }
  };
  const fakeEl = () => ({ style:{}, _text:'', set textContent(v){this._text=v;}, get textContent(){return this._text;},
                          onclick:null, appendChild(){}, querySelector(){ return fakeEl(); }, remove(){}, });
  const store = {};
  const document = {
    _els: store,
    getElementById(id){ return store[id] || (store[id] = fakeEl()); },
    createElement(){ return fakeEl(); },
    body: { appendChild(){} }
  };
  const env = {
    VNOW: ()=>VNOW,
    now(){ return VNOW; },
    setTimeout(fn, ms){ const id = seq++; timeouts.push({ id, fn, at: VNOW + ms }); return id; },
    clearTimeout(id){ const i = timeouts.findIndex(t=>t.id===id); if(i>=0) timeouts.splice(i,1); },
    setInterval(fn, ms){ const id = seq++; intervals.push({ id, fn, ms, next: VNOW + ms }); return id; },
    clearInterval(id){ const i = intervals.findIndex(t=>t.id===id); if(i>=0) intervals.splice(i,1); },
    step(dt){ // advance in 1ms ticks so a pause mid-step stops playT advance immediately
      for(let k=0;k<dt;k++){
        VNOW += 1;
        if(Replay.playing) Replay.playT += 1;
        // timeouts due
        const due = timeouts.filter(t=>t.at<=VNOW).sort((a,b)=>a.at-b.at);
        due.forEach(t=>{ env.clearTimeout(t.id); t.fn(); });
        // intervals due
        intervals.forEach(t=>{ while(t.next<=VNOW){ t.fn(); t.next += t.ms; } });
      }
    },
    Replay, document
  };
  return env;
}

// Build the module inside a function scope providing the closure vars it needs.
function instantiate(env, opts){
  opts = opts || {};
  const CONFIG = {
    RTA_AUTOPAUSE_ENABLED: true, RTA_AUTOPAUSE_CONFIRM_MS: 400, RTA_CLOCK_SAMPLE_MS: 50,
    RTA_VAD_ONSET_BACKDATE_MS: 64, RTA_ENERGY_GATE: 0.04,
    RTA_PAUSE_PROMPT: 'prompt', RTA_AUTOPAUSE_ANNOUNCE: 'announce'
  };
  const study = { sub_id_from_url: 'T1' };
  const caseObj = { id: 1 };
  const audio = { vadReady: opts.vadReady !== false, speechSegs: [], energyTrace: [] };
  const factoryBody = `
    "use strict";
    const CONFIG = arguments[0], study = arguments[1], caseObj = arguments[2], audio = arguments[3],
          Replay = arguments[4], document = arguments[5],
          setTimeout = arguments[6], clearTimeout = arguments[7],
          setInterval = arguments[8], clearInterval = arguments[9],
          performance = { now: arguments[10] };
    ${block}
    return { ap, apOnSpeechFrame, apStart, apStop, apAggregate, apResolve, apSampleBuf,
             apShowPrompt, apHidePrompt, apManualPause, apResume };
  `;
  const factory = new Function(factoryBody);
  return factory(CONFIG, study, caseObj, audio, env.Replay, env.document,
                 env.setTimeout, env.clearTimeout, env.setInterval, env.clearInterval, env.now);
}

// ================= SCENARIO 1: confirmed pause + coordinate accuracy =================
(function(){
  console.log('SCENARIO 1 — confirmed pause, coordinate recovers true onset');
  const env = makeEnv(); const M = instantiate(env);
  env.Replay.playing = true;                 // playback running
  M.apStart();
  env.step(1000);                            // play to true onset moment (playT ~1000)
  const trueOnsetPlayT = env.Replay.playT;
  const DETLAT = 64;                          // detector notices this late; == backdate, so they cancel
  env.step(DETLAT);
  M.apOnSpeechFrame(true);                    // detector fires -> provisional pause
  check('provisional freezes playback', env.Replay.playing === false);
  check('one open pending record', M.ap.state === 'provisional' && !!M.ap.pending);
  // keep speaking through the confirm window
  for(let i=0;i<10;i++){ env.step(50); M.apOnSpeechFrame(true); }
  check('pause confirmed after window', M.ap.state === 'confirmed');
  const rec = M.ap.pauses[0];
  check('exactly one pause record', M.ap.pauses.length === 1, M.ap.pauses.length);
  check('record status confirmed', rec && rec.status === 'confirmed');
  check('trigger_type vad_auto', rec && rec.trigger_type === 'vad_auto');
  check('prompt_shown true', rec && rec.prompt_shown === true);
  check('coordinate written once & near true onset (±50ms)',
        rec && Math.abs(rec.playback_position_ms - trueOnsetPlayT) <= 50,
        { coord: rec && rec.playback_position_ms, trueOnset: trueOnsetPlayT });
  check('coordinate is NOT the pause-exec position (forward-biased)',
        rec && rec.playback_position_ms <= env.Replay.playT,
        { coord: rec && rec.playback_position_ms, frozenPlayT: env.Replay.playT });
  check('onset_to_pause_lag_ms logged & positive', rec && rec.onset_to_pause_lag_ms > 0, rec && rec.onset_to_pause_lag_ms);
  check('raw fire/onset/effective all logged',
        rec && rec.vad_fire_wall_ms!=null && rec.speech_onset_wall_ms!=null && rec.pause_effective_wall_ms!=null);
})();

// ================= SCENARIO 2: false trigger -> rescind + continuity =================
(function(){
  console.log('SCENARIO 2 — short blip rescinds, resumes from exact position');
  const env = makeEnv(); const M = instantiate(env);
  env.Replay.playing = true; M.apStart();
  env.step(800);
  const before = env.Replay.playT;
  M.apOnSpeechFrame(true);                    // provisional
  const frozen = env.Replay.playT;
  check('playback frozen on provisional', env.Replay.playing === false);
  env.step(200);                             // < 400ms confirm window
  M.apOnSpeechFrame(false);                   // speech stops -> rescind
  check('state cleared after rescind', M.ap.state === 'none');
  check('playback resumed', env.Replay.playing === true);
  check('resumes from EXACT frozen position (no skip/repeat)', env.Replay.playT === frozen, { frozen, now: env.Replay.playT });
  const rec = M.ap.pauses[0];
  check('one rescinded record written (not discarded)', M.ap.pauses.length === 1 && rec.status === 'rescinded');
  check('rescinded record has no prompt', rec && rec.prompt_shown === false);
  // continue playing advances again
  env.step(100);
  check('playback advances after resume', env.Replay.playT === frozen + 100, env.Replay.playT);
})();

// ================= SCENARIO 3: manual pause parity + resume finalization =================
(function(){
  console.log('SCENARIO 3 — manual pause shows prompt, logs, resume finalizes duration');
  const env = makeEnv(); const M = instantiate(env);
  env.Replay.playing = true; M.apStart();
  env.step(500);
  M.apManualPause();
  check('manual pause freezes playback', env.Replay.playing === false);
  check('manual record confirmed + prompt', M.ap.pauses.length === 1 && M.ap.pauses[0].status === 'confirmed' && M.ap.pauses[0].prompt_shown === true);
  check('manual trigger_type', M.ap.pauses[0].trigger_type === 'manual');
  check('manual coordinate = current playT', M.ap.pauses[0].playback_position_ms === 500, M.ap.pauses[0].playback_position_ms);
  env.step(3000);                            // participant explains for 3s
  M.apResume();
  check('resume clears state', M.ap.state === 'none' && env.Replay.playing === true);
  const rec = M.ap.pauses[0];
  check('pause_duration_ms ~3000', Math.abs(rec.pause_duration_ms - 3000) <= 5, rec.pause_duration_ms);
})();

// ================= SCENARIO 4: aggregate math + speech-while-paused =================
(function(){
  console.log('SCENARIO 4 — aggregate: proportion_speech_while_playing, counts, median lag');
  const env = makeEnv(); const M = instantiate(env);
  env.Replay.playing = true; M.apStart();
  // silence while playing 0-500
  env.step(500); M.apOnSpeechFrame(false);
  // speech starts -> confirmed pause; participant keeps talking while paused
  env.step(64); M.apOnSpeechFrame(true);
  for(let i=0;i<12;i++){ env.step(50); M.apOnSpeechFrame(true); } // >400ms -> confirm, still speaking (paused)
  check('one confirmed vad pause', M.ap.pauses.length === 1 && M.ap.pauses[0].status === 'confirmed');
  M.apResume();                              // resume
  env.step(300); M.apOnSpeechFrame(false);   // silence while playing again
  const agg = M.apAggregate();
  check('n_pauses_total = 1', agg.n_pauses_total === 1, agg.n_pauses_total);
  check('n_pauses_vad_confirmed = 1', agg.n_pauses_vad_confirmed === 1);
  check('n_pauses_manual = 0', agg.n_pauses_manual === 0);
  check('proportion_speech_while_playing in [0,1]', agg.proportion_speech_while_playing >= 0 && agg.proportion_speech_while_playing <= 1, agg.proportion_speech_while_playing);
  check('most speech was while PAUSED (participant explained)', agg.speech_ms_while_paused > agg.speech_ms_while_playing, { paused: agg.speech_ms_while_paused, playing: agg.speech_ms_while_playing });
  check('median lag is a number', typeof agg.median_onset_to_pause_lag_ms === 'number', agg.median_onset_to_pause_lag_ms);
  check('records the confirm window & cadence for methods', agg.confirm_window_ms === 400 && agg.clock_sample_cadence_ms === 50);
})();

// ================= SCENARIO 5: fires-while-paused not a new pause (A9) =================
(function(){
  console.log('SCENARIO 5 — detector firing while already paused does not open a 2nd pause (A9)');
  const env = makeEnv(); const M = instantiate(env);
  env.Replay.playing = true; M.apStart();
  env.step(500); M.apOnSpeechFrame(true);
  for(let i=0;i<10;i++){ env.step(50); M.apOnSpeechFrame(true); } // confirm
  // fake a further rising edge while already paused/confirmed
  M.apOnSpeechFrame(false); M.apOnSpeechFrame(true);
  check('still exactly one pause record', M.ap.pauses.length === 1, M.ap.pauses.length);
})();

console.log('\n================  ' + PASS + ' passed, ' + FAIL + ' failed  ================');
process.exit(FAIL ? 1 : 0);
