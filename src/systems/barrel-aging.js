// ═══ BARREL AGING SYSTEM ═══
// Place brewed drinks in barrels → timer → quality boost / new recipe

import state from './state.js';
import { matchRecipe } from './brewing.js';
import { notify } from '../ui/notifications.js';

/**
 * Get max barrel slots based on cart level
 */
export function getMaxBarrels() {
  const level = state.breweryLevel || 1;
  // From ECONOMY.md Section 9
  const barrelsByLevel = { 1: 1, 2: 3, 3: 5, 4: 8, 5: 10 };
  return barrelsByLevel[level] || 1;
}

/**
 * Get currently aging barrels
 */
export function getAgingBarrels() {
  if (!state.agingBarrels) state.agingBarrels = [];
  return state.agingBarrels;
}

/**
 * Place a brewed drink in a barrel for aging
 */
export function startAging(drinkIndex) {
  if (!state.agingBarrels) state.agingBarrels = [];

  const maxBarrels = getMaxBarrels();
  if (state.agingBarrels.length >= maxBarrels) {
    notify(`All ${maxBarrels} barrels are full! Upgrade your cart for more.`);
    return false;
  }

  const drink = state.brewedDrinks[drinkIndex];
  if (!drink) {
    notify('No drink to age!');
    return false;
  }

  // Determine aging time from game config
  const ageTimes = state.gameConfig?.brewing?.barrelAgeMinutes || { short: 30, medium: 60, long: 120 };
  // Use short aging for common/fine, medium for rare, long for legendary
  let ageMinutes = ageTimes.short;
  if (drink.recipe.tier === 'rare') ageMinutes = ageTimes.medium;
  if (drink.recipe.tier === 'legendary' || drink.recipe.tier === 'secret') ageMinutes = ageTimes.long;

  const barrel = {
    id: Date.now() + Math.random(),
    drink: { ...drink },
    startedAt: Date.now(),
    durationMs: ageMinutes * 60 * 1000,
    done: false,
    collected: false,
  };

  state.agingBarrels.push(barrel);
  state.brewedDrinks.splice(drinkIndex, 1);

  notify(`🪵 ${drink.recipe.name} placed in barrel. Ready in ${ageMinutes} min!`);
  return true;
}

/**
 * Update barrels — check completion
 */
export function updateBarrels() {
  if (!state.agingBarrels) return;
  const now = Date.now();

  for (const barrel of state.agingBarrels) {
    if (!barrel.done && now >= barrel.startedAt + barrel.durationMs) {
      barrel.done = true;
      notify(`🪵 ${barrel.drink.recipe.name} has finished aging! Collect it!`, 'gold');
    }
  }
}

/**
 * Collect an aged drink from a barrel
 */
export function collectAgedDrink(barrelId) {
  if (!state.agingBarrels) return null;

  const barrelIndex = state.agingBarrels.findIndex(b => b.id === barrelId);
  if (barrelIndex === -1) return null;

  const barrel = state.agingBarrels[barrelIndex];
  if (!barrel.done) {
    const remaining = Math.ceil((barrel.startedAt + barrel.durationMs - Date.now()) / 60000);
    notify(`Not ready yet! ${remaining} minutes remaining.`);
    return null;
  }

  // Check if aging transforms the recipe (ferment_barrel / distill_barrel recipes)
  const originalRecipe = barrel.drink.recipe;
  const originalMethod = originalRecipe.method || 'ferment';

  // Try barrel-aged method variants
  let agedRecipe = null;
  const barrelMethod = originalMethod.includes('ferment') ? 'ferment_barrel' : 'distill_barrel';

  // Search for a barrel-aged recipe with same base + ingredients
  const barrelResult = matchRecipe(
    originalRecipe.base,
    originalRecipe.ingredients || [],
    barrelMethod
  );

  if (barrelResult.matchType === 'exact' && barrelResult.recipe) {
    agedRecipe = barrelResult.recipe;
    const isNew = !state.discoveredRecipes.has(agedRecipe.id);
    if (isNew) {
      state.discoveredRecipes.add(agedRecipe.id);
      notify(`📖 Barrel aging revealed: ${agedRecipe.name}!`, 'discovery');
    }
  } else {
    // No barrel recipe found — just upgrade the existing drink
    agedRecipe = {
      ...originalRecipe,
      name: `Aged ${originalRecipe.name}`,
      stars: Math.min(5, (originalRecipe.stars || 1) + 1),
      lore: `${originalRecipe.lore} Barrel-aged to perfection.`,
      sellPrice: Math.round((originalRecipe.sellPrice || 10) * 1.5),
    };
  }

  // Add to brewed drinks
  state.brewedDrinks.push({
    recipeId: agedRecipe.id || `aged_${originalRecipe.id}`,
    recipe: agedRecipe,
    brewedAt: Date.now(),
    aged: true,
  });

  // Remove barrel
  state.agingBarrels.splice(barrelIndex, 1);
  notify(`🪵 Collected: ${agedRecipe.name}!`);

  return agedRecipe;
}

/**
 * Get barrel status for UI
 */
export function getBarrelStatus() {
  if (!state.agingBarrels) return [];
  const now = Date.now();

  return state.agingBarrels.map(barrel => {
    const elapsed = now - barrel.startedAt;
    const progress = Math.min(1, elapsed / barrel.durationMs);
    const remainingMs = Math.max(0, barrel.durationMs - elapsed);

    return {
      id: barrel.id,
      drinkName: barrel.drink.recipe.name,
      drinkStars: barrel.drink.recipe.stars,
      progress,
      remainingMs,
      done: barrel.done,
    };
  });
}
