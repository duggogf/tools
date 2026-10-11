// TouchJump.js
// Port of ControlModule/TouchJump.lua: jump button for touch devices.
import { UserInputService } from "./UserInputService.js";

export class TouchJump {
	constructor() {
		this.enabled = false;
		this.parentUIFrame = null;
		this.jumpButton = null;
		this.externallyEnabled = false;
		this.isJumping = false;
		this._active = false;
		this.touchObject = null;
		this.humanoid = null;
		this._connections = [];
	}

	GetIsJumping() {
		return this.isJumping;
	}

	_reset() {
		this.isJumping = false;
		this.touchObject = null;
		if (this.jumpButton) this.jumpButton.classList.remove("pressed");
	}

	EnableButton(enable) {
		if (enable === this._active) return;

		if (enable) {
			if (!this.jumpButton) this.Create();
			this.jumpButton.hidden = false;
		} else if (this.jumpButton) {
			this.jumpButton.hidden = true;
		}
		this._reset();
		this._active = enable;
	}

	UpdateEnabled() {
		const humanoid = this.humanoid;
		const canJump = humanoid && ((humanoid.UseJumpPower && humanoid.JumpPower > 0) || (!humanoid.UseJumpPower && humanoid.JumpHeight > 0));
		this.EnableButton(!!(humanoid && this.externallyEnabled && canJump));
	}

	SetHumanoid(humanoid) {
		this.humanoid = humanoid;
		this.UpdateEnabled();
		this._reset();
	}

	Enable(enable, parentFrame) {
		if (parentFrame) this.parentUIFrame = parentFrame;
		if (this.externallyEnabled === enable) return;
		this.externallyEnabled = enable;
		this.UpdateEnabled();
	}

	Create() {
		if (!this.parentUIFrame) return;

		this.jumpButton = document.createElement("div");
		this.jumpButton.id = "JumpButton";
		this.jumpButton.hidden = true;
		this.jumpButton.dataset.sinkInput = "";

		const ResizeJumpButton = () => {
			const minAxis = Math.min(window.innerWidth, window.innerHeight);
			const isSmallScreen = minAxis <= 500;
			const jumpButtonSize = isSmallScreen ? 70 : 120;
			const s = this.jumpButton.style;
			s.width = s.height = `${jumpButtonSize}px`;
			s.left = `calc(100% - ${jumpButtonSize * 1.5 - 10}px)`;
			s.top = isSmallScreen ? `calc(100% - ${jumpButtonSize + 20}px)` : `calc(100% - ${jumpButtonSize * 1.75}px)`;
		};
		ResizeJumpButton();
		window.addEventListener("resize", ResizeJumpButton);

		this.touchObject = null;
		const UIS = UserInputService;
		// jumpButton.InputBegan / InputEnded, emulated by hit-testing the button rect.
		UIS.InputBegan.Connect((inputObject) => {
			if (this.touchObject || inputObject.UserInputType !== "Touch" || inputObject.UserInputState !== "Begin") return;
			if (this.jumpButton.hidden) return;
			const r = this.jumpButton.getBoundingClientRect();
			const p = inputObject.Position;
			if (p.x < r.left || p.x > r.right || p.y < r.top || p.y > r.bottom) return;
			this.touchObject = inputObject;
			this.jumpButton.classList.add("pressed");
			this.isJumping = true;
		});
		UIS.InputEnded.Connect((inputObject) => {
			if (inputObject === this.touchObject) this._reset();
		});

		this.parentUIFrame.append(this.jumpButton);
	}
}
