#!/usr/bin/env bash
#
# setup_vad.sh — one-time download of the Silero VAD runtime INTO THIS REPO, so the
# replay silence-net uses a real neural voice-activity detector locally (no CDN).
#
# Run this ONCE, from the repo root (the folder that contains index_full.html):
#     bash setup_vad.sh
#
# It needs internet access and ~15 MB of disk. After it finishes, serve the study
# and open the replay: the browser console should show the VAD model loading, and
# `rta_vad.primary_engine` in the export should read "silero". If anything 404s or
# the model fails to load, the instrument automatically falls back to the energy
# gate (primary_engine: "energy") and the study still runs — tell me which files
# failed and I'll adjust the versions.
#
set -u

VAD_VER="0.0.19"          # @ricky0123/vad-web
ORT_VER="1.14.0"          # onnxruntime-web (must match the vad-web build)
DIR="js/vendor/vad"
VCDN="https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@${VAD_VER}/dist"
OCDN="https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist"

if [ ! -f "index_full.html" ]; then
  echo "!! Run this from the repo root (the folder with index_full.html). Aborting."
  exit 1
fi
mkdir -p "$DIR"

fail=0
get () {  # $1 base url, $2 filename, $3 = 1 if required/large
  local url="$1/$2" out="$DIR/$2" required="${3:-0}"
  echo "  -> $out"
  if curl -fSL --retry 3 --retry-delay 2 -o "$out" "$url"; then
    local sz; sz=$(wc -c < "$out" 2>/dev/null || echo 0)
    if [ "$required" = "1" ] && [ "$sz" -lt 10000 ]; then
      echo "    !! $out is only ${sz} bytes — likely an error page, not the real file."; fail=1
    fi
  else
    echo "    !! FAILED to download $url"; fail=1
  fi
}

echo "[1/2] @ricky0123/vad-web (bundle + worklet + Silero model)  ->  $DIR"
get "$VCDN" "bundle.min.js" 1
get "$VCDN" "vad.worklet.bundle.min.js" 1
get "$VCDN" "silero_vad.onnx" 1

echo "[2/2] onnxruntime-web runtime + WASM  ->  $DIR"
get "$OCDN" "ort.min.js" 1
for w in ort-wasm.wasm ort-wasm-simd.wasm ort-wasm-threaded.wasm ort-wasm-simd-threaded.wasm; do
  get "$OCDN" "$w" 0
done

echo
echo "----------------------------------------------------------------------"
if [ "$fail" = "0" ]; then
  echo "Done. Files downloaded:"
  du -h "$DIR"/* 2>/dev/null
  echo
  echo "Next: serve the repo (e.g. python3 -m http.server 8000), run a case, and"
  echo "watch the replay. The console should show the VAD loading; the exported"
  echo "rta_vad.primary_engine should be \"silero\"."
else
  echo "Some downloads failed (see !! lines). The instrument still runs — it falls"
  echo "back to the energy gate — but Silero won't be active until every required"
  echo "file is present. Re-run, or tell me which files 404'd and I'll adjust the"
  echo "pinned versions (VAD_VER / ORT_VER)."
fi
echo "----------------------------------------------------------------------"
