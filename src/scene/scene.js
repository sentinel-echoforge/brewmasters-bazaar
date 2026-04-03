// ═══ THREE.JS ISOMETRIC SCENE ═══
// Cart with cauldron, ingredient shelf, serve counter
// Procedural geometry only. Warm cozy lighting.

import * as THREE from 'three';
import state from '../systems/state.js';

let scene, camera, renderer;
let cauldronGroup, shelfGroup, counterGroup, cartGroup;
let bubbleParticles = [];
let steamParticles = [];
let animationCallbacks = [];
let time = 0;

// Color palette
const COLORS = {
  wood: 0x8B5E3C,
  woodDark: 0x5A3A22,
  woodLight: 0xA67B5B,
  metal: 0x4A4A4A,
  metalLight: 0x6A6A6A,
  gold: 0xD4A44C,
  cauldronInner: 0x1A3A2A,
  liquidBase: 0x3A6A4A,
  ground: 0x4A6A3A,
  groundDark: 0x2A4A22,
  stone: 0x8A8A7A,
  stoneLight: 0xA0A090,
  cloth: 0xB85A3A,
  clothDark: 0x8A3A2A,
};

export function initScene() {
  const canvas = document.getElementById('game-canvas');
  
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2A3A4A);
  scene.fog = new THREE.FogExp2(0x2A3A4A, 0.015);
  
  // Isometric camera
  const aspect = window.innerWidth / window.innerHeight;
  const frustum = 12;
  camera = new THREE.OrthographicCamera(
    -frustum * aspect, frustum * aspect,
    frustum, -frustum,
    0.1, 100
  );
  // Isometric angle
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  
  // Lighting — warm, cozy
  const ambientLight = new THREE.AmbientLight(0xFFF5E0, 0.4);
  scene.add(ambientLight);
  
  // Main warm light (sun/lantern)
  const mainLight = new THREE.DirectionalLight(0xFFE4B5, 1.2);
  mainLight.position.set(8, 12, 6);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 40;
  mainLight.shadow.camera.left = -15;
  mainLight.shadow.camera.right = 15;
  mainLight.shadow.camera.top = 15;
  mainLight.shadow.camera.bottom = -15;
  scene.add(mainLight);
  
  // Warm fill light from below/side
  const fillLight = new THREE.DirectionalLight(0xFFD4A0, 0.3);
  fillLight.position.set(-4, 2, -4);
  scene.add(fillLight);
  
  // Point light near cauldron (warm glow)
  const cauldronLight = new THREE.PointLight(0xFF8040, 0.8, 10);
  cauldronLight.position.set(0, 2, 0);
  scene.add(cauldronLight);
  
  // Build the scene
  buildGround();
  buildCart();
  buildCauldron();
  buildShelf();
  buildServeCounter();
  buildDecorations();
  
  // Store refs
  state.scene = scene;
  state.camera = camera;
  state.renderer = renderer;
  
  // Resize handler
  window.addEventListener('resize', onResize);
  
  // Start render loop
  animate();
}

function onResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustum = 12;
  camera.left = -frustum * aspect;
  camera.right = frustum * aspect;
  camera.top = frustum;
  camera.bottom = -frustum;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  time += 0.016;
  
  // Animate cauldron liquid
  if (cauldronGroup) {
    const liquid = cauldronGroup.getObjectByName('liquid');
    if (liquid) {
      liquid.position.y = 1.3 + Math.sin(time * 2) * 0.02;
    }
  }
  
  // Animate bubbles
  for (let i = bubbleParticles.length - 1; i >= 0; i--) {
    const bubble = bubbleParticles[i];
    bubble.position.y += 0.03;
    bubble.material.opacity -= 0.008;
    bubble.scale.multiplyScalar(1.01);
    if (bubble.material.opacity <= 0) {
      scene.remove(bubble);
      bubbleParticles.splice(i, 1);
    }
  }
  
  // Animate steam
  for (let i = steamParticles.length - 1; i >= 0; i--) {
    const steam = steamParticles[i];
    steam.position.y += 0.02;
    steam.position.x += Math.sin(time * 3 + i) * 0.005;
    steam.material.opacity -= 0.005;
    steam.scale.multiplyScalar(1.005);
    if (steam.material.opacity <= 0) {
      scene.remove(steam);
      steamParticles.splice(i, 1);
    }
  }
  
  // Run custom animation callbacks
  for (const cb of animationCallbacks) {
    cb(time);
  }
  
  renderer.render(scene, camera);
}

// ═══ GROUND ═══
function buildGround() {
  // Main ground plane
  const groundGeo = new THREE.PlaneGeometry(40, 40);
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: COLORS.ground, roughness: 0.9, metalness: 0
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Cobblestone area under cart
  const stoneGeo = new THREE.CircleGeometry(6, 8);
  const stoneMat = new THREE.MeshStandardMaterial({
    color: COLORS.stoneLight, roughness: 0.85, metalness: 0.05
  });
  const stoneGround = new THREE.Mesh(stoneGeo, stoneMat);
  stoneGround.rotation.x = -Math.PI / 2;
  stoneGround.position.y = 0.01;
  stoneGround.receiveShadow = true;
  scene.add(stoneGround);
}

// ═══ CART ═══
function buildCart() {
  cartGroup = new THREE.Group();
  
  // Cart base / platform
  const platformGeo = new THREE.BoxGeometry(8, 0.3, 5);
  const platformMat = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.8 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = 0.5;
  platform.castShadow = true;
  platform.receiveShadow = true;
  cartGroup.add(platform);
  
  // Cart legs
  const legGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 6);
  const legMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.7 });
  const legPositions = [[-3.5, 0.25, -2], [3.5, 0.25, -2], [-3.5, 0.25, 2], [3.5, 0.25, 2]];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    cartGroup.add(leg);
  }
  
  // Wheels
  const wheelGeo = new THREE.TorusGeometry(0.5, 0.1, 8, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.6 });
  const wheelPositions = [[-3.8, 0.5, -2.5], [-3.8, 0.5, 2.5], [3.8, 0.5, -2.5], [3.8, 0.5, 2.5]];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x, y, z);
    wheel.rotation.y = Math.PI / 2;
    wheel.castShadow = true;
    cartGroup.add(wheel);
  }
  
  // Cart rails/walls (low)
  const railGeo = new THREE.BoxGeometry(8.2, 0.6, 0.15);
  const railMat = new THREE.MeshStandardMaterial({ color: COLORS.woodLight, roughness: 0.7 });
  
  const frontRail = new THREE.Mesh(railGeo, railMat);
  frontRail.position.set(0, 1.0, 2.5);
  frontRail.castShadow = true;
  cartGroup.add(frontRail);
  
  const backRail = new THREE.Mesh(railGeo, railMat);
  backRail.position.set(0, 1.0, -2.5);
  backRail.castShadow = true;
  cartGroup.add(backRail);
  
  const sideGeo = new THREE.BoxGeometry(0.15, 0.6, 5);
  const leftRail = new THREE.Mesh(sideGeo, railMat);
  leftRail.position.set(-4, 1.0, 0);
  leftRail.castShadow = true;
  cartGroup.add(leftRail);
  
  const rightRail = new THREE.Mesh(sideGeo, railMat);
  rightRail.position.set(4, 1.0, 0);
  rightRail.castShadow = true;
  cartGroup.add(rightRail);
  
  scene.add(cartGroup);
}

// ═══ CAULDRON ═══
function buildCauldron() {
  cauldronGroup = new THREE.Group();
  cauldronGroup.position.set(0, 0.65, 0);
  
  // Cauldron body — hemisphere
  const cauldronGeo = new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const cauldronMat = new THREE.MeshStandardMaterial({ 
    color: COLORS.metal, roughness: 0.4, metalness: 0.6 
  });
  const cauldron = new THREE.Mesh(cauldronGeo, cauldronMat);
  cauldron.rotation.x = Math.PI;
  cauldron.position.y = 1.2;
  cauldron.castShadow = true;
  cauldronGroup.add(cauldron);
  
  // Cauldron rim
  const rimGeo = new THREE.TorusGeometry(1.2, 0.08, 8, 20);
  const rimMat = new THREE.MeshStandardMaterial({ color: COLORS.metalLight, roughness: 0.3, metalness: 0.7 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 1.2;
  rim.rotation.x = Math.PI / 2;
  cauldronGroup.add(rim);
  
  // Liquid inside
  const liquidGeo = new THREE.CircleGeometry(1.1, 16);
  const liquidMat = new THREE.MeshStandardMaterial({ 
    color: COLORS.liquidBase, roughness: 0.2, metalness: 0.1,
    transparent: true, opacity: 0.8
  });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.name = 'liquid';
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 1.3;
  cauldronGroup.add(liquid);
  
  // Tripod legs
  const tripodGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 4);
  const tripodMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const tripod = new THREE.Mesh(tripodGeo, tripodMat);
    tripod.position.set(Math.cos(angle) * 0.8, 0.4, Math.sin(angle) * 0.8);
    tripod.rotation.z = Math.cos(angle) * 0.2;
    tripod.rotation.x = Math.sin(angle) * 0.2;
    tripod.castShadow = true;
    cauldronGroup.add(tripod);
  }
  
  // Fire under cauldron
  const fireGeo = new THREE.ConeGeometry(0.3, 0.4, 6);
  const fireMat = new THREE.MeshStandardMaterial({ 
    color: 0xFF6600, emissive: 0xFF4400, emissiveIntensity: 0.8,
    transparent: true, opacity: 0.7
  });
  for (let i = 0; i < 4; i++) {
    const flame = new THREE.Mesh(fireGeo, fireMat.clone());
    flame.position.set(
      (Math.random() - 0.5) * 0.6,
      0.2 + Math.random() * 0.1,
      (Math.random() - 0.5) * 0.6
    );
    flame.scale.set(0.6 + Math.random() * 0.4, 0.8 + Math.random() * 0.5, 0.6 + Math.random() * 0.4);
    flame.name = 'flame';
    cauldronGroup.add(flame);
  }
  
  // Animate flames
  animationCallbacks.push((t) => {
    cauldronGroup.children.filter(c => c.name === 'flame').forEach((flame, i) => {
      flame.scale.y = (0.8 + Math.sin(t * 5 + i * 2) * 0.3);
      flame.material.emissiveIntensity = 0.5 + Math.sin(t * 7 + i) * 0.3;
    });
  });
  
  state.cauldronMesh = cauldronGroup;
  scene.add(cauldronGroup);
}

// ═══ INGREDIENT SHELF ═══
function buildShelf() {
  shelfGroup = new THREE.Group();
  shelfGroup.position.set(-3, 0.65, 0);
  
  // Vertical posts
  const postGeo = new THREE.BoxGeometry(0.15, 3, 0.15);
  const postMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.7 });
  
  const post1 = new THREE.Mesh(postGeo, postMat);
  post1.position.set(0, 1.5, -0.6);
  post1.castShadow = true;
  shelfGroup.add(post1);
  
  const post2 = new THREE.Mesh(postGeo, postMat);
  post2.position.set(0, 1.5, 0.6);
  post2.castShadow = true;
  shelfGroup.add(post2);
  
  // Shelves
  const shelfBoardGeo = new THREE.BoxGeometry(0.6, 0.08, 1.4);
  const shelfBoardMat = new THREE.MeshStandardMaterial({ color: COLORS.woodLight, roughness: 0.6 });
  
  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(shelfBoardGeo, shelfBoardMat);
    shelf.position.set(0, 0.6 + i * 0.9, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    shelfGroup.add(shelf);
  }
  
  // Jar/bottle decorations on shelves
  const jarGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.3, 8);
  const jarColors = [0xD4A44C, 0x886633, 0x66AA44, 0xAA4444, 0x6688BB];
  
  for (let s = 0; s < 3; s++) {
    for (let j = 0; j < 3; j++) {
      const jarMat = new THREE.MeshStandardMaterial({ 
        color: jarColors[(s * 3 + j) % jarColors.length],
        roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.7
      });
      const jar = new THREE.Mesh(jarGeo, jarMat);
      jar.position.set(0, 0.82 + s * 0.9, -0.4 + j * 0.4);
      jar.castShadow = true;
      shelfGroup.add(jar);
    }
  }
  
  scene.add(shelfGroup);
}

// ═══ SERVE COUNTER ═══
function buildServeCounter() {
  counterGroup = new THREE.Group();
  counterGroup.position.set(3.2, 0.65, 0);
  
  // Counter top
  const counterGeo = new THREE.BoxGeometry(1.5, 0.15, 3);
  const counterMat = new THREE.MeshStandardMaterial({ color: COLORS.woodLight, roughness: 0.5 });
  const counter = new THREE.Mesh(counterGeo, counterMat);
  counter.position.y = 1.2;
  counter.castShadow = true;
  counter.receiveShadow = true;
  counterGroup.add(counter);
  
  // Counter front
  const frontGeo = new THREE.BoxGeometry(1.5, 1.2, 0.1);
  const frontMat = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.7 });
  const front = new THREE.Mesh(frontGeo, frontMat);
  front.position.set(0, 0.6, 1.5);
  front.castShadow = true;
  counterGroup.add(front);
  
  // Support posts
  const supportGeo = new THREE.BoxGeometry(0.12, 1.2, 0.12);
  const supportMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.7 });
  
  for (const z of [-1.3, 1.3]) {
    const support = new THREE.Mesh(supportGeo, supportMat);
    support.position.set(0, 0.6, z);
    support.castShadow = true;
    counterGroup.add(support);
  }
  
  // Sign on counter
  const signGeo = new THREE.BoxGeometry(1.2, 0.6, 0.05);
  const signMat = new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.8 });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 1.8, 1.55);
  sign.castShadow = true;
  counterGroup.add(sign);
  
  scene.add(counterGroup);
}

// ═══ DECORATIONS ═══
function buildDecorations() {
  // Some barrels
  const barrelGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.8, 10);
  const barrelMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.7 });
  
  const barrel1 = new THREE.Mesh(barrelGeo, barrelMat);
  barrel1.position.set(-2, 1.1, -1.8);
  barrel1.castShadow = true;
  scene.add(barrel1);
  
  const barrel2 = new THREE.Mesh(barrelGeo, barrelMat);
  barrel2.position.set(-2, 1.1, 1.8);
  barrel2.rotation.z = 0.1;
  barrel2.castShadow = true;
  scene.add(barrel2);
  
  // Lantern
  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(3.5, 2.8, -1.2);
  
  const lanternBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.3, 0.2),
    new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.4, metalness: 0.5 })
  );
  lanternGroup.add(lanternBody);
  
  const lanternLight = new THREE.PointLight(0xFF9944, 0.5, 5);
  lanternLight.position.set(0, 0, 0);
  lanternGroup.add(lanternLight);
  
  // Animate lantern flicker
  animationCallbacks.push((t) => {
    lanternLight.intensity = 0.4 + Math.sin(t * 8) * 0.1 + Math.sin(t * 13) * 0.05;
  });
  
  scene.add(lanternGroup);
  
  // Some trees in background
  for (const pos of [[-8, 0, -6], [7, 0, -8], [-10, 0, 4], [9, 0, 5]]) {
    addTree(pos[0], pos[1], pos[2]);
  }
  
  // Scattered rocks
  const rockGeo = new THREE.DodecahedronGeometry(0.3, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.9 });
  for (const pos of [[5, 0.1, 3], [-5, 0.1, -3], [2, 0.1, 5]]) {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(pos[0], pos[1], pos[2]);
    rock.scale.set(1 + Math.random(), 0.6 + Math.random() * 0.5, 1 + Math.random());
    rock.castShadow = true;
    scene.add(rock);
  }
}

function addTree(x, y, z) {
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5A3A22, roughness: 0.8 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, y + 1, z);
  trunk.castShadow = true;
  scene.add(trunk);
  
  const leafGeo = new THREE.SphereGeometry(1.2, 6, 5);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2A6A2A, roughness: 0.9 });
  const leaves = new THREE.Mesh(leafGeo, leafMat);
  leaves.position.set(x, y + 2.8, z);
  leaves.scale.set(1, 1.3, 1);
  leaves.castShadow = true;
  scene.add(leaves);
}

// ═══ BREWING ANIMATIONS ═══

export function setCauldronColor(color) {
  if (!cauldronGroup) return;
  const liquid = cauldronGroup.getObjectByName('liquid');
  if (liquid) {
    liquid.material.color.setHex(color);
  }
}

export function spawnBubbles(count = 8) {
  const bubbleGeo = new THREE.SphereGeometry(0.06, 6, 6);
  for (let i = 0; i < count; i++) {
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0xAADDAA, transparent: true, opacity: 0.6,
      emissive: 0x448844, emissiveIntensity: 0.3
    });
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubble.position.set(
      (Math.random() - 0.5) * 1.5,
      1.4 + Math.random() * 0.2,
      (Math.random() - 0.5) * 1.5
    );
    scene.add(bubble);
    bubbleParticles.push(bubble);
  }
}

export function spawnSteam(count = 5) {
  const steamGeo = new THREE.SphereGeometry(0.15, 5, 5);
  for (let i = 0; i < count; i++) {
    const steamMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, transparent: true, opacity: 0.3,
      emissive: 0xFFFFFF, emissiveIntensity: 0.1
    });
    const steam = new THREE.Mesh(steamGeo, steamMat);
    steam.position.set(
      (Math.random() - 0.5) * 0.8,
      1.8 + Math.random() * 0.3,
      (Math.random() - 0.5) * 0.8
    );
    scene.add(steam);
    steamParticles.push(steam);
  }
}

export function spawnSparkles(count = 12) {
  const sparkGeo = new THREE.OctahedronGeometry(0.04, 0);
  for (let i = 0; i < count; i++) {
    const sparkMat = new THREE.MeshStandardMaterial({
      color: 0xFFDD44, emissive: 0xFFAA00, emissiveIntensity: 1.0,
      transparent: true, opacity: 0.9
    });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 1;
    spark.position.set(
      Math.cos(angle) * radius,
      1.5 + Math.random() * 1.5,
      Math.sin(angle) * radius
    );
    scene.add(spark);
    
    // Quick upward + fade animation
    const startY = spark.position.y;
    const startOp = spark.material.opacity;
    const cb = (t) => {
      spark.position.y += 0.04;
      spark.material.opacity -= 0.015;
      spark.rotation.y += 0.1;
      if (spark.material.opacity <= 0) {
        scene.remove(spark);
        animationCallbacks = animationCallbacks.filter(c => c !== cb);
      }
    };
    animationCallbacks.push(cb);
  }
}

// NPC "customer" at counter — simple capsule shape
export function spawnCustomerMesh() {
  const group = new THREE.Group();
  
  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: [0x886644, 0x668844, 0x886688, 0x448866, 0xAA7744][Math.floor(Math.random() * 5)],
    roughness: 0.7
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.8;
  body.castShadow = true;
  group.add(body);
  
  // Head
  const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xDDBB99, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.55;
  head.castShadow = true;
  group.add(head);
  
  // Position at serve counter
  group.position.set(5, 0, (Math.random() - 0.5) * 2);
  scene.add(group);
  
  return group;
}

export function removeCustomerMesh(mesh) {
  if (mesh) scene.remove(mesh);
}
