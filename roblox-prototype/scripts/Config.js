// Config.js
// Every tunable in one place, named after the Roblox property or PlayerModule
// constant it mirrors. Values marked MEASURE are not published by Roblox and are
// best estimates; dial them in the settings panel, then bake the result here.

export const Config = {
	// Workspace
	Gravity: 196.2, // studs/s^2
	FallenPartsDestroyHeight: -500,

	// StarterPlayer / Humanoid
	CharacterWalkSpeed: 16, // studs/s
	CharacterJumpPower: 50, // studs/s, UseJumpPower = true is the Roblox default
	CharacterUseJumpPower: true,
	CharacterJumpHeight: 7.2, // only used when CharacterUseJumpPower is false
	CharacterMaxSlopeAngle: 89, // degrees
	HipHeight: 2.0, // blocky R15
	RootPartSize: { x: 2, y: 2, z: 1 }, // HumanoidRootPart
	AutoRotate: true,
	AutoJumpEnabled: true, // touch only, like Roblox
	RespawnTime: 5,

	// Humanoid internals (MEASURE in Studio)
	AutoRotateSpeed: 20, // rad/s, MEASURE
	WalkAccelerationTime: 0.05, // s to reach WalkSpeed from rest, MEASURE
	StepHeight: 1.0, // max ledge the humanoid walks over, MEASURE
	LandedToJumpDelay: 0.08, // s between Landed and the next allowed jump, MEASURE
	JumpingStateDuration: 0.1, // s the Jumping state lasts before Freefall

	// StarterPlayer camera
	CameraMaxZoomDistance: 400,
	CameraMinZoomDistance: 0.5,
	EnableMouseLockOption: true,
	DevComputerCameraMovementMode: "Classic", // Classic | Follow | CameraToggle
	FieldOfView: 70, // vertical degrees
	NameDisplayDistance: 100,

	// UserGameSettings
	MouseSensitivity: 1, // 0..4
	GamepadCameraSensitivity: 1,
	CameraYInverted: false,

	// BaseCamera / ClassicCamera
	DEFAULT_DISTANCE: 12.5,
	FIRST_PERSON_DISTANCE_THRESHOLD: 1.0,
	FIRST_PERSON_DISTANCE_MIN: 0.5,
	MIN_Y: -80 * Math.PI / 180,
	MAX_Y: 80 * Math.PI / 180,
	R15_HEAD_OFFSET: { x: 0, y: 1.5, z: 0 },
	HUMANOID_ROOT_PART_SIZE: { x: 2, y: 2, z: 1 },
	ZOOM_SENSITIVITY_CURVATURE: 0.5,
	INITIAL_CAMERA_PITCH: -15 * Math.PI / 180,
	TIME_BEFORE_AUTO_ROTATE: 2, // Follow mode
	FOLLOW_THETA_CUTOFF: 0.4, // Follow mode

	// CameraInput
	ROTATION_SPEED_KEYS: 120 * Math.PI / 180, // rad/s
	ROTATION_SPEED_GAMEPAD: { x: 1, y: 0.77, scale: 4 * Math.PI / 180 * 60 }, // rad/s
	ROTATION_SPEED_MOUSE: { x: 1, y: 0.77, scale: 0.5 * Math.PI / 180 }, // rad per pixel
	ROTATION_SPEED_TOUCH: { x: 1, y: 0.66, scale: 1 * Math.PI / 180 }, // rad per pixel
	MIN_TOUCH_SENSITIVITY_FRACTION: 0.25,
	ZOOM_SPEED_MOUSE: 1, // per wheel notch
	ZOOM_SPEED_KEYS: 0.1, // per second
	ZOOM_SPEED_TOUCH: 0.04, // per pinch pixel
	THUMBSTICK_CURVATURE: 2,
	THUMBSTICK_DEADZONE: 0.1, // camera stick
	MOVE_THUMBSTICK_DEADZONE: 0.2, // Gamepad.lua thumbstickDeadzone

	// ZoomController
	ZOOM_STIFFNESS: 4.5, // Hz
	ZOOM_DEFAULT: 12.5,
	MIN_FOCUS_DIST: 0.5,
	DIST_OPAQUE: 1,

	// MouseLockController
	CAMERA_OFFSET_DEFAULT: { x: 1.75, y: 0, z: 0 },

	// TransparencyController
	MAX_TWEEN_RATE: 2.8, // per second

	// DynamicThumbstick (pixels, x2 on screens with min axis > 500)
	DEFAULT_THUMBSTICK_SIZE: 45,
	DEFAULT_RING_SIZE: 20,
	DEFAULT_OUTER_RING_SIZE: 74,
	DEFAULT_MIDDLE_SIZE: 10,
	RADIUS_OF_DEAD_ZONE: 2,
	RADIUS_OF_MAX_SPEED: 20,

	// Animate
	ANIM_SCALE: 16, // walk clip plays at speed / 16
	RUN_SPEED_THRESHOLD: 0.75,
	JUMP_ANIM_DURATION: 0.31,
	FALL_TRANSITION_TIME: 0.2,
	TOOL_TRANSITION_TIME: 0.1,
};

export const TAU = Math.PI * 2;
export const rad = (deg) => deg * Math.PI / 180;
export const deg = (r) => r * 180 / Math.PI;
