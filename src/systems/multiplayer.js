// ═══ MULTIPLAYER SYNC ═══
// Connects frontend game state with backend server
// Handles polling, auto-save, and state hydration

import state from './state.js';
import * as api from './api-client.js';
import { notify } from '../ui/notifications.js';

let pollInterval = null;
let saveTimeout = null;
let lastCrierTimestamp = null;
let connected = false;

// Callbacks for UI updates
let onEconomyUpdate = null;
let onCrierUpdate = null;
let onCommissionUpdate = null;
let onLeaderboardUpdate = null;

/**
 * Initialize multiplayer — create or load player
 */
export async function initMultiplayer() {
  // Check server health
  const health = await api.healthCheck();
  if (health.error) {
    console.warn('Server offline — playing in local mode');
    connected = false;
    return false;
  }

  connected = true;

  // Try to load existing session
  if (api.hasSession()) {
    const playerData = await api.loadPlayer();
    if (playerData && !playerData.error) {
      hydrateState(playerData);
      console.log(`🌐 Loaded save: ${playerData.name} of "${playerData.cartName}"`);
      return true;
    }
    // Invalid token — clear and create new
    api.clearSession();
  }

  return false;
}

/**
 * Create player on server after intro flow
 */
export async function createServerPlayer() {
  if (!connected) return false;

  const result = await api.createPlayer(
    state.playerName,
    state.cartName,
    state.region || 'americas_us'
  );

  if (result.error) {
    console.warn('Failed to create player on server:', result.error);
    return false;
  }

  console.log(`🌐 Player created on server: ${result.playerId}`);
  return true;
}

/**
 * Hydrate local state from server data
 */
function hydrateState(data) {
  state.playerName = data.name || state.playerName;
  state.cartName = data.cartName || state.cartName;
  state.crowns = data.crowns ?? state.crowns;
  state.breweryLevel = data.level || state.breweryLevel;
  state.region = data.region || state.region;
  state.reputation = data.reputation || 0;
  state.servedCount = data.servedCount || 0;

  // Restore discovered recipes
  if (data.recipesDiscovered && Array.isArray(data.recipesDiscovered)) {
    state.discoveredRecipes = new Set(data.recipesDiscovered);
  }

  // Restore equipment
  if (data.equipment && Array.isArray(data.equipment)) {
    state.equipment = data.equipment;
  }

  // Restore brewed drinks
  if (data.brewedDrinks && Array.isArray(data.brewedDrinks)) {
    state.brewedDrinks = data.brewedDrinks;
  }

  // Restore available ingredients
  if (data.availableIngredients && Array.isArray(data.availableIngredients)) {
    for (const id of data.availableIngredients) {
      state.availableIngredients.add(id);
    }
  }

  // Restore garden
  if (data.gardenPlots) state.gardenPlots = data.gardenPlots;
  if (data.agingBarrels) state.agingBarrels = data.agingBarrels;

  // Update flavor slots based on level
  if (state.breweryLevel >= 3) {
    state.maxFlavorSlots = state.gameConfig?.brewing?.flavorSlotsLevel3 || 3;
  }
}

/**
 * Start polling for economy, crier, commission updates
 */
export function startPolling() {
  if (!connected) return;

  // Initial fetch
  pollEconomy();
  pollCrier();
  pollCommission();

  // Poll every 30-60 seconds
  pollInterval = setInterval(() => {
    pollEconomy();
    pollCrier();
    pollCommission();
  }, 45000); // 45 seconds
}

/**
 * Stop polling
 */
export function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

/**
 * Set callback handlers for multiplayer updates
 */
export function setMultiplayerCallbacks({ onEconomy, onCrier, onCommission, onLeaderboard }) {
  if (onEconomy) onEconomyUpdate = onEconomy;
  if (onCrier) onCrierUpdate = onCrier;
  if (onCommission) onCommissionUpdate = onCommission;
  if (onLeaderboard) onLeaderboardUpdate = onLeaderboard;
}

// ═══ POLLING ═══

async function pollEconomy() {
  const data = await api.getEconomy();
  if (data.error) return;

  state.economyPrices = data.prices || [];
  state.seasonalModifier = data.seasonal;
  state.currentSeason = data.season;

  if (onEconomyUpdate) onEconomyUpdate(data);
}

async function pollCrier() {
  const data = await api.getCrier();
  if (data.error) return;

  state.crierAnnouncements = data.announcements || [];

  // Check for new announcements
  if (data.announcements && data.announcements.length > 0) {
    const latest = data.announcements[data.announcements.length - 1];
    if (lastCrierTimestamp !== latest.created_at) {
      lastCrierTimestamp = latest.created_at;
      if (onCrierUpdate) onCrierUpdate(data.announcements);
    }
  }
}

async function pollCommission() {
  const data = await api.getCommission();
  if (data.error) return;

  state.currentCommission = data.commission;
  if (onCommissionUpdate) onCommissionUpdate(data.commission);
}

// ═══ AUTO-SAVE ═══

/**
 * Queue an auto-save (debounced — saves 2 seconds after last event)
 */
export function queueSave() {
  if (!connected) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(doSave, 2000);
}

/**
 * Immediate save
 */
export async function doSave() {
  if (!connected) return;

  const data = {
    crowns: state.crowns,
    level: state.breweryLevel,
    region: state.region,
    recipesDiscovered: [...state.discoveredRecipes],
    equipment: state.equipment,
    brewedDrinks: state.brewedDrinks,
    availableIngredients: [...state.availableIngredients],
    gardenPlots: state.gardenPlots,
    agingBarrels: state.agingBarrels,
    servedCount: state.servedCount,
    reputation: state.reputation,
  };

  const result = await api.savePlayer(data);
  if (result.error) {
    console.warn('Auto-save failed:', result.error);
  }
}

// ═══ EVENT HOOKS (call these from game systems) ═══

/**
 * Notify server of a brew + sell event
 */
export async function onSellDrink(recipeId, customerId) {
  if (!connected) return null;
  const result = await api.sellDrink(recipeId, customerId);
  queueSave();
  return result;
}

/**
 * Notify server of a new recipe discovery
 */
export async function onRecipeDiscovered(recipeId) {
  if (!connected) return null;
  const result = await api.notifyDiscovery(recipeId);
  if (result.firstOnServer) {
    notify(`🎉 FIRST ON SERVER to discover this recipe! +${result.bonus}c bonus!`, 'gold');
    state.crowns += result.bonus;
  }
  queueSave();
  return result;
}

/**
 * Notify server of level up
 */
export async function onLevelUp(newLevel) {
  if (!connected) return null;
  const result = await api.notifyLevelUp(newLevel);
  queueSave();
  return result;
}

/**
 * Check if server is connected
 */
export function isConnected() {
  return connected;
}

/**
 * Get economy price for a recipe
 */
export function getEconomyPrice(recipeId) {
  if (!state.economyPrices) return null;
  const entry = state.economyPrices.find(e => e.recipe_id === recipeId);
  return entry ? entry.current_price : null;
}
