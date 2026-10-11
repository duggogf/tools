// main.js
// Boots the scene and runs the frame in Roblox RenderStepped order:
// ControlModule (Input) -> Humanoid physics -> CameraModule (Camera) -> Animate -> render.
import * as THREE from "three";
import { Config, LocalPlayer } from "./Config.js";
import { RunService, tick } from "./RunService.js";
import { UserInputService } from "./UserInputService.js";
import { Workspace, Camera } from "./World.js";
import { CameraModule } from "./CameraModule.js";
import { ControlModule } from "./ControlModule.js";
import { Character } from "./Character.js";
import { Animate } from "./Animate.js";
import { CharacterSounds } from "./CharacterSounds.js";
import { DebugHud } from "./DebugHud.js";
import { createSettingsPanel } from "./SettingsPanel.js";

const canvas = document.getElementById("viewport");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#8fc4ec");
scene.fog = new THREE.Fog("#8fc4ec", 600, 1400);

scene.add(new THREE.HemisphereLight("#dcecff", "#6b6b5e", 1.4));
const sun = new THREE.DirectionalLight("#ffffff", 1.8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const shadowCamera = sun.shadow.camera;
shadowCamera.left = shadowCamera.bottom = -70;
shadowCamera.right = shadowCamera.top = 70;
shadowCamera.near = 1;
shadowCamera.far = 400;
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);
const SUN_OFFSET = new THREE.Vector3(-60, 120, 40);

const threeCamera = new THREE.PerspectiveCamera(Config.FieldOfView, window.innerWidth / window.innerHeight, -Config.NearPlaneZ, 5000);
Workspace.CurrentCamera = new Camera(threeCamera);
Workspace.Build(scene);

UserInputService.Init(canvas, document.getElementById("mouse-lock-cursor"));

const cameraModule = new CameraModule();
const controlModule = new ControlModule(document.getElementById("TouchGui"));
const hud = new DebugHud(document.getElementById("hud"), scene);
hud.cameraModule = cameraModule;

let character = null;
let animate = null;
let sounds = null;
let respawnAt = null;
const stateLog = [];

function LoadCharacter() {
	if (character) {
		LocalPlayer.CharacterRemoving.Fire(character);
		character.Destroy();
		animate.Destroy();
		sounds.Destroy();
	}
	character = new Character(LocalPlayer.Name);
	const humanoid = character.Humanoid;
	scene.add(character.Model);
	const spawn = Workspace.GetSpawnPosition(0);
	humanoid.SetRootFromFeet(spawn, 0);
	character.Model.updateMatrixWorld(true);

	animate = new Animate(character);
	sounds = new CharacterSounds(humanoid);
	hud.SetHumanoid(humanoid);
	humanoid.StateChanged.Connect((old, state) => {
		stateLog.push(state);
		if (stateLog.length > 200) stateLog.shift();
	});
	humanoid.Died.Connect(() => {
		respawnAt = tick() + Config.RespawnTime; // Players.RespawnTime
	});

	LocalPlayer.Character = character;
	LocalPlayer.CharacterAdded.Fire(character);
	Workspace.CurrentCamera.CameraSubject = humanoid;
}

createSettingsPanel(document.getElementById("panel"), {
	getHumanoid: () => (character ? character.Humanoid : null),
	cameraModule,
	resetCharacter: () => { if (character) character.Humanoid.Health = 0; },
});

LoadCharacter();

function step(dt) {
	RunService.advance(dt);
	if (respawnAt !== null && tick() >= respawnAt) {
		respawnAt = null;
		LoadCharacter();
	}
	UserInputService.Step();
	controlModule.OnRenderStepped(dt);
	character.Humanoid.Step(dt);
	character.StepRagdoll(dt);
	cameraModule.Update(dt);
	animate.Step(dt);
	hud.Update(dt);

	threeCamera.fov = Config.FieldOfView;
	threeCamera.updateProjectionMatrix();
	const focus = character.RootPart.position;
	sun.position.copy(focus).add(SUN_OFFSET);
	sun.target.position.copy(focus);
}

let paused = false;
let last = performance.now();
function frame(now) {
	requestAnimationFrame(frame);
	const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
	last = now;
	if (!paused && dt > 0) step(dt);
	renderer.render(scene, threeCamera);
}
requestAnimationFrame(frame);

window.addEventListener("resize", () => {
	threeCamera.aspect = window.innerWidth / window.innerHeight;
	threeCamera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

// Debug handle for the console and automated tests.
window.__rbx = {
	get character() { return character; },
	get humanoid() { return character.Humanoid; },
	get animate() { return animate; },
	cameraModule,
	controlModule,
	Workspace,
	UserInputService,
	Config,
	stateLog,
	LoadCharacter,
	pause(value = true) { paused = value; last = performance.now(); },
	step(dt = 1 / 60, n = 1) { for (let i = 0; i < n; i++) step(dt); renderer.render(scene, threeCamera); },
};
