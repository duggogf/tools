// BaseCamera.js
// Port of CameraModule/BaseCamera.lua - abstract base class for camera control modules.
import * as THREE from "three";
import { Config, LocalPlayer } from "./Config.js";
import { CFrame } from "./CFrame.js";
import { Workspace } from "./World.js";
import { CameraInput } from "./CameraInput.js";
import { ZoomController } from "./ZoomController.js";
import * as CameraUtils from "./CameraUtils.js";
import { tick } from "./RunService.js";

const player = LocalPlayer;

const UNIT_Z = new THREE.Vector3(0, 0, 1);

const DEFAULT_DISTANCE = Config.DEFAULT_DISTANCE; // Studs
const FIRST_PERSON_DISTANCE_THRESHOLD = Config.FIRST_PERSON_DISTANCE_THRESHOLD; // Below this value, snap into first person

// Note: DotProduct check in CoordinateFrame::lookAt() prevents using values within about
// 8.11 degrees of the +/- Y axis, that's why these limits are currently 80 degrees
const MIN_Y = Config.MIN_Y;
const MAX_Y = Config.MAX_Y;

const ZERO_VECTOR3 = new THREE.Vector3();

const HEAD_OFFSET = new THREE.Vector3(0, 1.5, 0);
const R15_HEAD_OFFSET = new THREE.Vector3(Config.R15_HEAD_OFFSET.x, Config.R15_HEAD_OFFSET.y, Config.R15_HEAD_OFFSET.z);
const R15_HEAD_OFFSET_NO_SCALING = new THREE.Vector3(0, 2, 0);
const HUMANOID_ROOT_PART_SIZE = new THREE.Vector3(Config.HUMANOID_ROOT_PART_SIZE.x, Config.HUMANOID_ROOT_PART_SIZE.y, Config.HUMANOID_ROOT_PART_SIZE.z);

const ZOOM_SENSITIVITY_CURVATURE = Config.ZOOM_SENSITIVITY_CURVATURE;
const FIRST_PERSON_DISTANCE_MIN = Config.FIRST_PERSON_DISTANCE_MIN;

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

// CameraToggleStateController.lua (CameraUI toasts omitted)
const CROSS_MOUSE_ICON = "rbxasset://textures/Cursors/CrossMouseIcon.png";
let lastTogglePan = false;
let lastTogglePanChange = 0;
let lockStateDirty = false;
let wasTogglePanOnTheLastTimeYouWentIntoFirstPerson = false;
let lastFirstPerson = false;
function CameraToggleStateController(isFirstPerson) {
	const togglePan = CameraInput.getTogglePan();
	const toastTimeout = 3;

	if (isFirstPerson && togglePan !== lastTogglePan) lockStateDirty = true;

	if (lastTogglePan !== togglePan || tick() - lastTogglePanChange > toastTimeout) {
		if (togglePan) lockStateDirty = false;
		lastTogglePanChange = tick();
		lastTogglePan = togglePan;
	}

	if (isFirstPerson !== lastFirstPerson) {
		if (isFirstPerson) {
			wasTogglePanOnTheLastTimeYouWentIntoFirstPerson = CameraInput.getTogglePan();
			CameraInput.setTogglePan(true);
		} else if (!lockStateDirty) {
			CameraInput.setTogglePan(wasTogglePanOnTheLastTimeYouWentIntoFirstPerson);
		}
	}

	if (isFirstPerson) {
		if (CameraInput.getTogglePan()) {
			CameraUtils.setMouseIconOverride(CROSS_MOUSE_ICON);
			CameraUtils.setMouseBehaviorOverride("LockCenter");
			CameraUtils.setRotationTypeOverride("CameraRelative");
		} else {
			CameraUtils.restoreMouseIcon();
			CameraUtils.restoreMouseBehavior();
			CameraUtils.setRotationTypeOverride("CameraRelative");
		}
	} else if (CameraInput.getTogglePan()) {
		CameraUtils.setMouseIconOverride(CROSS_MOUSE_ICON);
		CameraUtils.setMouseBehaviorOverride("LockCenter");
		CameraUtils.setRotationTypeOverride("MovementRelative");
	} else if (CameraInput.getHoldPan()) {
		CameraUtils.restoreMouseIcon();
		CameraUtils.setMouseBehaviorOverride("LockCurrentPosition");
		CameraUtils.setRotationTypeOverride("MovementRelative");
	} else {
		CameraUtils.restoreMouseIcon();
		CameraUtils.restoreMouseBehavior();
		CameraUtils.restoreRotationType();
	}

	lastFirstPerson = isFirstPerson;
}

export class BaseCamera {
	constructor() {
		this.gamepadZoomLevels = [0, 10, 20]; // zoom levels that are cycled through on a gamepad R3 press

		// So that derived classes have access to this
		this.FIRST_PERSON_DISTANCE_THRESHOLD = FIRST_PERSON_DISTANCE_THRESHOLD;

		this.cameraType = null;
		this.cameraMovementMode = null;

		this.lastCameraTransform = null;
		this.lastUserPanCamera = tick();

		this.humanoidRootPart = null;

		// Subject and position on last update call
		this.lastSubject = null;
		this.lastSubjectPosition = new THREE.Vector3(0, 5, 0);
		this.lastSubjectCFrame = CFrame.new(this.lastSubjectPosition);

		this.currentSubjectDistance = clamp(DEFAULT_DISTANCE, player.CameraMinZoomDistance, player.CameraMaxZoomDistance);

		this.inFirstPerson = false;
		this.inMouseLockedMode = false;

		// Used by modules which want to reset the camera angle on respawn.
		this.resetCameraAngle = true;

		this.enabled = false;
		this.isCameraToggle = false;

		this.gamepadZoomPressConnection = null;
		this.characterAddedConnection = null;

		// Mouse locked formerly known as shift lock mode
		this.mouseLockOffset = ZERO_VECTOR3.clone();
	}

	GetModuleName() {
		return "BaseCamera";
	}

	_setUpConfigurations() {
		this.characterAddedConnection = player.CharacterAdded.Connect((char) => this.OnCharacterAdded(char));
		this.humanoidRootPart = null;
		this.OnPlayerCameraPropertyChange();
	}

	OnCharacterAdded() {
		// the camera should only reset when the character dies and respawns
		// not when the camera disables and reenables
		this.resetCameraAngle = this.resetCameraAngle || this.GetEnabled();
		this.humanoidRootPart = null;
	}

	GetHumanoidRootPart() {
		if (!this.humanoidRootPart) {
			const humanoid = this.GetHumanoid();
			if (humanoid) this.humanoidRootPart = humanoid.RootPart;
		}
		return this.humanoidRootPart;
	}

	StepZoom() {
		const zoom = this.currentSubjectDistance;
		const zoomDelta = CameraInput.getZoomDelta();

		if (Math.abs(zoomDelta) > 0) {
			let newZoom;

			if (zoomDelta > 0) {
				newZoom = zoom + zoomDelta * (1 + zoom * ZOOM_SENSITIVITY_CURVATURE);
				newZoom = Math.max(newZoom, this.FIRST_PERSON_DISTANCE_THRESHOLD);
			} else {
				newZoom = (zoom + zoomDelta) / (1 - zoomDelta * ZOOM_SENSITIVITY_CURVATURE);
				newZoom = Math.max(newZoom, FIRST_PERSON_DISTANCE_MIN);
			}

			if (newZoom < this.FIRST_PERSON_DISTANCE_THRESHOLD) newZoom = FIRST_PERSON_DISTANCE_MIN;

			this.SetCameraToSubjectDistance(newZoom);
		}

		return ZoomController.GetZoomRadius();
	}

	GetSubjectPosition() {
		let result = this.lastSubjectPosition;
		const camera = Workspace.CurrentCamera;
		const cameraSubject = camera && camera.CameraSubject;

		if (!cameraSubject) return null;

		if (cameraSubject.IsA && cameraSubject.IsA("Humanoid")) {
			const humanoid = cameraSubject;
			const humanoidIsDead = humanoid.GetState() === "Dead";

			let cameraOffset = humanoid.CameraOffset;
			// when in mouse lock mode, the character's rotation follows the camera instead of vice versa.
			// Allow the mouse lock calculation to be camera based instead of subject based to prevent jitter
			if (this.GetIsMouseLocked()) cameraOffset = new THREE.Vector3();

			let bodyPartToFollow = humanoid.RootPart;

			// If the humanoid is dead, prefer their head part as a follow target, if it exists
			if (humanoidIsDead && humanoid.Parent) {
				bodyPartToFollow = humanoid.Parent.FindFirstChild("Head") || bodyPartToFollow;
			}

			if (bodyPartToFollow) {
				let heightOffset;
				if (humanoid.RigType === "R15") {
					if (humanoid.AutomaticScalingEnabled) {
						heightOffset = R15_HEAD_OFFSET.clone();
						if (bodyPartToFollow === humanoid.RootPart) {
							const rootPartSizeOffset = humanoid.RootPart.Size.y / 2 - HUMANOID_ROOT_PART_SIZE.y / 2;
							heightOffset.add(new THREE.Vector3(0, rootPartSizeOffset, 0));
						}
					} else {
						heightOffset = R15_HEAD_OFFSET_NO_SCALING.clone();
					}
				} else {
					heightOffset = HEAD_OFFSET.clone();
				}

				if (humanoidIsDead) heightOffset = ZERO_VECTOR3.clone();

				const partCFrame = CFrame.fromObject3D(bodyPartToFollow);
				result = partCFrame.p.clone().add(partCFrame.vectorToWorldSpace(heightOffset.add(cameraOffset)));
			}
		}

		this.lastSubject = cameraSubject;
		this.lastSubjectPosition = result;

		return result;
	}

	OnPlayerCameraPropertyChange() {
		// This call forces re-evaluation of player.CameraMode and clamping to min/max distance which may have changed
		this.SetCameraToSubjectDistance(this.currentSubjectDistance);
	}

	// cycles between zoom levels in self.gamepadZoomLevels, setting CameraToSubjectDistance. gamepadZoomLevels may
	// be out of range of Min/Max camera zoom
	GamepadZoomPress() {
		// this code relies on the fact that SetCameraToSubjectDistance will clamp the min and max
		const dist = this.GetCameraToSubjectDistance();

		let max = player.CameraMaxZoomDistance;

		// check from largest to smallest, set the first zoom level which is
		// below the threshold
		for (let i = this.gamepadZoomLevels.length - 1; i >= 0; i--) {
			let zoom = this.gamepadZoomLevels[i];

			if (max < zoom) continue;

			if (zoom < player.CameraMinZoomDistance) {
				zoom = player.CameraMinZoomDistance;
				// no more zoom levels to check, all the remaining ones
				// are < min
				if (max === zoom) break;
			}

			// theshold is set at halfway between zoom levels
			if (dist > zoom + (max - zoom) / 2) {
				this.SetCameraToSubjectDistance(zoom);
				return;
			}

			max = zoom;
		}

		// cycle back to the largest, relies on the fact that SetCameraToSubjectDistance will clamp max and min
		this.SetCameraToSubjectDistance(this.gamepadZoomLevels[this.gamepadZoomLevels.length - 1]);
	}

	Enable(enable) {
		if (this.enabled !== enable) {
			this.enabled = enable;
			this.OnEnabledChanged();
		}
	}

	OnEnabledChanged() {
		if (this.enabled) {
			this._setUpConfigurations();

			CameraInput.setInputEnabled(true);

			this.gamepadZoomPressConnection = CameraInput.gamepadZoomPress.Connect(() => this.GamepadZoomPress());

			if (player.CameraMode === "LockFirstPerson") {
				this.currentSubjectDistance = 0.5;
				if (!this.inFirstPerson) this.EnterFirstPerson();
			}
		} else {
			if (this.characterAddedConnection) this.characterAddedConnection.Disconnect();

			CameraInput.setInputEnabled(false);

			if (this.gamepadZoomPressConnection) {
				this.gamepadZoomPressConnection.Disconnect();
				this.gamepadZoomPressConnection = null;
			}
			// Clean up additional event listeners and reset a bunch of properties
			this.Cleanup();
		}
	}

	GetEnabled() {
		return this.enabled;
	}

	Cleanup() {
		this.lastCameraTransform = null;
		this.lastSubjectCFrame = null;

		// Unlock mouse for example if right mouse button was being held down
		CameraUtils.restoreMouseBehavior();
	}

	UpdateMouseBehavior() {
		if (this.isCameraToggle) {
			CameraInput.enableCameraToggleInput();
			CameraToggleStateController(this.inFirstPerson);
		} else {
			CameraInput.disableCameraToggleInput();

			// first time transition to first person mode or mouse-locked third person
			if (this.inFirstPerson || this.inMouseLockedMode) {
				CameraUtils.setRotationTypeOverride("CameraRelative");
				CameraUtils.setMouseBehaviorOverride("LockCenter");
			} else {
				CameraUtils.restoreRotationType();

				const rotationActivated = CameraInput.getRotationActivated();
				if (rotationActivated) {
					CameraUtils.setMouseBehaviorOverride("LockCurrentPosition");
				} else {
					CameraUtils.restoreMouseBehavior();
				}
			}
		}
	}

	UpdateForDistancePropertyChange() {
		// Calling this setter with the current value will force checking that it is still
		// in range after a change to the min/max distance limits
		this.SetCameraToSubjectDistance(this.currentSubjectDistance);
	}

	SetCameraToSubjectDistance(desiredSubjectDistance) {
		const lastSubjectDistance = this.currentSubjectDistance;

		// By default, camera modules will respect LockFirstPerson and override the currentSubjectDistance with 0
		// regardless of what Player.CameraMinZoomDistance is set to, so that first person can be made
		// available by the developer without needing to allow players to mousewheel dolly into first person.
		// Some modules will override this function to remove or change first-person capability.
		if (player.CameraMode === "LockFirstPerson") {
			this.currentSubjectDistance = 0.5;
			if (!this.inFirstPerson) this.EnterFirstPerson();
		} else {
			const newSubjectDistance = clamp(desiredSubjectDistance, player.CameraMinZoomDistance, player.CameraMaxZoomDistance);
			if (newSubjectDistance < FIRST_PERSON_DISTANCE_THRESHOLD) {
				this.currentSubjectDistance = 0.5;
				if (!this.inFirstPerson) this.EnterFirstPerson();
			} else {
				this.currentSubjectDistance = newSubjectDistance;
				if (this.inFirstPerson) this.LeaveFirstPerson();
			}
		}

		// Pass target distance and zoom direction to the zoom controller
		ZoomController.SetZoomParameters(this.currentSubjectDistance, Math.sign(desiredSubjectDistance - lastSubjectDistance));

		// Returned only for convenience to the caller to know the outcome
		return this.currentSubjectDistance;
	}

	SetCameraType(cameraType) {
		// Used by derived classes
		this.cameraType = cameraType;
	}

	GetCameraType() {
		return this.cameraType;
	}

	// Movement mode standardized to Enum.ComputerCameraMovementMode values
	SetCameraMovementMode(cameraMovementMode) {
		this.cameraMovementMode = cameraMovementMode;
	}

	GetCameraMovementMode() {
		return this.cameraMovementMode;
	}

	SetIsMouseLocked(mouseLocked) {
		this.inMouseLockedMode = mouseLocked;
	}

	GetIsMouseLocked() {
		return this.inMouseLockedMode;
	}

	SetMouseLockOffset(offsetVector) {
		this.mouseLockOffset = offsetVector;
	}

	GetMouseLockOffset() {
		return this.mouseLockOffset;
	}

	InFirstPerson() {
		return this.inFirstPerson;
	}

	EnterFirstPerson() {
		this.inFirstPerson = true;
		this.UpdateMouseBehavior();
	}

	LeaveFirstPerson() {
		this.inFirstPerson = false;
		this.UpdateMouseBehavior();
	}

	// Nominal distance, set by dollying in and out with the mouse wheel or equivalent, not measured distance
	GetCameraToSubjectDistance() {
		return this.currentSubjectDistance;
	}

	// Actual measured distance to the camera Focus point
	GetMeasuredDistanceToFocus() {
		const camera = Workspace.CurrentCamera;
		if (camera) return camera.CoordinateFrame.p.distanceTo(camera.Focus.p);
		return null;
	}

	GetCameraLookVector() {
		return Workspace.CurrentCamera ? Workspace.CurrentCamera.CFrame.LookVector : UNIT_Z.clone();
	}

	CalculateNewLookCFrameFromArg(suppliedLookVector, rotateInput) {
		const currLookVector = suppliedLookVector || this.GetCameraLookVector();
		const currPitchAngle = Math.asin(clamp(currLookVector.y, -1, 1));
		const yTheta = clamp(rotateInput.y, -MAX_Y + currPitchAngle, -MIN_Y + currPitchAngle);
		const constrainedRotateInput = new THREE.Vector2(rotateInput.x, yTheta);
		const startCFrame = CFrame.lookAlong(ZERO_VECTOR3, currLookVector);
		const newLookCFrame = CFrame.Angles(0, -constrainedRotateInput.x, 0).mul(startCFrame).mul(CFrame.Angles(-constrainedRotateInput.y, 0, 0));
		return newLookCFrame;
	}

	CalculateNewLookVectorFromArg(suppliedLookVector, rotateInput) {
		const newLookCFrame = this.CalculateNewLookCFrameFromArg(suppliedLookVector, rotateInput);
		return newLookCFrame.LookVector;
	}

	GetHumanoid() {
		const character = player.Character;
		return character ? character.Humanoid : null;
	}

	IsInFirstPerson() {
		return this.inFirstPerson;
	}

	Update() {
		throw new Error("BaseCamera:Update() This is a virtual function that should never be getting called.");
	}

	GetCameraHeight() {
		return 0;
	}
}
