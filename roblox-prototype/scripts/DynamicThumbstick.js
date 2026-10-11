// DynamicThumbstick.js
// Port of ControlModule/DynamicThumbstick.lua: the thumbstick appears wherever the
// first finger lands inside the bottom-left frame.
import * as THREE from "three";
import { Config } from "./Config.js";
import { UserInputService } from "./UserInputService.js";

const ZERO_VECTOR3 = new THREE.Vector3();
const MIDDLE_TRANSPARENCIES = [1 - 0.89, 1 - 0.70, 1 - 0.60, 1 - 0.50, 1 - 0.40, 1 - 0.30, 1 - 0.25];
const NUM_MIDDLE_IMAGES = MIDDLE_TRANSPARENCIES.length;
const SAFE_AREA_INSET = 0;

function circle(className, zIndex) {
	const el = document.createElement("div");
	el.className = className;
	el.style.cssText = `position:absolute;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;z-index:${zIndex};transition:opacity 0.15s;`;
	return el;
}

export class DynamicThumbstick {
	constructor() {
		this.enabled = false;
		this.moveVector = ZERO_VECTOR3.clone();
		this.moveVectorIsCameraRelative = true;
		this.isJumping = false;

		this.moveTouchObject = null;
		this.moveTouchLockedIn = false;
		this.moveTouchFirstChanged = false;
		this.moveTouchStartPosition = null;
		this.startImage = null;
		this.endImage = null;
		this.middleImages = [];
		this.isFirstTouch = true;
		this.thumbstickFrame = null;
		this._connections = [];
	}

	GetMoveVector() {
		return this.moveVector;
	}

	IsMoveVectorCameraRelative() {
		return this.moveVectorIsCameraRelative;
	}

	// Note: Overrides base class GetIsJumping with get-and-clear behavior to do a single jump
	// rather than sustained jumping. This is only to preserve the current behavior through the refactor.
	GetIsJumping() {
		const wasJumping = this.isJumping;
		this.isJumping = false;
		return wasJumping;
	}

	Enable(enable, uiParentFrame) {
		if (enable === undefined || enable === null) return false;
		enable = !!enable;
		if (this.enabled === enable) return true;

		if (enable) {
			if (!this.thumbstickFrame) this.Create(uiParentFrame);
			this.BindContextActions();
		} else {
			this.UnbindContextActions();
			this.OnInputEnded(); // Cleanup
		}

		this.enabled = enable;
		this.thumbstickFrame.hidden = !enable;
		return true;
	}

	// Was called OnMoveTouchEnded in previous version
	OnInputEnded() {
		this.moveTouchObject = null;
		this.moveVector = ZERO_VECTOR3.clone();
		this.FadeThumbstick(false);
	}

	FadeThumbstick(visible) {
		if (!visible && this.moveTouchObject) return;
		if (this.isFirstTouch) return;
		this.startImage.style.opacity = visible ? "1" : "0";
		this.endImage.style.opacity = visible ? "0.8" : "0";
		this.middleImages.forEach((img, i) => { img.style.opacity = visible ? `${1 - MIDDLE_TRANSPARENCIES[i]}` : "0"; });
	}

	InputInFrame(inputObject) {
		const rect = this.thumbstickFrame.getBoundingClientRect();
		const p = inputObject.Position;
		return p.x >= rect.left && p.y >= rect.top && p.x <= rect.right && p.y <= rect.bottom;
	}

	DoMove(direction) {
		let currentMoveVector = direction;

		// Scaled Radial Dead Zone
		const inputAxisMagnitude = currentMoveVector.length();
		if (inputAxisMagnitude < this.radiusOfDeadZone) {
			currentMoveVector = ZERO_VECTOR3.clone();
		} else {
			const unit = currentMoveVector.clone().normalize().multiplyScalar(
				1 - Math.max(0, (this.radiusOfMaxSpeed - inputAxisMagnitude) / this.radiusOfMaxSpeed),
			);
			currentMoveVector = new THREE.Vector3(unit.x, 0, unit.y);
		}
		this.moveVector = currentMoveVector;
	}

	LayoutMiddleImages(startPos, endPos) {
		const startDist = this.thumbstickSize / 2 + this.middleSize;
		const vector = endPos.clone().sub(startPos);
		const distAvailable = vector.length() - this.thumbstickRingSize / 2 - this.middleSize;
		const direction = vector.clone().normalize();

		const distNeeded = this.middleSpacing * NUM_MIDDLE_IMAGES;
		let spacing = this.middleSpacing;

		if (distNeeded < distAvailable) spacing = distAvailable / NUM_MIDDLE_IMAGES;

		for (let i = 1; i <= NUM_MIDDLE_IMAGES; i++) {
			const image = this.middleImages[i - 1];
			const distWithout = startDist + spacing * (i - 2);
			const currentDist = startDist + spacing * (i - 1);

			if (distWithout < distAvailable) {
				const pos = endPos.clone().sub(direction.clone().multiplyScalar(currentDist));
				const exposedFraction = Math.min(Math.max(1 - (currentDist - distAvailable) / spacing, 0), 1);
				image.hidden = false;
				image.style.left = `${pos.x}px`;
				image.style.top = `${pos.y}px`;
				image.style.width = image.style.height = `${this.middleSize * exposedFraction}px`;
			} else {
				image.hidden = true;
			}
		}
	}

	MoveStick(pos) {
		const rect = this.thumbstickFrame.getBoundingClientRect();
		const startPos = new THREE.Vector2(this.moveTouchStartPosition.x - rect.left, this.moveTouchStartPosition.y - rect.top);
		const endPos = new THREE.Vector2(pos.x - rect.left, pos.y - rect.top);
		this.endImage.style.left = `${endPos.x}px`;
		this.endImage.style.top = `${endPos.y}px`;
		this.LayoutMiddleImages(startPos, endPos);
	}

	BindContextActions() {
		const inputBegan = (inputObject) => {
			if (this.moveTouchObject) return "Pass";
			if (!this.InputInFrame(inputObject)) return "Pass";

			if (this.isFirstTouch) {
				this.isFirstTouch = false;
				this.endImage.style.background = "rgba(0,0,0,0.55)";
			}

			this.moveTouchLockedIn = false;
			this.moveTouchObject = inputObject;
			this.moveTouchStartPosition = inputObject.Position.clone();
			this.moveTouchFirstChanged = true;
			return "Pass";
		};

		const inputChanged = (inputObject) => {
			if (inputObject === this.moveTouchObject) {
				if (this.moveTouchFirstChanged) {
					this.moveTouchFirstChanged = false;

					const rect = this.thumbstickFrame.getBoundingClientRect();
					const startPosVec2 = new THREE.Vector2(inputObject.Position.x - rect.left, inputObject.Position.y - rect.top);
					this.startImage.hidden = false;
					this.startImage.style.left = `${startPosVec2.x}px`;
					this.startImage.style.top = `${startPosVec2.y}px`;
					this.endImage.hidden = false;
					this.endImage.style.left = this.startImage.style.left;
					this.endImage.style.top = this.startImage.style.top;

					this.FadeThumbstick(true);
					this.MoveStick(inputObject.Position);
				}

				this.moveTouchLockedIn = true;

				const direction = new THREE.Vector2(
					inputObject.Position.x - this.moveTouchStartPosition.x,
					inputObject.Position.y - this.moveTouchStartPosition.y,
				);
				if (Math.abs(direction.x) > 0 || Math.abs(direction.y) > 0) {
					this.DoMove(direction);
					this.MoveStick(inputObject.Position);
				}
				return "Sink";
			}
			return "Pass";
		};

		const inputEnded = (inputObject) => {
			if (inputObject === this.moveTouchObject) {
				this.OnInputEnded();
				if (this.moveTouchLockedIn) return "Sink";
			}
			return "Pass";
		};

		this._connections.push(UserInputService.InputBegan.Connect((input, gpe) => {
			if (input.UserInputType === "Touch" && !gpe) inputBegan(input);
		}));
		this._connections.push(UserInputService.InputChanged.Connect((input) => {
			if (input.UserInputType === "Touch") inputChanged(input);
		}));
		this._connections.push(UserInputService.InputEnded.Connect((input) => {
			if (input.UserInputType === "Touch") inputEnded(input);
		}));
	}

	UnbindContextActions() {
		for (const conn of this._connections) conn.Disconnect();
		this._connections = [];
	}

	Create(parentFrame) {
		this.thumbstickFrame = document.createElement("div");
		this.thumbstickFrame.id = "DynamicThumbstickFrame";
		this.thumbstickFrame.hidden = true;
		this.thumbstickFrame.style.cssText = "position:absolute;overflow:visible;";

		const layoutThumbstickFrame = (portraitMode) => {
			const s = this.thumbstickFrame.style;
			if (portraitMode) {
				s.left = `${-SAFE_AREA_INSET}px`; s.top = "60%";
				s.width = `calc(100% + ${SAFE_AREA_INSET}px)`; s.height = `calc(40% + ${SAFE_AREA_INSET}px)`;
			} else {
				s.left = `${-SAFE_AREA_INSET}px`; s.top = `${100 / 3}%`;
				s.width = `calc(40% + ${SAFE_AREA_INSET}px)`; s.height = `calc(${200 / 3}% + ${SAFE_AREA_INSET}px)`;
			}
		};

		this.startImage = circle("ThumbstickStart", 10);
		this.startImage.style.border = "3px solid rgba(255,255,255,0.75)";
		this.startImage.style.background = "rgba(0,0,0,0.2)";
		this.endImage = circle("ThumbstickEnd", 10);
		this.endImage.style.background = "rgba(255,255,255,0.8)";
		this.thumbstickFrame.append(this.startImage, this.endImage);
		for (let i = 0; i < NUM_MIDDLE_IMAGES; i++) {
			const img = circle("ThumbstickMiddle", 9);
			img.style.background = "rgba(255,255,255,1)";
			img.style.opacity = `${1 - MIDDLE_TRANSPARENCIES[i]}`;
			img.hidden = true;
			this.middleImages.push(img);
			this.thumbstickFrame.append(img);
		}

		const ResizeThumbstick = () => {
			const isBigScreen = Math.min(window.innerWidth, window.innerHeight) > 500;
			const scale = isBigScreen ? 2 : 1;
			const DEFAULT_MIDDLE_SPACING = Config.DEFAULT_MIDDLE_SIZE + 4;
			this.thumbstickSize = Config.DEFAULT_THUMBSTICK_SIZE * scale;
			this.thumbstickRingSize = Config.DEFAULT_RING_SIZE * scale;
			this.middleSize = Config.DEFAULT_MIDDLE_SIZE * scale;
			this.middleSpacing = DEFAULT_MIDDLE_SPACING * scale;
			this.radiusOfDeadZone = Config.RADIUS_OF_DEAD_ZONE * scale;
			this.radiusOfMaxSpeed = Config.RADIUS_OF_MAX_SPEED * scale;

			const ring = this.thumbstickRingSize * 3.7;
			const knob = this.thumbstickSize * 0.8;
			const rect = this.thumbstickFrame.getBoundingClientRect();
			const x = this.thumbstickRingSize * 3.3 + SAFE_AREA_INSET;
			const y = rect.height - this.thumbstickRingSize * 2.8 - SAFE_AREA_INSET;
			this.startImage.style.width = this.startImage.style.height = `${ring}px`;
			this.endImage.style.width = this.endImage.style.height = `${knob}px`;
			if (!this.moveTouchObject) {
				for (const img of [this.startImage, this.endImage]) {
					img.style.left = `${x}px`;
					img.style.top = `${y}px`;
				}
			}
		};

		const onViewportSizeChanged = () => {
			layoutThumbstickFrame(window.innerWidth < window.innerHeight);
			ResizeThumbstick();
		};

		parentFrame.append(this.thumbstickFrame);
		window.addEventListener("resize", onViewportSizeChanged);
		onViewportSizeChanged();
		// Re-measure once visible (the frame has no size while hidden).
		requestAnimationFrame(onViewportSizeChanged);
		this._resize = onViewportSizeChanged;
	}
}
