// ═══ EQUIPMENT / PROGRESSION UI ═══
// Cart level upgrades + equipment shop

import state from '../systems/state.js';
import { canLevelUp, levelUp, getCartInfo, getAvailableEquipment, buyEquipment } from '../systems/progression.js';

let equipPanel = null;
let onLevelUp = null;

export function initEquipmentUI() {
  equipPanel = document.getElementById('equipment-panel');
}

export function openEquipmentUI(levelUpCallback) {
  onLevelUp = levelUpCallback || null;
  equipPanel = document.getElementById('equipment-panel');
  if (!equipPanel) return;
  equipPanel.style.display = 'block';
  renderEquipment();
}

export function closeEquipmentUI() {
  if (equipPanel) equipPanel.style.display = 'none';
}

export function renderEquipment() {
  if (!equipPanel) return;

  const cartInfo = getCartInfo();
  const levelCheck = canLevelUp();
  const equipment = getAvailableEquipment();

  let html = '<h3>⚒️ Cart & Equipment</h3>';

  // Cart level
  html += `
    <div class="cart-level-section">
      <div class="cart-level-name">Level ${cartInfo.level}: ${cartInfo.name}</div>
      <div class="cart-level-stats">
        <span>👑 ${state.crowns} crowns</span>
        <span>📖 ${state.discoveredRecipes.size} recipes</span>
        <span>🧑‍🤝‍🧑 ${state.servedCount} served</span>
      </div>
  `;

  if (cartInfo.nextLevel) {
    const nl = cartInfo.nextLevel;
    html += `
      <div class="cart-next-level">
        <div class="cart-next-label">Next: ${nl.name}</div>
        <div class="cart-next-reqs">
          <span class="${state.crowns >= nl.cost ? 'met' : 'unmet'}">💰 ${nl.cost}c</span>
          <span class="${state.discoveredRecipes.size >= nl.recipesRequired ? 'met' : 'unmet'}">📖 ${nl.recipesRequired} recipes</span>
          ${nl.customersRequired > 0 ? `<span class="${state.servedCount >= nl.customersRequired ? 'met' : 'unmet'}">🧑‍🤝‍🧑 ${nl.customersRequired} served</span>` : ''}
        </div>
        <button class="cart-upgrade-btn" ${levelCheck.can ? '' : 'disabled'}>
          ${levelCheck.can ? '🎉 Upgrade Cart!' : levelCheck.reason}
        </button>
      </div>
    `;
  } else {
    html += '<div class="cart-max-level">🏆 Max level reached!</div>';
  }

  html += '</div>';

  // Equipment
  html += '<div class="equipment-section-label">Equipment Upgrades</div>';
  html += '<div class="equipment-list">';

  for (const equip of equipment) {
    html += `
      <div class="equipment-item ${equip.owned ? 'owned' : ''}">
        <div class="equipment-info">
          <span class="equipment-name">${equip.emoji} ${equip.name}</span>
          <span class="equipment-desc">${equip.description}</span>
        </div>
        ${equip.owned
          ? '<span class="equipment-owned-label">✅ Owned</span>'
          : `<button class="equipment-buy-btn ${equip.canAfford ? '' : 'disabled'}" 
                    data-id="${equip.id}" ${equip.canAfford ? '' : 'disabled'}>
              ${equip.cost}c
            </button>`
        }
      </div>
    `;
  }

  html += '</div>';
  html += '<button class="equipment-close-btn">Close</button>';

  equipPanel.innerHTML = html;

  // Level up handler
  equipPanel.querySelector('.cart-upgrade-btn')?.addEventListener('click', () => {
    if (levelUp()) {
      if (onLevelUp) onLevelUp();
      renderEquipment();
    }
  });

  // Equipment buy handlers
  equipPanel.querySelectorAll('.equipment-buy-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      buyEquipment(btn.dataset.id);
      renderEquipment();
    });
  });

  // Close
  equipPanel.querySelector('.equipment-close-btn')?.addEventListener('click', () => {
    closeEquipmentUI();
  });
}
