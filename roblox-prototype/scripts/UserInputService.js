// UserInputService.js
// Turns DOM events into Roblox InputObjects (InputBegan/InputChanged/InputEnded,
// PointerAction) so the PlayerModule ports can consume them unchanged. Also owns
// MouseBehavior (pointer lock), PreferredInput and gamepad polling.
import * as THREE from "three";
import { Signal } from "./Signal.js";
import { UserGameSettings } from "./Config.js";

const KEY_CODES = {
	KeyW: "W", KeyA: "A", KeyS: "S", KeyD: "D", KeyI: "I", KeyO: "O",
	ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right",
	Space: "Space", ShiftLeft: "LeftShift", ShiftRight: "RightShift",
	F3: "F3", Escape: "Escape", Period: "Period", Slash: "Slash", Tab: "Tab",
};
const PREVENT_DEFAULT_KEYS = new Set(["Space", "Up", "Down", "Left", "Right", "F3", "Tab", "Slash"]);

// Standard Gamepad API mapping -> Enum.KeyCode
const GAMEPAD_BUTTONS = [
	"ButtonA", "ButtonB", "ButtonX", "ButtonY", "ButtonL1", "ButtonR1", "ButtonL2", "ButtonR2",
	"ButtonSelect", "ButtonStart", "ButtonL3", "ButtonR3", "DPadUp", "DPadDown", "DPadLeft", "DPadRight",
];
const GAMEPAD_ACTIVITY_THRESHOLD = 0.3;
const BOGUS_MOVEMENT_PX = 200;

class InputObject {
	constructor(UserInputType, KeyCode = "Unknown") {
		this.UserInputType = UserInputType;
		this.KeyCode = KeyCode;
		this.UserInputState = "None";
		this.Position = new THREE.Vector3();
		this.Delta = new THREE.Vector3();
	}
}

function keyCodeFromEvent(event) {
	if (KEY_CODES[event.code]) return KEY_CODES[event.code];
	if (event.code.startsWith("Key")) return event.code.slice(3);
	return event.code || "Unknown";
}

function isTextInput(target) {
	if (!target || !target.tagName) return false;
	const tag = target.tagName.toLowerCase();
	return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function isSunkTarget(target) {
	return !!(target && target.closest && target.closest("[data-sink-input]"));
}

class UserInputServiceClass {
	constructor() {
		this.InputBegan = new Signal();
		this.InputChanged = new Signal();
		this.InputEnded = new Signal();
		this.PointerAction = new Signal(); // (wheel, pan, pinch, gameProcessed)
		this.PreferredInputChanged = new Signal();
		this.MouseBehaviorChanged = new Signal();
		this.GamepadConnected = new Signal();
		this.GamepadDisconnected = new Signal();
		this.WindowFocusReleased = new Signal();
		this.WindowFocused = new Signal();
		// Fired right after an input event that carries user activation, so the
		// camera can apply MouseBehavior while requestPointerLock is still allowed.
		this.UserGestureProcessed = new Signal();

		this.KeyboardEnabled = true;
		this.TouchEnabled = typeof window !== "undefined" && "ontouchstart" in window;
		this.GamepadEnabled = false;
		this.PreferredInput = "KeyboardAndMouse";
		this.MouseIconEnabled = true;

		this._mouseBehavior = "Default";
		this._mouseIcon = "";
		this._canvas = null;
		this._inGesture = false;
		this._pointerLockFallback = false; // lock wanted but not granted: use movementX/Y with a hidden cursor
		this._pointerLockSuspended = false; // user left pointer lock (Esc): free cursor until next click
		this._exitingPointerLock = false;
		this._skipNextMouseMove = false;
		this._mouseAccum = new THREE.Vector2();
		this._lastMouseDelta = new THREE.Vector2();
		this._wheelAccum = 0;
		this._mouseInput = new InputObject("MouseMovement");
		this._mousePosition = new THREE.Vector2();
		this._keysDown = new Map();
		this._mouseButtonsDown = new Map();
		this._touches = new Map();
		this._gamepadState = null;
		this._gamepadInputs = new Map();
	}

	Init(canvas, cursorElement) {
		this._canvas = canvas;
		this._cursorElement = cursorElement;
		const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
		const fine = window.matchMedia && window.matchMedia("(any-pointer: fine)").matches;
		if (coarse && !fine) this.PreferredInput = "Touch";

		window.addEventListener("keydown", (e) => this._onKeyDown(e));
		window.addEventListener("keyup", (e) => this._onKeyUp(e));
		canvas.addEventListener("mousedown", (e) => this._onMouseDown(e));
		window.addEventListener("mouseup", (e) => this._onMouseUp(e));
		window.addEventListener("mousemove", (e) => this._onMouseMove(e));
		canvas.addEventListener("wheel", (e) => this._onWheel(e), { passive: false });
		canvas.addEventListener("contextmenu", (e) => e.preventDefault());
		window.addEventListener("touchstart", (e) => this._onTouch(e, "Begin"), { passive: false });
		window.addEventListener("touchmove", (e) => this._onTouch(e, "Change"), { passive: false });
		window.addEventListener("touchend", (e) => this._onTouch(e, "End"), { passive: false });
		window.addEventListener("touchcancel", (e) => this._onTouch(e, "Cancel"), { passive: false });
		window.addEventListener("blur", () => this._onWindowBlur());
		window.addEventListener("focus", () => this.WindowFocused.Fire());
		document.addEventListener("pointerlockchange", () => this._onPointerLockChange());
		document.addEventListener("pointerlockerror", () => this._onPointerLockRefused());
		window.addEventListener("gamepadconnected", () => { this.GamepadEnabled = true; this.GamepadConnected.Fire("Gamepad1"); });
		window.addEventListener("gamepaddisconnected", () => this._onGamepadDisconnected());
	}

	// --- MouseBehavior -------------------------------------------------------

	get MouseBehavior() {
		return this._mouseBehavior;
	}

	set MouseBehavior(value) {
		const changed = value !== this._mouseBehavior;
		const wantsLock = value !== "Default";
		if (!changed && !(this._inGesture && wantsLock && !this._isPointerLocked())) return;
		this._mouseBehavior = value;
		this._applyMouseBehavior();
		if (changed) this.MouseBehaviorChanged.Fire(value);
	}

	get MouseIcon() {
		return this._mouseIcon;
	}

	set MouseIcon(value) {
		this._mouseIcon = value;
		this._updateCursor();
	}

	GetMouseDelta() {
		return this._lastMouseDelta.clone();
	}

	GetMouseLocation() {
		return this._mousePosition.clone();
	}

	_isPointerLocked() {
		return !!this._canvas && document.pointerLockElement === this._canvas;
	}

	_applyMouseBehavior() {
		const wantsLock = this._mouseBehavior !== "Default" && this.PreferredInput === "KeyboardAndMouse";
		if (!wantsLock) {
			this._pointerLockFallback = false;
			this._pointerLockSuspended = false;
			if (this._isPointerLocked()) {
				this._exitingPointerLock = true;
				document.exitPointerLock();
			}
		} else if (!this._isPointerLocked()) {
			if (this._inGesture) {
				this._pointerLockSuspended = false;
				this._requestPointerLock();
			} else if (!this._pointerLockSuspended) {
				// No user activation (e.g. wheel into first person): hide the cursor and
				// read movementX/Y until the next click can take the lock.
				if (!this._pointerLockFallback) this._skipNextMouseMove = true;
				this._pointerLockFallback = true;
			}
		}
		this._updateCursor();
	}

	_requestPointerLock() {
		if (!this._canvas || !this._canvas.requestPointerLock) {
			this._onPointerLockRefused();
			return;
		}
		this._pointerLockFallback = true; // until pointerlockchange confirms
		try {
			const result = this._canvas.requestPointerLock();
			if (result && typeof result.catch === "function") result.catch(() => this._onPointerLockRefused());
		} catch {
			this._onPointerLockRefused();
		}
	}

	_onPointerLockChange() {
		// Browsers can report one bogus movementX/Y jump right after the lock changes.
		this._skipNextMouseMove = true;
		if (this._isPointerLocked()) {
			this._pointerLockFallback = false;
			this._pointerLockSuspended = false;
		} else if (this._mouseBehavior !== "Default" && !this._exitingPointerLock) {
			// The browser released the lock (Esc). Free the cursor, like the Roblox menu does.
			this._pointerLockSuspended = true;
			this._pointerLockFallback = false;
		}
		this._exitingPointerLock = false;
		this._updateCursor();
	}

	_onPointerLockRefused() {
		if (this._mouseBehavior !== "Default") this._pointerLockFallback = true;
		this._updateCursor();
	}

	// Roblox quirk: mouse movement Delta is only reported while the mouse is locked
	// (MouseBehavior LockCenter / LockCurrentPosition); with Default it reads zero.
	_mouseDeltaActive() {
		return this._mouseBehavior !== "Default" && !this._pointerLockSuspended;
	}

	_updateCursor() {
		if (!this._canvas) return;
		const hide = this._mouseDeltaActive() && this.PreferredInput === "KeyboardAndMouse";
		this._canvas.style.cursor = hide ? "none" : "default";
		if (this._cursorElement) {
			const show = this._mouseBehavior === "LockCenter" && this._mouseIcon !== "" && !this._pointerLockSuspended
				&& this.PreferredInput === "KeyboardAndMouse";
			this._cursorElement.hidden = !show;
			this._cursorElement.dataset.icon = this._mouseIcon.includes("Cross") ? "cross" : "mouselock";
		}
	}

	// --- PreferredInput ------------------------------------------------------

	_setPreferredInput(value) {
		if (this.PreferredInput === value) return;
		this.PreferredInput = value;
		this._applyMouseBehavior();
		this.PreferredInputChanged.Fire(value);
	}

	// --- Keyboard ------------------------------------------------------------

	_onKeyDown(event) {
		const keyCode = keyCodeFromEvent(event);
		const gameProcessed = isTextInput(event.target);
		if (!gameProcessed && PREVENT_DEFAULT_KEYS.has(keyCode)) event.preventDefault();
		if (event.repeat || this._keysDown.has(keyCode)) return;
		const input = new InputObject("Keyboard", keyCode);
		input.UserInputState = "Begin";
		this._keysDown.set(keyCode, input);
		this._setPreferredInput("KeyboardAndMouse");
		this._gesture(() => this.InputBegan.Fire(input, gameProcessed));
	}

	_onKeyUp(event) {
		const keyCode = keyCodeFromEvent(event);
		const input = this._keysDown.get(keyCode);
		if (!input) return;
		this._keysDown.delete(keyCode);
		input.UserInputState = "End";
		this.InputEnded.Fire(input, isTextInput(event.target));
	}

	_onWindowBlur() {
		for (const [keyCode, input] of this._keysDown) {
			input.UserInputState = "End";
			this.InputEnded.Fire(input, false);
			this._keysDown.delete(keyCode);
		}
		for (const [button, input] of this._mouseButtonsDown) {
			input.UserInputState = "End";
			this.InputEnded.Fire(input, false);
			this._mouseButtonsDown.delete(button);
		}
		this.WindowFocusReleased.Fire();
	}

	IsKeyDown(keyCode) {
		return this._keysDown.has(keyCode);
	}

	// --- Mouse ---------------------------------------------------------------

	_onMouseDown(event) {
		const type = event.button === 0 ? "MouseButton1" : event.button === 2 ? "MouseButton2" : event.button === 1 ? "MouseButton3" : null;
		if (!type) return;
		event.preventDefault();
		if (this._canvas && document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
		const input = new InputObject(type);
		input.UserInputState = "Begin";
		input.Position.set(event.clientX, event.clientY, 0);
		this._mouseButtonsDown.set(type, input);
		this._setPreferredInput("KeyboardAndMouse");
		this._gesture(() => this.InputBegan.Fire(input, false));
	}

	_onMouseUp(event) {
		const type = event.button === 0 ? "MouseButton1" : event.button === 2 ? "MouseButton2" : event.button === 1 ? "MouseButton3" : null;
		const input = type && this._mouseButtonsDown.get(type);
		if (!input) return;
		this._mouseButtonsDown.delete(type);
		input.UserInputState = "End";
		input.Position.set(event.clientX, event.clientY, 0);
		this._gesture(() => this.InputEnded.Fire(input, false));
	}

	_onMouseMove(event) {
		this._mousePosition.set(event.clientX, event.clientY);
		if (this._skipNextMouseMove) {
			this._skipNextMouseMove = false;
			if (Math.abs(event.movementX) + Math.abs(event.movementY) > BOGUS_MOVEMENT_PX) return;
		}
		if (event.movementX || event.movementY) {
			if (this.PreferredInput !== "KeyboardAndMouse" && Math.abs(event.movementX) + Math.abs(event.movementY) > 2) {
				this._setPreferredInput("KeyboardAndMouse");
			}
			if (this._mouseDeltaActive()) this._mouseAccum.x += event.movementX, this._mouseAccum.y += event.movementY;
		}
	}

	_onWheel(event) {
		event.preventDefault();
		if (event.deltaY === 0) return;
		// One notch per wheel event regardless of deltaMode (lines or pixels).
		this._wheelAccum += -Math.sign(event.deltaY);
		this._setPreferredInput("KeyboardAndMouse");
	}

	_gesture(fn) {
		this._inGesture = true;
		try {
			fn();
			this.UserGestureProcessed.Fire();
		} finally {
			this._inGesture = false;
		}
	}

	// --- Touch ---------------------------------------------------------------

	_onTouch(event, state) {
		const target = event.target;
		const inPanel = target && target.closest && target.closest("[data-panel]");
		if (!inPanel) event.preventDefault();
		if (state === "Begin") this._setPreferredInput("Touch");
		for (const touch of event.changedTouches) {
			let input = this._touches.get(touch.identifier);
			if (state === "Begin") {
				input = new InputObject("Touch");
				input._sunk = !!inPanel || isSunkTarget(target);
				input.Position.set(touch.clientX, touch.clientY, 0);
				input.UserInputState = "Begin";
				this._touches.set(touch.identifier, input);
				this.InputBegan.Fire(input, input._sunk);
				continue;
			}
			if (!input) continue;
			input.Delta.set(touch.clientX - input.Position.x, touch.clientY - input.Position.y, 0);
			input.Position.set(touch.clientX, touch.clientY, 0);
			if (state === "Change") {
				input.UserInputState = "Change";
				this.InputChanged.Fire(input, input._sunk);
			} else {
				input.UserInputState = state === "Cancel" ? "Cancel" : "End";
				this._touches.delete(touch.identifier);
				this._gesture(() => this.InputEnded.Fire(input, input._sunk));
			}
		}
	}

	// --- Gamepad -------------------------------------------------------------

	GetConnectedGamepads() {
		return this._getGamepad() ? ["Gamepad1"] : [];
	}

	_getGamepad() {
		const pads = navigator.getGamepads ? navigator.getGamepads() : [];
		for (const pad of pads) if (pad && pad.connected) return pad;
		return null;
	}

	_onGamepadDisconnected() {
		this.GamepadEnabled = !!this._getGamepad();
		if (!this.GamepadEnabled && this.PreferredInput === "Gamepad") this._setPreferredInput("KeyboardAndMouse");
		this.GamepadDisconnected.Fire("Gamepad1");
	}

	_gamepadInput(keyCode) {
		let input = this._gamepadInputs.get(keyCode);
		if (!input) {
			input = new InputObject("Gamepad1", keyCode);
			this._gamepadInputs.set(keyCode, input);
		}
		return input;
	}

	_pollGamepad() {
		const pad = this._getGamepad();
		if (!pad) return;
		this.GamepadEnabled = true;
		const prev = this._gamepadState || { buttons: [], axes: [0, 0, 0, 0] };
		const axes = [pad.axes[0] || 0, -(pad.axes[1] || 0), pad.axes[2] || 0, -(pad.axes[3] || 0)];
		const sticks = [["Thumbstick1", 0], ["Thumbstick2", 2]];
		for (const [keyCode, i] of sticks) {
			const x = axes[i], y = axes[i + 1];
			if (x !== prev.axes[i] || y !== prev.axes[i + 1]) {
				const input = this._gamepadInput(keyCode);
				input.Delta.set(x - input.Position.x, y - input.Position.y, 0);
				input.Position.set(x, y, 0);
				input.UserInputState = "Change";
				if (Math.hypot(x, y) > GAMEPAD_ACTIVITY_THRESHOLD) this._setPreferredInput("Gamepad");
				this.InputChanged.Fire(input, false);
			}
		}
		const buttons = pad.buttons.map((b) => (typeof b === "object" ? b.pressed : b === 1));
		for (let i = 0; i < GAMEPAD_BUTTONS.length && i < buttons.length; i++) {
			if (buttons[i] === !!prev.buttons[i]) continue;
			const input = this._gamepadInput(GAMEPAD_BUTTONS[i]);
			input.Position.set(0, 0, buttons[i] ? 1 : 0);
			if (buttons[i]) {
				this._setPreferredInput("Gamepad");
				input.UserInputState = "Begin";
				this.InputBegan.Fire(input, false);
			} else {
				input.UserInputState = "End";
				this.InputEnded.Fire(input, false);
			}
		}
		this._gamepadState = { buttons, axes };
	}

	// --- Per frame -----------------------------------------------------------

	// Called once at the start of every frame, before the Input render step.
	Step() {
		this._pollGamepad();
		// The engine coalesces mouse movement into one InputChanged per frame, and
		// scales it by UserGameSettings.MouseSensitivity before scripts see it.
		this._lastMouseDelta.copy(this._mouseAccum);
		if (this._mouseAccum.x !== 0 || this._mouseAccum.y !== 0) {
			const sensitivity = UserGameSettings.MouseSensitivity;
			const input = this._mouseInput;
			input.Delta.set(this._mouseAccum.x * sensitivity, this._mouseAccum.y * sensitivity, 0);
			input.Position.set(this._mousePosition.x, this._mousePosition.y, 0);
			input.UserInputState = "Change";
			this._mouseAccum.set(0, 0);
			this.InputChanged.Fire(input, false);
		}
		if (this._wheelAccum !== 0) {
			const wheel = this._wheelAccum;
			this._wheelAccum = 0;
			const input = new InputObject("MouseWheel");
			input.Position.set(this._mousePosition.x, this._mousePosition.y, wheel);
			input.UserInputState = "Change";
			this.InputChanged.Fire(input, false);
			this.PointerAction.Fire(wheel, new THREE.Vector2(), 0, false);
		}
	}
}

export const UserInputService = new UserInputServiceClass();
