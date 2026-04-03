// ═══ CART PROGRESSION SYSTEM ═══
// Level requirements, upgrades, equipment

import state from './state.js';
import { notify } from '../ui/notifications.js';

/**
 * Check if player can level up their cart
 */
export function canLevelUp() {
  const cfg = state.gameConfig?.progression?.levels;
  if (!cfg) return { can: false, reason: 'No config' };

  const nextLevel = (state.breweryLevel || 1) + 1;
  const levelReqs = cfg[nextLevel.toString()];
  if (!levelReqs) return { can: false, reason: 'Max level reached!' };

  const reasons = [];

  if (state.crowns < levelReqs.cost) {
    reasons.push(`Need ${levelReqs.cost} crowns (have ${state.crowns})`);
  }
  if (state.discoveredRecipes.size < levelReqs.recipesRequired) {
    reasons.push(`Need ${levelReqs.recipesRequired} recipes (have ${state.discoveredRecipes.size})`);
  }
  if (state.servedCount < (levelReqs.customersRequired || 0)) {
    reasons.push(`Need ${levelReqs.customersRequired} customers served (have ${state.servedCount})`);
  }

  return {
    can: reasons.length === 0,
    reason: reasons.join(', '),
    nextLevel,
    requirements: levelReqs,
  };
}

/**
 * Level up the cart
 */
export function levelUp() {
  const check = canLevelUp();
  if (!check.can) {
    notify(check.reason);
    return false;
  }

  const reqs = check.requirements;
  state.crowns -= reqs.cost;
  state.breweryLevel = check.nextLevel;

  // Update flavor slots — Level 3 unlocks 3rd slot!
  if (state.breweryLevel >= 3) {
    state.maxFlavorSlots = state.gameConfig?.brewing?.flavorSlotsLevel3 || 3;
  } else {
    state.maxFlavorSlots = state.gameConfig?.brewing?.flavorSlotsLevel1 || 2;
  }

  notify(`🎉 Cart upgraded to Level ${state.breweryLevel}: ${reqs.name}!`, 'gold');
  return true;
}

/**
 * Get cart level info
 */
export function getCartInfo() {
  const cfg = state.gameConfig?.progression?.levels;
  if (!cfg) return null;

  const currentCfg = cfg[(state.breweryLevel || 1).toString()];
  const nextCfg = cfg[((state.breweryLevel || 1) + 1).toString()];

  return {
    level: state.breweryLevel || 1,
    name: currentCfg?.name || 'Handcart',
    nextLevel: nextCfg ? {
      level: (state.breweryLevel || 1) + 1,
      name: nextCfg.name,
      cost: nextCfg.cost,
      recipesRequired: nextCfg.recipesRequired,
      customersRequired: nextCfg.customersRequired || 0,
    } : null,
  };
}

/**
 * Get available equipment upgrades
 */
export function getAvailableEquipment() {
  if (!state.equipment) state.equipment = [];
  const equipData = state.equipmentData || [];

  return equipData
    .filter(e => e.requiredLevel <= (state.breweryLevel || 1))
    .map(e => ({
      ...e,
      owned: state.equipment.includes(e.id),
      canAfford: state.crowns >= e.cost,
    }));
}

/**
 * Buy an equipment upgrade
 */
export function buyEquipment(equipId) {
  if (!state.equipment) state.equipment = [];
  const equipData = state.equipmentData || [];
  const equip = equipData.find(e => e.id === equipId);

  if (!equip) {
    notify('Equipment not found!');
    return false;
  }

  if (state.equipment.includes(equipId)) {
    notify('Already owned!');
    return false;
  }

  if (equip.requiredLevel > (state.breweryLevel || 1)) {
    notify(`Requires cart level ${equip.requiredLevel}!`);
    return false;
  }

  if (state.crowns < equip.cost) {
    notify(`Need ${equip.cost} crowns! You have ${state.crowns}.`, 'gold');
    return false;
  }

  state.crowns -= equip.cost;
  state.equipment.push(equipId);

  // Apply equipment effects
  applyEquipmentEffect(equip);

  notify(`⚒️ Purchased ${equip.emoji} ${equip.name}!`, 'gold');
  return true;
}

/**
 * Apply an equipment effect
 */
function applyEquipmentEffect(equip) {
  switch (equip.effect) {
    case 'brew_speed':
      state.brewSpeedMultiplier = equip.value;
      break;
    case 'barrel_slots':
      // Handled by barrel system reading equipment
      break;
    case 'serve_slots':
      state.maxServeSlots = equip.value;
      break;
    case 'sale_price':
      state.salePriceMultiplier = equip.value;
      break;
    case 'hint_quality':
      state.hintQualityLevel = equip.value;
      break;
    case 'ingredient_lifespan':
      state.ingredientLifespanMultiplier = equip.value;
      break;
    case 'experiment_discount':
      state.experimentDiscount = equip.value;
      break;
    case 'merchant_discount':
      state.merchantDiscount = equip.value;
      break;
  }
}

/**
 * Reapply all owned equipment effects (e.g. on load)
 */
export function reapplyEquipmentEffects() {
  if (!state.equipment) return;
  const equipData = state.equipmentData || [];
  for (const id of state.equipment) {
    const equip = equipData.find(e => e.id === id);
    if (equip) applyEquipmentEffect(equip);
  }
}
