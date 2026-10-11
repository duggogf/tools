// CFrame.js
// A thin wrapper over THREE so camera and humanoid code reads like Roblox Luau.
// Roblox: Y up, right handed, LookVector = -Z. Same as THREE, so no axis swaps.
import * as THREE from "three";

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

export class CFrame {
	constructor(position = new THREE.Vector3(), quaternion = new THREE.Quaternion()) {
		this.Position = position.clone();
		this.Rotation = quaternion.clone();
	}

	static new(position) {
		return new CFrame(position, new THREE.Quaternion());
	}

	// CFrame.lookAlong(pos, dir): position with -Z pointing along dir, Y up.
	static lookAlong(position, direction) {
		_v.copy(position).add(direction);
		_m.lookAt(position, _v, THREE.Object3D.DEFAULT_UP);
		_q.setFromRotationMatrix(_m);
		return new CFrame(position, _q);
	}

	// CFrame.lookAt(pos, target)
	static lookAt(position, target) {
		return CFrame.lookAlong(position, _v.copy(target).sub(position));
	}

	// CFrame.Angles(rx, ry, rz), Roblox applies Z, then Y, then X (XYZ order extrinsic).
	static Angles(rx, ry, rz) {
		_q.setFromEuler(new THREE.Euler(rx, ry, rz, "XYZ"));
		return new CFrame(new THREE.Vector3(), _q);
	}

	static fromOrientation(rx, ry, rz) {
		_q.setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ"));
		return new CFrame(new THREE.Vector3(), _q);
	}

	get LookVector() {
		return new THREE.Vector3(0, 0, -1).applyQuaternion(this.Rotation);
	}
	get RightVector() {
		return new THREE.Vector3(1, 0, 0).applyQuaternion(this.Rotation);
	}
	get UpVector() {
		return new THREE.Vector3(0, 1, 0).applyQuaternion(this.Rotation);
	}

	// cf * other
	mul(other) {
		const p = other.Position.clone().applyQuaternion(this.Rotation).add(this.Position);
		const q = this.Rotation.clone().multiply(other.Rotation);
		return new CFrame(p, q);
	}

	// cf + vector3
	add(v) {
		return new CFrame(this.Position.clone().add(v), this.Rotation);
	}

	vectorToWorldSpace(v) {
		return v.clone().applyQuaternion(this.Rotation);
	}

	// Yaw angle of LookVector projected on XZ.
	yaw() {
		const l = this.LookVector;
		return Math.atan2(-l.x, -l.z);
	}

	applyTo(object3d) {
		object3d.position.copy(this.Position);
		object3d.quaternion.copy(this.Rotation);
	}
}

export function v3(x = 0, y = 0, z = 0) {
	return new THREE.Vector3(x, y, z);
}

export function isFiniteVector3(v) {
	return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

// Util.GetAngleBetweenXZVectors from CameraUtils.lua
export function getAngleBetweenXZVectors(v1, v2) {
	return Math.atan2(v2.x * v1.z - v2.z * v1.x, v2.x * v1.x + v2.z * v1.z);
}
