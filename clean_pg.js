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
