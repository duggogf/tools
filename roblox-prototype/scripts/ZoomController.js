// ZoomController.js
// Port of CameraModule/ZoomController.lua and ZoomController/Popper.lua.
// Controls the distance between the focus and the camera.
import * as THREE from "three";
import { Config, LocalPlayer } from "./Config.js";
import { CFrame } from "./CFrame.js";
import { Workspace, RaycastParams } from "./World.js";

const ZOOM_STIFFNESS = () => Config.ZOOM_STIFFNESS;
const ZOOM_DEFAULT = Config.ZOOM_DEFAULT;
const ZOOM_ACCELERATION = 0.0375;

const MIN_FOCUS_DIST = Config.MIN_FOCUS_DIST;
const DIST_OPAQUE = Config.DIST_OPAQUE;

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const inf = Infinity;

// Lua's math.min(a, b) keeps `a` when `b` is NaN (it only replaces on b < a);
// Popper relies on that when the focus is not moving (0/0).
const luaMin = (a, b) => (b < a ? b : a);

// --------------------------------------------------------------------------------
// Popper.lua: prevents the camera from clipping through walls.

const excludeParams = new RaycastParams();
excludeParams.IgnoreWater = true;
excludeParams.FilterType = "Exclude";
excludeParams.RespectCanCollide = true;

const includeParams = new RaycastParams();
includeParams.IgnoreWater = true;
includeParams.FilterType = "Include";

function getTotalTransparency(part) {
	return 1 - (1 - part.Transparency) * (1 - part.LocalTransparencyModifier);
}

let nearPlaneZ, projX, projY;
function updateProjection() {
	const camera = Workspace.CurrentCamera;
	const fov = camera.FieldOfView * Math.PI / 180;
	const view = camera.ViewportSize;
	const ar = view.x / view.y;
	projY = 2 * Math.tan(fov / 2);
	projX = ar * projY;
	nearPlaneZ = camera.NearPlaneZ;
}

// Character models of every player. Character parts are not in Workspace.parts,
// so this list never matches a ray, but it is kept for a 1:1 port.
let excludeList = [];
export function PopperSetCharacters(characters) {
	excludeList = [...characters];
}

let subjectRoot = null;
let subjectPart = null;
export function PopperSetSubject(subject) {
	subjectPart = subject && subject.RootPart ? subject.RootPart : subject || null;
}

function canOcclude(part) {
	// Occluders must be:
	// 1. Opaque
	// 2. Interactable
	// 3. Not in the same assembly as the subject
	return getTotalTransparency(part) < 0.25
		&& part.CanCollide
		&& subjectRoot !== (part.GetRootPart() || part)
		&& !(part.IsA && part.IsA("TrussPart"));
}

// Offsets for the volume visibility test
const SCAN_SAMPLE_OFFSETS = [
	new THREE.Vector2(0.4, 0.0),
	new THREE.Vector2(-0.4, 0.0),
	new THREE.Vector2(0.0, -0.4),
	new THREE.Vector2(0.0, 0.4),
	new THREE.Vector2(0.0, 0.2),
];

// Maximum number of rays that can be cast
const QUERY_POINT_CAST_LIMIT = 64;

// Piercing raycasts
function getCollisionPoint(origin, dir) {
	excludeParams.FilterDescendantsInstances = excludeList;
	const raycastResult = Workspace.Raycast(origin, dir, excludeParams);
	if (raycastResult) return [raycastResult.Position, true];
	return [origin.clone().add(dir), false];
}

function queryPoint(origin, unitDir, dist, lastPos) {
	dist = dist + nearPlaneZ;
	const target = origin.clone().addScaledVector(unitDir, dist);

	let softLimit = inf;
	let hardLimit = inf;
	let movingOrigin = origin;

	let numPierced = 0;

	excludeParams.FilterDescendantsInstances = excludeList;
	let entryInstance;
	do {
		const enterRaycastResult = Workspace.Raycast(movingOrigin, target.clone().sub(movingOrigin), excludeParams);
		if (!enterRaycastResult) break;

		numPierced += 1;

		entryInstance = enterRaycastResult.Instance;
		const entryPosition = enterRaycastResult.Position;
		const lim = entryPosition.distanceTo(origin);

		if (numPierced >= QUERY_POINT_CAST_LIMIT) {
			hardLimit = lim;
		} else if (canOcclude(entryInstance)) {
			includeParams.FilterDescendantsInstances = [entryInstance];

			const exitRaycastResult = Workspace.Raycast(target, entryPosition.clone().sub(target), includeParams);
			if (exitRaycastResult) {
				const promote = lastPos
					? (Workspace.Raycast(lastPos, target.clone().sub(lastPos), includeParams)
						|| Workspace.Raycast(target, lastPos.clone().sub(target), includeParams))
					: false;

				if (promote) {
					// Ostensibly a soft limit, but the camera has passed through it in the last frame, so promote to a hard limit.
					hardLimit = lim;
				} else if (dist < softLimit) {
					// Trivial soft limit
					softLimit = lim;
				}
			} else {
				// Trivial hard limit
				hardLimit = lim;
			}
		}

		excludeParams.AddToFilter(entryInstance);
		movingOrigin = entryPosition.clone().addScaledVector(unitDir, -1e-3);
	} while (!(hardLimit < inf || !entryInstance));

	return [softLimit - nearPlaneZ, hardLimit - nearPlaneZ];
}

function queryViewport(focus, dist) {
	const fP = focus.p;
	const fX = focus.RightVector;
	const fY = focus.UpVector;
	const fZ = focus.LookVector.negate();

	const camera = Workspace.CurrentCamera;
	const viewport = camera.ViewportSize;

	let hardBoxLimit = inf;
	let softBoxLimit = inf;

	// Center the viewport on the PoI, sweep points on the edge towards the target, and take the minimum limits
	for (let viewX = 0; viewX <= 1; viewX++) {
		const worldX = fX.clone().multiplyScalar((viewX - 0.5) * projX);

		for (let viewY = 0; viewY <= 1; viewY++) {
			const worldY = fY.clone().multiplyScalar((viewY - 0.5) * projY);

			const origin = fP.clone().add(worldX.clone().add(worldY).multiplyScalar(nearPlaneZ));
			const lastPos = camera.ViewportPointToRay(viewport.x * viewX, viewport.y * viewY).Origin;

			const [softPointLimit, hardPointLimit] = queryPoint(origin, fZ, dist, lastPos);

			if (hardPointLimit < hardBoxLimit) hardBoxLimit = hardPointLimit;
			if (softPointLimit < softBoxLimit) softBoxLimit = softPointLimit;
		}
	}

	return [softBoxLimit, hardBoxLimit];
}

function testPromotion(focus, dist, focusExtrapolation) {
	const fP = focus.p;
	const fX = focus.RightVector;
	const fY = focus.UpVector;
	const fZ = focus.LookVector.negate();

	{
		// Dead reckoning the camera rotation and focus
		const SAMPLE_DT = 0.0625;
		const SAMPLE_MAX_T = 1.25;

		const maxDist = getCollisionPoint(fP, focusExtrapolation.posVelocity.clone().multiplyScalar(SAMPLE_MAX_T))[0].distanceTo(fP);
		// Metric that decides how many samples to take
		const combinedSpeed = focusExtrapolation.posVelocity.length();

		const tMax = luaMin(SAMPLE_MAX_T, focusExtrapolation.rotVelocity.length() + maxDist / combinedSpeed);
		for (let dt = 0; dt <= tMax; dt += SAMPLE_DT) {
			const cfDt = focusExtrapolation.extrapolate(dt); // Extrapolated CFrame at time dt

			if (queryPoint(cfDt.p, cfDt.LookVector.negate(), dist)[0] >= dist) return false;
		}
	}

	{
		// Test screen-space offsets from the focus for the presence of soft limits
		for (const offset of SCAN_SAMPLE_OFFSETS) {
			const scaledOffset = offset;
			const pos = getCollisionPoint(fP, fX.clone().multiplyScalar(scaledOffset.x).add(fY.clone().multiplyScalar(scaledOffset.y)))[0];
			const dir = fP.clone().addScaledVector(fZ, dist).sub(pos).normalize();
			if (queryPoint(pos, dir, dist)[0] === inf) return false;
		}
	}

	return true;
}

export function Popper(focus, targetDist, focusExtrapolation) {
	updateProjection();
	subjectRoot = subjectPart;

	let dist = targetDist;
	const [soft, hard] = queryViewport(focus, targetDist);
	if (hard < dist) dist = hard;
	if (soft < dist && testPromotion(focus, targetDist, focusExtrapolation)) dist = soft;

	subjectRoot = null;
	return dist;
}

// --------------------------------------------------------------------------------
// ZoomController.lua

class ConstrainedSpring {
	constructor(freq, x, minValue, maxValue) {
		x = clamp(x, minValue, maxValue);
		this.freq = freq; // Undamped frequency (Hz)
		this.x = x; // Current position
		this.v = 0; // Current velocity
		this.minValue = minValue; // Minimum bound
		this.maxValue = maxValue; // Maximum bound
		this.goal = x; // Goal position
	}

	Step(dt) {
		const freq = this.freq * 2 * Math.PI; // Convert from Hz to rad/s
		const x = this.x;
		const v = this.v;
		const minValue = this.minValue;
		const maxValue = this.maxValue;
		const goal = this.goal;

		// Solve the spring ODE for position and velocity after time t, assuming critical damping:
		//   2*f*x'[t] + x''[t] = f^2*(g - x[t])
		// Knowns are x[0] and x'[0].
		// Solve for x[t] and x'[t].

		const offset = goal - x;
		const step = freq * dt;
		const decay = Math.exp(-step);

		let x1 = goal + (v * dt - offset * (step + 1)) * decay;
		let v1 = ((offset * freq - v) * step + v) * decay;

		// Constrain
		if (x1 < minValue) {
			x1 = minValue;
			v1 = 0;
		} else if (x1 > maxValue) {
			x1 = maxValue;
			v1 = 0;
		}

		this.x = x1;
		this.v = v1;
		return x1;
	}
}

const zoomSpring = new ConstrainedSpring(ZOOM_STIFFNESS(), ZOOM_DEFAULT, MIN_FOCUS_DIST, LocalPlayer.CameraMaxZoomDistance);

function stepTargetZoom(z, dz, zoomMin, zoomMax) {
	z = clamp(z + dz * (1 + z * ZOOM_ACCELERATION), zoomMin, zoomMax);
	if (z < DIST_OPAQUE) z = dz <= 0 ? zoomMin : DIST_OPAQUE;
	return z;
}

let zoomDelta = 0;

export const ZoomController = {
	lastPoppedZoom: Infinity, // debug readout only

	Update(renderDt, focus, extrapolation) {
		const cameraMinZoomDistance = LocalPlayer.CameraMinZoomDistance;
		const cameraMaxZoomDistance = LocalPlayer.CameraMaxZoomDistance;
		let poppedZoom = Infinity;

		if (zoomSpring.goal > DIST_OPAQUE) {
			// Make a pessimistic estimate of zoom distance for this step without accounting for poppercam
			const maxPossibleZoom = Math.max(
				zoomSpring.x,
				stepTargetZoom(zoomSpring.goal, zoomDelta, cameraMinZoomDistance, cameraMaxZoomDistance),
			);

			// Run the Popper algorithm on the feasible zoom range, [MIN_FOCUS_DIST, maxPossibleZoom]
			poppedZoom = Popper(
				focus.mul(CFrame.new(0, 0, MIN_FOCUS_DIST)),
				maxPossibleZoom - MIN_FOCUS_DIST,
				extrapolation,
			) + MIN_FOCUS_DIST;
		}

		this.lastPoppedZoom = poppedZoom;
		zoomSpring.freq = ZOOM_STIFFNESS();
		zoomSpring.minValue = MIN_FOCUS_DIST;
		zoomSpring.maxValue = Math.min(cameraMaxZoomDistance, poppedZoom);

		return zoomSpring.Step(renderDt);
	},

	GetZoomRadius() {
		return zoomSpring.x;
	},

	SetZoomParameters(targetZoom, newZoomDelta) {
		zoomSpring.goal = targetZoom;
		zoomDelta = newZoomDelta;
	},

	ReleaseSpring() {
		zoomSpring.x = zoomSpring.goal;
		zoomSpring.v = 0;
	},
};
