// ═══ HUD ═══

import state from '../systems/state.js';

const hudEl = document.getElementById('hud');
const cartNameEl = document.getElementById('cart-name-display');
const crownEl = document.getElementById('crown-display');
const repEl = document.getElementById('reputation-display');
const streakEl = document.getElementById('streak-display');

export function showHud() {
  hudEl.style.display = 'block';
}

export function updateHud() {
  cartNameEl.textContent = `🍺 ${state.cartName}`;
  crownEl.textContent = `👑 ${state.crowns}`;
  repEl.textContent = `⭐ ${state.reputation}`;
  
  if (state.hotStreakActive) {
    streakEl.style.display = 'inline';
    const remaining = Math.max(0, Math.ceil((state.hotStreakEnd - Date.now()) / 1000));
    streakEl.textContent = `🔥 Hot Streak! ${remaining}s`;
  } else {
    streakEl.style.display = 'none';
  }
}
