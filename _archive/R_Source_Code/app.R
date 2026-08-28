## =====================================================================
## EXPERIMENTAL-ARM FEEDBACK DASHBOARD
## Dissertation: clinical reasoning development in OT students
## Delivered between Case 1 and Case 2, same session.
##
## WIRED AGAINST THE ACTUAL index.html HANDOFF PAYLOAD:
##   case_id (scalar), condition,
##   gaze_aois, gaze_events, gaze_transitions, gaze_quality,
##   click_events, click_sequence, click_transitions,
##   transcript_segments, hypotheses, evidence_table,
##   assessments_ordered, selected_plan, selected_equipment,
##   case_summary, choice
##
## KEY STRUCTURAL FACT
## index.html has no separate reasoning-product stream. Reasoning products
## and navigation are BOTH inside click_events, distinguished by $action.
## This file splits them: product actions feed the network, navigation
## actions are routed to RQA and never enter it.
##
## WHAT IS REAL HERE
##   - ingestion of the live payload, stream split, case check
##   - accumulation, sphere normalisation, proximal-zone selection
##   - card lookup and rendering
##
## WHAT IS PLACEHOLDER (replace before collecting study data)
##   - faculty reference profile      data/faculty_profile.csv
##   - temporal impact function       data/tif_params.json
##   - emic/etic code application     ACTION_CODE_MAP, EMIC_REGEX, CODE_REGEX
##   - exemplar quotes in the cards   data/feedback_cards.csv
##
## DESIGN COMMITMENTS (do not change without revisiting Chapter 3):
##   - 7 codes / 21 undirected edges. No MONITOR node.
##   - Gaze and navigation clicks NEVER enter the network. RQA only.
##   - No coordinates, no scores, no gauges, no faculty display.
##   - Faculty reference is HIDDEN backend personalisation only.
##   - Network attributed to the CASE, not the student.
##   - Default view descriptive ("leaned on most"), never evaluative.
##   - 1-3 flagged edges max, proximal-zone rule.
## =====================================================================

library(shiny)
library(bslib)
library(jsonlite)
library(dplyr)
library(ggplot2)
library(S7)   # ggplot2 WebAssembly fix (keep for shinylive/webR)

`%||%` <- function(a, b) if (is.null(a) || length(a) == 0) b else a

## =====================================================================
## 1. CONFIG - OPEN RESEARCH DECISIONS
## Defaults are my recommendation, not your ruling.
## =====================================================================

DEMO_MODE        <- FALSE   # TRUE = render from synthetic events, no jsPsych
SHOW_DIAGNOSTICS <- TRUE    # MUST be FALSE for real participants

CASE_ID <- 1L

FLAG_DIRECTIONS   <- c("under")      # or c("under", "over")
MAX_FLAGGED_EDGES <- 1L              # 1..3
ELIGIBLE_EDGES    <- "cross"         # "cross" (12 emic-etic) or "all" (21)

REDUCED_VIEW_RULE <- "threshold"     # or "topn"
REDUCED_THRESHOLD <- 0.20
REDUCED_TOPN      <- 6L

GRADIENT_SCALING <- "relative"       # or "absolute"
SHOW_SCALE_KEY   <- TRUE

CLOSABILITY_EXPONENT <- 0.5

## Without a floor, closability is exactly zero whenever the student never
## made the connection at all - so a completely ABSENT connection could
## never be flagged, however large the gap.
##   0.00 - absent connections excluded from flagging
##   0.05 - absent connections compete, but a foothold still helps
##   1.00 - collapses to "largest gap overall", ignoring the proximal zone
CLOSABILITY_FLOOR <- 0.05

FACULTY_PROFILE_PATH <- "data/faculty_profile.csv"
CARD_TABLE_PATH      <- "data/feedback_cards.csv"
TIF_PARAMS_PATH      <- "data/tif_params.json"
DEMO_EVENTS_PATH     <- "data/demo_student_events.csv"

## IndexedDB handoff - matches index.html line ~4290.
IDB_NAME  <- "OT_Simulation_DB"
IDB_STORE <- "sessions"
IDB_KEY   <- "active_session"

## =====================================================================
## 2. CODES
## Emic: Schell's professional reasoning tracks
## Etic: Winne & Hadwin phases (phase level only; COPES is not coded)
## =====================================================================

emic_codes <- c("NARRATIVE", "SCIENTIFIC", "PRAGMATIC")
etic_codes <- c("TASK_DEF", "GOAL_SET", "ENACTING", "ADAPT")
codes <- c(emic_codes, etic_codes)

code_label <- c(
  NARRATIVE = "Narrative", SCIENTIFIC = "Scientific", PRAGMATIC = "Pragmatic",
  TASK_DEF = "Defining the task", GOAL_SET = "Setting goals",
  ENACTING = "Carrying out", ADAPT = "Adapting"
)

## Glosses are part of the intervention. The control arm must receive
## identical vocabulary or condition differs in more than personalisation.
code_gloss <- c(
  NARRATIVE = "the client's story", SCIENTIFIC = "evidence and condition",
  PRAGMATIC = "setting and resources", TASK_DEF = "what's being asked",
  GOAL_SET = "what to aim for", ENACTING = "acting on the plan",
  ADAPT = "adjusting as you go"
)

edge_id <- function(a, b) paste(pmin(a, b), pmax(a, b), sep = "~")

all_edges <- local({
  cmb <- t(combn(codes, 2))
  data.frame(from = cmb[, 1], to = cmb[, 2],
             edge_id = edge_id(cmb[, 1], cmb[, 2]),
             stringsAsFactors = FALSE)
})
stopifnot(nrow(all_edges) == 21L)

all_edges$kind <- with(all_edges, ifelse(
  from %in% emic_codes & to %in% emic_codes, "emic-emic",
  ifelse(from %in% etic_codes & to %in% etic_codes, "etic-etic", "cross")))

## =====================================================================
## 3. PLACEHOLDER CODE APPLICATION
##
## Stands in for nCoder until the pilot delivers validated classifiers.
##
## NAV_ACTIONS      - click actions that are navigation only. Routed to
##                    RQA, never coded, never in the network.
## ACTION_CODE_MAP  - click actions that ARE reasoning products. Each maps
##                    to one etic phase and optionally a default emic track.
## EMIC_FROM_DETAIL - actions whose emic track should be read from the
##                    logged detail text rather than assumed. This is more
##                    defensible than a blanket mapping: adding evidence
##                    from a patient interview is NARRATIVE, from a lab
##                    result is SCIENTIFIC, and the detail text says which.
## CODE_REGEX       - applied to think-aloud text and to click detail.
##
## Every one of these mappings is my proposal, not your codebook. The
## diagnostics panel lists any action string not covered here.
## =====================================================================

NAV_ACTIONS <- c("tab_switch", "panel_click", "instructions_dismissed")

## action -> c(etic, emic_default). emic_default may be NA.
ACTION_CODE_MAP <- list(
  evidence_added          = c("ENACTING", NA),          # emic from detail
  evidence_removed        = c("ADAPT",    NA),
  evidence_cleared        = c("ADAPT",    NA),
  hypothesis_added        = c("GOAL_SET", "SCIENTIFIC"),
  hypothesis_removed      = c("ADAPT",    "SCIENTIFIC"),
  assessment_ordered      = c("ENACTING", "SCIENTIFIC"),
  assessment_result_shown = c("TASK_DEF", "SCIENTIFIC"),
  library_sent            = c("ENACTING", "SCIENTIFIC"),
  plan_selected           = c("GOAL_SET", "PRAGMATIC"),
  equip_selected          = c("ENACTING", "PRAGMATIC"),
  equip_deselected        = c("ADAPT",    "PRAGMATIC"),
  case_submitted          = c("ENACTING", NA),
  belief_initial          = c("GOAL_SET", NA),
  belief_raised           = c("ADAPT",    NA),
  belief_lowered          = c("ADAPT",    NA)
)

EMIC_FROM_DETAIL <- c("evidence_added", "evidence_removed",
                      "library_sent", "assessment_ordered",
                      "hypothesis_added", "plan_selected")

CODE_REGEX <- list(
  NARRATIVE  = "she (wants|said|told|mentioned|reports)|he (wants|said|told|reports)|her (goal|story|words|daughter|son|family|husband|wife)|his (goal|story|family)|important to (her|him)|meaningful|lives (alone|with)|at home|daily (life|routine)|what matters|used to|return to|grandchild|cook|garden|hobby|interview|occupational profile|client report|prior level",
  SCIENTIFIC = "range of motion|\\bROM\\b|strength|\\bMMT\\b|grip|sensation|tone|spastic|vital|blood pressure|\\blab\\b|imaging|diagnos|stroke|\\bCVA\\b|hemi|neglect|apraxia|cognit|\\bMoCA\\b|\\bMMSE\\b|evidence|literature|assessment|score|measured|deficit|test|screen",
  PRAGMATIC  = "insurance|reimburse|caseload|equipment|budget|discharge|the (home|house|apartment)|counter|stair|bathroom|doorway|support at home|resources|setting|realistic|billing|visit|adaptive|dycem|rocker knife|universal cuff|button hook|dressing stick|velcro|grab bar|tub bench",
  TASK_DEF   = "referral|referred for|reason for (the )?(visit|referral)|the (problem|question|issue) (is|here)|main concern|occupational profile|scope|what i need to (find|figure)|the task",
  GOAL_SET   = "the goal|goals? (is|are|will be)|aiming for|target|want (her|him) to be able|outcome|by (the end|discharge)|short.term|long.term|priorit",
  ENACTING   = "i.m going to|i.ll (use|try|start|do)|let.s (start|try|do)|next i|first i|the plan is|i recommend|i.d (use|choose|select)|working on|practis|train|set (her|him) up|position",
  ADAPT      = "i.m not sure|wait|actually|on second thought|let me reconsider|reconsider|double.?check|change (my|the) (mind|approach|plan)|instead|that (isn.t|is not) working|adjust|revise|rethink|hmm|maybe i.m wrong|different approach"
)

regex_hits <- function(s, which = names(CODE_REGEX)) {
  if (is.null(s) || is.na(s) || !nzchar(s)) return(character(0))
  s <- tolower(s)
  which[vapply(CODE_REGEX[which], function(rx)
    grepl(rx, s, perl = TRUE, ignore.case = TRUE), logical(1))]
}

## =====================================================================
## 4. FIXED SCHEMATIC LAYOUT
## Node positions are a pedagogical layout, NOT fitted geometry. The
## dashboard needs no SVD. State this in the methods so the mismatch
## isn't read as an error.
## =====================================================================

node_pos <- data.frame(
  code = codes,
  x = c(0, 0, 0, 1, 1, 1, 1),
  y = c(0.82, 0.50, 0.18, 0.92, 0.64, 0.36, 0.08),
  stringsAsFactors = FALSE
)

## =====================================================================
## 5. FROZEN FACULTY REFERENCE PROFILE
## MUST be tma line.weights (sphere-normalised), NOT connection.counts.
## =====================================================================

load_faculty_profile <- function(path = FACULTY_PROFILE_PATH) {
  if (!file.exists(path)) return(NULL)
  fp <- utils::read.csv(path, stringsAsFactors = FALSE)
  if (!all(c("edge_id", "weight") %in% names(fp)))
    stop("faculty_profile.csv must have columns: edge_id, weight")
  miss <- setdiff(all_edges$edge_id, fp$edge_id)
  if (length(miss))
    stop("faculty profile missing edges: ", paste(miss, collapse = ", "))
  L <- sqrt(sum(fp$weight^2))
  if (abs(L - 1) > 1e-6)
    warning("Faculty profile is not unit length (L2 = ", round(L, 4),
            "). Did you freeze connection.counts instead of line.weights?")
  setNames(fp$weight, fp$edge_id)[all_edges$edge_id]
}
FACULTY <- load_faculty_profile()

load_cards <- function(path = CARD_TABLE_PATH) {
  if (!file.exists(path)) return(NULL)
  cd <- utils::read.csv(path, stringsAsFactors = FALSE)
  req <- c("case_id", "edge_id", "direction", "headline", "body",
           "exemplar", "question")
  if (!all(req %in% names(cd)))
    stop("feedback_cards.csv must have columns: ", paste(req, collapse = ", "))
  cd
}
CARDS <- load_cards()

## =====================================================================
## 6. INGESTION
##
## TIMELINE NOTE. click_events$t is ms from caseStart. transcript_segments
## $start_ms is ms from vStart, the moment the RTA replay video began.
## Because the replay runs straight through from the start of the case
## with no scrub or pause controls, video position equals case time, so
## the two streams share one clock. That equivalence is an ASSUMPTION
## worth stating in the methods - if replay controls are ever added, it
## breaks and the merge becomes invalid.
## =====================================================================

EMPTY_EVENTS <- data.frame(t_ms = numeric(0), code = character(0),
                           source = character(0), action = character(0),
                           detail = character(0), stringsAsFactors = FALSE)

as_df <- function(x) {
  if (is.null(x) || length(x) == 0) return(NULL)
  if (is.data.frame(x)) return(if (nrow(x)) x else NULL)
  out <- tryCatch(as.data.frame(x, stringsAsFactors = FALSE),
                  error = function(e) NULL)
  if (is.null(out) || nrow(out) == 0) NULL else out
}

## Split click_events into reasoning products (coded, network-bound) and
## navigation (uncoded, RQA-bound).
pull_products <- function(payload) {
  x <- as_df(payload$click_events)
  if (is.null(x) || !all(c("t", "action") %in% names(x))) return(EMPTY_EVENTS)

  act <- as.character(x$action)
  det <- if ("detail" %in% names(x)) as.character(x$detail)
         else rep(NA_character_, nrow(x))
  tms <- suppressWarnings(as.numeric(x$t))

  rows <- list()
  for (i in seq_along(act)) {
    a <- act[i]
    if (is.na(a) || a %in% NAV_ACTIONS) next
    spec <- ACTION_CODE_MAP[[a]]
    if (is.null(spec)) next

    cs <- character(0)
    if (!is.na(spec[1])) cs <- c(cs, spec[1])            # etic phase

    emic <- NA_character_
    if (a %in% EMIC_FROM_DETAIL) {
      hit <- regex_hits(det[i], emic_codes)
      if (length(hit)) emic <- hit[1]
    }
    if (is.na(emic) && !is.na(spec[2])) emic <- spec[2]  # fall back to default
    if (!is.na(emic)) cs <- c(cs, emic)

    if (!length(cs)) next
    rows[[length(rows) + 1]] <- data.frame(
      t_ms = rep(tms[i], length(cs)), code = cs, source = "product",
      action = a, detail = det[i], stringsAsFactors = FALSE)
  }
  if (!length(rows)) return(EMPTY_EVENTS)
  bind_rows(rows)
}

pull_verbal <- function(payload) {
  x <- as_df(payload$transcript_segments)
  if (is.null(x) || !all(c("start_ms", "text") %in% names(x)))
    return(EMPTY_EVENTS)
  txt <- as.character(x$text)
  tms <- suppressWarnings(as.numeric(x$start_ms))
  rows <- list()
  for (i in seq_along(txt)) {
    cs <- regex_hits(txt[i])
    if (!length(cs)) next
    rows[[length(rows) + 1]] <- data.frame(
      t_ms = rep(tms[i], length(cs)), code = cs, source = "verbal",
      action = NA_character_, detail = substr(txt[i], 1, 80),
      stringsAsFactors = FALSE)
  }
  if (!length(rows)) return(EMPTY_EVENTS)
  bind_rows(rows)
}

ingest <- function(payload) {
  prod <- pull_products(payload)
  verb <- pull_verbal(payload)
  net <- bind_rows(prod, verb)
  net <- net[net$code %in% codes & is.finite(net$t_ms), , drop = FALSE]
  net <- net[order(net$t_ms), , drop = FALSE]

  clicks <- as_df(payload$click_events)
  nav_n <- if (!is.null(clicks) && "action" %in% names(clicks))
    sum(as.character(clicks$action) %in% NAV_ACTIONS) else 0L

  list(events = net,
       n_product = nrow(prod), n_verbal = nrow(verb),
       n_click_total = if (is.null(clicks)) 0L else nrow(clicks),
       n_nav = nav_n,
       n_gaze = nrow(as_df(payload$gaze_events) %||% data.frame()),
       payload_case = payload$case_id %||% NA)
}

## =====================================================================
## 7. ACCUMULATION
##
## PRODUCTION SEAM. Replace accumulate_tona() with the verified tma call.
## I have not written tma API calls here because I have not verified the
## package's function signatures; invented arguments would fail silently.
##
## Contract:
##   in  : events data.frame(t_ms, code, source) sorted by t_ms
##         tif   list of frozen temporal-impact-function parameters
##   out : named numeric vector, length 21, names == all_edges$edge_id
##
## VALIDATION GATE: run one real Case 1 log through this and through
## desktop tma. Confirm the 21 values match element by element.
## =====================================================================

accumulate_tona <- function(events, tif) {
  stop("accumulate_tona() not implemented - wire to tma, then remove this stop().")
}

## Interim accumulation: symmetric co-occurrence in a fixed window.
## NOT TMA. Valid for pipeline testing and demonstration only.
INTERIM_WINDOW_MS <- 9000

accumulate_interim <- function(events, window_ms = INTERIM_WINDOW_MS) {
  w <- setNames(numeric(nrow(all_edges)), all_edges$edge_id)
  if (is.null(events) || nrow(events) < 2) return(w)
  tt <- events$t_ms; cc <- events$code
  for (i in seq_along(tt)) {
    j <- i - 1L
    while (j >= 1L && (tt[i] - tt[j]) <= window_ms) {
      if (cc[j] != cc[i]) {
        k <- edge_id(cc[j], cc[i]); w[[k]] <- w[[k]] + 1
      }
      j <- j - 1L
    }
  }
  w
}

## Sphere (L2) normalisation, across ALL 21 edges before any subsetting.
sphere_normalize <- function(v) {
  L <- sqrt(sum(v^2))
  if (!is.finite(L) || L == 0) return(v)
  v / L
}

## =====================================================================
## 8. PROXIMAL-ZONE SELECTION
## Largest CLOSABLE gap, not largest gap overall.
## =====================================================================

select_flagged_edges <- function(student_w, faculty_w,
                                 directions = FLAG_DIRECTIONS,
                                 eligible = ELIGIBLE_EDGES,
                                 max_n = MAX_FLAGGED_EDGES,
                                 cards = CARDS, case_id = CASE_ID) {
  if (is.null(faculty_w)) return(NULL)
  el <- all_edges
  if (identical(eligible, "cross")) el <- el[el$kind == "cross", ]

  d <- data.frame(edge_id = el$edge_id, from = el$from, to = el$to,
                  s = as.numeric(student_w[el$edge_id]),
                  f = as.numeric(faculty_w[el$edge_id]),
                  stringsAsFactors = FALSE)
  d$gap <- d$f - d$s
  d$direction <- ifelse(d$gap > 0, "under", "over")
  d <- d[d$direction %in% directions, , drop = FALSE]
  if (!nrow(d)) return(NULL)

  d$closable <- abs(d$gap) *
    (pmax(d$s, CLOSABILITY_FLOOR) ^ CLOSABILITY_EXPONENT)

  ## An edge is only eligible if a card with an exemplar exists for it.
  if (!is.null(cards)) {
    have <- cards$edge_id[cards$case_id == case_id &
                            cards$direction %in% directions]
    d <- d[d$edge_id %in% have, , drop = FALSE]
    if (!nrow(d)) return(NULL)
  }
  head(d[order(-d$closable), , drop = FALSE], max_n)
}

## =====================================================================
## 9. PLOT
## =====================================================================

build_edge_frame <- function(student_w, flagged_ids = character(0)) {
  ef <- all_edges
  ef$w <- as.numeric(student_w[ef$edge_id])
  denom <- switch(GRADIENT_SCALING,
                  relative = max(ef$w, na.rm = TRUE), absolute = 1,
                  max(ef$w, na.rm = TRUE))
  if (!is.finite(denom) || denom <= 0) denom <- 1
  ef$rel <- pmin(ef$w / denom, 1)
  ef <- merge(ef, setNames(node_pos, c("from", "x0", "y0")), by = "from")
  ef <- merge(ef, setNames(node_pos, c("to", "x1", "y1")), by = "to")
  ef$flagged <- ef$edge_id %in% flagged_ids
  ef$in_reduced <- if (identical(REDUCED_VIEW_RULE, "topn"))
    ef$edge_id %in% head(ef$edge_id[order(-ef$rel)], REDUCED_TOPN)
  else ef$rel >= REDUCED_THRESHOLD
  ef$in_reduced <- ef$in_reduced | ef$flagged
  ef
}

plot_network <- function(ef, show_all) {
  dat <- if (show_all) ef else ef[ef$in_reduced, , drop = FALSE]
  np <- node_pos
  np$label <- code_label[np$code]; np$gloss <- code_gloss[np$code]
  np$side <- ifelse(np$code %in% emic_codes, "emic", "etic")

  g <- ggplot() +
    geom_segment(data = dat[!dat$flagged, , drop = FALSE],
                 aes(x = x0, y = y0, xend = x1, yend = y1,
                     linewidth = rel, alpha = rel),
                 colour = "#888780", lineend = "round") +
    geom_segment(data = dat[dat$flagged, , drop = FALSE],
                 aes(x = x0, y = y0, xend = x1, yend = y1),
                 colour = "#7F77DD", linewidth = 2.2, lineend = "round") +
    scale_linewidth_continuous(range = c(0.4, 2.4), guide = "none") +
    scale_alpha_continuous(range = c(0.25, 0.95), guide = "none") +
    geom_point(data = np, aes(x = x, y = y, fill = side),
               shape = 21, size = 4, stroke = 0.6, colour = "#3D3D3A") +
    scale_fill_manual(values = c(emic = "#5DCAA5", etic = "#B4B2A9"),
                      guide = "none") +
    geom_text(data = np[np$side == "emic", ],
              aes(x = x - 0.045, y = y + 0.028, label = label),
              hjust = 1, size = 3.6, colour = "#085041") +
    geom_text(data = np[np$side == "emic", ],
              aes(x = x - 0.045, y = y - 0.028, label = gloss),
              hjust = 1, size = 3.1, colour = "#0F6E56") +
    geom_text(data = np[np$side == "etic", ],
              aes(x = x + 0.045, y = y + 0.028, label = label),
              hjust = 0, size = 3.6, colour = "#444441") +
    geom_text(data = np[np$side == "etic", ],
              aes(x = x + 0.045, y = y - 0.028, label = gloss),
              hjust = 0, size = 3.1, colour = "#5F5E5A") +
    annotate("text", x = -0.045, y = 1.02, hjust = 1, size = 3.2,
             colour = "#0F6E56", label = "Professional reasoning") +
    annotate("text", x = 1.045, y = 1.02, hjust = 0, size = 3.2,
             colour = "#5F5E5A", label = "Managing your own learning") +
    coord_cartesian(xlim = c(-0.62, 1.62), ylim = c(-0.02, 1.08)) +
    theme_void(base_size = 13)

  if (SHOW_SCALE_KEY) {
    key <- data.frame(x0 = c(-0.55, -0.42, -0.29), x1 = c(-0.45, -0.32, -0.19),
                      y = -0.005, rel = c(0.25, 0.6, 1))
    g <- g + geom_segment(data = key,
                          aes(x = x0, xend = x1, y = y, yend = y,
                              linewidth = rel, alpha = rel),
                          colour = "#888780", lineend = "round") +
      annotate("text", x = -0.15, y = -0.005, hjust = 0, size = 3,
               colour = "#5F5E5A",
               label = "came up less often \u2192 more often")
  }
  g
}

## =====================================================================
## 10. HANDOFF JS
## =====================================================================

idb_js <- sprintf("
async function getDataFromIDB(){return new Promise((resolve)=>{
 let req=indexedDB.open('%s',1);
 req.onsuccess=(e)=>{try{let db=e.target.result;
   let tx=db.transaction('%s','readonly');
   let g=tx.objectStore('%s').get('%s');
   g.onsuccess=()=>resolve(g.result?g.result.data:'NO_DATA');
   g.onerror=()=>resolve('ERROR');}catch(err){resolve('NO_DATA');}};
 req.onerror=()=>resolve('ERROR');});}
$(document).on('shiny:connected',async function(){
  Shiny.setInputValue('jspsych_data', await getDataFromIDB());
});
window.addEventListener('message',function(ev){
  if(ev.data && ev.data.type==='SESSION_DATA'){
    Shiny.setInputValue('jspsych_data',
      typeof ev.data.payload==='string'?ev.data.payload:JSON.stringify(ev.data.payload));
  }
});
Shiny.addCustomMessageHandler('dashboard_complete',function(m){
  try{ if(window.parent&&window.parent!==window)
    window.parent.postMessage({type:'DASHBOARD_COMPLETE',goal_text:m.goal_text},'*'); }catch(e){}
});", IDB_NAME, IDB_STORE, IDB_STORE, IDB_KEY)

## =====================================================================
## 11. UI
## =====================================================================

ui <- page_fluid(
  theme = bs_theme(version = 5, primary = "#16263d"),
  tags$head(tags$script(HTML(idb_js))),
  tags$style(HTML("
    body{background:#FAF9F5;}
    .wrap{max-width:820px;margin:0 auto;padding:24px 16px 48px;}
    .eyebrow{font-size:13px;color:#6E6D69;margin-bottom:4px;}
    h1.hd{font-size:20px;font-weight:500;color:#141413;margin:0 0 6px;}
    .sub{font-size:14px;color:#3D3D3A;line-height:1.6;margin:0 0 16px;}
    .panel{background:#fff;border:1px solid #E8E6DC;border-radius:12px;padding:16px;}
    .card2{background:#fff;border:1px solid #E8E6DC;border-radius:12px;padding:16px 20px;margin-top:20px;}
    .cardhd{font-size:15px;font-weight:500;color:#141413;margin:0 0 10px;}
    .swatch{display:inline-block;width:22px;height:4px;background:#7F77DD;border-radius:2px;margin-right:8px;vertical-align:middle;}
    .body2{font-size:14px;color:#3D3D3A;line-height:1.7;margin:0 0 12px;}
    .exwrap{background:#F5F4ED;border-radius:8px;padding:12px 14px;margin-bottom:12px;}
    .exlab{font-size:12px;color:#6E6D69;margin:0 0 6px;}
    .extxt{font-size:14px;color:#3D3D3A;line-height:1.7;font-style:italic;margin:0;}
    .qtxt{font-size:14px;color:#141413;line-height:1.7;margin:0;}
    .divider{border-top:1px solid #E8E6DC;margin:24px 0 20px;}
    .note{font-size:13px;color:#3D3D3A;line-height:1.6;margin:0 0 12px;}
    .warn{background:#FDECEA;border-left:4px solid #C0392B;padding:12px 16px;border-radius:6px;color:#922B21;font-size:14px;}
    .diag{background:#F5F4ED;border:1px solid #E8E6DC;border-radius:8px;padding:12px 14px;margin-top:28px;font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#3D3D3A;white-space:pre-wrap;}
  ")),
  div(class = "wrap",
      uiOutput("setup_warning"),
      div(class = "eyebrow", textOutput("case_line", inline = TRUE)),
      h1(class = "hd", "How reasoning unfolded in this case"),
      p(class = "sub", "Each line is a link between two kinds of thinking that came up close together. Thicker, darker lines came up more often."),
      div(style = "margin-bottom:12px;",
          radioButtons("view_mode", NULL,
                       choices = c("What this case leaned on most" = "reduced",
                                   "Show every connection" = "all"),
                       selected = "reduced", inline = TRUE)),
      p(class = "note", textOutput("view_note", inline = TRUE)),
      div(class = "panel", plotOutput("network", height = "380px")),
      uiOutput("flagged_cards"),
      div(class = "divider"),
      h1(class = "hd", "Before the next case"),
      p(class = "sub", "Name one thing you want to do differently as you work through it."),
      textAreaInput("goal_text", NULL, width = "100%", rows = 3,
                    placeholder = "In the next case, I want to\u2026"),
      div(style = "text-align:right;margin-top:12px;",
          actionButton("continue", "Continue to case 2", class = "btn-primary")),
      uiOutput("diagnostics")
  )
)

## =====================================================================
## 12. SERVER
## =====================================================================

server <- function(input, output, session) {

  output$case_line <- renderText(paste0("Case ", CASE_ID))

  raw_payload <- reactive({
    raw <- input$jspsych_data
    if (is.null(raw) || raw %in% c("NO_DATA", "ERROR")) return(NULL)
    tryCatch(fromJSON(raw, simplifyVector = TRUE), error = function(e) NULL)
  })

  demo_bundle <- reactive({
    if (!DEMO_MODE || !file.exists(DEMO_EVENTS_PATH)) return(NULL)
    ev <- utils::read.csv(DEMO_EVENTS_PATH, stringsAsFactors = FALSE)
    ev$action <- NA_character_; ev$detail <- NA_character_
    list(events = ev[ev$code %in% codes, , drop = FALSE],
         n_product = NA, n_verbal = NA, n_click_total = NA,
         n_nav = NA, n_gaze = NA, payload_case = CASE_ID)
  })

  bundle <- reactive({
    p <- raw_payload()
    if (is.null(p)) return(demo_bundle())
    ingest(p)
  })

  output$setup_warning <- renderUI({
    msgs <- c()
    if (is.null(FACULTY)) msgs <- c(msgs, "frozen faculty profile")
    if (is.null(CARDS))   msgs <- c(msgs, "feedback card table")
    if (!file.exists(TIF_PARAMS_PATH)) msgs <- c(msgs, "frozen TIF parameters")

    b <- bundle()
    notes <- c()
    if (is.null(b)) notes <- c(notes, "No session data received from the case.")
    else {
      if (nrow(b$events) == 0)
        notes <- c(notes, "Session data received, but no codeable events found.")
      if (!is.na(b$payload_case) && b$payload_case != CASE_ID)
        notes <- c(notes, sprintf("Payload is case %s but dashboard is set to case %s.",
                                  b$payload_case, CASE_ID))
    }
    if (DEMO_MODE) notes <- c(notes, "DEMO_MODE is on: synthetic events.")

    if (!length(msgs) && !length(notes)) return(NULL)
    div(class = "warn", style = "margin-bottom:16px;",
        strong("Not study-ready. "),
        if (length(msgs)) paste0("Placeholder or missing: ",
                                 paste(msgs, collapse = ", "), ". "),
        paste(notes, collapse = " "),
        " Accumulation is a fixed window, not the TMA temporal impact function.")
  })

  student_weights <- reactive({
    b <- bundle(); req(b)
    tif <- if (file.exists(TIF_PARAMS_PATH))
      tryCatch(fromJSON(TIF_PARAMS_PATH), error = function(e) NULL) else NULL
    w <- tryCatch(accumulate_tona(b$events, tif),
                  error = function(e) accumulate_interim(b$events))
    sphere_normalize(w)
  })

  flagged <- reactive(select_flagged_edges(student_weights(), FACULTY))

  edge_frame <- reactive({
    fl <- flagged()
    build_edge_frame(student_weights(),
                     if (is.null(fl)) character(0) else fl$edge_id)
  })

  output$view_note <- renderText({
    if (identical(input$view_mode, "all"))
      "Showing all 21 connections. Fainter, thinner lines came up less often in this case."
    else
      "Showing the connections that came up most often. This describes what happened in the case - it isn't a score."
  })

  output$network <- renderPlot(
    plot_network(edge_frame(), identical(input$view_mode, "all")))

  output$flagged_cards <- renderUI({
    fl <- flagged()
    if (is.null(fl) || !nrow(fl) || is.null(CARDS)) return(NULL)
    tagList(
      div(style = "margin-top:24px;", h1(class = "hd", "Worth a second look")),
      lapply(seq_len(nrow(fl)), function(i) {
        row <- CARDS[CARDS$case_id == CASE_ID &
                       CARDS$edge_id == fl$edge_id[i] &
                       CARDS$direction == fl$direction[i], ]
        if (nrow(row) == 0) return(NULL)
        row <- row[1, ]
        div(class = "card2",
            div(class = "cardhd", span(class = "swatch"), row$headline),
            p(class = "body2", row$body),
            div(class = "exwrap",
                p(class = "exlab", "How another clinician worked through this"),
                p(class = "extxt", row$exemplar)),
            p(class = "qtxt", row$question))
      })
    )
  })

  ## -------------------------------------------------------------------
  ## DIAGNOSTICS. Set SHOW_DIAGNOSTICS <- FALSE for real participants.
  ## -------------------------------------------------------------------
  output$diagnostics <- renderUI({
    if (!SHOW_DIAGNOSTICS) return(NULL)
    p <- raw_payload(); b <- bundle()
    L <- c("--- PAYLOAD ---")
    if (is.null(p)) L <- c(L, "no payload (IndexedDB empty or unreadable)")
    else {
      L <- c(L, paste("keys:", paste(names(p), collapse = ", ")),
             paste("case_id:", p$case_id %||% "(absent)"),
             paste("condition:", p$condition %||% "(absent)"))
    }
    L <- c(L, "", "--- STREAM ROUTING ---")
    if (is.null(b)) L <- c(L, "nothing ingested")
    else {
      L <- c(L,
        sprintf("  click_events total : %s", b$n_click_total),
        sprintf("  -> navigation (RQA): %s", b$n_nav),
        sprintf("  -> product (network): %s coded rows", b$n_product),
        sprintf("  transcript (network): %s coded rows", b$n_verbal),
        sprintf("  gaze (RQA only)    : %s", b$n_gaze),
        sprintf("  NETWORK EVENTS     : %d", nrow(b$events)))
      if (nrow(b$events)) {
        tb <- table(b$events$code)
        L <- c(L, paste0("  by code: ",
                         paste(names(tb), tb, sep = "=", collapse = ", ")))
        rng <- range(b$events$t_ms)
        L <- c(L, sprintf("  time range: %.0f - %.0f ms", rng[1], rng[2]))
      }
      if (!is.null(p)) {
        cl <- as_df(p$click_events)
        if (!is.null(cl) && "action" %in% names(cl)) {
          seen <- unique(as.character(cl$action))
          unk <- setdiff(seen, c(names(ACTION_CODE_MAP), NAV_ACTIONS))
          if (length(unk))
            L <- c(L, "", "!! UNCLASSIFIED ACTIONS (add to ACTION_CODE_MAP or NAV_ACTIONS):",
                   paste0("  ", paste(unk, collapse = ", ")))
        }
      }
    }
    L <- c(L, "", "--- WEIGHTS ---")
    w <- tryCatch(student_weights(), error = function(e) NULL)
    if (!is.null(w)) {
      top <- sort(w, decreasing = TRUE)[1:6]
      L <- c(L, sprintf("  L2 = %.6f (must be 1.0 or 0)", sqrt(sum(w^2))),
             paste0("  top: ", paste(names(top), round(top, 3),
                                     sep = "=", collapse = ", ")))
    }
    fl <- tryCatch(flagged(), error = function(e) NULL)
    L <- c(L, if (is.null(fl) || !nrow(fl)) "  flagged: none"
           else paste0("  flagged: ", paste(fl$edge_id, collapse = ", ")))
    div(class = "diag", paste(L, collapse = "\n"))
  })

  ## Diagnostic logging only. Toggle use and dwell are engagement traces,
  ## NOT dependent variables. Time is a post-randomisation collider.
  observeEvent(input$view_mode, {
    message(sprintf("[log] view_mode=%s t=%s", input$view_mode, Sys.time()))
  }, ignoreInit = TRUE)

  observeEvent(input$continue, {
    message(sprintf("[log] continue goal_chars=%d t=%s",
                    nchar(input$goal_text %||% ""), Sys.time()))
    session$sendCustomMessage("dashboard_complete",
                              list(goal_text = input$goal_text %||% ""))
  })
}

shinyApp(ui, server)
