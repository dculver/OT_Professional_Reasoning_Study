#!/usr/bin/env Rscript
# =============================================================================
# merge_logs_for_ncoder.R
#
# Combines the per-participant JSON session logs (schema "ot_prof_reasoning_v1")
# exported by the OT professional-reasoning instrument into one tidy, long-format
# dataset ready for nCoder code development and, afterward, rENA/ONA.
#
# Design (agreed with D. Culver):
#   * Stream 1 is EVENT-CENTRIC: one row per event_log entry, in task-time order.
#     Text-bearing events carry their typed text (occupation name, classify
#     mechanism, desired-outcome text, impression revision, plan free-text).
#     No-text moves (tab_switch, entry_remove, barrier_select, occupation_remove,
#     desired_outcome_remove, desired_outcome_tag) are kept as structural rows
#     with empty text (they matter to the ONA timeline but aren't text-coded).
#   * Stream 2 is the re-anchored RTA think-aloud, on the SAME case-relative
#     millisecond clock, so spoken and typed reasoning interleave in task order.
#   * The clinical impression (every settled revision) and the plan free-text
#     are split into sentences -- one coded line per sentence. Everything else is
#     one line per event. RTA uses Whisper's phrase-level chunks as-is.
#   * The practice case (analyzed = false) is excluded automatically.
#
# Outputs (to OUT_DIR):
#   ona_events_full.csv  -- every row (both streams incl. no-text moves); ONA/rENA
#   ncoder_corpus.csv    -- only rows with text; import THIS into nCoder
#   qa_summary.csv       -- per participant x case counts; flags empty RTA
#                           (a case with 0 utterances = failed/blocked transcription)
#
# Dependencies: R (>= 4.0) and the 'jsonlite' package. Nothing else.
#   install.packages("jsonlite")
# =============================================================================

suppressWarnings(suppressMessages({
  if (!requireNamespace("jsonlite", quietly = TRUE))
    stop("Please install the 'jsonlite' package:  install.packages('jsonlite')")
}))

# ----------------------------- CONFIG ---------------------------------------
# Folder holding the downloaded participant .json logs, and where to write output.
# Edit these two paths, or pass them as:  Rscript merge_logs_for_ncoder.R <in> <out>
args    <- commandArgs(trailingOnly = TRUE)
IN_DIR  <- if (length(args) >= 1) args[[1]] else "sample_logs"
OUT_DIR <- if (length(args) >= 2) args[[2]] else "out"
dir.create(OUT_DIR, showWarnings = FALSE, recursive = TRUE)

`%||%` <- function(a, b) if (is.null(a)) b else a

# ---- sentence splitter (base R; protects common abbreviations) -------------
# Swap in tokenizers::tokenize_sentences(x)[[1]] here if you prefer that library.
split_sentences <- function(x) {
  if (is.null(x) || is.na(x)) return(character(0))
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

# column order for the output files
COLS <- c("participant_id","group","year_in_program","case_id","case_name","line_index",
          "time_ms","session_offset_ms","stream","kind","has_text","segment_index",
          "text","occupation","source","excerpt","aspect","otpf_type","barrier_on","paused")

# make one row (named list) with every column present
mk_row <- function(pid, group, year, cid, cname, time_ms, session_off, stream, kind,
                   text, seg, occupation=NA, source=NA, excerpt=NA, aspect=NA,
                   otpf_type=NA, barrier_on=NA, paused=NA) {
  has <- !is.null(text) && !is.na(text) && nzchar(trimws(as.character(text)))
  list(participant_id=pid, group=group, year_in_program=year, case_id=cid, case_name=cname,
       line_index=NA_integer_, time_ms=time_ms, session_offset_ms=session_off,
       stream=stream, kind=kind, has_text=has, segment_index=seg,
       text=(if (is.null(text) || is.na(text)) "" else as.character(text)),
       occupation=occupation, source=source, excerpt=excerpt, aspect=aspect,
       otpf_type=otpf_type, barrier_on=barrier_on, paused=paused)
}

NO_TEXT <- c("occupation_remove","entry_remove","barrier_select",
             "desired_outcome_remove","desired_outcome_tag","tab_switch")

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

    # impression revision text lookup: version -> text
    imp_rev <- list()
    for (r in (task$synthesis$impression_revisions %||% list()))
      imp_rev[[as.character(r$version)]] <- r$text
    plan   <- task$intervention_plan %||% list()
    events <- task$event_log %||% list()

    # last plan_edit index per (scope|barrier_id|field)
    plan_last <- list()
    for (i in seq_along(events)) {
      e <- events[[i]]
      if (identical(e$kind, "plan_edit")) {
        d <- e$detail %||% list()
        key <- paste(d$scope %||% "", d$barrier_id %||% "", d$field %||% "", sep = "|")
        plan_last[[key]] <- i
      }
    }

    case_rows <- list(); srt_t <- c(); srt_s <- c(); srt_o <- c()
    add <- function(row, t, sflag, ord) {
      case_rows[[length(case_rows)+1]] <<- row
      srt_t <<- c(srt_t, if (is.null(t)) 0 else t)
      srt_s <<- c(srt_s, sflag); srt_o <<- c(srt_o, ord)
    }

    for (i in seq_along(events)) {
      e <- events[[i]]; k <- e$kind; d <- e$detail %||% list(); t <- e$t
      text <- NULL; segmentable <- FALSE
      occ  <- d$occupation %||% NA; src <- d$source %||% NA; exc <- d$excerpt %||% NA
      asp  <- d$aspect %||% NA;     otype <- d$type %||% NA
      bon  <- if (identical(k, "barrier_select")) (d$on %||% NA) else NA

      # Occupation is a CODED reasoning line now: the description is the coded text
      # (sentence-split), the short name rides along in the occupation column.
      if (identical(k, "occupation_add"))        { text <- d$description %||% d$name; segmentable <- TRUE; occ <- d$name %||% occ }
      else if (identical(k, "classify"))         text <- d$mechanism
      else if (identical(k, "desired_outcome_add")) text <- d$text
      else if (identical(k, "synthesis_revision")) { text <- imp_rev[[as.character(d$version)]]; segmentable <- TRUE }
      else if (identical(k, "plan_edit")) {
        key <- paste(d$scope %||% "", d$barrier_id %||% "", d$field %||% "", sep = "|")
        if (!identical(plan_last[[key]], i)) next          # skip intermediate edits
        if (identical(d$scope, "barrier") || !is.null(d$barrier_id)) {
          text <- (plan$perBarrier[[d$barrier_id]] %||% list())[[d$field]]
        } else text <- plan[[d$field]]
        segmentable <- TRUE
      }
      # else: no-text kinds keep text = NULL

      if (segmentable && !is.null(text) && nzchar(trimws(as.character(text)))) {
        sents <- split_sentences(text)
        for (si in seq_along(sents))
          add(mk_row(pid,group,year,cid,cname,t,(offset+t),"action",k,sents[[si]],si,
                     occ,src,exc,asp,otype,bon,NA), t, 0L, i)
      } else {
        add(mk_row(pid,group,year,cid,cname,t,(if(is.null(t)) NA else offset+t),"action",k,text,1L,
                   occ,src,exc,asp,otype,bon,NA), t, 0L, i)
      }
    }

    # RTA stream
    rta <- case$rta %||% list()
    for (j in seq_along(rta)) {
      u <- rta[[j]]; t <- u$case_relative_t
      add(mk_row(pid,group,year,cid,cname,t,u$session_offset_t %||% NA,"rta","rta_utterance",
                 u$text,1L, NA,NA,NA,NA,NA,NA,(u$paused %||% NA)),
          t, 1L, 10000L + j)
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
  all_rows <- c(all_rows, parse_session(doc, f))
}
if (!length(all_rows)) stop("No analyzed cases found in any file.")

# list-of-rows -> data.frame
to_df <- function(rows) {
  df <- data.frame(matrix(NA, nrow = length(rows), ncol = length(COLS)),
                   stringsAsFactors = FALSE)
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

# QA: per participant x case; flag cases with no RTA (transcription likely failed)
qa <- do.call(rbind, lapply(split(full, list(full$participant_id, full$case_id), drop = TRUE), function(g) {
  data.frame(participant_id = g$participant_id[1], case_id = g$case_id[1],
             n_action_rows = sum(g$stream == "action"),
             n_action_text = sum(g$stream == "action" & g$has_text == "True"),
             n_rta = sum(g$stream == "rta"),
             rta_empty_FLAG = (sum(g$stream == "rta") == 0),
             stringsAsFactors = FALSE)
}))
qa <- qa[order(qa$participant_id, qa$case_id), ]

write.csv(full,   file.path(OUT_DIR, "ona_events_full.csv"), row.names = FALSE, na = "")
write.csv(corpus, file.path(OUT_DIR, "ncoder_corpus.csv"),   row.names = FALSE, na = "")
write.csv(qa,     file.path(OUT_DIR, "qa_summary.csv"),       row.names = FALSE, na = "")

cat(sprintf("Parsed %d file(s).  Total rows: %d   Coded corpus (has text): %d\n",
            length(files), nrow(full), nrow(corpus)))
cat("Wrote: ona_events_full.csv, ncoder_corpus.csv, qa_summary.csv  ->  ", OUT_DIR, "\n\n")
cat("QA summary (watch rta_empty_FLAG = TRUE -> that participant's think-aloud did not transcribe):\n")
print(qa, row.names = FALSE)
