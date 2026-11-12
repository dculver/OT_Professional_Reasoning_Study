#!/usr/bin/env python3
"""
Generates synthetic OT-study session exports (schemas ot_prof_reasoning_v1 and v2) that
exercise every event kind, and computes the EXPECTED long-format output using the
exact parse the R script implements. Used to validate the R algorithm.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, "sample_logs")
EXPECT  = os.path.join(HERE, "expected")

# ---------------- sentence splitter (mirror of the R one) ----------------
ABBR = ["Dr","Mr","Mrs","Ms","e.g","i.e","vs","etc","Inc","Ltd","approx","Fig","No","St"]
def split_sentences(x):
    if x is None: return []
    s = str(x).strip()
    if not s: return []
    for a in ABBR:
        s = re.sub(r"\b"+re.escape(a)+r"\.", a+"<DOT>", s)
    parts = re.split(r"(?<=[.!?])\s+(?=[\"'A-Z0-9])", s)
    parts = [p.replace("<DOT>",".").strip() for p in parts]
    return [p for p in parts if p]

# ---------------- a case's task block ----------------
def make_task(case_id, case_role, case_name, imp_revisions, outcomes, occs, entries, plan, events):
    return {
        "case_id":case_id, "case_role":case_role, "case_name":case_name,
        "synthesis":{
            "impression": imp_revisions[-1]["text"] if imp_revisions else "",
            "impression_last_edit": None,
            "impression_revisions": imp_revisions,
            "desired_outcomes": outcomes,
        },
        "occupations": occs,
        "entries": entries,
        "intervention_plan": plan,
        "event_log": events,
    }

def clockstr(ms):
    s=ms/1000.0; m=int(s//60); r=s-m*60
    return f"{m:02d}:{r:04.1f}"

def ev(t, kind, detail):
    return {"t":t, "t_clock":clockstr(t), "kind":kind, "detail":detail}

# ---------- Case 1 (Florence) for a participant ----------
def florence_case(offset):
    imp_revs = [
        {"version":1, "text":"Florence has reduced shoulder range after her replacement.", "ts":1000},
        {"version":2, "text":"Florence has reduced shoulder range after her replacement. Her rheumatoid arthritis limits grip and endurance, so morning routines are effortful.", "ts":2000},
    ]
    outcomes = [
        {"id":"out_a","text":"Dress upper body independently.","otpf4_outcome_type":"Occupational performance","ts":111},
        {"id":"out_b","text":"Prepare a simple meal safely.","otpf4_outcome_type":None,"ts":222},
    ]
    occs = [{"id":"occ_1","name":"Upper-body dressing","description":"She wants to dress herself in the morning without waiting for the aide. She needs to don a front-open shirt and manage the buttons."},
            {"id":"occ_2","name":"Meal preparation","description":"She wants to make a simple lunch on her own. She needs to reach a low shelf and carry a plate to the table."}]
    entries = [
        {"id":"ent_1","type":"support","excerpt":"reports strong family support","provenance_src":"fl_prof_2","mechanism":"family assists with setup","otpf4_aspect":"Context","occupation_id":"occ_1","ts":1},
        {"id":"ent_2","type":"barrier","excerpt":"pain with overhead reach","provenance_src":"fl_ch_pain","mechanism":"limited shoulder flexion","otpf4_aspect":"Client factor","occupation_id":"occ_1","ts":2},
    ]
    plan = {"selectedBarrierIds":["ent_2"],
            "perBarrier":{"ent_2":{"approach":"Restore","method":"Graded overhead reach with pulleys. Progress to reaching a shelf.","type":"Occupation-based","grading":"Increase height weekly."}},
            "prioritization":"Address shoulder reach first because it gates dressing. Endurance follows.",
            "goal":"In 3 weeks Florence will don a front-open shirt independently.",
            "immediate":"Set up adaptive equipment. Teach energy conservation."}
    E = [
        ev(500,"tab_switch",{"tab":"chart"}),
        ev(1200,"occupation_add",{"name":"Upper-body dressing","description":"She wants to dress herself in the morning without waiting for the aide. She needs to don a front-open shirt and manage the buttons."}),
        ev(1500,"occupation_add",{"name":"Meal preparation","description":"She wants to make a simple lunch on her own. She needs to reach a low shelf and carry a plate to the table."}),
        ev(3000,"classify",{"type":"support","excerpt":"reports strong family support","occId":"occ_1","occupation":"Upper-body dressing","mechanism":"family assists with setup","aspect":"Context","src":"fl_prof_2","source":"Profile ¶2"}),
        ev(4500,"classify",{"type":"barrier","excerpt":"pain with overhead reach","occId":"occ_1","occupation":"Upper-body dressing","mechanism":"limited shoulder flexion","aspect":"Client factor","src":"fl_ch_pain","source":"Initial Evaluation: Pain"}),
        ev(6000,"synthesis_revision",{"version":1,"len":58}),
        ev(9000,"synthesis_revision",{"version":2,"len":140}),
        ev(11000,"desired_outcome_add",{"text":"Dress upper body independently."}),
        ev(12000,"desired_outcome_add",{"text":"Prepare a simple meal safely."}),
        ev(12500,"desired_outcome_tag",{"id":"out_a","type":"Occupational performance","outcome":"Dress upper body independently."}),
        ev(13000,"barrier_select",{"id":"ent_2","on":True,"entry":"pain with overhead reach"}),
        ev(14000,"plan_edit",{"scope":"barrier","barrier_id":"ent_2","field":"method","len":20}),
        ev(15000,"plan_edit",{"scope":"barrier","barrier_id":"ent_2","field":"method","len":64}),   # later edit of same field
        ev(16000,"plan_edit",{"scope":"plan","field":"prioritization","len":70}),
        ev(17000,"plan_edit",{"scope":"plan","field":"goal","len":58}),
        ev(18000,"plan_edit",{"scope":"plan","field":"immediate","len":48}),
        ev(19000,"entry_remove",{"id":"ent_x","entry":"(removed draft)"}),
        ev(20000,"occupation_remove",{"id":"occ_9","occupation":"(removed)"}),
    ]
    rta = [
        {"text":"I started on the chart because I wanted the medical picture first.","case_relative_t":700,"session_offset_t":offset+700,"paused":False,"kind":"final"},
        {"text":"Here I was weighing whether the pain was the main barrier.","case_relative_t":4600,"session_offset_t":offset+4600,"paused":True,"kind":"final"},
        {"text":"I prioritized the shoulder because dressing depends on it.","case_relative_t":16200,"session_offset_t":offset+16200,"paused":False,"kind":"final"},
    ]
    return {"case_id":"florence","case_role":"Case 1","case_name":"Florence","analyzed":True,
            "case_started_offset_ms":offset,
            "task":make_task("florence","Case 1","Florence",imp_revs,outcomes,occs,entries,plan,E),
            "rta":rta,"rta_silence_prompts":[15000]}

def yvonne_case(offset, empty_rta=False):
    imp_revs=[{"version":1,"text":"Yvonne is recovering from a mastectomy with SLE-related fatigue.","ts":1}]
    outcomes=[{"id":"out_c","text":"Return to gardening.","otpf4_outcome_type":"Participation","ts":1}]
    occs=[{"id":"occ_3","name":"Gardening","description":"She wants to return to tending her raised beds. She needs to kneel, reach, and work for stretches without exhausting herself."}]
    entries=[{"id":"ent_3","type":"barrier","excerpt":"fatigue after activity","provenance_src":"yv_ch_fatigue","mechanism":"low endurance","otpf4_aspect":"Client factor","occupation_id":"occ_3","ts":1}]
    plan={"selectedBarrierIds":["ent_3"],
          "perBarrier":{"ent_3":{"approach":"Modify","method":"Pace tasks; sit to garden.","type":"Preparatory","grading":""}},
          "prioritization":"","goal":"Garden 20 minutes without a rest break in 4 weeks.","immediate":""}
    E=[ev(400,"occupation_add",{"name":"Gardening","description":"She wants to return to tending her raised beds. She needs to kneel, reach, and work for stretches without exhausting herself."}),
       ev(2000,"classify",{"type":"barrier","excerpt":"fatigue after activity","occId":"occ_3","occupation":"Gardening","mechanism":"low endurance","aspect":"Client factor","src":"yv_ch_fatigue","source":"Initial Evaluation: Fatigue"}),
       ev(4000,"synthesis_revision",{"version":1,"len":62}),
       ev(6000,"desired_outcome_add",{"text":"Return to gardening."}),
       ev(7000,"barrier_select",{"id":"ent_3","on":True,"entry":"fatigue after activity"}),
       ev(8000,"plan_edit",{"scope":"barrier","barrier_id":"ent_3","field":"method","len":26}),
       ev(9000,"plan_edit",{"scope":"plan","field":"goal","len":52})]
    rta=[] if empty_rta else [
        {"text":"Fatigue was the dominant concern for Yvonne.","case_relative_t":2100,"session_offset_t":offset+2100,"paused":False,"kind":"final"},
        {"text":"I chose pacing rather than strengthening given the SLE.","case_relative_t":8200,"session_offset_t":offset+8200,"paused":True,"kind":"final"}]
    return {"case_id":"yvonne","case_role":"Case 2","case_name":"Yvonne","analyzed":True,
            "case_started_offset_ms":offset,
            "task":make_task("yvonne","Case 2","Yvonne",imp_revs,outcomes,occs,entries,plan,E),
            "rta":rta,"rta_silence_prompts":[]}

def practice_case():
    return {"case_id":"practice","case_role":"Practice","case_name":"Patricia","analyzed":False,
            "case_started_offset_ms":0,"task":None,"rta":[],"rta_silence_prompts":[]}

def make_session(sub_id, group, year, empty_rta_yvonne=False):
    return {
        "schema":"ot_prof_reasoning_v1","study_id":sub_id,"generated_at":"2026-01-01T00:00:00Z",
        "session":{"started_at":"2026-01-01T00:00:00Z","user_agent":"test","session_started_at_ms":1000,
                   "group":group,"year_in_program":year,"url_params":{"sub_id":sub_id,"group":group,"year":year},
                   "task_viewport":{"w":1440,"h":900},"browser_check":{},"permissions":{},"rta_silence_threshold_ms":15000},
        "cases":[practice_case(),
                 florence_case(offset=60000),
                 yvonne_case(offset=180000, empty_rta=empty_rta_yvonne)]
    }


# ---------------- a v2 session (segmented think-aloud) ----------------
def florence_case_v2(offset):
    """Exercises the v2 rules: a mid-typing fragment inside an editing run, a pause
    item splitting the impression into two runs, multi-occupation classify, plan
    revisions, a two-chunk recording, and one failed transcription."""
    imp_revs = [
        {"version":1, "text":"Florence has reduced", "ts":1},                                   # mid-typing snapshot
        {"version":2, "text":"Florence has reduced shoulder range.", "ts":2},
        {"version":3, "text":"Florence has reduced shoulder range. She fears a nursing home.", "ts":3},
    ]
    occs = [{"id":"occ_1","name":"Dressing","description":"She wants to dress without the aide."},
            {"id":"occ_2","name":"Bathing","description":"She wants to shower safely."}]
    entries = [{"id":"ent_1","type":"barrier","excerpt":"pain with overhead reach","provenance_src":"fl_ch_pain",
                "mechanism":"limited shoulder flexion","otpf4_aspect":None,"occupation_ids":["occ_1","occ_2"],"ts":1}]
    plan = {"selectedBarrierIds":["ent_1"], "perBarrier":{"ent_1":{"approach":"Restore reach.","method":"Pulleys. Shelf reach.","grading":"Raise height."}},
            "prioritization":"Reach gates dressing.", "goal":"Dress in 3 weeks.", "immediate":"Sleep.",
            "revisions":[{"version":1,"scope":"barrier","field":"method","barrier_id":"ent_1","text":"Pulleys.","ts":1},
                         {"version":2,"scope":"barrier","field":"method","barrier_id":"ent_1","text":"Pulleys. Shelf reach.","ts":2}]}
    E = [
        ev(500,  "tab_switch", {"tab":"chart"}),                                                              # 0
        ev(1000, "occupation_add", {"name":"Dressing","description":"She wants to dress without the aide."}),  # 1
        ev(1400, "occupation_add", {"name":"Bathing","description":"She wants to shower safely."}),            # 2
        ev(3000, "classify", {"type":"barrier","excerpt":"pain with overhead reach","entry_id":"ent_1","occIds":["occ_1","occ_2"],
                              "occupations":["Dressing","Bathing"],"occupation":"Dressing; Bathing","mechanism":"limited shoulder flexion",
                              "aspect":None,"src":"fl_ch_pain","source":"Initial Evaluation - Sensory/pain"}),               # 3
        ev(5000, "synthesis_revision", {"version":1,"len":20}),                                               # 4
        ev(6000, "synthesis_revision", {"version":2,"len":36}),                                               # 5
        ev(40000,"synthesis_revision", {"version":3,"len":62}),                                               # 6 (after a pause item)
        ev(41000,"barrier_select", {"id":"ent_1","on":True,"entry":"pain with overhead reach","entry_type":"barrier","mechanism":"limited shoulder flexion"}),  # 7
        ev(42000,"plan_revision", {"scope":"barrier","field":"method","barrier_id":"ent_1","version":1,"len":8}),  # 8
        ev(42500,"plan_edit", {"scope":"barrier","barrier_id":"ent_1","field":"method","len":8}),             # 9
        ev(43000,"plan_revision", {"scope":"barrier","field":"method","barrier_id":"ent_1","version":2,"len":20}), # 10
        ev(43500,"plan_edit", {"scope":"barrier","barrier_id":"ent_1","field":"method","len":20}),            # 11
        ev(44000,"session_resumed", {"gap_wall_ms":90000,"resumed_at_t":43800}),                             # 12
    ]
    items = [
        {"item_id":"it1","index":0,"kind":"action","action":{"kind":"occupation_add","event_indices":[1]},"clip_start_t":0,"clip_end_t":1000,"anchor_t":1000},
        {"item_id":"it2","index":1,"kind":"action","action":{"kind":"occupation_add","event_indices":[2]},"clip_start_t":1000,"clip_end_t":1400,"anchor_t":1400},
        {"item_id":"it3","index":2,"kind":"action","action":{"kind":"classify","event_indices":[3]},"clip_start_t":1400,"clip_end_t":3000,"anchor_t":3000},
        {"item_id":"it4","index":3,"kind":"action","action":{"kind":"synthesis_revision","event_indices":[4,5]},"clip_start_t":3000,"clip_end_t":6000,"anchor_t":6000},
        {"item_id":"it5","index":4,"kind":"pause","clip_start_t":6000,"clip_end_t":38000,"still_start_t":7000,"still_ms":31000,"anchor_t":7000},
        {"item_id":"it6","index":5,"kind":"action","action":{"kind":"synthesis_revision","event_indices":[6]},"clip_start_t":38000,"clip_end_t":40000,"anchor_t":40000},
        {"item_id":"it7","index":6,"kind":"action","action":{"kind":"barrier_select","event_indices":[7]},"clip_start_t":40000,"clip_end_t":41000,"anchor_t":41000},
        {"item_id":"it8","index":7,"kind":"action","action":{"kind":"plan_revision","event_indices":[8,10]},"clip_start_t":41000,"clip_end_t":43000,"anchor_t":43000},
    ]
    def u(text, t, item, kind, rec, ci, akind):
        return {"text":text,"case_relative_t":t,"session_offset_t":offset+t,"paused":None,"kind":"final","item_id":item,"item_kind":kind,
                "action_kind":akind,"rec_id":rec,"chunk_index":ci}
    rta = [
        u("I wanted the medical picture first.", 3000, "it3", "action", "1_it3_r1", 0, "classify"),
        u("The reach problem touches both dressing and bathing.", 3000, "it3", "action", "1_it3_r1", 1, "classify"),
        u("I was weighing whether she could stay home.", 7000, "it5", "pause", "1_it5_r2", 0, None),
        u("I chose reach because dressing depends on it.", 43000, "it8", "action", "1_it8_r3", 0, "plan_revision"),
    ]
    return {"case_id":1,"case_role":"Case 1","case_name":"Florence","analyzed":True,"case_started_offset_ms":offset,
            "task":make_task(1,"Case 1","Florence",imp_revs,[],occs,entries,plan,E),
            "rta":rta, "rta_items":items,
            "rta_transcription_summary":{"n_recordings":4,"n_silent":0,"audio_ms":40000,"by_status":{"done":3,"error":1},"median_rtf":1.9}}

def make_session_v2(sub_id, group, year):
    return {"schema":"ot_prof_reasoning_v2","export_kind":"final","study_id":sub_id,"generated_at":"2026-11-11T00:00:00Z",
            "session":{"group":group,"year_in_program":year,"session_started_at_ms":1000},
            "cases":[{"case_id":"practice","case_role":"Practice","case_name":"Patricia","analyzed":False,"task":None,"rta":[]},
                     florence_case_v2(offset=60000)]}

# =================== REFERENCE PARSE (mirror of R) ===================
from collections import Counter

COLS=["participant_id","group","year_in_program","case_id","case_name","line_index","time_ms",
      "session_offset_ms","stream","kind","has_text","segment_index",
      "text","occupation","source","excerpt","aspect","otpf_type","barrier_on","paused",
      "event_index","item_id","item_kind","rec_id","chunk_index","run_events","removed_sentences"]
QA_EXTRA = {}

def sentence_delta(curr, prev):
    """Sentences in curr not in prev (multiset difference, order kept)."""
    cnt = Counter(split_sentences(prev)); out = []
    for s in split_sentences(curr):
        if cnt[s] > 0: cnt[s] -= 1
        else: out.append(s)
    return out

def parse_session(doc, source_file, line_mode="sentence", plan_mode="final"):
    pid = doc.get("study_id") or os.path.splitext(os.path.basename(source_file))[0]
    sess = doc.get("session",{}) or {}
    group = sess.get("group"); year = sess.get("year_in_program")
    rows=[]
    for case in doc.get("cases",[]):
        if not case.get("analyzed"): continue
        cid=case.get("case_id"); cname=case.get("case_name")
        offset=case.get("case_started_offset_ms") or 0
        task=case.get("task") or {}
        events=task.get("event_log",[]) or []
        plan=task.get("intervention_plan",{}) or {}
        items=case.get("rta_items") or []
        n_ev=len(events)
        has_plan_rev=any(e.get("kind")=="plan_revision" for e in events)
        pmode="delta" if (plan_mode=="delta" and has_plan_rev) else "final"   # v1 logs fall back to final
        # think-aloud item covering each event (event_indices are 0-based)
        ev_item=[None]*n_ev
        for it in items:
            for j in ((it.get("action") or {}).get("event_indices") or []):
                if j is not None and j < n_ev: ev_item[j]=it.get("item_id")
        ts=case.get("rta_transcription_summary")
        if ts is not None:
            bs=ts.get("by_status") or {}
            ok={"done","empty","not_transcribed_practice","not_transcribed_silent"}
            QA_EXTRA[(pid,cid)]={"n_rec":ts.get("n_recordings") or 0,"lost":sum(v for k,v in bs.items() if k not in ok)}
        imp_rev={str(r.get("version")):r.get("text") for r in ((task.get("synthesis") or {}).get("impression_revisions") or [])}
        plan_rev={str(r.get("version")):r.get("text") for r in (plan.get("revisions") or [])}
        # editing runs
        run_key=[None]*n_ev; run_last={}; run_n={}; cur_key=None; seq_n=0
        for i,e in enumerate(events):
            k=e.get("kind"); d=e.get("detail") or {}
            if k=="tab_switch": continue
            fld=None
            if k=="synthesis_revision": fld="imp"
            elif k=="plan_revision" and pmode=="delta":
                fld="|".join(["plan", d.get("scope") or "", d.get("field") or "", d.get("barrier_id") or ""])
            if fld is None: cur_key=None; continue
            base=(fld+"#item:"+ev_item[i]) if ev_item[i] is not None else None
            if base is None:
                if cur_key is None or not cur_key.startswith(fld+"#"): seq_n+=1; base=fld+"#run"+str(seq_n)
                else: base=cur_key
            run_key[i]=base; cur_key=base; run_last[base]=i; run_n[base]=run_n.get(base,0)+1
        plan_last={}
        for i,e in enumerate(events):
            if e.get("kind")=="plan_edit":
                d=e.get("detail") or {}
                plan_last["|".join([d.get("scope") or "", d.get("barrier_id") or "", d.get("field") or ""])]=i
        case_rows=[]
        def mk(t, k, txt, seg, meta, i, itm, ikind, rec=None, ci=None, run_events=None, removed=None, stream="action", paused=None):
            has=bool(txt is not None and str(txt).strip())
            r={"participant_id":pid,"group":group,"year_in_program":year,"case_id":cid,"case_name":cname,
               "time_ms":t,"session_offset_ms":(offset+t) if t is not None else None,
               "stream":stream,"kind":k,"segment_index":seg,"text":(str(txt) if has else ""),"has_text":has,
               "event_index":i,"item_id":itm,"item_kind":ikind,"rec_id":rec,"chunk_index":ci,
               "run_events":run_events,"removed_sentences":removed,"paused":paused}
            r.update(meta); return r
        def emit(i, t, k, txt, segmentable, meta, run_events=None, removed=None, segments=None):
            itm=ev_item[i]; ikind=None if itm is None else "action"; ei=i+1   # 1-based like R
            if segments is not None and line_mode=="sentence" and len(segments):
                for si,s in enumerate(segments): case_rows.append((t,0,ei,mk(t,k,s,si+1,meta,ei,itm,ikind,run_events=run_events,removed=removed)))
            elif segmentable and line_mode=="sentence" and txt is not None and str(txt).strip():
                for si,s in enumerate(split_sentences(txt)): case_rows.append((t,0,ei,mk(t,k,s,si+1,meta,ei,itm,ikind,run_events=run_events,removed=removed)))
            else:
                case_rows.append((t,0,ei,mk(t,k,txt,1,meta,ei,itm,ikind,run_events=run_events,removed=removed)))
        prev_text={}
        for i,e in enumerate(events):
            k=e.get("kind"); d=e.get("detail") or {}; t=e.get("t")
            meta={"occupation":d.get("occupation"),"source":d.get("source"),"excerpt":d.get("excerpt"),
                  "aspect":d.get("aspect"),"otpf_type":d.get("type"),
                  "barrier_on":(d.get("on") if k=="barrier_select" else None)}
            if k=="occupation_add":
                meta["occupation"]=d.get("name") or meta["occupation"]
                emit(i,t,k,d.get("description") or d.get("name"),True,meta)
            elif k=="classify": emit(i,t,k,d.get("mechanism"),False,meta)
            elif k=="desired_outcome_add": emit(i,t,k,d.get("text"),False,meta)
            elif k in ("synthesis_revision","plan_revision") and run_key[i] is not None:
                key=run_key[i]
                if run_last[key]!=i: continue
                fld=key.split("#")[0]
                curr=(imp_rev if k=="synthesis_revision" else plan_rev).get(str(d.get("version"))) or ""
                prev=prev_text.get(fld,"")
                delta=sentence_delta(curr,prev); removed=len(sentence_delta(prev,curr)); prev_text[fld]=curr
                emit(i,t,k,(" ".join(delta) if delta else None),True,meta,run_n[key],removed,segments=delta)
            elif k=="plan_revision": continue
            elif k=="plan_edit":
                if pmode=="delta": continue
                key="|".join([d.get("scope") or "", d.get("barrier_id") or "", d.get("field") or ""])
                if plan_last.get(key)!=i: continue
                if d.get("scope")=="barrier" or d.get("barrier_id"):
                    txt=((plan.get("perBarrier") or {}).get(d.get("barrier_id")) or {}).get(d.get("field"))
                else: txt=plan.get(d.get("field"))
                emit(i,t,k,txt,True,meta)
            else: emit(i,t,k,None,False,meta)
        rta=case.get("rta") or []
        blank={"occupation":None,"source":None,"excerpt":None,"aspect":None,"otpf_type":None,"barrier_on":None}
        if line_mode=="event" and rta and rta[0].get("rec_id") is not None:
            recs=[]
            for x in rta:
                rid=x.get("rec_id") or ""
                if rid not in recs: recs.append(rid)
            for rj,rid in enumerate(recs,1):
                us=[x for x in rta if (x.get("rec_id") or "")==rid]; u1=us[0]; t=u1.get("case_relative_t")
                txt=" ".join((x.get("text") or "").strip() for x in us)
                r=mk(t,"rta_utterance",txt,1,blank,None,u1.get("item_id"),u1.get("item_kind"),rec=rid,stream="rta",paused=u1.get("paused"))
                r["session_offset_ms"]=u1.get("session_offset_t"); case_rows.append((t,1,10000+rj,r))
        else:
            for j,x in enumerate(rta,1):
                t=x.get("case_relative_t")
                r=mk(t,"rta_utterance",x.get("text"),1,blank,None,x.get("item_id"),x.get("item_kind"),rec=x.get("rec_id"),ci=x.get("chunk_index"),stream="rta",paused=x.get("paused"))
                r["session_offset_ms"]=x.get("session_offset_t"); case_rows.append((t,1,10000+j,r))
        case_rows.sort(key=lambda x:(x[0] if x[0] is not None else 0, x[1], x[2]))
        for idx,(_,_,_,r) in enumerate(case_rows,1):
            r["line_index"]=idx; rows.append(r)
    return rows

def _cell(v):
    if v is None: return ""
    if isinstance(v,bool): return "True" if v else "False"
    return v

def write_csv(rows, path):
    import csv
    with open(path,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore"); w.writeheader()
        for r in rows: w.writerow({c:_cell(r.get(c)) for c in COLS})

QA_COLS=["participant_id","case_id","n_action_rows","n_action_text","n_rta","rta_empty_FLAG","n_rta_recordings","rta_not_transcribed"]
def qa_rows(all_rows):
    from collections import defaultdict
    agg=defaultdict(lambda:{"n_events":0,"n_action_text":0,"n_rta":0})
    for r in all_rows:
        a=agg[(r["participant_id"],r["case_id"])]
        if r["stream"]=="action": a["n_events"]+=1; a["n_action_text"]+=(1 if r["has_text"] else 0)
        else: a["n_rta"]+=1
    out=[]
    for (pid,cid),a in sorted(agg.items(), key=lambda kv:(str(kv[0][0]),str(kv[0][1]))):
        x=QA_EXTRA.get((pid,cid))
        out.append({"participant_id":pid,"case_id":cid,"n_action_rows":a["n_events"],"n_action_text":a["n_action_text"],
                    "n_rta":a["n_rta"],"rta_empty_FLAG":(a["n_rta"]==0),
                    "n_rta_recordings":(x["n_rec"] if x else None),"rta_not_transcribed":(x["lost"] if x else None)})
    return out

def write_qa(qrows, path):
    import csv
    with open(path,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=QA_COLS); w.writeheader()
        for r in qrows: w.writerow({c:_cell(r.get(c)) for c in QA_COLS})

def build_expected(line_mode, plan_mode, outdir):
    QA_EXTRA.clear(); os.makedirs(outdir, exist_ok=True)
    allrows=[]
    for fn in sorted(os.listdir(SAMPLES)):
        if not fn.endswith(".json"): continue
        allrows += parse_session(json.load(open(os.path.join(SAMPLES,fn))), fn, line_mode, plan_mode)
    corpus=[r for r in allrows if r["has_text"]]
    write_csv(allrows, os.path.join(outdir,"ona_events_full.csv"))
    write_csv(corpus,  os.path.join(outdir,"ncoder_corpus.csv"))
    write_qa(qa_rows(allrows), os.path.join(outdir,"qa_summary.csv"))
    return allrows, corpus

if __name__=="__main__":
    os.makedirs(SAMPLES,exist_ok=True); os.makedirs(EXPECT,exist_ok=True)
    json.dump(make_session("P001","faculty","NA"), open(os.path.join(SAMPLES,"ot_session_P001.json"),"w"), indent=1)
    json.dump(make_session("P014","student","2", empty_rta_yvonne=True), open(os.path.join(SAMPLES,"ot_session_P014.json"),"w"), indent=1)  # failed-transcription case
    json.dump(make_session_v2("P021","2","NA"), open(os.path.join(SAMPLES,"ot_session_P021_v2.json"),"w"), indent=1)
    for lm, pm, d in [("sentence","final",EXPECT), ("event","final",os.path.join(HERE,"expected_event_lines")),
                      ("sentence","delta",os.path.join(HERE,"expected_plan_delta"))]:
        allrows, corpus = build_expected(lm, pm, d)
        print(f"{lm}/{pm}: rows total={len(allrows)} corpus(text)={len(corpus)} -> {os.path.relpath(d, HERE)}")
