// ═══ INGREDIENT SHELF UI ═══

import state from '../systems/state.js';

const shelfEl = document.getElementById('shelf-panel');
let onIngredientClick = null;

export function setIngredientClickHandler(handler) {
  onIngredientClick = handler;
}

export function showShelf() {
  shelfEl.style.display = 'block';
  renderShelf();
}

export function renderShelf() {
  const available = state.ingredients.filter(i => state.availableIngredients.has(i.id));
  
  // Group by tier
  const tiers = {};
  for (const ing of available) {
    const tier = ing.tier;
    if (!tiers[tier]) tiers[tier] = [];
    tiers[tier].push(ing);
  }
  
  const tierNames = { 1: 'Pantry Staples', 2: 'Garden', 3: 'Forest Floor', 4: 'Spice Merchant', 5: 'Exotic', 99: 'Legendary' };
  const tierCosts = { 1: 0, 2: 2, 3: 6, 4: 15, 5: 35, 99: 0 };
  
  let html = '<h3>🫙 Ingredients</h3>';
  
  for (const tier of Object.keys(tiers).sort((a, b) => a - b)) {
    html += `<div class="shelf-tier-label">${tierNames[tier] || `Tier ${tier}`}</div>`;
    for (const ing of tiers[tier]) {
      const inCauldron = state.cauldronSlots.includes(ing.id);
      const cost = tierCosts[ing.tier] || 0;
      html += `
        <button class="ingredient-btn ${inCauldron ? 'disabled' : ''}" 
                data-id="${ing.id}" 
                ${inCauldron ? 'disabled' : ''}
                title="${ing.description}">
          <span>${ing.emoji}</span>
          <span>${ing.name}</span>
          ${cost > 0 ? `<span class="cost">${cost}c</span>` : ''}
        </button>
      `;
    }
  }
  
  shelfEl.innerHTML = html;
  
  // Attach click handlers
  shelfEl.querySelectorAll('.ingredient-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (onIngredientClick) onIngredientClick(id);
    });
  });
}
