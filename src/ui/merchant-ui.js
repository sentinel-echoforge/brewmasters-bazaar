// ═══ MERCHANT UI ═══
// Omar's shop panel — stock list, prices, buy buttons, dialogue

import state from '../systems/state.js';
import {
  getMerchantStock, buyFromMerchant, getMerchantDialogue,
  getRotationDialogue, getIngredientStory, getMinutesUntilRestock,
  getCurrentRotation, isMerchantAvailable,
} from '../systems/merchant.js';

let merchantPanel = null;
let onClose = null;

export function initMerchantUI() {
  merchantPanel = document.getElementById('merchant-panel');
  if (!merchantPanel) return;

  merchantPanel.querySelector('.panel-close')?.addEventListener('click', () => {
    closeMerchantUI();
  });
}

export function openMerchantUI(closeCallback) {
  onClose = closeCallback || null;
  merchantPanel = document.getElementById('merchant-panel');
  if (!merchantPanel) return;
  merchantPanel.style.display = 'block';
  renderMerchant();
}

export function closeMerchantUI() {
  if (merchantPanel) merchantPanel.style.display = 'none';
  if (onClose) onClose();
}

export function renderMerchant() {
  if (!merchantPanel) return;

  const available = isMerchantAvailable();
  const rotation = getCurrentRotation();
  const minutesLeft = getMinutesUntilRestock();

  let html = '<h3>🧔 Omar the Wanderer</h3>';

  // Dialogue
  const dialogue = getMerchantDialogue();
  const rotationDialogue = getRotationDialogue();

  html += `<div class="merchant-dialogue">"${dialogue}"</div>`;
  if (rotationDialogue && rotationDialogue !== dialogue) {
    html += `<div class="merchant-rotation-dialogue">"${rotationDialogue}"</div>`;
  }

  if (rotation) {
    html += `<div class="merchant-theme">📦 ${rotation.theme}</div>`;
  }

  html += `<div class="merchant-timer">⏰ Next restock in ${minutesLeft} min</div>`;

  // Stock list
  const stock = getMerchantStock();
  if (stock.length === 0) {
    html += '<p class="merchant-empty">Omar has sold out! Come back later.</p>';
  } else {
    html += '<div class="merchant-stock">';
    for (const item of stock) {
      const ing = item.ingredient;
      const name = ing ? `${ing.emoji} ${ing.name}` : item.ingredientId;
      const seedLabel = item.isSeed ? ' 🌱 Seed' : '';
      const growthLabel = item.isSeed ? ` (grows in ${item.growthHours}h)` : '';
      const canAfford = state.crowns >= item.price;

      html += `
        <div class="merchant-item">
          <div class="merchant-item-info">
            <span class="merchant-item-name">${name}${seedLabel}</span>
            <span class="merchant-item-details">×${item.remaining} left${growthLabel}</span>
          </div>
          <div class="merchant-item-actions">
            <span class="merchant-item-price">${item.price}c</span>
            <button class="merchant-buy-btn ${canAfford ? '' : 'disabled'}" 
                    data-id="${item.ingredientId}" 
                    ${canAfford ? '' : 'disabled'}>Buy</button>
          </div>
        </div>
      `;
    }
    html += '</div>';
  }

  html += '<button class="merchant-close-btn">Leave</button>';

  merchantPanel.innerHTML = html;

  // Buy handlers
  merchantPanel.querySelectorAll('.merchant-buy-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      buyFromMerchant(id);
      renderMerchant(); // re-render with updated stock/prices
    });
  });

  // Close
  merchantPanel.querySelector('.merchant-close-btn')?.addEventListener('click', () => {
    closeMerchantUI();
  });

  // Ingredient story tooltips
  merchantPanel.querySelectorAll('.merchant-item-name').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const parent = e.target.closest('.merchant-item');
      const btn = parent?.querySelector('.merchant-buy-btn');
      const id = btn?.dataset.id;
      if (id) {
        const story = getIngredientStory(id);
        if (story) {
          showTooltip(story, e);
        }
      }
    });
    el.addEventListener('mouseleave', hideTooltip);
  });
}

function showTooltip(text, e) {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;
  tooltip.textContent = text;
  tooltip.style.display = 'block';
  tooltip.style.left = `${e.clientX + 10}px`;
  tooltip.style.top = `${e.clientY + 10}px`;
  tooltip.style.maxWidth = '300px';
}

function hideTooltip() {
  const tooltip = document.getElementById('tooltip');
  if (tooltip) tooltip.style.display = 'none';
}
