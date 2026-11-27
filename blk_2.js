
const FLORENCE = {
  id:1, role:"Case 1", name:"Florence", age:69,
  diagnosis:"s/p L total shoulder arthroplasty; RA", setting:"Outpatient OT",

  profileHTML:`
    <div class="sect">Occupational Profile</div>
    <div class="clin" data-src="fl_prof_1"><p>Florence is 69 and lives alone in a city-subsidized, accessible one-bedroom apartment about two miles from the hospital. The building has an elevator and meets ADA requirements; her unit has an open floor plan connecting the living room, dining area, and kitchen.</p></div>
    <div class="clin" data-src="fl_prof_2"><p>She worked in high school food service until she was 52, when her condition made continued work impossible. She has received Social Security disability since. She never married. Her closest friend is Mary, who also has a disability and lives in the same building.</p></div>
    <div class="clin" data-src="fl_prof_3"><p>For the past five years a home health aide has assisted with bathing and hair care and has handled shopping, meal preparation, and care of the home. Florence's typical day begins with the aide washing her by 9:30 a.m. and a prepared breakfast by 10:30. Her days involve escorted trips to local stores, medical appointments, and the senior citizens club located in her building, where she usually eats lunch with Mary. Dinner is at home.</p></div>
    <div class="clin" data-src="fl_prof_4"><p>She reads romance novels, collects figurines, and keeps a cat. She values honesty and cleanliness and identifies with the Anglican Church.</p></div>
    <div class="clin" data-src="fl_prof_5"><p>Asked what she most needs, Florence said she wants to remain in her own home and receive services there. She reported being very afraid of being placed in a nursing home.</p></div>
    <div class="clin" data-src="fl_prof_6"><p><b>In Florence's words:</b> "I've kept my own place since I was a girl - my figurines, my books, the cat, Mary down the hall for our lunches. Denise comes mornings; she's good to me, but I don't love being washed like a child. I'd like to do a few small things for myself again. And I haven't truly slept in weeks - some nights I take the sling off just to get a few hours."</p></div>`,

  chartHTML:`
    <div class="sect">Referral &amp; Diagnosis</div>
    <div class="clin" data-src="fl_ch_ref"><div class="kv"><span class="k">Referral</span><span class="v">Outpatient occupational therapy, twice weekly for 10 weeks. Services are to progress the client to Phase 2 of the total shoulder arthroplasty protocol.</span></div>
    <div class="kv"><span class="k">Diagnosis</span><span class="v">Rheumatoid arthritis, 35-year history. Status post left total shoulder arthroplasty.</span></div>
    <div class="kv"><span class="k">Relevant history</span><span class="v">Osteoporosis; hypertension; Sjogren's syndrome. Prior surgery: bilateral total knee replacements, bilateral wrist synovectomy, and metacarpophalangeal arthroplasty of digits 2-5.</span></div>
    <div class="kv"><span class="k">Medications</span><span class="v">Celebrex. No known allergies.</span></div></div>

    <div class="sect">Social &amp; Lifestyle</div>
    <div class="clin" data-src="fl_ch_soc"><p>Sedentary. No alcohol, tobacco, or drug use. Drinks 4-5 cups of tea daily. Height 5'0", weight 127 lb.</p></div>

    <div class="sect">Activities of Daily Living</div>
    <div class="clin" data-src="fl_ch_adl"><p>Feeds herself with the right upper extremity when food is cut and presented. Requires maximal assistance to dress both upper and both lower extremities, and to don and doff the left shoulder immobilizer. Independently brushes her hair and teeth. <span class="num">QuickDASH score: 63.7%.</span></p></div>

    <div class="sect">Functional Mobility</div>
    <div class="clin" data-src="fl_ch_mob"><p>Independent with rolling, bridging, and moving between supine and short sitting. Transfers on and off bed, chair, and raised toilet using a wide-base quad cane. Requires moderate assistance for tub transfer using a transfer bench similar to the one at home.</p></div>

    <div class="sect">Instrumental Activities</div>
    <div class="clin" data-src="fl_ch_iadl"><p>Manages her own communication and finances. Dependent for home maintenance, meal preparation, cleanup, and shopping.</p></div>

    <div class="sect">Rest &amp; Sleep</div>
    <div class="clin" data-src="fl_ch_sleep"><p>Reports being unable to find a comfortable position to sleep.</p></div>

    <div class="sect">Mental Functions</div>
    <div class="clin" data-src="fl_ch_ment"><p>Alert and oriented to person, place, time, and situation. Short- and long-term memory intact. Follows three-step commands and makes needs known. Affect appropriate. No gross perceptual deficits.</p></div>

    <div class="sect">Sensory &amp; Pain</div>
    <div class="clin" data-src="fl_ch_pain"><p>No gross deficits in hearing, vestibular, taste, smell, proprioceptive, or cutaneous function. Nearsighted, wears corrective lenses. <span class="num">Left shoulder pain 7/10</span>, described as "miserable." No edema noted.</p></div>

    <div class="sect">Cardiopulmonary</div>
    <div class="clin" data-src="fl_ch_cp"><p><span class="num">Metabolic equivalent of task value 2.5-3.0.</span></p></div>

    <div class="sect">Movement</div>
    <div class="clin" data-src="fl_ch_move"><p>Passive range, active range, and strength within functional limits in both upper extremities except the left shoulder, which is positioned in a soft immobilizing adduction sling that was not removed. Flexible swan neck deformities in digits 2-5 and boutonniere deformity of digit 1 bilaterally. Gross grasp strength not assessed.</p></div>

    <div class="sect">Neuromuscular</div>
    <div class="clin" data-src="fl_ch_neuro"><p>Sitting balance 5/5 static and dynamic. Standing balance 4/5 static and dynamic. Tone normal, reflex integration grossly intact.</p></div>

    <div class="interim" data-src="fl_ch_interim"><span class="tag">Interim note</span>Client reported at a subsequent visit that she slept two evenings without wearing the left shoulder immobilizer, stating she was desperate for a full night's sleep.</div>

    <div class="sect">Discharge Plan &amp; Coverage</div>
    <div class="clin" data-src="fl_ch_dc"><p>Home exercise program at the conclusion of the 10-week authorization. Florence currently requires maximal assistance for upper- and lower-body dressing and for donning and doffing the immobilizer; the home health aide performs bathing, dressing assistance, meals, and shopping. Medicare Part B is the primary payer with Medicaid secondary; continued authorization beyond the current plan of care requires documentation of medical necessity.</p></div>`
};

const YVONNE = {
  id:2, role:"Case 2", name:"Yvonne", age:44,
  diagnosis:"s/p L radical mastectomy; SLE", setting:"Outpatient OT",

  profileHTML:`
    <div class="sect">Occupational Profile</div>
    <div class="clin" data-src="yv_prof_1"><p>Yvonne is 44 and has worked as a police officer for 21 years. She lives with her spouse, Tiffany, in a one-bedroom apartment in a full-service high-rise in the city center. The apartment has an open floor plan connecting living room, dining area, and kitchen. She and Tiffany have been together 15 years and married for two. She is a member of the African Methodist Episcopal Church.</p></div>
    <div class="clin" data-src="yv_prof_2"><p>Before surgery she was independent in all activities of daily living and all instrumental activities. Her routine involved picking up breakfast on the way to work, working a 9-to-5 day shift, and picking up dinner for herself and her spouse on the way home. During the week the two of them used the gym or pool in their building. Weekends were given over to friends, day trips, and a full schedule of social events.</p></div>
    <div class="clin" data-src="yv_prof_3"><p>Her interests include Tae Kwon Do, microbrewing, and motorcycle riding. She values love, honesty, and acceptance.</p></div>
    <div class="clin" data-src="yv_prof_4"><p>Since surgery, Tiffany has taken over cooking, shopping, and care of the home.</p></div>
    <div class="clin" data-src="yv_prof_5"><p>Asked what she most needs, Yvonne said she wants to get her arm moving well and to prepare for retirement from her job.</p></div>
    <div class="clin" data-src="yv_prof_6"><p><b>In Yvonne's words:</b> "I've been the strong one my whole life - on the job, in the dojang, on the bike. Tiffany's carried everything at home since the surgery and I hate that. I catch myself in the mirror and I lose it. I want my arm back so I can be myself again, not so I can baby it."</p></div>`,

  chartHTML:`
    <div class="sect">Referral &amp; Diagnosis</div>
    <div class="clin" data-src="yv_ch_ref"><div class="kv"><span class="k">Referral</span><span class="v">Outpatient occupational therapy, twice weekly for 8 weeks.</span></div>
    <div class="kv"><span class="k">Diagnosis</span><span class="v">Stage 2 breast cancer. Status post left radical mastectomy.</span></div>
    <div class="kv"><span class="k">Relevant history</span><span class="v">Systemic lupus erythematosus, diagnosed 24 years ago. Herniated disc between the second and third lumbar vertebrae, with decompression and fusion 10 years ago.</span></div>
    <div class="kv"><span class="k">Medications</span><span class="v">Voltaren. Allergic to pollen.</span></div></div>

    <div class="sect">Social &amp; Lifestyle</div>
    <div class="clin" data-src="yv_ch_soc"><p>Active lifestyle. Occasional alcohol and tobacco use, no drug use. Drinks 2-3 large cups of coffee daily. Height 5'11", weight 209 lb.</p></div>

    <div class="sect">Activities of Daily Living</div>
    <div class="clin" data-src="yv_ch_adl"><p>Independent in feeding, grooming, toileting, and bathing. Able to dress but requires assistance to don and doff her bra. Independent with rolling, bridging, and moving between supine and short sitting. Transfers to and from all surfaces independently. Ambulates independently, observed with postural guarding of the left upper extremity.</p></div>

    <div class="sect">Instrumental Activities</div>
    <div class="clin" data-src="yv_ch_iadl"><p>Spouse has assumed full responsibility for cooking, shopping, and home care.</p></div>

    <div class="sect">Rest &amp; Sleep</div>
    <div class="clin" data-src="yv_ch_sleep"><p>Reports waking each night, going to the bathroom, and looking at the surgical site.</p></div>

    <div class="sect">Mental Functions</div>
    <div class="clin" data-src="yv_ch_ment"><p>Alert and oriented to person, place, time, and situation. Short- and long-term memory intact. Follows three-step commands and makes needs known. Reports frequently crying when she looks at the surgical site. No gross perceptual deficits.</p></div>

    <div class="sect">Sensory &amp; Pain</div>
    <div class="clin" data-src="yv_ch_pain"><p>No gross deficits in visual, hearing, vestibular, taste, smell, or proprioceptive function. <span class="num">Left shoulder pain rated 7/10 before pain medication and 4/10 after</span>, on a 0-10 numeric rating scale. Reports a continuing sensation that her left breast is still present. Surgical incision fully closed, staples removed, scar flat. Light touch and localization impaired. Edema unremarkable.</p></div>

    <div class="sect">Cardiopulmonary</div>
    <div class="clin" data-src="yv_ch_cp"><p>No deficits.</p></div>

    <div class="sect">Movement</div>
    <div class="clin" data-src="yv_ch_move"><p>Passive range, active range, and strength within normal limits in the right upper extremity and both lower extremities. Left upper extremity active range within normal limits except at the shoulder. Left shoulder passive range of motion is shown below. Left shoulder active range of motion matched passive values at all four motions. Left upper extremity strength not evaluated. Client held the left upper extremity in a guarded position. No gross defects in prehension.</p>
      <table class="dtbl"><thead><tr><th>Motion</th><th>Range</th></tr></thead><tbody>
        <tr><td>Flexion</td><td class="n">0-102 degrees</td></tr>
        <tr><td>Abduction</td><td class="n">0-88 degrees</td></tr>
        <tr><td>External rotation</td><td class="n">0-60 degrees</td></tr>
        <tr><td>Internal rotation</td><td class="n">0-80 degrees</td></tr>
      </tbody></table></div>

    <div class="sect">Neuromuscular</div>
    <div class="clin" data-src="yv_ch_neuro"><p>Sitting and standing balance 5/5 static and dynamic. Tone normal, reflex integration intact.</p></div>

    <div class="interim" data-src="yv_ch_interim"><span class="tag">Interim note</span>Client reported at a subsequent visit that her rings had felt tight for several days.</div>

    <div class="sect">Employment &amp; Duty Status</div>
    <div class="clin" data-src="yv_ch_work"><p>Yvonne has 21 years of service and is within a few years of pension eligibility. Her department requires a fitness-for-duty determination through its own medical review before return to full duty; light or modified duty is available at the supervisor's discretion. She has not yet discussed a timeline with her department.</p></div>

    <div class="sect">Discharge Plan</div>
    <div class="clin" data-src="yv_ch_dc"><p>Home program at completion of outpatient services.</p></div>`
};

const PATRICIA = {
  id:"practice", role:"Practice", name:"Patricia", age:36,
  diagnosis:"s/p zone II flexor tendon repair, L index", setting:"Outpatient OT",

  profileHTML:`
    <div class="sect">Occupational Profile</div>
    <div class="clin" data-src="pa_prof_1"><p>Patricia is 36 and has worked full time for the past eight months as a sales associate for a national chain store. She reports this is her first job with a comprehensive benefits package.</p></div>
    <div class="clin" data-src="pa_prof_2"><p>She is a single mother and lives with her 8-year-old son in the basement apartment of her parents' home; twelve steps lead down to the apartment from the hallway. The apartment has a kitchenette, a combined living and dining space, two small bedrooms, and a bathroom. She does not own a car. Her home is a 15-minute bus ride from work and 20 minutes from the medical center.</p></div>
    <div class="clin" data-src="pa_prof_3"><p>She recently ended a six-month relationship. Her parents have been actively involved in watching her son while she works.</p></div>
    <div class="clin" data-src="pa_prof_4"><p>Her routine has involved having breakfast with her son, putting him on the school bus, and going to work. Her mother usually collects him from the bus and helps with homework. Once home, Patricia typically cooked dinner, helped her son finish his homework, and caught up with friends on social media. Weekends included playdates for her son on Saturdays and church on Sundays. She identifies as an Evangelical Lutheran.</p></div>
    <div class="clin" data-src="pa_prof_5"><p>Her interests include social media and occasionally going out with friends. She values the love of her parents and the gift of her son.</p></div>
    <div class="clin" data-src="pa_prof_6"><p>Asked what she most needs, Patricia said she wants to get her hand better and get back to work.</p></div>`,

  chartHTML:`
    <div class="sect">Referral &amp; Diagnosis</div>
    <div class="clin" data-src="pa_ch_ref"><div class="kv"><span class="k">Referral</span><span class="v">Outpatient occupational therapy, twice weekly for 10 weeks.</span></div>
    <div class="kv"><span class="k">Diagnosis</span><span class="v">Complete tendon laceration of the left second flexor digitorum profundus and flexor digitorum superficialis, surgically repaired. Injury sustained with a box cutter at work. Placed in a dorsal protective fiberglass splint and discharged the same day.</span></div>
    <div class="kv"><span class="k">Relevant history</span><span class="v">Unremarkable.</span></div>
    <div class="kv"><span class="k">Medications</span><span class="v">Amcill. No known allergies.</span></div></div>

    <div class="sect">Work Status</div>
    <div class="clin" data-src="pa_ch_work"><p>The injury occurred at work with a box cutter; the claim is being handled through workers' compensation. Patricia is eight months into her first position with health benefits and is anxious about how long she can be off before her income and coverage are affected.</p></div>

    <div class="sect">Social &amp; Lifestyle</div>
    <div class="clin" data-src="pa_ch_soc"><p>No alcohol, drug, tobacco, or coffee use. Height 5'11", weight 140 lb.</p></div>

    <div class="sect">Activities of Daily Living</div>
    <div class="clin" data-src="pa_ch_adl"><p>Feeds herself but requires assistance to cut food. Dons and doffs all garments but requires assistance with fasteners. Unable to blow dry her hair without assistance. Independent in all bed mobility, transfers, and ambulation.</p></div>

    <div class="sect">Instrumental Activities</div>
    <div class="clin" data-src="pa_ch_iadl"><p>Manages her communications and finances, prepares simple meals, and performs light cleanup and light shopping.</p></div>

    <div class="sect">Rest &amp; Sleep</div>
    <div class="clin" data-src="pa_ch_sleep"><p>Reports frequently waking at night because of "throbbing pain" in the surgically repaired finger.</p></div>

    <div class="sect">Mental Functions</div>
    <div class="clin" data-src="pa_ch_ment"><p>Alert and oriented to person, place, time, and situation. Short- and long-term memory intact. Follows three-step commands and makes needs known. Reports feeling anxious about not having money coming in to pay her bills. No gross perceptual deficits. <span class="num">Zung Self-Rating Anxiety Scale: 58 out of 100.</span></p></div>

    <div class="sect">Sensory &amp; Pain</div>
    <div class="clin" data-src="pa_ch_pain"><p>No gross deficits in visual, hearing, vestibular, taste, smell, proprioceptive, or cutaneous function. A 2.5-cm scabbed incision with six external stitches observed over the anterior base of the left index finger. <span class="num">Circumferential measurement over the proximal phalanx: left 8.0 cm, right 7.2 cm.</span> <span class="num">Pain rated 3/10</span> on a 0-10 numeric scale at the left index finger; surgical area described as "sensitive to touch."</p></div>

    <div class="sect">Cardiopulmonary</div>
    <div class="clin" data-src="pa_ch_cp"><p>No deficits. Performs all activities without fatigue.</p></div>

    <div class="sect">Movement</div>
    <div class="clin" data-src="pa_ch_move"><p>All four extremities intact for passive range, active range, and strength. Movement of the left wrist and digits was contraindicated and not assessed at evaluation. Left dorsal protective fiberglass splint in place with bulky dressing and elastic bandage wrap.</p></div>

    <div class="sect">Neuromuscular</div>
    <div class="clin" data-src="pa_ch_neuro"><p>Sitting and standing balance 5/5 static and dynamic. Tone normal, reflex integration intact.</p></div>

    <div class="interim" data-src="pa_ch_interim"><span class="tag">Interim note</span>Client reported during week 2 that she had been removing the protective splint for hours at a time.</div>

    <div class="sect">Discharge Plan</div>
    <div class="clin" data-src="pa_ch_dc"><p>Home program at completion of outpatient services.</p></div>`
};



const APPROACHES = ["Create/promote","Establish/restore","Maintain","Modify","Prevent"];
const INTERVENTION_TYPES = ["Occupations and activities","Interventions to support occupations","Education and training","Advocacy","Group interventions","Virtual interventions"];
const ASPECTS = ["Client factor","Performance skill","Performance pattern","Context"];
/* OTPF-4 outcome types (optional tag on desired outcomes). */
const OUTCOME_TYPES = ["Occupational performance","Prevention","Health and wellness","Quality of life","Participation","Role competence","Well-being","Occupational justice"];

/* =====================================================================
   STATE
   ===================================================================== */
/* Case registry. Order = review order: Practice (Patricia) → Case 1 (Florence) → Case 2 (Yvonne).
   In the jsPsych build this ordering is the trial sequence; here the ribbon switcher
   lets the content be reviewed. Each case keeps its own state so switching doesn't discard work. */
let CASE = PATRICIA;
let state = null;
function freshState(){
  return {
    synthesis:{ impression:"", impression_stamp:null, impression_revisions:[], desired_outcomes:[] },
    occupations:[],   // {id, name}
    entries:[],       // {id, type, excerpt, src, mechanism, aspect|null, occIds[], loc, ts, range}
    plan:{ selectedBarrierIds:[], prioritization:"", perBarrier:{}, goal:"", immediate:"", revisions:[] },
    log:[],           // ANALYZED event log -> ONA/coding. Semantic, no replay bloat.
    recon:{ deltas:[], cursor:[] }  // RECONSTRUCTION record -> RTA replay ONLY. Never analyzed.
  };
}
let seq = 0; const uid = p => p + (++seq);
/* ---- CASE CLOCK + HUMAN-READABLE LOG (Option B) ----
   Timestamps are elapsed milliseconds from the moment the case began (not epoch),
   so the first event is near 0 and t reads as "time into this case". t_clock is a
   readable mm:ss.s string for eyeballing. Ids are kept (stable linkage) AND a
   plain-text label is added alongside each (source/occupation/entry/outcome). */
let caseStart = Date.now();
function beginCaseClock(){ caseStart = Date.now(); }
function nowRel(){ return Date.now() - caseStart; }
function clockStr(ms){ const s=ms/1000; const m=Math.floor(s/60); const r=(s-m*60); return (m<10?"0":"")+m+":"+(r<10?"0":"")+r.toFixed(1); }

/* Source-element id -> plain-ASCII section label (case-independent; case is known
   at the session level, so it is not duplicated into every event). */
const SRC_SECTION = {
  "ch_ref":"Initial Evaluation - Referral", "ch_interim":"Initial Evaluation - Interim note",
  "ch_neuro":"Initial Evaluation - Neuromuscular/balance", "ch_pain":"Initial Evaluation - Sensory/pain",
  "ch_move":"Initial Evaluation - ROM/strength", "ch_mob":"Initial Evaluation - Functional mobility",
  "ch_adl":"Initial Evaluation - ADL", "ch_iadl":"Initial Evaluation - IADL",
  "ch_ment":"Initial Evaluation - Mental status/cognition", "ch_soc":"Initial Evaluation - Social history",
  "ch_sleep":"Initial Evaluation - Sleep", "ch_cp":"Initial Evaluation - Cardiopulmonary/MET",
  "ch_dc":"Initial Evaluation - Discharge plan"
};
function srcLabel(src){
  if(!src) return null;
  const rest = src.replace(/^[a-z]{2}_/, "");          // strip case prefix (fl_/yv_/pa_)
  if(rest.indexOf("prof")===0){ const n=rest.split("_")[1]; return "Profile - para "+n; }
  return SRC_SECTION[rest] || rest;
}
function occName(id){ const o=state.occupations.find(x=>x.id===id); return o?o.name:null; }
function occNames(ids){ return (ids||[]).map(occName).filter(Boolean).join(", ") || "?"; }
function entryExcerpt(id){ const e=state.entries.find(x=>x.id===id); return e?e.excerpt:null; }
function outcomeText(id){ const o=state.synthesis.desired_outcomes.find(x=>x.id===id); return o?o.text:null; }

/* Add readable labels alongside ids, keyed by event kind (id means different
   things for different kinds, so resolve explicitly). Non-destructive. */
function enrich(kind, d){
  if(!d) return d;
  if(d.src != null && d.source === undefined) d.source = srcLabel(d.src);
  if(d.occId != null && d.occupation === undefined) d.occupation = occName(d.occId);
  if(Array.isArray(d.occIds) && d.occupations === undefined){ d.occupations = d.occIds.map(occName); if(d.occupation === undefined) d.occupation = d.occupations.filter(Boolean).join("; "); }
  if(d.id != null){
    if(kind==="barrier_select" || kind==="entry_remove"){ const v=entryExcerpt(d.id); if(v!=null) d.entry=v;
      const en=state.entries.find(x=>x.id===d.id); if(en){ if(d.entry_type===undefined) d.entry_type=en.type; if(d.mechanism===undefined) d.mechanism=en.mechanism; } }
    else if(kind==="occupation_remove"){ const v=occName(d.id); if(v!=null) d.occupation=v; }
    else if(kind==="desired_outcome_remove" || kind==="desired_outcome_tag"){ const v=outcomeText(d.id); if(v!=null) d.outcome=v; }
  }
  return d;
}
function logEvent(kind, detail){ const t=nowRel(); state.log.push({ t, t_clock:clockStr(t), kind, detail:enrich(kind, detail)||null }); }

/* ---- RECONSTRUCTION CAPTURE (separate record; replay/cue infrastructure only) ---- */
function recordDelta(op, payload){ state.recon.deltas.push(Object.assign({ op, t:nowRel() }, payload||{})); }

/* Serialize a selection Range as character offsets within its [data-src] element,
   so the in-text highlight can be faithfully repainted on replay (a live Range
   does not survive). Returns {srcId,start,end} or null if not locatable. */
function charOffsetInEl(el, node, offset){
  let count = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
  while((n = w.nextNode())){ if(n === node) return count + offset; count += n.textContent.length; }
  return count;
}
function serializeRange(range, srcId){
  if(!range || !srcId) return null;
  const el = document.querySelector('[data-src="'+srcId+'"]'); if(!el) return null;
  try {
    return { srcId, start: charOffsetInEl(el, range.startContainer, range.startOffset),
                    end:   charOffsetInEl(el, range.endContainer,   range.endOffset) };
  } catch(e){ return null; }
}
function rangeFromOffsets(loc){
  if(!loc) return null;
  const el = document.querySelector('[data-src="'+loc.srcId+'"]'); if(!el) return null;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n, count = 0, setS = false, setE = false; const r = document.createRange();
  while((n = w.nextNode())){
    const len = n.textContent.length;
    if(!setS && count + len >= loc.start){ r.setStart(n, loc.start - count); setS = true; }
    if(!setE && count + len >= loc.end){ r.setEnd(n, loc.end - count); setE = true; break; }
    count += len;
  }
  return (setS && setE) ? r : null;
}

/* In-text highlight marks via CSS Custom Highlight API (no DOM mutation). */
const supHL = (typeof Highlight!=="undefined") ? new Highlight() : null;
const barHL = (typeof Highlight!=="undefined") ? new Highlight() : null;
function registerHighlights(){ if(window.CSS && CSS.highlights && supHL){ CSS.highlights.set("ot-support",supHL); CSS.highlights.set("ot-barrier",barHL); } }
function refreshHighlights(){
  if(!supHL) return;
  supHL.clear(); barHL.clear();
  state.entries.forEach(e=>{ if(e.range){ try{ (e.type==="support"?supHL:barHL).add(e.range); }catch(err){} } });
}

/* =====================================================================
   RENDER
   ===================================================================== */
function renderCase(){
  document.getElementById("app").innerHTML = `
    <div class="banner">
      <div>
        <h1>${CASE.name} <span class="role-badge ${CASE.role==='Practice'?'practice':'real'}">${CASE.role}</span></h1>
        <div class="meta">
          <span class="chip">Age <b>${CASE.age}</b></span>
          <span class="chip">Dx <b>${CASE.diagnosis}</b></span>
          <span class="chip">Setting <b>${CASE.setting}</b></span>
        </div>
      </div>
    </div>

    <div class="main">
      <div class="col case">
        <div class="panel" id="aoi_case_material" data-aoi="case_material" style="flex:1 1 50%">
          <div class="tabs" role="tablist">
            <button class="tab active" data-tab="profile" role="tab">Occupational Profile</button>
            <button class="tab" data-tab="chart" role="tab">Initial Evaluation</button>
          </div>
          <div class="panel-body" id="case_body">
            <div class="tabpage active" data-page="profile">${CASE.profileHTML}</div>
            <div class="tabpage" data-page="chart">${CASE.chartHTML}</div>
          </div>
        </div>
        <div class="panel" id="aoi_occupations" data-aoi="occupations" style="flex:1 1 50%">
          <div class="panel-head"><span class="ey">Occupations</span><span class="count" id="occ_count">0</span></div>
          <div class="panel-body">
            <div class="occ-add">
              <input id="occ_input" type="text" maxlength="80" placeholder="Name an occupation..." aria-label="Name an occupation"/>
              <textarea id="occ_desc" maxlength="600" rows="2" placeholder="Briefly describe this occupation. What do they want and what do they need to do?" aria-label="Briefly describe this occupation. What do they want and what do they need to do?"></textarea>
              <button class="btn btn-occ" id="occ_add">Add</button>
            </div>
            <div id="occ_list"></div>
          </div>
        </div>
      </div>

      <div class="col mid">
        <div class="panel" id="aoi_performance" data-aoi="performance" style="flex:1 1 50%">
          <div class="panel-head"><span class="ey">Occupational Performance Analysis</span><span class="count" id="pa_count">0</span></div>
          <div class="panel-body" id="pa_body"></div>
        </div>
        <div class="panel" id="aoi_synthesis" data-aoi="synthesis" style="flex:1 1 50%">
          <div class="panel-head"><span class="ey">Synthesis of the Evaluation</span></div>
          <div class="panel-body" id="syn_body">
            <div class="syn-field">
              <label class="syn-lbl">Clinical impression</label>
              <div class="syn-hint">Integrating the occupational profile and your performance analysis, what is your overall impression of this client's situation?</div>
              <textarea id="synthesis_impression" placeholder="Integrate the profile and your analysis into a coherent picture. Editable throughout."></textarea>
              <div class="stamp" id="syn_stamp">not yet edited</div>
            </div>
            <div class="syn-field">
              <label class="syn-lbl">Desired outcomes</label>
              <div class="syn-hint">What are the desired outcomes for this client? These become the basis for your intervention goals.</div>
              <div class="occ-add">
                <input id="outcome_input" type="text" maxlength="140" placeholder="Name a desired outcome..." aria-label="Name a desired outcome"/>
                <button class="btn btn-syn" id="outcome_add">Add</button>
              </div>
              <div id="outcome_list"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col plan">
        <div class="panel grow" id="aoi_intervention" data-aoi="intervention">
          <div class="panel-head"><span class="ey">Intervention plan</span></div>
          <div class="panel-body" id="ip_body"></div>
        </div>
      </div>
    </div>`;

  registerHighlights();
  wireSynthesis(); wireTabs(); wireOccupations(); wireOutcomes(); attachSelectionHandlers(); attachScrollCapture();
  renderOccupations(); renderPerformance(); renderOutcomes(); renderPlan(); refreshHighlights();
}

function syncImpressionStamp(){
  const ta=document.getElementById("synthesis_impression"), st=document.getElementById("syn_stamp"); if(!ta||!st) return;
  const revs=(state.synthesis.impression_revisions||[]), last=revs.length?revs[revs.length-1]:null, v=ta.value||"";
  if(last && last.text===v) st.textContent="rev "+revs.length+" - "+new Date(last.ts).toLocaleTimeString();
  else st.textContent = v.trim() ? "" : "not yet edited";
}
function wireSynthesis(){
  const ta=document.getElementById("synthesis_impression"), st=document.getElementById("syn_stamp");
  ta.value=state.synthesis.impression; let t=null; syncImpressionStamp();
  /* Append a discrete revision only when typing settles (debounced) or the
     field loses focus, and only if the text changed from the last snapshot.
     Yields a trajectory of settled impressions, not per-keystroke noise. */
  const snapshot=()=>{
    const text=ta.value, revs=state.synthesis.impression_revisions;
    const last=revs.length?revs[revs.length-1].text:null;
    if(text===last) return;
    const ts=Date.now();
    revs.push({version:revs.length+1, text, ts});
    updateWalkthrough();
    state.synthesis.impression=text; state.synthesis.impression_stamp=ts;
    logEvent("synthesis_revision",{version:revs.length, len:text.length});
    st.textContent="rev "+revs.length+" - "+new Date(ts).toLocaleTimeString();
  };
  ta.addEventListener("input", ()=>{ state.synthesis.impression=ta.value; recordDelta("impression",{text:ta.value}); clearTimeout(t); t=setTimeout(snapshot, 800); });
  ta.addEventListener("blur", ()=>{ clearTimeout(t); snapshot(); });
}
function wireOutcomes(){
  const input=document.getElementById("outcome_input");
  const add=()=>{ const text=input.value.trim(); if(!text) return;
    const oid=uid("out_"); state.synthesis.desired_outcomes.push({id:oid, text, otpf4_outcome_type:null, ts:Date.now()});
    logEvent("desired_outcome_add",{text}); recordDelta("outcome_add",{id:oid, text});
    input.value=""; renderOutcomes(); updateWalkthrough(); if(window.refreshMaxc) refreshMaxc(); };
  document.getElementById("outcome_add").addEventListener("click", add);
  input.addEventListener("keydown", e=>{ if(e.key==="Enter") add(); });
}
function renderOutcomes(){
  const list=document.getElementById("outcome_list"); if(!list) return;
  const outs=state.synthesis.desired_outcomes;
  if(!outs.length){ list.innerHTML=`<div class="empty"><b>No desired outcomes yet</b>Name at least one desired outcome. Your intervention goals will address these.</div>`; return; }
  list.innerHTML=outs.map(o=>`
    <div class="out-card">
      <div class="out-top">
        <span class="dot"></span><span class="nm">${esc(o.text)}</span>
        <button class="rm" data-out="${o.id}" aria-label="Remove desired outcome">×</button>
      </div>
    </div>`).join("");
  list.querySelectorAll(".rm").forEach(b=>b.addEventListener("click",()=>{
    const id=b.dataset.out;
    logEvent("desired_outcome_remove",{id}); recordDelta("outcome_remove",{id});
    state.synthesis.desired_outcomes=state.synthesis.desired_outcomes.filter(o=>o.id!==id);
    renderOutcomes(); updateWalkthrough();
  }));
}
function wireTabs(){
  document.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      document.querySelectorAll(".tabpage").forEach(p=>p.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`.tabpage[data-page="${tab.dataset.tab}"]`).classList.add("active");
      logEvent("tab_switch",{tab:tab.dataset.tab}); recordDelta("tab",{tab:tab.dataset.tab});
      if(walk && isPractice()){ walk.tabsSeen[tab.dataset.tab]=true; }
      updateWalkthrough();
    });
  });
}
function wireOccupations(){
  const input=document.getElementById("occ_input");
  const desc=document.getElementById("occ_desc");
  const occMsg=(m)=>{ let el=document.getElementById("occ_msg");
    if(!m){ if(el) el.remove(); return; }
    if(!el){ el=document.createElement("div"); el.id="occ_msg"; el.className="occ-msg"; el.setAttribute("role","status"); input.parentElement.appendChild(el); }
    el.textContent=m; };
  input.addEventListener("input", ()=>occMsg("")); if(desc) desc.addEventListener("input", ()=>occMsg(""));
  const add=()=>{ const name=input.value.trim(); const description=(desc?desc.value.trim():"");
    if(!name){ occMsg("Please name the occupation, then press Add."); input.focus(); return; }
    if(!description){ occMsg("Please add a short description of this occupation, then press Add."); if(desc) desc.focus(); return; }
    occMsg("");
    const id=uid("occ_"); state.occupations.push({id,name,description}); logEvent("occupation_add",{name,description}); recordDelta("occ_add",{id,name,description});
    input.value=""; if(desc) desc.value=""; recordDelta("occ_input",{value:""}); recordDelta("occ_desc_input",{value:""}); renderOccupations(); renderPlan(); if(window.refreshMaxc) refreshMaxc(); };
  document.getElementById("occ_add").addEventListener("click", add);
  input.addEventListener("input", ()=>recordDelta("occ_input",{value:input.value}));
  if(desc) desc.addEventListener("input", ()=>recordDelta("occ_desc_input",{value:desc.value}));
  input.addEventListener("keydown", e=>{ if(e.key==="Enter") add(); });
}
function renderOccupations(){
  const list=document.getElementById("occ_list");
  document.getElementById("occ_count").textContent=state.occupations.length;
  if(!state.occupations.length){ list.innerHTML=`<div class="empty"><b>No occupations yet</b>Name and briefly describe the occupations this client needs or wants to do. Supports and barriers you identify link to these.</div>`; return; }
  list.innerHTML=state.occupations.map(o=>{
    const n=state.entries.filter(e=>(e.occIds||[]).includes(o.id)).length;
    return `<div class="occ-card"><span class="dot"></span><span class="nm">${esc(o.name)}</span><span class="tally">${n}</span><button class="rm" data-occ="${o.id}" aria-label="Remove ${esc(o.name)}">×</button>${o.description?`<div class="occ-desc">${esc(o.description)}</div>`:""}</div>`;
  }).join("");
  list.querySelectorAll(".rm").forEach(b=>b.addEventListener("click",()=>{
    const id=b.dataset.occ;
    const only=state.entries.filter(e=>(e.occIds||[]).length===1 && e.occIds[0]===id);
    if(only.length && !b.dataset.ok){ confirmOccRemove(id, only).then(ok=>{ if(ok){ b.dataset.ok="1"; b.click(); } }); return; }
    logEvent("occupation_remove",{id}); recordDelta("occ_remove",{id});
    state.occupations=state.occupations.filter(o=>o.id!==id);
    state.entries.forEach(e=>{ e.occIds=(e.occIds||[]).filter(x=>x!==id); });
    state.plan.selectedBarrierIds=state.plan.selectedBarrierIds.filter(bid=>{ const en=state.entries.find(x=>x.id===bid); return en&&(en.occIds||[]).length>0; });
    renderOccupations(); renderPerformance(); renderPlan();
  }));
}
function confirmOccRemove(id, only){
  const o=state.occupations.find(x=>x.id===id), nm=o?o.name:"this occupation", n=only.length;
  const planned=only.filter(e=>state.plan.selectedBarrierIds.includes(e.id)).length;
  const html=`Remove "${esc(nm)}"? ${n} support or barrier item${n===1?" is":"s are"} linked only to this occupation and will move to Unlinked.`
    + (planned?` ${n===1?"It is":planned===1?"One of them is":planned+" of them are"} in your plan; ${planned===1?"it":"they"} will be taken out of the plan, along with what you wrote for ${planned===1?"it":"them"}.`:"");
  if(typeof uiModal!=="function") return Promise.resolve(true);
  return uiModal({ title:"Remove this occupation?", html:html,
    buttons:[{label:"Remove", value:true}, {label:"Keep it", value:false, primary:true}] });
}
function renderPerformance(){
  const body=document.getElementById("pa_body");
  document.getElementById("pa_count").textContent=state.entries.length;
  if(!state.entries.length){ body.innerHTML=`<div class="empty"><b>No supports or barriers identified yet</b>Highlight text in the case material, then mark it a support or a barrier.</div>`; return; }
  let html="";
  state.occupations.forEach(o=>{
    const es=state.entries.filter(e=>(e.occIds||[]).includes(o.id)); if(!es.length) return;
    html+=`<div class="pa-occ"><div class="pa-occ-h"><span class="dot"></span>${esc(o.name)}</div>${es.map(entryHTML).join("")}</div>`;
  });
  const orphans=state.entries.filter(e=>!(e.occIds||[]).length);
  if(orphans.length) html+=`<div class="pa-occ unlinked"><div class="pa-occ-h" style="color:var(--ink-faint)">Unlinked (occupation removed)</div>${orphans.map(entryHTML).join("")}</div>`;
  body.innerHTML=html;
  body.querySelectorAll(".rm").forEach(b=>b.addEventListener("click",()=>{
    const id=b.dataset.entry;
    logEvent("entry_remove",{id}); recordDelta("entry_remove",{id});
    state.entries=state.entries.filter(e=>e.id!==id);
    state.plan.selectedBarrierIds=state.plan.selectedBarrierIds.filter(x=>x!==id);
    delete state.plan.perBarrier[id];
    renderOccupations(); renderPerformance(); renderPlan(); refreshHighlights();
  }));
}
function entryHTML(e){
  const isBar=e.type==="barrier";
  const verb=isBar?"limits":"enables";
  return `<div class="pa-entry ${isBar?'bar':'sup'}">
    <div class="top">
      <span class="glyph">${isBar?'▲':'●'}</span>
      <span class="lab">${isBar?'Barrier':'Support'}</span>
      ${e.aspect?`<span class="aspect">${esc(e.aspect)}</span>`:''}
      <button class="rm" data-entry="${e.id}" aria-label="Remove entry">×</button>
    </div>
    <div class="exc">"${esc(trunc(e.excerpt,140))}"</div>
    ${e.mechanism?`<div class="mech">${isBar?"In the way":"Enables"}: <b>${esc(e.mechanism)}</b></div>`:''}
  </div>`;
}
function renderPlan(){
  const body=document.getElementById("ip_body");
  const barriers=state.entries.filter(e=>e.type==="barrier" && (e.occIds||[]).length);
  const barrierPick = barriers.length
    ? barriers.map(b=>{ const occ={name:occNames(b.occIds)}; const on=state.plan.selectedBarrierIds.includes(b.id);
        return `<label class="ip-bar-pick"><input type="checkbox" data-bar="${b.id}" ${on?'checked':''} aria-label="Address the barrier ${esc(b.mechanism||'')} (barrier to ${esc(occ.name)})"/>
          <span class="txt"><span class="mech">${esc(b.mechanism||' - ')}</span> - barrier to ${esc(occ?occ.name:'?')}<br>
          <span style="opacity:.8">"${esc(trunc(b.excerpt,90))}"</span></span></label>`; }).join("")
    : `<div class="empty"><b>No barriers to address yet</b>Barriers you classify (linked to an occupation) appear here to build the plan on.</div>`;

  const cards=state.plan.selectedBarrierIds.map(bid=>{
    const b=state.entries.find(e=>e.id===bid); if(!b) return "";
    const occ={name:occNames(b.occIds)};
    const pb=state.plan.perBarrier[bid]||{};
    return `<div class="ip-card">
      <div class="cardh">${esc(b.mechanism||'barrier')} - ${esc(occ?occ.name:'?')}</div>
      <div class="ip-field"><label>Describe your approach</label>
        <textarea data-bid="${bid}" data-f="approach" placeholder="1-2 sentences">${esc(pb.approach||'')}</textarea></div>
      <div class="ip-field"><label>Method (incl. safety / environment)</label>
        <textarea data-bid="${bid}" data-f="method" placeholder="2-3 sentences">${esc(pb.method||'')}</textarea></div>
      <div class="ip-field"><label>Grading up / down</label>
        <textarea data-bid="${bid}" data-f="grading" placeholder="1-2 sentences">${esc(pb.grading||'')}</textarea></div>
    </div>`;
  }).join("");

  body.innerHTML=`
    <div class="ip-step"><span class="lbl">1 - Select the barriers you will address</span>
      <span class="hint">Constrained to your own barrier classifications.</span>${barrierPick}</div>
    <div class="ip-step"><span class="lbl">2 - Why prioritize these over the others?</span>
      <textarea class="ip" id="ip_prioritization" placeholder="2-3 sentences">${esc(state.plan.prioritization)}</textarea></div>
    <div class="ip-step"><span class="lbl">3 - For each barrier: approach, method, grading</span>
      ${state.plan.selectedBarrierIds.length?cards:'<div class="empty">Select at least one barrier above.</div>'}</div>
    <div class="ip-step"><span class="lbl">4 - Objective, measurable, occupation-based long-term goals that address the desired outcomes</span>
      <textarea class="ip" id="ip_goal" placeholder="one goal per line">${esc(state.plan.goal)}</textarea></div>
    <div class="ip-step"><span class="lbl">5 - Which goal or objective needs the most immediate attention, and why?</span>
      <textarea class="ip" id="ip_immediate" placeholder="2-3 sentences">${esc(state.plan.immediate)}</textarea></div>`;

  body.querySelectorAll('input[data-bar]').forEach(cb=>cb.addEventListener("change",()=>{
    const id=cb.dataset.bar;
    if(cb.checked){ if(!state.plan.selectedBarrierIds.includes(id)) state.plan.selectedBarrierIds.push(id); }
    else state.plan.selectedBarrierIds=state.plan.selectedBarrierIds.filter(x=>x!==id);
    logEvent("barrier_select",{id,on:cb.checked}); recordDelta("barrier_select",{id,on:cb.checked}); renderPlan();
  }));
  /* Per-barrier and plan-level field edits emit timestamped events on settle
     (debounced) so the intervention-planning phase enters the analysis as a
     sequence of moves, matching synthesis/classification logging. Not per-keystroke. */
  const planDebounce = {};
  const logPlanEdit = (key, detail)=>{ clearTimeout(planDebounce[key]); planDebounce[key]=setTimeout(()=>logEvent("plan_edit",detail),700); };
  /* Plan free-text revision trajectory -- symmetric with impression_revisions:
     the settled text of each plan field (per-barrier + plan-level) is snapshotted
     on debounce/blur, only when it changed, so plan reasoning carries the same
     edit history as the impression (not just final text + a length count). */
  const planRevTimers = {};
  const planSnapshot = (scope, field, bid, text)=>{
    const revs=(state.plan.revisions=state.plan.revisions||[]);
    let last=null; for(let i=revs.length-1;i>=0;i--){ const r=revs[i]; if(r.field===field && (r.barrier_id||null)===(bid||null)){ last=r; break; } }
    if(last && last.text===text) return;
    const ts=Date.now(); revs.push({version:revs.length+1, scope:scope, field:field, barrier_id:(bid||null), text:text, ts:ts});
    logEvent("plan_revision",{scope:scope, field:field, barrier_id:(bid||null), version:revs.length, len:text.length});
  };
  const planRevSettle=(key, scope, field, bid, getText)=>{ clearTimeout(planRevTimers[key]); planRevTimers[key]=setTimeout(()=>planSnapshot(scope,field,bid,getText()),800); };
  body.querySelectorAll('[data-bid]').forEach(el=>{
    const handler=()=>{ const {bid,f}=el.dataset; state.plan.perBarrier[bid]=state.plan.perBarrier[bid]||{}; state.plan.perBarrier[bid][f]=el.value; updateWalkthrough();
      logPlanEdit("bar:"+bid+":"+f, {scope:"barrier", barrier_id:bid, field:f, len:el.value.length});
      planRevSettle("bar:"+bid+":"+f, "barrier", f, bid, ()=>el.value);
      recordDelta("plan_barrier",{bid, field:f, value:el.value}); };
    el.addEventListener("input", handler); el.addEventListener("change", handler);
    el.addEventListener("blur", ()=>{ const {bid,f}=el.dataset; clearTimeout(planRevTimers["bar:"+bid+":"+f]); planSnapshot("barrier", f, bid, el.value); });
  });
  const bind=(id,key)=>{ const el=document.getElementById(id); if(el){ el.addEventListener("input",()=>{ state.plan[key]=el.value; updateWalkthrough(); logPlanEdit("plan:"+key,{scope:"plan", field:key, len:el.value.length}); planRevSettle("plan:"+key, "plan", key, null, ()=>el.value); recordDelta("plan_field",{field:key, value:el.value}); });
    el.addEventListener("blur", ()=>{ clearTimeout(planRevTimers["plan:"+key]); planSnapshot("plan", key, null, el.value); }); } };
  bind("ip_prioritization","prioritization"); bind("ip_goal","goal"); bind("ip_immediate","immediate");
  updateWalkthrough();
}

/* =====================================================================
   SELECTION → CLASSIFY POPOVER  (symmetric support/barrier, OTPF-4 aspect)
   ===================================================================== */
let popEl=null, pendingRange=null;
function removePop(){ if(popEl){ if(state&&state.recon){ try{ recordDelta("pop_close",{}); }catch(e){} } popEl.remove();popEl=null;} pendingRange=null; }
document.addEventListener("mousedown", e=>{ if(popEl && !popEl.contains(e.target)) removePop(); });
window.addEventListener("scroll", e=>{
  const t=e.target;
  if(popEl && t && t.nodeType===1 && popEl.contains(t)) return;  /* inner scroll inside the popup */
  removePop();
}, true);

function attachSelectionHandlers(){
  const body=document.getElementById("case_body");
  body.addEventListener("mouseup", ()=>{
    setTimeout(()=>{
      const sel=window.getSelection();
      if(!sel||sel.isCollapsed) return;
      let rng0=sel.getRangeAt(0); const rng=snapRangeToWords(rng0);
      if(rng.startOffset!==rng0.startOffset || rng.endOffset!==rng0.endOffset){ sel.removeAllRanges(); sel.addRange(rng); }
      const text=rng.toString().trim(); if(text.length<3) return;
      let node=sel.anchorNode, srcEl=node&&(node.nodeType===1?node:node.parentElement);
      const body2=document.getElementById("case_body");
      while(srcEl && !(srcEl.dataset&&srcEl.dataset.src) && srcEl!==body2) srcEl=srcEl.parentElement;
      const src=(srcEl&&srcEl.dataset&&srcEl.dataset.src)||null;
      if(popEl && window.__popOpen && window.__popOpen.text===text && window.__popOpen.src===src && Date.now()-window.__popOpen.t<600) return;
      pendingRange=rng.cloneRange();
      openPopover(text, src, rng.getBoundingClientRect());
    },1);
  });
}
function attachScrollCapture(){
  document.querySelectorAll('#app .panel-body').forEach(function(pb){
    var panel=pb.closest('.panel'); if(!panel||!panel.id) return;
    var key=panel.id, lastTop=-1, lastT=-100000;
    pb.addEventListener('scroll', function(){
      if(window.__rtaReplaying) return;                 // don't capture programmatic replay scrolls
      var now=nowRel(); if(now-lastT<100) return;        // throttle
      var top=Math.round(pb.scrollTop); if(top===lastTop) return;
      lastTop=top; lastT=now; recordDelta('scroll',{key:key, top:top});
    });
  });
}
/* Widen a selection that starts or ends mid-word to whole words (within its text nodes). */
function snapRangeToWords(r0){
  const r=r0.cloneRange(), W=/[A-Za-z0-9'-]/;
  const sc=r.startContainer, ec=r.endContainer;
  if(sc.nodeType===3){ let i=r.startOffset; const t=sc.data;
    if(i>0 && i<t.length && W.test(t[i-1]) && W.test(t[i])){ while(i>0 && W.test(t[i-1])) i--; r.setStart(sc,i); } }
  if(ec.nodeType===3){ let j=r.endOffset; const t=ec.data;
    if(j>0 && j<t.length && W.test(t[j-1]) && W.test(t[j])){ while(j<t.length && W.test(t[j])) j++; r.setEnd(ec,j); } }
  return r;
}
function openPopover(text, src, rect){
  removePopKeepRange(); window.__popOpen={text:text, src:src, t:Date.now()};
  popEl=document.createElement("div"); popEl.className="pop"; popEl.innerHTML=choiceStep(text);
  document.body.appendChild(popEl); window.__popRect=rect; positionPop(rect); wireChoiceStep(text, src); recordDelta("pop_open",{excerpt:text, src:src, loc: serializeRange(pendingRange, src)});
}
function removePopKeepRange(){ if(popEl){popEl.remove();popEl=null;} } /* keep pendingRange */
function positionPop(rect){
  const pad=10, w=popEl.offsetWidth, h=popEl.offsetHeight;
  let left=rect.left+rect.width/2-w/2, top=rect.bottom+8;
  if(top+h>window.innerHeight-pad) top=rect.top-h-8;
  left=Math.max(pad,Math.min(left,window.innerWidth-w-pad)); top=Math.max(pad,Math.min(top,window.innerHeight-h-pad));
  popEl.style.left=left+"px"; popEl.style.top=top+"px";
}
function choiceStep(text){
  return `<div class="exc">"${esc(trunc(text,180))}"</div>
    <div class="q">Classify this text</div>
    <div class="row2"><button class="pick sup" id="pk_sup">● Support</button><button class="pick bar" id="pk_bar">▲ Barrier</button></div>`;
}
function wireChoiceStep(text, src){
  document.getElementById("pk_sup").onclick=()=>classifyStep("support",text,src);
  document.getElementById("pk_bar").onclick=()=>classifyStep("barrier",text,src);
}
/* Symmetric classify step; prompt wording varies by valence. */
function classifyStep(type, text, src){
  if(!state.occupations.length){ needOccupationsWarn(); return; }
  recordDelta("pop_choice",{valence:type});
  const isBar=type==="barrier";
  const mechQ = isBar ? "What is getting in the way of this occupation?" : "What capacity or resource enables this?";
  const mechPH= isBar ? "e.g., left shoulder active reach; sustained grip" : "e.g., intact cognition; home health aide support";
  const occQ = isBar ? "A barrier to which occupation(s)? Select all that apply." : "This supports which occupation(s)? Select all that apply.";
  popEl.innerHTML=`
    <button class="back" id="pk_back">← back</button>
    <div class="q">${mechQ}</div>
    <textarea id="pk_mech" rows="4" maxlength="1000" placeholder="${mechPH}"></textarea>
    <div class="q">${occQ}</div>
    <div class="pk-occs" id="pk_occ" role="group">${state.occupations.map(o=>`<label class="pk-occ"><input type="checkbox" value="${o.id}"/><span>${esc(o.name)}</span></label>`).join("")}</div>
    <button class="confirm" id="pk_go" disabled>${isBar?'Add barrier':'Add support'}</button>`;
  if(window.__popRect) positionPop(window.__popRect);
  document.getElementById("pk_back").onclick=()=>{ recordDelta("pop_back",{}); popEl.innerHTML=choiceStep(text); wireChoiceStep(text,src); if(window.__popRect) positionPop(window.__popRect); };
  const mech=document.getElementById("pk_mech"), occBox=document.getElementById("pk_occ"), go=document.getElementById("pk_go");
  const pickedOccs=()=>Array.from(occBox.querySelectorAll("input[type=checkbox]:checked")).map(cb=>cb.value);
  const check=()=> go.disabled=!(mech.value.trim() && pickedOccs().length);
  mech.oninput=()=>{ recordDelta("pop_mech",{value:mech.value}); check(); }; occBox.addEventListener("change",()=>{ recordDelta("pop_occ",{occIds:pickedOccs()}); check(); }); mech.focus();
  go.onclick=()=>{ commitEntry({ type, excerpt:text, src, mechanism:mech.value.trim().replace(/\s+/g," "), aspect:null, occIds:pickedOccs() }); removePop(); };
}
function needOccupationsWarn(){
  popEl.innerHTML=`<div class="warn"><b>Add an occupation first.</b><br>A support or barrier is classified <em>in relation to an occupation</em>. Name at least one occupation, then highlight again.</div>`;
}
function commitEntry(e){
  e.id=uid("ent_"); e.ts=Date.now(); e.range=pendingRange||null;
  e.occIds=(e.occIds||[]).slice(); e.loc=serializeRange(e.range, e.src);   /* loc kept for highlight restore on resume */
  state.entries.push(e);
  logEvent("classify",{type:e.type,excerpt:e.excerpt,entry_id:e.id,occIds:e.occIds.slice(),mechanism:e.mechanism,aspect:e.aspect,src:e.src});
  recordDelta("entry_add",{id:e.id, type:e.type, excerpt:e.excerpt, src:e.src, mechanism:e.mechanism, aspect:e.aspect, occIds:e.occIds.slice(), loc:e.loc});
  if(window.getSelection) window.getSelection().removeAllRanges();
  renderOccupations(); renderPerformance(); renderPlan(); refreshHighlights();
}

/* =====================================================================
   UTILITIES / CHROME
   ===================================================================== */
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function trunc(s,n){ s=String(s); return s.length>n? s.slice(0,n-1)+"..." : s; }

/* =====================================================================
   PRACTICE WALKTHROUGH - practice case only.
   Mechanics-only, unlocked (interface stays live), completion-gated.
   Non-modal coach-marks point at controls; a persistent checklist tracks
   the required-action set and gates the Continue button. No timers.
   ===================================================================== */
let walk = null;
function isPractice(){ return CASE && CASE.role==="Practice"; }

const REQUIRED = [
  ["tabs",            "Open the Initial Evaluation tab"],
  ["impression",     "Write a clinical impression"],
  ["occupation",     "Add an occupation"],
  ["support",        "Mark a support"],
  ["barrier",        "Mark a barrier"],
  ["outcome",        "Add a desired outcome"],
  ["selectBarrier",  "Select a barrier into the plan"],
  ["interventionCard","Complete a barrier's plan fields"],
  ["prioritization", "Fill in prioritization"],
  ["goal",           "Write a long-term goal"],
  ["immediate",      "Fill in immediate attention"]
];
const TOUR = [
  {req:null,             sel:null,               h:"Welcome - this is practice", p:"This run is just to learn the tool before the real cases. Nothing here counts. Work through the checklist at the bottom in any order; when it's complete you can continue."},
  {req:"tabs",           sel:".tabs",            h:"Open every tab",            p:"The case material has two tabs. Open the Initial Evaluation tab at least once so you've seen all of it."},
  {req:"occupation",     sel:"#occ_input",       h:"Add an occupation",         p:"Name one occupation the client needs or wants to do, then briefly describe it (what they want and need to do). Press Add. Everything you classify links to an occupation."},
  {req:"support",        sel:"#case_body",       h:"Mark a support",            p:"Select any phrase in the case text. In the popup choose Support, name what enables it, and link it to an occupation."},
  {req:"barrier",        sel:"#case_body",       h:"Mark a barrier",            p:"Select another phrase and choose Barrier. Name what's getting in the way and link it to an occupation."},
  {req:"synthesis",      sel:"#aoi_synthesis",   h:"Synthesize the evaluation", p:"Write your clinical impression integrating the profile and your analysis, then add at least one desired outcome."},
  {req:"plan",           sel:"#aoi_intervention",h:"Build the plan",            p:"Select one of your barriers to address, then fill its approach, method, and grading - plus the prioritization, goal, and immediate-attention boxes."},
  {req:null,             sel:"#cl",              h:"That's everything",         p:"When every checklist item is checked, Continue turns on. Reopen this guide anytime with 'Show guide.'"}
];

function stepSatisfied(step){
  const st=checklistState();
  if(step.req===null) return true;                 // welcome/closer never gate resume
  if(step.req==="synthesis") return st.impression && st.outcome;
  if(step.req==="plan") return st.selectBarrier && st.interventionCard && st.prioritization && st.goal && st.immediate;
  return !!st[step.req];
}
function firstIncompleteStep(){
  for(let i=0;i<TOUR.length;i++){ if(!stepSatisfied(TOUR[i])) return i; }
  return TOUR.length-1;                             // all done -> closing step
}

function checklistState(){
  const s=state, w=walk;
  const card = s.plan.selectedBarrierIds.some(id=>{const pb=s.plan.perBarrier[id]||{}; return (pb.approach||'').trim()&&(pb.method||'').trim()&&(pb.grading||'').trim();});
  return {
    tabs: !!(w.tabsSeen.chart),
    impression: s.synthesis.impression_revisions.length>0,
    occupation: s.occupations.length>0,
    support: s.entries.some(e=>e.type==="support"),
    barrier: s.entries.some(e=>e.type==="barrier"),
    outcome: s.synthesis.desired_outcomes.length>0,
    selectBarrier: s.plan.selectedBarrierIds.length>0,
    interventionCard: card,
    prioritization: (s.plan.prioritization||"").trim().length>0,
    goal: (s.plan.goal||"").trim().length>0,
    immediate: (s.plan.immediate||"").trim().length>0
  };
}

function setupWalkthrough(){
  removeCoach(); const old=document.getElementById("cl"); if(old) old.remove();
  if(!isPractice()){ walk=null; return; }
  walk = state._walk || (state._walk = { tabsSeen:{}, tourStep:0, tourOpen:true, listOpen:true });
  buildChecklist();
  if(walk.tourOpen) showCoach(walk.tourStep);
}
function updateWalkthrough(){ if(!isPractice()||!walk) return; buildChecklist(); if(walk.tourOpen) positionCoach(); }

function buildChecklist(){
  const st=checklistState(); const done=REQUIRED.filter(([k])=>st[k]).length;
  let el=document.getElementById("cl");
  if(!el){ el=document.createElement("div"); el.id="cl"; el.className="cl"; document.body.appendChild(el); }
  el.className="cl"+(walk.listOpen?" open":"");
  el.innerHTML=`
    <div class="cl-bar" id="cl_bar">
      <span class="badge">Practice</span>
      <span class="prog"><b>${done}</b> / ${REQUIRED.length} tasks tried</span>
      <span class="sp"></span>
      <button class="guide" id="cl_guide">Show guide</button>
      <span class="caret">▲</span>
    </div>
    <div class="cl-body">
      <div class="cl-grid">
        ${REQUIRED.map(([k,label])=>`<div class="cl-item ${st[k]?'done':''}"><span class="box">${st[k]?'✓':''}</span>${label}</div>`).join("")}
      </div>
      <button class="cl-continue" id="cl_continue" ${done===REQUIRED.length?'':'disabled'}>
        ${done===REQUIRED.length?'Proceed to Think-Aloud →':'Complete all tasks to continue'}</button>
    </div>`;
  document.getElementById("cl_bar").onclick=(e)=>{ if(e.target.id==="cl_guide") return; walk.listOpen=!walk.listOpen; buildChecklist(); };
  document.getElementById("cl_guide").onclick=(e)=>{ e.stopPropagation(); walk.tourOpen=true; showCoach(firstIncompleteStep()); };
  { const ipb=document.getElementById("ip_body"); if(ipb) ipb.style.paddingBottom=(el.offsetHeight+24)+"px"; }
  const cont=document.getElementById("cl_continue");
  if(cont) cont.onclick=()=>{ if(done===REQUIRED.length){ walk.tourOpen=false; removeCoach(); submitCase(); } };
}

let coachEl=null;
function removeCoach(){ if(coachEl){coachEl.remove();coachEl=null;} }
function showCoach(i){ walk.tourStep=Math.max(0,Math.min(i,TOUR.length-1)); walk.tourOpen=true; renderCoach(); }
function renderCoach(){
  removeCoach(); if(!walk.tourOpen) return;
  const step=TOUR[walk.tourStep];
  coachEl=document.createElement("div"); coachEl.className="coach";
  coachEl.innerHTML=`<h5>${step.h}</h5><p>${step.p}</p>
    <div class="cbtns"><span class="step">${walk.tourStep+1} / ${TOUR.length}</span>
      ${walk.tourStep>0?'<button id="co_back">Back</button>':''}
      <button id="co_close">Close</button>
      <button class="primary" id="co_next">${walk.tourStep<TOUR.length-1?'Next':'Done'}</button></div>
    <div class="arrow" id="co_arrow" style="display:none"></div>`;
  document.body.appendChild(coachEl);
  const back=document.getElementById("co_back"); if(back) back.onclick=()=>showCoach(walk.tourStep-1);
  document.getElementById("co_close").onclick=()=>{ walk.tourOpen=false; removeCoach(); };
  document.getElementById("co_next").onclick=()=>{ if(walk.tourStep<TOUR.length-1) showCoach(walk.tourStep+1); else { walk.tourOpen=false; removeCoach(); } };
  positionCoach();
}
function positionCoach(){
  if(!coachEl) return; const step=TOUR[walk.tourStep];
  const arrow=document.getElementById("co_arrow");
  const w=coachEl.offsetWidth, h=coachEl.offsetHeight, pad=12;
  const target=step.sel?document.querySelector(step.sel):null;
  if(!target){ coachEl.style.left=(innerWidth/2-w/2)+"px"; coachEl.style.top=(innerHeight/2-h/2)+"px"; if(arrow) arrow.style.display="none"; return; }
  const r=target.getBoundingClientRect();
  let left=r.left+r.width/2-w/2, top=r.bottom+14, below=true;
  if(top+h>innerHeight-pad){ top=r.top-h-14; below=false; }
  left=Math.max(pad,Math.min(left,innerWidth-w-pad)); top=Math.max(pad,top);
  coachEl.style.left=left+"px"; coachEl.style.top=top+"px";
  if(arrow){ arrow.style.display="block"; const ax=Math.max(14,Math.min(r.left+r.width/2-left-6,w-26));
    arrow.style.left=ax+"px"; arrow.style[below?"top":"bottom"]="-6px"; }
}
window.addEventListener("resize", ()=>{ if(walk&&walk.tourOpen) positionCoach(); });

/* ---- CURSOR SAMPLING (reconstruction/replay only; never analyzed) ----
   Throttled position + which AOI the cursor is over. Idle is represented
   implicitly: no movement => no samples => a gap in the track (a pause the
   RTA can cue on). Attached once; always writes to the current state.recon. */
let __lastCursorSample = 0, __cursorAttached = false;
function attachCursorSampling(){
  if(__cursorAttached) return; __cursorAttached = true;
  document.addEventListener("mousemove", (e)=>{
    if(!state || !state.recon) return;
    const now = Date.now();
    if(now - __lastCursorSample < 120) return;   // ~8 Hz throttle
    __lastCursorSample = now;
    let aoi = null;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if(el){ const a = el.closest("[data-aoi]"); if(a) aoi = a.dataset.aoi; }
    state.recon.cursor.push({ x:e.clientX, y:e.clientY, aoi, t:nowRel() });
  }, { passive:true });
}

/* ===== INJECTED: REPLAY ENGINE ===== */
/* =====================================================================
   RTA RECONSTRUCTION REPLAY ENGINE  (Chunk 3 core)
   Rebuilds the participant's session visually from the recon record
   (deltas + cursor) alone -- NO screen recording. True-tempo playback.
   The participant watches this reconstruction and thinks aloud (van Gog
   continuous narration); pause/resume buys time to explain. No cues.

   Pure function of the recon record -> reconstructed state at any time t.
   This module is deterministic and testable outside the browser: given a
   recon record, replayStateAt(t) returns the exact state the participant
   saw at case-relative time t.
   ===================================================================== */

/* Rebuild the full interface state as it existed at case-relative time tMs,
   by applying every delta with delta.t <= tMs in order. This is the
   reconstruction: state is a pure fold over the delta list. */
function reconstructStateAt(recon, tMs){
  // fresh empty state mirror (only the fields the deltas write)
  const S = {
    occupations: [],
    entries: [],
    synthesis: { impression: "", desired_outcomes: [] },
    plan: { selectedBarrierIds: [], perBarrier: {}, prioritization:"", approach:"", method:"", type:"", grading:"", goal:"", immediate:"" },
    occInput: "",
    occDesc: "",
    scroll: {},
    activeTab: "profile"
  };
  for(const d of recon.deltas){
    if(d.t > tMs) break;               // deltas are time-ordered
    applyDelta(S, d);
  }
  return S;
}

/* Apply one delta to the state mirror. This is the inverse of the capture:
   each recordDelta op has a corresponding rebuild here. */
function applyDelta(S, d){
  switch(d.op){
    case "tab":            S.activeTab = d.tab; break;
    case "occ_input":      S.occInput = d.value; break;
    case "occ_desc_input": S.occDesc = d.value; break;
    case "scroll":         (S.scroll = S.scroll || {})[d.key] = d.top; break;
    case "occ_add":        S.occupations.push({ id:d.id, name:d.name, description:d.description }); break;
    case "occ_remove":     S.occupations = S.occupations.filter(o=>o.id!==d.id);
                           S.entries.forEach(e=>{ e.occIds=(e.occIds||[]).filter(x=>x!==d.id); });
                           S.plan.selectedBarrierIds = S.plan.selectedBarrierIds.filter(bid=>{ const en=S.entries.find(x=>x.id===bid); return en&&en.occIds.length>0; }); break;
    case "entry_add":      S.entries.push({ id:d.id, type:d.type, excerpt:d.excerpt, src:d.src,
                             mechanism:d.mechanism, aspect:d.aspect, occIds:(d.occIds||(d.occId?[d.occId]:[])).slice(), loc:d.loc }); break;
    case "entry_remove":   S.entries = S.entries.filter(e=>e.id!==d.id);
                           S.plan.selectedBarrierIds = S.plan.selectedBarrierIds.filter(x=>x!==d.id);
                           delete S.plan.perBarrier[d.id]; break;
    case "impression":     S.synthesis.impression = d.text; break;
    case "outcome_add":    S.synthesis.desired_outcomes.push({ id:d.id, text:d.text, otpf4_outcome_type:null }); break;
    case "outcome_remove": S.synthesis.desired_outcomes = S.synthesis.desired_outcomes.filter(o=>o.id!==d.id); break;
    case "outcome_tag":    { const o=S.synthesis.desired_outcomes.find(x=>x.id===d.id); if(o) o.otpf4_outcome_type=d.type; } break;
    case "barrier_select": if(d.on){ if(!S.plan.selectedBarrierIds.includes(d.id)) S.plan.selectedBarrierIds.push(d.id); }
                           else { S.plan.selectedBarrierIds = S.plan.selectedBarrierIds.filter(x=>x!==d.id); } break;
    case "plan_barrier":   (S.plan.perBarrier[d.bid] = S.plan.perBarrier[d.bid] || {})[d.field] = d.value; break;
    case "plan_field":     S.plan[d.field] = d.value; break;
  }
}

/* Cursor position at time tMs: last sample at or before tMs (step-hold),
   for animating the cursor/attention marker during replay. */
function cursorAt(recon, tMs){
  let last = null;
  for(const c of recon.cursor){ if(c.t > tMs) break; last = c; }
  return last;  // {x,y,aoi,t} or null
}

/* The set of distinct event times where SOMETHING changed -- these are the
   frames the replay must render to be faithful. (Deltas + cursor samples.) */
function replayKeyframes(recon){
  const ts = new Set();
  recon.deltas.forEach(d=>ts.add(d.t));
  recon.cursor.forEach(c=>ts.add(c.t));
  return Array.from(ts).sort((a,b)=>a-b);
}



/* ===== INJECTED: REPLAY CONTROLLER ===== */

/* =====================================================================
   RTA REPLAY CONTROLLER  (Chunk 3)
   Drives true-tempo playback of a recon record through the real interface.
   Participant watches and narrates continuously (van Gog reinstatement).
   Pause/resume buys time to explain. No predetermined cues.
   Silence net: uniform keep-talking prompt on long unpaused silence.
   ===================================================================== */
const Replay = (function(){
  let recon=null, keyframes=[], t0=0, playT=0, playing=false, raf=null, lastRenderKF=-1;
  let cursorEl=null, hud=null, onDone=null;

  // ---- SILENCE NET (configurable a-priori threshold; NOT hard-coded) ----
  // Value below is a placeholder; final threshold is a design decision with
  // an a-priori justification (van Gog used 5s; TA convention ~15s).
  const SILENCE_NET = {
    thresholdMs: 15000,            // <-- OPEN PARAMETER: finalize with justification
    prompt: "Please keep describing what you were thinking.",  // fixed, non-directive, uniform
    lastSpeechAt: 0, armed:true, fires:[]
  };
  // In the live instrument this is driven by mic VAD / Whisper partials.
  // Here it is exposed so it can be unit-tested and wired to the audio stream.
  function noteSpeech(atMs){ SILENCE_NET.lastSpeechAt = atMs; }

  // ---- NARRATION CAPTURE (re-anchoring) -- mirrors js/reanchor.js (canonical).
  //      If js/reanchor.js changes, re-extract this block. Records each utterance
  //      at the shown task-moment (playT); playT freezes during pause, so an
  //      utterance spoken while paused anchors to the paused moment. ----
  var narrationCap = (function(){
    var narration=[];
    return {
      note:function(text, playTMs, opts){ if(text==null) return null; opts=opts||{};
        var u={text:String(text), playT:Math.max(0,Math.round(Number(playTMs)||0)),
               paused:!!opts.paused, wall_t:(opts.wall_t!=null?opts.wall_t:null), kind:opts.kind||'final'};
        narration.push(u); return u; },
      get:function(){ return narration.slice(); },
      clear:function(){ narration.length=0; }
    };
  })();
  function reanchorAllLocal(list, off){ off=(off==null?null:Number(off));
    return (list||[]).map(function(u){ return {text:u.text, case_relative_t:u.playT,
      session_offset_t:(off==null?null:off+u.playT), paused:!!u.paused, kind:u.kind||'final'}; }); }
  /* Public: record a transcribed utterance at the current shown task-moment and
     re-arm the silence net from the same event. The live mic/Whisper layer calls
     this; noteSpeech(playT) remains the raw VAD hook. */
  function noteUtterance(text, opts){
    var u=narrationCap.note(text, playT, Object.assign({paused:!playing}, opts||{}));
    noteSpeech(playT);
    return u;
  }
  function checkSilenceNet(nowMs){
    if(!playing || !SILENCE_NET.armed) return;
    if(nowMs - SILENCE_NET.lastSpeechAt >= SILENCE_NET.thresholdMs){
      SILENCE_NET.fires.push(nowMs);
      showNet(SILENCE_NET.prompt);
      SILENCE_NET.lastSpeechAt = nowMs;   // re-arm from now (uniform, non-selective)
    }
  }
  function showNet(msg){
    let n=document.getElementById('rp_net');
    if(!n){ n=document.createElement('div'); n.id='rp_net'; document.body.appendChild(n);
      Object.assign(n.style,{position:'fixed',left:'50%',bottom:'88px',transform:'translateX(-50%)',
        background:'#1f2937',color:'#fff',font:'600 14px system-ui',padding:'10px 16px',borderRadius:'8px',
        zIndex:10001,boxShadow:'0 4px 16px rgba(0,0,0,.25)',transition:'opacity .3s',opacity:'0'}); }
    n.textContent=msg; n.style.opacity='1';
    clearTimeout(n._h); n._h=setTimeout(()=>{ n.style.opacity='0'; }, 3500);
  }

  function hydrateAndRender(tMs){
    // reconstruct state at tMs and push into the live `state`, then render
    const S = reconstructStateAt(recon, tMs);
    state.occupations = S.occupations.map(o=>({id:o.id,name:o.name}));
    state.entries = S.entries.map(e=>{
      const ent = {id:e.id,type:e.type,excerpt:e.excerpt,src:e.src,mechanism:e.mechanism,aspect:e.aspect,occIds:(e.occIds||[]).slice(),loc:e.loc};
      ent.range = e.loc ? rangeFromOffsets(e.loc) : null;   // rebuild highlight span
      return ent;
    });
    state.synthesis.impression = S.synthesis.impression;
    state.synthesis.desired_outcomes = S.synthesis.desired_outcomes.map(o=>({id:o.id,text:o.text,otpf4_outcome_type:o.otpf4_outcome_type}));
    state.plan.selectedBarrierIds = S.plan.selectedBarrierIds.slice();
    state.plan.perBarrier = JSON.parse(JSON.stringify(S.plan.perBarrier||{}));
    ['prioritization','approach','method','type','grading','goal','immediate'].forEach(k=>{ if(k in S.plan) state.plan[k]=S.plan[k]; });
    // set active tab to what was showing
    if(S.activeTab && typeof setActiveTab==='function'){ try{ setActiveTab(S.activeTab); }catch(e){} }
    renderCase();
    // Re-apply the active tab AND its content pane. Panes are .tabpage[data-page]
    // toggled by an .active class -- the old code targeted [data-tabpane]/display,
    // so switching the tab button never switched the panel content.
    if(S.activeTab){
      document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active', x.dataset.tab===S.activeTab));
      document.querySelectorAll('.tabpage').forEach(pp=>pp.classList.toggle('active', pp.getAttribute('data-page')===S.activeTab));
    }
    // replay the occupation name + description being typed into the (transient) inputs
    { var __oi=document.getElementById('occ_input'); if(__oi) __oi.value = S.occInput || ''; }
    { var __od=document.getElementById('occ_desc'); if(__od) __od.value = S.occDesc || ''; }
    // renderCase() rebuilt #app, detaching the highlight ranges resolved above.
    // Re-resolve each entry's range against the fresh source DOM and repaint.
    state.entries.forEach(e=>{ e.range = e.loc ? rangeFromOffsets(e.loc) : null; });
    if(typeof refreshHighlights==='function') refreshHighlights();
    if(typeof renderReplayPopup==='function') renderReplayPopup(recon, tMs);
    // restore each panel's scroll position -- what the participant had scrolled to,
    // so highlights and fields below the fold come into view on replay.
    if(S.scroll){ Object.keys(S.scroll).forEach(function(k){ var pb=document.querySelector('#'+k+' .panel-body'); if(pb) pb.scrollTop=S.scroll[k]; }); }
    makeNonInteractive();
  }

  function makeNonInteractive(){
    const app=document.getElementById('app'); if(app) app.style.pointerEvents='none';
  }

  function positionCursor(tMs){
    const c = cursorAt(recon, tMs);
    if(!cursorEl){ cursorEl=document.createElement('div'); cursorEl.id='rp_cursor'; document.body.appendChild(cursorEl);
      Object.assign(cursorEl.style,{position:'fixed',width:'18px',height:'18px',borderRadius:'50%',
        border:'2px solid #d95a30',background:'rgba(217,90,48,.25)',zIndex:10000,pointerEvents:'none',
        transform:'translate(-50%,-50%)',transition:'left .08s linear, top .08s linear'}); }
    if(c){ cursorEl.style.display=''; cursorEl.style.left=c.x+'px'; cursorEl.style.top=c.y+'px'; }
    else cursorEl.style.display='none';
  }

  function tick(ts){
    if(!playing) return;
    if(!t0) t0 = ts - playT;
    playT = ts - t0;                       // true-tempo: 1ms wall == 1ms task time
    // render at any keyframe we've crossed
    for(let i=lastRenderKF+1;i<keyframes.length;i++){
      if(keyframes[i] <= playT){ hydrateAndRender(keyframes[i]); lastRenderKF=i; }
      else break;
    }
    positionCursor(playT);
    checkSilenceNet(playT);
    updateHUD();
    if(playT >= keyframes[keyframes.length-1]){ playing=false; if(onDone) onDone(); return; }
    raf = requestAnimationFrame(tick);
  }

  function updateHUD(){
    if(!hud) return;
    const dur = keyframes[keyframes.length-1]||0;
    const mm=(x)=>{const s=Math.floor(x/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
    hud.querySelector('#rp_time').textContent = mm(Math.min(playT,dur))+' / '+mm(dur);
    hud.querySelector('#rp_bar_fill').style.width = (100*Math.min(playT,dur)/(dur||1))+'%';
    hud.querySelector('#rp_toggle').textContent = playing? 'Pause' : 'Resume';
    const live=hud.querySelector('#rp_live'), lbl=hud.querySelector('#rp_live_label');
    if(live){ live.className = playing? 'playing' : '';
      const dot=live.querySelector('.dot'); if(dot) dot.style.background = playing? '#3ddc84' : '#94a3b8'; }
    if(lbl){ lbl.textContent = playing? 'Playing' : 'Paused'; }
  }

  function buildHUD(){
    if(!document.getElementById('rp_hud_style')){
      const stl=document.createElement('style'); stl.id='rp_hud_style';
      stl.textContent='@keyframes rp_pulse{0%{opacity:1;transform:scale(1)}50%{opacity:.2;transform:scale(.65)}100%{opacity:1;transform:scale(1)}}'
        +'#rp_live .dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#3ddc84;margin-right:7px;vertical-align:middle}'
        +'#rp_live.playing .dot{animation:rp_pulse 1.1s ease-in-out infinite}';
      document.head.appendChild(stl);
    }
    hud=document.createElement('div'); hud.id='rp_hud';
    Object.assign(hud.style,{position:'fixed',left:'0',right:'0',bottom:'0',height:'64px',background:'#0f172a',
      color:'#fff',display:'flex',alignItems:'center',gap:'16px',padding:'0 20px',zIndex:10002,font:'14px system-ui'});
    hud.innerHTML = `
      <button id="rp_toggle" style="background:#d95a30;color:#fff;border:0;border-radius:6px;padding:8px 18px;font:600 14px system-ui;cursor:pointer">Pause</button>
      <span id="rp_live" class="playing" style="white-space:nowrap;font-weight:600"><span class="dot"></span><span id="rp_live_label">Playing</span></span>
      <div style="font-variant-numeric:tabular-nums" id="rp_time">00:00 / 00:00</div>
      <div style="flex:1;height:8px;background:#334155;border-radius:4px;overflow:hidden"><div id="rp_bar_fill" style="height:100%;width:0;background:#d95a30"></div></div>
      <div style="opacity:.8">Keep describing what you were thinking</div>`;
    document.body.appendChild(hud);
    hud.querySelector('#rp_toggle').onclick=()=>{ playing?pause():resume(); };
  }

  function start(reconRecord, opts){
    recon = reconRecord; opts=opts||{};
    if(opts.silenceThresholdMs) SILENCE_NET.thresholdMs=opts.silenceThresholdMs;
    onDone = opts.onDone||null;
    keyframes = replayKeyframes(recon); if(!keyframes.length) keyframes=[0];
    playT=0; t0=0; lastRenderKF=-1; SILENCE_NET.lastSpeechAt=0; SILENCE_NET.fires=[]; narrationCap.clear();
    buildHUD(); hydrateAndRender(0); positionCursor(0);
    resume();
  }
  function pause(){ playing=false; if(raf) cancelAnimationFrame(raf); t0=0; updateHUD(); }
  function resume(){ if(playing) return; playing=true; t0=0; raf=requestAnimationFrame(tick); }
  function seek(tMs){ playT=Math.max(0,Math.min(tMs,keyframes[keyframes.length-1]||0)); t0=0; lastRenderKF=-1;
    for(let i=0;i<keyframes.length;i++){ if(keyframes[i]<=playT){hydrateAndRender(keyframes[i]);lastRenderKF=i;} } positionCursor(playT); updateHUD(); }

  return { start, pause, resume, seek, noteSpeech, noteUtterance,
           getNarration:()=>narrationCap.get(), getReanchored:(off)=>reanchorAllLocal(narrationCap.get(), off),
           _state:()=>({playT,playing,keyframes,fires:SILENCE_NET.fires.slice(),threshold:SILENCE_NET.thresholdMs}) };
})();

// Auto-start if a recon record was injected



