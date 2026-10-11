// CameraInput.js
// Port of CameraModule/CameraInput.lua: turns raw input into rotation and zoom
// deltas for the camera controllers.
import * as THREE from "three";
import { Config, UserGameSettings } from "./Config.js";
import { UserInputService } from "./UserInputService.js";
import { Workspace } from "./World.js";
import { Signal } from "./Signal.js";
import { tick } from "./RunService.js";

const MB_TAP_LENGTH = 0.3; // (s) length of time for a short mouse button tap to be registered

// These read Config each call so the settings panel can tune them live.
const ROTATION_SPEED_KEYS = () => Config.ROTATION_SPEED_KEYS; // (rad/s)
const vec2Speed = (s) => new THREE.Vector2(s.x * s.scale, s.y * s.scale);
const ROTATION_SPEED_GAMEPAD = () => vec2Speed(Config.ROTATION_SPEED_GAMEPAD); // (rad/s)
// these speeds should not be scaled by dt because the input returned is not normalized.
const ROTATION_SPEED_MOUSE = () => vec2Speed(Config.ROTATION_SPEED_MOUSE); // (rad/inputdelta)
const ROTATION_SPEED_POINTERACTION = new THREE.Vector2(1, 0.77).multiplyScalar(7 * Math.PI / 180); // (rad/inputdelta)
const ROTATION_SPEED_TOUCH = () => vec2Speed(Config.ROTATION_SPEED_TOUCH); // (rad/inputdelta)

const ZOOM_SPEED_MOUSE = () => Config.ZOOM_SPEED_MOUSE; // (scaled studs/wheel click)
const ZOOM_SPEED_KEYS = () => Config.ZOOM_SPEED_KEYS; // (studs/s)
const ZOOM_SPEED_TOUCH = () => Config.ZOOM_SPEED_TOUCH; // (scaled studs/DIP %)

const MIN_TOUCH_SENSITIVITY_FRACTION = Config.MIN_TOUCH_SENSITIVITY_FRACTION; // 25% sensitivity at 90°

// right mouse button up & down events
const rmbDown = new Signal();
const rmbUp = new Signal();
UserInputService.InputBegan.Connect((input, gpe) => {
	if (!gpe && input.UserInputType === "MouseButton2") rmbDown.Fire();
});
UserInputService.InputEnded.Connect((input) => {
	if (input.UserInputType === "MouseButton2") rmbUp.Fire();
});

const K_CURVATURE = Config.THUMBSTICK_CURVATURE; // amount of upwards curvature (0 is flat)
const K_DEADZONE = Config.THUMBSTICK_DEADZONE; // deadzone
function thumbstickCurve(x) {
	// remove sign, apply linear deadzone
	const fDeadzone = (Math.abs(x) - K_DEADZONE) / (1 - K_DEADZONE);
	// apply exponential curve and scale to fit in [0, 1]
	const fCurve = (Math.exp(K_CURVATURE * fDeadzone) - 1) / (Math.exp(K_CURVATURE) - 1);
	// reapply sign and clamp
	return Math.sign(x) * Math.min(Math.max(fCurve, 0), 1);
}

// Adjust the touch sensitivity so that sensitivity is reduced when swiping up
// or down, but stays the same when swiping towards the middle of the screen
function adjustTouchPitchSensitivity(delta) {
	const camera = Workspace.CurrentCamera;
	if (!camera) return delta;

	// get the camera pitch in world space
	const pitch = camera.CFrame.ToEulerAnglesYXZ()[0];

	if (delta.y * pitch >= 0) {
		// do not reduce sensitivity when pitching towards the horizon
		return delta;
	}

	// set up a line to fit:
	// 1 = f(0)
	// 0 = f(±pi/2)
	const curveY = 1 - (2 * Math.abs(pitch) / Math.PI) ** 0.75;

	// remap curveY from [0, 1] -> [MIN_TOUCH_SENSITIVITY_FRACTION, 1]
	const sensitivity = curveY * (1 - MIN_TOUCH_SENSITIVITY_FRACTION) + MIN_TOUCH_SENSITIVITY_FRACTION;

	return new THREE.Vector2(delta.x, sensitivity * delta.y);
}

function isInDynamicThumbstickArea(pos) {
	const touchGui = document.getElementById("TouchGui");
	const thumbstickFrame = document.getElementById("DynamicThumbstickFrame");
	if (!thumbstickFrame || !touchGui) return false;
	if (touchGui.hidden || thumbstickFrame.hidden) return false;

	const rect = thumbstickFrame.getBoundingClientRect();
	return pos.x >= rect.left && pos.y >= rect.top && pos.x <= rect.right && pos.y <= rect.bottom;
}

export const CameraInput = {};

{
	let connectionList = [];
	let panInputCount = 0;

	const incPanInputCount = () => { panInputCount = Math.max(0, panInputCount + 1); };
	const decPanInputCount = () => { panInputCount = Math.max(0, panInputCount - 1); };
	const resetPanInputCount = () => { panInputCount = 0; };

	const gamepadState = {
		Thumbstick2: new THREE.Vector2(),
	};
	const keyboardState = {
		Left: 0,
		Right: 0,
		I: 0,
		O: 0,
	};
	const mouseState = {
		Movement: new THREE.Vector2(),
		Wheel: 0, // PointerAction
		Pan: new THREE.Vector2(), // PointerAction
		Pinch: 0, // PointerAction
	};
	const touchState = {
		Move: new THREE.Vector2(),
		Pinch: 0,
	};

	CameraInput.gamepadZoomPress = new Signal();

	CameraInput.getRotationActivated = function () {
		return panInputCount > 0 || gamepadState.Thumbstick2.length() > 0;
	};

	CameraInput.getRotation = function (dt, disableKeyboardRotation) {
		const inversionVector = new THREE.Vector2(1, UserGameSettings.GetCameraYInvertValue());

		// keyboard input is non-coalesced, so must account for time delta
		let kKeyboard = new THREE.Vector2(keyboardState.Right - keyboardState.Left, 0).multiplyScalar(dt);
		const kGamepad = gamepadState.Thumbstick2.clone().multiplyScalar(UserGameSettings.GamepadCameraSensitivity * dt);
		const kMouse = mouseState.Movement.clone();
		const kPointerAction = mouseState.Pan.clone();
		const kTouch = adjustTouchPitchSensitivity(touchState.Move.clone());

		if (disableKeyboardRotation) kKeyboard = new THREE.Vector2();

		const result = kKeyboard.multiplyScalar(ROTATION_SPEED_KEYS())
			.add(kGamepad.multiply(ROTATION_SPEED_GAMEPAD()))
			.add(kMouse.multiply(ROTATION_SPEED_MOUSE()))
			.add(kPointerAction.multiply(ROTATION_SPEED_POINTERACTION))
			.add(kTouch.multiply(ROTATION_SPEED_TOUCH()));

		return result.multiply(inversionVector);
	};

	CameraInput.getZoomDelta = function () {
		const kKeyboard = keyboardState.O - keyboardState.I;
		const kMouse = -mouseState.Wheel + mouseState.Pinch;
		const kTouch = -touchState.Pinch;
		return kKeyboard * ZOOM_SPEED_KEYS() + kMouse * ZOOM_SPEED_MOUSE() + kTouch * ZOOM_SPEED_TOUCH();
	};

	function thumbstick(input) {
		const position = input.Position;
		gamepadState[input.KeyCode] = new THREE.Vector2(thumbstickCurve(position.x), -thumbstickCurve(position.y));
	}

	function mouseMovement(input) {
		const delta = input.Delta;
		mouseState.Movement = new THREE.Vector2(delta.x, delta.y);
	}

	function keypress(input, state) {
		keyboardState[input.KeyCode] = state === "Begin" ? 1 : 0;
	}

	function gamepadZoomPress(state) {
		if (state === "Begin") CameraInput.gamepadZoomPress.Fire();
	}

	function resetInputDevices() {
		gamepadState.Thumbstick2 = new THREE.Vector2();
		for (const k of Object.keys(keyboardState)) keyboardState[k] = 0;
		mouseState.Movement = new THREE.Vector2();
		mouseState.Wheel = 0;
		mouseState.Pan = new THREE.Vector2();
		mouseState.Pinch = 0;
		touchState.Move = new THREE.Vector2();
		touchState.Pinch = 0;
		resetPanInputCount();
	}

	// Use TouchPan & TouchPinch when they work in the Studio emulator
	let touches = new Map(); // {[InputObject] = sunk}
	let dynamicThumbstickInput = null; // Special-cased
	let lastPinchDiameter = null;

	function touchBegan(input, sunk) {
		if (dynamicThumbstickInput === null && isInDynamicThumbstickArea(input.Position) && !sunk) {
			// any finger down starting in the dynamic thumbstick area should always be
			// ignored for camera purposes. these must be handled specially from all other
			// inputs, as the DT does not sink inputs by itself
			dynamicThumbstickInput = input;
			return;
		}

		if (!sunk) incPanInputCount();

		// register the finger
		touches.set(input, sunk);
	}

	function touchEnded(input) {
		// reset the DT input
		if (input === dynamicThumbstickInput) dynamicThumbstickInput = null;

		// reset pinch state if one unsunk finger lifts
		if (touches.get(input) === false) {
			lastPinchDiameter = null;
			decPanInputCount();
		}

		// unregister input
		touches.delete(input);
	}

	function touchChanged(input) {
		// ignore movement from the DT finger
		if (input === dynamicThumbstickInput) return;

		// fixup unknown touches
		if (!touches.has(input)) touches.set(input, true);

		// collect unsunk touches
		const unsunkTouches = [];
		for (const [touch, sunk] of touches) if (!sunk) unsunkTouches.push(touch);

		// 1 finger: pan
		if (unsunkTouches.length === 1) {
			if (touches.get(input) === false) {
				const delta = input.Delta;
				touchState.Move.add(new THREE.Vector2(delta.x, delta.y)); // total touch pan movement (reset at end of frame)
			}
		}

		// 2 fingers: pinch
		if (unsunkTouches.length === 2) {
			const pinchDiameter = unsunkTouches[0].Position.distanceTo(unsunkTouches[1].Position);
			if (lastPinchDiameter !== null) touchState.Pinch += pinchDiameter - lastPinchDiameter;
			lastPinchDiameter = pinchDiameter;
		} else {
			lastPinchDiameter = null;
		}
	}

	function resetTouchState() {
		touches = new Map();
		dynamicThumbstickInput = null;
		lastPinchDiameter = null;
		resetPanInputCount();
	}

	function pointerAction(wheel, pan, pinch, gpe) {
		if (!gpe) {
			mouseState.Wheel = wheel;
			mouseState.Pan = pan;
			mouseState.Pinch = -pinch;
		}
	}

	const KEYPRESS_KEYS = new Set(["Left", "Right", "I", "O"]);

	function inputBegan(input, sunk) {
		if (input.UserInputType === "Touch") {
			touchBegan(input, sunk);
		} else if (input.UserInputType === "MouseButton2" && !sunk) {
			incPanInputCount();
		} else if (input.UserInputType === "Keyboard" && KEYPRESS_KEYS.has(input.KeyCode) && !sunk) {
			keypress(input, "Begin"); // RbxCameraKeypress
		} else if (input.KeyCode === "ButtonR3") {
			gamepadZoomPress("Begin"); // RbxCameraGamepadZoom
		}
	}

	function inputChanged(input) {
		if (input.UserInputType === "Touch") {
			touchChanged(input);
		} else if (input.UserInputType === "MouseMovement") {
			mouseMovement(input);
		} else if (input.KeyCode === "Thumbstick2") {
			thumbstick(input); // RbxCameraThumbstick
		}
	}

	function inputEnded(input) {
		if (input.UserInputType === "Touch") {
			touchEnded(input);
		} else if (input.UserInputType === "MouseButton2") {
			decPanInputCount();
		} else if (input.UserInputType === "Keyboard" && KEYPRESS_KEYS.has(input.KeyCode)) {
			keypress(input, "End");
		}
	}

	let inputEnabled = false;

	CameraInput.setInputEnabled = function (_inputEnabled) {
		if (inputEnabled === _inputEnabled) return;
		inputEnabled = _inputEnabled;

		resetInputDevices();
		resetTouchState();

		if (inputEnabled) {
			connectionList.push(UserInputService.InputBegan.Connect(inputBegan));
			connectionList.push(UserInputService.InputChanged.Connect(inputChanged));
			connectionList.push(UserInputService.InputEnded.Connect(inputEnded));
			connectionList.push(UserInputService.PointerAction.Connect(pointerAction));
		} else {
			for (const conn of connectionList) conn.Disconnect();
			connectionList = [];
		}
	};

	CameraInput.getInputEnabled = function () {
		return inputEnabled;
	};

	CameraInput.resetInputForFrameEnd = function () {
		mouseState.Movement = new THREE.Vector2();
		touchState.Move = new THREE.Vector2();
		touchState.Pinch = 0;

		mouseState.Wheel = 0; // PointerAction
		mouseState.Pan = new THREE.Vector2(); // PointerAction
		mouseState.Pinch = 0; // PointerAction
	};

	UserInputService.WindowFocused.Connect(resetInputDevices);
	UserInputService.WindowFocusReleased.Connect(resetInputDevices);
}

// Toggle pan
{
	let holdPan = false;
	let togglePan = false;
	let lastRmbDown = 0; // tick() timestamp of the last right mouse button down event

	CameraInput.getHoldPan = () => holdPan;
	CameraInput.getTogglePan = () => togglePan;
	CameraInput.getPanning = () => togglePan || holdPan;
	CameraInput.setTogglePan = (value) => { togglePan = value; };

	let cameraToggleInputEnabled = false;
	let rmbDownConnection = null;
	let rmbUpConnection = null;

	CameraInput.enableCameraToggleInput = function () {
		if (cameraToggleInputEnabled) return;
		cameraToggleInputEnabled = true;

		holdPan = false;
		togglePan = false;

		if (rmbDownConnection) rmbDownConnection.Disconnect();
		if (rmbUpConnection) rmbUpConnection.Disconnect();

		rmbDownConnection = rmbDown.Connect(() => {
			holdPan = true;
			lastRmbDown = tick();
		});

		rmbUpConnection = rmbUp.Connect(() => {
			holdPan = false;
			if (tick() - lastRmbDown < MB_TAP_LENGTH && (togglePan || UserInputService.GetMouseDelta().length() < 2)) {
				togglePan = !togglePan;
			}
		});
	};

	CameraInput.disableCameraToggleInput = function () {
		if (!cameraToggleInputEnabled) return;
		cameraToggleInputEnabled = false;

		if (rmbDownConnection) { rmbDownConnection.Disconnect(); rmbDownConnection = null; }
		if (rmbUpConnection) { rmbUpConnection.Disconnect(); rmbUpConnection = null; }
	};
}
