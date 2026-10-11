// Character.js
// Blocky R15 rig: 15 box parts plus an invisible HumanoidRootPart. Each part hangs
// from a pivot group placed at its Motor6D joint, parented like R15
// (Root -> LowerTorso -> UpperTorso -> Head/UpperArms, LowerTorso -> UpperLegs, ...).
import * as THREE from "three";
import { Config } from "./Config.js";
import { Workspace } from "./World.js";
import { Humanoid } from "./Humanoid.js";

const YELLOW = "#f5cd30"; // Bright yellow
const TORSO = "#4f7cb8"; // grey-blue
const LEGS = "#a3a2a5"; // Medium stone grey

// name, parent, joint position relative to the parent's joint, box size, box centre relative to own joint, colour.
// Root joint (HumanoidRootPart centre) sits 3 studs above the feet.
const RIG = [
	["LowerTorso", "HumanoidRootPart", [0, -0.8, 0], [2, 0.4, 1], [0, 0, 0], TORSO],
	["UpperTorso", "LowerTorso", [0, 0.2, 0], [2, 1.6, 1], [0, 0.8, 0], TORSO],
	["Head", "UpperTorso", [0, 1.6, 0], [1.2, 1.2, 1.2], [0, 0.6, 0], YELLOW],
	["LeftUpperArm", "UpperTorso", [-1.5, 1.3, 0], [1, 1.2, 1], [0, -0.3, 0], YELLOW],
	["LeftLowerArm", "LeftUpperArm", [0, -0.9, 0], [1, 0.5, 1], [0, -0.25, 0], YELLOW],
	["LeftHand", "LeftLowerArm", [0, -0.5, 0], [1, 0.3, 1], [0, -0.15, 0], YELLOW],
	["RightUpperArm", "UpperTorso", [1.5, 1.3, 0], [1, 1.2, 1], [0, -0.3, 0], YELLOW],
	["RightLowerArm", "RightUpperArm", [0, -0.9, 0], [1, 0.5, 1], [0, -0.25, 0], YELLOW],
	["RightHand", "RightLowerArm", [0, -0.5, 0], [1, 0.3, 1], [0, -0.15, 0], YELLOW],
	["LeftUpperLeg", "LowerTorso", [-0.5, -0.2, 0], [1, 1.2, 1], [0, -0.6, 0], LEGS],
	["LeftLowerLeg", "LeftUpperLeg", [0, -1.2, 0], [1, 0.5, 1], [0, -0.25, 0], LEGS],
	["LeftFoot", "LeftLowerLeg", [0, -0.5, 0], [1, 0.3, 1], [0, -0.15, 0], LEGS],
	["RightUpperLeg", "LowerTorso", [0.5, -0.2, 0], [1, 1.2, 1], [0, -0.6, 0], LEGS],
	["RightLowerLeg", "RightUpperLeg", [0, -1.2, 0], [1, 0.5, 1], [0, -0.25, 0], LEGS],
	["RightFoot", "RightLowerLeg", [0, -0.5, 0], [1, 0.3, 1], [0, -0.15, 0], LEGS],
];

let faceTexture = null;
function getFaceTexture() {
	if (faceTexture) return faceTexture;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 128;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = YELLOW;
	ctx.fillRect(0, 0, 128, 128);
	ctx.fillStyle = "#1b1b1b";
	ctx.beginPath(); ctx.ellipse(44, 52, 7, 12, 0, 0, Math.PI * 2); ctx.fill();
	ctx.beginPath(); ctx.ellipse(84, 52, 7, 12, 0, 0, Math.PI * 2); ctx.fill();
	ctx.lineWidth = 7;
	ctx.lineCap = "round";
	ctx.strokeStyle = "#1b1b1b";
	ctx.beginPath(); ctx.arc(64, 70, 26, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
	faceTexture = new THREE.CanvasTexture(canvas);
	faceTexture.colorSpace = THREE.SRGBColorSpace;
	return faceTexture;
}

function applyTransparency(part) {
	const total = 1 - (1 - part.Transparency) * (1 - part._localTransparencyModifier);
	const materials = Array.isArray(part.material) ? part.material : [part.material];
	for (const m of materials) {
		m.opacity = 1 - total;
		m.transparent = total > 0;
		m.depthWrite = total === 0;
		m.visible = total < 1;
	}
}

// A BasePart: THREE.Mesh with the Roblox properties the scripts read.
function makePart(name, size, color) {
	const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
	let material;
	if (name === "Head") {
		const side = () => new THREE.MeshLambertMaterial({ color });
		material = [side(), side(), side(), side(), side(), new THREE.MeshLambertMaterial({ map: getFaceTexture() })];
	} else {
		material = new THREE.MeshLambertMaterial({ color });
	}
	const part = new THREE.Mesh(geometry, material);
	part.name = name;
	part.Name = name;
	part.Size = size;
	part.Transparency = 0;
	part._localTransparencyModifier = 0;
	Object.defineProperty(part, "LocalTransparencyModifier", {
		get() { return this._localTransparencyModifier; },
		set(v) { this._localTransparencyModifier = v; applyTransparency(this); },
	});
	part.IsA = (className) => className === "BasePart" || className === "MeshPart";
	part.castShadow = true;
	return part;
}

export class Character {
	constructor(name = "Player1") {
		this.Name = name;
		this.Model = new THREE.Group();
		this.Model.name = name;
		this.parts = new Map();
		this.pivots = new Map();
		this._ragdoll = null;

		// HumanoidRootPart: invisible, CanCollide, 2x2x1. Material.visible keeps children rendering.
		const rootSize = new THREE.Vector3(Config.RootPartSize.x, Config.RootPartSize.y, Config.RootPartSize.z);
		const root = makePart("HumanoidRootPart", rootSize, "#ffffff");
		root.Transparency = 1;
		root.castShadow = false;
		applyTransparency(root);
		this.Model.add(root);
		this.parts.set("HumanoidRootPart", root);
		this.pivots.set("HumanoidRootPart", root);
		this.RootPart = root;

		for (const [partName, parentName, joint, size, offset, color] of RIG) {
			const pivot = new THREE.Group();
			pivot.name = `${partName}Joint`;
			pivot.position.set(...joint);
			pivot.userData.restPosition = pivot.position.clone();
			const part = makePart(partName, new THREE.Vector3(...size), color);
			part.position.set(...offset);
			pivot.add(part);
			this.pivots.get(parentName).add(pivot);
			this.pivots.set(partName, pivot);
			this.parts.set(partName, part);
		}

		this.Humanoid = new Humanoid(this);
	}

	// Pivot group whose rotation a keyframe pose for `partName` drives.
	GetJoint(partName) {
		const pivot = this.pivots.get(partName);
		return pivot && pivot !== this.RootPart ? pivot : null;
	}

	GetDescendants() {
		return [...this.parts.values()];
	}

	FindFirstChild(name) {
		if (name === "Humanoid") return this.Humanoid;
		return this.parts.get(name) || null;
	}

	IsA(className) {
		return className === "Model";
	}

	// Humanoid death: joints break and the parts tumble (visual only).
	BreakJoints() {
		if (this._ragdoll) return;
		const scene = this.Model.parent;
		const v = this.Humanoid.AssemblyLinearVelocity.clone();
		this._ragdoll = [];
		this.Model.updateMatrixWorld(true);
		for (const [name, part] of this.parts) {
			if (name === "HumanoidRootPart") continue;
			const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
			part.matrixWorld.decompose(p, q, s);
			scene.add(part);
			part.position.copy(p);
			part.quaternion.copy(q);
			const velocity = v.clone().add(new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8));
			const spin = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(8);
			this._ragdoll.push({ part, velocity, spin });
		}
	}

	StepRagdoll(dt) {
		if (!this._ragdoll) return;
		const g = Workspace.Gravity;
		for (const body of this._ragdoll) {
			const { part, velocity, spin } = body;
			velocity.y -= g * dt;
			const half = Math.max(part.Size.x, part.Size.y, part.Size.z) / 2;
			const hit = Workspace.Raycast(part.position, new THREE.Vector3(0, -half + Math.min(0, velocity.y * dt), 0));
			if (hit && velocity.y <= 0) {
				part.position.y = hit.Position.y + half;
				velocity.y *= -0.25;
				velocity.x *= 0.8;
				velocity.z *= 0.8;
				spin.multiplyScalar(0.8);
			} else {
				part.position.addScaledVector(velocity, dt);
			}
			part.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), spin.x * dt);
			part.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), spin.y * dt);
			part.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), spin.z * dt);
		}
	}

	Destroy() {
		if (this.Model.parent) this.Model.parent.remove(this.Model);
		if (this._ragdoll) for (const { part } of this._ragdoll) part.parent && part.parent.remove(part);
		for (const part of this.parts.values()) {
			part.geometry.dispose();
			const materials = Array.isArray(part.material) ? part.material : [part.material];
			for (const m of materials) m.dispose();
		}
	}
}
