// ═══ BARREL AGING UI ═══
// Shows aging barrels, timers, collection buttons

import state from '../systems/state.js';
import { getBarrelStatus, getMaxBarrels, startAging, collectAgedDrink } from '../systems/barrel-aging.js';

let barrelPanel = null;

export function initBarrelUI() {
  barrelPanel = document.getElementById('barrel-panel');
}

export function openBarrelUI() {
  barrelPanel = document.getElementById('barrel-panel');
  if (!barrelPanel) return;
  barrelPanel.style.display = 'block';
  renderBarrels();
}

export function closeBarrelUI() {
  if (barrelPanel) barrelPanel.style.display = 'none';
}

export function renderBarrels() {
  if (!barrelPanel) return;

  const barrels = getBarrelStatus();
  const maxBarrels = getMaxBarrels();

  let html = `<h3>🪵 Barrel Rack (${barrels.length}/${maxBarrels})</h3>`;

  // Current barrels
  if (barrels.length === 0) {
    html += '<p class="barrel-empty">No drinks aging. Place a brewed drink in a barrel!</p>';
  }

  for (const barrel of barrels) {
    const stars = '★'.repeat(barrel.drinkStars) + '☆'.repeat(Math.max(0, 5 - barrel.drinkStars));
    html += `
      <div class="barrel-item ${barrel.done ? 'done' : 'aging'}">
        <div class="barrel-info">
          <span class="barrel-drink-name">${barrel.drinkName} ${stars}</span>
        </div>
        ${barrel.done
          ? `<button class="barrel-collect-btn" data-id="${barrel.id}">🍺 Collect!</button>`
          : `<div class="barrel-progress-bar"><div class="barrel-progress-fill" style="width:${barrel.progress * 100}%"></div></div>
             <span class="barrel-timer">${formatTime(barrel.remainingMs)}</span>`
        }
      </div>
    `;
  }

  // Place drink in barrel (if slots available and drinks exist)
  if (barrels.length < maxBarrels && state.brewedDrinks.length > 0) {
    html += '<div class="barrel-add-section">';
    html += '<div class="barrel-add-label">Place a drink to age:</div>';
    for (let i = 0; i < state.brewedDrinks.length; i++) {
      const drink = state.brewedDrinks[i];
      const stars = '★'.repeat(drink.recipe.stars) + '☆'.repeat(Math.max(0, 5 - drink.recipe.stars));
      html += `
        <button class="barrel-add-btn" data-index="${i}">
          🪵 Age: ${drink.recipe.name} ${stars}
        </button>
      `;
    }
    html += '</div>';
  }

  html += '<button class="barrel-close-btn">Close</button>';

  barrelPanel.innerHTML = html;

  // Collect handlers
  barrelPanel.querySelectorAll('.barrel-collect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      collectAgedDrink(parseFloat(btn.dataset.id));
      renderBarrels();
    });
  });

  // Add handlers
  barrelPanel.querySelectorAll('.barrel-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      startAging(parseInt(btn.dataset.index));
      renderBarrels();
    });
  });

  // Close
  barrelPanel.querySelector('.barrel-close-btn')?.addEventListener('click', () => {
    closeBarrelUI();
  });
}

function formatTime(ms) {
  if (ms <= 0) return 'Done!';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 60) {
    const hr = Math.floor(min / 60);
    const remMin = min % 60;
    return `${hr}h ${remMin}m`;
  }
  return `${min}m ${sec}s`;
}
