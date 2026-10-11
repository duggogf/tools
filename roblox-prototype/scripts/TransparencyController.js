// TransparencyController.js
// Port of CameraModule/TransparencyController.lua: fades the character out as the
// camera gets close to the subject.
import { Workspace } from "./World.js";
import { Config } from "./Config.js";
import { Round } from "./CameraUtils.js";

const MAX_TWEEN_RATE = () => Config.MAX_TWEEN_RATE; // per second

export class TransparencyController {
	constructor() {
		this.transparencyDirty = false;
		this.enabled = false;
		this.lastTransparency = null;
		this.cachedParts = new Set();
	}

	// BasePart descendants of the character (Decals live on the head texture).
	IsValidPartToModify(part) {
		return !!(part.IsA && part.IsA("BasePart"));
	}

	CachePartsRecursive(object) {
		for (const part of object.GetDescendants()) {
			if (this.IsValidPartToModify(part)) {
				this.cachedParts.add(part);
				this.transparencyDirty = true;
			}
		}
	}

	TeardownTransparency() {
		for (const child of this.cachedParts) child.LocalTransparencyModifier = 0;
		this.cachedParts = new Set();
		this.transparencyDirty = true;
		this.lastTransparency = null;
	}

	SetupTransparency(character) {
		this.TeardownTransparency();
		this.CachePartsRecursive(character);
	}

	Enable(enable) {
		if (this.enabled !== enable) this.enabled = enable;
	}

	SetSubject(subject) {
		let character = null;
		if (subject && subject.IsA && subject.IsA("Humanoid")) character = subject.Parent;
		if (character) this.SetupTransparency(character);
		else this.TeardownTransparency();
	}

	Update(dt) {
		const currentCamera = Workspace.CurrentCamera;

		if (currentCamera && this.enabled) {
			// calculate goal transparency based on distance
			const distance = currentCamera.Focus.p.distanceTo(currentCamera.CoordinateFrame.p);
			let transparency = distance < 2 ? 1.0 - (distance - 0.5) / 1.5 : 0; // (7 - distance) / 5
			if (transparency < 0.5) {
				// too far, don't control transparency
				transparency = 0;
			}

			// tween transparency if the goal is not fully transparent and the subject was not fully transparent last frame
			if (this.lastTransparency !== null && transparency < 1 && this.lastTransparency < 0.95) {
				let deltaTransparency = transparency - this.lastTransparency;
				const maxDelta = MAX_TWEEN_RATE() * dt;
				deltaTransparency = Math.min(Math.max(deltaTransparency, -maxDelta), maxDelta);
				transparency = this.lastTransparency + deltaTransparency;
			} else {
				this.transparencyDirty = true;
			}

			transparency = Math.min(Math.max(Round(transparency, 2), 0), 1);

			// update transparencies
			if (this.transparencyDirty || this.lastTransparency !== transparency) {
				for (const child of this.cachedParts) child.LocalTransparencyModifier = transparency;
				this.transparencyDirty = false;
				this.lastTransparency = transparency;
			}
		}
	}
}
