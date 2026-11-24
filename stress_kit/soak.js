/* Stress kit: automated participants with REAL speech and the REAL speech model.
   Each participant completes the practice and both cases, "speaks" recorded clips into a
   simulated microphone during the think-alouds, and downloads the final session file. The
   kit then checks the file and writes a report.

   Usage (from this folder):
     node soak.js                                 # 1 participant, 40 actions per case
     node soak.js --participants 5 --actions 60   # longer soak
     node soak.js --audio-export                  # also exercise audio export (&export_audio=1)
     node soak.js --url https://.../index_full.html   # test the live site instead of this repo
     node soak.js --headed                        # watch the browser
   Output: soak_out/<run>/report.md, metrics_<participant>.csv, the session files.

   How the "speech" works: the page's microphone is replaced (in this test browser only) by a
   stream the kit controls. When a think-aloud recording starts, the kit plays one clip into it,
   so it knows exactly what was said for every recording and can score the transcript.
   Nothing in the study tool is changed. */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

// ---------- options ----------
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); if (i < 0) return def; const v = argv[i + 1]; return (v === undefined || v.startsWith('--')) ? true : v; };
const N_PART = parseInt(opt('participants', 1), 10);
const N_ACTIONS = parseInt(opt('actions', 40), 10);
const RECORD_RATIO = parseFloat(opt('record-ratio', 0.6));
const AUDIO_EXPORT = !!opt('audio-export', false);
const LIVE_URL = opt('url', null);
const HEADED = !!opt('headed', false);
const STUB = !!opt('stub-transcriber', false);          // kit self-test only: fake transcripts
const REPO = path.resolve(__dirname, '..');
const CLIPS_DIR = path.resolve(opt('clips', path.join(__dirname, 'clips')));
const RUN = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = path.join(__dirname, 'soak_out', RUN);
const PORT = parseInt(opt('port', 8790), 10);
fs.mkdirSync(OUT, { recursive: true });
const logf = fs.createWriteStream(path.join(OUT, 'log.txt'));
const log = (...a) => { const s = '[' + new Date().toISOString().slice(11, 19) + '] ' + a.join(' '); console.log(s); logf.write(s + '\n'); };

// ---------- clips ----------
const clips = fs.existsSync(CLIPS_DIR) ? fs.readdirSync(CLIPS_DIR).filter(f => f.endsWith('.wav')).sort().map(f => {
  const txt = path.join(CLIPS_DIR, f.replace(/\.wav$/, '.txt'));
  return { file: f, text: fs.existsSync(txt) ? fs.readFileSync(txt, 'utf8').trim() : null };
}) : [];
if (!clips.length) { console.error('No clips found in ' + CLIPS_DIR + '. Run ./make_clips.sh first (see README).'); process.exit(1); }
const terms = fs.existsSync(path.join(CLIPS_DIR, 'terms.txt')) ? fs.readFileSync(path.join(CLIPS_DIR, 'terms.txt'), 'utf8').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

// ---------- local server: the repo (unless --url) and the clips ----------
const FAKE_TF = `export const env = {}; let n = 0;
export async function pipeline(){ return async function(audio){ n++; const s = audio.length / 16000; await new Promise(r => setTimeout(r, 100 + s * 50));
  return { text: ' stub transcript ' + n, chunks: [{ text: ' stub transcript ' + n, timestamp: [0, s] }] }; }; }`;
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (u.startsWith('/__clips/')) {
    const f = path.join(CLIPS_DIR, path.basename(u));
    return fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': 'audio/wav' }); res.end(b); });
  }
  if (u === '/__fake_tf.js') { res.writeHead(200, { 'Content-Type': 'application/javascript' }); return res.end(FAKE_TF); }
  const f = path.join(REPO, u === '/' ? 'index_full.html' : u);
  if (!f.startsWith(REPO)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    if (STUB && f.endsWith('index_full.html')) b = Buffer.from(b.toString('utf8').replace('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2', 'http://localhost:' + PORT + '/__fake_tf.js'));
    const ct = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'application/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct }); res.end(b);
  });
});

// ---------- simulated microphone (test browser only) ----------
const MIC_SHIM = `(() => {
  const md = navigator.mediaDevices; if (!md) return;
  const realGUM = md.getUserMedia.bind(md);
  let ctx = null, dest = null, cur = null; const cache = {};
  function ensure(){ if (!ctx){ ctx = new AudioContext({ sampleRate: 48000 }); dest = ctx.createMediaStreamDestination(); } if (ctx.state === 'suspended') ctx.resume(); }
  md.getUserMedia = async function(c){ if (c && c.audio){ ensure(); return new MediaStream(dest.stream.getAudioTracks().map(t => t.clone())); } return realGUM(c); };
  window.__playClip = async function(url){ ensure();
    if (!cache[url]){ const ab = await (await fetch(url)).arrayBuffer(); cache[url] = await ctx.decodeAudioData(ab); }
    if (cur){ try { cur.stop(); } catch(e){} }
    const s = ctx.createBufferSource(); s.buffer = cache[url]; s.connect(dest); s.start(); cur = s; return cache[url].duration; };
  window.__stopClip = function(){ if (cur){ try { cur.stop(); } catch(e){} cur = null; } };
})();`;

// ---------- page helpers ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function selectText(page, src, start, len) {
  const ok = await page.evaluate(({ src, start, len }) => {
    const el = document.querySelector('[data-src="' + src + '"]'); if (!el) return false;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, node = null;
    while ((n = w.nextNode())) { if (n.textContent.length >= start + len && n.textContent.slice(start, start + len).trim().length >= Math.min(8, len)) { node = n; break; } }
    if (!node) return false;
    const r = document.createRange(); r.setStart(node, start); r.setEnd(node, start + len);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.getElementById('case_body').dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); return true;
  }, { src, start, len });
  if (!ok) return false;
  try { await page.waitForSelector('#pk_sup', { timeout: 4000 }); return true; } catch (e) { return false; }
}
async function classify(page, src, start, len, valence, mech, occIdx) {
  if (!(await selectText(page, src, start, len))) return false;
  await page.click(valence === 'barrier' ? '#pk_bar' : '#pk_sup');
  await page.fill('#pk_mech', mech);
  const boxes = await page.$$('#pk_occ input[type=checkbox]');
  for (const i of occIdx) if (boxes[i]) await boxes[i].check();
  if (!boxes.length) { await page.mouse.click(5, 5); return false; }
  await page.click('#pk_go'); await sleep(300); return true;
}
async function addOcc(page, name, desc) { await page.fill('#occ_input', name); await page.fill('#occ_desc', desc); await page.click('#occ_add'); await sleep(250); }
async function typeInto(page, sel, text) { await page.click(sel); await page.type(sel, text, { delay: 12 }); await page.click('#aoi_synthesis .panel-head'); await sleep(900); }
async function appendInto(page, sel, text) {   /* type at the END of a text box (a click alone can land mid-text) */
  await page.click(sel); await page.evaluate(s => { const el = document.querySelector(s); el.selectionStart = el.selectionEnd = el.value.length; }, sel);
  await page.keyboard.type(text, { delay: 12 }); await page.click('#aoi_synthesis .panel-head'); await sleep(900); }
async function srcIds(page) { return page.evaluate(() => Array.from(document.querySelectorAll('#case_body [data-src]')).map(e => e.dataset.src)); }
async function collapseChecklist(page) { if (await page.$('#cl.open')) { await page.click('#cl .cl-bar'); await sleep(200); } }

const OCCS = [['Dressing', 'Gets dressed each morning without waiting for help.'], ['Bathing', 'Showers safely at home.'], ['Sleep', 'Sleeps through the night.'],
  ['Meal preparation', 'Makes simple meals for herself.'], ['Work', 'Returns to her job.'], ['Social participation', 'Keeps lunches with her friend.']];
const MECHS = ['Limited shoulder reach makes overhead tasks unsafe right now.', 'Her aide is there every morning, so a home program can actually happen.',
  'Pain at night is cutting into sleep, which drains energy for everything else.', 'She is highly motivated to stay in her own apartment.',
  'Fatigue from the arthritis limits how long she can stand at the counter.', 'Coverage limits the number of visits, so goals must be realistic.'];
const IMPRESSION = ['She wants to stay in her own home.', 'Reduced reach limits dressing and bathing.', 'Poor sleep is making everything else harder.', 'Her aide is the key support for a home program.'];

async function practiceWork(page) {
  await page.waitForSelector('#occ_input', { timeout: 30 * 60000 });          // first run downloads the speech model
  await page.evaluate(() => document.querySelectorAll('.coach').forEach(e => e.remove()));
  await addOcc(page, OCCS[0][0], OCCS[0][1]); await addOcc(page, OCCS[4][0], OCCS[4][1]);
  await page.click('.tab[data-tab="chart"]'); await sleep(250); await page.click('.tab[data-tab="profile"]'); await sleep(250);   /* checklist: open the Initial Evaluation tab */
  const ids = await srcIds(page);
  await classify(page, ids[0], 0, 20, 'barrier', MECHS[0], [0]);
  await classify(page, ids[1], 0, 20, 'support', MECHS[3], [1]);   /* checklist: mark a support */
  await typeInto(page, '#synthesis_impression', 'She wants to return to work.');
  await page.fill('#outcome_input', 'Return to work'); await page.click('#outcome_add'); await sleep(250);
  await collapseChecklist(page);
  await page.check('input[data-bar] >> nth=0'); await sleep(400);
  for (const f of ['approach', 'method', 'grading']) await typeInto(page, '[data-f="' + f + '"]', 'Practice ' + f + '.');
  await typeInto(page, '#ip_prioritization', 'Work matters most.'); await typeInto(page, '#ip_goal', 'Return to work in 6 weeks.'); await typeInto(page, '#ip_immediate', 'Protect the repair.');
  if (!(await page.$('#cl.open'))) { await page.click('#cl .cl-bar'); await sleep(200); }
  await page.waitForSelector('.cl-continue:not([disabled])', { timeout: 15000 });
  await page.click('.cl-continue');
}

/* A long, realistic case: occupations, many classifications, impression revisions, outcomes,
   a few long pauses, and a full plan for two barriers. Returns the number of actions done. */
async function longCaseWork(page, nActions, stats) {
  await page.waitForSelector('#occ_input', { timeout: 60000 });
  await collapseChecklist(page);
  let done = 0; const ids = await srcIds(page);
  const nOcc = Math.min(OCCS.length, Math.max(2, Math.round(nActions / 10)));
  for (let i = 0; i < nOcc; i++) { await addOcc(page, OCCS[i][0], OCCS[i][1]); done++; }
  const pauses = new Set([Math.floor(nActions * 0.3), Math.floor(nActions * 0.7)]);
  let k = 0, impr = 0;
  while (done < nActions - 9) {
    k++;
    if (pauses.has(done)) { log('    idle 23 s (should become a pause item)'); await sleep(23000); pauses.delete(done); }
    if (k % 7 === 0 && impr < IMPRESSION.length) { await appendInto(page, '#synthesis_impression', (impr ? ' ' : '') + IMPRESSION[impr]); impr++; done++; continue; }
    if (k % 9 === 0) { await page.fill('#outcome_input', 'Outcome ' + k); await page.click('#outcome_add'); await sleep(250); done++; continue; }
    if (k % 5 === 0) { await page.click('.tab[data-tab="' + (k % 10 === 0 ? 'profile' : 'chart') + '"]').catch(() => {}); await sleep(200); }
    const src = ids[k % ids.length], start = (Math.floor(k / ids.length) % 4) * 22;
    const ok = await classify(page, src, start, 18, k % 3 === 0 ? 'support' : 'barrier', MECHS[k % MECHS.length], k % 4 === 0 ? [0, 1] : [k % nOcc]).catch(() => false);
    if (ok) done++; else { stats.classifyMisses++; if (stats.classifyMisses > nActions * 2) break; }
  }
  // plan for two barriers
  await collapseChecklist(page);
  const nb = await page.$$eval('input[data-bar]', a => a.length);
  for (let b = 0; b < Math.min(2, nb); b++) { await page.check('input[data-bar] >> nth=' + b); await sleep(400); done++; }
  for (let b = 0; b < Math.min(2, nb); b++) for (const f of ['approach', 'method', 'grading']) { await typeInto(page, '[data-f="' + f + '"] >> nth=' + b, 'Plan ' + f + ' for barrier ' + (b + 1) + '.'); done++; }
  await typeInto(page, '#ip_prioritization', 'Sleep and reach drive everything else.'); await typeInto(page, '#ip_goal', 'Dress upper body independently in 4 weeks.'); await typeInto(page, '#ip_immediate', 'Night-time immobilizer use.');
  if (!impr) await appendInto(page, '#synthesis_impression', IMPRESSION[0]);
  return done;
}
async function submitCase(page) { await page.click('.case-submit'); await page.waitForSelector('.ui-modal-ov button >> text=Submit', { timeout: 8000 }); await page.click('.ui-modal-ov button >> text=Submit'); }

/* Think-aloud: respond to every item in order. Records (plays a clip) on about RECORD_RATIO of
   items, and always on the first practice item (the practice requires one recording). */
async function thinkAloud(page, caseId, plan, stats) {
  await page.waitForSelector('#ta_intro_go', { timeout: 60000 }); await page.click('#ta_intro_go');
  let n = 0, clipIdx = stats.clipCursor;
  for (let guard = 0; guard < 2000; guard++) {
    const s = await page.evaluate(() => ({ fin: !document.getElementById('ta_finish').disabled, rec: !document.getElementById('ta_rec').disabled,
      no: !document.getElementById('ta_nothing').disabled, cur: window.__TA ? __TA.current : null, item: window.__TA && __TA.items[__TA.current] ? __TA.items[__TA.current].item_id : null }));
    if (s.fin) break;
    if (!s.rec && !s.no) { await sleep(250); continue; }
    const wantRecord = s.rec && ((caseId === 'practice' && n === 0) || (!s.no) || Math.random() < RECORD_RATIO);
    if (wantRecord) {
      const clip = clips[clipIdx % clips.length]; clipIdx++;
      await page.click('#ta_rec');
      await page.waitForFunction(() => !document.getElementById('ta_done').disabled, null, { timeout: 30000 });
      const dur = await page.evaluate(u => window.__playClip(u), 'http://localhost:' + PORT + '/__clips/' + clip.file);
      await sleep(Math.round(dur * 1000) + 800);
      await page.click('#ta_done');
      plan.push({ case_id: String(caseId), item_id: s.item, clip: clip.file, ref: clip.text });
    } else { await page.click('#ta_nothing'); }
    n++; await sleep(400);
  }
  stats.clipCursor = clipIdx;
  await page.click('#ta_finish'); await page.click('.ui-modal-ov button >> text=Finish');
  return n;
}

// ---------- metrics sampling ----------
async function sample(page) {
  return page.evaluate(async () => {
    const m = performance.memory ? performance.memory.usedJSHeapSize : null;
    let usage = null; try { usage = (await navigator.storage.estimate()).usage; } catch (e) {}
    const tq = (typeof TQ !== 'undefined') ? TQ.stats() : {};
    const ps = (typeof Persist !== 'undefined') ? Persist.saveStats : {};
    return { heap: m, storage: usage, queued: tq.queued, busy: tq.busy, done: tq.done, errors: tq.error, timeouts: tq.timeout, saves: ps.n, max_block_ms: ps.maxSyncMs };
  }).catch(() => null);
}

// ---------- scoring ----------
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
function wer(ref, hyp) {
  const r = norm(ref).split(' ').filter(Boolean), h = norm(hyp).split(' ').filter(Boolean);
  if (!r.length) return null;
  const d = Array.from({ length: r.length + 1 }, (_, i) => [i].concat(new Array(h.length).fill(0)));
  for (let j = 1; j <= h.length; j++) d[0][j] = j;
  for (let i = 1; i <= r.length; i++) for (let j = 1; j <= h.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1));
  return d[r.length][h.length] / r.length;
}
const median = a => { const b = a.filter(x => x != null).sort((x, y) => x - y); if (!b.length) return null; const m = Math.floor(b.length / 2); return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const fmt = (x, d = 2) => x == null ? 'n/a' : (typeof x === 'number' ? x.toFixed(d) : String(x));

// ---------- one participant ----------
async function runParticipant(browser, idx) {
  const sub = 'SOAKTEST_' + RUN.replace(/-/g, '').slice(0, 14) + '_' + String(idx + 1).padStart(2, '0');
  const group = (idx % 2) + 1;
  const base = LIVE_URL || ('http://localhost:' + PORT + '/index_full.html');
  const url = base + (base.includes('?') ? '&' : '?') + 'sub_id=' + sub + '&group=' + group + '&year=2&dev=1' + (AUDIO_EXPORT ? '&export_audio=1' : '');
  const res = { sub, group, ok: false, errors: [], phases: {}, plan: [], stats: { classifyMisses: 0, clipCursor: idx * 3 }, samples: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await ctx.grantPermissions(['microphone'], { origin: new URL(base).origin });
  await ctx.addInitScript(MIC_SHIM);
  await ctx.route(/qualtrics\.com/i, r => r.abort());   /* never reach the real survey */
  const page = await ctx.newPage();
  page.on('pageerror', e => { res.errors.push(String(e).slice(0, 300)); log('  PAGE ERROR', String(e).slice(0, 200)); });
  page.on('dialog', d => d.accept());
  const csv = fs.createWriteStream(path.join(OUT, 'metrics_' + sub + '.csv'));
  csv.write('elapsed_s,phase,heap_mb,storage_mb,tq_queued,tq_busy,tq_done,tq_errors,tq_timeouts,saves,max_block_ms\n');
  let phase = 'start'; const t0 = Date.now();
  const timer = setInterval(async () => {
    const s = await sample(page); if (!s) return; res.samples.push(Object.assign({ phase }, s));
    csv.write([((Date.now() - t0) / 1000).toFixed(0), phase, s.heap ? (s.heap / 1048576).toFixed(1) : '', s.storage ? (s.storage / 1048576).toFixed(1) : '', s.queued, s.busy, s.done, s.errors, s.timeouts, s.saves, s.max_block_ms].join(',') + '\n');
  }, 15000);
  const mark = p => { res.phases[phase] = ((Date.now() - (res._ps || t0)) / 1000); res._ps = Date.now(); phase = p; log('  ' + sub + ': ' + p); };
  try {
    await page.goto(url, { timeout: 120000 });
    mark('intro');
    await page.click('#fs_btn');
    await page.waitForSelector('#pg_btn', { timeout: 30000 }); await page.click('#pg_btn');
    await page.waitForSelector('#btn-select-mic', { timeout: 30000 }); await page.click('#btn-select-mic');
    mark('practice (includes speech-model download)'); await practiceWork(page);
    mark('practice think-aloud'); await thinkAloud(page, 'practice', res.plan, res.stats);
    for (const cid of [1, 2]) {
      mark('case ' + cid); res['actions_' + cid] = await longCaseWork(page, N_ACTIONS, res.stats); await submitCase(page);
      mark('case ' + cid + ' think-aloud'); res['items_' + cid] = await thinkAloud(page, cid, res.plan, res.stats);
      if (cid === 1) {
        await page.waitForSelector('#cp_dl', { timeout: 60000 });
        await page.waitForFunction(() => !document.getElementById('cp_dl').disabled, null, { timeout: 120000 });
        const [d] = await Promise.all([page.waitForEvent('download'), page.click('#cp_dl')]);
        await d.saveAs(path.join(OUT, sub + '_checkpoint.json')); await page.click('#cp_go');
      }
    }
    mark('waiting for transcription + final file');
    await page.waitForSelector('#dl', { timeout: 30 * 60000 });
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#dl')]);
    res.file = path.join(OUT, sub + '_final.json'); await d.saveAs(res.file);
    mark('done'); res.ok = true;
  } catch (e) {
    res.failure = String(e).split('\n')[0].slice(0, 300); log('  FAILED at "' + phase + '": ' + res.failure);
    try { await page.screenshot({ path: path.join(OUT, sub + '_failure.png') }); } catch (e2) {}
  }
  clearInterval(timer); csv.end();
  res.totalMin = (Date.now() - t0) / 60000;
  await ctx.close();
  return res;
}

// ---------- analysis of one final file ----------
function analyze(res) {
  const a = { checks: [], wers: [], rtfs: [], termHits: 0, termTotal: 0, statuses: {} };
  const chk = (name, ok, note) => a.checks.push({ name, ok: !!ok, note: note == null ? '' : String(note) });
  chk('completed every step', res.ok, res.failure || '');
  chk('no page errors', res.errors.length === 0, res.errors.slice(0, 2).join(' | '));
  if (!res.file || !fs.existsSync(res.file)) return a;
  const bytes = fs.statSync(res.file).size; a.bytes = bytes;
  const F = JSON.parse(fs.readFileSync(res.file, 'utf8'));
  chk('file is schema v2, final', F.schema === 'ot_prof_reasoning_v2' && F.export_kind === 'final');
  chk('all steps recorded as done', ['case:practice', 'ta:practice', 'case:1', 'ta:1', 'checkpoint', 'case:2', 'ta:2'].every(s => (F.session.steps_done || []).includes(s)));
  chk('file under the 45 MB upload warning', bytes < 45e6, (bytes / 1e6).toFixed(2) + ' MB');
  const recs = [];
  for (const c of F.cases) {
    if (!c.analyzed) continue;
    chk('case ' + c.case_id + ': every item answered', c.rta_items.every(i => i.response === 'recorded' || i.response === 'nothing_to_add'), c.rta_items.length + ' items');
    chk('case ' + c.case_id + ': has pause items', c.rta_items.some(i => i.kind === 'pause'));
    for (const it of c.rta_items) for (const r of (it.recordings || [])) recs.push(Object.assign({ case_id: String(c.case_id), item_id: it.item_id }, r));
  }
  for (const r of recs) {
    const st = r.transcription && r.transcription.status; a.statuses[st] = (a.statuses[st] || 0) + 1;
    if (r.transcription && r.transcription.rtf != null) a.rtfs.push(r.transcription.rtf);
  }
  const nonSilent = recs.filter(r => !r.silent);
  chk('every analyzed recording transcribed (status "done")', nonSilent.every(r => r.transcription && r.transcription.status === 'done'), JSON.stringify(a.statuses));
  chk('no silent recordings (the simulated mic was heard)', recs.every(r => !r.silent), recs.filter(r => r.silent).length + ' silent');
  if (AUDIO_EXPORT) chk('audio exported for every analyzed recording', F.session.audio_export && F.session.audio_export.n_missing === 0, JSON.stringify(F.session.audio_export || {}).slice(0, 120));
  // per-recording accuracy (kit knows exactly which clip was played for each item)
  const byItem = {}; for (const p of res.plan) if (p.case_id !== 'practice') (byItem[p.case_id + '|' + p.item_id] = byItem[p.case_id + '|' + p.item_id] || []).push(p);
  a.rows = [];
  for (const r of nonSilent) {
    const p = (byItem[r.case_id + '|' + r.item_id] || []).shift(); if (!p || !p.ref) continue;
    const hyp = r.transcription && r.transcription.text; const w = wer(p.ref, hyp); a.wers.push(w);
    const refN = norm(p.ref), hypN = norm(hyp);
    for (const t of terms) if (refN.includes(t)) { a.termTotal++; if (hypN.includes(t)) a.termHits++; }
    a.rows.push({ case_id: r.case_id, item: r.item_id, clip: p.clip, wer: w, rtf: r.transcription && r.transcription.rtf, ref: p.ref, hyp: (hyp || '').trim() });
  }
  const maxBlock = Math.max(0, ...res.samples.map(s => s.max_block_ms || 0));
  chk('autosave never froze the page over 200 ms', maxBlock <= 200, maxBlock + ' ms');
  const maxQueue = Math.max(0, ...res.samples.map(s => (s.queued || 0) + (s.busy ? 1 : 0)));
  a.maxQueue = maxQueue; a.maxBlock = maxBlock;
  a.peakHeapMB = Math.max(0, ...res.samples.map(s => (s.heap || 0) / 1048576));
  a.peakStorageMB = Math.max(0, ...res.samples.map(s => (s.storage || 0) / 1048576));
  return a;
}

// ---------- main ----------
(async () => {
  if (!LIVE_URL || clips.length) await new Promise(r => server.listen(PORT, r));
  log('Stress kit run ' + RUN + ': ' + N_PART + ' participant(s), ' + N_ACTIONS + ' actions per case, record ratio ' + RECORD_RATIO + ', clips ' + clips.length + (AUDIO_EXPORT ? ', audio export ON' : '') + (STUB ? ', STUB transcriber (self-test only)' : '') + (LIVE_URL ? ', live URL ' + LIVE_URL : ', local repo ' + REPO));
  const browser = await chromium.launch({ headless: !HEADED, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const results = [];
  for (let i = 0; i < N_PART; i++) { log('Participant ' + (i + 1) + ' of ' + N_PART); const r = await runParticipant(browser, i); r.analysis = analyze(r); results.push(r); }
  await browser.close(); server.close();

  // ---------- report ----------
  const allW = [].concat(...results.map(r => r.analysis.wers)), allR = [].concat(...results.map(r => r.analysis.rtfs));
  const tH = results.reduce((s, r) => s + r.analysis.termHits, 0), tT = results.reduce((s, r) => s + r.analysis.termTotal, 0);
  const medR = median(allR), maxR = allR.length ? Math.max(...allR) : null;
  const L = [];
  L.push('# Stress kit report: ' + RUN, '');
  L.push('- Participants: ' + N_PART + '; actions per case: ' + N_ACTIONS + '; clips: ' + clips.length + (AUDIO_EXPORT ? '; audio export ON' : '') + (STUB ? '; **STUB transcriber (self-test only: accuracy and speed below are meaningless)**' : ''));
  L.push('- Target: ' + (LIVE_URL || 'local repo (' + REPO + ')'), '');
  const failed = results.filter(r => r.analysis.checks.some(c => !c.ok));
  L.push('## Verdict', '', failed.length ? '**' + failed.length + ' of ' + results.length + ' participant(s) had at least one failed check.** Details below.' : '**All checks passed for all ' + results.length + ' participant(s).**', '');
  L.push('## Transcription', '');
  L.push('| Measure | Value |', '|---|---|');
  L.push('| Recordings scored | ' + allW.length + ' |');
  L.push('| Word error rate, median | ' + fmt(median(allW)) + ' |');
  L.push('| Word error rate, worst | ' + fmt(allW.length ? Math.max(...allW) : null) + ' |');
  L.push('| Clinical terms transcribed correctly | ' + (tT ? tH + ' of ' + tT + ' (' + (100 * tH / tT).toFixed(0) + '%)' : 'n/a') + ' |');
  L.push('| Processing speed (rtf: processing time / audio length), median | ' + fmt(medR) + ' |');
  L.push('| Processing speed, slowest recording | ' + fmt(maxR) + ' |', '');
  if (medR != null) {
    L.push('**Slower computers.** rtf scales roughly with computer speed. A participant\'s laptop that is k times slower than this machine would have rtf about ' + fmt(medR) + ' x k.',
      'Transcription keeps up while rtf stays well below 1 most of the time (participants also spend time watching clips between recordings).',
      'On this machine it keeps up for computers up to about **' + (medR > 0 ? (0.8 / medR).toFixed(1) : 'n/a') + ' times slower**. Beyond that the queue grows, and participants wait on the final screen (up to 10 minutes, then the file is offered anyway with unfinished recordings marked).', '');
  }
  L.push('## Per participant', '');
  for (const r of results) {
    const a = r.analysis;
    L.push('### ' + r.sub + ' (group ' + r.group + ')' + (r.ok ? '' : ' - FAILED'), '');
    L.push('- Total time: ' + fmt(r.totalMin, 1) + ' min; actions: case 1 ' + (r.actions_1 || 'n/a') + ', case 2 ' + (r.actions_2 || 'n/a') + '; think-aloud items: case 1 ' + (r.items_1 || 'n/a') + ', case 2 ' + (r.items_2 || 'n/a'));
    L.push('- Phase times (s): ' + Object.entries(r.phases).filter(([k]) => k !== 'start').map(([k, v]) => k + ' ' + v.toFixed(0)).join('; '));
    L.push('- Peak memory: ' + fmt(a.peakHeapMB, 0) + ' MB; peak browser storage: ' + fmt(a.peakStorageMB, 1) + ' MB; longest save freeze: ' + (a.maxBlock != null ? a.maxBlock + ' ms' : 'n/a') + '; largest transcription backlog: ' + (a.maxQueue != null ? a.maxQueue : 'n/a') + '; final file: ' + (a.bytes ? (a.bytes / 1e6).toFixed(2) + ' MB' : 'n/a'));
    L.push('', '| Check | Result | Note |', '|---|---|---|');
    for (const c of a.checks) L.push('| ' + c.name + ' | ' + (c.ok ? 'PASS' : '**FAIL**') + ' | ' + c.note.replace(/\|/g, '/') + ' |');
    L.push('');
  }
  L.push('## Worst transcriptions (highest word error rate)', '');
  const rows = [].concat(...results.map(r => (r.analysis.rows || []).map(x => Object.assign({ sub: r.sub }, x)))).filter(x => x.wer != null).sort((x, y) => y.wer - x.wer).slice(0, 10);
  if (rows.length) { L.push('| WER | Said | Transcribed |', '|---|---|---|'); for (const x of rows) L.push('| ' + fmt(x.wer) + ' | ' + x.ref.replace(/\|/g, '/') + ' | ' + x.hyp.replace(/\|/g, '/') + ' |'); }
  else L.push('No scored recordings.');
  L.push('', '## What this does not test', '',
    '- Real microphones, real rooms, and real voices other than the clips used.',
    '- Browsers other than the Chromium build Playwright installs (test Safari, Edge, Firefox by hand).',
    '- Genuinely slow laptops (see the projection above; confirm on the oldest laptop you can borrow).',
    '- Campus networks (run the live link on Drake and DMU Wi-Fi to confirm the speech model downloads).', '');
  fs.writeFileSync(path.join(OUT, 'report.md'), L.join('\n'));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results.map(r => ({ sub: r.sub, ok: r.ok, failure: r.failure, totalMin: r.totalMin, phases: r.phases, checks: r.analysis.checks, statuses: r.analysis.statuses, rows: r.analysis.rows })), null, 2));
  log('Report: ' + path.join(OUT, 'report.md'));
  logf.end();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
