// ClassicCamera.js
// Port of CameraModule/ClassicCamera.lua - Classic Roblox camera control module.
// Also handles camera control types Follow and CameraToggle.
import * as THREE from "three";
import { Config, LocalPlayer } from "./Config.js";
import { CFrame } from "./CFrame.js";
import { Workspace } from "./World.js";
import { BaseCamera } from "./BaseCamera.js";
import { CameraInput } from "./CameraInput.js";
import * as Util from "./CameraUtils.js";
import { tick } from "./RunService.js";

let tweenSpeed = 0; // Radians/Second
const TIME_BEFORE_AUTO_ROTATE = () => Config.TIME_BEFORE_AUTO_ROTATE; // Seconds

const INITIAL_CAMERA_ANGLE = CFrame.fromOrientation(Config.INITIAL_CAMERA_PITCH, 0, 0);

const isZeroVector2 = (v) => v.x === 0 && v.y === 0;

export class ClassicCamera extends BaseCamera {
	constructor() {
		super();
		this.isFollowCamera = false;
		this.isCameraToggle = false;
		this.lastUpdate = tick();
		this.cameraToggleSpring = new Util.Spring(5, 0);
	}

	GetModuleName() {
		return "ClassicCamera";
	}

	GetCameraToggleOffset(dt) {
		if (this.isCameraToggle) {
			const zoom = this.currentSubjectDistance;

			if (CameraInput.getTogglePan()) {
				this.cameraToggleSpring.goal = Util.clamp(Util.map(zoom, 0.5, this.FIRST_PERSON_DISTANCE_THRESHOLD, 0, 1), 0, 1);
			} else {
				this.cameraToggleSpring.goal = 0;
			}

			const distanceOffset = Util.clamp(Util.map(zoom, 0.5, 64, 0, 1), 0, 1) + 1;
			return new THREE.Vector3(0, this.cameraToggleSpring.step(dt) * distanceOffset, 0);
		}

		return new THREE.Vector3();
	}

	// Movement mode standardized to Enum.ComputerCameraMovementMode values
	SetCameraMovementMode(cameraMovementMode) {
		super.SetCameraMovementMode(cameraMovementMode);

		this.isFollowCamera = cameraMovementMode === "Follow";
		this.isCameraToggle = cameraMovementMode === "CameraToggle";
	}

	Update(dt) {
		const now = tick();

		const camera = Workspace.CurrentCamera;
		let newCameraCFrame = camera.CFrame;
		let newCameraFocus = camera.Focus;

		let overrideCameraLookVector = null;
		if (this.resetCameraAngle) {
			const rootPart = this.GetHumanoidRootPart();
			if (rootPart) {
				overrideCameraLookVector = CFrame.fromObject3D(rootPart).mul(INITIAL_CAMERA_ANGLE).LookVector;
			} else {
				overrideCameraLookVector = INITIAL_CAMERA_ANGLE.LookVector;
			}
			this.resetCameraAngle = false;
		}

		const player = LocalPlayer;
		const humanoid = this.GetHumanoid();
		const isClimbing = humanoid && humanoid.GetState() === "Climbing";

		if (this.lastUpdate === null || dt > 1) this.lastCameraTransform = null;

		let rotateInput = CameraInput.getRotation(dt);

		this.StepZoom();

		// Reset tween speed if user is panning
		if (!isZeroVector2(rotateInput)) {
			tweenSpeed = 0;
			this.lastUserPanCamera = tick();
		}

		const userRecentlyPannedCamera = now - this.lastUserPanCamera < TIME_BEFORE_AUTO_ROTATE();
		let subjectPosition = this.GetSubjectPosition();

		if (subjectPosition && player && camera) {
			let zoom = this.GetCameraToSubjectDistance();
			if (zoom < 0.5) zoom = 0.5;

			if (this.GetIsMouseLocked() && !this.IsInFirstPerson()) {
				// We need to use the right vector of the camera after rotation, not before
				const newLookCFrame = this.CalculateNewLookCFrameFromArg(overrideCameraLookVector, rotateInput);

				const offset = this.GetMouseLockOffset().clone();
				// in mouse lock mode, the offset is applied to the camera instead of to the subject position
				if (humanoid) offset.add(humanoid.CameraOffset);
				const cameraRelativeOffset = newLookCFrame.RightVector.multiplyScalar(offset.x)
					.add(newLookCFrame.UpVector.multiplyScalar(offset.y))
					.add(newLookCFrame.LookVector.multiplyScalar(offset.z));

				//offset can be NAN, NAN, NAN if newLookVector has only y component
				if (Util.IsFiniteVector3(cameraRelativeOffset)) subjectPosition = subjectPosition.clone().add(cameraRelativeOffset);
			} else {
				const userPanningTheCamera = !isZeroVector2(rotateInput);

				if (!userPanningTheCamera && this.lastCameraTransform) {
					const isInFirstPerson = this.IsInFirstPerson();

					// Vehicle / skateboard / follow-climbing branch omitted: no seats or trusses in the replica.
					if (this.isFollowCamera && isClimbing) {
						// unreachable in the replica
					} else if (this.isFollowCamera && !(isInFirstPerson || userRecentlyPannedCamera)) {
						// Logic that was unique to the old FollowCamera module
						const lastVec = this.lastCameraTransform.p.clone().sub(subjectPosition).negate();

						const y = Util.GetAngleBetweenXZVectors(lastVec, this.GetCameraLookVector());

						// This cutoff is to decide if the humanoid's angle of movement,
						// relative to the camera's look vector, is enough that
						// we want the camera to be following them. The point is to provide
						// a sizable dead zone to allow more precise forward movements.
						const thetaCutoff = Config.FOLLOW_THETA_CUTOFF;

						// Check for NaNs
						if (Util.IsFinite(y) && Math.abs(y) > 0.0001 && Math.abs(y) > thetaCutoff * dt) {
							rotateInput = rotateInput.clone().add(new THREE.Vector2(y, 0));
						}
					}
				}
			}

			if (!this.isFollowCamera) {
				newCameraFocus = CFrame.new(subjectPosition);

				const cameraFocusP = newCameraFocus.p;
				const newLookVector = this.CalculateNewLookVectorFromArg(overrideCameraLookVector, rotateInput);

				newCameraCFrame = CFrame.lookAlong(cameraFocusP.clone().addScaledVector(newLookVector, -zoom), newLookVector);
			} else {
				// is FollowCamera
				const newLookVector = this.CalculateNewLookVectorFromArg(overrideCameraLookVector, rotateInput);

				newCameraFocus = CFrame.new(subjectPosition);

				newCameraCFrame = CFrame.lookAlong(newCameraFocus.p.clone().addScaledVector(newLookVector, -zoom), newLookVector);
			}

			const toggleOffset = this.GetCameraToggleOffset(dt);
			newCameraFocus = newCameraFocus.add(toggleOffset);
			newCameraCFrame = newCameraCFrame.add(toggleOffset);

			this.lastCameraTransform = newCameraCFrame;
			this.lastCameraFocus = newCameraFocus;
			this.lastSubjectCFrame = null;
		}

		this.lastUpdate = now;
		return [newCameraCFrame, newCameraFocus];
	}
}
