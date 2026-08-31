#!/usr/bin/env bash
#
# setup_whisper.sh — one-time download of the Whisper transcription model and the
# transformers.js runtime INTO THIS REPO, so the study loads them locally (no CDN).
#
# Run this ONCE, from the repo root (the folder that contains index_full.html):
#     bash setup_whisper.sh
#
# It needs internet access and ~250 MB of disk. After it finishes, serve the study
# (e.g. `python3 -m http.server 8000`) and open index_full.html — the status chip
# should reach "Speech model ready".
#
set -u

TF_VER="2.17.2"
TF_DIR="js/vendor/transformers"
MODEL_DIR="models/Xenova/whisper-small.en"
CDN="https://cdn.jsdelivr.net/npm/@xenova/transformers@${TF_VER}/dist"
HF="https://huggingface.co/Xenova/whisper-small.en/resolve/main"

if [ ! -f "index_full.html" ]; then
  echo "!! Run this from the repo root (the folder with index_full.html). Aborting."
  exit 1
fi

mkdir -p "$TF_DIR" "$MODEL_DIR/onnx"

fail=0
# $1 = url, $2 = output path, $3 = 1 if large/required
get () {
  local url="$1" out="$2" required="${3:-0}"
  echo "  → $out"
  if curl -fSL --retry 3 --retry-delay 2 -o "$out" "$url"; then
    local sz; sz=$(wc -c < "$out" 2>/dev/null || echo 0)
    if [ "$required" = "1" ] && [ "$sz" -lt 100000 ]; then
      echo "    !! $out is only ${sz} bytes — likely an error page, not the real file."
      fail=1
    fi
  else
    echo "    !! FAILED to download $url"
    fail=1
  fi
}

echo "[1/2] transformers.js runtime + ONNX WASM  ->  $TF_DIR"
get "$CDN/transformers.min.js"            "$TF_DIR/transformers.min.js" 1
for w in ort-wasm.wasm ort-wasm-threaded.wasm ort-wasm-simd.wasm ort-wasm-simd-threaded.wasm; do
  get "$CDN/$w" "$TF_DIR/$w" 0
done

echo "[2/2] whisper-small.en model weights  ->  $MODEL_DIR"
for f in config.json generation_config.json preprocessor_config.json tokenizer.json tokenizer_config.json; do
  get "$HF/$f" "$MODEL_DIR/$f" 0
done
get "$HF/onnx/encoder_model_quantized.onnx"        "$MODEL_DIR/onnx/encoder_model_quantized.onnx" 1
get "$HF/onnx/decoder_model_merged_quantized.onnx" "$MODEL_DIR/onnx/decoder_model_merged_quantized.onnx" 1

echo
echo "----------------------------------------------------------------------"
if [ "$fail" = "0" ]; then
  echo "Done. Files downloaded:"
  du -h "$TF_DIR"/* "$MODEL_DIR"/*.json "$MODEL_DIR"/onnx/*.onnx 2>/dev/null
  echo
  echo "Next: serve the repo (e.g. python3 -m http.server 8000) and open"
  echo "index_full.html. The status chip should reach 'Speech model ready'."
else
  echo "Some downloads failed (see the !! lines above). The study will show"
  echo "'Speech model unavailable' until every required file is present."
  echo "Re-run this script, or tell me which files 404'd and I'll adjust the list."
fi
echo "----------------------------------------------------------------------"
