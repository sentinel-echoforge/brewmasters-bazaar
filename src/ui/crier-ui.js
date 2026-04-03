// ═══ TOWN CRIER UI ═══
// Scrolling announcements at the bottom of the screen

import state from '../systems/state.js';

let crierEl = null;
let messageQueue = [];
let isScrolling = false;

export function initCrierUI() {
  crierEl = document.createElement('div');
  crierEl.id = 'crier-banner';
  crierEl.className = 'crier-banner';
  crierEl.innerHTML = `
    <div class="crier-icon">📜</div>
    <div class="crier-scroll" id="crier-scroll">
      <span class="crier-text" id="crier-text">Welcome to the Bazaar! Brew, sell, trade, and compete!</span>
    </div>
  `;
  document.body.appendChild(crierEl);
}

/**
 * Update crier with new announcements from server
 */
export function updateCrier(announcements) {
  if (!announcements || announcements.length === 0) return;
  if (!crierEl) return;

  // Store last 10 for display
  messageQueue = announcements.slice(-10).map(a => a.message);
  renderScroll();
}

/**
 * Add a local announcement (for immediate feedback)
 */
export function addLocalAnnouncement(message) {
  messageQueue.push(message);
  if (messageQueue.length > 10) messageQueue.shift();
  renderScroll();
}

function renderScroll() {
  const textEl = crierEl.querySelector('#crier-text');
  if (!textEl) return;

  // Join all messages with separator
  const scrollText = messageQueue.join('  ✦  ');
  textEl.textContent = scrollText;

  // Restart animation
  textEl.style.animation = 'none';
  textEl.offsetHeight; // force reflow
  const duration = Math.max(15, scrollText.length * 0.15);
  textEl.style.animation = `crier-scroll ${duration}s linear infinite`;
}

/**
 * Show a commission notification prominently
 */
export function showCommissionAlert(commission) {
  if (!commission || !commission.definition) return;

  const alertEl = document.createElement('div');
  alertEl.className = 'commission-alert';
  alertEl.innerHTML = `
    <div class="commission-alert-content">
      <div class="commission-trumpet">👑🎺</div>
      <h3>${commission.definition.name}</h3>
      <p>${commission.definition.description}</p>
      <div class="commission-reward">Reward: ${commission.definition.reward}c</div>
      <button class="commission-dismiss">Got it!</button>
    </div>
  `;
  document.body.appendChild(alertEl);

  alertEl.querySelector('.commission-dismiss').addEventListener('click', () => {
    alertEl.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => alertEl.remove(), 10000);
}
