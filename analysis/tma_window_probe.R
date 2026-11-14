# tma window probe (2026-11-12)
# Purpose: find out how the tma package uses its time column, so we can decide whether
# item-based windows ("this item plus the previous n-1 items") can be built with tma
# instead of custom code. Nothing here touches study data.
#
# Run from the repo root in R or RStudio:
#   source("analysis/tma_window_probe.R")
# Output goes to analysis/tma_probe_out/ (log.txt plus tma_source.txt).
#
# Test data: two simulated participants take the SAME 4 actions (codes Act1..Act4, one per
# item). P1 says 1 sentence after each action, P2 says 5 (code Talk). Under an item-based
# window the action-to-action connections must be identical for P1 and P2; under a line
# window P2 loses them. Hand-computed reference answers are compared with tma's output.

out_dir <- file.path("analysis", "tma_probe_out")
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)
log_file <- file.path(out_dir, "log.txt")
cat("", file = log_file)
say <- function(...) { txt <- paste0(...); cat(txt, "\n"); cat(txt, "\n", file = log_file, append = TRUE) }
dump <- function(obj, title) {
  say("\n----- ", title, " -----")
  txt <- tryCatch(capture.output(print(obj)), error = function(e) paste("ERROR:", conditionMessage(e)))
  cat(txt, sep = "\n", file = log_file, append = TRUE); cat(txt, sep = "\n")
}

say("R: ", R.version.string, " | platform: ", R.version$platform, " | run: ", format(Sys.time()))
if (!requireNamespace("tma", quietly = TRUE)) {
  say("tma not installed; installing from CRAN ...")
  install.packages("tma", repos = "https://cloud.r-project.org")
}
library(tma)
say("tma version: ", as.character(packageVersion("tma")))
ns <- asNamespace("tma")
tget <- function(name) if (exists(name, envir = ns, inherits = FALSE)) get(name, envir = ns) else NULL

# ---- 1. save source of the functions that decide windows --------------------------------
src_file <- file.path(out_dir, "tma_source.txt"); cat("", file = src_file)
cat("EXPORTS:\n", paste(sort(getNamespaceExports("tma")), collapse = "\n"), "\n\n", file = src_file, append = TRUE)
for (fn in c("contexts", "rules", "accumulate_contexts", "accumulate", "context_tensor", "decay",
             "simple_window", "apply_tensor", "accumulate_networks", "model")) {
  f <- tget(fn)
  cat("\n=================== ", fn, " ===================\n", file = src_file, append = TRUE)
  if (is.null(f)) { cat("(not found)\n", file = src_file, append = TRUE); next }
  cat(capture.output(print(f)), sep = "\n", file = src_file, append = TRUE)
}
say("saved function source to ", src_file)

# ---- 2. test data ----------------------------------------------------------------------
codes <- c("Act1", "Act2", "Act3", "Act4", "Talk")
make_participant <- function(pid, talk_per_item) {
  rows <- list()
  for (k in 1:4) {
    a <- setNames(as.list(rep(0, length(codes))), codes); a[[paste0("Act", k)]] <- 1
    rows[[length(rows) + 1]] <- data.frame(participant_id = pid, case_id = 1, item_ordinal = k, stream = "action",
                                           text = paste("action", k), a, stringsAsFactors = FALSE)
    for (s in seq_len(talk_per_item)) {
      t <- setNames(as.list(rep(0, length(codes))), codes); t$Talk <- 1
      rows[[length(rows) + 1]] <- data.frame(participant_id = pid, case_id = 1, item_ordinal = k, stream = "talk",
                                             text = paste("talk", k, s), t, stringsAsFactors = FALSE)
    }
  }
  d <- do.call(rbind, rows); d$pos_in_item <- ave(d$item_ordinal, d$item_ordinal, FUN = seq_along); d
}
dat <- rbind(make_participant("P1", 1), make_participant("P2", 5))
dat$line <- ave(seq_len(nrow(dat)), dat$participant_id, FUN = seq_along)
dat$item_time_fine <- dat$item_ordinal + (dat$pos_in_item - 1) / 1000   # same item, but strictly increasing
say("test data: ", nrow(dat), " lines (P1 ", sum(dat$participant_id == "P1"), ", P2 ", sum(dat$participant_id == "P2"), ")")

# ---- 3. hand-computed references (directed: codes in the window -> codes in the response) ----
ref_counts <- function(d, in_window, include_response = TRUE) {
  m <- matrix(0, length(codes), length(codes), dimnames = list(ground = codes, response = codes))
  for (r in seq_len(nrow(d))) {
    g <- which(seq_len(nrow(d)) < r & sapply(seq_len(nrow(d)), function(j) in_window(d, r, j)))
    if (include_response) g <- c(g, r)
    if (!length(g)) next
    ground <- as.numeric(colSums(d[g, codes, drop = FALSE]) > 0)
    resp <- as.numeric(unlist(d[r, codes]))
    m <- m + outer(ground, resp)
  }
  m
}
N_ITEMS <- 2   # window = current item + previous item
W_LINES <- 4   # comparison: window of 4 lines
item_win <- function(d, r, j) d$item_ordinal[r] - d$item_ordinal[j] < N_ITEMS
line_win <- function(d, r, j) r - j < W_LINES
refs <- list()
for (p in c("P1", "P2")) {
  d <- dat[dat$participant_id == p, ]
  refs[[paste(p, "item_window")]] <- ref_counts(d, item_win)
  refs[[paste(p, "line_window")]] <- ref_counts(d, line_win)
  refs[[paste(p, "item_window_no_self")]] <- ref_counts(d, item_win, include_response = FALSE)
}
act_links <- function(m) c(`Act1->Act2` = m["Act1", "Act2"], `Act2->Act3` = m["Act2", "Act3"], `Act3->Act4` = m["Act3", "Act4"], `Act1->Act3` = m["Act1", "Act3"])
say("\nAction-to-action connections in the hand-computed references (the point of item windows):")
for (nm in names(refs)) say(sprintf("  %-26s %s", nm, paste(names(act_links(refs[[nm]])), act_links(refs[[nm]]), sep = "=", collapse = "  ")))

# ---- 4. run tma with the item number as its time column --------------------------------
run_tma <- function(time_col, label) {
  say("\n===== tma run: time.column = ", time_col, " (", label, ") =====")
  res <- tryCatch({
    rules_f <- tget("rules"); contexts_f <- tget("contexts"); acc_f <- tget("accumulate_contexts")
    hoo <- rules_f(participant_id %in% UNIT$participant_id & case_id %in% UNIT$case_id)
    ctx <- contexts_f(x = dat, hoo_rules = hoo, units_by = c("participant_id"))
    acc_f(x = ctx, codes = codes,
          decay.function = function(x) (x < N_ITEMS) * 1,   # x = difference in the time column
          time.column = time_col, return.ena.set = FALSE, mode.column = "stream")
  }, error = function(e) { say("ERROR: ", conditionMessage(e)); NULL })
  if (is.null(res)) return(invisible(NULL))
  dump(class(res), "class of result"); dump(names(res), "names of result")
  cc <- tryCatch(res$connection.counts, error = function(e) NULL)
  if (!is.null(cc)) dump(as.data.frame(cc), "connection.counts")
  else dump(capture.output(utils::str(res, max.level = 2)), "structure (no connection.counts found)")
  invisible(res)
}
r1 <- run_tma("item_ordinal", "integer item number; lines in one item share a time")
r2 <- run_tma("item_time_fine", "item number plus a tiny within-item offset")
r3 <- run_tma("line", "plain line number, for comparison with a line window")

dump(lapply(refs, function(m) m), "reference matrices (rows = ground code, cols = response code)")
say("\nDone. Tell Claude the probe has run; it will read ", log_file, " and ", src_file, ".")
