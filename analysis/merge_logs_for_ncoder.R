#!/usr/bin/env Rscript
# =============================================================================
# merge_logs_for_ncoder.R
#
# Combines the per-participant JSON session logs exported by the OT
# professional-reasoning instrument (schema "ot_prof_reasoning_v2"; v1 files are
# still read) into one tidy, long-format dataset ready for nCoder code
# development and, afterward, rENA/ONA.
#
# Design (agreed with D. Culver):
#   * Stream 1 is EVENT-CENTRIC: one row per event_log entry, in task-time order.
#     Text-bearing events carry their typed text (occupation description, classify
#     mechanism, desired-outcome text, impression text, plan free-text).
#     No-text moves (tab_switch, entry_remove, barrier_select, occupation_remove,
#     desired_outcome_remove, session_resumed) are kept as structural rows with
#     empty text (they matter to the ONA timeline but aren't text-coded).
#   * Stream 2 is the think-aloud narration on the SAME case-relative clock. In v2
#     each line sits at the think-aloud item it narrates (the action, or the start
#     of a pause), so it sorts right after that action.
#   * IMPRESSION (changed 2026-11-11, approved): one coded unit per EDITING RUN,
#     containing only the sentences that run ADDED or CHANGED relative to the
#     previous run. Before, every settled revision was coded in full, so unchanged
#     sentences were re-coded each time the participant paused while typing (a
#     typing-speed artifact). Mid-typing snapshots inside a run are dropped. In v2
#     a run is exactly one think-aloud item; in v1, consecutive revisions with no
#     other event between them.
#   * PLAN text: PLAN_MODE = "final" (default, unchanged): each field once, final
#     text, at its last edit. "delta": same editing-run rule as the impression.
#   * LINE_MODE = "sentence" (default, unchanged): prose split into sentences, RTA
#     one line per Whisper chunk. "event": one line per event / per recording.
#   * Every line carries event_index and (v2) item_id, so the same output can be
#     re-aggregated by event or by think-aloud item.
#   * The practice case (analyzed = false) is excluded automatically.
#
# Outputs (to OUT_DIR):
#   ona_events_full.csv  -- every row (both streams incl. no-text moves); ONA/rENA
#   ncoder_corpus.csv    -- only rows with text; import THIS into nCoder
#   qa_summary.csv       -- per participant x case counts and flags
#
# Usage:  Rscript merge_logs_for_ncoder.R <in_dir> <out_dir> [sentence|event] [final|delta]
# Dependencies: R (>= 4.0) and the 'jsonlite' package.   install.packages("jsonlite")
# =============================================================================

suppressWarnings(suppressMessages({
  if (!requireNamespace("jsonlite", quietly = TRUE))
    stop("Please install the 'jsonlite' package:  install.packages('jsonlite')")
}))

# ----------------------------- CONFIG ---------------------------------------
options(scipen = 999)   # write 100000, never 1e+05, in the CSVs
args      <- commandArgs(trailingOnly = TRUE)
IN_DIR    <- if (length(args) >= 1) args[[1]] else "sample_logs"
OUT_DIR   <- if (length(args) >= 2) args[[2]] else "out"
LINE_MODE <- if (length(args) >= 3) args[[3]] else "sentence"   # "sentence" | "event"
PLAN_MODE <- if (length(args) >= 4) args[[4]] else "final"      # "final"    | "delta"
stopifnot(LINE_MODE %in% c("sentence", "event"), PLAN_MODE %in% c("final", "delta"))
dir.create(OUT_DIR, showWarnings = FALSE, recursive = TRUE)

`%||%` <- function(a, b) if (is.null(a)) b else a

# ---- sentence splitter (base R; protects common abbreviations) -------------
split_sentences <- function(x) {
  if (is.null(x) || length(x) == 0 || is.na(x)) return(character(0))
  s <- trimws(as.character(x))
  if (!nzchar(s)) return(character(0))
  abbr <- c("Dr","Mr","Mrs","Ms","e.g","i.e","vs","etc","Inc","Ltd","approx","Fig","No","St")
  for (a in abbr) {
    esc <- gsub("\\.", "\\\\.", a)
    s <- gsub(paste0("\\b", esc, "\\."), paste0(a, "<DOT>"), s, perl = TRUE)
  }
  parts <- strsplit(s, "(?<=[.!?])\\s+(?=[\"'A-Z0-9])", perl = TRUE)[[1]]
  parts <- trimws(gsub("<DOT>", ".", parts))
  parts[nzchar(parts)]
}

# Sentences in `curr` that are not in `prev` (multiset difference, order kept).
# An edited sentence counts as new; an unchanged one is not coded again.
sentence_delta <- function(curr, prev) {
  new_s <- split_sentences(curr); old_s <- split_sentences(prev)
  cnt <- list()
  for (s in old_s) cnt[[s]] <- (if (is.null(cnt[[s]])) 0L else cnt[[s]]) + 1L
  out <- character(0)
  for (s in new_s) {
    k <- if (is.null(cnt[[s]])) 0L else cnt[[s]]
    if (k > 0L) cnt[[s]] <- k - 1L else out <- c(out, s)
  }
  out
}

# column order for the output files (new columns appended at the end)
COLS <- c("participant_id","group","year_in_program","case_id","case_name","line_index",
          "time_ms","session_offset_ms","stream","kind","has_text","segment_index",
          "text","occupation","source","excerpt","aspect","otpf_type","barrier_on","paused",
          "event_index","item_id","item_kind","rec_id","chunk_index","run_events","removed_sentences")

mk_row <- function(pid, group, year, cid, cname, time_ms, session_off, stream, kind,
                   text, seg, occupation=NA, source=NA, excerpt=NA, aspect=NA,
                   otpf_type=NA, barrier_on=NA, paused=NA, event_index=NA, item_id=NA,
                   item_kind=NA, rec_id=NA, chunk_index=NA, run_events=NA, removed_sentences=NA) {
  has <- !is.null(text) && length(text) == 1 && !is.na(text) && nzchar(trimws(as.character(text)))
  list(participant_id=pid, group=group, year_in_program=year, case_id=cid, case_name=cname,
       line_index=NA_integer_, time_ms=time_ms, session_offset_ms=session_off,
       stream=stream, kind=kind, has_text=has, segment_index=seg,
       text=(if (!has) "" else as.character(text)),
       occupation=occupation, source=source, excerpt=excerpt, aspect=aspect,
       otpf_type=otpf_type, barrier_on=barrier_on, paused=paused,
       event_index=event_index, item_id=item_id, item_kind=item_kind, rec_id=rec_id,
       chunk_index=chunk_index, run_events=run_events, removed_sentences=removed_sentences)
}

QA_EXTRA <- new.env()   # per participant|case transcription counts (v2)

parse_session <- function(doc, source_file) {
  pid  <- doc$study_id %||% tools::file_path_sans_ext(basename(source_file))
  sess <- doc$session %||% list()
  group <- sess$group %||% NA
  year  <- sess$year_in_program %||% NA
  out_rows <- list()

  for (case in (doc$cases %||% list())) {
    if (!isTRUE(case$analyzed)) next
    cid    <- case$case_id %||% NA
    cname  <- case$case_name %||% NA
    offset <- case$case_started_offset_ms %||% 0
    task   <- case$task %||% list()
    events <- task$event_log %||% list()
    plan   <- task$intervention_plan %||% list()
    items  <- case$rta_items %||% list()
    n_ev   <- length(events)
    # PLAN_MODE "delta" needs plan_revision events (v2); v1 logs fall back to "final".
    has_plan_rev <- any(vapply(events, function(e) identical(e$kind, "plan_revision"), logical(1)))
    plan_mode <- if (identical(PLAN_MODE, "delta") && has_plan_rev) "delta" else "final"

    # ---- think-aloud item covering each event (v2; event_indices are 0-based) ----
    ev_item <- rep(NA_character_, n_ev)
    for (it in items) {
      idx <- unlist((it$action %||% list())$event_indices %||% list())
      for (j in idx) if (!is.na(j) && (j + 1) <= n_ev) ev_item[j + 1] <- it$item_id
    }

    # ---- QA: transcription outcomes (v2) ----
    ts <- case$rta_transcription_summary
    if (!is.null(ts)) {
      bs <- ts$by_status %||% list()
      ok <- c("done","empty","not_transcribed_practice","not_transcribed_silent")
      lost <- sum(unlist(bs[setdiff(names(bs), ok)]) %||% 0)
      assign(paste(pid, cid, sep = "|"), list(n_rec = ts$n_recordings %||% 0, lost = lost), envir = QA_EXTRA)
    }

    # ---- revision text lookups ----
    imp_rev <- list()
    for (r in (task$synthesis$impression_revisions %||% list())) imp_rev[[as.character(r$version)]] <- r$text
    plan_rev <- list()
    for (r in (plan$revisions %||% list())) plan_rev[[as.character(r$version)]] <- r$text

    # ---- editing runs: impression ("imp") and plan fields ("plan|scope|field|bid") ----
    # A run = consecutive revisions of one field with no other (non-tab) event
    # between them; in v2 the think-aloud item defines the run when present.
    run_key <- rep(NA_character_, n_ev); run_last <- list(); run_n <- list()
    cur_key <- NULL; seq_n <- 0L
    for (i in seq_len(n_ev)) {
      e <- events[[i]]; k <- e$kind; d <- e$detail %||% list()
      if (identical(k, "tab_switch")) next
      fld <- NULL
      if (identical(k, "synthesis_revision")) fld <- "imp"
      else if (identical(k, "plan_revision") && identical(plan_mode, "delta"))
        fld <- paste("plan", d$scope %||% "", d$field %||% "", d$barrier_id %||% "", sep = "|")
      if (is.null(fld)) { cur_key <- NULL; next }
      base <- if (!is.na(ev_item[i])) paste0(fld, "#item:", ev_item[i]) else NULL
      if (is.null(base)) {
        if (is.null(cur_key) || !startsWith(cur_key, paste0(fld, "#"))) { seq_n <- seq_n + 1L; base <- paste0(fld, "#run", seq_n) }
        else base <- cur_key
      }
      run_key[i] <- base; cur_key <- base
      run_last[[base]] <- i; run_n[[base]] <- (run_n[[base]] %||% 0L) + 1L
    }

    # last plan_edit per field (PLAN_MODE "final")
    plan_last <- list()
    for (i in seq_len(n_ev)) {
      e <- events[[i]]
      if (identical(e$kind, "plan_edit")) {
        d <- e$detail %||% list()
        plan_last[[paste(d$scope %||% "", d$barrier_id %||% "", d$field %||% "", sep = "|")]] <- i
      }
    }

    case_rows <- list(); srt_t <- c(); srt_s <- c(); srt_o <- c()
    add <- function(row, t, sflag, ord) {
      case_rows[[length(case_rows)+1]] <<- row
      srt_t <<- c(srt_t, if (is.null(t)) 0 else t)
      srt_s <<- c(srt_s, sflag); srt_o <<- c(srt_o, ord)
    }
    # `segments`: pre-split sentences (editing-run deltas). Passing them through
    # avoids re-splitting a joined delta, which would glue an unpunctuated fragment
    # onto the next sentence.
    emit <- function(i, t, k, text, segmentable, occ, src, exc, asp, otype, bon, run_events = NA, removed = NA, segments = NULL) {
      off <- if (is.null(t)) NA else offset + t
      itm <- ev_item[i]; ikind <- if (is.na(itm)) NA else "action"
      if (!is.null(segments) && identical(LINE_MODE, "sentence") && length(segments)) {
        for (si in seq_along(segments))
          add(mk_row(pid,group,year,cid,cname,t,off,"action",k,segments[[si]],si,occ,src,exc,asp,otype,bon,NA,
                     i,itm,ikind,NA,NA,run_events,removed), t, 0L, i)
      } else if (segmentable && identical(LINE_MODE, "sentence") && length(text) == 1 && !is.na(text) && nzchar(trimws(text))) {
        sents <- split_sentences(text)
        for (si in seq_along(sents))
          add(mk_row(pid,group,year,cid,cname,t,off,"action",k,sents[[si]],si,occ,src,exc,asp,otype,bon,NA,
                     i,itm,ikind,NA,NA,run_events,removed), t, 0L, i)
      } else {
        add(mk_row(pid,group,year,cid,cname,t,off,"action",k,text,1L,occ,src,exc,asp,otype,bon,NA,
                   i,itm,ikind,NA,NA,run_events,removed), t, 0L, i)
      }
    }

    prev_text <- list()   # field key -> text at the end of its previous run
    for (i in seq_len(n_ev)) {
      e <- events[[i]]; k <- e$kind; d <- e$detail %||% list(); t <- e$t
      occ  <- d$occupation %||% NA; src <- d$source %||% NA; exc <- d$excerpt %||% NA
      asp  <- d$aspect %||% NA;     otype <- d$type %||% NA
      bon  <- if (identical(k, "barrier_select")) (d$on %||% NA) else NA

      if (identical(k, "occupation_add")) {
        # Occupation is a CODED reasoning line: description is the coded text.
        emit(i, t, k, d$description %||% d$name, TRUE, d$name %||% occ, src, exc, asp, otype, bon)
      } else if (identical(k, "classify")) {
        emit(i, t, k, d$mechanism, FALSE, occ, src, exc, asp, otype, bon)
      } else if (identical(k, "desired_outcome_add")) {
        emit(i, t, k, d$text, FALSE, occ, src, exc, asp, otype, bon)
      } else if (k %in% c("synthesis_revision", "plan_revision") && !is.na(run_key[i])) {
        key <- run_key[i]
        if (!identical(run_last[[key]], i)) next            # mid-run snapshot: dropped
        fld  <- sub("#.*$", "", key)
        ver  <- as.character(d$version %||% "")             # guard: a missing version must not error
        curr <- if (!nzchar(ver)) NULL else if (identical(k, "synthesis_revision")) imp_rev[[ver]] else plan_rev[[ver]]
        curr <- curr %||% ""
        prev <- prev_text[[fld]] %||% ""
        delta   <- sentence_delta(curr, prev)
        removed <- length(sentence_delta(prev, curr))
        prev_text[[fld]] <- curr
        txt <- if (length(delta)) paste(delta, collapse = " ") else NA
        emit(i, t, k, txt, TRUE, occ, src, exc, asp, otype, bon, run_n[[key]], removed, segments = delta)
      } else if (identical(k, "plan_revision")) {
        next                                                 # PLAN_MODE "final": text comes from plan_edit
      } else if (identical(k, "plan_edit")) {
        if (identical(plan_mode, "delta")) next              # text comes from plan_revision runs
        key <- paste(d$scope %||% "", d$barrier_id %||% "", d$field %||% "", sep = "|")
        if (!identical(plan_last[[key]], i)) next            # only the last edit per field
        txt <- if (identical(d$scope, "barrier") || !is.null(d$barrier_id))
                 (plan$perBarrier[[d$barrier_id]] %||% list())[[d$field]] else plan[[d$field]]
        emit(i, t, k, txt %||% NA, TRUE, occ, src, exc, asp, otype, bon)
      } else {
        emit(i, t, k, NA, FALSE, occ, src, exc, asp, otype, bon)   # no-text structural move
      }
    }

    # ---- Stream 2: think-aloud ----
    rta <- case$rta %||% list()
    if (identical(LINE_MODE, "event") && length(rta) && !is.null(rta[[1]]$rec_id)) {
      recs <- unique(vapply(rta, function(u) u$rec_id %||% "", ""))
      for (rj in seq_along(recs)) {
        us <- Filter(function(u) identical(u$rec_id %||% "", recs[[rj]]), rta)
        u1 <- us[[1]]; t <- u1$case_relative_t
        txt <- paste(trimws(vapply(us, function(u) u$text %||% "", "")), collapse = " ")
        add(mk_row(pid,group,year,cid,cname,t,u1$session_offset_t %||% NA,"rta","rta_utterance",txt,1L,
                   NA,NA,NA,NA,NA,NA,(u1$paused %||% NA),NA,u1$item_id %||% NA,u1$item_kind %||% NA,
                   recs[[rj]],NA,NA,NA), t, 1L, 10000L + rj)
      }
    } else {
      for (j in seq_along(rta)) {
        u <- rta[[j]]; t <- u$case_relative_t
        add(mk_row(pid,group,year,cid,cname,t,u$session_offset_t %||% NA,"rta","rta_utterance",
                   u$text,1L,NA,NA,NA,NA,NA,NA,(u$paused %||% NA),NA,u$item_id %||% NA,u$item_kind %||% NA,
                   u$rec_id %||% NA,u$chunk_index %||% NA,NA,NA), t, 1L, 10000L + j)
      }
    }

    if (length(case_rows)) {
      ord <- order(srt_t, srt_s, srt_o)
      case_rows <- case_rows[ord]
      for (idx in seq_along(case_rows)) case_rows[[idx]]$line_index <- idx
      out_rows <- c(out_rows, case_rows)
    }
  }
  out_rows
}

# ----------------------------- run over the folder --------------------------
files <- list.files(IN_DIR, pattern = "\\.json$", full.names = TRUE)
if (!length(files)) stop(sprintf("No .json files found in '%s'.", IN_DIR))

all_rows <- list()
for (f in files) {
  doc <- tryCatch(jsonlite::read_json(f, simplifyVector = FALSE), error = function(e) NULL)
  if (is.null(doc)) { warning(sprintf("Skipping unreadable JSON: %s", f)); next }
  if (identical(doc$export_kind, "checkpoint") || identical(doc$export_kind, "dev"))
    warning(sprintf("%s is a %s file, not a final file; parsing it anyway.", basename(f), doc$export_kind))
  all_rows <- c(all_rows, parse_session(doc, f))
}
if (!length(all_rows)) stop("No analyzed cases found in any file.")

to_df <- function(rows) {
  df <- data.frame(matrix(NA, nrow = length(rows), ncol = length(COLS)), stringsAsFactors = FALSE)
  names(df) <- COLS
  for (i in seq_along(rows)) for (c in COLS) {
    v <- rows[[i]][[c]]
    df[i, c] <- if (is.null(v) || length(v) == 0) NA else v
  }
  df
}
full <- to_df(all_rows)

# Python-style booleans so the file diffs cleanly against the reference output
py_bool <- function(x) ifelse(is.na(x), "", ifelse(as.logical(x), "True", "False"))
full$has_text   <- py_bool(full$has_text)
full$barrier_on <- py_bool(full$barrier_on)
full$paused     <- py_bool(full$paused)

corpus <- full[full$has_text == "True", , drop = FALSE]

# QA: per participant x case.  rta_empty_FLAG = no think-aloud lines at all;
# rta_not_transcribed = v2 recordings whose transcription failed/timed out/was lost.
qa <- do.call(rbind, lapply(split(full, list(full$participant_id, full$case_id), drop = TRUE), function(g) {
  x <- get0(paste(g$participant_id[1], g$case_id[1], sep = "|"), envir = QA_EXTRA, inherits = FALSE)
  data.frame(participant_id = g$participant_id[1], case_id = g$case_id[1],
             n_action_rows = sum(g$stream == "action"),
             n_action_text = sum(g$stream == "action" & g$has_text == "True"),
             n_rta = sum(g$stream == "rta"),
             rta_empty_FLAG = (sum(g$stream == "rta") == 0),
             n_rta_recordings = if (is.null(x)) NA else x$n_rec,
             rta_not_transcribed = if (is.null(x)) NA else x$lost,
             stringsAsFactors = FALSE)
}))
qa <- qa[order(qa$participant_id, qa$case_id), ]
qa$rta_empty_FLAG <- py_bool(qa$rta_empty_FLAG)

write.csv(full,   file.path(OUT_DIR, "ona_events_full.csv"), row.names = FALSE, na = "")
write.csv(corpus, file.path(OUT_DIR, "ncoder_corpus.csv"),   row.names = FALSE, na = "")
write.csv(qa,     file.path(OUT_DIR, "qa_summary.csv"),       row.names = FALSE, na = "")

cat(sprintf("Parsed %d file(s).  LINE_MODE=%s  PLAN_MODE=%s  Total rows: %d   Coded corpus (has text): %d\n",
            length(files), LINE_MODE, PLAN_MODE, nrow(full), nrow(corpus)))
cat("Wrote: ona_events_full.csv, ncoder_corpus.csv, qa_summary.csv  ->  ", OUT_DIR, "\n\n")
cat("QA summary (rta_empty_FLAG = TRUE or rta_not_transcribed > 0 -> think-aloud data missing):\n")
print(qa, row.names = FALSE)
