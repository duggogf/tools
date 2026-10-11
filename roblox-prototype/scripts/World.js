// World.js
// Workspace: the gym part list, OBB raycasting (workspace:Raycast) and the
// CurrentCamera object the camera scripts write to.
import * as THREE from "three";
import { Config, rad } from "./Config.js";
import { CFrame } from "./CFrame.js";
import { Signal } from "./Signal.js";

// BrickColor palette
const Color = {
	MediumStoneGrey: "#a3a2a5",
	DarkStoneGrey: "#635f62",
	BrightRed: "#c4281c",
	BrightBlue: "#0d69ac",
	BrightGreen: "#4b974b",
	BrightOrange: "#da8541",
	BrightYellow: "#f5cd30",
	BrightViolet: "#6b327c",
	Sand: "#a7ad9f",
	White: "#f2f3f3",
};

const SPAWN_TOP = 1;
const RAMP_ANGLES = [30, 45, 60, 89];
const rampLowEdge = (angle) => -58 + 10 / Math.tan(rad(angle));

// Ramp of `angle` degrees whose walkable top face starts at ground level at z0 and
// rises toward -Z (the spawn's facing direction).
function ramp(name, x, z0, angle, length, width = 8, thickness = 1, color = Color.BrightOrange) {
	const a = rad(angle);
	const c = Math.cos(a), s = Math.sin(a);
	const y = -(c * thickness / 2 - s * length / 2);
	const z = z0 - (s * thickness / 2 + c * length / 2);
	return { Name: name, Position: [x, y, z], Size: [width, thickness, length], Rotation: [a, 0, 0], Color: color };
}

function buildPartList() {
	const parts = [
		{ Name: "Baseplate", Position: [0, -8, 0], Size: [2048, 16, 2048], Color: "#5c5c5c", Texture: "grid" },
		{ Name: "SpawnLocation", Position: [0, SPAWN_TOP - 0.5, 0], Size: [12, 1, 12], Color: Color.MediumStoneGrey },
	];

	// Single steps, one per height, 8 wide and 6 deep, front face at z = -22.
	const steps = [0.5, 1, 1.5, 2, 3];
	steps.forEach((h, i) => {
		parts.push({ Name: `Step_${h}`, Position: [-24 + i * 12, h / 2, -25], Size: [8, h, 6], Color: Color.BrightBlue });
	});

	// Ramps rising 10 studs onto a plateau whose front face is at z = -58.
	RAMP_ANGLES.forEach((angle, i) => {
		const length = 10 / Math.sin(rad(angle));
		parts.push(ramp(`Ramp_${angle}`, -24 + i * 12, rampLowEdge(angle), angle, length));
	});
	parts.push({ Name: "RampPlateau", Position: [-6, 5, -64], Size: [50, 10, 12], Color: Color.MediumStoneGrey });

	// Popper test: a long wall and an archway.
	parts.push({ Name: "Wall", Position: [36, 7, 0], Size: [2, 14, 40], Color: Color.Sand });
	parts.push({ Name: "ArchLeft", Position: [-5, 5, 28], Size: [2, 10, 2], Color: Color.BrightRed });
	parts.push({ Name: "ArchRight", Position: [5, 5, 28], Size: [2, 10, 2], Color: Color.BrightRed });
	parts.push({ Name: "ArchTop", Position: [0, 11, 28], Size: [12, 2, 2], Color: Color.BrightRed });

	// 20-stud tower reached by a staircase of 1-stud steps along +X; drop off its +X side.
	parts.push({ Name: "Tower", Position: [-40, 10, 20], Size: [12, 20, 12], Color: Color.DarkStoneGrey });
	for (let i = 1; i <= 19; i++) {
		const x0 = -46 - 2 * (20 - i);
		parts.push({ Name: `TowerStair_${i}`, Position: [x0 + 1, i / 2, 20], Size: [2, i, 6], Color: Color.MediumStoneGrey });
	}

	// 4-stud blocks
	parts.push({ Name: "Block1", Position: [18, 2, 12], Size: [4, 4, 4], Color: Color.BrightGreen });
	parts.push({ Name: "Block2", Position: [24, 2, 12], Size: [4, 4, 4], Color: Color.BrightGreen });
	parts.push({ Name: "Block3", Position: [24, 6, 18], Size: [4, 4, 4], Color: Color.BrightGreen });
	parts.push({ Name: "Block4", Position: [24, 2, 18], Size: [4, 4, 4], Color: Color.BrightGreen });

	return parts;
}

const LABELS = [
	...[0.5, 1, 1.5, 2, 3].map((h, i) => ({ text: `${h}`, position: [-24 + i * 12, -19] })),
	...RAMP_ANGLES.map((a, i) => ({ text: `${a}°`, position: [-24 + i * 12, rampLowEdge(a) + 3] })),
	{ text: "Wall", position: [32, 0] },
	{ text: "Arch", position: [0, 24] },
	{ text: "Tower 20", position: [-28, 20] },
	{ text: "4 stud", position: [21, 7] },
];

// RaycastParams
export class RaycastParams {
	constructor() {
		this.FilterType = "Exclude"; // Exclude | Include
		this.FilterDescendantsInstances = [];
		this.RespectCanCollide = false;
		this.IgnoreWater = true;
	}

	AddToFilter(instance) {
		this.FilterDescendantsInstances = [...this.FilterDescendantsInstances, instance];
	}
}

// Camera (workspace.CurrentCamera). CFrame writes go straight to the THREE camera.
export class Camera {
	constructor(threeCamera) {
		this.threeCamera = threeCamera;
		this._cframe = new CFrame();
		this.Focus = new CFrame();
		this.CameraType = "Custom";
		this._subject = null;
		this.CameraSubjectChanged = new Signal();
	}

	get CFrame() {
		return this._cframe;
	}

	set CFrame(cf) {
		this._cframe = cf;
		cf.applyTo(this.threeCamera);
	}

	get CoordinateFrame() {
		return this._cframe;
	}

	get CameraSubject() {
		return this._subject;
	}

	set CameraSubject(subject) {
		this._subject = subject;
		this.CameraSubjectChanged.Fire(subject);
	}

	get FieldOfView() {
		return Config.FieldOfView;
	}

	get NearPlaneZ() {
		return Config.NearPlaneZ;
	}

	get ViewportSize() {
		return new THREE.Vector2(window.innerWidth, window.innerHeight);
	}

	// Ray through a viewport pixel, starting on the near plane.
	ViewportPointToRay(x, y) {
		const view = this.ViewportSize;
		const projY = 2 * Math.tan(rad(this.FieldOfView) / 2);
		const projX = (view.x / view.y) * projY;
		const near = -this.NearPlaneZ;
		const local = new THREE.Vector3((x / view.x - 0.5) * projX * near, -(y / view.y - 0.5) * projY * near, -near);
		const origin = this._cframe.Position.clone().add(local.clone().applyQuaternion(this._cframe.Rotation));
		const direction = local.normalize().applyQuaternion(this._cframe.Rotation);
		return { Origin: origin, Direction: direction };
	}
}

const _o = new THREE.Vector3();
const _d = new THREE.Vector3();
const _rot = new THREE.Matrix3();

function makeGridTexture() {
	const size = 128;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#5c5c5c";
	ctx.fillRect(0, 0, size, size);
	ctx.strokeStyle = "#6e6e6e";
	ctx.lineWidth = 4;
	ctx.strokeRect(0, 0, size, size);
	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

function makeLabel(text) {
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 96;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "rgba(255,255,255,0.85)";
	ctx.font = "bold 64px system-ui, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(text, 128, 50);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5.33, 2), material);
	mesh.rotation.x = -Math.PI / 2;
	return mesh;
}

class WorkspaceClass {
	constructor() {
		this.parts = [];
		this.CurrentCamera = null;
		this.SpawnLocation = null;
	}

	get Gravity() {
		return Config.Gravity;
	}

	get FallenPartsDestroyHeight() {
		return Config.FallenPartsDestroyHeight;
	}

	Build(scene) {
		const grid = makeGridTexture();
		for (const def of buildPartList()) {
			const size = new THREE.Vector3(...def.Size);
			const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
			let material;
			if (def.Texture === "grid") {
				const top = grid.clone();
				top.repeat.set(size.x / 4, size.z / 4);
				top.needsUpdate = true;
				const side = new THREE.MeshLambertMaterial({ color: def.Color });
				material = [side, side, new THREE.MeshLambertMaterial({ map: top }), side, side, side];
			} else {
				material = new THREE.MeshLambertMaterial({ color: def.Color });
			}
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(...def.Position);
			if (def.Rotation) mesh.rotation.set(...def.Rotation);
			mesh.castShadow = def.Name !== "Baseplate";
			mesh.receiveShadow = true;
			mesh.updateMatrixWorld(true);
			// BasePart properties
			mesh.Name = def.Name;
			mesh.Size = size;
			mesh.Anchored = true;
			mesh.CanCollide = def.CanCollide !== false;
			mesh.Transparency = def.Transparency || 0;
			mesh.LocalTransparencyModifier = 0;
			mesh._halfSize = size.clone().multiplyScalar(0.5);
			mesh._inverse = mesh.matrixWorld.clone().invert();
			mesh.GetRootPart = () => mesh;
			mesh.IsA = (className) => className === "BasePart" || className === "Part";
			scene.add(mesh);
			this.parts.push(mesh);
			if (def.Name === "SpawnLocation") this.SpawnLocation = mesh;
		}
		for (const label of LABELS) {
			const mesh = makeLabel(label.text);
			mesh.position.set(label.position[0], 0.02, label.position[1]);
			scene.add(mesh);
		}
	}

	// Spawn CFrame: on top of the SpawnLocation, facing its front (-Z).
	GetSpawnPosition(hipOffset) {
		const spawn = this.SpawnLocation;
		return new THREE.Vector3(spawn.position.x, spawn.position.y + spawn.Size.y / 2 + hipOffset, spawn.position.z);
	}

	// workspace:Raycast(origin, direction, params). Rays that start inside a part do
	// not hit that part, like Roblox.
	Raycast(origin, direction, params) {
		if (direction.lengthSq() < 1e-12) return null;
		let best = null;
		let bestT = Infinity;
		const filter = params ? params.FilterDescendantsInstances : null;
		const include = params && params.FilterType === "Include";
		for (const part of this.parts) {
			if (params) {
				const listed = filter.includes(part);
				if (include ? !listed : listed) continue;
				if (params.RespectCanCollide && !part.CanCollide) continue;
			}
			_o.copy(origin).applyMatrix4(part._inverse);
			_rot.setFromMatrix4(part._inverse);
			_d.copy(direction).applyMatrix3(_rot);
			const h = part._halfSize;
			let tNear = -Infinity, tFar = Infinity, axis = -1, sign = 0;
			let miss = false;
			for (let i = 0; i < 3; i++) {
				const o = _o.getComponent(i), d = _d.getComponent(i), e = h.getComponent(i);
				if (Math.abs(d) < 1e-12) {
					if (o < -e || o > e) { miss = true; break; }
					continue;
				}
				let t1 = (-e - o) / d, t2 = (e - o) / d;
				let s = -1;
				if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; s = 1; }
				if (t1 > tNear) { tNear = t1; axis = i; sign = s; }
				if (t2 < tFar) tFar = t2;
				if (tNear > tFar) { miss = true; break; }
			}
			if (miss || axis < 0 || tNear < 0 || tNear > 1 || tFar < 0) continue;
			if (tNear < bestT) {
				bestT = tNear;
				const n = new THREE.Vector3();
				n.setComponent(axis, sign);
				n.applyQuaternion(part.quaternion);
				best = { Instance: part, Normal: n, t: tNear };
			}
		}
		if (!best) return null;
		const position = origin.clone().addScaledVector(direction, bestT);
		return { Instance: best.Instance, Position: position, Normal: best.Normal, Distance: direction.length() * bestT };
	}
}

export const Workspace = new WorkspaceClass();
