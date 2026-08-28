/* =====================================================================
   RTA NARRATION RE-ANCHORING  (Chunk 3)
   Captures retrospective think-aloud utterances during true-tempo replay
   and places them on the study's shared task-time axis.

   Principle (decision log C; project README section 2):
   an utterance spoken while the replay is SHOWING case-relative time playT
   is anchored at playT - the task-moment the participant was re-viewing when
   they spoke. Because playT is frozen while the replay is paused, an
   utterance spoken during a pause anchors to the moment the participant
   paused to explain (the intended behavior).

   case_relative_t  = playT                            (within one case)
   session_offset_t = case_started_offset_ms + playT   (one session clock)

   NOTE (methods, not code): the temporal-influence function that consumes
   these coordinates must be directed and backward-reaching - a pause-cued
   explanation accounts for a span of prior actions ENDING at/just before
   playT, not simultaneous ones. This module records the coordinate; the
   backward-reaching lead is modeled downstream and named in Chapter 3.

   DOM-free and framework-free: unit-testable in Node, reusable by the replay
   harness and by chunk2 unchanged.
   ===================================================================== */

/* Capture buffer for one case's replay. */
function makeNarrationCapture(){
  var narration = [];
  return {
    /* Record one utterance at the task-moment the replay was showing.
       text     : transcribed utterance (final or partial)
       playTMs  : controller playT at the moment of the utterance (ms)
       opts     : { paused:bool, wall_t:number|null, kind:'final'|'partial' } */
    noteUtterance: function(text, playTMs, opts){
      if(text == null) return null;
      opts = opts || {};
      var u = {
        text: String(text),
        playT: Math.max(0, Math.round(Number(playTMs) || 0)),
        paused: !!opts.paused,
        wall_t: (opts.wall_t != null ? opts.wall_t : null),
        kind: opts.kind || 'final'
      };
      narration.push(u);
      return u;
    },
    getNarration: function(){ return narration.slice(); },
    count: function(){ return narration.length; },
    clear: function(){ narration.length = 0; }
  };
}

/* Pure re-anchor of one captured utterance onto the shared task-time axes. */
function reanchorUtterance(u, caseStartedOffsetMs){
  var off = (caseStartedOffsetMs == null ? null : Number(caseStartedOffsetMs));
  return {
    text: u.text,
    case_relative_t: u.playT,
    session_offset_t: (off == null ? null : off + u.playT),
    paused: !!u.paused,
    kind: u.kind || 'final'
  };
}

/* Re-anchor a whole narration buffer; preserves order. */
function reanchorAll(narration, caseStartedOffsetMs){
  return (narration || []).map(function(u){ return reanchorUtterance(u, caseStartedOffsetMs); });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { makeNarrationCapture: makeNarrationCapture, reanchorUtterance: reanchorUtterance, reanchorAll: reanchorAll };
}
if (typeof window !== "undefined") {
  window.Reanchor = { makeNarrationCapture: makeNarrationCapture, reanchorUtterance: reanchorUtterance, reanchorAll: reanchorAll };
}
