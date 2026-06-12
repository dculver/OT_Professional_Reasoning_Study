/*  whisper-worker.js
    Runs Whisper (small.en) in a dedicated Web Worker thread.
    The main thread posts { type:'transcribe', audioData: Float32Array }
    and receives back { type:'result', text, chunks } or { type:'error', message }
    Progress updates are sent as { type:'progress', progress: 0-100 }
*/

importScripts("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js");

const { pipeline, env } = self.Transformers;
env.allowLocalModels = false;
env.useBrowserCache  = true;

let transcriber = null;

async function loadModel() {
  if (transcriber) return;
  transcriber = await pipeline(
    "automatic-speech-recognition",
    "Xenova/whisper-small.en",
    {
      progress_callback: (p) => {
        if (p && p.progress != null) {
          self.postMessage({ type:"progress", progress: Math.round(p.progress) });
        }
      }
    }
  );
}

self.onmessage = async (e) => {
  const { type, audioData } = e.data;

  if (type === "warmup") {
    try { await loadModel(); self.postMessage({ type:"ready" }); }
    catch(err) { self.postMessage({ type:"error", message: err.message }); }
    return;
  }

  if (type === "transcribe") {
    try {
      await loadModel();
      const result = await transcriber(audioData, {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5
      });
      self.postMessage({
        type:   "result",
        text:   result.text   || "",
        chunks: Array.isArray(result.chunks) ? result.chunks : []
      });
    } catch(err) {
      self.postMessage({ type:"error", message: err.message });
    }
    return;
  }
};
