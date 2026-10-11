// CameraUtils.js
// Port of CameraModule/CameraUtils.lua (the parts the Classic camera uses).
import { UserInputService } from "./UserInputService.js";
import { UserGameSettings } from "./Config.js";
export { getAngleBetweenXZVectors as GetAngleBetweenXZVectors } from "./CFrame.js";

// Critically damped spring class for fluid motion effects
export class Spring {
	constructor(freq, pos) {
		this.freq = freq;
		this.goal = pos;
		this.pos = pos;
		this.vel = 0;
	}

	step(dt) {
		const f = this.freq * 2.0 * Math.PI;
		const g = this.goal;
		const p0 = this.pos;
		const v0 = this.vel;

		const offset = p0 - g;
		const decay = Math.exp(-f * dt);

		const p1 = (offset * (1 + f * dt) + v0 * dt) * decay + g;
		const v1 = (v0 * (1 - f * dt) - offset * (f * f * dt)) * decay;

		this.pos = p1;
		this.vel = v1;
		return p1;
	}
}

export function map(x, inMin, inMax, outMin, outMax) {
	return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export function clamp(x, lo, hi) {
	return Math.min(Math.max(x, lo), hi);
}

export function sanitizeAngle(a) {
	return ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}

export function Round(num, places) {
	const decimalPivot = 10 ** places;
	return Math.floor(num * decimalPivot + 0.5) / decimalPivot;
}

export function IsFinite(val) {
	return Number.isFinite(val);
}

export function IsFiniteVector3(vec3) {
	return IsFinite(vec3.x) && IsFinite(vec3.y) && IsFinite(vec3.z);
}

let savedMouseIcon = "";
let lastMouseIconOverride = null;
export function setMouseIconOverride(icon) {
	// Only save the icon if it was written by another script.
	if (UserInputService.MouseIcon !== lastMouseIconOverride) {
		savedMouseIcon = UserInputService.MouseIcon;
	}
	UserInputService.MouseIcon = icon;
	lastMouseIconOverride = icon;
}

export function restoreMouseIcon() {
	// Only restore if it wasn't overwritten by another script.
	if (UserInputService.MouseIcon === lastMouseIconOverride) {
		UserInputService.MouseIcon = savedMouseIcon;
	}
	lastMouseIconOverride = null;
}

let savedMouseBehavior = "Default";
let lastMouseBehaviorOverride = null;
export function setMouseBehaviorOverride(value) {
	if (UserInputService.MouseBehavior !== lastMouseBehaviorOverride) {
		savedMouseBehavior = UserInputService.MouseBehavior;
	}
	UserInputService.MouseBehavior = value;
	lastMouseBehaviorOverride = value;
}

export function restoreMouseBehavior() {
	if (UserInputService.MouseBehavior === lastMouseBehaviorOverride) {
		UserInputService.MouseBehavior = savedMouseBehavior;
	}
	lastMouseBehaviorOverride = null;
}

let savedRotationType = "MovementRelative";
let lastRotationTypeOverride = null;
export function setRotationTypeOverride(value) {
	if (UserGameSettings.RotationType !== lastRotationTypeOverride) {
		savedRotationType = UserGameSettings.RotationType;
	}
	UserGameSettings.RotationType = value;
	lastRotationTypeOverride = value;
}

export function restoreRotationType() {
	if (UserGameSettings.RotationType === lastRotationTypeOverride) {
		UserGameSettings.RotationType = savedRotationType;
	}
	lastRotationTypeOverride = null;
}
