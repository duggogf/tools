// Animate.js
// Port of the default R15 Animate LocalScript (locomotion part) plus a minimal
// Animator: AnimationTracks with weight fades, Speed, looping, KeyframeReached,
// blended per joint by priority and weight.
import * as THREE from "three";
import { Config } from "./Config.js";
import { Signal } from "./Signal.js";
import { Animations, animNames } from "./Animations.js";

const PRIORITY_ORDER = { Core: 0, Idle: 1, Movement: 2, Action: 3 };

// Precompute quaternions for every pose so blending only slerps.
function compileClip(clip) {
	if (clip._compiled) return clip._compiled;
	const joints = new Set();
	for (const kf of clip.keyframes) for (const name of Object.keys(kf.poses)) joints.add(name);
	const tracks = {};
	for (const joint of joints) {
		const keys = [];
		for (const kf of clip.keyframes) {
			const pose = kf.poses[joint];
			if (!pose) continue;
			const r = pose.rot || [0, 0, 0];
			keys.push({
				t: kf.t,
				easing: kf.easing || "Linear",
				q: new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], "XYZ")),
				p: new THREE.Vector3(...(pose.pos || [0, 0, 0])),
			});
		}
		tracks[joint] = keys;
	}
	const markers = clip.keyframes.filter((kf) => kf.name).map((kf) => ({ t: kf.t, name: kf.name }));
	clip._compiled = { tracks, markers };
	return clip._compiled;
}

function ease(style, a) {
	if (style === "Constant") return 0;
	if (style === "Cubic") return a < 0.5 ? 4 * a * a * a : 1 - (-2 * a + 2) ** 3 / 2;
	return a;
}

function samplePose(keys, t, outQ, outP) {
	if (t <= keys[0].t || keys.length === 1) {
		outQ.copy(keys[0].q);
		outP.copy(keys[0].p);
		return;
	}
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i], b = keys[i + 1];
		if (t <= b.t) {
			const alpha = ease(a.easing, (t - a.t) / Math.max(1e-6, b.t - a.t));
			outQ.slerpQuaternions(a.q, b.q, alpha);
			outP.lerpVectors(a.p, b.p, alpha);
			return;
		}
	}
	const last = keys[keys.length - 1];
	outQ.copy(last.q);
	outP.copy(last.p);
}

export class AnimationTrack {
	constructor(animator, animation) {
		this.Animator = animator;
		this.Animation = animation;
		this.Name = animation.id;
		this.clip = Animations[animation.id];
		this.compiled = compileClip(this.clip);
		this.Length = this.clip.length;
		this.Looped = this.clip.loop;
		this.Priority = this.clip.priority || "Core";
		this.TimePosition = 0;
		this.Speed = 1;
		this.WeightCurrent = 0;
		this.WeightTarget = 0;
		this.IsPlaying = false;
		this._fadeRate = Infinity;
		this.KeyframeReached = new Signal();
		this.Stopped = new Signal();
	}

	Play(fadeTime = 0.1, weight = 1, speed = 1) {
		if (!this.IsPlaying) this.TimePosition = 0;
		this.IsPlaying = true;
		this.Speed = speed;
		this.AdjustWeight(weight, fadeTime);
		this.Animator._add(this);
	}

	Stop(fadeTime = 0.1) {
		this.AdjustWeight(0, fadeTime);
		this._stopping = true;
	}

	AdjustSpeed(speed) {
		this.Speed = speed;
	}

	AdjustWeight(weight, fadeTime = 0.1) {
		this.WeightTarget = weight;
		this._stopping = false;
		this._fadeRate = fadeTime > 0 ? Math.abs(weight - this.WeightCurrent) / fadeTime : Infinity;
		if (!Number.isFinite(this._fadeRate)) this.WeightCurrent = weight;
	}

	Destroy() {}

	_advance(dt) {
		// weight fade
		const diff = this.WeightTarget - this.WeightCurrent;
		const step = this._fadeRate * dt;
		this.WeightCurrent = Math.abs(diff) <= step ? this.WeightTarget : this.WeightCurrent + Math.sign(diff) * step;
		if (this._stopping && this.WeightCurrent <= 0) {
			this.IsPlaying = false;
			this.Stopped.Fire();
			return false;
		}

		// time and named keyframes
		const prev = this.TimePosition;
		let next = prev + dt * this.Speed;
		const length = this.Length;
		const crossed = [];
		if (this.Looped && length > 0) {
			for (const m of this.compiled.markers) {
				if ((m.t > prev && m.t <= next) || (next >= length && m.t <= next - length)) crossed.push(m.name);
			}
			next = ((next % length) + length) % length;
		} else {
			for (const m of this.compiled.markers) if (m.t > prev && m.t <= next) crossed.push(m.name);
			if (next >= length) {
				next = length;
				if (this.IsPlaying && prev < length) {
					// Non-looped tracks hold their last pose until replaced.
					this._ended = true;
				}
			}
		}
		this.TimePosition = next;
		for (const name of crossed) this.KeyframeReached.Fire(name);
		return true;
	}
}

// Animator: plays tracks on a Character rig.
export class Animator {
	constructor(character) {
		this.character = character;
		this.tracks = [];
		this._q = new THREE.Quaternion();
		this._p = new THREE.Vector3();
	}

	LoadAnimation(animation) {
		return new AnimationTrack(this, animation);
	}

	GetPlayingAnimationTracks() {
		return this.tracks.filter((t) => t.IsPlaying);
	}

	_add(track) {
		if (!this.tracks.includes(track)) this.tracks.push(track);
	}

	Step(dt) {
		this.tracks = this.tracks.filter((track) => track._advance(dt));

		// Group tracks by priority; within a group, poses average by weight; a higher
		// priority group overrides the result below it by its total weight (max 1).
		const groups = new Map();
		for (const track of this.tracks) {
			const p = PRIORITY_ORDER[track.Priority] ?? 0;
			if (!groups.has(p)) groups.set(p, []);
			groups.get(p).push(track);
		}
		const order = [...groups.keys()].sort((a, b) => a - b);

		for (const [jointName, pivot] of this.character.pivots) {
			if (pivot === this.character.RootPart) continue;
			const resultQ = new THREE.Quaternion();
			const resultP = new THREE.Vector3();
			for (const p of order) {
				let wSum = 0;
				const accQ = new THREE.Quaternion(0, 0, 0, 0);
				const accP = new THREE.Vector3();
				for (const track of groups.get(p)) {
					const keys = track.compiled.tracks[jointName];
					const w = track.WeightCurrent;
					if (!keys || w <= 0) continue;
					samplePose(keys, track.TimePosition, this._q, this._p);
					if (accQ.x * this._q.x + accQ.y * this._q.y + accQ.z * this._q.z + accQ.w * this._q.w < 0) {
						this._q.set(-this._q.x, -this._q.y, -this._q.z, -this._q.w);
					}
					accQ.set(accQ.x + this._q.x * w, accQ.y + this._q.y * w, accQ.z + this._q.z * w, accQ.w + this._q.w * w);
					accP.addScaledVector(this._p, w);
					wSum += w;
				}
				if (wSum <= 0) continue;
				accQ.normalize();
				accP.divideScalar(wSum);
				const blend = Math.min(1, wSum);
				resultQ.slerp(accQ, blend);
				resultP.lerp(accP, blend);
			}
			pivot.quaternion.copy(resultQ);
			pivot.position.copy(pivot.userData.restPosition).add(resultP);
		}
	}
}

// --- Animate LocalScript ------------------------------------------------------

export class Animate {
	constructor(character) {
		this.Character = character;
		this.Humanoid = character.Humanoid;
		this.animator = new Animator(character);

		this.pose = "Standing";
		this.currentAnim = "";
		this.currentAnimInstance = null;
		this.currentAnimTrack = null;
		this.currentAnimKeyframeHandler = null;
		this.currentAnimSpeed = 1.0;
		this.jumpAnimTime = 0;
		this.jumpAnimDuration = Config.JUMP_ANIM_DURATION;
		this.fallTransitionTime = Config.FALL_TRANSITION_TIME;

		// animTable[name] = { count, totalWeight, [i] = { anim, weight } }
		this.animTable = {};
		for (const [name, list] of Object.entries(animNames)) {
			this.animTable[name] = list.map((entry) => ({ anim: entry, weight: entry.weight }));
			this.animTable[name].totalWeight = list.reduce((sum, e) => sum + e.weight, 0);
		}

		const humanoid = this.Humanoid;
		this._connections = [
			humanoid.Died.Connect(() => this.onDied()),
			humanoid.Running.Connect((speed) => this.onRunning(speed)),
			humanoid.Jumping.Connect((active) => this.onJumping(active)),
			humanoid.FreeFalling.Connect((active) => this.onFreeFall(active)),
		];

		// initialize to idle
		this.playAnimation("idle", 0.1, humanoid);
		this.pose = "Standing";
	}

	rollAnimation(animName) {
		const list = this.animTable[animName];
		let roll = Math.floor(Math.random() * list.totalWeight) + 1;
		let idx = 0;
		while (roll > list[idx].weight) {
			roll -= list[idx].weight;
			idx += 1;
		}
		return idx;
	}

	switchToAnim(anim, animName, transitionTime, humanoid) {
		// switch animation
		if (anim !== this.currentAnimInstance) {
			if (this.currentAnimTrack) {
				this.currentAnimTrack.Stop(transitionTime);
				this.currentAnimTrack.Destroy();
			}

			this.currentAnimSpeed = 1.0;
			this.currentAnim = animName;
			this.currentAnimInstance = anim;

			// load it to the humanoid; get AnimationTrack
			this.currentAnimTrack = this.animator.LoadAnimation(anim);
			this.currentAnimTrack.Priority = "Core";

			// play the animation
			this.currentAnimTrack.Play(transitionTime);

			// set up keyframe name triggers
			if (this.currentAnimKeyframeHandler) this.currentAnimKeyframeHandler.Disconnect();
			this.currentAnimKeyframeHandler = this.currentAnimTrack.KeyframeReached.Connect((frameName) => this.keyFrameReachedFunc(frameName));
		}
	}

	playAnimation(animName, transitionTime, humanoid) {
		const idx = this.rollAnimation(animName);
		const anim = this.animTable[animName][idx].anim;
		this.switchToAnim(anim, animName, transitionTime, humanoid);
	}

	setAnimationSpeed(speed) {
		if (speed !== this.currentAnimSpeed) {
			this.currentAnimSpeed = speed;
			this.currentAnimTrack.AdjustSpeed(this.currentAnimSpeed);
		}
	}

	keyFrameReachedFunc(frameName) {
		if (frameName === "End") {
			const repeatAnim = this.currentAnim;
			const animSpeed = this.currentAnimSpeed;
			this.playAnimation(repeatAnim, 0.15, this.Humanoid);
			this.setAnimationSpeed(animSpeed);
		}
	}

	stopAllAnimations() {
		const oldAnim = this.currentAnim;
		this.currentAnim = "";
		this.currentAnimInstance = null;
		if (this.currentAnimKeyframeHandler) this.currentAnimKeyframeHandler.Disconnect();
		if (this.currentAnimTrack) {
			this.currentAnimTrack.Stop();
			this.currentAnimTrack.Destroy();
			this.currentAnimTrack = null;
		}
		return oldAnim;
	}

	// State Change Event Handlers

	onRunning(speed) {
		if (speed > Config.RUN_SPEED_THRESHOLD) {
			const scale = Config.ANIM_SCALE;
			this.playAnimation("walk", 0.2, this.Humanoid);
			this.setAnimationSpeed(speed / scale);
			this.pose = "Running";
		} else {
			this.playAnimation("idle", 0.2, this.Humanoid);
			this.pose = "Standing";
		}
	}

	onDied() {
		this.pose = "Dead";
	}

	// Humanoid.Jumping and FreeFalling also fire with active = false when the state
	// is left; only the entering edge drives the animation (0.31 s jump guard).
	onJumping(active) {
		if (active === false) return;
		this.playAnimation("jump", 0.1, this.Humanoid);
		this.jumpAnimTime = this.jumpAnimDuration;
		this.pose = "Jumping";
	}

	onFreeFall(active) {
		if (active === false) return;
		// Walking off a ledge waits the same jumpAnimDuration guard before the fall clip
		// (research doc section 6), so short drops keep the walk/idle clip.
		if (this.pose !== "Jumping") this.jumpAnimTime = this.jumpAnimDuration;
		if (this.jumpAnimTime <= 0) this.playAnimation("fall", this.fallTransitionTime, this.Humanoid);
		this.pose = "FreeFall";
	}

	stepAnimate(deltaTime) {
		if (this.jumpAnimTime > 0) this.jumpAnimTime = this.jumpAnimTime - deltaTime;

		if (this.pose === "FreeFall" && this.jumpAnimTime <= 0) {
			this.playAnimation("fall", this.fallTransitionTime, this.Humanoid);
		} else if (this.pose === "Running") {
			this.playAnimation("walk", 0.2, this.Humanoid);
		} else if (this.pose === "Dead") {
			this.stopAllAnimations();
		}
	}

	Step(dt) {
		this.stepAnimate(dt);
		this.animator.Step(dt);
	}

	Destroy() {
		for (const conn of this._connections) conn.Disconnect();
	}
}
