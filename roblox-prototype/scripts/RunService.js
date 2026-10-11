// RunService.js
// Game clock. tick() in the ported Lua reads this so pausing and fixed stepping
// (used by tests) keep timers such as TIME_BEFORE_AUTO_ROTATE consistent.

let clock = 0;

export const RunService = {
	advance(dt) {
		clock += dt;
	},
};

export function tick() {
	return clock;
}
