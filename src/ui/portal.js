// ═══ VIBE JAM PORTAL ═══
// Glowing archway — outbound redirect + incoming portal detection

import * as THREE from 'three';
import state from '../systems/state.js';
import { notify } from './notifications.js';

let portalGroup = null;
let portalParticles = [];
let portalTime = 0;

/**
 * Check URL for incoming portal params.
 * Returns { isPortal, username } or null.
 */
export function checkIncomingPortal() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('portal') === 'true') {
    return {
      isPortal: true,
      username: params.get('username') || 'Traveler',
    };
  }
  return null;
}

/**
 * Build the portal archway in the cart scene.
 * Call after scene is initialized.
 */
export function createPortal(scene) {
  portalGroup = new THREE.Group();
  portalGroup.position.set(-7, 0, 5);
  portalGroup.rotation.y = Math.PI / 6;

  // Left pillar
  const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 4, 8);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x6A5ACD, roughness: 0.4, metalness: 0.3,
    emissive: 0x2A1A6A, emissiveIntensity: 0.3,
  });
  const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
  leftPillar.position.set(-1.2, 2, 0);
  leftPillar.castShadow = true;
  portalGroup.add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
  rightPillar.position.set(1.2, 2, 0);
  rightPillar.castShadow = true;
  portalGroup.add(rightPillar);

  // Arch (torus section)
  const archGeo = new THREE.TorusGeometry(1.2, 0.2, 8, 16, Math.PI);
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x7B68EE, roughness: 0.3, metalness: 0.4,
    emissive: 0x4A3ABA, emissiveIntensity: 0.4,
  });
  const arch = new THREE.Mesh(archGeo, archMat);
  arch.position.set(0, 4, 0);
  arch.rotation.z = Math.PI;
  portalGroup.add(arch);

  // Portal surface (the glowing interior)
  const portalSurfGeo = new THREE.PlaneGeometry(2.2, 3.8);
  const portalSurfMat = new THREE.MeshStandardMaterial({
    color: 0x6A5ACD, emissive: 0x4A3ABA, emissiveIntensity: 0.6,
    transparent: true, opacity: 0.4, side: THREE.DoubleSide,
  });
  const portalSurf = new THREE.Mesh(portalSurfGeo, portalSurfMat);
  portalSurf.name = 'portal-surface';
  portalSurf.position.set(0, 2, 0);
  portalGroup.add(portalSurf);

  // Point light for glow
  const portalLight = new THREE.PointLight(0x7B68EE, 1.5, 8);
  portalLight.position.set(0, 2.5, 0.5);
  portalGroup.add(portalLight);

  // Base stones
  const baseGeo = new THREE.BoxGeometry(3.2, 0.3, 0.8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, 0.15, 0);
  base.receiveShadow = true;
  portalGroup.add(base);

  scene.add(portalGroup);

  // Make portal clickable via raycaster
  portalSurf.userData = { type: 'portal' };

  return portalGroup;
}

/**
 * Animate portal particles. Call in render loop.
 */
export function updatePortal(dt, scene) {
  if (!portalGroup) return;
  portalTime += dt || 0.016;

  // Pulse the portal surface
  const surf = portalGroup.getObjectByName('portal-surface');
  if (surf) {
    surf.material.opacity = 0.3 + Math.sin(portalTime * 2) * 0.15;
    surf.material.emissiveIntensity = 0.5 + Math.sin(portalTime * 3) * 0.2;
  }

  // Spawn particles occasionally
  if (Math.random() < 0.15) {
    spawnPortalParticle(scene);
  }

  // Update existing particles
  for (let i = portalParticles.length - 1; i >= 0; i--) {
    const p = portalParticles[i];
    p.position.y += 0.025;
    p.position.x += Math.sin(portalTime * 4 + i) * 0.005;
    p.material.opacity -= 0.008;
    p.rotation.y += 0.05;
    if (p.material.opacity <= 0) {
      scene.remove(p);
      portalParticles.splice(i, 1);
    }
  }
}

function spawnPortalParticle(scene) {
  const geo = new THREE.OctahedronGeometry(0.05, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xAA88FF, emissive: 0x7755CC, emissiveIntensity: 0.8,
    transparent: true, opacity: 0.7,
  });
  const particle = new THREE.Mesh(geo, mat);

  // Position within portal area
  const worldPos = portalGroup.position.clone();
  particle.position.set(
    worldPos.x + (Math.random() - 0.5) * 2,
    worldPos.y + 0.5 + Math.random() * 3,
    worldPos.z + (Math.random() - 0.5) * 0.5
  );

  scene.add(particle);
  portalParticles.push(particle);
}

/**
 * Handle portal click — redirect to Vibe Jam
 */
export function activatePortal() {
  const name = encodeURIComponent(state.playerName || 'Brewer');
  const url = `https://jam.pieter.com/portal/2026?username=${name}&color=amber&ref=brewmastersbazaar.com`;
  window.open(url, '_blank');
}

/**
 * Check if a raycaster hit is the portal
 */
export function isPortalHit(intersects) {
  return intersects.some(i => i.object.userData?.type === 'portal');
}

/**
 * Show incoming portal welcome
 */
export function showPortalWelcome(username) {
  notify(`✨ ${username} has arrived from another realm! Welcome to Brewmaster's Bazaar!`, 'discovery');
}
