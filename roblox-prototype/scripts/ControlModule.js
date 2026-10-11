// ControlModule.js
// Port of PlayerModule/ControlModule.lua: picks the active character controller
// for the preferred input and feeds Humanoid:Move / Humanoid.Jump every frame.
import * as THREE from "three";
import { LocalPlayer } from "./Config.js";
import { Workspace } from "./World.js";
import { UserInputService } from "./UserInputService.js";
import { Keyboard } from "./Keyboard.js";
import { Gamepad } from "./Gamepad.js";
import { DynamicThumbstick } from "./DynamicThumbstick.js";
import { TouchJump } from "./TouchJump.js";

const CONTROL_ACTION_PRIORITY = 2000; // Enum.ContextActionPriority.Default

const movementEnumToModuleMap = {
	DynamicThumbstick,
	KeyboardMouse: Keyboard,
	Gamepad,
};

export class ControlModule {
	constructor(touchGui) {
		// map from Module to the instance created from it
		this.controllers = new Map();

		this.activeControlModule = null; // Used to prevent unnecessarily expensive checks on each input event
		this.activeController = null;
		this.touchJumpController = null;
		this.moveFunction = (player, moveVector, relativeToCamera) => {
			if (this.humanoid) this.humanoid.Move(moveVector, relativeToCamera);
		};
		this.humanoid = null;
		this.controlsEnabled = true;

		this.inputMoveVector = new THREE.Vector3();

		this.touchGui = touchGui;
		this.touchControlFrame = touchGui ? touchGui.querySelector("#TouchControlFrame") : null;

		LocalPlayer.CharacterAdded.Connect((char) => this.OnCharacterAdded(char));
		LocalPlayer.CharacterRemoving.Connect((char) => this.OnCharacterRemoving(char));
		if (LocalPlayer.Character) this.OnCharacterAdded(LocalPlayer.Character);

		UserInputService.PreferredInputChanged.Connect(() => this.UpdateMovementMode());
		UserInputService.GamepadConnected.Connect(() => this.UpdateMovementMode());
		UserInputService.GamepadDisconnected.Connect(() => this.UpdateMovementMode());

		this.UpdateMovementMode();
	}

	// Convenience function so that calling code does not have to first get the activeController
	GetMoveVector() {
		if (this.activeController) return this.activeController.GetMoveVector();
		return new THREE.Vector3();
	}

	GetActiveController() {
		return this.activeController;
	}

	UpdateActiveControlModuleEnabled() {
		// helpers for disable/enable
		const disable = () => {
			this.activeController.Enable(false);
			if (this.touchJumpController) this.touchJumpController.Enable(false);
			if (this.moveFunction) this.moveFunction(LocalPlayer, new THREE.Vector3(), true);
		};

		const enable = () => {
			if (this.activeControlModule === DynamicThumbstick) {
				// For the dynamic thumbstick, the jump button is a child of the thumbstick frame
				this.activeController.Enable(true, this.touchControlFrame);
			} else {
				this.activeController.Enable(true);
			}

			if (this.touchControlFrame && this.activeControlModule === DynamicThumbstick) {
				if (!this.touchJumpController) this.touchJumpController = new TouchJump();
				this.touchJumpController.Enable(true, this.touchControlFrame);
				this.touchJumpController.SetHumanoid(this.humanoid);
			} else if (this.touchJumpController) {
				this.touchJumpController.Enable(false);
			}
		};

		// there is no active controller
		if (!this.activeController) return;

		// developer called ControlModule:Disable(), don't turn back on
		if (!this.controlsEnabled) {
			disable();
			return;
		}

		enable();
	}

	Enable(enable = true) {
		if (this.controlsEnabled === enable) return;
		this.controlsEnabled = enable;
		if (!this.activeController) return;
		this.UpdateActiveControlModuleEnabled();
	}

	Disable() {
		this.Enable(false);
	}

	SelectComputerMovementModule() {
		if (UserInputService.PreferredInput === "Gamepad" && UserInputService.GetConnectedGamepads().length > 0) {
			return Gamepad;
		}
		return Keyboard;
	}

	SelectTouchModule() {
		return movementEnumToModuleMap["DynamicThumbstick"];
	}

	calculateRawMoveVector(humanoid, cameraRelativeMoveVector) {
		const camera = Workspace.CurrentCamera;
		if (!camera) return cameraRelativeMoveVector;
		const cameraCFrame = camera.CFrame;

		let c, s;
		const [, , , R00, R01, R02, , , R12, , , R22] = cameraCFrame.GetComponents();
		if (R12 < 1 && R12 > -1) {
			// X and Z components from back vector.
			c = R22;
			s = R02;
		} else {
			// In this case the camera is looking straight up or straight down.
			// Use X components from right and up vectors.
			c = R00;
			s = -R01 * Math.sign(R12);
		}
		const norm = Math.sqrt(c * c + s * s);
		return new THREE.Vector3(
			(c * cameraRelativeMoveVector.x + s * cameraRelativeMoveVector.z) / norm,
			0,
			(c * cameraRelativeMoveVector.z - s * cameraRelativeMoveVector.x) / norm,
		);
	}

	OnRenderStepped() {
		if (this.activeController && this.activeController.enabled && this.humanoid) {
			// Now retrieve info from the controller
			let moveVector = this.activeController.GetMoveVector();
			const cameraRelative = this.activeController.IsMoveVectorCameraRelative();

			// ClickToMove and VehicleController are not part of the replica.
			if (cameraRelative) moveVector = this.calculateRawMoveVector(this.humanoid, moveVector);

			this.inputMoveVector = moveVector;
			this.moveFunction(LocalPlayer, moveVector, false);

			// And make them jump if needed
			this.humanoid.Jump = this.activeController.GetIsJumping() || !!(this.touchJumpController && this.touchJumpController.GetIsJumping());
			// The engine only auto-jumps for touch-controlled humanoids.
			this.humanoid._autoJumpInputIsTouch = this.activeControlModule === DynamicThumbstick;
		}
	}

	OnCharacterAdded(char) {
		this.humanoid = char.Humanoid;
		if (this.touchJumpController) this.touchJumpController.SetHumanoid(this.humanoid);
		this.UpdateMovementMode();
	}

	OnCharacterRemoving() {
		this.humanoid = null;
		this.UpdateTouchGuiVisibility();
	}

	UpdateTouchGuiVisibility() {
		if (this.touchGui) {
			const doShow = !!this.humanoid && UserInputService.PreferredInput === "Touch";
			this.touchGui.hidden = !doShow;
		}
	}

	SwitchToController(controlModule) {
		// controlModule is invalid, just disable current controller
		if (!controlModule) {
			if (this.activeController) this.activeController.Enable(false);
			this.activeController = null;
			this.activeControlModule = null;
			return;
		}

		// first time switching to this control module, should instantiate it
		if (!this.controllers.has(controlModule)) {
			this.controllers.set(controlModule, new controlModule(CONTROL_ACTION_PRIORITY));
		}

		// switch to the new controlModule
		if (this.activeController !== this.controllers.get(controlModule)) {
			if (this.activeController) this.activeController.Enable(false);
			this.activeController = this.controllers.get(controlModule);
			this.activeControlModule = controlModule; // Only used to check if controller switch is necessary

			this.UpdateActiveControlModuleEnabled();
		}
	}

	UpdateMovementMode() {
		this.UpdateTouchGuiVisibility();

		if (UserInputService.PreferredInput === "Touch") {
			const touchModule = this.SelectTouchModule();
			if (this.touchControlFrame) this.SwitchToController(touchModule);
		} else {
			if (this.touchJumpController) this.touchJumpController.Enable(false);
			const computerModule = this.SelectComputerMovementModule();
			this.SwitchToController(computerModule);
		}
	}
}
