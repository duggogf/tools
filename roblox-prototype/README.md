# roblox-prototype

A browser replica of barebones Roblox gameplay (default R15 character, Classic camera, keyboard/mouse/gamepad/touch controls, default animations) built with Three.js, for rapid prototyping of mechanics that will later be ported to Luau.

Status: research phase. The reference document is in [`docs/roblox-default-gameplay-research.md`](docs/roblox-default-gameplay-research.md). Runnable code will live in `scripts/` once the design questions are settled.

## Layout

- `docs/` reference material, starting with the research on how the Roblox client behaves by default.
- `scripts/` (to come) the Three.js prototype, one module per Roblox `PlayerModule` counterpart so the port to Lua is 1:1.
