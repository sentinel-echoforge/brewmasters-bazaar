// ═══ COLLECTION MILESTONES ═══
// Track recipe count milestones, award Crowns + notifications

import state from './state.js';
import { notify } from '../ui/notifications.js';
import { onMilestone as onMilestoneSound } from './audio.js';

const MILESTONES = [
  { count: 10,  reward: 100,  title: 'Apprentice Brewer',   message: '🎉 10 recipes! You\'re getting the hang of this.' },
  { count: 25,  reward: 250,  title: 'Journeyman Brewer',   message: '🎉 25 recipes! The realm takes notice.' },
  { count: 50,  reward: 500,  title: 'Master Brewer',        message: '🏆 50 recipes! A true master of the cauldron.' },
  { count: 75,  reward: 750,  title: 'Grand Master',         message: '🏆 75 recipes! Legends speak of your craft.' },
  { count: 100, reward: 1000, title: 'Legendary Brewmaster', message: '👑 100 recipes! You\'ve achieved the impossible.' },
  { count: 125, reward: 1500, title: 'Mythical Brewmaster',  message: '✨ 125 recipes! The gods themselves seek your brews.' },
];

const STORAGE_KEY = 'brewmaster_milestones';

let claimed = new Set();

// Load persisted milestones
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved && Array.isArray(saved)) claimed = new Set(saved);
} catch (e) { /* ignore */ }

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...claimed])); } catch (e) { /* ignore */ }
}

/**
 * Check if any new milestones have been reached.
 * Call this after every recipe discovery.
 * Returns array of newly claimed milestones.
 */
export function checkMilestones() {
  const recipeCount = state.discoveredRecipes.size;
  const newlyReached = [];
  
  for (const ms of MILESTONES) {
    if (recipeCount >= ms.count && !claimed.has(ms.count)) {
      claimed.add(ms.count);
      state.crowns += ms.reward;
      newlyReached.push(ms);
      
      // Notification
      notify(`${ms.message} +${ms.reward}👑`, 'gold');
      
      // Sound
      try { onMilestoneSound(); } catch (e) { /* audio not loaded yet */ }
      
      // Show milestone popup
      showMilestonePopup(ms);
    }
  }
  
  if (newlyReached.length > 0) persist();
  return newlyReached;
}

/**
 * Get milestone progress info for display in journal
 */
export function getMilestoneProgress() {
  const recipeCount = state.discoveredRecipes.size;
  
  return MILESTONES.map(ms => ({
    count: ms.count,
    reward: ms.reward,
    title: ms.title,
    claimed: claimed.has(ms.count),
    progress: Math.min(recipeCount / ms.count, 1),
    current: recipeCount,
  }));
}

/**
 * Get the next unclaimed milestone
 */
export function getNextMilestone() {
  const recipeCount = state.discoveredRecipes.size;
  for (const ms of MILESTONES) {
    if (!claimed.has(ms.count)) {
      return { ...ms, progress: recipeCount / ms.count, remaining: ms.count - recipeCount };
    }
  }
  return null; // All milestones claimed
}

/**
 * Show a celebration popup for milestone
 */
function showMilestonePopup(milestone) {
  // Create popup overlay
  const overlay = document.createElement('div');
  overlay.className = 'milestone-popup';
  overlay.innerHTML = `
    <div class="milestone-card">
      <div class="milestone-sparkles">✨✨✨</div>
      <h2>${milestone.title}</h2>
      <p class="milestone-count">${milestone.count} Recipes Discovered!</p>
      <p class="milestone-reward">+${milestone.reward} 👑 Crowns</p>
      <p class="milestone-msg">${milestone.message}</p>
      <button class="milestone-dismiss">Continue Brewing!</button>
    </div>
  `;
  
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 95;
    display: flex; align-items: center; justify-content: center;
    background: rgba(10,8,4,0.8);
    animation: alertFadeIn 0.3s ease-out;
  `;
  
  const card = overlay.querySelector('.milestone-card');
  card.style.cssText = `
    background: rgba(40,30,15,0.98); border: 3px solid #d4a44c; border-radius: 12px;
    padding: 30px 40px; text-align: center; max-width: 400px;
    box-shadow: 0 0 60px rgba(212,164,76,0.5);
    animation: milestoneZoom 0.4s ease-out;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes milestoneZoom { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .milestone-sparkles { font-size: 2rem; margin-bottom: 8px; animation: sparkleFloat 1s ease-in-out infinite alternate; }
    @keyframes sparkleFloat { from { transform: translateY(0); } to { transform: translateY(-5px); } }
    .milestone-card h2 { font-family: 'MedievalSharp', cursive; color: #d4a44c; margin-bottom: 4px; font-size: 1.6rem; }
    .milestone-count { color: #c8b896; font-size: 1rem; margin-bottom: 8px; }
    .milestone-reward { color: #f0d060; font-size: 1.3rem; font-weight: 600; margin-bottom: 8px; }
    .milestone-msg { color: #a8987a; font-style: italic; margin-bottom: 16px; }
    .milestone-dismiss { padding: 8px 24px; background: rgba(60,45,25,0.8); border: 1px solid #6b4c2a; border-radius: 6px; color: #d8c8a8; cursor: pointer; font-family: 'Crimson Text', serif; font-size: 1rem; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  
  const dismiss = overlay.querySelector('.milestone-dismiss');
  dismiss.addEventListener('click', () => {
    overlay.remove();
    style.remove();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { overlay.remove(); style.remove(); }
  });
}

/**
 * Reset milestones (for settings reset)
 */
export function resetMilestones() {
  claimed = new Set();
  persist();
}
