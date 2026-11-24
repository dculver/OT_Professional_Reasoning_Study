#!/bin/bash
# Builds the speech clips the automated participants "say" into the microphone.
#  1. Synthetic voice: one clip per line of clips/script.txt (macOS 'say').
#  2. Your own recordings (recommended): put audio files in clips/own/ (m4a, wav, aiff),
#     each with a .txt file of the same name containing exactly what you said.
# Output: clips/<name>.wav (48 kHz mono 16-bit) + clips/<name>.txt
set -e
cd "$(dirname "$0")/clips"
command -v say >/dev/null || { echo "This script needs macOS (say, afconvert)."; exit 1; }
VOICE="${VOICE:-Samantha}"
n=0
while IFS= read -r line || [ -n "$line" ]; do
  [ -z "$line" ] && continue
  n=$((n+1)); name=$(printf "tts_%02d" "$n")
  say -v "$VOICE" -o "/tmp/$name.aiff" "$line"
  afconvert -f WAVE -d LEI16@48000 -c 1 "/tmp/$name.aiff" "$name.wav"
  printf "%s\n" "$line" > "$name.txt"
done < script.txt
echo "Made $n synthetic clips."
if [ -d own ]; then
  m=0
  for f in own/*.m4a own/*.wav own/*.aiff own/*.mp3; do
    [ -e "$f" ] || continue
    base=$(basename "${f%.*}")
    if [ ! -f "own/$base.txt" ]; then echo "Skipping $f: no own/$base.txt transcript"; continue; fi
    afconvert -f WAVE -d LEI16@48000 -c 1 "$f" "own_$base.wav"
    cp "own/$base.txt" "own_$base.txt"
    m=$((m+1))
  done
  echo "Converted $m of your own recordings."
fi
