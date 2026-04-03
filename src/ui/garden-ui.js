// ═══ GARDEN UI ═══
// Shows garden plots, growth progress, harvest buttons

import state from '../systems/state.js';
import { getGardenPlots, harvestGardenPlot } from '../systems/garden.js';

let gardenPanel = null;

export function initGardenUI() {
  gardenPanel = document.getElementById('garden-panel');
}

export function openGardenUI() {
  gardenPanel = document.getElementById('garden-panel');
  if (!gardenPanel) return;
  gardenPanel.style.display = 'block';
  renderGarden();
}

export function closeGardenUI() {
  if (gardenPanel) gardenPanel.style.display = 'none';
}

export function renderGarden() {
  if (!gardenPanel) return;

  const plots = getGardenPlots();

  let html = '<h3>🌱 Garden</h3>';

  if (plots.length === 0) {
    html += '<p class="garden-empty">No plants yet. Buy seeds from Omar!</p>';
  }

  // Wild plants
  const wildPlots = plots.filter(p => p.type === 'wild');
  if (wildPlots.length > 0) {
    html += '<div class="garden-section-label">🌿 Wild Patches (regional)</div>';
    for (const plot of wildPlots) {
      const name = plot.ingredient ? `${plot.ingredient.emoji} ${plot.ingredient.name}` : plot.ingredientId;
      html += `
        <div class="garden-plot ${plot.ready ? 'ready' : 'growing'}">
          <span class="garden-plant-name">${name}</span>
          ${plot.ready
            ? `<button class="garden-harvest-btn" data-index="${plot.index}">🌿 Harvest</button>`
            : `<div class="garden-progress-bar"><div class="garden-progress-fill" style="width:${plot.progress * 100}%"></div></div>
               <span class="garden-timer">${formatTime(plot.remainingMs)}</span>`
          }
        </div>
      `;
    }
  }

  // Planted plots
  const plantedPlots = plots.filter(p => p.type === 'planted');
  if (plantedPlots.length > 0) {
    html += '<div class="garden-section-label">🌱 Planted Seeds</div>';
    for (const plot of plantedPlots) {
      const name = plot.ingredient ? `${plot.ingredient.emoji} ${plot.ingredient.name}` : plot.ingredientId;
      const harvests = plot.harvestsRemaining === Infinity ? '∞' : plot.harvestsRemaining;
      html += `
        <div class="garden-plot ${plot.ready ? 'ready' : 'growing'}">
          <span class="garden-plant-name">${name}</span>
          <span class="garden-harvests">${harvests} harvests left</span>
          ${plot.ready
            ? `<button class="garden-harvest-btn" data-index="${plot.index}">🌿 Harvest</button>`
            : `<div class="garden-progress-bar"><div class="garden-progress-fill" style="width:${plot.progress * 100}%"></div></div>
               <span class="garden-timer">${formatTime(plot.remainingMs)}</span>`
          }
        </div>
      `;
    }
  }

  html += '<button class="garden-close-btn">Back to Cart</button>';

  gardenPanel.innerHTML = html;

  // Harvest handlers
  gardenPanel.querySelectorAll('.garden-harvest-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      harvestGardenPlot(index);
      renderGarden();
    });
  });

  // Close
  gardenPanel.querySelector('.garden-close-btn')?.addEventListener('click', () => {
    closeGardenUI();
  });
}

function formatTime(ms) {
  if (ms <= 0) return 'Ready!';
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
