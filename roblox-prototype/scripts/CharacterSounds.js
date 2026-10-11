// CharacterSounds.js
// Stub of RbxCharacterSounds: reacts to the same Humanoid state changes and reports
// which sound would play (no audio assets are shipped).
import { Signal } from "./Signal.js";

const SOUND_DATA = {
	Running: { SoundId: "rbxasset://sounds/action_footsteps_plastic.mp3", Looped: true, Volume: 0.65 },
	Jumping: { SoundId: "rbxasset://sounds/action_jump.mp3" },
	Landing: { SoundId: "rbxasset://sounds/action_jump_land.mp3" },
	FreeFalling: { SoundId: "rbxasset://sounds/action_falling.ogg", Looped: true },
	Died: { SoundId: "rbxasset://sounds/uuhhh.mp3" },
};

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const map = (x, inMin, inMax, outMin, outMax) => (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

export const SoundEvent = new Signal(); // (text)

export class CharacterSounds {
	constructor(humanoid) {
		this.humanoid = humanoid;
		this.playing = new Set();
		this._connections = [
			humanoid.StateChanged.Connect((old, state) => this.onStateChanged(old, state)),
			humanoid.Running.Connect((speed) => this.onRunning(speed)),
		];
	}

	log(name, detail = "") {
		const sound = SOUND_DATA[name];
		const file = sound.SoundId.split("/").pop();
		SoundEvent.Fire(`${name}: ${file}${detail ? ` ${detail}` : ""}`);
	}

	play(name, detail) {
		if (SOUND_DATA[name].Looped) {
			if (this.playing.has(name)) return;
			this.playing.add(name);
		}
		this.log(name, detail);
	}

	stop(name) {
		if (this.playing.delete(name)) SoundEvent.Fire(`${name}: stopped`);
	}

	onStateChanged(old, state) {
		if (old === "Running") this.stop("Running");
		if (old === "Freefall") this.stop("FreeFalling");
		switch (state) {
			case "Jumping": this.play("Jumping"); break;
			case "Freefall": this.play("FreeFalling", "(fades in at 0.9/s)"); break;
			case "Landed": {
				const fallSpeed = Math.abs(this.humanoid._landingVy || 0);
				const volume = clamp(map(fallSpeed, 50, 100, 0, 1), 0, 1);
				this.play("Landing", `volume ${volume.toFixed(2)}`);
				break;
			}
			case "Dead": this.play("Died"); break;
		}
	}

	onRunning(speed) {
		if (this.humanoid.GetState() !== "Running") return;
		if (speed > 0.5) this.play("Running", `speed ${(speed / 16).toFixed(2)}`);
		else this.stop("Running");
	}

	Destroy() {
		for (const conn of this._connections) conn.Disconnect();
		this.playing.clear();
	}
}
