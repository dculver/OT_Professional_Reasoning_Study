#!/usr/bin/env python3
"""
Generates synthetic OT-study session exports (schema ot_prof_reasoning_v1) that
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
        ev(4500,"classify",{"type":"barrier","excerpt":"pain with overhead reach","occId":"occ_1","occupation":"Upper-body dressing","mechanism":"limited shoulder flexion","aspect":"Client factor","src":"fl_ch_pain","source":"Chart: Pain"}),
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
       ev(2000,"classify",{"type":"barrier","excerpt":"fatigue after activity","occId":"occ_3","occupation":"Gardening","mechanism":"low endurance","aspect":"Client factor","src":"yv_ch_fatigue","source":"Chart: Fatigue"}),
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

# =================== REFERENCE PARSE (mirror of R) ===================
NO_TEXT = {"occupation_remove","entry_remove","barrier_select","desired_outcome_remove","desired_outcome_tag","tab_switch"}

def parse_session(doc, source_file):
    pid = doc.get("study_id") or os.path.splitext(os.path.basename(source_file))[0]
    sess = doc.get("session",{}) or {}
    group = sess.get("group"); year = sess.get("year_in_program")
    rows=[]
    for case in doc.get("cases",[]):
        if not case.get("analyzed"): continue
        cid=case.get("case_id"); cname=case.get("case_name")
        offset=case.get("case_started_offset_ms") or 0
        task=case.get("task") or {}
        imp_rev={r.get("version"):r.get("text") for r in (task.get("synthesis",{}).get("impression_revisions") or [])}
        plan=task.get("intervention_plan",{}) or {}
        events=task.get("event_log",[]) or []
        # last plan_edit index per (scope,barrier_id,field)
        plan_last={}
        for i,e in enumerate(events):
            if e.get("kind")=="plan_edit":
                d=e.get("detail") or {}
                key=(d.get("scope"), d.get("barrier_id") or "", d.get("field"))
                plan_last[key]=i
        case_rows=[]
        for i,e in enumerate(events):
            k=e.get("kind"); d=e.get("detail") or {}; t=e.get("t")
            text=None; segmentable=False
            meta={"occupation":(d.get("occupation") or (d.get("name") if k=="occupation_add" else None)),
                  "source":d.get("source"),"excerpt":d.get("excerpt"),
                  "aspect":d.get("aspect"),"otpf_type":d.get("type"),
                  "barrier_on":(d.get("on") if k=="barrier_select" else None)}
            # Occupation is a CODED reasoning line now: the description is the coded
            # text (sentence-split), the short name rides along in the occupation column.
            if k=="occupation_add": text=d.get("description") or d.get("name"); segmentable=True
            elif k=="classify": text=d.get("mechanism")
            elif k=="desired_outcome_add": text=d.get("text")
            elif k=="synthesis_revision": text=imp_rev.get(d.get("version")); segmentable=True
            elif k=="plan_edit":
                key=(d.get("scope"), d.get("barrier_id") or "", d.get("field"))
                if plan_last.get(key)!=i:
                    continue   # skip intermediate edits; only final text per field
                if d.get("scope")=="barrier" or d.get("barrier_id"):
                    text=(plan.get("perBarrier",{}).get(d.get("barrier_id"),{}) or {}).get(d.get("field"))
                else:
                    text=plan.get(d.get("field"))
                segmentable=True
            # else: no-text kinds -> text stays None
            def base(txt, seg):
                r={"participant_id":pid,"group":group,"year_in_program":year,"case_id":cid,"case_name":cname,
                   "time_ms":t,"session_offset_ms":(offset+t) if t is not None else None,
                   "stream":"action","kind":k,"segment_index":seg,
                   "text":(txt or ""),"has_text":bool(txt and str(txt).strip())}
                r.update(meta); r["paused"]=None
                return r
            if segmentable and text:
                for si,sent in enumerate(split_sentences(text)):
                    case_rows.append((t,0,i,base(sent,si+1)))
            else:
                case_rows.append((t,0,i,base(text,1)))
        # RTA
        for j,u in enumerate(case.get("rta") or []):
            t=u.get("case_relative_t")
            r={"participant_id":pid,"group":group,"year_in_program":year,"case_id":cid,"case_name":cname,
               "time_ms":t,"session_offset_ms":u.get("session_offset_t"),
               "stream":"rta","kind":"rta_utterance","segment_index":1,
               "text":(u.get("text") or ""),"has_text":bool((u.get("text") or "").strip()),
               "occupation":None,"source":None,"excerpt":None,"aspect":None,"otpf_type":None,
               "barrier_on":None,"paused":u.get("paused")}
            case_rows.append((t,1,10000+j,r))
        # sort by time, then action-before-rta, then original order; assign line_index
        case_rows.sort(key=lambda x:(x[0] if x[0] is not None else 0, x[1], x[2]))
        for idx,(_,_,_,r) in enumerate(case_rows,1):
            r["line_index"]=idx
            rows.append(r)
    return rows

COLS=["participant_id","group","year_in_program","case_id","case_name","line_index",
      "time_ms","session_offset_ms","stream","kind","has_text","segment_index",
      "text","occupation","source","excerpt","aspect","otpf_type","barrier_on","paused"]

def write_csv(rows, path):
    import csv
    with open(path,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore"); w.writeheader()
        for r in rows: w.writerow({c:("" if r.get(c) is None else r.get(c)) for c in COLS})

def qa_rows(all_rows):
    from collections import defaultdict
    agg=defaultdict(lambda:{"n_events":0,"n_action_text":0,"n_rta":0})
    for r in all_rows:
        key=(r["participant_id"],r["case_id"])
        a=agg[key]
        if r["stream"]=="action": a["n_events"]+=1; a["n_action_text"]+= (1 if r["has_text"] else 0)
        else: a["n_rta"]+= 1
    out=[]
    for (pid,cid),a in agg.items():
        out.append({"participant_id":pid,"case_id":cid,"n_action_rows":a["n_events"],
                    "n_action_text":a["n_action_text"],"n_rta":a["n_rta"],
                    "rta_empty_FLAG":(a["n_rta"]==0)})
    return out

def write_qa(qrows, path):
    import csv
    cols=["participant_id","case_id","n_action_rows","n_action_text","n_rta","rta_empty_FLAG"]
    with open(path,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=cols); w.writeheader()
        for r in qrows: w.writerow(r)

if __name__=="__main__":
    os.makedirs(SAMPLES,exist_ok=True); os.makedirs(EXPECT,exist_ok=True)
    s1=make_session("P001","faculty","NA")
    s2=make_session("P014","student","2", empty_rta_yvonne=True)  # simulates a failed-transcription case
    json.dump(s1, open(os.path.join(SAMPLES,"ot_session_P001.json"),"w"), indent=1)
    json.dump(s2, open(os.path.join(SAMPLES,"ot_session_P014.json"),"w"), indent=1)
    allrows=[]
    for fn in sorted(os.listdir(SAMPLES)):
        if not fn.endswith(".json"): continue
        doc=json.load(open(os.path.join(SAMPLES,fn)))
        allrows += parse_session(doc, fn)
    corpus=[r for r in allrows if r["has_text"]]
    write_csv(allrows, os.path.join(EXPECT,"ona_events_full.csv"))
    write_csv(corpus,  os.path.join(EXPECT,"ncoder_corpus.csv"))
    write_qa(qa_rows(allrows), os.path.join(EXPECT,"qa_summary.csv"))
    print(f"rows total={len(allrows)} corpus(text)={len(corpus)}")
    print("sample corpus rows:")
    for r in corpus[:6]:
        print(f"  [{r['participant_id']}|{r['case_id']}|{r['kind']}|t={r['time_ms']}] {r['text'][:60]}")
