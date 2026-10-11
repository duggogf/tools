// Animations.js
// Hand-authored stand-ins for the default R15 Animate clips, as data:
// { length, loop, priority?, keyframes: [{ t, name?, poses: { PartName: { rot: [x, y, z], pos?: [x, y, z] } } }] }
// rot is radians applied to the part's joint (Euler XYZ), pos is an offset in studs.
// Joint axes: +X rotation swings a limb forward (toward the character's -Z front).

// Samples a periodic pose function into n evenly spaced keyframes (last equals first).
function sampleCycle(length, n, poseAt) {
	const keyframes = [];
	for (let i = 0; i <= n; i++) {
		const t = (length * i) / n;
		keyframes.push({ t, poses: poseAt((2 * Math.PI * i) / n) });
	}
	return keyframes;
}

const ARMS_DOWN = {
	LeftUpperArm: { rot: [0, 0, -0.06] },
	RightUpperArm: { rot: [0, 0, 0.06] },
	LeftLowerArm: { rot: [0.12, 0, 0] },
	RightLowerArm: { rot: [0.12, 0, 0] },
};

function breathing(phase, extra = {}) {
	const b = Math.sin(phase);
	return {
		UpperTorso: { rot: [0.015 * b, 0, 0] },
		Head: { rot: [-0.02 * b, 0, 0] },
		LeftUpperArm: { rot: [0.02 * b, 0, -0.06 - 0.025 * b] },
		RightUpperArm: { rot: [0.02 * b, 0, 0.06 + 0.025 * b] },
		LeftLowerArm: ARMS_DOWN.LeftLowerArm,
		RightLowerArm: ARMS_DOWN.RightLowerArm,
		...extra,
	};
}

// idle (weight 9): slow breathing. The "End" keyframe re-rolls the idle variant.
const idle1 = {
	length: 4,
	loop: true,
	priority: "Core",
	keyframes: [
		{ t: 0, poses: breathing(0) },
		{ t: 1, poses: breathing(Math.PI / 2) },
		{ t: 2, poses: breathing(Math.PI) },
		{ t: 3, poses: breathing(1.5 * Math.PI) },
		{ t: 4, name: "End", poses: breathing(0) },
	],
};

// idle (weight 1): looks around.
const look = (yaw, pitch = 0) => ({ Head: { rot: [pitch, yaw, 0] }, UpperTorso: { rot: [0, yaw * 0.25, 0] } });
const idle2 = {
	length: 5,
	loop: true,
	priority: "Core",
	keyframes: [
		{ t: 0, poses: breathing(0, look(0)) },
		{ t: 0.8, poses: breathing(Math.PI / 2, look(0.7, 0.05)) },
		{ t: 1.8, poses: breathing(Math.PI, look(0.7, 0.05)) },
		{ t: 2.8, poses: breathing(1.5 * Math.PI, look(-0.7, -0.05)) },
		{ t: 3.8, poses: breathing(0, look(-0.7, -0.05)) },
		{ t: 5, name: "End", poses: breathing(0, look(0)) },
	],
};

// walk: opposite arm/leg swing of ~36 degrees, knee lift on the swing leg, torso bob
// at twice the step frequency, 1.0 s cycle at Speed 1 (WalkSpeed 16).
const SWING = 0.63;
const walk = {
	length: 1,
	loop: true,
	priority: "Core",
	keyframes: sampleCycle(1, 16, (phi) => {
		const s = Math.sin(phi);
		const c = Math.cos(phi);
		return {
			LowerTorso: { rot: [0, -0.06 * s, 0], pos: [0, 0.12 * Math.cos(2 * phi) - 0.04, 0] },
			UpperTorso: { rot: [-0.05, 0.1 * s, 0] },
			Head: { rot: [0.04, -0.07 * s, 0] },
			RightUpperLeg: { rot: [SWING * s, 0, 0] },
			LeftUpperLeg: { rot: [-SWING * s, 0, 0] },
			RightLowerLeg: { rot: [-0.15 - 0.85 * Math.max(0, c), 0, 0] },
			LeftLowerLeg: { rot: [-0.15 - 0.85 * Math.max(0, -c), 0, 0] },
			RightFoot: { rot: [0.25 * Math.max(0, c) - 0.1 * s, 0, 0] },
			LeftFoot: { rot: [0.25 * Math.max(0, -c) + 0.1 * s, 0, 0] },
			LeftUpperArm: { rot: [SWING * s, 0, -0.06] },
			RightUpperArm: { rot: [-SWING * s, 0, 0.06] },
			LeftLowerArm: { rot: [0.3 + 0.2 * Math.max(0, s), 0, 0] },
			RightLowerArm: { rot: [0.3 + 0.2 * Math.max(0, -s), 0, 0] },
		};
	}),
};

// jump (non-looping): arms thrown up, one knee tucked; holds the last pose.
const jumpPose = {
	LowerTorso: { rot: [0, 0, 0] },
	UpperTorso: { rot: [0.05, 0, 0] },
	Head: { rot: [0.1, 0, 0] },
	LeftUpperArm: { rot: [2.75, 0, -0.3] },
	RightUpperArm: { rot: [2.75, 0, 0.3] },
	LeftLowerArm: { rot: [0.25, 0, 0] },
	RightLowerArm: { rot: [0.25, 0, 0] },
	LeftUpperLeg: { rot: [0.45, 0, 0] },
	LeftLowerLeg: { rot: [-0.8, 0, 0] },
	RightUpperLeg: { rot: [-0.1, 0, 0] },
	RightLowerLeg: { rot: [-0.2, 0, 0] },
	LeftFoot: { rot: [0.2, 0, 0] },
	RightFoot: { rot: [0.1, 0, 0] },
};
const jump = {
	length: 1,
	loop: false,
	priority: "Core",
	keyframes: [
		{ t: 0, poses: { ...jumpPose, LeftUpperArm: { rot: [2.2, 0, -0.3] }, RightUpperArm: { rot: [2.2, 0, 0.3] } } },
		{ t: 0.15, poses: jumpPose },
		{ t: 1, poses: jumpPose },
	],
};

// fall: arms raised out to the sides, legs apart, slow flail.
const fallPose = (k) => ({
	UpperTorso: { rot: [0.05, 0, 0] },
	Head: { rot: [0.12, 0, 0] },
	LeftUpperArm: { rot: [0.5 + 0.1 * k, 0, -1.25 - 0.12 * k] },
	RightUpperArm: { rot: [0.5 - 0.1 * k, 0, 1.25 + 0.12 * k] },
	LeftLowerArm: { rot: [0.35, 0, 0] },
	RightLowerArm: { rot: [0.35, 0, 0] },
	LeftUpperLeg: { rot: [0.2 + 0.08 * k, 0, -0.12] },
	RightUpperLeg: { rot: [-0.1 - 0.08 * k, 0, 0.12] },
	LeftLowerLeg: { rot: [-0.45, 0, 0] },
	RightLowerLeg: { rot: [-0.3, 0, 0] },
});
const fall = {
	length: 1,
	loop: true,
	priority: "Core",
	keyframes: [
		{ t: 0, poses: fallPose(0) },
		{ t: 0.25, poses: fallPose(1) },
		{ t: 0.75, poses: fallPose(-1) },
		{ t: 1, poses: fallPose(0) },
	],
};

export const Animations = { idle1, idle2, walk, jump, fall };

// Animate script table shape: { idle = { {id, weight}, ... }, walk = ... }
export const animNames = {
	idle: [
		{ id: "idle1", weight: 9 },
		{ id: "idle2", weight: 1 },
	],
	walk: [{ id: "walk", weight: 10 }],
	run: [{ id: "walk", weight: 10 }],
	jump: [{ id: "jump", weight: 10 }],
	fall: [{ id: "fall", weight: 10 }],
};
