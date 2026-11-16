import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { createSolarSystem, updateSolarSystem, createDistanceMarker, createClickHitbox } from './src/solarSystem.js';
import { CameraController } from './src/cameraController.js';
import { InfoPanel } from './src/infoPanel.js';
import { GuidedTour } from './src/tour.js';
import { STATION, DIST_SCALE, BASE_PERIOD_SECONDS, MILKY_WAY_TEXTURE } from './src/planetData.js';
import { loadTexture } from './src/textureLoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.domElement.classList.add('scene-canvas');

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const params = {
  ambientIntensity: 0.15,
  dirIntensity: 1.2,
  dirX: -1,
  dirY: 1,
  dirZ: 4,
  exposure: 1,
  emissiveBoost: 1,
  orbitSpeed: 1,
  showOrbits: true
};

// ---------- Osvetljenje ----------
const svetlo = new THREE.AmbientLight(0xffffff, params.ambientIntensity);
scene.add(svetlo);

const direkcionoSvetlo = new THREE.DirectionalLight(0xfcfcfc, params.dirIntensity);
direkcionoSvetlo.position.set(params.dirX, params.dirY, params.dirZ);
scene.add(direkcionoSvetlo);
// Napomena: senke su iskljucene jer se stanica sada krece kroz ceo sistem
// (daleko od koordinatnog pocetka), pa bi fiksni frustum senke davao pogresne
// rezultate. Ambijentalno + Suncevo svetlo i dalje obezbedjuju dobru vidljivost.

// ---------- Zvezdana pozadina (prava panorama Mlecnog puta) ----------
const milkyWayTexture = loadTexture(MILKY_WAY_TEXTURE);
milkyWayTexture.mapping = THREE.EquirectangularReflectionMapping;
milkyWayTexture.magFilter = THREE.LinearFilter;
milkyWayTexture.minFilter = THREE.LinearMipmapLinearFilter;
milkyWayTexture.generateMipmaps = true;
scene.background = milkyWayTexture;
scene.backgroundIntensity = 0.6;
// Napomena: blaga "distorzija" na samom vrhu/dnu panorame je inherentna
// osobina svake equirectangular (2:1) panorame projektovane na sferu - nije
// greska u kodu, i najmanje je uocljiva jer se kamera u ovoj sceni uglavnom
// krece blizu ravni ekliptike (retko gleda pravo gore/dole).

// ---------- Kamera ----------
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
const OVERVIEW_POSITION = new THREE.Vector3(0, 620, 1420);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);
camera.position.copy(OVERVIEW_POSITION);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 3000;
controls.target.copy(OVERVIEW_TARGET);
controls.update();

const overviewState = {
  position: OVERVIEW_POSITION.clone(),
  target: OVERVIEW_TARGET.clone(),
  minDistance: controls.minDistance,
  maxDistance: controls.maxDistance
};
const cameraController = new CameraController(camera, controls, overviewState);

// ---------- Suncev sistem (Sunce + planete) ----------
const { bodies, orbitLines } = createSolarSystem(scene);

// ---------- Svemirska stanica (GLTF), kao posebno "telo" u pojasu asteroida ----------
const loader = new GLTFLoader();
let mixer;
let stationMaterials = [];
const stationHolder = new THREE.Group();
scene.add(stationHolder);

const stationBody = {
  key: STATION.key,
  name: STATION.name,
  group: stationHolder,
  info: STATION.info,
  thumb: null,
  orbitRadius: STATION.distanceAU * DIST_SCALE,
  angle: Math.random() * Math.PI * 2,
  angularSpeed: (Math.PI * 2) / (STATION.periodYears * BASE_PERIOD_SECONDS),
  isStatic: false,
  moonPivots: []
};
stationHolder.userData.body = stationBody;
stationHolder.position.set(
  Math.cos(stationBody.angle) * stationBody.orbitRadius,
  0,
  Math.sin(stationBody.angle) * stationBody.orbitRadius
);
bodies.push(stationBody);

// mali "svetleci" marker + klik-hitbox da bi stanica bila lako uocljiva/klikabilna izdaleka
const beacon = new THREE.Mesh(
  new THREE.SphereGeometry(1.4, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xfff2b0 })
);
beacon.userData.body = stationBody;
stationHolder.add(beacon);
stationHolder.add(createDistanceMarker(0xfff2b0));
stationHolder.add(createClickHitbox(2));

loader.load('static/space_station_3/scene.gltf', (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh && child.material) {
      child.castShadow = false;
      child.receiveShadow = false;
      if (child.material.emissive) stationMaterials.push(child.material);
    }
    child.userData.body = stationBody;
  });

  stationHolder.add(gltf.scene);

  if (gltf.animations.length) {
    mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach((c) => mixer.clipAction(c).play());
  }

  beacon.visible = false; // model je ucitan, marker vise nije neophodan
});

// orbita stanice (vizuelno oznacena isprekidano da se razlikuje od planeta)
const stationOrbitCurve = new THREE.EllipseCurve(0, 0, stationBody.orbitRadius, stationBody.orbitRadius, 0, Math.PI * 2, false, 0);
const stationOrbitPoints = stationOrbitCurve.getPoints(160).map((p) => new THREE.Vector3(p.x, 0, p.y));
const stationOrbitLine = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(stationOrbitPoints),
  new THREE.LineDashedMaterial({ color: 0xfff2b0, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.6 })
);
stationOrbitLine.computeLineDistances();
scene.add(stationOrbitLine);
orbitLines.push(stationOrbitLine);

// ---------- Tweakpane (napredna podesavanja) ----------
const pane = new Pane({ title: 'Podesavanja', container: document.getElementById('tweak-pane-container') });

const lightFolder = pane.addFolder({ title: 'Osvetljenje' });
lightFolder.addBinding(params, 'ambientIntensity', { min: 0, max: 2, step: 0.01, label: 'Ambijentalno' }).on('change', (e) => {
  svetlo.intensity = e.value;
});
lightFolder.addBinding(params, 'dirIntensity', { min: 0, max: 10, step: 0.1, label: 'Direkciono' }).on('change', (e) => {
  direkcionoSvetlo.intensity = e.value;
});
lightFolder.addBinding(params, 'exposure', { min: 0.1, max: 2, step: 0.01, label: 'Ekspozicija' }).on('change', (e) => {
  renderer.toneMappingExposure = e.value;
});
lightFolder.addBinding(params, 'emissiveBoost', { min: 0, max: 5, step: 0.1, label: 'Sjaj stanice' }).on('change', (e) => {
  stationMaterials.forEach((mat) => {
    mat.emissiveIntensity = e.value;
  });
});

const systemFolder = pane.addFolder({ title: 'Solarni sistem' });
systemFolder.addBinding(params, 'orbitSpeed', { min: 0, max: 5, step: 0.1, label: 'Brzina orbita' });
systemFolder.addBinding(params, 'showOrbits', { label: 'Prikazi orbite' }).on('change', (e) => {
  orbitLines.forEach((l) => (l.visible = e.value));
});

// ---------- Info panel (DOM) ----------
const infoPanel = new InfoPanel(document.getElementById('info-panel'));

let focusedBody = null;
let tourRunning = false;

function focusOnBody(bodyOrKey) {
  const body = typeof bodyOrKey === 'string' ? bodies.find((b) => b.key === bodyOrKey) : bodyOrKey;
  if (!body) return Promise.resolve();
  focusedBody = body;
  return new Promise((resolve) => {
    cameraController.focusOn(body.group, () => {
      infoPanel.show(body);
      resolve();
    });
  });
}

function returnToOverview() {
  focusedBody = null;
  infoPanel.hide();
  cameraController.resetToOverview();
}

infoPanel.onBack(() => {
  if (tourRunning) {
    tour.stop();
    tourRunning = false;
    setTourButtonLabel();
  }
  returnToOverview();
});

// ---------- Klik na telo (Sunce / planeta / stanica) ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickableMeshes = () => bodies.map((b) => b.group);

function handlePick(event) {
  if (cameraController.isTweening) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(clickableMeshes(), true);
  if (intersects.length === 0) return;

  let obj = intersects[0].object;
  let body = obj.userData.body;
  while (!body && obj.parent) {
    obj = obj.parent;
    body = obj.userData.body;
  }
  if (!body) return;

  if (tourRunning) {
    tour.stop();
    tourRunning = false;
    setTourButtonLabel();
  }
  focusOnBody(body);
}
renderer.domElement.addEventListener('click', handlePick);

// ---------- Vodjena tura ----------
const TOUR_ORDER = [
  'mercury', 'venus', 'earth', 'mars', 'ceres', 'station', 'jupiter', 'saturn', 'uranus', 'neptune',
  'pluto', 'haumea', 'makemake', 'eris'
];
const tour = new GuidedTour({
  order: TOUR_ORDER,
  focusBodyByKey: (key) => focusOnBody(key),
  holdMs: 5500
});

const tourBtn = document.getElementById('tour-btn');
function setTourButtonLabel() {
  tourBtn.textContent = tourRunning ? 'Zaustavi turu' : 'Pokreni vodjenu turu';
}
tourBtn.addEventListener('click', () => {
  if (tourRunning) {
    tour.stop();
    tourRunning = false;
    setTourButtonLabel();
    returnToOverview();
  } else {
    tourRunning = true;
    setTourButtonLabel();
    tour.start(() => {
      tourRunning = false;
      setTourButtonLabel();
      returnToOverview();
    });
  }
});

const overviewBtn = document.getElementById('overview-btn');
overviewBtn.addEventListener('click', () => {
  if (tourRunning) {
    tour.stop();
    tourRunning = false;
    setTourButtonLabel();
  }
  returnToOverview();
});

// ---------- Animaciona petlja ----------
const clock = new THREE.Clock();

function animate() {
  window.requestAnimationFrame(animate);
  controls.update();

  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  // Revolucija oko Sunca staje dok je korisnik fokusiran na neko telo (radi
  // lakseg citanja), ali sopstvena rotacija i mesece i dalje "zive".
  updateSolarSystem(bodies, delta, params.orbitSpeed, !!focusedBody);

  renderer.render(scene, camera);
}

animate();
