// MouseLockController.js
// Port of CameraModule/MouseLockController.lua ("shift lock").
import * as THREE from "three";
import { Config, LocalPlayer, UserGameSettings } from "./Config.js";
import { UserInputService } from "./UserInputService.js";
import { Signal } from "./Signal.js";
import * as CameraUtils from "./CameraUtils.js";

const DEFAULT_MOUSE_LOCK_CURSOR = "rbxasset://textures/MouseLockedCursor.png";
const CAMERA_OFFSET_DEFAULT = () => new THREE.Vector3(Config.CAMERA_OFFSET_DEFAULT.x, Config.CAMERA_OFFSET_DEFAULT.y, Config.CAMERA_OFFSET_DEFAULT.z);

export class MouseLockController {
	constructor() {
		this.isMouseLocked = false;
		this.enabled = false;
		this.boundKeys = ["LeftShift", "RightShift"]; // defaults
		this.mouseLockToggledEvent = new Signal();
		this.actionConnection = null;

		UserInputService.PreferredInputChanged.Connect(() => this.UpdateMouseLockAvailability());

		this.UpdateMouseLockAvailability();
	}

	GetIsMouseLocked() {
		return this.isMouseLocked;
	}

	GetBindableToggleEvent() {
		return this.mouseLockToggledEvent;
	}

	GetMouseLockOffset() {
		return CAMERA_OFFSET_DEFAULT();
	}

	UpdateMouseLockAvailability() {
		const devAllowsMouseLock = LocalPlayer.DevEnableMouseLock;
		const devMovementModeIsScriptable = LocalPlayer.DevComputerMovementMode === "Scriptable";
		const userHasMouseLockModeEnabled = UserGameSettings.ControlMode === "MouseLockSwitch";
		const userHasClickToMoveEnabled = UserGameSettings.ComputerMovementMode === "ClickToMove";
		const userUsingKeyboardAndMouse = UserInputService.PreferredInput === "KeyboardAndMouse";
		const MouseLockAvailable = userUsingKeyboardAndMouse && devAllowsMouseLock && userHasMouseLockModeEnabled
			&& !userHasClickToMoveEnabled && !devMovementModeIsScriptable;

		if (MouseLockAvailable !== this.enabled) this.EnableMouseLock(MouseLockAvailable);
	}

	OnMouseLockToggled() {
		this.isMouseLocked = !this.isMouseLocked;

		if (this.isMouseLocked) {
			CameraUtils.setMouseIconOverride(DEFAULT_MOUSE_LOCK_CURSOR);
		} else {
			CameraUtils.restoreMouseIcon();
		}

		this.mouseLockToggledEvent.Fire();
	}

	DoMouseLockSwitch(name, state) {
		if (state === "Begin") {
			this.OnMouseLockToggled();
			return "Sink";
		}
		return "Pass";
	}

	BindContextActions() {
		this.actionConnection = UserInputService.InputBegan.Connect((input, gpe) => {
			if (!gpe && this.boundKeys.includes(input.KeyCode)) this.DoMouseLockSwitch("MouseLockSwitchAction", "Begin", input);
		});
	}

	UnbindContextActions() {
		if (this.actionConnection) {
			this.actionConnection.Disconnect();
			this.actionConnection = null;
		}
	}

	IsMouseLocked() {
		return this.enabled && this.isMouseLocked;
	}

	EnableMouseLock(enable) {
		if (enable !== this.enabled) {
			this.enabled = enable;

			if (this.enabled) {
				// Enabling the mode
				this.BindContextActions();
			} else {
				// Disabling
				// Restore mouse cursor
				CameraUtils.restoreMouseIcon();

				this.UnbindContextActions();

				// If the mode is disabled while being used, fire the event to toggle it off
				if (this.isMouseLocked) {
					this.isMouseLocked = false;
					this.mouseLockToggledEvent.Fire();
				}
			}
		}
	}
}
