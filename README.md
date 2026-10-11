# tools

A collection of small, self-contained tools. Each tool lives in its own top-level folder with its own README, scripts and docs.

| Folder | What it does |
|---|---|
| [`video-editing/`](video-editing/) | Convert horizontal (16:9) videos such as game trailers into vertical (9:16) videos for Instagram Reels, TikTok and YouTube Shorts. |
| [`roblox-prototype/`](roblox-prototype/) | Three.js replica of default Roblox gameplay (character, camera, controls, animation) for prototyping mechanics before porting them to Luau. |

## Conventions

- One folder per tool, named in lowercase with hyphens.
- Each tool folder has a `README.md` explaining what it does and how to run it.
- Runnable code goes in `scripts/`, reference material in `docs/`.
- Tools that process files use `input/` and `output/` folders. Their contents are ignored by git, so large media files never get committed.
