/* Headless tests for the segmented think-aloud item builder.
   Runs the REAL buildThinkAloudItems from partC.js (extracted, not copied).
   Usage:  node test_thinkaloud.js                                          */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "partC.js"), "utf8");
const a = src.indexOf("function buildThinkAloudItems(");
const b = src.indexOf("if(typeof module !== \"undefined\" && module.exports) module.exports = { buildThinkAloudItems", a);
if(a < 0 || b < 0) throw new Error("buildThinkAloudItems not found in partC.js");
const ctx = {}; vm.createContext(ctx); vm.runInContext(src.slice(a, b) + "\nthis.build = buildThinkAloudItems;", ctx);
const build = ctx.build;
const cfgSrc = src.slice(src.indexOf("CONFIG.TA_TEXT = {"), src.indexOf("const CASES_IN_ORDER"));
const cctx = { CONFIG: {} }; vm.createContext(cctx); vm.runInContext(cfgSrc, cctx);
const TEXT = cctx.CONFIG.TA_TEXT;

let pass = 0, fail = 0;
function ok(cond, name){ if(cond){ pass++; } else { fail++; console.log("FAIL  " + name); } }
function eq(a, b, name){ ok(JSON.stringify(a) === JSON.stringify(b), name + "  (got " + JSON.stringify(a) + ", want " + JSON.stringify(b) + ")"); }
const INC_ALL = { removals: true, barrier_selections: true, abandoned_highlights: true };
function run(log, deltas, cursor, caseEndT, inc){ return build({ event_log: log }, { deltas: deltas || [], cursor: cursor || [] },
  { pauseMs: 20000, finalMinMs: 3000, include: inc || INC_ALL, text: TEXT, caseEndT: caseEndT }); }
function contiguous(items, end){
  if(!items.length) return true;
  if(items[0].clip_start_t !== 0) return false;
  for(let i = 1; i < items.length; i++) if(items[i].clip_start_t !== items[i - 1].clip_end_t) return false;
  return end == null || (end - items[items.length - 1].clip_end_t) < 3000;
}
// steady mouse activity every 500 ms over [a,b] so nothing becomes a pause unless intended
function busy(a, b){ const c = []; for(let t = a; t <= b; t += 500) c.push({ x: 10, y: 10, aoi: null, t }); return c; }

console.log("SCENARIO 1 - basic actions, grouping, contiguity");
{
  const log = [
    { t: 1000,  kind: "tab_switch", detail: { tab: "chart" } },
    { t: 3000,  kind: "occupation_add", detail: { name: "Dressing", description: "Gets dressed" } },
    { t: 6000,  kind: "classify", detail: { type: "barrier", excerpt: "limited reach", entry_id: "ent_2", occIds: ["occ_1","occ_3"], occupations: ["Dressing","Bathing"], mechanism: "reach" } },
    { t: 8000,  kind: "synthesis_revision", detail: { version: 1, len: 10 } },
    { t: 9000,  kind: "synthesis_revision", detail: { version: 2, len: 20 } },
    { t: 10000, kind: "synthesis_revision", detail: { version: 3, len: 30 } },
    { t: 12000, kind: "desired_outcome_add", detail: { text: "Independent dressing" } },
    { t: 13000, kind: "synthesis_revision", detail: { version: 4, len: 40 } }
  ];
  const r = run(log, [], busy(0, 15000), 15000);
  const kinds = r.items.map(i => i.kind === "action" ? i.action.kind : i.kind);
  eq(kinds, ["occupation_add","classify","synthesis_revision","desired_outcome_add","synthesis_revision"], "tab_switch excluded; consecutive impression revisions merge; split by another action");
  eq(r.items[2].action.event_indices, [3,4,5], "merged run keeps every event index");
  eq(r.items[2].clip_start_t, 6000, "merged run clip starts at previous item end");
  eq(r.items[2].clip_end_t, 10000, "merged run clip ends at its last revision");
  ok(contiguous(r.items, 15000), "clips contiguous from 0 to case end");
  ok(/Dressing, Bathing/.test(r.items[1].label), "classify label lists every linked occupation");
  ok(/barrier/.test(r.items[1].label), "classify label says barrier");
  ok(r.items.every(i => /^[\x20-\x7e]*$/.test(i.label)), "labels are ASCII");
  eq(r.items.map(i => i.item_id), ["it1","it2","it3","it4","it5"], "item ids sequential");
}

console.log("SCENARIO 2 - pause threshold boundary (19.999 s no, 20.000 s yes) and anchors");
{
  const log = [ { t: 1000, kind: "occupation_add", detail: { name: "A" } },
                { t: 21000 - 1, kind: "occupation_add", detail: { name: "B" } },     // gap 19999 ms after A
                { t: 41000 - 1, kind: "occupation_add", detail: { name: "C" } } ];   // gap 20000 ms after B
  const r = run(log, [], [], 41000 - 1);
  const kinds = r.items.map(i => i.kind === "action" ? i.action.kind : i.kind);
  // leading 0..1000 is < 20 s; A->B 19999 (no pause); B->C 20000 (pause)
  eq(kinds, ["occupation_add","occupation_add","pause","occupation_add"], "pause only at >= 20 s");
  const p = r.items[2];
  eq([p.still_start_t, p.clip_end_t, p.still_ms], [20999, 40999, 20000], "pause item still window");
  eq(r.items[3].clip_start_t, 40999, "action after pause starts at pause end");
  ok(contiguous(r.items, 40999), "contiguous with a pause");
}

console.log("SCENARIO 3 - leading and trailing stillness, final review");
{
  const log = [ { t: 30000, kind: "occupation_add", detail: { name: "A" } }, { t: 32000, kind: "occupation_add", detail: { name: "B" } } ];
  const r1 = run(log, [], busy(32000, 40000), 40000);     // reading still for 30 s at the start; active review 32-40 s
  const k1 = r1.items.map(i => i.kind === "action" ? i.action.kind : i.kind);
  eq(k1, ["pause","occupation_add","occupation_add","final_review"], "leading stillness -> pause; active trailing stretch -> final review");
  eq([r1.items[0].still_start_t, r1.items[0].clip_end_t], [0, 30000], "leading pause spans case start to first activity");
  const r2 = run(log, [], [], 60000);                    // still from 32 s to submission at 60 s
  const k2 = r2.items.map(i => i.kind === "action" ? i.action.kind : i.kind);
  eq(k2, ["pause","occupation_add","occupation_add","pause"], "trailing stillness -> pause, no separate final review");
  ok(contiguous(r2.items, 60000), "contiguous to submission");
  const r3 = run(log, [], busy(32000, 34000), 34000);    // trailing stretch < 3 s
  eq(r3.items[r3.items.length - 1].kind, "action", "trailing stretch under 3 s not listed");
}

console.log("SCENARIO 4 - any input is activity (scroll, typing deltas, cursor)");
{
  const log = [ { t: 1000, kind: "occupation_add", detail: { name: "A" } }, { t: 61000, kind: "occupation_add", detail: { name: "B" } } ];
  const deltas = []; for(let t = 2000; t < 61000; t += 15000) deltas.push({ op: "scroll", key: "aoi_case_material", top: t / 100, t });
  const r = run(log, deltas, [], 61000);
  eq(r.items.filter(i => i.kind === "pause").length, 0, "scrolling every 15 s prevents a 20 s pause");
  const r2 = run(log, [], [{ x: 1, y: 1, t: 30000 }], 61000);
  eq(r2.items.filter(i => i.kind === "pause").length, 2, "one mouse sample splits 60 s of stillness into two pauses");
}

console.log("SCENARIO 5 - abandoned highlights");
{
  const deltas = [
    { op: "pop_open", excerpt: "kept", src: "x", t: 1000 }, { op: "pop_choice", valence: "support", t: 1500 },
    { op: "entry_add", id: "ent_1", type: "support", excerpt: "kept", mechanism: "m", t: 2000 }, { op: "pop_close", t: 2001 },   // classified: not abandoned
    { op: "pop_open", excerpt: "dropped one", src: "x", t: 3000 }, { op: "pop_close", t: 4000 },                                 // abandoned (closed)
    { op: "pop_open", excerpt: "replaced", src: "x", t: 5000 }, { op: "pop_open", excerpt: "second", src: "x", t: 6000 },        // first abandoned (replaced)
    { op: "pop_close", t: 7000 }                                                                                                   // second abandoned
  ];
  const log = [ { t: 2000, kind: "classify", detail: { type: "support", excerpt: "kept", entry_id: "ent_1", occIds: ["occ_1"], occupations: ["A"] } } ];
  const r = run(log, deltas, busy(0, 8000), 8000);
  const ab = r.items.filter(i => i.kind === "action" && i.action.kind === "abandoned_highlight");
  eq(ab.map(i => i.action.excerpt), ["dropped one","replaced","second"], "three abandoned highlights detected, classified one not");
  eq(ab.map(i => i.clip_end_t), [4000, 6000, 7000], "abandoned item ends when the popup closed or was replaced");
  const r2 = run(log, deltas, busy(0, 8000), 8000, { removals: true, barrier_selections: true, abandoned_highlights: false });
  eq(r2.items.filter(i => i.kind === "action" && i.action.kind === "abandoned_highlight").length, 0, "include flag off -> none");
}

console.log("SCENARIO 6 - removals, barrier selections, plan fields");
{
  const deltas = [ { op: "entry_add", id: "ent_4", type: "barrier", excerpt: "stairs at home", mechanism: "cannot climb stairs", t: 500 } ];
  const log = [
    { t: 1000, kind: "barrier_select", detail: { id: "ent_4", on: true, entry: "stairs at home" } },
    { t: 2000, kind: "plan_revision", detail: { scope: "barrier", field: "approach", barrier_id: "ent_4", version: 1 } },
    { t: 3000, kind: "plan_revision", detail: { scope: "barrier", field: "approach", barrier_id: "ent_4", version: 2 } },
    { t: 4000, kind: "plan_revision", detail: { scope: "barrier", field: "method", barrier_id: "ent_4", version: 3 } },
    { t: 5000, kind: "plan_revision", detail: { scope: "plan", field: "goal", barrier_id: null, version: 4 } },
    { t: 6000, kind: "barrier_select", detail: { id: "ent_4", on: false } },
    { t: 7000, kind: "entry_remove", detail: { id: "ent_4", entry: "stairs at home" } },
    { t: 8000, kind: "occupation_remove", detail: { id: "occ_1", occupation: "Dressing" } },
    { t: 9000, kind: "desired_outcome_remove", detail: { id: "out_1", outcome: "Walk" } }
  ];
  const r = run(log, deltas, busy(0, 10000), 10000);
  const k = r.items.map(i => i.kind === "action" ? i.action.kind : i.kind);
  eq(k, ["barrier_select","plan_revision","plan_revision","plan_revision","barrier_select","entry_remove","occupation_remove","desired_outcome_remove"],
     "approach revisions merge; method and goal are separate fields; 1 s trailing stretch not listed");
  ok(/cannot climb stairs/.test(r.items[0].label) && /chose to address/.test(r.items[0].label), "barrier-on label uses mechanism");
  ok(/took the barrier/.test(r.items[4].label), "barrier-off label");
  ok(/approach for "cannot climb stairs"/.test(r.items[1].label), "plan field label names field and barrier");
  ok(/removed the barrier "stairs at home"/.test(r.items[5].label), "entry removal label knows it was a barrier");
  const r2 = run(log, deltas, busy(0, 10000), 10000, { removals: false, barrier_selections: false, abandoned_highlights: true });
  eq(r2.items.map(i => i.kind === "action" ? i.action.kind : i.kind), ["plan_revision","plan_revision","plan_revision","final_review"], "flags off exclude removals and selections");
  ok(contiguous(r2.items, 10000), "contiguous with exclusions (excluded actions fold into neighbors' clips)");
}

console.log("SCENARIO 7 - legacy single-occupation classify + empty case");
{
  const r = run([ { t: 1000, kind: "classify", detail: { type: "support", excerpt: "e", occId: "occ_1", occupation: "Cooking" } } ], [], busy(0, 1000), 1000);
  ok(/support for Cooking/.test(r.items[0].label), "legacy occupation label");
  const e = run([], [], [], 0);
  eq(e.items.length, 0, "empty case -> no items");
}

console.log("SCENARIO 8 - gap summary");
{
  const log = [ { t: 1000, kind: "occupation_add", detail: { name: "A" } }, { t: 26000, kind: "occupation_add", detail: { name: "B" } } ];
  const r = run(log, [], [], 26000);
  const at = r.gap_summary.pause_items_at_threshold;
  eq(at.find(x => x.threshold_s === 20).n_pause_items, 1, "counterfactual count at 20 s");
  eq(at.find(x => x.threshold_s === 30).n_pause_items, 0, "counterfactual count at 30 s");
  eq(r.gap_summary.inactivity_ge_5s, [{ start_t: 1000, end_t: 26000 }], "gaps >= 5 s listed");
}

console.log("\n================  " + pass + " passed, " + fail + " failed  ================");
process.exit(fail ? 1 : 0);
