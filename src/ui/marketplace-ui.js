// ═══ MARKETPLACE UI ═══
// Buy/sell ingredients and drinks on the global marketplace

import state from '../systems/state.js';
import * as api from '../systems/api-client.js';
import { notify } from './notifications.js';
import { queueSave } from '../systems/multiplayer.js';

let panelEl = null;
let onCloseCallback = null;

export function initMarketplaceUI() {
  panelEl = document.createElement('div');
  panelEl.id = 'marketplace-panel';
  panelEl.className = 'game-panel overlay-panel';
  panelEl.style.display = 'none';
  panelEl.innerHTML = `
    <div class="panel-header">
      <h2>🏪 Marketplace</h2>
      <button id="marketplace-close" class="close-btn">✕</button>
    </div>
    <div class="panel-tabs">
      <button class="tab-btn active" data-tab="browse">Browse</button>
      <button class="tab-btn" data-tab="sell">Sell</button>
      <button class="tab-btn" data-tab="my-listings">My Listings</button>
    </div>
    <div id="marketplace-content" class="panel-content"></div>
  `;
  document.body.appendChild(panelEl);

  panelEl.querySelector('#marketplace-close').addEventListener('click', closeMarketplace);
  panelEl.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      panelEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderTab(e.target.dataset.tab);
    });
  });
}

export function openMarketplace(onClose) {
  onCloseCallback = onClose;
  panelEl.style.display = 'block';
  renderTab('browse');
}

export function closeMarketplace() {
  panelEl.style.display = 'none';
  if (onCloseCallback) onCloseCallback();
}

async function renderTab(tab) {
  const content = panelEl.querySelector('#marketplace-content');
  content.innerHTML = '<div class="loading">Loading...</div>';

  if (tab === 'browse') await renderBrowse(content);
  else if (tab === 'sell') renderSellForm(content);
  else if (tab === 'my-listings') await renderMyListings(content);
}

async function renderBrowse(container) {
  const data = await api.getMarketplace();
  if (data.error) {
    container.innerHTML = `<div class="empty-state">⚠️ ${data.error}</div>`;
    return;
  }

  const listings = data.listings || [];
  if (listings.length === 0) {
    container.innerHTML = '<div class="empty-state">No listings yet. Be the first to sell!</div>';
    return;
  }

  container.innerHTML = listings.map(l => {
    const regionEmoji = getRegionEmoji(l.seller_region);
    return `
      <div class="marketplace-item">
        <div class="item-info">
          <span class="item-type ${l.item_type}">${l.item_type === 'ingredient' ? '🧪' : '🍶'}</span>
          <strong>${l.item_id.replace(/_/g, ' ')}</strong>
          <span class="item-qty">×${l.quantity}</span>
        </div>
        <div class="item-meta">
          <span class="seller">${regionEmoji} ${l.seller_name}</span>
          <span class="price">${l.price * l.quantity}c</span>
          <button class="buy-btn" data-id="${l.id}" data-price="${l.price * l.quantity}">Buy</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const result = await api.buyListing(id);
      if (result.error) {
        notify(`❌ ${result.error}`);
      } else {
        notify(`✅ Bought ${result.quantity}× ${result.itemId.replace(/_/g, ' ')} for ${result.totalCost}c (fee: ${result.fee}c)`);
        state.crowns -= result.totalCost;
        if (result.itemType === 'ingredient') {
          state.availableIngredients.add(result.itemId);
        }
        queueSave();
        renderTab('browse');
      }
    });
  });
}

function renderSellForm(container) {
  // Show available items to sell
  const ingredients = state.ingredients.filter(i => state.availableIngredients.has(i.id));
  const drinks = state.brewedDrinks || [];

  container.innerHTML = `
    <div class="sell-form">
      <h3>Sell Ingredients</h3>
      <div class="sell-items">
        ${ingredients.map(ing => `
          <div class="sell-item">
            <span>${ing.emoji} ${ing.name}</span>
            <input type="number" class="sell-qty" data-id="${ing.id}" data-type="ingredient" min="1" max="50" value="1" style="width:50px">
            <input type="number" class="sell-price" data-id="${ing.id}" min="1" placeholder="Price" style="width:60px">
            <button class="list-btn" data-id="${ing.id}" data-type="ingredient">List</button>
          </div>
        `).join('')}
      </div>
      <h3>Sell Drinks</h3>
      <div class="sell-items">
        ${drinks.length === 0 ? '<div class="empty-state">No brewed drinks to sell</div>' :
          drinks.map((d, i) => `
            <div class="sell-item">
              <span>${'⭐'.repeat(d.recipe.stars)} ${d.recipe.name}</span>
              <input type="number" class="sell-price-drink" data-index="${i}" data-id="${d.recipeId}" min="1" placeholder="Price" style="width:60px">
              <button class="list-drink-btn" data-index="${i}" data-id="${d.recipeId}">List</button>
            </div>
          `).join('')}
      </div>
    </div>
  `;

  // Ingredient listing
  container.querySelectorAll('.list-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      const qty = parseInt(btn.parentElement.querySelector('.sell-qty').value) || 1;
      const price = parseInt(btn.parentElement.querySelector('.sell-price').value);
      if (!price || price < 1) { notify('Set a price!'); return; }

      const result = await api.createListing(type, id, qty, price);
      if (result.error) {
        notify(`❌ ${result.error}`);
      } else {
        notify(`✅ Listed ${qty}× ${id.replace(/_/g, ' ')} for ${price}c each`);
        renderTab('sell');
      }
    });
  });

  // Drink listing
  container.querySelectorAll('.list-drink-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const index = parseInt(btn.dataset.index);
      const price = parseInt(btn.parentElement.querySelector('.sell-price-drink').value);
      if (!price || price < 1) { notify('Set a price!'); return; }

      const result = await api.createListing('drink', id, 1, price);
      if (result.error) {
        notify(`❌ ${result.error}`);
      } else {
        notify(`✅ Listed ${id.replace(/_/g, ' ')} for ${price}c`);
        // Remove from local inventory
        state.brewedDrinks.splice(index, 1);
        queueSave();
        renderTab('sell');
      }
    });
  });
}

async function renderMyListings(container) {
  const data = await api.getMarketplace();
  if (data.error) {
    container.innerHTML = `<div class="empty-state">⚠️ ${data.error}</div>`;
    return;
  }

  const playerId = parseInt(api.getPlayerId());
  const mine = (data.listings || []).filter(l => l.seller_id === playerId);

  if (mine.length === 0) {
    container.innerHTML = '<div class="empty-state">You have no active listings.</div>';
    return;
  }

  container.innerHTML = mine.map(l => `
    <div class="marketplace-item my-listing">
      <div class="item-info">
        <span class="item-type ${l.item_type}">${l.item_type === 'ingredient' ? '🧪' : '🍶'}</span>
        <strong>${l.item_id.replace(/_/g, ' ')}</strong>
        <span class="item-qty">×${l.quantity} @ ${l.price}c each</span>
      </div>
      <button class="cancel-btn" data-id="${l.id}">Cancel</button>
    </div>
  `).join('');

  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const result = await api.cancelListing(parseInt(btn.dataset.id));
      if (result.error) notify(`❌ ${result.error}`);
      else {
        notify('Listing cancelled');
        renderTab('my-listings');
      }
    });
  });
}

function getRegionEmoji(regionId) {
  const region = (state.regions || []).find(r => r.id === regionId);
  return region?.emoji || '🌍';
}
