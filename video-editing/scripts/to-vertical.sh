#!/usr/bin/env bash
# Convert a horizontal (16:9) video into vertical (9:16) 1080x1920 for Instagram Reels,
# TikTok and YouTube Shorts. See ../README.md for usage and layout guidance.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL_DIR="$(dirname "$SCRIPT_DIR")"

W=1080
H=1920
FPS=30
TOP_H=608            # Height of the full 16:9 frame when scaled to 1080 wide (stack mode).
BOTTOM_H=$((H - TOP_H))

MODE="all"
FOCUS_X="0.5"
OUT_DIR="$TOOL_DIR/output"
START=""
DURATION=""

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options] <input-video>

  -m, --mode MODE     crop | blur | stack | all   (default: all)
  -x, --focus-x N     Horizontal focus point, 0.0 = left, 0.5 = center, 1.0 = right
                      Used by crop and stack modes (default: 0.5)
  -o, --out-dir DIR   Output folder (default: $TOOL_DIR/output)
  -s, --start TIME    Start time, e.g. 5 or 00:00:05 (default: beginning)
  -t, --duration SEC  Only convert this many seconds (default: whole video)
  -h, --help          Show this help
USAGE
}

die() { echo "error: $*" >&2; exit 1; }

INPUT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--mode)     MODE="${2:-}"; shift 2 ;;
    -x|--focus-x)  FOCUS_X="${2:-}"; shift 2 ;;
    -o|--out-dir)  OUT_DIR="${2:-}"; shift 2 ;;
    -s|--start)    START="${2:-}"; shift 2 ;;
    -t|--duration) DURATION="${2:-}"; shift 2 ;;
    -h|--help)     usage; exit 0 ;;
    -*)            die "unknown option: $1 (see --help)" ;;
    *)             [[ -z "$INPUT" ]] || die "only one input file is supported"; INPUT="$1"; shift ;;
  esac
done

command -v ffmpeg  >/dev/null || die "ffmpeg is not installed"
command -v ffprobe >/dev/null || die "ffprobe is not installed"
[[ -n "$INPUT" ]] || { usage >&2; exit 1; }
[[ -f "$INPUT" ]] || die "input file not found: $INPUT"
case "$MODE" in crop|blur|stack|all) ;; *) die "mode must be crop, blur, stack or all" ;; esac
awk -v x="$FOCUS_X" 'BEGIN { exit !(x ~ /^[0-9]*\.?[0-9]+$/ && x >= 0 && x <= 1) }' \
  || die "--focus-x must be a number between 0 and 1"

SRC_SIZE="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$INPUT")"
[[ -n "$SRC_SIZE" ]] || die "no video stream found in $INPUT"
SRC_W="${SRC_SIZE%x*}"
SRC_H="${SRC_SIZE#*x}"
if (( SRC_W * 9 < SRC_H * 16 - SRC_H / 10 )); then
  echo "warning: input is ${SRC_W}x${SRC_H}, narrower than 16:9; results may look over-zoomed" >&2
fi

mkdir -p "$OUT_DIR"
BASE="$(basename "${INPUT%.*}")"

# Seek and trim arguments shared by every encode.
IN_ARGS=()
[[ -n "$START" ]] && IN_ARGS+=(-ss "$START")
IN_ARGS+=(-i "$INPUT")
[[ -n "$DURATION" ]] && IN_ARGS+=(-t "$DURATION")

# Reels-friendly encode: H.264 high quality, yuv420p for compatibility, constant 30 fps,
# AAC stereo audio, and faststart so the file plays while still downloading.
ENC_ARGS=(-c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r "$FPS"
          -c:a aac -b:a 192k -ac 2 -movflags +faststart)

filter_for() {
  case "$1" in
    crop)
      # 9:16 window at full source height, positioned by FOCUS_X.
      echo "[0:v]crop=ih*9/16:ih:(iw-ih*9/16)*${FOCUS_X}:0,scale=${W}:${H},setsar=1[v]"
      ;;
    blur)
      # Full frame over a zoomed, blurred copy of itself.
      echo "[0:v]split=2[bg][fg];[bg]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},gblur=sigma=30[bgb];[fg]scale=${W}:-2[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1[v]"
      ;;
    stack)
      # Full frame on top, zoomed crop of the action below, positioned by FOCUS_X.
      echo "[0:v]split=2[a][b];[a]scale=${W}:${TOP_H}:force_original_aspect_ratio=decrease,pad=${W}:${TOP_H}:(ow-iw)/2:(oh-ih)/2[top];[b]crop=ih*${W}/${BOTTOM_H}:ih:(iw-ih*${W}/${BOTTOM_H})*${FOCUS_X}:0,scale=${W}:${BOTTOM_H},setsar=1[bot];[top][bot]vstack,setsar=1[v]"
      ;;
  esac
}

render() {
  local mode="$1" out="$OUT_DIR/${BASE}_$1.mp4"
  echo "==> $mode  ->  $out"
  ffmpeg -hide_banner -loglevel error -stats -y "${IN_ARGS[@]}" \
    -filter_complex "$(filter_for "$mode")" -map "[v]" -map "0:a?" \
    "${ENC_ARGS[@]}" "$out"
  local got
  got="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name,r_frame_rate -of csv=p=0 "$out")"
  [[ "$got" == "h264,${W},${H},${FPS}/1" ]] || die "unexpected output format for $out: $got"
  echo "    ok: $got"
}

if [[ "$MODE" == "all" ]]; then MODES=(crop blur stack); else MODES=("$MODE"); fi
for m in "${MODES[@]}"; do render "$m"; done

# Preview: one frame from the middle of each output, side by side.
PREVIEW="$OUT_DIR/${BASE}_preview.png"
first="$OUT_DIR/${BASE}_${MODES[0]}.mp4"
dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$first")"
mid="$(awk -v d="$dur" 'BEGIN { printf "%.2f", d / 2 }')"
PREV_IN=()
for m in "${MODES[@]}"; do PREV_IN+=(-ss "$mid" -i "$OUT_DIR/${BASE}_${m}.mp4"); done
n=${#MODES[@]}
chain=""
for ((i = 0; i < n; i++)); do chain+="[$i:v]scale=360:640,trim=end_frame=1[p$i];"; done
if (( n > 1 )); then
  for ((i = 0; i < n; i++)); do chain+="[p$i]"; done
  chain+="hstack=inputs=$n[out]"
else
  chain+="[p0]null[out]"
fi
ffmpeg -hide_banner -loglevel error -y "${PREV_IN[@]}" -filter_complex "$chain" -map "[out]" -frames:v 1 "$PREVIEW"
echo "==> preview  ->  $PREVIEW"
