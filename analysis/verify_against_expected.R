#!/usr/bin/env Rscript
# One-command check that merge_logs_for_ncoder.R reproduces the reference output
# (expected/, expected_event_lines/, expected_plan_delta/) on your R installation.
# Run from the analysis/ folder:   Rscript verify_against_expected.R
runs <- list(
  list(args = c("sample_logs", "out_verify_sentence"),                    expect = "expected"),
  list(args = c("sample_logs", "out_verify_event", "event"),              expect = "expected_event_lines"),
  list(args = c("sample_logs", "out_verify_delta", "sentence", "delta"), expect = "expected_plan_delta"))
rd <- function(f) { d <- read.csv(f, colClasses = "character", na.strings = character(0)); d[is.na(d)] <- ""; rownames(d) <- NULL; d }
ok_all <- TRUE
for (r in runs) {
  status <- system2("Rscript", c("merge_logs_for_ncoder.R", r$args), stdout = FALSE, stderr = FALSE)
  if (!identical(status, 0L)) { cat("FAIL  merge script errored for", paste(r$args, collapse = " "), "\n"); ok_all <- FALSE; next }
  for (f in c("ncoder_corpus.csv", "ona_events_full.csv", "qa_summary.csv")) {
    got <- rd(file.path(r$args[[2]], f)); want <- rd(file.path(r$expect, f))
    same <- isTRUE(all.equal(got, want, check.attributes = FALSE))
    cat(if (same) "PASS " else "FAIL ", r$expect, "/", f, "\n", sep = "")
    if (!same) { ok_all <- FALSE; print(all.equal(got, want, check.attributes = FALSE)) }
  }
}
cat(if (ok_all) "\nAll outputs match the reference.\n" else "\nMismatch: send the output above to Claude.\n")
quit(status = if (ok_all) 0 else 1)
