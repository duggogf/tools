// Gamepad.js
// Port of ControlModule/Gamepad.lua - controls the avatar with a game controller.
import * as THREE from "three";
import { Config } from "./Config.js";
import { UserInputService } from "./UserInputService.js";

const ZERO_VECTOR3 = new THREE.Vector3();
const NONE = "None";
const thumbstickDeadzone = () => Config.MOVE_THUMBSTICK_DEADZONE;

export class Gamepad {
	constructor(CONTROL_ACTION_PRIORITY) {
		this.CONTROL_ACTION_PRIORITY = CONTROL_ACTION_PRIORITY;
		this.enabled = false;
		this.moveVector = ZERO_VECTOR3.clone();
		this.moveVectorIsCameraRelative = true;
		this.isJumping = false;

		this.forwardValue = 0;
		this.backwardValue = 0;
		this.leftValue = 0;
		this.rightValue = 0;
		this.thumbstickVector = ZERO_VECTOR3.clone();

		this.activeGamepad = NONE; // Enum.UserInputType.Gamepad1, 2, 3...
		this._connections = [];
	}

	GetMoveVector() {
		return this.moveVector;
	}

	IsMoveVectorCameraRelative() {
		return this.moveVectorIsCameraRelative;
	}

	GetIsJumping() {
		return this.isJumping;
	}

	Enable(enable) {
		if (enable === this.enabled) return true;

		this.forwardValue = 0;
		this.backwardValue = 0;
		this.leftValue = 0;
		this.rightValue = 0;
		this.thumbstickVector = ZERO_VECTOR3.clone();
		this.moveVector = ZERO_VECTOR3.clone();
		this.isJumping = false;

		if (enable) {
			this.activeGamepad = this.GetHighestPriorityGamepad();
			if (this.activeGamepad !== NONE) {
				this.BindContextActions();
			} else {
				return false;
			}
		} else {
			this.UnbindContextActions();
			this.activeGamepad = NONE;
		}

		this.enabled = enable;
		return true;
	}

	GetHighestPriorityGamepad() {
		const connectedGamepads = UserInputService.GetConnectedGamepads();
		return connectedGamepads.length > 0 ? connectedGamepads[0] : NONE;
	}

	UpdateMovement() {
		this.moveVector = this.thumbstickVector.clone().add(new THREE.Vector3(0, 0, this.forwardValue + this.backwardValue));
	}

	BindContextActions() {
		if (this.activeGamepad === NONE) return false;

		const handleJumpAction = (actionName, inputState) => {
			this.isJumping = inputState === "Begin";
			return "Sink";
		};

		const handleThumbstickInput = (actionName, inputState, inputObject) => {
			if (inputState === "Cancel") {
				this.thumbstickVector = ZERO_VECTOR3.clone();
				this.UpdateMovement();
				return "Sink";
			}

			if (this.activeGamepad !== inputObject.UserInputType) return "Pass";
			if (inputObject.KeyCode !== "Thumbstick1") return;

			if (inputObject.Position.length() > thumbstickDeadzone()) {
				this.thumbstickVector = new THREE.Vector3(inputObject.Position.x, 0, -inputObject.Position.y);
			} else {
				this.thumbstickVector = ZERO_VECTOR3.clone();
			}
			this.UpdateMovement();
			return "Sink";
		};

		this._connections.push(UserInputService.InputBegan.Connect((input) => {
			if (input.KeyCode === "ButtonA") handleJumpAction("jumpAction", "Begin", input);
		}));
		this._connections.push(UserInputService.InputEnded.Connect((input) => {
			if (input.KeyCode === "ButtonA") handleJumpAction("jumpAction", "End", input);
		}));
		this._connections.push(UserInputService.InputChanged.Connect((input) => {
			if (input.KeyCode === "Thumbstick1") handleThumbstickInput("moveThumbstick", "Change", input);
		}));
		return true;
	}

	UnbindContextActions() {
		for (const conn of this._connections) conn.Disconnect();
		this._connections = [];
	}
}
