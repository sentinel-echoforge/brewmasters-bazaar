// ═══ GAME STATE ═══
// Central game state — all modules read/write here

const state = {
  // Player
  playerName: '',
  cartName: '',
  crowns: 0,
  reputation: 0,
  
  // Brewing
  selectedBase: null,      // 'grain'|'honey'|'fruit'|'none'
  cauldronSlots: [],       // ingredient IDs in cauldron (max 2 at level 1)
  selectedMethod: null,    // 'boil'|'ferment'|'distill'
  isBrewing: false,
  lastBrewResult: null,    // { recipe, isNew, nearMiss }
  brewedDrinks: [],        // inventory of brewed drinks [{ recipeId, recipe }]
  
  // Discovery
  discoveredRecipes: new Set(),  // recipe IDs
  recipeAttempts: {},      // { ingredientCombo: attemptCount } for near-miss tracking
  
  // Customers
  customerQueue: [],       // active customer objects
  lastCustomerSpawn: 0,
  servedCount: 0,
  
  // Streaks
  perfectServes: 0,
  hotStreakActive: false,
  hotStreakEnd: 0,
  comboMultiplier: 1.0,
  
  // Game data (loaded from JSON)
  ingredients: [],
  recipes: [],
  customers: [],
  bases: [],
  gameConfig: null,
  
  // Progression
  breweryLevel: 1,
  maxFlavorSlots: 2,
  
  // Available starter ingredients (tier 1 + 2 basics)
  availableIngredients: new Set(),
  
  // Scene
  scene: null,
  camera: null,
  renderer: null,
  cauldronMesh: null,
};

export default state;
