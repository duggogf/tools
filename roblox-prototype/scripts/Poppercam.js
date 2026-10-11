// Poppercam.js
// Port of CameraModule/Poppercam.lua: occlusion module that brings the camera
// closer to the subject when objects are blocking the view.
import * as THREE from "three";
import { CFrame } from "./CFrame.js";
import { ZoomController, PopperSetCharacters, PopperSetSubject } from "./ZoomController.js";

const CF_IDENTITY = new CFrame();

function cframeToAxis(cframe) {
	const { axis, angle } = cframe.ToAxisAngle();
	return axis.multiplyScalar(angle);
}

function axisToCFrame(axis) {
	const angle = axis.length();
	if (angle > 1e-5) return CFrame.fromAxisAngle(axis, angle);
	return CF_IDENTITY;
}

function extractRotation(cf) {
	return cf.rotationOnly();
}

class TransformExtrapolator {
	constructor() {
		this.lastCFrame = null;
	}

	Step(dt, currentCFrame) {
		const lastCFrame = this.lastCFrame || currentCFrame;
		this.lastCFrame = currentCFrame;

		const currentPos = currentCFrame.Position;
		const currentRot = extractRotation(currentCFrame);

		const lastPos = lastCFrame.p;
		const lastRot = extractRotation(lastCFrame);

		// Estimate velocities from the delta between now and the last frame
		// This estimation can be a little noisy.
		const dp = currentPos.clone().sub(lastPos).divideScalar(dt);
		const dr = cframeToAxis(currentRot.mul(lastRot.inverse())).divideScalar(dt);

		const extrapolate = (t) => {
			const p = dp.clone().multiplyScalar(t).add(currentPos);
			const r = axisToCFrame(dr.clone().multiplyScalar(t)).mul(currentRot);
			return r.add(p);
		};

		return {
			extrapolate,
			posVelocity: dp,
			rotVelocity: dr,
		};
	}

	Reset() {
		this.lastCFrame = null;
	}
}

// CFrame.new(0, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, -1): half turn about Y
const FLIP_Y = new CFrame(new THREE.Vector3(), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));

export class Poppercam {
	constructor() {
		this.focusExtrapolator = new TransformExtrapolator();
		this.enabled = false;
	}

	GetOcclusionMode() {
		return "Zoom";
	}

	Enable() {
		this.focusExtrapolator.Reset();
	}

	GetEnabled() {
		return true;
	}

	Update(renderDt, desiredCameraCFrame, desiredCameraFocus) {
		const rotatedFocus = CFrame.lookAlong(desiredCameraFocus.p, desiredCameraCFrame.LookVector.negate()).mul(FLIP_Y);

		const extrapolation = this.focusExtrapolator.Step(renderDt, rotatedFocus);
		const zoom = ZoomController.Update(renderDt, rotatedFocus, extrapolation);
		return [rotatedFocus.mul(CFrame.new(0, 0, zoom)), desiredCameraFocus];
	}

	// Called when character is added
	CharacterAdded(character) {
		PopperSetCharacters([character]);
	}

	// Called when character is about to be removed
	CharacterRemoving() {
		PopperSetCharacters([]);
	}

	OnCameraSubjectChanged(newSubject) {
		PopperSetSubject(newSubject);
	}
}
