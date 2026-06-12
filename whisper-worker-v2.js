/*  whisper-worker.js  — ES module worker (requires {type:"module"} in main thread)
    Posts:
      { type:'progress', progress: 0-100 }
      { type:'ready' }
      { type:'result', text, chunks }
      { type:'error',  message }
*/

import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

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
    try {
      await loadModel();
      self.postMessage({ type:"ready" });
    } catch(err) {
      self.postMessage({ type:"error", message: String(err) });
    }
    return;
  }

  if (type === "transcribe") {
    try {
      await loadModel();
      const result = await transcriber(audioData, {
        return_timestamps: true,
        chunk_length_s:    30,
        stride_length_s:   5
      });
      self.postMessage({
        type:   "result",
        text:   result.text   || "",
        chunks: Array.isArray(result.chunks) ? result.chunks : []
      });
    } catch(err) {
      self.postMessage({ type:"error", message: String(err) });
    }
    return;
  }
};
