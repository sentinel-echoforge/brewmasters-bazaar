// ═══ API CLIENT ═══
// Handles all communication with the backend server
// Token-based auth via localStorage

const TOKEN_KEY = 'brewmasters_token';
const PLAYER_ID_KEY = 'brewmasters_player_id';

let cachedToken = null;

/**
 * Get the player token from localStorage
 */
export function getToken() {
  if (cachedToken) return cachedToken;
  cachedToken = localStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

/**
 * Set the player token
 */
export function setToken(token) {
  cachedToken = token;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get stored player ID
 */
export function getPlayerId() {
  return localStorage.getItem(PLAYER_ID_KEY);
}

/**
 * Check if player has a saved session
 */
export function hasSession() {
  return !!getToken();
}

/**
 * Clear session
 */
export function clearSession() {
  cachedToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PLAYER_ID_KEY);
}

/**
 * API request helper with auth
 */
async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-player-token'] = token;

  try {
    const resp = await fetch(`/api${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      console.warn(`API ${path} error:`, err);
      return { error: err.error || resp.statusText, status: resp.status };
    }

    return await resp.json();
  } catch (err) {
    console.warn(`API ${path} network error:`, err.message);
    return { error: 'Network error', offline: true };
  }
}

// ═══ Player APIs ═══

export async function createPlayer(name, cartName, region) {
  const result = await api('/player/create', {
    method: 'POST',
    body: JSON.stringify({ name, cartName, region }),
  });
  if (result.token) {
    setToken(result.token);
    localStorage.setItem(PLAYER_ID_KEY, result.playerId);
  }
  return result;
}

export async function loadPlayer() {
  const token = getToken();
  if (!token) return null;
  const result = await api(`/player/${token}`);
  if (result.error) return null;
  return result;
}

export async function savePlayer(data) {
  return api('/player/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ═══ Economy APIs ═══

export async function getEconomy() {
  return api('/economy');
}

export async function sellDrink(recipeId, customerId) {
  return api('/economy/sell', {
    method: 'POST',
    body: JSON.stringify({ recipeId, customerId }),
  });
}

export async function exportDrink(recipeId, targetRegion) {
  return api('/economy/export', {
    method: 'POST',
    body: JSON.stringify({ recipeId, targetRegion }),
  });
}

export async function getExports() {
  return api('/exports');
}

// ═══ Marketplace APIs ═══

export async function getMarketplace() {
  return api('/marketplace');
}

export async function createListing(type, itemId, quantity, price) {
  return api('/marketplace/list', {
    method: 'POST',
    body: JSON.stringify({ type, itemId, quantity, price }),
  });
}

export async function buyListing(listingId) {
  return api('/marketplace/buy', {
    method: 'POST',
    body: JSON.stringify({ listingId }),
  });
}

export async function cancelListing(listingId) {
  return api(`/marketplace/${listingId}`, { method: 'DELETE' });
}

// ═══ Trade Board APIs ═══

export async function getTrades() {
  return api('/trades');
}

export async function createTradeOffer(offerItems, wantItems) {
  return api('/trades/offer', {
    method: 'POST',
    body: JSON.stringify({ offerItems, wantItems }),
  });
}

export async function acceptTrade(tradeId) {
  return api('/trades/accept', {
    method: 'POST',
    body: JSON.stringify({ tradeId }),
  });
}

export async function cancelTrade(tradeId) {
  return api(`/trades/${tradeId}`, { method: 'DELETE' });
}

// ═══ Commission APIs ═══

export async function getCommission() {
  return api('/commission');
}

export async function submitCommission(recipeIds) {
  return api('/commission/submit', {
    method: 'POST',
    body: JSON.stringify({ recipeIds }),
  });
}

// ═══ Leaderboard APIs ═══

export async function getLeaderboard() {
  return api('/leaderboard');
}

// ═══ Town Crier APIs ═══

export async function getCrier() {
  return api('/crier');
}

// ═══ Regions ═══

export async function getRegions() {
  return api('/regions');
}

// ═══ Discovery notification ═══

export async function notifyDiscovery(recipeId) {
  return api('/discovery', {
    method: 'POST',
    body: JSON.stringify({ recipeId }),
  });
}

// ═══ Level up notification ═══

export async function notifyLevelUp(newLevel) {
  return api('/levelup', {
    method: 'POST',
    body: JSON.stringify({ newLevel }),
  });
}

// ═══ Health check ═══

export async function healthCheck() {
  return api('/health');
}
