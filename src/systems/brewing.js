// ═══ BREWING SYSTEM ═══
// Recipe matching, near-miss detection, brew execution

import state from './state.js';
import { notify } from '../ui/notifications.js';

/**
 * Get the cost to brew with current selection
 */
export function getBrewCost() {
  let cost = 0;
  // Base costs
  const baseCosts = { grain: 2, honey: 5, fruit: 3, none: 0 };
  if (state.selectedBase) {
    cost += baseCosts[state.selectedBase] || 0;
  }
  // Ingredient costs by tier
  const tierCosts = { 1: 0, 2: 2, 3: 6, 4: 15, 5: 35, 99: 0 };
  for (const ingId of state.cauldronSlots) {
    const ing = state.ingredients.find(i => i.id === ingId);
    if (ing) cost += tierCosts[ing.tier] || 0;
  }
  return cost;
}

/**
 * Attempt to match current ingredients against recipes
 * Returns { recipe, matchType: 'exact'|'near-miss'|'fail', nearMissRecipe, hintLevel }
 */
export function matchRecipe(base, ingredients, method) {
  const sortedIngs = [...ingredients].sort();
  
  let bestMatch = null;
  let bestMatchScore = 0;
  
  for (const recipe of state.recipes) {
    const recipeIngs = [...recipe.ingredients].sort();
    
    // Check exact match
    if (recipe.base === base && 
        recipe.method === method &&
        recipeIngs.length === sortedIngs.length &&
        recipeIngs.every((ing, i) => ing === sortedIngs[i])) {
      return { recipe, matchType: 'exact', nearMissRecipe: null, hintLevel: 0 };
    }
    
    // Calculate similarity for near-miss
    const score = calculateSimilarity(base, sortedIngs, method, recipe);
    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestMatch = recipe;
    }
  }
  
  const threshold = state.gameConfig?.brewing?.nearMissThreshold || 0.7;
  if (bestMatchScore >= threshold && bestMatch) {
    // Determine hint level based on attempts
    const comboKey = `${base}:${sortedIngs.join(',')}:${method}`;
    state.recipeAttempts[comboKey] = (state.recipeAttempts[comboKey] || 0) + 1;
    const attempts = state.recipeAttempts[comboKey];
    
    const cfg = state.gameConfig?.hints || {};
    let hintLevel = 0;
    if (attempts >= (cfg.failedAttemptsForHint3 || 10)) hintLevel = 3;
    else if (attempts >= (cfg.failedAttemptsForHint2 || 6)) hintLevel = 2;
    else if (attempts >= (cfg.failedAttemptsForHint1 || 3)) hintLevel = 1;
    
    return { recipe: null, matchType: 'near-miss', nearMissRecipe: bestMatch, hintLevel };
  }
  
  return { recipe: null, matchType: 'fail', nearMissRecipe: null, hintLevel: 0 };
}

/**
 * Calculate similarity between a brew attempt and a recipe (0-1)
 */
function calculateSimilarity(base, sortedIngs, method, recipe) {
  let score = 0;
  let maxScore = 3; // base + method + ingredients
  
  // Base match
  if (recipe.base === base) score += 1;
  
  // Method match (partial credit for related methods)
  if (recipe.method === method) {
    score += 1;
  } else if (
    (recipe.method === 'ferment' && method === 'ferment_barrel') ||
    (recipe.method === 'distill' && method === 'distill_barrel') ||
    (recipe.method === 'ferment_barrel' && method === 'ferment') ||
    (recipe.method === 'distill_barrel' && method === 'distill')
  ) {
    score += 0.5;
  }
  
  // Ingredient overlap
  const recipeIngs = new Set(recipe.ingredients);
  const attemptIngs = new Set(sortedIngs);
  
  const union = new Set([...recipeIngs, ...attemptIngs]);
  const intersection = [...recipeIngs].filter(i => attemptIngs.has(i));
  
  if (union.size > 0) {
    score += (intersection.length / union.size);
  } else if (recipeIngs.size === 0 && attemptIngs.size === 0) {
    score += 1; // Both have no extra ingredients
  }
  
  return score / maxScore;
}

/**
 * Generate a near-miss hint message
 */
export function getNearMissHint(nearMissRecipe, hintLevel) {
  if (!nearMissRecipe) {
    const msgs = state.gameConfig?.brewing?.nearMissMessages || ["This is CLOSE to something special..."];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  
  const formats = state.gameConfig?.hints?.hintFormats || {};
  
  if (hintLevel >= 3 && formats.level3) {
    const ing = nearMissRecipe.ingredients[0] || '???';
    const ingData = state.ingredients.find(i => i.id === ing);
    return formats.level3
      .replace('{ingredient1}', ingData?.name || ing)
      .replace('{method}', nearMissRecipe.method);
  }
  if (hintLevel >= 2 && formats.level2) {
    const ing = nearMissRecipe.ingredients[0] || '???';
    const ingData = state.ingredients.find(i => i.id === ing);
    return formats.level2.replace('{ingredient1}', ingData?.name || ing);
  }
  if (hintLevel >= 1 && formats.level1) {
    return formats.level1.replace('{family}', nearMissRecipe.family || nearMissRecipe.tier);
  }
  
  return "This is CLOSE to something special... keep experimenting!";
}

/**
 * Execute a brew — returns the result
 */
export function executeBrew() {
  const base = state.selectedBase;
  const ingredients = [...state.cauldronSlots];
  const method = state.selectedMethod;
  
  if (!base || !method) return null;
  
  const cost = getBrewCost();
  if (state.crowns < cost) {
    notify('Not enough crowns!', 'gold');
    return null;
  }
  
  state.crowns -= cost;
  
  const result = matchRecipe(base, ingredients, method);
  
  if (result.matchType === 'exact' && result.recipe) {
    const isNew = !state.discoveredRecipes.has(result.recipe.id);
    if (isNew) {
      state.discoveredRecipes.add(result.recipe.id);
    }
    
    // Add to brewed drinks inventory
    state.brewedDrinks.push({
      recipeId: result.recipe.id,
      recipe: result.recipe,
      brewedAt: Date.now(),
    });
    
    return {
      success: true,
      recipe: result.recipe,
      isNew,
      nearMiss: false,
      hintMessage: null,
    };
  }
  
  if (result.matchType === 'near-miss') {
    return {
      success: false,
      recipe: null,
      isNew: false,
      nearMiss: true,
      hintMessage: getNearMissHint(result.nearMissRecipe, result.hintLevel),
    };
  }
  
  // Total fail — Mystery Slop
  const failConfig = state.gameConfig?.brewing?.failResult || {};
  const slopDialogue = failConfig.dialogue || ["Something went wrong..."];
  
  const slopRecipe = {
    id: 'mystery_slop',
    name: failConfig.name || 'Mystery Slop',
    stars: 0,
    tier: 'swill',
    lore: slopDialogue[Math.floor(Math.random() * slopDialogue.length)],
    sellPrice: failConfig.sellPrice || 1,
  };
  
  state.brewedDrinks.push({
    recipeId: 'mystery_slop',
    recipe: slopRecipe,
    brewedAt: Date.now(),
  });
  
  return {
    success: false,
    recipe: slopRecipe,
    isNew: false,
    nearMiss: false,
    hintMessage: null,
  };
}
