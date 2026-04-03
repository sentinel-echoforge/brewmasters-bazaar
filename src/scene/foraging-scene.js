// ═══ FORAGING SCENE ═══
// Separate ThreeJS scene — click-to-move, pickable ingredient nodes

import * as THREE from 'three';
import state from '../systems/state.js';
import { getForageNodes, harvestForageNode, updateForageNodes, initForageNodes } from '../systems/garden.js';

let scene, camera, renderer;
let playerMesh, playerTarget;
let nodeMeshes = new Map(); // nodeId -> { group, glowMesh }
let groundPlane;
let animationCallbacks = [];
let time = 0;
let isActive = false;

// Region-specific visual config
const LANDSCAPE_CONFIGS = {
  cherry_blossoms: { groundColor: 0x4A6A4A, fogColor: 0x3A4A5A, treeColor: 0xEE88AA, treeCount: 8 },
  tropical_jungle: { groundColor: 0x2A5A2A, fogColor: 0x1A3A2A, treeColor: 0x1A7A2A, treeCount: 12 },
  spice_market: { groundColor: 0x6A5A3A, fogColor: 0x4A3A2A, treeColor: 0x4A7A2A, treeCount: 4 },
  desert_oasis: { groundColor: 0x8A7A4A, fogColor: 0x6A5A3A, treeColor: 0x3A7A3A, treeCount: 3 },
  rolling_vineyard: { groundColor: 0x5A7A4A, fogColor: 0x3A4A3A, treeColor: 0x3A6A2A, treeCount: 6 },
  misty_meadow: { groundColor: 0x4A6A3A, fogColor: 0x4A5A5A, treeColor: 0x2A6A2A, treeCount: 7 },
  savanna: { groundColor: 0x7A6A3A, fogColor: 0x5A4A2A, treeColor: 0x5A7A2A, treeCount: 3 },
  agave_hills: { groundColor: 0x6A6A3A, fogColor: 0x4A4A2A, treeColor: 0x4A7A3A, treeCount: 4 },
  autumn_orchard: { groundColor: 0x5A6A3A, fogColor: 0x3A4A3A, treeColor: 0xCC7733, treeCount: 8 },
  bushland: { groundColor: 0x6A5A2A, fogColor: 0x4A4A2A, treeColor: 0x5A7A3A, treeCount: 5 },
};

export function initForagingScene(canvas) {
  const landscape = state.regionData?.landscape || 'misty_meadow';
  const config = LANDSCAPE_CONFIGS[landscape] || LANDSCAPE_CONFIGS.misty_meadow;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(config.fogColor);
  scene.fog = new THREE.FogExp2(config.fogColor, 0.02);

  // Camera — isometric
  const aspect = canvas.width / canvas.height;
  const frustum = 14;
  camera = new THREE.OrthographicCamera(
    -frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 100
  );
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);

  // Renderer (shared canvas)
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.width, canvas.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  // Lighting
  const ambient = new THREE.AmbientLight(0xFFF5E0, 0.5);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xFFE4B5, 1.0);
  sun.position.set(8, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xFFD4A0, 0.3);
  fill.position.set(-4, 2, -4);
  scene.add(fill);

  // Ground
  const groundGeo = new THREE.CircleGeometry(16, 32);
  const groundMat = new THREE.MeshStandardMaterial({ color: config.groundColor, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  groundPlane = ground;

  // Path / clearing
  const pathGeo = new THREE.CircleGeometry(3, 16);
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x7A6A4A, roughness: 0.8 });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.01;
  scene.add(path);

  // Trees (region-flavored)
  for (let i = 0; i < config.treeCount; i++) {
    const angle = (i / config.treeCount) * Math.PI * 2 + Math.random() * 0.5;
    const r = 10 + Math.random() * 4;
    addForagingTree(Math.cos(angle) * r, Math.sin(angle) * r, config.treeColor);
  }

  // Decorative elements
  addRocks();
  if (landscape === 'desert_oasis' || landscape === 'tropical_jungle') {
    addStreamEffect();
  }

  // Player character
  playerMesh = createPlayerMesh();
  playerMesh.position.set(0, 0, 0);
  playerTarget = new THREE.Vector3(0, 0, 0);
  scene.add(playerMesh);

  // Initialize forage nodes
  const nodes = initForageNodes();
  createNodeMeshes(nodes);

  // Click to move / pick
  canvas.addEventListener('click', onCanvasClick);

  return { scene, camera, renderer };
}

function createPlayerMesh() {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.7, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xB85A3A, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.7;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xDDBB99, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.35;
  head.castShadow = true;
  group.add(head);

  // Hat
  const hatGeo = new THREE.CylinderGeometry(0.15, 0.3, 0.15, 8);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x5A3A22, roughness: 0.8 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 1.55;
  group.add(hat);

  return group;
}

function createNodeMeshes(nodes) {
  for (const node of nodes) {
    const ing = state.ingredients.find(i => i.id === node.ingredientId);
    const group = new THREE.Group();
    group.position.set(node.x, 0, node.z);

    // Base object (varies by tier)
    const baseGeo = node.tier <= 2
      ? new THREE.SphereGeometry(0.25, 8, 6)
      : new THREE.DodecahedronGeometry(0.3, 0);

    const tierColors = { 1: 0x66AA44, 2: 0x44AA66, 3: 0xAA6644, 4: 0xAA44AA, 5: 0xAAAA44, 99: 0xDDAA44 };
    const baseMat = new THREE.MeshStandardMaterial({
      color: tierColors[node.tier] || 0x66AA44,
      roughness: 0.5, emissive: tierColors[node.tier] || 0x66AA44,
      emissiveIntensity: 0.1,
    });

    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.3;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // Glow ring (pulsing)
    const glowGeo = new THREE.RingGeometry(0.4, 0.6, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFFDD44, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.rotation.x = -Math.PI / 2;
    glowMesh.position.y = 0.02;
    group.add(glowMesh);

    // Stem/stalk for herbs/plants
    if (node.tier <= 3) {
      const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.3, 4);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x3A6A2A });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.15;
      group.add(stem);
    }

    scene.add(group);
    nodeMeshes.set(node.id, { group, glowMesh, baseMesh, node });
  }
}

function addForagingTree(x, z, leafColor) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.25, 2.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x5A3A22, roughness: 0.8 })
  );
  trunk.position.set(x, 1.25, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 6, 5),
    new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.9 })
  );
  leaves.position.set(x, 3.2, z);
  leaves.scale.set(1, 1.2, 1);
  leaves.castShadow = true;
  scene.add(leaves);
}

function addRocks() {
  const rockGeo = new THREE.DodecahedronGeometry(0.4, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8A8A7A, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const angle = Math.random() * Math.PI * 2;
    const r = 5 + Math.random() * 6;
    rock.position.set(Math.cos(angle) * r, 0.15, Math.sin(angle) * r);
    rock.scale.set(1 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 1 + Math.random() * 0.5);
    rock.castShadow = true;
    scene.add(rock);
  }
}

function addStreamEffect() {
  // Simple stream line
  const streamGeo = new THREE.PlaneGeometry(1.5, 12);
  const streamMat = new THREE.MeshStandardMaterial({
    color: 0x3A6A8A, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.6,
  });
  const stream = new THREE.Mesh(streamGeo, streamMat);
  stream.rotation.x = -Math.PI / 2;
  stream.position.set(-4, 0.02, 0);
  stream.rotation.z = 0.3;
  scene.add(stream);
}

function onCanvasClick(e) {
  if (!isActive) return;

  const rect = e.target.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Check if clicked a node
  for (const [nodeId, data] of nodeMeshes) {
    if (!data.node.available) continue;
    const intersects = raycaster.intersectObject(data.baseMesh);
    if (intersects.length > 0) {
      // Check distance to player
      const dist = playerMesh.position.distanceTo(data.group.position);
      if (dist < 3) {
        harvestForageNode(nodeId);
        updateNodeVisuals();
        return;
      } else {
        // Walk to the node first
        playerTarget.copy(data.group.position);
        // After arriving, harvest
        pendingHarvest = nodeId;
        return;
      }
    }
  }

  // Otherwise, walk to clicked ground position
  const groundIntersects = raycaster.intersectObject(groundPlane);
  if (groundIntersects.length > 0) {
    const point = groundIntersects[0].point;
    playerTarget.set(point.x, 0, point.z);
    pendingHarvest = null;
  }
}

let pendingHarvest = null;

export function updateForagingScene(dt) {
  if (!isActive) return;
  time += dt || 0.016;

  // Move player toward target
  const moveSpeed = 4 * (dt || 0.016);
  const dir = new THREE.Vector3().subVectors(playerTarget, playerMesh.position);
  const dist = dir.length();

  if (dist > 0.1) {
    dir.normalize().multiplyScalar(Math.min(moveSpeed, dist));
    playerMesh.position.add(dir);

    // Face direction
    playerMesh.rotation.y = Math.atan2(dir.x, dir.z);

    // Bob animation
    playerMesh.position.y = Math.abs(Math.sin(time * 8)) * 0.05;
  } else if (pendingHarvest !== null) {
    // Arrived at node, harvest
    harvestForageNode(pendingHarvest);
    updateNodeVisuals();
    pendingHarvest = null;
  }

  // Update node respawn visuals
  updateForageNodes();
  updateNodeVisuals();

  // Pulse glow on nearby available nodes
  for (const [, data] of nodeMeshes) {
    if (!data.node.available) continue;
    const d = playerMesh.position.distanceTo(data.group.position);
    if (d < 3) {
      data.glowMesh.material.opacity = 0.4 + Math.sin(time * 4) * 0.2;
      data.baseMesh.material.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.15;
    } else {
      data.glowMesh.material.opacity = 0.1;
      data.baseMesh.material.emissiveIntensity = 0.05;
    }
  }

  renderer.render(scene, camera);
}

function updateNodeVisuals() {
  for (const [, data] of nodeMeshes) {
    data.group.visible = data.node.available;
  }
}

export function activateForagingScene() {
  isActive = true;
}

export function deactivateForagingScene() {
  isActive = false;
}

export function isForagingActive() {
  return isActive;
}

export function resizeForagingScene(width, height) {
  if (!camera || !renderer) return;
  const aspect = width / height;
  const frustum = 14;
  camera.left = -frustum * aspect;
  camera.right = frustum * aspect;
  camera.top = frustum;
  camera.bottom = -frustum;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
