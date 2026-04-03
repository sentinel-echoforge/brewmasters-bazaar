// ═══ TRAVELING MERCHANT SYSTEM (Omar) ═══
// Rotating stock, dialogue, demand inflation, seeds

import state from './state.js';
import { notify } from '../ui/notifications.js';

let merchantStock = null; // loaded from merchant-stock.json
let merchantDialogue = null; // loaded from merchants.json
let currentRotation = null;
let currentPrices = {}; // { ingredientId: inflated price }
let purchaseCounts = {}; // { ingredientId: count } resets on restock
let lastRestockTime = 0;
let visitCount = 0;

/**
 * Initialize merchant system with loaded data
 */
export function initMerchant(stockData, dialogueData) {
  merchantStock = stockData;
  merchantDialogue = dialogueData;
  lastRestockTime = Date.now();
  pickRotation();
}

/**
 * Pick a stock rotation (random from available)
 */
function pickRotation() {
  if (!merchantStock?.rotations?.length) return;
  const rotations = merchantStock.rotations;
  const idx = Math.floor(Math.random() * rotations.length);
  currentRotation = rotations[idx];
  currentPrices = {};
  purchaseCounts = {};

  // Calculate base prices from ingredient data
  for (const item of currentRotation.items) {
    const ing = state.ingredients.find(i => i.id === item.ingredientId);
    const tierCosts = { 1: 0, 2: 2, 3: 6, 4: 15, 5: 35, 99: 0 };
    const baseCost = ing ? (tierCosts[ing.tier] || 5) : 5;
    currentPrices[item.ingredientId] = Math.round(baseCost * (item.priceMultiplier || 1.0));
    purchaseCounts[item.ingredientId] = 0;
  }
}

/**
 * Check if merchant needs restock (called from game loop)
 */
export function checkMerchantRestock() {
  if (!merchantStock) return false;
  const [minMinutes, maxMinutes] = merchantStock.restockIntervalMinutes || [120, 180];
  // Use configured value from game-config if available
  const configMinutes = state.gameConfig?.economy?.merchantRestockMinutes || minMinutes;
  const elapsed = (Date.now() - lastRestockTime) / 60000;

  if (elapsed >= configMinutes) {
    restock();
    return true;
  }
  return false;
}

/**
 * Force restock
 */
function restock() {
  lastRestockTime = Date.now();
  pickRotation();
  visitCount++;
  notify('🐪 Omar the Wanderer has arrived with new wares!');
}

/**
 * Is merchant currently available?
 */
export function isMerchantAvailable() {
  return currentRotation !== null;
}

/**
 * Get current merchant stock with inflated prices
 */
export function getMerchantStock() {
  if (!currentRotation) return [];

  return currentRotation.items.map(item => {
    const ing = state.ingredients.find(i => i.id === item.ingredientId);
    const bought = purchaseCounts[item.ingredientId] || 0;
    const inflationRate = state.gameConfig?.economy?.merchantInflationPerBuy || 0.05;
    const basePrice = currentPrices[item.ingredientId] || 5;
    const inflatedPrice = Math.round(basePrice * (1 + inflationRate * bought));
    const remaining = (item.quantity || 5) - bought;

    return {
      ingredientId: item.ingredientId,
      ingredient: ing,
      price: inflatedPrice,
      basePrice,
      remaining: Math.max(0, remaining),
      isSeed: item.isSeed || false,
      growthHours: item.growthHours || 0,
      priceMultiplier: item.priceMultiplier || 1.0,
    };
  }).filter(item => item.remaining > 0);
}

/**
 * Buy an item from the merchant
 */
export function buyFromMerchant(ingredientId) {
  const stock = getMerchantStock();
  const item = stock.find(s => s.ingredientId === ingredientId);

  if (!item) {
    notify('Out of stock!');
    return false;
  }

  if (state.crowns < item.price) {
    notify(`Need ${item.price} crowns! You have ${state.crowns}.`, 'gold');
    return false;
  }

  state.crowns -= item.price;
  purchaseCounts[ingredientId] = (purchaseCounts[ingredientId] || 0) + 1;

  if (item.isSeed) {
    // Add seed to garden
    plantSeed(ingredientId, item.growthHours);
    notify(`🌱 Planted ${item.ingredient?.name || ingredientId} seed in your garden!`);
  } else {
    // Add to available ingredients
    state.availableIngredients.add(ingredientId);
    notify(`Bought ${item.ingredient?.emoji || ''} ${item.ingredient?.name || ingredientId} for ${item.price}c`);
  }

  return true;
}

/**
 * Plant a seed in the garden
 */
function plantSeed(ingredientId, growthHours) {
  if (!state.gardenPlots) state.gardenPlots = [];

  const ing = state.ingredients.find(i => i.id === ingredientId);
  const tier = ing?.tier || 2;

  // Tier 5 seeds: 3 harvests then replant
  const maxHarvests = tier >= 5 ? 3 : Infinity;

  state.gardenPlots.push({
    ingredientId,
    type: 'planted',
    plantedAt: Date.now(),
    growthMs: growthHours * 60 * 60 * 1000,
    harvestsRemaining: maxHarvests,
    ready: false,
  });
}

/**
 * Get contextual dialogue from Omar
 */
export function getMerchantDialogue() {
  if (!merchantDialogue?.dialogue_by_context) return "Welcome, traveler.";

  const contexts = merchantDialogue.dialogue_by_context;
  let pool = [];

  // Determine context
  if (visitCount === 0 || !state._merchantVisited) {
    pool = contexts.first_visit || [];
    state._merchantVisited = true;
  } else if (state.crowns < 10) {
    pool = contexts.returning_broke || [];
  } else if (state.crowns > 500) {
    pool = contexts.returning_rich || [];
  } else {
    pool = contexts.returning_friend || [];
  }

  // Add rotation-specific intro
  const rotationIntro = currentRotation?.omarDialogue || '';

  if (pool.length === 0) return rotationIntro || "Welcome back, brewer.";

  const line = pool[Math.floor(Math.random() * pool.length)];
  const text = line.text || line;

  // Replace placeholders
  return text
    .replace('[PLAYER_NAME]', state.playerName || 'friend')
    .replace('[INGREDIENT]', currentRotation?.items?.[0]?.ingredientId || 'something special')
    .replace('[REGION]', state.regionData?.name || 'a distant land');
}

/**
 * Get rotation theme dialogue
 */
export function getRotationDialogue() {
  return currentRotation?.omarDialogue || '';
}

/**
 * Get an ingredient story if available
 */
export function getIngredientStory(ingredientId) {
  if (!merchantDialogue?.dialogue_by_context?.ingredient_stories) return null;
  const story = merchantDialogue.dialogue_by_context.ingredient_stories.find(
    s => s.ingredient === ingredientId
  );
  return story?.text || null;
}

/**
 * Get minutes until next restock
 */
export function getMinutesUntilRestock() {
  const configMinutes = state.gameConfig?.economy?.merchantRestockMinutes || 150;
  const elapsed = (Date.now() - lastRestockTime) / 60000;
  return Math.max(0, Math.round(configMinutes - elapsed));
}

/**
 * Get current rotation info
 */
export function getCurrentRotation() {
  return currentRotation;
}
