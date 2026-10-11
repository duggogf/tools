# roblox-prototype

A browser replica of barebones Roblox gameplay (default R15 character, Classic camera, keyboard/mouse/gamepad/touch controls, default animations) built with Three.js, for rapid prototyping of mechanics that will later be ported to Luau.

The reference document is [`docs/roblox-default-gameplay-research.md`](docs/roblox-default-gameplay-research.md). Every constant comes from it or from the `PlayerModule` Lua source; values Roblox does not publish are estimates in [`scripts/Config.js`](scripts/Config.js), and you can tune them live in the settings panel.

## Run

No build step. Serve the folder and open it:

```sh
cd roblox-prototype
python3 -m http.server 8000
# open http://localhost:8000/
```

Three.js 0.170.0 and lil-gui 0.19.2 load from cdnjs through the import map in `index.html`, so the page needs network access. Opening `index.html` from `file://` does not work because ES modules need HTTP.

## Controls

| Action | Keyboard / mouse | Gamepad | Touch |
|---|---|---|---|
| Move | W A S D, ↑ ↓ | Left stick (deadzone 0.2, magnitude scales speed) | Dynamic thumbstick: put a finger down in the bottom-left area |
| Jump (hold to bunny-hop) | Space | A | Jump button (bottom right) |
| Orbit camera | Hold right mouse button and drag; ← → rotate | Right stick | Drag anywhere else |
| Zoom | Mouse wheel, I / O | R3 cycles zoom levels (first person, 20, 10) | Pinch |
| Shift lock | Left/Right Shift | — | — |
| First person | Zoom all the way in | R3 | Pinch in |
| Debug HUD and collision rays | F3 | — | — |
| Reset character | Settings panel → Humanoid → Reset Character | — | — |

Shift lock and first person lock the pointer. The browser requires a click or key press to grant the lock: if you zoom into first person with the wheel, the camera follows the mouse with a hidden cursor until the next click takes the lock. Esc releases the pointer, and the next click locks it again.

## Settings panel

Changes apply live: WalkSpeed, JumpPower, AutoRotateSpeed, WalkAccelerationTime, StepHeight, LandedToJumpDelay, JumpingStateDuration, Gravity, camera mode (Classic / Follow / CameraToggle), zoom limits, FieldOfView, EnableMouseLockOption, mouse and gamepad sensitivity, Y invert. When you have a value you like, copy it into `scripts/Config.js`.

## Layout

- `index.html`: canvas, HUD and panel containers, touch GUI container, import map.
- `scripts/`: one ES module per Roblox counterpart, so the port to Luau is 1:1.
  - Camera (ports of `PlayerModule.CameraModule`): `CameraModule.js`, `BaseCamera.js`, `ClassicCamera.js`, `CameraInput.js`, `ZoomController.js` (includes Popper), `Poppercam.js`, `TransparencyController.js`, `MouseLockController.js`, `CameraUtils.js`.
  - Controls (ports of `PlayerModule.ControlModule`): `ControlModule.js`, `Keyboard.js`, `Gamepad.js`, `DynamicThumbstick.js`, `TouchJump.js`.
  - Character: `Humanoid.js` (kinematic stand-in for the engine Humanoid), `Character.js` (blocky R15 box rig), `Animations.js` (clip data), `Animate.js` (port of the Animate script plus a small Animator), `CharacterSounds.js` (stub that reports sound events to the HUD).
  - Engine stand-ins: `World.js` (Workspace, gym parts, OBB raycasts, Camera), `UserInputService.js` (DOM to InputObject, pointer lock, gamepad polling), `RunService.js` (game clock), `Signal.js`.
  - Tooling: `Config.js`, `CFrame.js`, `DebugHud.js`, `SettingsPanel.js`, `main.js` (frame loop in RenderStepped order: ControlModule, Humanoid physics, CameraModule, Animate, render).
- `docs/`: research on how the Roblox client behaves by default.

`window.__rbx` exposes the live humanoid, camera module and a `pause()` / `step(dt, n)` pair for console debugging and automated tests.
