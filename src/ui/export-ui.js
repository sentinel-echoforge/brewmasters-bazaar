// ═══ EXPORT BOARD UI ═══
// Export drinks to other regions for premium prices

import state from '../systems/state.js';
import * as api from '../systems/api-client.js';
import { notify } from './notifications.js';
import { queueSave } from '../systems/multiplayer.js';

let panelEl = null;
let onCloseCallback = null;

export function initExportUI() {
  panelEl = document.createElement('div');
  panelEl.id = 'export-panel';
  panelEl.className = 'game-panel overlay-panel';
  panelEl.style.display = 'none';
  panelEl.innerHTML = `
    <div class="panel-header">
      <h2>🚢 Export Board</h2>
      <button id="export-close" class="close-btn">✕</button>
    </div>
    <div class="panel-tabs">
      <button class="tab-btn active" data-tab="export">Export Drink</button>
      <button class="tab-btn" data-tab="pending">Pending Exports</button>
    </div>
    <div id="export-content" class="panel-content"></div>
  `;
  document.body.appendChild(panelEl);

  panelEl.querySelector('#export-close').addEventListener('click', closeExport);
  panelEl.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      panelEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderTab(e.target.dataset.tab);
    });
  });
}

export function openExport(onClose) {
  onCloseCallback = onClose;
  panelEl.style.display = 'block';
  renderTab('export');
}

export function closeExport() {
  panelEl.style.display = 'none';
  if (onCloseCallback) onCloseCallback();
}

async function renderTab(tab) {
  const content = panelEl.querySelector('#export-content');
  content.innerHTML = '<div class="loading">Loading...</div>';

  if (tab === 'export') await renderExportForm(content);
  else if (tab === 'pending') await renderPending(content);
}

async function renderExportForm(container) {
  const drinks = state.brewedDrinks || [];
  const regions = state.regions || [];
  const playerRegion = state.region || 'americas_us';

  if (drinks.length === 0) {
    container.innerHTML = '<div class="empty-state">No drinks to export. Brew something first!</div>';
    return;
  }

  container.innerHTML = `
    <div class="export-form">
      <div class="export-section">
        <h3>Select Drink</h3>
        <select id="export-drink-select">
          ${drinks.map((d, i) => `<option value="${i}">${'⭐'.repeat(d.recipe.stars)} ${d.recipe.name}</option>`).join('')}
        </select>
      </div>
      <div class="export-section">
        <h3>Select Destination</h3>
        <div class="export-regions" id="export-regions">
          ${regions.filter(r => r.id !== playerRegion).map(r => `
            <button class="region-btn" data-region="${r.id}">
              ${r.emoji} ${r.name}
            </button>
          `).join('')}
        </div>
      </div>
      <div id="export-preview" class="export-preview" style="display:none">
        <div id="export-details"></div>
        <button id="export-confirm" class="action-btn">Confirm Export</button>
      </div>
      <div class="export-legend">
        <p>📏 Distance bonus: further = more profit</p>
        <p>💎 Scarcity bonus: rare drinks = more profit</p>
        <p>⚠️ Long distance = spoilage risk</p>
        <p>⏰ Delivery takes real time — you get paid when it arrives</p>
      </div>
    </div>
  `;

  let selectedRegion = null;
  let selectedDrinkIndex = 0;

  const drinkSelect = container.querySelector('#export-drink-select');
  drinkSelect.addEventListener('change', () => {
    selectedDrinkIndex = parseInt(drinkSelect.value);
    if (selectedRegion) showPreview();
  });

  container.querySelectorAll('.region-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.region-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedRegion = btn.dataset.region;
      showPreview();
    });
  });

  function showPreview() {
    const drink = drinks[selectedDrinkIndex];
    if (!drink || !selectedRegion) return;

    const preview = container.querySelector('#export-preview');
    const details = container.querySelector('#export-details');
    const region = regions.find(r => r.id === selectedRegion);

    // Estimate from local data (server will calculate actual)
    const basePrice = drink.recipe.sellPrice || (drink.recipe.stars * 30) || 10;

    details.innerHTML = `
      <div class="preview-row">
        <span>Drink:</span> <strong>${'⭐'.repeat(drink.recipe.stars)} ${drink.recipe.name}</strong>
      </div>
      <div class="preview-row">
        <span>Destination:</span> <strong>${region?.emoji} ${region?.name}</strong>
      </div>
      <div class="preview-row info">
        <em>Final price calculated by server based on distance + scarcity</em>
      </div>
    `;
    preview.style.display = 'block';
  }

  container.querySelector('#export-confirm')?.addEventListener('click', async () => {
    const drink = drinks[selectedDrinkIndex];
    if (!drink || !selectedRegion) {
      notify('Select a drink and destination!');
      return;
    }

    const result = await api.exportDrink(drink.recipeId, selectedRegion);
    if (result.error) {
      notify(`❌ ${result.error}`);
      return;
    }

    notify(`🚢 Exported! Est. ${result.exportPrice}c arriving in ${result.deliveryMinutes} min${result.spoilageChance > 0 ? ` (${Math.round(result.spoilageChance * 100)}% spoilage risk)` : ''}`);

    // Remove drink from local inventory
    state.brewedDrinks.splice(selectedDrinkIndex, 1);
    queueSave();
    renderTab('export');
  });
}

async function renderPending(container) {
  const data = await api.getExports();
  if (data.error) {
    container.innerHTML = `<div class="empty-state">⚠️ ${data.error}</div>`;
    return;
  }

  const pending = data.pending || [];
  const resolved = data.resolved || [];

  let html = '<h3>In Transit</h3>';
  if (pending.length === 0) {
    html += '<div class="empty-state">No pending exports</div>';
  } else {
    html += pending.map(e => {
      const deliverTime = new Date(e.delivers_at);
      const remaining = Math.max(0, Math.ceil((deliverTime.getTime() - Date.now()) / 60000));
      const region = (state.regions || []).find(r => r.id === e.target_region);
      return `
        <div class="export-item pending">
          <span>🍶 ${e.recipe_id.replace(/_/g, ' ')} → ${region?.emoji || ''} ${region?.name || e.target_region}</span>
          <span class="export-price">${e.price}c</span>
          <span class="export-timer">⏰ ${remaining} min</span>
          ${e.spoilage_chance > 0 ? `<span class="export-risk">⚠️ ${Math.round(e.spoilage_chance * 100)}% risk</span>` : ''}
        </div>
      `;
    }).join('');
  }

  html += '<h3>Recent Deliveries</h3>';
  if (resolved.length === 0) {
    html += '<div class="empty-state">No deliveries yet</div>';
  } else {
    html += resolved.slice(0, 10).map(e => {
      const region = (state.regions || []).find(r => r.id === e.target_region);
      return `
        <div class="export-item resolved">
          <span>🍶 ${e.recipe_id.replace(/_/g, ' ')} → ${region?.emoji || ''} ${region?.name || e.target_region}</span>
          <span class="export-price">${e.price}c ✅</span>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = html;
}
