// ═══ BREW RESULT OVERLAY ═══

import state from '../systems/state.js';

const resultOverlay = document.getElementById('result-overlay');
const resultName = document.getElementById('result-name');
const resultStars = document.getElementById('result-stars');
const resultDiscovery = document.getElementById('result-discovery');
const resultLore = document.getElementById('result-lore');
const resultNearMiss = document.getElementById('result-nearmiss');
const resultDismiss = document.getElementById('result-dismiss');

let dismissCallback = null;

export function initResult() {
  resultDismiss.addEventListener('click', () => {
    resultOverlay.style.display = 'none';
    if (dismissCallback) dismissCallback();
  });
  resultOverlay.addEventListener('click', (e) => {
    if (e.target === resultOverlay) {
      resultOverlay.style.display = 'none';
      if (dismissCallback) dismissCallback();
    }
  });
}

export function showResult(brewResult, onDismiss) {
  dismissCallback = onDismiss || null;
  
  if (brewResult.nearMiss) {
    // Near miss — no recipe produced
    resultName.textContent = '🔮 Almost...';
    resultStars.textContent = '';
    resultDiscovery.textContent = '';
    resultLore.textContent = '';
    resultNearMiss.textContent = brewResult.hintMessage || "This is CLOSE to something special...";
  } else if (brewResult.recipe) {
    const recipe = brewResult.recipe;
    resultName.textContent = recipe.name;
    resultStars.textContent = '★'.repeat(recipe.stars) + '☆'.repeat(Math.max(0, 5 - recipe.stars));
    resultLore.textContent = recipe.lore || '';
    resultNearMiss.textContent = '';
    
    if (brewResult.isNew) {
      resultDiscovery.textContent = '📖 NEW RECIPE DISCOVERED!';
    } else if (recipe.id === 'mystery_slop') {
      resultDiscovery.textContent = '';
    } else {
      resultDiscovery.textContent = '';
    }
  }
  
  resultOverlay.style.display = 'flex';
}
