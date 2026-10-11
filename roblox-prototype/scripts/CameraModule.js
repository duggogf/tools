// CameraModule.js
// Port of PlayerModule/CameraModule.lua: owns the active camera controller,
// occlusion module, transparency controller and mouse lock controller, and
// updates them once per frame at camera render priority.
import { Config, LocalPlayer } from "./Config.js";
import { Workspace } from "./World.js";
import { UserInputService } from "./UserInputService.js";
import { CameraInput } from "./CameraInput.js";
import { ClassicCamera } from "./ClassicCamera.js";
import { Poppercam } from "./Poppercam.js";
import { TransparencyController } from "./TransparencyController.js";
import { MouseLockController } from "./MouseLockController.js";

export class CameraModule {
	constructor() {
		this.activeTransparencyController = new TransparencyController();
		this.activeOcclusionModule = null;
		this.activeCameraController = null;
		this.activeMouseLockController = null;

		this.activeTransparencyController.Enable(true);

		this.activeMouseLockController = new MouseLockController();
		this.activeMouseLockController.GetBindableToggleEvent().Connect(() => this.OnMouseLockToggled());

		this.ActivateOcclusionModule(LocalPlayer.DevCameraOcclusionMode);

		LocalPlayer.CharacterAdded.Connect((char) => this.OnCharacterAdded(char));
		LocalPlayer.CharacterRemoving.Connect((char) => this.OnCharacterRemoving(char));
		UserInputService.PreferredInputChanged.Connect(() => this.OnPreferredInputChanged());
		// MouseBehavior must be applied inside the input event for pointer lock to be granted.
		UserInputService.UserGestureProcessed.Connect(() => {
			if (this.activeCameraController) this.activeCameraController.UpdateMouseBehavior();
		});

		this.OnCurrentCameraChanged();
	}

	GetCameraMovementModeFromSettings() {
		if (LocalPlayer.CameraMode === "LockFirstPerson") return "Classic";
		// DevComputerCameraMode is UserChoice, so the user setting is respected
		return Config.DevComputerCameraMovementMode;
	}

	ActivateOcclusionModule(occlusionMode) {
		if (occlusionMode === "Zoom" && !this.activeOcclusionModule) {
			this.activeOcclusionModule = new Poppercam();
			this.activeOcclusionModule.Enable(true);
		}
		this.occlusionMode = occlusionMode;
	}

	ActivateCameraController() {
		const cameraMovementMode = this.GetCameraMovementModeFromSettings();
		if (!this.activeCameraController) {
			this.activeCameraController = new ClassicCamera();
			this.activeCameraController.Enable(true);
		} else if (!this.activeCameraController.GetEnabled()) {
			this.activeCameraController.Enable(true);
		}
		this.activeCameraController.SetCameraMovementMode(cameraMovementMode);
		this.activeCameraController.SetCameraType(Workspace.CurrentCamera.CameraType);
	}

	// Note: The active transparency controller could be made to listen for this event itself.
	OnCameraSubjectChanged() {
		const camera = Workspace.CurrentCamera;
		const cameraSubject = camera ? camera.CameraSubject : null;

		if (this.activeTransparencyController) this.activeTransparencyController.SetSubject(cameraSubject);
		if (this.activeOcclusionModule) this.activeOcclusionModule.OnCameraSubjectChanged(cameraSubject);

		this.ActivateCameraController();
	}

	OnCurrentCameraChanged() {
		const currentCamera = Workspace.CurrentCamera;
		if (!currentCamera) return;
		if (this.cameraSubjectChangedConn) this.cameraSubjectChangedConn.Disconnect();
		this.cameraSubjectChangedConn = currentCamera.CameraSubjectChanged.Connect(() => this.OnCameraSubjectChanged());
		this.OnCameraSubjectChanged();
	}

	// Settings panel hooks (Player property changed signals in Roblox)
	OnLocalPlayerCameraPropertyChanged(propertyName) {
		if (propertyName === "CameraMinZoomDistance" || propertyName === "CameraMaxZoomDistance") {
			if (this.activeCameraController) this.activeCameraController.UpdateForDistancePropertyChange();
		} else if (propertyName === "DevEnableMouseLock") {
			this.activeMouseLockController.UpdateMouseLockAvailability();
		}
	}

	OnUserGameSettingsPropertyChanged(propertyName) {
		if (propertyName === "ComputerCameraMovementMode") this.ActivateCameraController();
	}

	OnPreferredInputChanged() {
		this.ActivateCameraController();
	}

	// Main RenderStep Update. The camera controller and occlusion module both have opportunities
	// to set and modify (respectively) the CFrame and Focus before it is set once on CurrentCamera.
	Update(dt) {
		if (this.activeCameraController) {
			this.activeCameraController.UpdateMouseBehavior();

			let [newCameraCFrame, newCameraFocus] = this.activeCameraController.Update(dt);

			if (this.activeOcclusionModule && !this.activeCameraController.skipOcclusion) {
				[newCameraCFrame, newCameraFocus] = this.activeOcclusionModule.Update(dt, newCameraCFrame, newCameraFocus);
			}

			// Here is where the new CFrame and Focus are set for this render frame
			const currentCamera = Workspace.CurrentCamera;
			currentCamera.CFrame = newCameraCFrame;
			currentCamera.Focus = newCameraFocus;

			// Update to character local transparency as needed based on camera-to-subject distance
			if (this.activeTransparencyController) this.activeTransparencyController.Update(dt);

			if (CameraInput.getInputEnabled()) CameraInput.resetInputForFrameEnd();
		}
	}

	OnCharacterAdded(char) {
		if (this.activeOcclusionModule) this.activeOcclusionModule.CharacterAdded(char, LocalPlayer);
	}

	OnCharacterRemoving(char) {
		if (this.activeOcclusionModule) this.activeOcclusionModule.CharacterRemoving(char, LocalPlayer);
	}

	OnMouseLockToggled() {
		if (this.activeMouseLockController) {
			const mouseLocked = this.activeMouseLockController.GetIsMouseLocked();
			const mouseLockOffset = this.activeMouseLockController.GetMouseLockOffset();
			if (this.activeCameraController) {
				this.activeCameraController.SetIsMouseLocked(mouseLocked);
				this.activeCameraController.SetMouseLockOffset(mouseLockOffset);
			}
		}
	}
}
