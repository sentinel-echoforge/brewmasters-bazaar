// ═══ SETTINGS PANEL ═══
// Volume sliders, mute toggle, display name, credits, reset

import state from '../systems/state.js';
import { getVolumes, setMasterVolume, setMusicVolume, setSfxVolume, toggleMute, isMuted } from '../systems/audio.js';
import { notify } from './notifications.js';
import { resetHints } from '../systems/hints.js';
import { resetMilestones } from '../systems/milestones.js';

let settingsEl = null;
let isOpen = false;

/**
 * Initialize settings panel (creates DOM, attaches to HUD button)
 */
export function initSettings() {
  // Create settings button in HUD
  const hudInner = document.getElementById('hud-inner');
  if (hudInner) {
    const lastSection = hudInner.querySelector('.hud-section:last-child');
    if (lastSection) {
      const btn = document.createElement('button');
      btn.className = 'hud-btn';
      btn.id = 'settings-btn';
      btn.textContent = '⚙️ Settings';
      btn.addEventListener('click', () => toggleSettings());
      lastSection.appendChild(btn);
    }
  }

  // Create mute button in HUD  
  const muteBtn = document.createElement('button');
  muteBtn.className = 'hud-btn';
  muteBtn.id = 'mute-btn';
  muteBtn.textContent = isMuted() ? '🔇' : '🔊';
  muteBtn.style.cssText = 'font-size: 1.1rem; padding: 2px 8px;';
  muteBtn.addEventListener('click', () => {
    const muted = toggleMute();
    muteBtn.textContent = muted ? '🔇' : '🔊';
  });
  const hudMp = document.getElementById('hud-multiplayer');
  if (hudMp) {
    hudMp.appendChild(muteBtn);
  }

  // Create the settings panel DOM
  settingsEl = document.createElement('div');
  settingsEl.id = 'settings-panel';
  settingsEl.className = 'overlay-panel';
  settingsEl.style.display = 'none';
  document.body.appendChild(settingsEl);
}

function toggleSettings() {
  if (isOpen) closeSettings();
  else openSettings();
}

function openSettings() {
  isOpen = true;
  renderSettings();
  settingsEl.style.display = 'block';
}

function closeSettings() {
  isOpen = false;
  settingsEl.style.display = 'none';
}

function renderSettings() {
  const vols = getVolumes();
  const regionData = state.regionData;
  const regionName = regionData?.name || state.region || 'Unknown';

  settingsEl.innerHTML = `
    <div class="panel-header">
      <h2>⚙️ Settings</h2>
      <button class="close-btn" id="settings-close">✕</button>
    </div>
    <div class="panel-content">
      <!-- Volume Controls -->
      <div class="settings-section">
        <h3 class="settings-label">🔊 Audio</h3>
        <div class="volume-row">
          <label>Master</label>
          <input type="range" min="0" max="100" value="${Math.round(vols.master * 100)}" id="vol-master" class="vol-slider">
          <span id="vol-master-val">${Math.round(vols.master * 100)}%</span>
        </div>
        <div class="volume-row">
          <label>Music</label>
          <input type="range" min="0" max="100" value="${Math.round(vols.music * 100)}" id="vol-music" class="vol-slider">
          <span id="vol-music-val">${Math.round(vols.music * 100)}%</span>
        </div>
        <div class="volume-row">
          <label>SFX</label>
          <input type="range" min="0" max="100" value="${Math.round(vols.sfx * 100)}" id="vol-sfx" class="vol-slider">
          <span id="vol-sfx-val">${Math.round(vols.sfx * 100)}%</span>
        </div>
        <div class="volume-row">
          <label>Mute All</label>
          <button id="settings-mute-toggle" class="small-btn">${vols.muted ? '🔇 Unmute' : '🔊 Mute'}</button>
        </div>
      </div>

      <!-- Display Info -->
      <div class="settings-section">
        <h3 class="settings-label">🍺 Identity</h3>
        <div class="settings-row">
          <label>Display Name</label>
          <input type="text" id="settings-name" value="${escapeHtml(state.playerName)}" maxlength="20" class="settings-input">
        </div>
        <div class="settings-row">
          <label>Cart Name</label>
          <input type="text" id="settings-cart" value="${escapeHtml(state.cartName)}" maxlength="25" class="settings-input">
        </div>
        <div class="settings-row">
          <label>Region</label>
          <span class="settings-value">${escapeHtml(regionName)}</span>
        </div>
      </div>

      <!-- Credits -->
      <div class="settings-section">
        <h3 class="settings-label">📜 Credits</h3>
        <p class="settings-credits">Built for Vibe Jam 2026 by<br>
          <a href="https://x.com/FabioJonathanA" target="_blank" style="color:#d4a44c">@FabioJonathanA</a> + 
          <a href="https://x.com/sentinel_ef" target="_blank" style="color:#d4a44c">@sentinel_ef</a>
        </p>
      </div>

      <!-- Danger Zone -->
      <div class="settings-section danger-section">
        <h3 class="settings-label">⚠️ Danger Zone</h3>
        <button id="settings-reset" class="danger-btn">Reset All Progress</button>
      </div>
    </div>
  `;

  // Inject styles once
  if (!document.getElementById('settings-styles')) {
    const style = document.createElement('style');
    style.id = 'settings-styles';
    style.textContent = `
      .settings-section { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #3a2a18; }
      .settings-section:last-child { border-bottom: none; }
      .settings-label { font-family: 'MedievalSharp', cursive; color: #d4a44c; font-size: 1rem; margin-bottom: 8px; }
      .volume-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .volume-row label { width: 60px; color: #c8b896; font-size: 0.9rem; }
      .volume-row span { width: 40px; text-align: right; color: #a08c6a; font-size: 0.85rem; }
      .vol-slider { flex: 1; accent-color: #d4a44c; height: 4px; cursor: pointer; }
      .settings-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .settings-row label { width: 100px; color: #c8b896; font-size: 0.9rem; }
      .settings-input {
        flex: 1; background: rgba(44,32,18,0.8); border: 1px solid #4a3520; border-radius: 4px;
        color: #f0e6d0; font-family: inherit; padding: 4px 8px; font-size: 0.9rem;
      }
      .settings-input:focus { border-color: #d4a44c; outline: none; }
      .settings-value { color: #a08c6a; font-size: 0.9rem; }
      .settings-credits { color: #8a7a60; font-size: 0.9rem; line-height: 1.5; }
      .danger-section { border-color: #5a2a2a; }
      .danger-btn {
        display: block; width: 100%; padding: 8px;
        background: rgba(80,30,30,0.6); border: 1px solid #8b3a3a; border-radius: 6px;
        color: #e88; cursor: pointer; font-family: inherit; font-size: 0.9rem;
      }
      .danger-btn:hover { background: rgba(100,40,40,0.6); }
      .confirm-dialog {
        position: fixed; inset: 0; z-index: 100;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.7);
      }
      .confirm-card {
        background: rgba(40,30,15,0.98); border: 2px solid #cc4444; border-radius: 10px;
        padding: 24px; text-align: center; max-width: 350px;
      }
      .confirm-card h3 { font-family: 'MedievalSharp', cursive; color: #cc4444; margin-bottom: 12px; }
      .confirm-card p { color: #a08c6a; margin-bottom: 16px; font-size: 0.95rem; }
      .confirm-actions { display: flex; gap: 10px; justify-content: center; }
      .confirm-yes { padding: 8px 20px; background: rgba(100,30,30,0.8); border: 1px solid #cc4444; border-radius: 6px; color: #fff; cursor: pointer; font-family: inherit; }
      .confirm-no { padding: 8px 20px; background: rgba(60,45,25,0.8); border: 1px solid #6b4c2a; border-radius: 6px; color: #d8c8a8; cursor: pointer; font-family: inherit; }
    `;
    document.head.appendChild(style);
  }

  // Event listeners
  settingsEl.querySelector('#settings-close').addEventListener('click', closeSettings);

  // Volume sliders
  const masterSlider = settingsEl.querySelector('#vol-master');
  const musicSlider = settingsEl.querySelector('#vol-music');
  const sfxSlider = settingsEl.querySelector('#vol-sfx');

  masterSlider.addEventListener('input', (e) => {
    const v = parseInt(e.target.value) / 100;
    setMasterVolume(v);
    settingsEl.querySelector('#vol-master-val').textContent = `${e.target.value}%`;
  });
  musicSlider.addEventListener('input', (e) => {
    const v = parseInt(e.target.value) / 100;
    setMusicVolume(v);
    settingsEl.querySelector('#vol-music-val').textContent = `${e.target.value}%`;
  });
  sfxSlider.addEventListener('input', (e) => {
    const v = parseInt(e.target.value) / 100;
    setSfxVolume(v);
    settingsEl.querySelector('#vol-sfx-val').textContent = `${e.target.value}%`;
  });

  // Mute toggle
  settingsEl.querySelector('#settings-mute-toggle').addEventListener('click', () => {
    const muted = toggleMute();
    settingsEl.querySelector('#settings-mute-toggle').textContent = muted ? '🔇 Unmute' : '🔊 Mute';
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
  });

  // Name/cart change
  settingsEl.querySelector('#settings-name').addEventListener('change', (e) => {
    const name = e.target.value.trim();
    if (name) {
      state.playerName = name;
      notify('Display name updated!');
    }
  });
  settingsEl.querySelector('#settings-cart').addEventListener('change', (e) => {
    const name = e.target.value.trim();
    if (name) {
      state.cartName = name;
      notify('Cart name updated!');
    }
  });

  // Reset
  settingsEl.querySelector('#settings-reset').addEventListener('click', showResetConfirm);
}

function showResetConfirm() {
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  dialog.innerHTML = `
    <div class="confirm-card">
      <h3>⚠️ Reset All Progress?</h3>
      <p>This will erase all your recipes, crowns, and progress. This cannot be undone!</p>
      <div class="confirm-actions">
        <button class="confirm-yes">Yes, Reset</button>
        <button class="confirm-no">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  dialog.querySelector('.confirm-yes').addEventListener('click', () => {
    localStorage.clear();
    resetHints();
    resetMilestones();
    dialog.remove();
    window.location.reload();
  });
  dialog.querySelector('.confirm-no').addEventListener('click', () => dialog.remove());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.remove(); });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML;
}
