// ═══ CUSTOMER SYSTEM ═══
// NPC customer spawning, preference matching, serving

import state from './state.js';
import { notify } from '../ui/notifications.js';

const SPEECH_BUBBLES = {
  peasant: ["Anything to drink, please!", "What's cheap today?", "I'll have whatever ya got."],
  traveler: ["Something refreshing, please!", "I've been on the road for days...", "Something light and fruity?"],
  soldier: ["Something STRONG!", "I need a real drink.", "What's your most potent brew?"],
  noble: ["Surprise me with your finest.", "I expect excellence.", "Show me what you can do."],
  royal_taster: ["The King sends me.", "I require your very best.", "Only legendary brews will do."],
  scholar: ["What have you discovered lately?", "Something complex, if you please.", "I seek depth of flavor."],
  alchemist: ["Show me something strange!", "Surprise me.", "I crave the unexpected."],
  dreamer: ["Something magical...", "Something that feels like a dream.", "Something ethereal?"],
  warrior: ["Test my mettle!", "Give me your hottest brew!", "I dare you to challenge me."],
  healer: ["Something restorative, please.", "A healing tonic?", "Something gentle and nourishing."],
};

/**
 * Spawn a customer based on current brewery level
 */
export function spawnCustomer() {
  if (!state.gameConfig) return;
  
  const maxQueue = state.gameConfig.customers.maxQueueSize || 3;
  if (state.customerQueue.length >= maxQueue) return;
  
  // Weight customer types by level
  const weights = getCustomerWeights();
  const type = weightedRandom(weights);
  const customerData = state.customers.find(c => c.id === type);
  if (!customerData) return;
  
  const speeches = SPEECH_BUBBLES[type] || ["I'd like a drink, please."];
  
  const customer = {
    id: Date.now() + Math.random(),
    type: customerData.id,
    data: customerData,
    speech: speeches[Math.floor(Math.random() * speeches.length)],
    spawnTime: Date.now(),
    patience: customerData.patience * 1000, // convert to ms
    served: false,
    reaction: null,
  };
  
  state.customerQueue.push(customer);
  return customer;
}

/**
 * Get spawn interval based on brewery level
 */
export function getSpawnInterval() {
  const cfg = state.gameConfig?.customers?.arrivalIntervalSeconds || {};
  const level = state.breweryLevel;
  const key = `level${Math.min(level, 5)}`;
  return (cfg[key] || 30) * 1000;
}

/**
 * Get customer type weights based on brewery level
 */
function getCustomerWeights() {
  const level = state.breweryLevel;
  // Higher levels get better customers
  const weights = {
    peasant: Math.max(5 - level, 1),
    traveler: 3,
    healer: 2,
  };
  if (level >= 1) { weights.scholar = 2; weights.dreamer = 2; }
  if (level >= 2) { weights.soldier = 3; weights.warrior = 2; weights.alchemist = 1; }
  if (level >= 3) { weights.noble = 2; }
  if (level >= 4) { weights.royal_taster = 1; }
  return weights;
}

function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [type, weight] of entries) {
    r -= weight;
    if (r <= 0) return type;
  }
  return entries[0][0];
}

/**
 * Check if a brewed drink matches customer preferences
 * Returns { quality: 'perfect'|'good'|'bad', multiplier }
 */
export function matchDrinkToCustomer(drink, customer) {
  const recipe = drink.recipe;
  const prefs = customer.data.preferences || [];
  const dislikes = customer.data.dislikes || [];
  
  if (!recipe || recipe.id === 'mystery_slop') {
    return { quality: 'bad', multiplier: 0.3 };
  }
  
  // Get all tags from the drink's ingredients + recipe tier
  const drinkTags = new Set();
  drinkTags.add(recipe.tier); // 'common', 'fine', 'rare', 'legendary'
  
  // Add ingredient tags
  for (const ingId of (recipe.ingredients || [])) {
    const ing = state.ingredients.find(i => i.id === ingId);
    if (ing) ing.tags.forEach(t => drinkTags.add(t));
  }
  
  // Add base tags
  const base = state.bases.find(b => b.id === recipe.base);
  if (base) base.tags.forEach(t => drinkTags.add(t));
  
  // Add star-based tags
  if (recipe.stars >= 5) drinkTags.add('legendary');
  if (recipe.stars >= 4) { drinkTags.add('rare'); drinkTags.add('complex'); }
  if (recipe.stars >= 3) drinkTags.add('elegant');
  
  // Calculate preference match
  let prefScore = 0;
  let dislikeScore = 0;
  
  for (const pref of prefs) {
    if (drinkTags.has(pref)) prefScore++;
  }
  for (const dis of dislikes) {
    if (drinkTags.has(dis)) dislikeScore++;
  }
  
  // Strong preference match
  if (prefScore >= 2 && dislikeScore === 0) {
    return { quality: 'perfect', multiplier: 1.5 };
  }
  if (prefScore >= 1 && dislikeScore === 0) {
    return { quality: 'good', multiplier: 1.0 };
  }
  if (dislikeScore >= 2) {
    return { quality: 'bad', multiplier: 0.3 };
  }
  
  return { quality: 'good', multiplier: 0.7 };
}

/**
 * Serve a drink to a customer, returns payment info
 */
export function serveDrink(customerId, drinkIndex) {
  const customer = state.customerQueue.find(c => c.id === customerId);
  if (!customer || customer.served) return null;
  
  const drink = state.brewedDrinks[drinkIndex];
  if (!drink) return null;
  
  const match = matchDrinkToCustomer(drink, customer);
  
  // Calculate payment
  const recipe = drink.recipe;
  const starPrices = { 0: 1, 1: 10, 2: 25, 3: 55, 4: 100, 5: 200 };
  const basePrice = starPrices[recipe.stars] || 1;
  
  const customerMultiplier = parseFloat(customer.data.tipMultiplier) || 1.0;
  
  // Freshness bonus: brewed in last 30 seconds
  const freshness = (Date.now() - drink.brewedAt < 30000) ? 
    (state.gameConfig?.customers?.freshnessBonus || 1.2) : 1.0;
  
  // Hot streak
  const streakBonus = state.hotStreakActive ? 
    (state.gameConfig?.customers?.hotStreakMultiplier || 2.0) : 1.0;
  
  let payment = Math.round(basePrice * match.multiplier * customerMultiplier * freshness * streakBonus);
  payment = Math.max(payment, 1);
  
  // Apply payment
  state.crowns += payment;
  
  // Reputation
  if (match.quality === 'perfect') {
    state.reputation += 2;
    state.perfectServes++;
  } else if (match.quality === 'good') {
    state.reputation += 1;
    state.perfectServes = Math.max(0, state.perfectServes); // don't reset on good
  } else {
    state.reputation = Math.max(0, state.reputation - 1);
    state.perfectServes = 0;
    state.comboMultiplier = 1.0;
  }
  
  // Hot streak check
  const streakThreshold = state.gameConfig?.customers?.hotStreakThreshold || 3;
  if (state.perfectServes >= streakThreshold && !state.hotStreakActive) {
    state.hotStreakActive = true;
    state.hotStreakEnd = Date.now() + 30000; // 30 seconds
    notify('🔥 Hot Streak! 2x gold for 30 seconds!', 'streak');
  }
  
  // Mark customer as served
  customer.served = true;
  customer.reaction = match.quality;
  state.servedCount++;
  
  // Remove drink from inventory
  state.brewedDrinks.splice(drinkIndex, 0);
  // Actually remove the drink
  state.brewedDrinks.splice(drinkIndex, 1);
  
  return {
    payment,
    quality: match.quality,
    customer,
    reaction: getReactionEmoji(match.quality),
    dialogue: customer.data.dialogue[match.quality === 'perfect' ? 'happy' : match.quality === 'good' ? 'neutral' : 'unhappy'],
  };
}

function getReactionEmoji(quality) {
  if (quality === 'perfect') return ['😍', '🤩', '❤️', '✨'][Math.floor(Math.random() * 4)];
  if (quality === 'good') return ['😊', '👍', '😐'][Math.floor(Math.random() * 3)];
  return ['🤢', '😤', '💀'][Math.floor(Math.random() * 3)];
}

/**
 * Update customer queue (remove expired/served)
 */
export function updateCustomers() {
  const now = Date.now();
  
  // Check hot streak expiry
  if (state.hotStreakActive && now > state.hotStreakEnd) {
    state.hotStreakActive = false;
    state.perfectServes = 0;
  }
  
  // Remove expired or served customers (with delay for served)
  state.customerQueue = state.customerQueue.filter(c => {
    if (c.served) return (now - c.spawnTime) < (c.patience + 2000); // keep briefly after serve
    return (now - c.spawnTime) < c.patience;
  });
}
