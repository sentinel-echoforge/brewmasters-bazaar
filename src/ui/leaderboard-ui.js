// ═══ LEADERBOARD UI ═══
// Weekly season rankings

import state from '../systems/state.js';
import * as api from '../systems/api-client.js';

let panelEl = null;
let onCloseCallback = null;

export function initLeaderboardUI() {
  panelEl = document.createElement('div');
  panelEl.id = 'leaderboard-panel';
  panelEl.className = 'game-panel overlay-panel';
  panelEl.style.display = 'none';
  panelEl.innerHTML = `
    <div class="panel-header">
      <h2>🏆 Leaderboard</h2>
      <button id="leaderboard-close" class="close-btn">✕</button>
    </div>
    <div id="leaderboard-content" class="panel-content"></div>
  `;
  document.body.appendChild(panelEl);

  panelEl.querySelector('#leaderboard-close').addEventListener('click', closeLeaderboard);
}

export function openLeaderboard(onClose) {
  onCloseCallback = onClose;
  panelEl.style.display = 'block';
  renderLeaderboard();
}

export function closeLeaderboard() {
  panelEl.style.display = 'none';
  if (onCloseCallback) onCloseCallback();
}

async function renderLeaderboard() {
  const content = panelEl.querySelector('#leaderboard-content');
  content.innerHTML = '<div class="loading">Loading...</div>';

  const data = await api.getLeaderboard();
  if (data.error) {
    content.innerHTML = `<div class="empty-state">⚠️ ${data.error}</div>`;
    return;
  }

  const leaders = data.leaderboard || [];
  const seasonal = data.seasonal;

  let html = `
    <div class="season-info">
      <span class="season-id">📅 ${data.season?.replace('season_', 'Season ')}</span>
      ${seasonal ? `<span class="season-modifier">${seasonal.label}</span>` : ''}
      <span class="season-note">Resets weekly — earn Crowns to climb!</span>
    </div>
  `;

  if (leaders.length === 0) {
    html += '<div class="empty-state">No scores yet this season. Be the first!</div>';
  } else {
    html += '<div class="leaderboard-list">';
    html += leaders.map((l, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
      const regionEmoji = getRegionEmoji(l.region);
      const isMe = l.name === state.playerName;

      return `
        <div class="leaderboard-row ${isMe ? 'is-me' : ''} ${i < 3 ? 'top-3' : ''}">
          <span class="lb-rank">${medal}</span>
          <span class="lb-name">${regionEmoji} ${l.name}</span>
          <span class="lb-cart">"${l.cart_name}"</span>
          <span class="lb-level">Lv.${l.level}</span>
          <span class="lb-recipes">📖 ${l.recipe_count || 0}</span>
          <span class="lb-score">👑 ${l.score}</span>
        </div>
      `;
    }).join('');
    html += '</div>';
  }

  content.innerHTML = html;
}

function getRegionEmoji(regionId) {
  const r = (state.regions || []).find(r => r.id === regionId);
  return r?.emoji || '🌍';
}
