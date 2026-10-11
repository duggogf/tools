// SettingsPanel.js
// lil-gui panel for the unpublished engine values (estimates in Config.js).
import GUI from "lil-gui";
import { Config } from "./Config.js";

export function createSettingsPanel(container, { getHumanoid, cameraModule, resetCharacter }) {
	const gui = new GUI({ container, title: "Settings" });
	if (window.innerWidth < 700) gui.close();

	// Humanoid properties apply to the live humanoid and to future spawns.
	const humanoidProps = {
		WalkSpeed: "CharacterWalkSpeed",
		JumpPower: "CharacterJumpPower",
	};
	const humanoidState = {
		WalkSpeed: Config.CharacterWalkSpeed,
		JumpPower: Config.CharacterJumpPower,
	};
	const fHumanoid = gui.addFolder("Humanoid");
	for (const [prop, configKey] of Object.entries(humanoidProps)) {
		const range = prop === "WalkSpeed" ? [0, 100, 0.5] : [0, 200, 1];
		fHumanoid.add(humanoidState, prop, ...range).onChange((v) => {
			Config[configKey] = v;
			const h = getHumanoid();
			if (h) h[prop] = v;
		});
	}
	fHumanoid.add(Config, "AutoRotateSpeed", 1, 60, 0.5).name("AutoRotateSpeed (rad/s)");
	fHumanoid.add(Config, "WalkAccelerationTime", 0, 0.5, 0.005);
	fHumanoid.add(Config, "StepHeight", 0, 3, 0.05);
	fHumanoid.add(Config, "LandedToJumpDelay", 0, 0.5, 0.005);
	fHumanoid.add(Config, "JumpingStateDuration", 0, 0.5, 0.005);
	fHumanoid.add({ reset: resetCharacter }, "reset").name("Reset Character");

	const fWorld = gui.addFolder("Workspace");
	fWorld.add(Config, "Gravity", 0, 400, 0.1);

	const fCamera = gui.addFolder("Camera");
	fCamera.add(Config, "DevComputerCameraMovementMode", ["Classic", "Follow", "CameraToggle"]).name("Camera mode")
		.onChange(() => cameraModule.OnUserGameSettingsPropertyChanged("ComputerCameraMovementMode"));
	fCamera.add(Config, "CameraMinZoomDistance", 0.5, 50, 0.5)
		.onChange(() => cameraModule.OnLocalPlayerCameraPropertyChanged("CameraMinZoomDistance"));
	fCamera.add(Config, "CameraMaxZoomDistance", 0.5, 400, 0.5)
		.onChange(() => cameraModule.OnLocalPlayerCameraPropertyChanged("CameraMaxZoomDistance"));
	fCamera.add(Config, "FieldOfView", 1, 120, 1);
	fCamera.add(Config, "EnableMouseLockOption")
		.onChange(() => cameraModule.OnLocalPlayerCameraPropertyChanged("DevEnableMouseLock"));
	fCamera.add(Config, "MouseSensitivity", 0, 4, 0.01);
	fCamera.add(Config, "GamepadCameraSensitivity", 0, 4, 0.01);
	fCamera.add(Config, "CameraYInverted");

	return gui;
}
