
    let __whisperWorker = null, __workerReady = false, __modelProgress = 0;
    const WORKER_CODE = `
      import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
      env.allowLocalModels = false;
      let transcriber = null, MODEL = 'Xenova/whisper-small.en', MODEL_REVISION = 'fa16a75f5d91e83ecb6a2ccb690f14d91ef00ca4';
      self.onmessage = async (e) => {
        const { type } = e.data;
        if (type === 'warmup') {
          MODEL = e.data.model || MODEL;
          try {
            transcriber = await pipeline('automatic-speech-recognition', MODEL, {
              revision: MODEL_REVISION,
              progress_callback: (p) => { if (p && p.progress != null) self.postMessage({ type:'progress', progress: p.progress }); }
            });
            self.postMessage({ type:'ready' });
          } catch (err) { self.postMessage({ type:'error', message: String(err) }); }
        } else if (type === 'transcribe') {
          try {
            if (!transcriber) transcriber = await pipeline('automatic-speech-recognition', MODEL, { revision: MODEL_REVISION });
            const out = await transcriber(e.data.audioData, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true });
            self.postMessage({ type:'result', id: e.data.id, text: out && out.text ? out.text : '', chunks: out && out.chunks ? out.chunks : [] });
          } catch (err) { self.postMessage({ type:'error', id: e.data.id, message: String(err) }); }
        }
      };`;
    function initWhisperWorker() {
      if (__whisperWorker) return;
      if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('init');
      const url = URL.createObjectURL(new Blob([WORKER_CODE], { type: 'text/javascript' }));
      __whisperWorker = new Worker(url, { type: 'module' });
      __whisperWorker.onmessage = (e) => {
        const { type, progress } = e.data || {};
        if (type === 'progress') { __modelProgress = progress || 0; if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('downloading',{progress:__modelProgress}); }
        else if (type === 'ready') { __workerReady = true; if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('ready'); }
        else if (type === 'error') { console.error('Whisper worker error:', e.data.message); if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('error'); if (typeof window!=='undefined' && window.__onWhisperError) window.__onWhisperError(e.data); }
        else if (type === 'result') { if (typeof window!=='undefined' && window.__onWhisperResult) window.__onWhisperResult(e.data); }
      };
      __whisperWorker.onerror = (e) => { console.error('Whisper worker onerror:', e); if (typeof window!=='undefined' && window.setWhisperStatus) window.setWhisperStatus('error'); if (typeof window!=='undefined' && window.__onWhisperError) window.__onWhisperError({ message: (e && e.message) || 'worker error' }); };
      __whisperWorker.postMessage({ type: 'warmup', model: CONFIG.WHISPER_MODEL });
    }
    function warmUpTranscriber() { initWhisperWorker(); }

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

  