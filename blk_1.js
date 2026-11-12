

/* =====================================================================
   CAPABILITY GATE (hard) — from original checkBrowser. Fails fast on
   browsers lacking getUserMedia / WebM MediaRecorder /
   WASM / Fullscreen, and on mobile.
   ===================================================================== */
(function checkBrowser() {
  const ua = navigator.userAgent;
  const isMobile  = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isFirefox = /Firefox\//i.test(ua);
  const isSafari  = /^((?!chrome|android|crios|edg|edge).)*safari/i.test(ua);
  const missing = [];
  if (!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function"))    missing.push("microphone/camera access (getUserMedia)");
  const recOK = (typeof MediaRecorder !== "undefined");
  if (!recOK) missing.push("audio recording (MediaRecorder)");
  if (typeof WebAssembly !== "object") missing.push("WebAssembly (speech processing)");
  const el = document.documentElement;
  if (!(el.requestFullscreen || el.webkitRequestFullscreen)) missing.push("fullscreen mode");

  if (isMobile || missing.length > 0) {
    let reason;
    if (isMobile)       reason = "mobile browsers (this study must run on a desktop or laptop)";
    else                reason = "this browser, which is missing: " + missing.join(", ");
    document.body.style.background = "#e3e9f0";
    document.body.innerHTML = `
      <div style="max-width:580px;margin:12% auto;text-align:left;color:#1d2a38;font-family:'Segoe UI',Arial,sans-serif;padding:0 20px;">
        <h2 style="color:#c0392b;">Unsupported Browser</h2>
        <p style="font-size:17px;line-height:1.7;">This study runs in an up-to-date <strong>desktop web browser</strong> such as Chrome, Edge, Firefox, or Safari.</p>
        <p style="font-size:15px;color:#566673;">The study uses local speech processing that is not supported in ${reason}. Please reopen this link in a supported browser on a desktop or laptop computer.</p>
      </div>`;
    throw new Error("Unsupported browser — study halted (" + (isMobile ? "mobile" : missing.join("; ") || "ua") + ").");
  }
})();

/* =====================================================================
   CONFIG / SESSION STATE
   ===================================================================== */
const CONFIG = {
  WHISPER_MODEL: "Xenova/whisper-small.en",
  /* Qualtrics survey the participant returns to (to upload the session file).
     Filled in when the save chunk is built. */
  QUALTRICS_UPLOAD_URL: "REPLACE_WITH_QUALTRICS_UPLOAD_URL"
};

const __q = new URLSearchParams(location.search);
const study = {
  sub_id_from_url: __q.get("sub_id"),
  group: __q.get("group"),
  year_in_program: __q.get("year"),
  url_params: Object.fromEntries(__q.entries()),
  browser_check: null,
  permissions: {},
  session_started_at_ms: null,     // ms epoch session clock anchor (set at fullscreen); RTA/case-offset zero
  task_viewport: null,             // task viewport captured right after fullscreen settle
  cases: {},
  user_agent: navigator.userAgent,
  started_at: new Date().toISOString()
};
/* =====================================================================
   MICROPHONE PERMISSION GATE - converts an unanswered getUserMedia prompt
   into visible, actionable text via a 30s timeout, asks from a user gesture,
   and records granted/no_response/error/abandoned.
   ===================================================================== */
function permissionGate(kind) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    choices: "NO_KEYS",
    data: { trial_tag: "permission_gate_" + kind },
    stimulus: `<div style="max-width:560px;margin:8% auto;text-align:left;color:#1d2a38;font-family:'Segoe UI',Arial,sans-serif;">
        <h3 style="color:#1565c0;margin:0 0 12px;">Microphone access</h3>
        <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">Your microphone is used only for the think-aloud after each case. The audio is turned into text on your own computer. The recording itself is never uploaded, and only the text is kept.</p>
        <p id="pg_msg" style="font-size:14px;line-height:1.7;color:#44545f;margin:0 0 20px;">
          Click the button below. Your browser will ask for permission. Choose <strong>Allow</strong>.</p>
        <button id="pg_btn" style="background:#1565c0;color:#fff;border:none;border-radius:6px;padding:11px 22px;font-size:15px;cursor:pointer;font-family:inherit;">
          Enable microphone</button>
        <div id="pg_exit_wrap" style="display:none;margin-top:22px;">
          <button id="pg_exit" style="background:transparent;color:#7a8894;border:none;font-size:13px;cursor:pointer;text-decoration:underline;font-family:inherit;">
            I'm unable to enable this. End the session</button>
        </div>
      </div>`,
    on_load: function () {
      const btn = document.getElementById("pg_btn");
      const msg = document.getElementById("pg_msg");
      const exitWrap = document.getElementById("pg_exit_wrap");
      const exitBtn  = document.getElementById("pg_exit");
      let settled = false, attempts = 0;
      function record(state, detail) {
        study.permissions[kind] = { state, detail: detail || null, attempts, t: new Date().toISOString() };
      }
      btn.addEventListener("click", async () => {
        if (settled) return;
        attempts++; btn.disabled = true; btn.style.opacity = ".6"; btn.textContent = "Waiting for your response...";
        msg.innerHTML = `Look for the permission prompt near your browser's address bar and click <strong>Allow</strong>. If you don't see it, check for a small microphone icon at the right-hand end of the address bar.`;
        let timer;
        const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("PENDING_TIMEOUT")), 30000); });
        try {
          const stream = await Promise.race([ navigator.mediaDevices.getUserMedia({ audio: true }), timeout ]);
          clearTimeout(timer);
          stream.getTracks().forEach(t => t.stop());   // release; the plugin reopens it
          settled = true; record("granted");
          msg.innerHTML = `<span style="color:#16692f;">Access granted. Continuing...</span>`;
          btn.style.display = "none";
          setTimeout(() => jsPsych.finishTrial(), 600);
        } catch (e) {
          clearTimeout(timer);
          const pending = (e && e.message === "PENDING_TIMEOUT");
          record(pending ? "no_response" : "error", e && e.name ? e.name : String(e));
          btn.disabled = false; btn.style.opacity = "1"; btn.textContent = "Try again";
          const osHelp = `<br><br><strong>If no prompt appeared at all</strong>, your browser may not have permission from your operating system:<br>
               &bull; <strong>macOS</strong>: System Settings &rsaquo; Privacy &amp; Security &rsaquo; Microphone, and switch on your browser.<br>
               &bull; <strong>Windows</strong>: Settings &rsaquo; Privacy &amp; security &rsaquo; Microphone, and allow desktop apps.<br>
               You may need to restart the browser afterwards.`;
          msg.innerHTML = pending
            ? `<strong style="color:#c0392b;">No response received.</strong> If a prompt appeared, choose <strong>Allow</strong>. If it is hidden, click the padlock icon at the left of the address bar and set <strong>Microphone</strong> to <strong>Allow</strong>.${osHelp}`
            : (e && e.name === "NotFoundError")
              ? `<strong style="color:#c0392b;">No microphone found.</strong> Your browser reports no microphone is connected. Connect one and click Try again.`
              : `<strong style="color:#c0392b;">Access was blocked.</strong> Click the padlock icon at the left of the address bar, set <strong>Microphone</strong> to <strong>Allow</strong>, then click Try again.${osHelp}`;
          if (attempts >= 2 && exitWrap) exitWrap.style.display = "block";
        }
      });
      if (exitBtn) exitBtn.addEventListener("click", () => {
        if (settled) return;
        settled = true; record("abandoned");
        jsPsych.endExperiment(`<div style="max-width:560px;margin:10% auto;text-align:left;color:#1d2a38;font-family:'Segoe UI',Arial,sans-serif;">
             <h3 style="color:#1565c0;">Session ended</h3>
             <p style="font-size:15px;line-height:1.7;">This study can't run without microphone access. Nothing has been recorded. Please email
             <a href="mailto:dennis.culver@drake.edu" style="color:#1565c0;">dennis.culver@drake.edu</a> if you'd like to take part on a different device.</p>
           </div>`);
      });
    }
  };
}

/* =====================================================================
   jsPsych INIT
   ===================================================================== */
var jsPsych = initJsPsych({
  on_finish: function () { /* terminal screen is the Chunk 4 export trial */ }
});

/* =====================================================================
   TIMELINE
   ===================================================================== */
var timeline = [];

/* 2 — ★ FULLSCREEN (Option 3), on its own fresh click AFTER share. Because no
   browser dialog follows, fullscreen HOLDS. We then measure the fullscreen
   viewport (the task viewport) and set the session clock anchor. */
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  choices: "NO_KEYS",
  data: { trial_tag: "enter_fullscreen" },
  stimulus: `<div style="max-width:640px;margin:9% auto;text-align:left;color:#1d2a38;font-family:'Segoe UI',Arial,sans-serif;">
      <h2 style="color:#1565c0;">Continue in full screen</h2>
      <p style="font-size:17px;line-height:1.7;">The study runs in full screen so the whole interface fits. Click the button to continue. Stay in full screen for the rest of the session.</p>
      <button id="fs_btn" style="margin-top:10px;padding:14px 30px;background:#1565c0;color:#fff;border:none;border-radius:6px;font-weight:700;font-size:15px;cursor:pointer;">Continue in full screen</button>
      <p id="fs_err" style="color:#c0392b;margin-top:10px;"></p>
    </div>`,
  on_load: function () {
    const btn = document.getElementById("fs_btn");
    btn.addEventListener("click", async () => {
      btn.disabled = true; if(!study.session_started_at_ms) study.session_started_at_ms = Date.now();   /* kept on resume */
      try { await document.documentElement.requestFullscreen(); }
      catch (fe) { console.warn("requestFullscreen failed:", fe); }
      /* let the fullscreen resize settle before measuring the task viewport */
      setTimeout(() => {
        const vh = window.innerHeight, vw = window.innerWidth;
        study.task_viewport = { w: vw, h: vh };   // definitive task viewport
        study.__fsActive = true; if(typeof installFullscreenGuardian==="function") installFullscreenGuardian();
        jsPsych.finishTrial();
      }, 350);
    });
  }
});

/* 2 — Browser-check: WIDTH is a hard gate (below 1000 the columns collide);
   HEIGHT no longer rejects (minimum_height 0). Short screens proceed rather than being turned away. Runs after fullscreen,
   so it measures the real task viewport. Custom message wording uses "study", not the
   plugin default. */
timeline.push({
  type: jsPsychBrowserCheck,
  minimum_width: 1000,
  minimum_height: 0,
  allow_window_resize: true,
  window_resize_message: `<div style="max-width:620px;margin:10% auto;text-align:left;color:#1d2a38;font-family:'Segoe UI',Arial,sans-serif;">
      <p style="font-size:16px;line-height:1.7;">Your browser window is too narrow to complete this study. Please widen or maximize the window. The minimum width is 1000&nbsp;px.</p></div>`,
  inclusion_function: () => true,   // hard capability gating already handled by checkBrowser()
  on_finish: function (data) {
    study.browser_check = {
      browser: data.browser, browser_version: data.browser_version, os: data.os, mobile: data.mobile,
      width: data.width, height: data.height, webaudio: data.webaudio, fullscreen: data.fullscreen,
      vsync_rate: data.vsync_rate, webcam: data.webcam, microphone: data.microphone
    };
  }
});

/* 3 — Microphone permission + init (ALWAYS — the RTA needs audio). */
timeline.push(permissionGate("microphone"));
timeline.push({
  type: jsPsychInitializeMicrophone,
  data: { trial_tag: "init_microphone" }
});

/* 6 — Whisper warmup (background). Loads the model while the participant
   reads; used by the RTA in Chunk 3. */
timeline.push({
  type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS",
  data: { trial_tag: "whisper_warmup" },
  stimulus: `<div style="max-width:580px;margin:12% auto;text-align:center;color:#1d2a38;font-family:'Segoe UI',Arial,sans-serif;">
      <h3 style="color:#1565c0;margin-bottom:16px;">Preparing speech analysis tools</h3>
      <p style="color:#44545f;margin-bottom:20px;">A speech model is loading in a background thread. The page stays responsive.<br>This only happens once.</p>
      <p style="color:#8a9aa7;font-size:14px;">Continuing automatically…</p>
    </div>`,
  trial_duration: 1500,
  on_load: function () { warmUpTranscriber(); }
});

/* END OF CHUNK 1 — on_finish placeholder renders the captured session state. */


