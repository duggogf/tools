// Humanoid.js
// Kinematic stand-in for the engine Humanoid (C++, unpublished). Property, method,
// event and state names follow the Roblox API; the movement model follows
// docs/roblox-default-gameplay-research.md sections 2-3.
import * as THREE from "three";
import { Config, UserGameSettings } from "./Config.js";
import { Workspace } from "./World.js";
import { Signal } from "./Signal.js";

export const HumanoidStateType = {
	FallingDown: "FallingDown", Ragdoll: "Ragdoll", GettingUp: "GettingUp", Jumping: "Jumping",
	Swimming: "Swimming", Freefall: "Freefall", Flying: "Flying", Landed: "Landed", Running: "Running",
	RunningNoPhysics: "RunningNoPhysics", StrafingNoPhysics: "StrafingNoPhysics", Climbing: "Climbing",
	Seated: "Seated", PlatformStanding: "PlatformStanding", Dead: "Dead", Physics: "Physics", None: "None",
};
const S = HumanoidStateType;

const UP = new THREE.Vector3(0, 1, 0);
const SKIN = 0.01;
const LANDING_TOLERANCE = 0.05;

function slopeAngleDegrees(normal) {
	return Math.acos(Math.min(1, Math.max(-1, normal.y))) * 180 / Math.PI;
}

function wrapAngle(a) {
	return Math.atan2(Math.sin(a), Math.cos(a));
}

export class Humanoid {
	constructor(character) {
		this.Name = "Humanoid";
		this.Parent = character;
		this.RigType = "R15";
		this.AutomaticScalingEnabled = true;

		this.WalkSpeed = Config.CharacterWalkSpeed;
		this.JumpPower = Config.CharacterJumpPower;
		this.JumpHeight = Config.CharacterJumpHeight;
		this.UseJumpPower = Config.CharacterUseJumpPower;
		this.HipHeight = Config.HipHeight;
		this.MaxSlopeAngle = Config.CharacterMaxSlopeAngle;
		this.AutoRotate = Config.AutoRotate;
		this.AutoJumpEnabled = Config.AutoJumpEnabled;
		this.CameraOffset = new THREE.Vector3();
		this.MoveDirection = new THREE.Vector3();
		this.Jump = false;
		this.MaxHealth = 100;
		this._health = 100;
		this.RootPart = character.RootPart;
		this.AssemblyLinearVelocity = new THREE.Vector3();

		this.StateChanged = new Signal(); // (old, new)
		this.Running = new Signal(); // (speed)
		this.Jumping = new Signal(); // (active)
		this.FreeFalling = new Signal(); // (active)
		this.Landed = new Signal(); // (fallSpeed) - replica convenience, Roblox only has the state
		this.Died = new Signal();

		// Replica internals
		this.DebugRays = null; // array to collect the last physics step's rays, or null
		this._autoJumpInputIsTouch = false;
		this._state = S.Running;
		this._stateTime = 0;
		this._time = 0;
		this._lastLandedTime = -Infinity;
		this._moveMagnitude = 0;
		this._velocity = new THREE.Vector3(); // horizontal walk velocity
		this._vy = 0;
		this._yaw = 0;
		this._lastRunningSpeed = -1;
		this._groundSpeed = 0;
		this._floorNormal = UP.clone();
	}

	IsA(className) {
		return className === "Humanoid";
	}

	get Health() {
		return this._health;
	}

	set Health(value) {
		this._health = Math.min(Math.max(value, 0), this.MaxHealth);
		if (this._health <= 0 && this._state !== S.Dead) this._setState(S.Dead);
	}

	TakeDamage(amount) {
		this.Health = this._health - amount;
	}

	GetState() {
		return this._state;
	}

	ChangeState(state) {
		this._setState(state);
	}

	GetGroundSpeed() {
		return this._groundSpeed;
	}

	// Humanoid:Move(moveDirection, relativeToCamera). MoveDirection is a unit vector
	// (or zero); analog magnitude below 1 scales the walk speed.
	Move(moveDirection, relativeToCamera = false) {
		let dir = new THREE.Vector3(moveDirection.x, 0, moveDirection.z);
		if (relativeToCamera && Workspace.CurrentCamera) {
			const look = Workspace.CurrentCamera.CFrame.LookVector;
			dir.applyAxisAngle(UP, Math.atan2(-look.x, -look.z));
		}
		const magnitude = dir.length();
		this._moveMagnitude = Math.min(1, magnitude);
		this.MoveDirection = magnitude > 1e-6 ? dir.divideScalar(magnitude) : new THREE.Vector3();
	}

	// Place the root so the feet rest on `floorY`.
	SetRootFromFeet(position, yaw = 0) {
		this.RootPart.position.set(position.x, position.y + this._hipOffset(), position.z);
		this._yaw = yaw;
		this.RootPart.rotation.set(0, yaw, 0);
		this._velocity.set(0, 0, 0);
		this._vy = 0;
	}

	_hipOffset() {
		return this.HipHeight + this.RootPart.Size.y / 2;
	}

	_jumpVelocity() {
		return this.UseJumpPower ? this.JumpPower : Math.sqrt(2 * Workspace.Gravity * this.JumpHeight);
	}

	_setState(newState) {
		const old = this._state;
		if (old === newState) return;
		this._state = newState;
		this._stateTime = 0;
		this.StateChanged.Fire(old, newState);
		if (old === S.Jumping) this.Jumping.Fire(false);
		if (old === S.Freefall) this.FreeFalling.Fire(false);
		switch (newState) {
			case S.Jumping: this.Jumping.Fire(true); break;
			case S.Freefall: this.FreeFalling.Fire(true); break;
			case S.Landed: this.Landed.Fire(-this._landingVy); break;
			case S.Running:
				this._lastRunningSpeed = this._groundSpeed;
				this.Running.Fire(this._groundSpeed);
				break;
			case S.Dead:
				this._health = 0;
				this.Parent.BreakJoints();
				this.Died.Fire();
				break;
		}
	}

	_ray(origin, direction) {
		const hit = Workspace.Raycast(origin, direction);
		if (this.DebugRays) this.DebugRays.push({ origin: origin.clone(), direction: direction.clone(), hit: hit ? hit.Position.clone() : null });
		return hit;
	}

	// Floor under the root: centre ray first, then 4 rays at GROUND_SAMPLE_RADIUS for
	// ledge support. Accepts walkable floors at most `maxUp` above the feet.
	_findFloor(pos, maxUp, maxDown) {
		const hipOffset = this._hipOffset();
		const feet = pos.y - hipOffset;
		const length = hipOffset + maxDown;
		const r = Config.GROUND_SAMPLE_RADIUS;
		const offsets = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]];
		let best = null;
		for (let i = 0; i < offsets.length; i++) {
			const origin = new THREE.Vector3(pos.x + offsets[i][0], pos.y, pos.z + offsets[i][1]);
			const hit = this._ray(origin, new THREE.Vector3(0, -length, 0));
			if (!hit) continue;
			if (hit.Position.y > feet + maxUp + 1e-4) continue;
			if (slopeAngleDegrees(hit.Normal) >= this.MaxSlopeAngle) continue;
			if (i === 0) return hit;
			if (!best || hit.Position.y > best.Position.y) best = hit;
		}
		return best;
	}

	// Horizontal rays above StepHeight along the move direction; slide along walls by
	// removing the normal component. Returns true if a wall blocked the move.
	_moveHorizontal(pos, move) {
		const feet = pos.y - this._hipOffset();
		const step = Config.StepHeight;
		const heights = [...new Set([step + 0.05, Math.max(step + 0.05, 2.6), 4.6])];
		const radius = Config.BODY_RADIUS;
		let blocked = false;
		let blockNormal = null;
		for (let iter = 0; iter < 3; iter++) {
			const len = Math.hypot(move.x, move.z);
			if (len < 1e-7) break;
			const dir = new THREE.Vector3(move.x / len, 0, move.z / len);
			const lateral = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.8);
			let nearest = null;
			for (const h of heights) {
				for (const side of [0, 1, -1]) {
					const origin = new THREE.Vector3(pos.x + lateral.x * side, feet + h, pos.z + lateral.z * side);
					const hit = this._ray(origin, dir.clone().multiplyScalar(len + radius));
					if (!hit) continue;
					if (slopeAngleDegrees(hit.Normal) < this.MaxSlopeAngle) continue; // walkable slope, not a wall
					if (!nearest || hit.Distance < nearest.Distance) nearest = hit;
				}
			}
			if (!nearest) {
				pos.x += move.x;
				pos.z += move.z;
				break;
			}
			blocked = true;
			const allowed = Math.min(len, Math.max(0, nearest.Distance - radius - SKIN));
			pos.x += dir.x * allowed;
			pos.z += dir.z * allowed;
			const n = new THREE.Vector3(nearest.Normal.x, 0, nearest.Normal.z);
			if (n.lengthSq() < 1e-8) break;
			n.normalize();
			blockNormal = n;
			const remaining = dir.clone().multiplyScalar(len - allowed);
			remaining.addScaledVector(n, -remaining.dot(n));
			move = remaining;
		}
		return { blocked, blockNormal };
	}

	_ceilingCheck(pos, rise) {
		const length = Config.HEAD_TOP_OFFSET + rise;
		const r = Config.GROUND_SAMPLE_RADIUS * 0.6;
		let lowest = null;
		for (const [ox, oz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
			const hit = this._ray(new THREE.Vector3(pos.x + ox, pos.y, pos.z + oz), new THREE.Vector3(0, length, 0));
			if (hit && (!lowest || hit.Position.y < lowest.Position.y)) lowest = hit;
		}
		return lowest;
	}

	_updateRotation(h) {
		if (!this.AutoRotate) return;
		const camera = Workspace.CurrentCamera;
		if (UserGameSettings.RotationType === "CameraRelative" && camera) {
			const look = camera.CFrame.LookVector;
			if (Math.abs(look.x) + Math.abs(look.z) > 1e-6) this._yaw = Math.atan2(-look.x, -look.z);
		} else if (this.MoveDirection.lengthSq() > 0) {
			const target = Math.atan2(-this.MoveDirection.x, -this.MoveDirection.z);
			const diff = wrapAngle(target - this._yaw);
			const maxStep = Config.AutoRotateSpeed * h;
			this._yaw = wrapAngle(this._yaw + Math.max(-maxStep, Math.min(maxStep, diff)));
		}
		this.RootPart.rotation.set(0, this._yaw, 0);
	}

	_updateWalkVelocity(h) {
		const target = this.MoveDirection.clone().multiplyScalar(this.WalkSpeed * this._moveMagnitude);
		if (target.lengthSq() === 0) {
			this._velocity.set(0, 0, 0); // no momentum on stop
			return;
		}
		const delta = target.sub(this._velocity);
		const maxDelta = this.WalkSpeed / Math.max(1e-6, Config.WalkAccelerationTime) * h;
		if (delta.length() > maxDelta) delta.setLength(maxDelta);
		this._velocity.add(delta);
	}

	_physicsStep(h) {
		this._time += h;
		this._stateTime += h;
		if (this.DebugRays) this.DebugRays.length = 0;

		const pos = this.RootPart.position;
		const hipOffset = this._hipOffset();
		const g = Workspace.Gravity;

		if (this._state === S.Landed) this._setState(S.Running);

		this._updateRotation(h);
		this._updateWalkVelocity(h);

		if (this._state === S.Running && this.Jump && this._time - this._lastLandedTime >= Config.LandedToJumpDelay) {
			this._vy = this._jumpVelocity();
			this.Jump = false;
			this._setState(S.Jumping);
		}

		const move = this._velocity.clone().multiplyScalar(h);
		const startX = pos.x, startZ = pos.z;

		if (this._state === S.Running) {
			const { blocked } = this._moveHorizontal(pos, move);
			if (blocked && this.AutoJumpEnabled && this._autoJumpInputIsTouch && this._moveMagnitude > 0) this.Jump = true;
			const moved = Math.hypot(pos.x - startX, pos.z - startZ);
			const snapDown = moved * Math.tan(Math.min(this.MaxSlopeAngle, 85) * Math.PI / 180) + 0.1;
			const floor = this._findFloor(pos, Config.StepHeight, snapDown);
			const feet = pos.y - hipOffset;
			// Stay grounded on step-ups and when following a walkable slope down; a drop
			// steeper than the floor under us is a ledge.
			const followsSlope = floor && feet - floor.Position.y <= moved * Math.tan(slopeAngleDegrees(floor.Normal) * Math.PI / 180) + LANDING_TOLERANCE;
			if (floor && followsSlope) {
				pos.y = floor.Position.y + hipOffset;
				this._vy = 0;
				this._floorNormal.copy(floor.Normal);
			} else {
				this._vy = 0;
				this._setState(S.Freefall);
			}
		} else if (this._state === S.Jumping || this._state === S.Freefall) {
			this._moveHorizontal(pos, move);
			if (this._state === S.Jumping && this._stateTime >= Config.JumpingStateDuration) this._setState(S.Freefall);

			const y0 = pos.y;
			let newY = y0 + this._vy * h - 0.5 * g * h * h;
			let newVy = this._vy - g * h;

			if (newY > y0) {
				const ceiling = this._ceilingCheck(pos, newY - y0);
				if (ceiling) {
					newY = Math.min(newY, ceiling.Position.y - Config.HEAD_TOP_OFFSET - SKIN);
					newVy = Math.min(newVy, 0);
				}
			}

			if (newVy <= 0) {
				const floor = this._findFloor(pos, Config.StepHeight, Math.max(0, y0 - newY) + LANDING_TOLERANCE);
				if (floor && newY - hipOffset <= floor.Position.y + LANDING_TOLERANCE) {
					pos.y = floor.Position.y + hipOffset;
					this._landingVy = newVy;
					this._vy = 0;
					this._lastLandedTime = this._time;
					this._floorNormal.copy(floor.Normal);
					this._setState(S.Landed);
				} else {
					pos.y = newY;
					this._vy = newVy;
				}
			} else {
				pos.y = newY;
				this._vy = newVy;
			}
		}

		this._frameDistance += Math.hypot(pos.x - startX, pos.z - startZ);
	}

	// Called once per frame after ControlModule.OnRenderStepped.
	Step(dt) {
		if (this._state === S.Dead) return;
		const n = Math.max(1, Math.ceil(dt * Config.PHYSICS_HZ - 1e-6));
		const h = dt / n;
		const start = this.RootPart.position.clone();
		this._frameDistance = 0;
		for (let i = 0; i < n && this._state !== S.Dead; i++) this._physicsStep(h);

		const p = this.RootPart.position;
		this._groundSpeed = dt > 0 ? Math.hypot(p.x - start.x, p.z - start.z) / dt : 0;
		this.AssemblyLinearVelocity.set((p.x - start.x) / dt, this._vy, (p.z - start.z) / dt);

		// Humanoid.Running fires on speed changes while in the Running state.
		if (this._state === S.Running && Math.abs(this._groundSpeed - this._lastRunningSpeed) > 0.01) {
			this._lastRunningSpeed = this._groundSpeed;
			this.Running.Fire(this._groundSpeed);
		}

		if (p.y < Workspace.FallenPartsDestroyHeight) this.Health = 0;
	}
}
