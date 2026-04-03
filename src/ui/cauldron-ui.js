// ═══ CAULDRON UI ═══

import state from '../systems/state.js';
import { getBrewCost } from '../systems/brewing.js';

const cauldronEl = document.getElementById('cauldron-panel');
let onBrew = null;
let onBaseSelect = null;
let onMethodSelect = null;
let onSlotRemove = null;

export function setCauldronHandlers(handlers) {
  onBrew = handlers.onBrew;
  onBaseSelect = handlers.onBaseSelect;
  onMethodSelect = handlers.onMethodSelect;
  onSlotRemove = handlers.onSlotRemove;
}

export function showCauldron() {
  cauldronEl.style.display = 'block';
  renderCauldron();
}

export function renderCauldron() {
  const bases = state.bases;
  const maxSlots = state.maxFlavorSlots;
  
  let html = '<h3>🔮 Cauldron</h3>';
  
  // Base selector
  html += '<div class="base-selector">';
  for (const base of bases) {
    const selected = state.selectedBase === base.id ? 'selected' : '';
    html += `<button class="base-btn ${selected}" data-base="${base.id}">${base.emoji} ${base.name}</button>`;
  }
  html += '</div>';
  
  // Ingredient slots
  html += '<div class="ingredient-slots">';
  for (let i = 0; i < maxSlots; i++) {
    const ingId = state.cauldronSlots[i];
    if (ingId) {
      const ing = state.ingredients.find(ii => ii.id === ingId);
      html += `
        <div class="ingredient-slot filled" data-slot="${i}">
          ${ing ? `${ing.emoji} ${ing.name}` : ingId}
          <button class="remove-btn" data-slot="${i}">×</button>
        </div>
      `;
    } else {
      html += `<div class="ingredient-slot" data-slot="${i}">Slot ${i + 1}</div>`;
    }
  }
  html += '</div>';
  
  // Method selector
  html += '<div class="method-selector">';
  const methods = [
    { id: 'boil', emoji: '🔥', label: 'Boil', time: state.gameConfig?.brewing?.brewTimeSeconds?.boil || 5 },
    { id: 'ferment', emoji: '🫧', label: 'Ferment', time: state.gameConfig?.brewing?.brewTimeSeconds?.ferment || 10 },
    { id: 'distill', emoji: '💨', label: 'Distill', time: state.gameConfig?.brewing?.brewTimeSeconds?.distill || 15 },
  ];
  for (const m of methods) {
    const selected = state.selectedMethod === m.id ? 'selected' : '';
    html += `<button class="method-btn ${selected}" data-method="${m.id}">${m.emoji} ${m.label} (${m.time}s)</button>`;
  }
  html += '</div>';
  
  // Brew cost + button
  const cost = getBrewCost();
  const canBrew = state.selectedBase && state.selectedMethod && !state.isBrewing;
  html += `<div id="brew-cost">${cost > 0 ? `Cost: ${cost} crowns` : 'Free brew!'}</div>`;
  html += `<button id="brew-btn" ${canBrew ? '' : 'disabled'}>🍺 BREW!</button>`;
  
  cauldronEl.innerHTML = html;
  
  // Event listeners
  cauldronEl.querySelectorAll('.base-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (onBaseSelect) onBaseSelect(btn.dataset.base);
    });
  });
  
  cauldronEl.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (onMethodSelect) onMethodSelect(btn.dataset.method);
    });
  });
  
  cauldronEl.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onSlotRemove) onSlotRemove(parseInt(btn.dataset.slot));
    });
  });
  
  const brewBtn = cauldronEl.querySelector('#brew-btn');
  if (brewBtn) {
    brewBtn.addEventListener('click', () => {
      if (onBrew) onBrew();
    });
  }
}
