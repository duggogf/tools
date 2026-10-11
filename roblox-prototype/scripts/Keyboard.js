// Keyboard.js
// Port of ControlModule/Keyboard.lua - controls the avatar from a keyboard.
import * as THREE from "three";
import { UserInputService } from "./UserInputService.js";

const ZERO_VECTOR3 = new THREE.Vector3();

// Enum.PlayerActions bindings the engine provides (arrows Left/Right rotate the camera instead).
const PLAYER_ACTIONS = {
	CharacterForward: ["W", "Up"],
	CharacterBackward: ["S", "Down"],
	CharacterLeft: ["A"],
	CharacterRight: ["D"],
	CharacterJump: ["Space"],
};

export class Keyboard {
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

		this.jumpEnabled = true;
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
		if (enable === this.enabled) {
			// Module is already in the state being requested.
			return true;
		}

		this.forwardValue = 0;
		this.backwardValue = 0;
		this.leftValue = 0;
		this.rightValue = 0;
		this.moveVector = ZERO_VECTOR3.clone();
		this.jumpRequested = false;
		this.UpdateJump();

		if (enable) {
			this.BindContextActions();
			this.ConnectFocusEventListeners();
		} else {
			for (const conn of this._connections) conn.Disconnect();
			this._connections = [];
		}

		this.enabled = enable;
		return true;
	}

	UpdateMovement(inputState) {
		if (inputState === "Cancel") {
			this.moveVector = ZERO_VECTOR3.clone();
		} else {
			this.moveVector = new THREE.Vector3(this.leftValue + this.rightValue, 0, this.forwardValue + this.backwardValue);
		}
	}

	UpdateJump() {
		this.isJumping = this.jumpRequested;
	}

	BindContextActions() {
		const handleMoveForward = (actionName, inputState) => {
			this.forwardValue = inputState === "Begin" ? -1 : 0;
			this.UpdateMovement(inputState);
		};
		const handleMoveBackward = (actionName, inputState) => {
			this.backwardValue = inputState === "Begin" ? 1 : 0;
			this.UpdateMovement(inputState);
		};
		const handleMoveLeft = (actionName, inputState) => {
			this.leftValue = inputState === "Begin" ? -1 : 0;
			this.UpdateMovement(inputState);
		};
		const handleMoveRight = (actionName, inputState) => {
			this.rightValue = inputState === "Begin" ? 1 : 0;
			this.UpdateMovement(inputState);
		};
		const handleJumpAction = (actionName, inputState) => {
			this.jumpRequested = this.jumpEnabled && inputState === "Begin";
			this.UpdateJump();
		};

		// ContextActionService:BindActionAtPriority(..., Enum.PlayerActions.X)
		const actions = {
			moveForwardAction: [handleMoveForward, PLAYER_ACTIONS.CharacterForward],
			moveBackwardAction: [handleMoveBackward, PLAYER_ACTIONS.CharacterBackward],
			moveLeftAction: [handleMoveLeft, PLAYER_ACTIONS.CharacterLeft],
			moveRightAction: [handleMoveRight, PLAYER_ACTIONS.CharacterRight],
			jumpAction: [handleJumpAction, PLAYER_ACTIONS.CharacterJump],
		};
		const dispatch = (input, gpe, state) => {
			if (input.UserInputType !== "Keyboard") return;
			for (const [name, [handler, keys]] of Object.entries(actions)) {
				if (keys.includes(input.KeyCode)) handler(name, state, input);
			}
		};
		this._connections.push(UserInputService.InputBegan.Connect((input, gpe) => { if (!gpe) dispatch(input, gpe, "Begin"); }));
		this._connections.push(UserInputService.InputEnded.Connect((input, gpe) => dispatch(input, gpe, "End")));
	}

	ConnectFocusEventListeners() {
		const onFocusReleased = () => {
			this.moveVector = ZERO_VECTOR3.clone();
			this.forwardValue = 0;
			this.backwardValue = 0;
			this.leftValue = 0;
			this.rightValue = 0;
			this.jumpRequested = false;
			this.UpdateJump();
		};
		this._connections.push(UserInputService.WindowFocused.Connect(onFocusReleased));
	}
}
