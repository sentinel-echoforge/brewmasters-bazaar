// ═══ RECIPE HINTS SYSTEM ═══
// Progressive discovery — silhouette recipes get clearer after failed attempts

import state from './state.js';

const STORAGE_KEY = 'brewmaster_hints';

// Track failed attempts per ingredient combo
// { "honey:berries:boil": 5, ... }
let failTracker = {};

// Load persisted data
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved) failTracker = saved;
} catch (e) { /* ignore */ }

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(failTracker)); } catch (e) { /* ignore */ }
}

/**
 * Record a failed brew attempt (no recipe matched or near-miss).
 * Called from brewing system when result is not a new recipe.
 */
export function recordFailedAttempt(base, ingredients, method) {
  const key = makeKey(base, ingredients, method);
  failTracker[key] = (failTracker[key] || 0) + 1;
  persist();
  return failTracker[key];
}

/**
 * Get hint info for an undiscovered recipe in the journal.
 * Returns { hintLevel: 0-3, hintText: string|null }
 */
export function getRecipeHint(recipe) {
  if (!recipe) return { hintLevel: 0, hintText: null };
  
  const cfg = state.gameConfig?.hints || {};
  const threshold1 = cfg.failedAttemptsForHint1 || 3;
  const threshold2 = cfg.failedAttemptsForHint2 || 6;
  const threshold3 = cfg.failedAttemptsForHint3 || 10;
  const formats = cfg.hintFormats || {};
  
  // Check if the player has failed attempts that are close to this recipe
  // We look at attempts that share at least one ingredient with this recipe
  let maxRelevantFails = 0;
  
  for (const [key, count] of Object.entries(failTracker)) {
    const parts = key.split(':');
    const attemptBase = parts[0];
    const attemptIngs = parts.slice(1, -1);
    const attemptMethod = parts[parts.length - 1];
    
    // Calculate relevance to this recipe
    const recipeIngs = recipe.ingredients || [];
    const overlap = attemptIngs.filter(i => recipeIngs.includes(i)).length;
    
    // Must share at least one ingredient with the recipe
    if (overlap > 0 && attemptBase === recipe.base) {
      maxRelevantFails = Math.max(maxRelevantFails, count);
    }
  }
  
  if (maxRelevantFails >= threshold3) {
    const ing = recipe.ingredients[0] || '???';
    const ingData = state.ingredients.find(i => i.id === ing);
    const text = (formats.level3 || '{ingredient1} + ??? — try {method}')
      .replace('{ingredient1}', ingData?.name || ing)
      .replace('{method}', recipe.method || '???');
    return { hintLevel: 3, hintText: text };
  }
  
  if (maxRelevantFails >= threshold2) {
    const ing = recipe.ingredients[0] || '???';
    const ingData = state.ingredients.find(i => i.id === ing);
    const text = (formats.level2 || 'Uses {ingredient1}...')
      .replace('{ingredient1}', ingData?.name || ing);
    return { hintLevel: 2, hintText: text };
  }
  
  if (maxRelevantFails >= threshold1) {
    const text = (formats.level1 || 'A {family} brew...')
      .replace('{family}', recipe.family || recipe.tier || 'mysterious');
    return { hintLevel: 1, hintText: text };
  }
  
  return { hintLevel: 0, hintText: null };
}

/**
 * Get all hint data for the journal (map of recipeId -> hint info)
 */
export function getAllRecipeHints() {
  const hints = {};
  for (const recipe of state.recipes) {
    if (!state.discoveredRecipes.has(recipe.id)) {
      hints[recipe.id] = getRecipeHint(recipe);
    }
  }
  return hints;
}

function makeKey(base, ingredients, method) {
  return `${base}:${[...ingredients].sort().join(':')}:${method}`;
}

/**
 * Reset hint tracking (for settings reset)
 */
export function resetHints() {
  failTracker = {};
  persist();
}
