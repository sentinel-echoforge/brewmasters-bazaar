// ═══ TRADE BOARD UI ═══
// Barter ingredients/drinks with other players (no Crowns)

import state from '../systems/state.js';
import * as api from '../systems/api-client.js';
import { notify } from './notifications.js';
import { queueSave } from '../systems/multiplayer.js';

let panelEl = null;
let onCloseCallback = null;

export function initTradeUI() {
  panelEl = document.createElement('div');
  panelEl.id = 'trade-panel';
  panelEl.className = 'game-panel overlay-panel';
  panelEl.style.display = 'none';
  panelEl.innerHTML = `
    <div class="panel-header">
      <h2>🔄 Trade Board</h2>
      <button id="trade-close" class="close-btn">✕</button>
    </div>
    <div class="panel-tabs">
      <button class="tab-btn active" data-tab="browse">Browse Trades</button>
      <button class="tab-btn" data-tab="create">Create Offer</button>
      <button class="tab-btn" data-tab="my-trades">My Offers</button>
    </div>
    <div id="trade-content" class="panel-content"></div>
  `;
  document.body.appendChild(panelEl);

  panelEl.querySelector('#trade-close').addEventListener('click', closeTrade);
  panelEl.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      panelEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderTab(e.target.dataset.tab);
    });
  });
}

export function openTrade(onClose) {
  onCloseCallback = onClose;
  panelEl.style.display = 'block';
  renderTab('browse');
}

export function closeTrade() {
  panelEl.style.display = 'none';
  if (onCloseCallback) onCloseCallback();
}

async function renderTab(tab) {
  const content = panelEl.querySelector('#trade-content');
  content.innerHTML = '<div class="loading">Loading...</div>';

  if (tab === 'browse') await renderBrowse(content);
  else if (tab === 'create') renderCreateForm(content);
  else if (tab === 'my-trades') await renderMyTrades(content);
}

async function renderBrowse(container) {
  const data = await api.getTrades();
  if (data.error) {
    container.innerHTML = `<div class="empty-state">⚠️ ${data.error}</div>`;
    return;
  }

  const trades = data.trades || [];
  if (trades.length === 0) {
    container.innerHTML = '<div class="empty-state">No trade offers yet. Post the first!</div>';
    return;
  }

  const regionEmoji = (regionId) => {
    const r = (state.regions || []).find(r => r.id === regionId);
    return r?.emoji || '🌍';
  };

  container.innerHTML = trades.map(t => {
    const offerStr = t.offer_items.map(i => `${i.quantity || 1}× ${(i.id || i.name || '').replace(/_/g, ' ')}`).join(', ');
    const wantStr = t.want_items.map(i => `${i.quantity || 1}× ${(i.id || i.name || '').replace(/_/g, ' ')}`).join(', ');

    return `
      <div class="trade-item">
        <div class="trade-header">
          <span class="trader">${regionEmoji(t.offerer_region)} ${t.offerer_name} of "${t.offerer_cart}"</span>
        </div>
        <div class="trade-details">
          <div class="trade-offer">
            <strong>Offers:</strong> ${offerStr}
          </div>
          <div class="trade-arrow">⇄</div>
          <div class="trade-want">
            <strong>Wants:</strong> ${wantStr}
          </div>
        </div>
        <button class="accept-trade-btn" data-id="${t.id}">Accept Trade</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.accept-trade-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const result = await api.acceptTrade(parseInt(btn.dataset.id));
      if (result.error) {
        notify(`❌ ${result.error}`);
      } else {
        const receivedStr = result.received.map(i => `${i.quantity || 1}× ${(i.id || '').replace(/_/g, ' ')}`).join(', ');
        notify(`✅ Trade completed! Received: ${receivedStr}`);
        // Add received items to inventory
        for (const item of result.received) {
          if (item.id) state.availableIngredients.add(item.id);
        }
        queueSave();
        renderTab('browse');
      }
    });
  });
}

function renderCreateForm(container) {
  const ingredients = state.ingredients.filter(i => state.availableIngredients.has(i.id));

  container.innerHTML = `
    <div class="trade-form">
      <h3>I'm offering:</h3>
      <div id="trade-offer-slots" class="trade-slots"></div>
      <select id="trade-offer-select">
        <option value="">Add ingredient...</option>
        ${ingredients.map(i => `<option value="${i.id}">${i.emoji} ${i.name}</option>`).join('')}
      </select>
      <button id="trade-add-offer" class="small-btn">+ Add</button>
      
      <h3>I want:</h3>
      <div id="trade-want-slots" class="trade-slots"></div>
      <select id="trade-want-select">
        <option value="">Add ingredient...</option>
        ${state.ingredients.map(i => `<option value="${i.id}">${i.emoji} ${i.name}</option>`).join('')}
      </select>
      <button id="trade-add-want" class="small-btn">+ Add</button>
      
      <button id="trade-submit" class="action-btn">Post Trade Offer</button>
    </div>
  `;

  const offerItems = [];
  const wantItems = [];

  const renderSlots = (items, containerId) => {
    const el = container.querySelector(`#${containerId}`);
    el.innerHTML = items.map((item, i) => `
      <span class="trade-slot">${item.quantity}× ${item.id.replace(/_/g, ' ')} <button class="remove-slot" data-idx="${i}" data-list="${containerId}">×</button></span>
    `).join('');

    el.querySelectorAll('.remove-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const list = btn.dataset.list === 'trade-offer-slots' ? offerItems : wantItems;
        list.splice(idx, 1);
        renderSlots(list, btn.dataset.list);
      });
    });
  };

  container.querySelector('#trade-add-offer').addEventListener('click', () => {
    const select = container.querySelector('#trade-offer-select');
    if (select.value) {
      offerItems.push({ id: select.value, quantity: 1 });
      renderSlots(offerItems, 'trade-offer-slots');
      select.value = '';
    }
  });

  container.querySelector('#trade-add-want').addEventListener('click', () => {
    const select = container.querySelector('#trade-want-select');
    if (select.value) {
      wantItems.push({ id: select.value, quantity: 1 });
      renderSlots(wantItems, 'trade-want-slots');
      select.value = '';
    }
  });

  container.querySelector('#trade-submit').addEventListener('click', async () => {
    if (offerItems.length === 0 || wantItems.length === 0) {
      notify('Add at least one item to offer and want!');
      return;
    }

    const result = await api.createTradeOffer(offerItems, wantItems);
    if (result.error) {
      notify(`❌ ${result.error}`);
    } else {
      notify('✅ Trade offer posted!');
      renderTab('my-trades');
    }
  });
}

async function renderMyTrades(container) {
  const data = await api.getTrades();
  if (data.error) {
    container.innerHTML = `<div class="empty-state">⚠️ ${data.error}</div>`;
    return;
  }

  const playerId = parseInt(api.getPlayerId());
  const mine = (data.trades || []).filter(t => t.offerer_id === playerId);

  if (mine.length === 0) {
    container.innerHTML = '<div class="empty-state">You have no active trade offers.</div>';
    return;
  }

  container.innerHTML = mine.map(t => {
    const offerStr = t.offer_items.map(i => `${i.quantity || 1}× ${(i.id || '').replace(/_/g, ' ')}`).join(', ');
    const wantStr = t.want_items.map(i => `${i.quantity || 1}× ${(i.id || '').replace(/_/g, ' ')}`).join(', ');
    return `
      <div class="trade-item my-trade">
        <div class="trade-details">
          <div class="trade-offer"><strong>Offering:</strong> ${offerStr}</div>
          <div class="trade-arrow">⇄</div>
          <div class="trade-want"><strong>Wanting:</strong> ${wantStr}</div>
        </div>
        <button class="cancel-trade-btn" data-id="${t.id}">Cancel</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.cancel-trade-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const result = await api.cancelTrade(parseInt(btn.dataset.id));
      if (result.error) notify(`❌ ${result.error}`);
      else {
        notify('Trade offer cancelled');
        renderTab('my-trades');
      }
    });
  });
}
