# video-editing

Turns a horizontal 16:9 video, such as a game trailer, into a vertical 9:16 video sized for Instagram Reels, TikTok and YouTube Shorts.

Output is always 1080 x 1920, 30 fps, H.264 video with AAC audio in an MP4 file, which matches the Reels upload spec.

## Requirements

- `ffmpeg` and `ffprobe` (version 6 or newer tested).

## Usage

Put the source video in `input/`, then run:

```bash
./scripts/to-vertical.sh input/trailer.mp4
```

That writes all three layouts to `output/` plus a side-by-side preview image, so you can compare them before picking one.

```text
output/trailer_crop.mp4
output/trailer_blur.mp4
output/trailer_stack.mp4
output/trailer_preview.png
```

### Options

```text
./scripts/to-vertical.sh [options] <input-video>

  -m, --mode MODE     crop | blur | stack | all   (default: all)
  -x, --focus-x N     Horizontal focus point, 0.0 = left edge, 0.5 = center, 1.0 = right edge
                      Used by crop and stack modes (default: 0.5)
  -o, --out-dir DIR   Output folder (default: the tool's output/ folder)
  -s, --start TIME    Start time, e.g. 5 or 00:00:05 (default: beginning)
  -t, --duration SEC  Only convert this many seconds (default: whole video)
  -h, --help          Show help
```

### Which layout to use

| Layout | What it does | Best for |
|---|---|---|
| `crop` | Crops a 9:16 window out of the frame and scales it to fill the screen. Loses about two thirds of the width. | Shots where the action is in one place. Use `--focus-x` to aim the window. |
| `blur` | Shrinks the full frame to fit the width and fills the space above and below with a blurred, zoomed copy. Nothing is lost. | Title cards, logo reveals, and shots where the HUD or text must stay visible. |
| `stack` | Full 16:9 frame on top, a zoomed crop of the action filling the bottom. | Gameplay where the HUD matters but the action also needs to be big. |

A single fixed crop cannot follow action that moves between shots. For a polished trailer, use this tool for a fast first version, then reframe individual shots in an editor. See the research report for editor workflows.

## Docs

- [`docs/reels-vertical-research.md`](docs/reels-vertical-research.md): Instagram Reels specs, safe zones, reframing techniques, editor workflows and best practices for game trailers.
