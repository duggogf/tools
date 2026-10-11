// DebugHud.js
// F3 overlay: humanoid state, ground speed, zoom, camera mode, input device, FPS,
// last stub sound event, and the humanoid's collision rays.
import * as THREE from "three";
import { Config, UserGameSettings } from "./Config.js";
import { UserInputService } from "./UserInputService.js";
import { ZoomController } from "./ZoomController.js";
import { SoundEvent } from "./CharacterSounds.js";

const MAX_RAYS = 64;

export class DebugHud {
	constructor(element, scene) {
		this.element = element;
		this.visible = false;
		this.lastSound = "-";
		this.fps = 0;
		this._frames = 0;
		this._fpsTime = 0;
		this.humanoid = null;
		this.cameraModule = null;

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_RAYS * 2 * 3), 3));
		geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(MAX_RAYS * 2 * 3), 3));
		this.rayLines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false }));
		this.rayLines.frustumCulled = false;
		this.rayLines.renderOrder = 999;
		this.rayLines.visible = false;
		scene.add(this.rayLines);

		SoundEvent.Connect((text) => { this.lastSound = text; });
		UserInputService.InputBegan.Connect((input, gpe) => {
			if (!gpe && input.KeyCode === "F3") this.Toggle();
		});
	}

	Toggle(visible = !this.visible) {
		this.visible = visible;
		this.element.hidden = !visible;
		this.rayLines.visible = visible;
		if (this.humanoid) this.humanoid.DebugRays = visible ? [] : null;
	}

	SetHumanoid(humanoid) {
		this.humanoid = humanoid;
		humanoid.DebugRays = this.visible ? [] : null;
	}

	Update(dt) {
		this._frames += 1;
		this._fpsTime += dt;
		if (this._fpsTime >= 0.5) {
			this.fps = this._frames / this._fpsTime;
			this._frames = 0;
			this._fpsTime = 0;
		}
		if (!this.visible) return;

		const h = this.humanoid;
		const cam = this.cameraModule && this.cameraModule.activeCameraController;
		const mouseLock = this.cameraModule && this.cameraModule.activeMouseLockController;
		const lines = [
			["State", h ? h.GetState() : "-"],
			["Ground speed", h ? h.GetGroundSpeed().toFixed(2) : "-"],
			["Zoom", cam ? `${cam.GetCameraToSubjectDistance().toFixed(2)} (actual ${ZoomController.GetZoomRadius().toFixed(2)})` : "-"],
			["Camera", `${Config.DevComputerCameraMovementMode}${cam && cam.InFirstPerson() ? ", first person" : ""}${mouseLock && mouseLock.GetIsMouseLocked() ? ", shift lock" : ""}`],
			["RotationType", UserGameSettings.RotationType],
			["MouseBehavior", UserInputService.MouseBehavior],
			["Input", UserInputService.PreferredInput],
			["FPS", this.fps.toFixed(0)],
			["Sound", this.lastSound],
		];
		this.element.textContent = lines.map(([k, v]) => `${k}: ${v}`).join("\n");

		const rays = h && h.DebugRays ? h.DebugRays : [];
		const pos = this.rayLines.geometry.attributes.position;
		const col = this.rayLines.geometry.attributes.color;
		const n = Math.min(rays.length, MAX_RAYS);
		for (let i = 0; i < n; i++) {
			const r = rays[i];
			const end = r.hit || r.origin.clone().add(r.direction);
			pos.setXYZ(i * 2, r.origin.x, r.origin.y, r.origin.z);
			pos.setXYZ(i * 2 + 1, end.x, end.y, end.z);
			const c = r.hit ? [1, 0.25, 0.2] : [0.2, 1, 0.4];
			col.setXYZ(i * 2, ...c);
			col.setXYZ(i * 2 + 1, ...c);
		}
		this.rayLines.geometry.setDrawRange(0, n * 2);
		pos.needsUpdate = true;
		col.needsUpdate = true;
	}
}
