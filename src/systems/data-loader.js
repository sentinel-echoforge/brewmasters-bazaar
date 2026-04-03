// ═══ DATA LOADER ═══
// Load all JSON game data

import state from './state.js';

export async function loadGameData() {
  const [ingredients, recipes, customers, bases, gameConfig] = await Promise.all([
    fetch('/data/ingredients.json').then(r => r.json()),
    fetch('/data/recipes.json').then(r => r.json()),
    fetch('/data/customers.json').then(r => r.json()),
    fetch('/data/bases.json').then(r => r.json()),
    fetch('/data/game-config.json').then(r => r.json()),
  ]);
  
  state.ingredients = ingredients;
  state.recipes = recipes;
  state.customers = customers;
  state.bases = bases;
  state.gameConfig = gameConfig;
  state.crowns = gameConfig.economy.startingGold;
  
  // Set starter ingredients: tier 1 + basic tier 2
  const starterIds = new Set();
  for (const ing of ingredients) {
    if (ing.tier === 1) starterIds.add(ing.id);
    // A few tier 2 starters from the GDD
    if (['berries', 'chamomile', 'citrus_peel'].includes(ing.id)) starterIds.add(ing.id);
  }
  state.availableIngredients = starterIds;
  
  console.log(`📦 Loaded: ${ingredients.length} ingredients, ${recipes.length} recipes, ${customers.length} customer types`);
}
