// ═══ COMMISSION UI ═══
// Royal Commission progress tracker

import state from '../systems/state.js';
import * as api from '../systems/api-client.js';
import { notify } from './notifications.js';
import { queueSave } from '../systems/multiplayer.js';

let panelEl = null;
let onCloseCallback = null;

export function initCommissionUI() {
  panelEl = document.createElement('div');
  panelEl.id = 'commission-panel';
  panelEl.className = 'game-panel overlay-panel';
  panelEl.style.display = 'none';
  panelEl.innerHTML = `
    <div class="panel-header">
      <h2>👑 Royal Commission</h2>
      <button id="commission-close" class="close-btn">✕</button>
    </div>
    <div id="commission-content" class="panel-content"></div>
  `;
  document.body.appendChild(panelEl);

  panelEl.querySelector('#commission-close').addEventListener('click', closeCommission);
}

export function openCommission(onClose) {
  onCloseCallback = onClose;
  panelEl.style.display = 'block';
  renderCommission();
}

export function closeCommission() {
  panelEl.style.display = 'none';
  if (onCloseCallback) onCloseCallback();
}

async function renderCommission() {
  const content = panelEl.querySelector('#commission-content');
  content.innerHTML = '<div class="loading">Loading...</div>';

  const data = await api.getCommission();
  if (data.error) {
    content.innerHTML = `<div class="empty-state">⚠️ ${data.error}</div>`;
    return;
  }

  const commission = data.commission;
  if (!commission || !commission.definition) {
    content.innerHTML = '<div class="empty-state">No active commission. Check back later!</div>';
    return;
  }

  const def = commission.definition;
  const playerId = api.getPlayerId();
  const playerProgress = commission.progress?.[playerId] || { count: 0, completed: false };
  const targetCount = def.target?.count || 1;
  const progress = Math.min(playerProgress.count / targetCount, 1);
  const endsAt = new Date(commission.endsAt);
  const remainingMin = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 60000));

  let html = `
    <div class="commission-detail">
      <div class="commission-name">
        <h3>${def.name}</h3>
        <span class="commission-timer">⏰ ${remainingMin} min remaining</span>
      </div>
      <p class="commission-desc">${def.description}</p>
      <div class="commission-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress * 100}%"></div>
        </div>
        <span class="progress-text">${playerProgress.count} / ${targetCount}</span>
      </div>
      <div class="commission-reward">
        <span>🏆 Reward: ${def.reward}c</span>
        ${playerProgress.completed ? '<span class="completed-badge">✅ COMPLETED!</span>' : ''}
      </div>
  `;

  // Submit form if not completed
  if (!playerProgress.completed) {
    const drinks = state.brewedDrinks || [];
    if (drinks.length > 0) {
      html += `
        <div class="commission-submit">
          <h4>Submit drinks:</h4>
          <div class="submit-drinks">
            ${drinks.map((d, i) => `
              <label class="submit-drink-option">
                <input type="checkbox" class="submit-check" value="${d.recipeId}" data-index="${i}">
                ${'⭐'.repeat(d.recipe.stars)} ${d.recipe.name}
              </label>
            `).join('')}
          </div>
          <button id="commission-submit-btn" class="action-btn">Submit Selected</button>
        </div>
      `;
    } else {
      html += '<p class="info-text">Brew drinks that match the commission requirements, then come back to submit!</p>';
    }
  }

  html += '</div>';
  content.innerHTML = html;

  // Submit handler
  const submitBtn = content.querySelector('#commission-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const checked = content.querySelectorAll('.submit-check:checked');
      const recipeIds = [...checked].map(c => c.value);

      if (recipeIds.length === 0) {
        notify('Select drinks to submit!');
        return;
      }

      const result = await api.submitCommission(recipeIds);
      if (result.error) {
        notify(`❌ ${result.error}`);
      } else {
        notify(`✅ Submitted ${result.validCount} valid drinks! (${result.totalProgress}/${result.target})`);
        if (result.completed) {
          notify(`🏆 Commission COMPLETED! +${result.reward}c!`, 'gold');
          state.crowns += result.reward;
        }
        // Remove submitted drinks from local inventory
        const indices = [...checked].map(c => parseInt(c.dataset.index)).sort((a, b) => b - a);
        for (const idx of indices) {
          state.brewedDrinks.splice(idx, 1);
        }
        queueSave();
        renderCommission();
      }
    });
  }
}
