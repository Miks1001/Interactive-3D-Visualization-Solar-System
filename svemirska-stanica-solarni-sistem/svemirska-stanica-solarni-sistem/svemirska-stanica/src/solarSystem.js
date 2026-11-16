import * as THREE from 'three';
import { loadTexture } from './textureLoader.js';
import { createPlanetTexture } from './textures.js';
import { SUN, PLANETS, DWARF_PLANETS, DIST_SCALE, BASE_PERIOD_SECONDS, MOON_TEXTURE, MOON_BASE_SECONDS } from './planetData.js';

// ---------- Pomocne funkcije ----------

function createOrbitLine(radius) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(160).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x66667a, transparent: true, opacity: 0.35 });
  const line = new THREE.LineLoop(geo, mat);
  line.userData.isOrbitLine = true;
  return line;
}

// Marker koji je UVEK vidljiv kao mala tacka fiksne velicine na ekranu, bez
// obzira koliko je kamera daleko (sizeAttenuation: false). Kada se kamera
// priblizi telu, markerova tacka biva prirodno zaklonjena povrsinom planete.
export function createDistanceMarker(colorHex) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
  const mat = new THREE.PointsMaterial({ color: colorHex, size: 9, sizeAttenuation: false });
  return new THREE.Points(geo, mat);
}

// Nevidljiva, uvecana sfera koja sluzi samo za pouzdano klikanje/detekciju
// misa na velikim udaljenostima.
export function createClickHitbox(radius) {
  const geo = new THREE.SphereGeometry(Math.max(radius * 2.5, 3.5), 12, 12);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  return new THREE.Mesh(geo, mat);
}

// Generise mekan radijalni "sjaj" (glow) preko canvas-a - koristi se kao
// aditivni sprite oko Sunca da izgleda kao da zaista sija, ne samo kao
// obojena sfera.
function createGlowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,244,214,0.9)');
  gradient.addColorStop(0.35, 'rgba(255,220,150,0.45)');
  gradient.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// Zemljin "dan/noc" shader: nocna mapa (svetla gradova) se meksano meša sa
// dnevnom teksturom u zavisnosti od ugla izmedju povrsinske normale i pravca
// ka Suncu. Sunce se u ovoj sceni uvek nalazi u koordinatnom pocetku, pa se
// pravac ka Suncu moze izracunati direktno iz svetske pozicije povrsine
// (normalize(-vWorldPosition)), bez dodatnih uniformi.
function createEarthMaterial(dayTex, nightTex) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTex },
      nightTexture: { value: nightTex }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 sunDir = normalize(-vWorldPosition);
        float ndotl = dot(normalize(vWorldNormal), sunDir);
        float dayFactor = smoothstep(-0.15, 0.2, ndotl);

        vec3 dayColor = texture2D(dayTexture, vUv).rgb;
        vec3 nightColor = texture2D(nightTexture, vUv).rgb * 1.6;

        vec3 color = mix(nightColor * (1.0 - dayFactor), dayColor * max(dayFactor, 0.06), dayFactor);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
}

// Venerin sloj oblaka - druga, malo veca providna sfera preko povrsine,
// rotira nezavisno (i sporije) od povrsine ispod nje - lep animirani detalj.
// Zemljin sloj oblaka - koristi pravu masku oblaka (crno=providno, belo=oblak)
// kao alphaMap, tako da se vidi povrsina ispod. Rotira malo brze od povrsine
// za lep, nezavisan animirani utisak.
function addEarthClouds(orbitGroup, radius, cloudsTexturePath) {
  const alphaTex = loadTexture(cloudsTexturePath, { srgb: false });
  const geo = new THREE.SphereGeometry(radius * 1.015, 40, 40);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    alphaMap: alphaTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    roughness: 1
  });
  const clouds = new THREE.Mesh(geo, mat);
  orbitGroup.add(clouds);
  return clouds;
}

function addVenusClouds(orbitGroup, radius, atmosphereTexturePath) {
  const tex = loadTexture(atmosphereTexturePath);
  const geo = new THREE.SphereGeometry(radius * 1.02, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false });
  const clouds = new THREE.Mesh(geo, mat);
  orbitGroup.add(clouds);
  return clouds;
}

// Saturnov prsten: RingGeometry po difoltu nema radijalno mapirane UV
// koordinate, pa se ovde rucno preracunavaju tako da se tekstura razvuce
// od unutrasnjeg do spoljasnjeg precnika prstena.
function addSaturnRing(orbitGroup, planetRadius, ringTexturePath) {
  const innerR = planetRadius * 1.3;
  const outerR = planetRadius * 2.3;
  const geo = new THREE.RingGeometry(innerR, outerR, 128, 1);

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const radius = v3.length();
    const u = THREE.MathUtils.clamp((radius - innerR) / (outerR - innerR), 0, 1);
    uv.setXY(i, u, 1);
  }
  uv.needsUpdate = true;

  const tex = loadTexture(ringTexturePath);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = THREE.MathUtils.degToRad(80);
  orbitGroup.add(ring);
  return ring;
}

// Dodaje prirodne satelite (mesece) oko planete. Svaki mesec ima svoj
// "pivot" (Group) koji rotira oko planete - mesec je njegovo dete na fiksnom
// odstojanju, sto daje kruzenje bez rucnog racunanja pozicije u petlji.
function addMoons(orbitGroup, planetRadius, moonsConfig) {
  const moonPivots = [];
  moonsConfig.forEach((m) => {
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.random() * Math.PI * 2;
    orbitGroup.add(pivot);

    const moonRadius = planetRadius * m.radiusFactor;
    const moonDistance = planetRadius * m.distanceFactor + moonRadius * 2;

    const tex = loadTexture(MOON_TEXTURE);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: m.colorTint || 0xffffff,
      roughness: 1
    });
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 20, 20), mat);
    moonMesh.position.set(moonDistance, 0, 0);
    pivot.add(moonMesh);

    const angularSpeed = (Math.PI * 2) / (m.periodSeconds * MOON_BASE_SECONDS * 0.05);
    moonPivots.push({ pivot, angularSpeed, name: m.name });
  });
  return moonPivots;
}

/**
 * Kreira Sunce i sve planete (sa teksturama, prstenovima i mesecima),
 * dodaje ih u scenu i vraca listu "tela" (bodies) koja se koriste za
 * animaciju kretanja, klik-interakciju i fokusiranje kamere.
 *
 * Svako telo ima:
 *  - group: THREE.Group koji se pomera duz orbite (koristi se za klik/fokus)
 *  - mesh: vizuelna sfera (moze se rotirati oko sopstvene ose nezavisno)
 *  - moonPivots: liste pivota meseci (ako telo ima prirodne satelite)
 */
export function createSolarSystem(scene) {
  const bodies = [];
  const orbitLines = [];

  // --- Sunce ---
  const sunGroup = new THREE.Group();
  scene.add(sunGroup);

  const sunTex = loadTexture(SUN.texture);
  const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
  sunMat.toneMapped = false; // Sunce ostaje vizuelno "punog sjaja" bez obzira na ekspoziciju scene
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(SUN.radius, 48, 48), sunMat);
  sunGroup.add(sunMesh);
  sunGroup.add(createDistanceMarker(0xffe6a8));
  sunGroup.add(createClickHitbox(SUN.radius));

  // Aditivni "halo" sprite - daje utisak da Sunce zaista zraci svetlost,
  // umesto da izgleda kao ravna, samo-osvetljena tekstura.
  const glowTex = createGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xfff2c0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true
  });
  const glowSprite = new THREE.Sprite(glowMat);
  glowSprite.scale.set(SUN.radius * 6, SUN.radius * 6, 1);
  sunGroup.add(glowSprite);

  const sunLight = new THREE.PointLight(0xfff2d9, 2.2, 0, 0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const sunBody = {
    key: SUN.key,
    name: SUN.name,
    group: sunGroup,
    mesh: sunMesh,
    info: SUN.info,
    thumb: SUN.texture,
    orbitRadius: 0,
    angle: 0,
    angularSpeed: 0,
    spinSpeed: (Math.PI * 2) / 50,
    isStatic: true,
    moonPivots: [],
    extraSpins: []
  };
  sunGroup.userData.body = sunBody;
  bodies.push(sunBody);

  // --- Planete i patuljaste planete (ista logika za oba) ---
  [...PLANETS, ...DWARF_PLANETS].forEach((p) => {
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    const extraSpins = [];

    let mesh;
    if (p.key === 'earth' && p.nightTexture) {
      const dayTex = loadTexture(p.texture);
      const nightTex = loadTexture(p.nightTexture);
      mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 48, 48), createEarthMaterial(dayTex, nightTex));
    } else {
      // Pluton (za sada) nema pravu teksturu - koristi se proceduralna
      // zamena dok se ne posalje prava slika povrsine.
      const tex = p.texture ? loadTexture(p.texture) : createPlanetTexture(0xcbb79c, { bands: true }).texture;
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.radius, 40, 40),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 })
      );
    }
    mesh.rotation.z = THREE.MathUtils.degToRad((Math.random() - 0.5) * 6); // blagi, slucajni nagib ose
    if (p.squashed) mesh.scale.set(1.25, 0.85, 1.05); // npr. Haumea - izduzen, jajolik oblik
    orbitGroup.add(mesh);

    if (p.cloudsTexture) {
      const clouds = addEarthClouds(orbitGroup, p.radius, p.cloudsTexture);
      extraSpins.push({ mesh: clouds, spinSpeed: (Math.PI * 2) / 70 });
    }
    if (p.atmosphereTexture) {
      const clouds = addVenusClouds(orbitGroup, p.radius, p.atmosphereTexture);
      extraSpins.push({ mesh: clouds, spinSpeed: (Math.PI * 2) / 55 });
    }
    if (p.hasRing && p.ringTexture) addSaturnRing(orbitGroup, p.radius, p.ringTexture);

    orbitGroup.add(createDistanceMarker(0xffffff));
    orbitGroup.add(createClickHitbox(p.radius));

    const moonPivots = p.moons ? addMoons(orbitGroup, p.radius, p.moons) : [];

    const orbitRadius = p.distanceAU * DIST_SCALE;
    const orbitLine = createOrbitLine(orbitRadius);
    scene.add(orbitLine);
    orbitLines.push(orbitLine);

    const angularSpeed = (Math.PI * 2) / (p.periodYears * BASE_PERIOD_SECONDS);
    const spinSeconds = p.spinSeconds || 8;
    const spinSpeed = (Math.PI * 2) / Math.abs(spinSeconds) * Math.sign(spinSeconds || 1);

    const body = {
      key: p.key,
      name: p.name,
      group: orbitGroup,
      mesh,
      info: p.info,
      thumb: p.texture,
      orbitRadius,
      angle: Math.random() * Math.PI * 2,
      angularSpeed,
      spinSpeed,
      isStatic: false,
      moonPivots,
      extraSpins
    };
    orbitGroup.userData.body = body;
    orbitGroup.position.set(Math.cos(body.angle) * orbitRadius, 0, Math.sin(body.angle) * orbitRadius);
    bodies.push(body);
  });

  return { bodies, orbitLines };
}

/**
 * Animira sva tela: revoluciju oko Sunca (moze se pauzirati - orbitPaused),
 * sopstvenu rotaciju oko ose i kruzenje prirodnih satelita (mesece ne
 * pauziramo - i dalje kruze dok korisnik cita info panel, sto scenu cini
 * "zivom").
 */
export function updateSolarSystem(bodies, delta, speedMultiplier, orbitPaused) {
  bodies.forEach((b) => {
    if (!b.isStatic && !orbitPaused) {
      b.angle += b.angularSpeed * delta * speedMultiplier;
      b.group.position.set(Math.cos(b.angle) * b.orbitRadius, 0, Math.sin(b.angle) * b.orbitRadius);
    }
    if (b.mesh) b.mesh.rotation.y += b.spinSpeed * delta * speedMultiplier;
    if (b.moonPivots) {
      b.moonPivots.forEach((mp) => {
        mp.pivot.rotation.y += mp.angularSpeed * delta * speedMultiplier;
      });
    }
    if (b.extraSpins) {
      b.extraSpins.forEach((es) => {
        es.mesh.rotation.y += es.spinSpeed * delta * speedMultiplier;
      });
    }
  });
}
