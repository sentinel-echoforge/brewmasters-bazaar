// ═══ HUD ═══

import state from '../systems/state.js';
import { getOriginBadge } from '../systems/geolocation.js';
import { getMinutesUntilRestock } from '../systems/merchant.js';
import { getBarrelStatus } from '../systems/barrel-aging.js';

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
  
  // Origin badge
  const badgeEl = document.getElementById('origin-badge');
  if (badgeEl) {
    const badge = getOriginBadge();
    badgeEl.textContent = badge;
    badgeEl.style.display = badge ? 'inline' : 'none';
  }
  
  // Barrel notification badge
  const barrelBtn = document.getElementById('barrel-btn');
  if (barrelBtn) {
    const barrels = getBarrelStatus();
    const doneCount = barrels.filter(b => b.done).length;
    if (doneCount > 0) {
      barrelBtn.textContent = `🪵 Barrels (${doneCount} ready!)`;
      barrelBtn.classList.add('has-notification');
    } else if (barrels.length > 0) {
      barrelBtn.textContent = `🪵 Barrels (${barrels.length})`;
      barrelBtn.classList.remove('has-notification');
    } else {
      barrelBtn.textContent = '🪵 Barrels';
      barrelBtn.classList.remove('has-notification');
    }
  }
  
  // Level display
  const levelEl = document.getElementById('level-display');
  if (levelEl) {
    const lvlNames = { 1: 'Handcart', 2: 'Donkey Cart', 3: 'Covered Wagon', 4: 'Grand Caravan', 5: 'Legendary Yatai' };
    levelEl.textContent = `Lv.${state.breweryLevel} ${lvlNames[state.breweryLevel] || ''}`;
  }
}
