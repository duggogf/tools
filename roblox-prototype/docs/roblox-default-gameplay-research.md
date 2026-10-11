# Roblox default gameplay: reference for a Three.js replica

Scope: what a player gets in an empty Baseplate with no scripts. Movement, camera, controls, animation, default character sounds. No custom experience logic, no UI beyond what the engine draws.

Sources (checked 2026-10-11):

- `PlayerModule` Lua source, Roblox client build of 2026-10-07, mirrored in [MaximumADHD/Roblox-Client-Tracker](https://github.com/MaximumADHD/Roblox-Client-Tracker) under `scripts/PlayerScripts/StarterPlayerScripts/PlayerModule.module/`. All camera and control constants below are quoted from it.
- Official engine docs, [Roblox/creator-docs](https://github.com/Roblox/creator-docs) (`Humanoid`, `StarterPlayer`, `Workspace`, `Camera`, enums, `animation/using.md`).
- Humanoid physics internals (turn rate, acceleration, step-up, jump timing) are C++ and not published. Those values are marked **measure** and must be timed in Studio before the replica is tuned.
- Animate script values are from community mirrors of the script (the script is embedded in the engine). Marked **community** where not confirmed by official docs.

## 1. World and units

| Item | Value | Source |
|---|---|---|
| Unit | stud. Keep the replica in studs, no metre conversion | — |
| Axes | Y up, right-handed, `LookVector` is **-Z**. Same as Three.js | — |
| Gravity | 196.2 studs/s² | `Workspace.Gravity` |
| Parts fall-off kill height | -500 studs (`FallenPartsDestroyHeight`) | docs |
| Baseplate | current Studio template: 2048×2048 studs, 16 thick, top surface at y=0, 4-stud grid texture (older template was 512×512×20) | Studio template, **verify** |
| Spawn | character placed above the `SpawnLocation`, facing the spawn's front (-Z of the part). 10 s ForceField on spawn | docs |

## 2. Default character (R15, "Classic" blocky body scale)

| Item | Value |
|---|---|
| Rig | R15, 15 visible parts, `HumanoidRootPart` invisible 2×2×1 (`HUMANOID_ROOT_PART_SIZE` in BaseCamera) |
| Collision | only `Head` and torso parts collide; limbs do not (Humanoid docs) |
| Total height | ≈5 studs for the blocky scale (**measure**: Rthro/other bundles differ) |
| `HipHeight` | preset by engine for R15, ≈2.0 for blocky. Root centre height above ground = `HipHeight + RootPart.Size.Y/2` ≈ 3 |
| Head top | root centre + ≈2 studs |
| `WalkSpeed` | 16 studs/s |
| `JumpPower` / `JumpHeight` | 50 / 7.2. `UseJumpPower` defaults **true**, so JumpPower 50 is what runs. Ballistic height at 50 studs/s under 196.2 is 6.37 studs, air time 0.51 s; the 7.2 figure is Roblox's own JumpHeight default and does not equal the ballistic number. **Measure** the real apex in Studio and tune to that, not to either formula |
| `MaxSlopeAngle` | 89° (slides down only above that) |
| `AutoRotate` | true: body turns to face `MoveDirection` ("gradually", rate unpublished, **measure**: subjectively ≈0.1–0.2 s for 180°) |
| `AutoJumpEnabled` | true but only acts on touch input (auto-hop over obstacles) |
| `CameraOffset` | (0,0,0) |
| Step-up | humanoid walks over small ledges without jumping. Threshold unpublished (**measure**: blocky R15 clears ≈1 stud, not 2) |
| Ground contact | the root part floats at HipHeight on an engine "leg" sensor; no leg collision. Replicate with a downward ray from root centre, length `HipHeight + 0.5·RootSize.Y`, and snap |

## 3. Movement (ControlModule + Keyboard)

Pipeline each render frame (`ControlModule:OnRenderStepped`):

1. Controller gives `moveVector` in camera space: `Vector3(left+right, 0, forward+backward)` where forward = -1 on Z, right = +1 on X. Keyboard values are -1/0/1 so diagonals have magnitude √2 (Humanoid normalises).
2. `calculateRawMoveVector` rotates it into world space using only the camera's yaw (XZ projection of the camera back vector). When the camera looks straight up/down it falls back to the right vector.
3. `Player:Move(worldVector, false)` → `Humanoid.MoveDirection` (unit or zero vector). Humanoid moves at `WalkSpeed · |moveVector|` (thumbstick magnitude scales speed; keyboard is always full speed).
4. `Humanoid.Jump = isJumping` every frame while the key is held. Holding Space re-jumps the instant the humanoid lands (bunny-hop is default behaviour).

Humanoid physics facts to copy:

- Acceleration/deceleration to WalkSpeed is near-instant on the default plastic floor (**measure**, treat as ≤0.1 s ramp). No momentum carry-over on stop.
- Air control: full. `MoveDirection` still steers at WalkSpeed while in `Freefall`/`Jumping`.
- Turning: with `RotationType.MovementRelative` (default) the body yaws toward `MoveDirection`; with `CameraRelative` (first person or shift-lock) the body yaws to the camera continuously, even when idle.
- Jump = set vertical velocity to `JumpPower` (50) once; gravity does the rest.
- State machine (from `Enum.HumanoidStateType`): `Running` → `Jumping` (brief) → `Freefall` → `Landed` (brief) → `Running`. Walking off a ledge goes `Running` → `Freefall` directly. Other states (`Climbing` on TrussPart, `Swimming` in terrain water, `Seated`, `FallingDown`/`GettingUp` after a trip, `PlatformStanding`, `Dead`) exist but are out of scope for the barebones replica except as enum names.
- Falling far does no damage by default. Dying (health 0) breaks joints, parts tumble, respawn after `Players.RespawnTime` 5 s.

## 4. Camera (ClassicCamera + Poppercam + TransparencyController)

Mode selection: `StarterPlayer.DevComputerCameraMovementMode = UserChoice` → user setting `Classic` (`ComputerCameraMovementMode.Default` means Classic). `CameraType = Custom`, `CameraSubject = Humanoid`, `DevCameraOcclusionMode = Zoom` (Poppercam). `FieldOfView = 70` **vertical** degrees. Near plane 0.1–0.5 depending on platform.

### 4.1 Focus point (`BaseCamera:GetSubjectPosition`)

```
focus = RootPart.Position + RootPart.CFrame:vectorToWorldSpace(heightOffset + humanoid.CameraOffset)
heightOffset (R15, AutomaticScalingEnabled) = (0, 1.5, 0) + (0, RootPart.Size.Y/2 - 1, 0)   -- = (0,1.5,0) for a 2-tall root
heightOffset (R6)  = (0, 1.5, 0)
```
So the camera orbits a point 1.5 studs above the root centre (roughly the neck). In mouse-lock mode `CameraOffset` is dropped from the focus and added to the camera instead.

### 4.2 Orientation (`CalculateNewLookCFrameFromArg`)

```
pitch clamp: MIN_Y = -80°, MAX_Y = +80°
newLook = CFrame.Angles(0, -rotate.X, 0) * CFrame.new(0, currentLook) * CFrame.Angles(-rotate.Y, 0, 0)
cameraCFrame = lookAlong(focus - zoom * newLook, newLook)
```
No roll, no smoothing, no lag: the camera is rigidly attached to the focus every frame. Yaw is applied in world space, pitch in camera space.

Initial angle on (re)spawn: `INITIAL_CAMERA_ANGLE = fromOrientation(-15°, 0, 0)` applied to the root part's CFrame, so the camera starts behind the character, looking down 15°, at the default zoom.

### 4.3 Rotation input (`CameraInput.getRotation`)

| Device | Constant | Meaning |
|---|---|---|
| Mouse (RMB held, or first person / shift-lock) | `ROTATION_SPEED_MOUSE = (1, 0.77) · rad(0.5)` per pixel of delta | 0.5°/px yaw, 0.385°/px pitch. Not scaled by dt. Multiplied by the user's `MouseSensitivity` (0–4, default 1) |
| Trackpad pan | `(1, 0.77) · rad(7)` per unit | |
| Touch drag | `(1, 0.66) · rad(1)` per pixel, pitch sensitivity shrinks toward 25% near ±90° | |
| Arrow keys ← → | `ROTATION_SPEED_KEYS = rad(120)` per second | yaw only |
| Gamepad right stick | `(1, 0.77) · rad(4) · 60` rad/s times curve `thumbstickCurve` (deadzone 0.1, exponential k=2) and `GamepadCameraSensitivity` | |
| Y invert | user setting, default off | |

Mouse behaviour: in third person the cursor is free; while RMB is held the cursor is locked at its current position (`LockCurrentPosition`) and hidden deltas rotate the camera. Releasing restores the cursor. In first person or shift-lock the cursor is `LockCenter` permanently.

### 4.4 Zoom (`BaseCamera:StepZoom` + `ZoomController`)

| Constant | Value |
|---|---|
| Default distance | 12.5 studs |
| Range | `CameraMinZoomDistance` 0.5 … `CameraMaxZoomDistance` 400 |
| First person | distance < 1.0 (`FIRST_PERSON_DISTANCE_THRESHOLD`) snaps to 0.5 and enters first person; zooming out from 0.5 leaves it |
| Mouse wheel | `ZOOM_SPEED_MOUSE = 1` per wheel notch |
| Keys I / O | `ZOOM_SPEED_KEYS = 0.1` per second held |
| Touch pinch | `0.04` per DIP |
| Curvature | `ZOOM_SENSITIVITY_CURVATURE = 0.5` |

Target update per input `dz` (positive = zoom out):

```
if dz > 0: zoom = zoom + dz*(1 + zoom*0.5)          -- step grows with distance
else:      zoom = (zoom + dz) / (1 - dz*0.5)
```
Spring toward the target: critically damped, `ZOOM_STIFFNESS = 4.5` Hz, clamped to `[0.5, min(maxZoom, popperDistance)]`.

### 4.5 Occlusion (Poppercam)

Each frame the Popper casts from the focus toward the desired camera position (a few sample offsets around the near-plane rectangle, ignoring every player character, non-collidable parts and parts with Transparency ≥ 0.25; docs: parts with "Transparency lower than 0.25" occlude). The camera is pulled in to the hit distance; the zoom spring then eases back out when the path clears. Camera never leaves the focus line, it only shortens.

### 4.6 Character transparency near camera (`TransparencyController`)

```
d = |camera.Focus - camera.CFrame|
t = d < 2 ? 1 - (d - 0.5)/1.5 : 0
if t < 0.5 then t = 0
```
So the character is fully opaque at ≥1.25 studs, fully invisible at ≤0.5 (first person). Tween rate capped at 2.8/s. Applied via `LocalTransparencyModifier` on every BasePart and Decal of the character.

### 4.7 Mouse lock ("shift lock", `MouseLockController`)

- Enabled by `StarterPlayer.EnableMouseLockOption = true` (default). Toggle keys: LeftShift, RightShift.
- While locked: cursor `LockCenter`, custom cursor image `MouseLockedCursor.png`, `RotationType = CameraRelative` (character faces camera yaw), camera offset `CAMERA_OFFSET_DEFAULT = (1.75, 0, 0)` in camera space → over-the-right-shoulder view. Focus stays on the character; the offset shifts the camera pivot.
- Still third person at the current zoom; first person simply ignores the offset.

### 4.8 Follow mode (not default, but one line of code)

`isFollowCamera`: if the user has not panned for `TIME_BEFORE_AUTO_ROTATE = 2` s, the camera yaws to stay behind the movement direction when the angle between camera look and movement exceeds `thetaCutoff = 0.4` rad per second of dt. Default user setting is Classic, so skip unless parity with the settings menu is wanted.

### 4.9 Camera modes summary

| Mode | Default? | Behaviour |
|---|---|---|
| Classic | **yes** | orbit on RMB drag, scroll zoom, no auto-rotate |
| Follow | user option | Classic + auto yaw behind movement |
| CameraToggle | user option, PC only | RMB click toggles free-look |
| Orbital | dev only | fixed elevation |
| LockFirstPerson | dev only | forces zoom 0.5 |

## 5. Controls (default bindings)

Keyboard/mouse (`Enum.PlayerActions` mapped by the engine; alternates are built in):

| Action | Keys |
|---|---|
| Move | W A S D. ↑ ↓ also move forward/back (engine binds them to `CharacterForward`/`CharacterBackward`); ← → rotate the camera instead of strafing |
| Jump | Space |
| Camera orbit | hold Right Mouse Button + drag |
| Zoom | mouse wheel, I (in) / O (out) |
| Shift lock | LeftShift / RightShift |
| Emote menu | `.` (period); `/e wave` etc. in chat |
| Backpack hotbar | 1–9, `` ` `` toggles inventory |
| Chat | `/` |
| Leaderboard | Tab |
| Menu | Esc |
| Reset character | Esc menu → Reset Character (no direct key) |

Gamepad (`Gamepad.lua`, `CameraInput`): left stick move (deadzone 0.2 at the control layer, Humanoid speed scales with magnitude), A jump, right stick camera, L3/R3 toggle first person / mouse lock, R2 = "activate" (tool click), ButtonR1/L1 unused by default, D-pad up/down also move forward/back on TV remotes.

Touch (`DynamicThumbstick` + `TouchJump`): the thumbstick appears wherever the first finger lands in the bottom-left 40% × 2/3 region; dead zone 2 px, full speed at 20 px (×2 on screens >500 px). Jump button 120 px (70 on small screens) bottom-right. Dragging anywhere else orbits the camera; pinch zooms. Auto-jump on obstacles is on.

## 6. Animation (default R15 `Animate` LocalScript)

Engine clones an `Animate` LocalScript into the character. It listens to Humanoid state events and plays `Animation` objects through the `Animator`, choosing one at random by weight when a state has several.

Default asset IDs (R15 standard pack, **community** mirrors agree; docs confirm walk 507777826 and wave 507770239):

| State | Animation (weight) |
|---|---|
| idle | 507766666 (9), 507766951 (1) |
| walk | 507777826 |
| run | 507767714 |
| jump | 507765000 |
| fall | 507767968 |
| climb | 507765644 |
| sit | 2506281703 |
| swim / swimidle | 507784897 / 507785072 |
| toolnone / toolslash / toollunge | 507768375 / 522635514 / 522638767 |
| emotes: wave, point, dance (3), dance2 (3), dance3 (3), laugh, cheer | 507770239, 507770453, 507771019/507771955/507772104, 507776043/507776720/507776879, 507777268/507777451/507777623, 507770818, 507770677 |

Behaviour to copy (**community**, matches the script as commonly mirrored):

- `onRunning(speed)`: if `speed > 0.75` play **walk** with fade 0.2 and `track.Speed = speed / 16` (so WalkSpeed 16 plays the clip at 1×). Below that, play **idle** with fade 0.2. The R15 default never plays `run`; it is used only by the R6 script and by packs that swap it in. Movement speed scaling: speed is the Humanoid's actual ground speed, so slow thumbstick input slows the clip.
- Idle: two clips, re-rolled roughly every 10 s while idle (the script re-picks on each idle entry and on a timer).
- `onJumping`: play **jump** fade 0.1, `jumpAnimTime = jumpAnimDuration = 0.31`; after that time while still airborne switch to **fall** with `fallTransitionTime = 0.2`.
- `onFreeFall` (walked off a ledge): **fall** after the same 0.31 s guard, fade 0.2.
- Landing: Humanoid fires `Running` again → idle/walk with 0.2 fade; there is no dedicated land animation.
- `onClimbing`, `onSwimming`, `onSeated`, `onPlatformStanding`, `onDied`: climb clip speed scales `speed/5`; swim idle vs swim; sit; platform stand = none/freeze; dead = stop everything.
- Tool held: `toolnone` layered at the same time as locomotion (arm raised). Tool activation plays slash/lunge once.
- Emotes play on top of idle and are cancelled by moving (`movedDuringEmote` check).
- All locomotion clips loop except jump. Fade-in is the `AnimationTrack:Play(fadeTime)` argument; the engine cross-fades on the `Animator`.

For the Three.js replica the practical choice is to export the default clips (or re-author approximations) as glTF animations on an R15-proportioned skinned mesh, or use a jointed box rig with Motor6D-style transforms and author the eight clips by hand.

## 7. Default character sounds (`RbxCharacterSounds`)

| State | Asset | Notes |
|---|---|---|
| Running | `sounds/action_footsteps_plastic.mp3` looped, volume 0.65, speed scaled by ground speed | footsteps |
| Jumping | `sounds/action_jump.mp3` | one-shot |
| Landed | `sounds/action_jump_land.mp3`, volume = clamp(map(fallSpeed, 50, 100, 0, 1)) | silent for short hops |
| FreeFall | `sounds/action_falling.ogg` looped, fades in at 0.9/s | only audible on long falls |
| GettingUp / FallingDown | `action_get_up.mp3` / `uuhhh.mp3` | |
| Swimming / splash | `action_swim.mp3` (speed 1.6) / `impact_water.mp3` | out of scope |
| Death | `uuhhh.mp3` | |

## 8. UI drawn by the engine (reference only)

Top bar: Roblox menu button, chat toggle, leaderboard toggle, emote button. Bottom: backpack hotbar (hidden when empty). Name/health billboard over other players within 100 studs. Cursor: default arrow, `MouseLockedCursor.png` in shift lock. None of this is needed for movement parity; include only a crosshair-free view and an optional debug overlay.

## 9. Things that must be measured in Studio before tuning

1. Actual jump apex height and air time with JumpPower 50 (expect ≈6.4–7.2 studs).
2. AutoRotate angular rate (deg/s) and whether it is a constant rate or a spring.
3. Time to reach 16 studs/s from rest and to stop (expect ≤0.1 s).
4. Maximum step-up height for the blocky R15 rig.
5. Jump re-trigger delay when Space is held (Landed state duration).
6. Blocky R15 part sizes and HipHeight for the Studio default avatar (used to build the box rig).

## 10. Mapping to the Lua structure the prototype must convert to

| Three.js module (proposed) | Roblox counterpart | Notes |
|---|---|---|
| `World` (gravity, baseplate, spawn) | `Workspace`, `SpawnLocation` | constants table |
| `Character` (box rig, humanoid state, WalkSpeed/JumpPower) | `Humanoid` + R15 Model | expose the same property names |
| `ControlModule` (`getMoveVector`, `isJumping`) | `PlayerModule.ControlModule` + `Keyboard`/`Gamepad`/`DynamicThumbstick` | keep the camera-relative transform identical |
| `CameraModule` (`ClassicCamera`, `ZoomController`, `Poppercam`, `TransparencyController`, `MouseLock`) | same names in `PlayerModule.CameraModule` | one file per module to keep the port 1:1 |
| `Animate` (state → clip, weights, fade, speed scaling) | `Animate` LocalScript | same table shape `{idle={{id,weight},…}, walk=…}` |
| `CharacterSounds` | `RbxCharacterSounds` | optional |

Keeping these names and the constants above verbatim is what makes the later conversion to Luau mechanical rather than a rewrite.
