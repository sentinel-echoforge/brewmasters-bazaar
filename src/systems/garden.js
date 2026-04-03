// ═══ GARDEN / FORAGING SYSTEM ═══
// Wild patches, planting plots, growth timers, harvesting

import state from './state.js';
import { notify } from '../ui/notifications.js';

// Forage node definitions — spawned in foraging scene
// Each node has a respawn timer
let forageNodes = [];
let lastForageUpdate = 0;

const RESPAWN_MIN_MS = 5 * 60 * 1000;  // 5 minutes
const RESPAWN_MAX_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Initialize foraging nodes based on region + level
 */
export function initForageNodes() {
  forageNodes = [];

  // Base foraging ingredients (always available)
  const baseForage = [
    { ingredientId: 'wild_herbs', tier: 1, count: 3 },
  ];

  // Regional wild ingredients
  const regionIngredients = state.regionData?.gardenIngredients || [];

  // Tier-gated forest ingredients
  const level = state.breweryLevel || 1;
  const forestIngredients = [];
  if (level >= 1) forestIngredients.push({ ingredientId: 'ginger_root', tier: 3 }, { ingredientId: 'berries', tier: 2 });
  if (level >= 2) forestIngredients.push({ ingredientId: 'wild_mushroom', tier: 3 }, { ingredientId: 'roasted_acorn', tier: 3 }, { ingredientId: 'sour_cherry', tier: 3 });
  if (level >= 3) forestIngredients.push({ ingredientId: 'cinnamon_bark', tier: 4 }, { ingredientId: 'juniper_berry', tier: 4 }, { ingredientId: 'elderflower', tier: 4 });

  // Populate nodes
  let nodeId = 0;
  for (const item of baseForage) {
    for (let i = 0; i < item.count; i++) {
      forageNodes.push(createNode(nodeId++, item.ingredientId, item.tier));
    }
  }

  for (const ingId of regionIngredients) {
    forageNodes.push(createNode(nodeId++, ingId, 2));
    forageNodes.push(createNode(nodeId++, ingId, 2));
  }

  for (const item of forestIngredients) {
    forageNodes.push(createNode(nodeId++, item.ingredientId, item.tier));
  }

  return forageNodes;
}

function createNode(id, ingredientId, tier) {
  // Random position in foraging area (-12 to 12 range)
  const angle = Math.random() * Math.PI * 2;
  const radius = 3 + Math.random() * 8;
  return {
    id,
    ingredientId,
    tier,
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
    available: true,
    respawnAt: 0,
  };
}

/**
 * Get all forage nodes (for rendering)
 */
export function getForageNodes() {
  return forageNodes;
}

/**
 * Pick up an ingredient from a forage node
 */
export function harvestForageNode(nodeId) {
  const node = forageNodes.find(n => n.id === nodeId);
  if (!node || !node.available) return null;

  node.available = false;
  const respawnTime = RESPAWN_MIN_MS + Math.random() * (RESPAWN_MAX_MS - RESPAWN_MIN_MS);
  node.respawnAt = Date.now() + respawnTime;

  // Add ingredient to available
  state.availableIngredients.add(node.ingredientId);

  const ing = state.ingredients.find(i => i.id === node.ingredientId);
  notify(`🌿 Picked ${ing?.emoji || ''} ${ing?.name || node.ingredientId}!`);

  return node.ingredientId;
}

/**
 * Update forage nodes (check respawn timers)
 */
export function updateForageNodes() {
  const now = Date.now();
  for (const node of forageNodes) {
    if (!node.available && now >= node.respawnAt) {
      node.available = true;
    }
  }
}

/**
 * Update garden plots (check growth timers)
 */
export function updateGardenPlots() {
  if (!state.gardenPlots) return;
  const now = Date.now();

  for (const plot of state.gardenPlots) {
    if (plot.type === 'wild') {
      plot.ready = true; // wild plots always ready
      continue;
    }
    if (!plot.ready && plot.plantedAt + plot.growthMs <= now) {
      plot.ready = true;
      const ing = state.ingredients.find(i => i.id === plot.ingredientId);
      notify(`🌱 ${ing?.emoji || ''} ${ing?.name || plot.ingredientId} is ready to harvest!`);
    }
  }
}

/**
 * Harvest a garden plot
 */
export function harvestGardenPlot(plotIndex) {
  if (!state.gardenPlots?.[plotIndex]) return null;
  const plot = state.gardenPlots[plotIndex];

  if (!plot.ready) {
    notify('Not ready yet! Come back later.');
    return null;
  }

  state.availableIngredients.add(plot.ingredientId);

  if (plot.type === 'wild') {
    // Wild plots: instant regrow (5-10 min cooldown)
    plot.ready = false;
    const respawnTime = RESPAWN_MIN_MS + Math.random() * (RESPAWN_MAX_MS - RESPAWN_MIN_MS);
    plot.plantedAt = Date.now();
    plot.growthMs = respawnTime;
    return plot.ingredientId;
  }

  // Planted plots
  if (plot.harvestsRemaining !== Infinity) {
    plot.harvestsRemaining--;
    if (plot.harvestsRemaining <= 0) {
      // Remove depleted plot
      state.gardenPlots.splice(plotIndex, 1);
      notify('🥀 Plant depleted! Buy a new seed from Omar.');
      return plot.ingredientId;
    }
  }

  // Regrow for next harvest
  plot.ready = false;
  plot.plantedAt = Date.now();

  const ing = state.ingredients.find(i => i.id === plot.ingredientId);
  notify(`🌿 Harvested ${ing?.emoji || ''} ${ing?.name || plot.ingredientId}!`);

  return plot.ingredientId;
}

/**
 * Get garden plots info for UI
 */
export function getGardenPlots() {
  if (!state.gardenPlots) return [];
  const now = Date.now();

  return state.gardenPlots.map((plot, index) => {
    const ing = state.ingredients.find(i => i.id === plot.ingredientId);
    const elapsed = now - plot.plantedAt;
    const progress = plot.growthMs > 0 ? Math.min(1, elapsed / plot.growthMs) : 1;
    const remainingMs = Math.max(0, plot.growthMs - elapsed);

    return {
      index,
      ingredientId: plot.ingredientId,
      ingredient: ing,
      type: plot.type,
      ready: plot.ready || (plot.type === 'wild'),
      progress,
      remainingMs,
      harvestsRemaining: plot.harvestsRemaining,
    };
  });
}
