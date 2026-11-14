# tma window probe v2 (2026-11-14)
# Follows probe v1 (which showed tma can count windows in items when the item number is
# given as its time column). v2 tests, inside tma:
#   A. presence counting (a code counts once per window) vs tma's default (counts add up)
#   B. two codes in the SAME line: do they connect?
#   C. weighting each item equally, so how much someone talks does not change the network
#   D. a different window for each stream (actions reach further back than talk)
# Every tma result is compared with a hand-computed answer for the same rule.
# Nothing here touches study data, and nothing here is a decision.
#
# Run from the repo root in R or RStudio:
#   setwd("~/Documents/GitHub/proof-of-concept")
#   source("analysis/tma_window_probe_v2.R")
# Output: analysis/tma_probe_out/log_v2.txt (and tma_source_v2.txt)

out_dir <- file.path("analysis", "tma_probe_out")
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)
log_file <- file.path(out_dir, "log_v2.txt"); cat("", file = log_file)
say <- function(...) { txt <- paste0(...); cat(txt, "\n"); cat(txt, "\n", file = log_file, append = TRUE) }
dumpx <- function(obj, title) {
  say("----- ", title, " -----")
  txt <- tryCatch(capture.output(print(obj)), error = function(e) paste("ERROR:", conditionMessage(e)))
  cat(txt, sep = "\n", file = log_file, append = TRUE); cat(txt, sep = "\n")
}
say("R: ", R.version.string, " | run: ", format(Sys.time()))
suppressPackageStartupMessages(library(tma))
say("tma version: ", as.character(packageVersion("tma")))
ns <- asNamespace("tma")
tget <- function(name) if (exists(name, envir = ns, inherits = FALSE)) get(name, envir = ns) else NULL

src_file <- file.path(out_dir, "tma_source_v2.txt"); cat("", file = src_file)
for (fn in c("ground_response_crossprod", "list_vec_apply", "colSums.ena.matrix", "_sphere_norm")) {
  f <- tget(fn); cat("\n=================== ", fn, " ===================\n", file = src_file, append = TRUE)
  cat(if (is.null(f)) "(not found)" else capture.output(print(f)), sep = "\n", file = src_file, append = TRUE)
}

# ---- test data --------------------------------------------------------------------------
# P1: 1 talk line per item. P2: 5 talk lines per item. Same 4 actions (Act1..Act4).
# P3: like P1, but the item-2 action line also carries Mech, and the item-3 talk line
#     carries Talk + Mech (two codes in one line).
codes <- c("Act1", "Act2", "Act3", "Act4", "Mech", "Talk")
row_of <- function(pid, k, stream, set) {
  v <- setNames(as.list(rep(0, length(codes))), codes); for (s in set) v[[s]] <- 1
  data.frame(participant_id = pid, case_id = 1, item_ordinal = k, stream = stream, v, stringsAsFactors = FALSE)
}
make_participant <- function(pid, talk_per_item, extra = list()) {
  rows <- list()
  for (k in 1:4) {
    rows[[length(rows) + 1]] <- row_of(pid, k, "action", c(paste0("Act", k), extra[[paste0("a", k)]]))
    for (s in seq_len(talk_per_item)) rows[[length(rows) + 1]] <- row_of(pid, k, "talk", c("Talk", if (s == 1) extra[[paste0("t", k)]]))
  }
  do.call(rbind, rows)
}
dat <- rbind(make_participant("P1", 1), make_participant("P2", 5),
             make_participant("P3", 1, list(a2 = "Mech", t3 = "Mech")))
dat$line <- ave(seq_len(nrow(dat)), dat$participant_id, FUN = seq_along)
say("test data: ", nrow(dat), " lines; P1 ", sum(dat$participant_id == "P1"), ", P2 ", sum(dat$participant_id == "P2"), ", P3 ", sum(dat$participant_id == "P3"))

# ---- hand-computed reference -------------------------------------------------------------
# For each response line r: ground G = earlier lines (row order) whose item distance is inside
# the window for THEIR stream; optionally plus the response line itself; optionally presence
# only. Contribution = w * outer(G, response codes), rows = ground code, cols = response code.
ref_counts <- function(d, back_action, back_talk, include_self, binary, weight) {
  nc <- length(codes); m <- matrix(0, nc, nc, dimnames = list(ground = codes, response = codes))
  for (r in seq_len(nrow(d))) {
    earlier <- seq_len(r - 1)
    lim <- ifelse(d$stream[earlier] == "action", back_action, back_talk)
    inwin <- earlier[(d$item_ordinal[r] - d$item_ordinal[earlier]) < lim]
    G <- if (length(inwin)) colSums(as.matrix(d[inwin, codes, drop = FALSE])) else rep(0, nc)
    R <- as.numeric(unlist(d[r, codes]))
    if (include_self) G <- G + R
    if (binary) G <- as.numeric(G > 0)
    w <- if (weight == "item_stream") 1 / sum(d$item_ordinal == d$item_ordinal[r] & d$stream == d$stream[r]) else 1
    m <- m + w * outer(as.numeric(G), R)
  }
  m
}

# ---- tma pieces -----------------------------------------------------------------------------
# Decay: x = item distance for each ground row. Per-stream window from the ground row's stream;
# optional weight 1 / (lines in the response's item and stream). FULL_CONTEXT, ROWS and
# RESPONSE_INDEX are supplied by tma (seen in its source).
make_decay <- function(back_action, back_talk, weight) {
  force(back_action); force(back_talk); force(weight)
  function(x) {
    modes <- FULL_CONTEXT$stream[ROWS]
    lim <- ifelse(modes == "action", back_action, back_talk)
    w <- 1
    if (weight == "item_stream") {
      it <- FULL_CONTEXT$item_ordinal; st <- FULL_CONTEXT$stream
      w <- 1 / sum(it == it[RESPONSE_INDEX] & st == st[RESPONSE_INDEX])
    }
    (x < lim) * w
  }
}
as_vec_list <- function(z) if (is.list(z)) lapply(z, as.numeric) else if (is.matrix(z)) lapply(seq_len(nrow(z)), function(i) as.numeric(z[i, ])) else list(as.numeric(z))
first_call_logged <- FALSE
# Replacement for tma's calculate_adj_vectors_using. tma passes: ground minus response (weighted),
# response codes (unweighted), response row as it sits in the ground (weighted). The weight w is
# recovered as sum(weighted response) / sum(response).
make_calc <- function(include_self, binary) {
  force(include_self); force(binary)
  function(g_list, r_list, rig_list) {
    if (!first_call_logged) { first_call_logged <<- TRUE
      dumpx(capture.output(str(list(g = g_list, r = r_list, rig = rig_list), max.level = 2, list.len = 3)), "shape of tma's arguments to the custom function (first call)") }
    g_list <- as_vec_list(g_list); r_list <- as_vec_list(r_list); rig_list <- as_vec_list(rig_list)
    nc <- length(r_list[[1]]); out <- rep(0, nc * nc)
    for (i in seq_along(r_list)) {
      r <- r_list[[i]]; if (sum(r) == 0) next
      w <- sum(rig_list[[i]]) / sum(r); if (!is.finite(w) || w == 0) next
      G <- g_list[[i]] / w
      if (include_self) G <- G + r
      if (binary) G <- as.numeric(G > 1e-9)
      out <- out + w * as.vector(outer(G, r))
    }
    out
  }
}
ctx <- NULL
build_ctx <- function() {
  hoo <- tget("rules")(participant_id %in% UNIT$participant_id & case_id %in% UNIT$case_id)
  tget("contexts")(x = dat, hoo_rules = hoo, units_by = c("participant_id"))
}
run_tma <- function(decay, calc = NULL, gef = NULL) {
  if (is.null(ctx)) ctx <<- build_ctx()
  args <- list(x = ctx, codes = codes, decay.function = decay, time.column = "item_ordinal",
               return.ena.set = FALSE, mode.column = "stream")
  if (!is.null(calc)) args$calculate_adj_vectors_using <- calc
  if (!is.null(gef)) args$ground_effect_function <- gef
  do.call(tget("accumulate_contexts"), args)
}
tma_matrix <- function(res, pid) {
  cc <- as.data.frame(res$connection.counts); row <- cc[cc$participant_id == pid, ]
  m <- matrix(0, length(codes), length(codes), dimnames = list(ground = codes, response = codes))
  for (nm in grep(" & ", names(cc), value = TRUE)) { p <- strsplit(nm, " & ", fixed = TRUE)[[1]]; m[p[1], p[2]] <- as.numeric(row[[nm]]) }
  m
}

# ---- variants ---------------------------------------------------------------------------------
variants <- list(
  list(id = "V0", label = "tma default (counts add up, response line excluded) - baseline",
       decay = make_decay(2, 2, "none"), ref = c(include_self = FALSE, binary = FALSE), weight = "none", ba = 2, bt = 2),
  list(id = "V1", label = "custom function reproducing the default (checks the custom plumbing)",
       decay = make_decay(2, 2, "none"), calc = make_calc(FALSE, FALSE), ref = c(include_self = FALSE, binary = FALSE), weight = "none", ba = 2, bt = 2),
  list(id = "V2", label = "presence via tma's ground_effect_function hook",
       decay = make_decay(2, 2, "none"), gef = function(x, y) crossprod(t(as.numeric(x > 1e-9)), y), ref = c(include_self = FALSE, binary = TRUE), weight = "none", ba = 2, bt = 2),
  list(id = "V3", label = "presence (custom function)",
       decay = make_decay(2, 2, "none"), calc = make_calc(FALSE, TRUE), ref = c(include_self = FALSE, binary = TRUE), weight = "none", ba = 2, bt = 2),
  list(id = "V4", label = "presence + response line included (same-line codes connect)",
       decay = make_decay(2, 2, "none"), calc = make_calc(TRUE, TRUE), ref = c(include_self = TRUE, binary = TRUE), weight = "none", ba = 2, bt = 2),
  list(id = "V5", label = "counts + each item and stream weighted equally",
       decay = make_decay(2, 2, "item_stream"), calc = make_calc(FALSE, FALSE), ref = c(include_self = FALSE, binary = FALSE), weight = "item_stream", ba = 2, bt = 2),
  list(id = "V6", label = "presence + each item and stream weighted equally",
       decay = make_decay(2, 2, "item_stream"), calc = make_calc(FALSE, TRUE), ref = c(include_self = FALSE, binary = TRUE), weight = "item_stream", ba = 2, bt = 2),
  list(id = "V7", label = "V6 + per-stream windows (actions reach 3 items, talk 2)",
       decay = make_decay(3, 2, "item_stream"), calc = make_calc(FALSE, TRUE), ref = c(include_self = FALSE, binary = TRUE), weight = "item_stream", ba = 3, bt = 2)
)

norm_summary <- function(m, sqrt_w = FALSE) {
  v <- as.vector(m); if (sqrt_w) v <- sqrt(v); n <- sqrt(sum(v^2)); if (n == 0) return(c(link = NA, share = NA))
  u <- matrix(v / n, nrow(m), dimnames = dimnames(m))
  aa <- c(u["Act1", "Act2"], u["Act2", "Act3"], u["Act3", "Act4"])
  c(link = mean(aa), share = 100 * sum(aa^2))
}
summary_rows <- list()
for (V in variants) {
  say("\n===== ", V$id, ": ", V$label, " =====")
  res <- tryCatch(run_tma(V$decay, V$calc, V$gef), error = function(e) { say("ERROR: ", conditionMessage(e)); NULL })
  if (is.null(res)) next
  for (pid in c("P1", "P2", "P3")) {
    tm <- tryCatch(tma_matrix(res, pid), error = function(e) { say("ERROR reading output: ", conditionMessage(e)); NULL })
    if (is.null(tm)) next
    rf <- ref_counts(dat[dat$participant_id == pid, ], V$ba, V$bt, V$ref[["include_self"]], V$ref[["binary"]], V$weight)
    diff <- max(abs(tm - rf))
    say(sprintf("  %s: %s (largest difference from the hand-computed answer = %.6f)", pid, if (diff < 1e-9) "MATCH" else "MISMATCH", diff))
    if (diff >= 1e-9) { dumpx(round(tm, 4), paste(V$id, pid, "tma")); dumpx(round(rf, 4), paste(V$id, pid, "hand-computed")) }
    if (pid == "P3") say(sprintf("  P3 same-line codes: Act2->Mech = %.3f, Mech->Act2 = %.3f, Talk->Mech = %.3f (item-3 talk line carries Talk + Mech)",
                                 tm["Act2", "Mech"], tm["Mech", "Act2"], tm["Talk", "Mech"]))
    if (pid != "P3") { a <- norm_summary(tm); b <- norm_summary(tm, TRUE)
      summary_rows[[length(summary_rows) + 1]] <- data.frame(variant = V$id, participant = pid,
        link = round(a[["link"]], 3), share_pct = round(a[["share"]], 1), link_sqrt = round(b[["link"]], 3), share_sqrt_pct = round(b[["share"]], 1)) }
  }
}
say("\n===== After sphere normalization: quiet (P1) vs talkative (P2) =====")
say("link = average normalized action->action connection; share = % of the network that is action->action.")
say("Talkativeness-neutral means P1 and P2 rows are equal within a variant. _sqrt = with square-root weighting.")
if (length(summary_rows)) dumpx(do.call(rbind, summary_rows), "normalized comparison")
say("\nDone. Tell Claude probe v2 has run; it will read ", log_file, ".")
