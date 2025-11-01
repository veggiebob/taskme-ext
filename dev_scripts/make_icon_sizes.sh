#!/usr/bin/env bash

# generated with GPT-5

# Resize an image to common icon sizes: 32x32, 48x48, 96x96
# Usage: dev_scripts/make_icon_sizes.sh <image_path>
set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") <image_path>" >&2
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: ffmpeg is not installed or not in PATH." >&2
  exit 1
fi

INPUT="$1"
if [[ ! -f "$INPUT" ]]; then
  echo "Error: File not found: $INPUT" >&2
  exit 1
fi

DIR="$(dirname -- "$INPUT")"
BASENAME="$(basename -- "$INPUT")"
NAME="${BASENAME%.*}"
EXT="${BASENAME##*.}"
# Normalize extension to lowercase for output filenames
EXT="${EXT,,}"

sizes=(32 48 96)
for size in "${sizes[@]}"; do
  OUTFILE="$DIR/$NAME-$size.$EXT"
  echo "Creating $OUTFILE"
  ffmpeg -loglevel error -y -i "$INPUT" -vf "scale=${size}:${size}:flags=lanczos" "$OUTFILE"
  echo " ✓ Wrote $OUTFILE"
done

echo "Done. Generated sizes: ${sizes[*]} px"

