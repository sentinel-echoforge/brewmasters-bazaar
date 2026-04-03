// ═══ AUDIO SYSTEM ═══
// Howler.js-based sound system with lazy loading
// Volume controls persist in localStorage

import { Howl, Howler } from 'howler';
import state from './state.js';

// ═══ VOLUME STATE ═══
const STORAGE_KEY = 'brewmaster_audio';

let volumes = {
  master: 0.7,
  music: 0.5,
  sfx: 0.8,
  muted: false,
};

// Load persisted volumes
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved) Object.assign(volumes, saved);
} catch (e) { /* ignore */ }

function persistVolumes() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes)); } catch (e) { /* ignore */ }
}

// ═══ SOUND REGISTRY ═══
// Sounds are lazy-loaded: Howl instances created on first play

const soundDefs = {
  // Music
  'music-tavern':     { src: '/audio/music/tavern-loop.mp3', loop: true, category: 'music' },

  // Brewing
  'brew-bubble':      { src: '/audio/sfx/brew-bubble.mp3', loop: true, category: 'sfx' },
  'brew-start':       { src: '/audio/sfx/brew-start.mp3', category: 'sfx' },
  'brew-complete':    { src: '/audio/sfx/brew-complete.mp3', category: 'sfx' },
  'steam-hiss':       { src: '/audio/sfx/steam-hiss.mp3', category: 'sfx' },
  'ingredient-drop':  { src: '/audio/sfx/ingredient-drop.mp3', category: 'sfx' },

  // Economy
  'coin-earned':      { src: '/audio/sfx/coin-earned.mp3', category: 'sfx' },
  'coins-multiple':   { src: '/audio/sfx/coins-multiple.mp3', category: 'sfx' },
  'purchase':         { src: '/audio/sfx/purchase.mp3', category: 'sfx' },
  'level-up':         { src: '/audio/sfx/level-up.mp3', category: 'sfx' },

  // Discovery
  'recipe-discovered': { src: '/audio/sfx/recipe-discovered.mp3', category: 'sfx' },
  'near-miss':        { src: '/audio/sfx/near-miss.mp3', category: 'sfx' },
  'journal-open':     { src: '/audio/sfx/journal-open.mp3', category: 'sfx' },
  'page-turn':        { src: '/audio/sfx/page-turn.mp3', category: 'sfx' },

  // Customers
  'customer-arrive':  { src: '/audio/sfx/customer-arrive.mp3', category: 'sfx' },
  'customer-happy':   { src: '/audio/sfx/customer-happy.mp3', category: 'sfx' },
  'customer-unhappy': { src: '/audio/sfx/customer-unhappy.mp3', category: 'sfx' },

  // Merchant
  'merchant-arrive':  { src: '/audio/sfx/merchant-arrive.mp3', category: 'sfx' },

  // Foraging
  'ingredient-pick':  { src: '/audio/sfx/ingredient-pick.mp3', category: 'sfx' },

  // UI
  'button-click':     { src: '/audio/sfx/button-click.mp3', category: 'sfx' },
  'panel-open':       { src: '/audio/sfx/panel-open.mp3', category: 'sfx' },
  'panel-close':      { src: '/audio/sfx/panel-close.mp3', category: 'sfx' },

  // Streaks / Events
  'hot-streak':       { src: '/audio/sfx/hot-streak.mp3', category: 'sfx' },
  'notification':     { src: '/audio/sfx/notification.mp3', category: 'sfx' },

  // Town Crier
  'crier-trumpet':    { src: '/audio/sfx/crier-trumpet.mp3', category: 'sfx' },

  // Barrel
  'barrel-place':     { src: '/audio/sfx/barrel-place.mp3', category: 'sfx' },
  'barrel-complete':  { src: '/audio/sfx/barrel-complete.mp3', category: 'sfx' },

  // Milestones
  'milestone':        { src: '/audio/sfx/milestone.mp3', category: 'sfx' },
};

// Lazy-loaded Howl instances
const sounds = {};
// Track currently playing loops
const activeLoops = {};

function getEffectiveVolume(category) {
  if (volumes.muted) return 0;
  const catVol = category === 'music' ? volumes.music : volumes.sfx;
  return volumes.master * catVol;
}

function getOrCreateSound(id) {
  if (sounds[id]) return sounds[id];
  const def = soundDefs[id];
  if (!def) return null;

  const howl = new Howl({
    src: [def.src],
    loop: def.loop || false,
    volume: getEffectiveVolume(def.category),
    preload: false, // lazy — don't block game start
    html5: def.category === 'music', // stream music, buffer sfx
    onloaderror: () => { /* audio file missing — silently ignore */ },
    onplayerror: () => { /* autoplay blocked — silently ignore */ },
  });

  sounds[id] = howl;
  return howl;
}

// ═══ PUBLIC API ═══

/**
 * Play a sound by ID. Returns the Howl sound ID (for stopping loops).
 */
export function playSound(id) {
  const howl = getOrCreateSound(id);
  if (!howl) return null;
  howl.volume(getEffectiveVolume(soundDefs[id].category));
  const soundId = howl.play();
  return soundId;
}

/**
 * Start a looping sound. Only one instance per ID.
 */
export function startLoop(id) {
  if (activeLoops[id]) return; // already looping
  const howl = getOrCreateSound(id);
  if (!howl) return;
  howl.volume(getEffectiveVolume(soundDefs[id].category));
  const soundId = howl.play();
  activeLoops[id] = soundId;
}

/**
 * Stop a looping sound.
 */
export function stopLoop(id) {
  if (!activeLoops[id] && !sounds[id]) return;
  const howl = sounds[id];
  if (howl) howl.stop();
  delete activeLoops[id];
}

/**
 * Stop all sounds.
 */
export function stopAll() {
  Howler.stop();
  Object.keys(activeLoops).forEach(k => delete activeLoops[k]);
}

/**
 * Start background music (lazy, non-blocking).
 */
export function startMusic() {
  startLoop('music-tavern');
}

/**
 * Stop background music.
 */
export function stopMusic() {
  stopLoop('music-tavern');
}

// ═══ VOLUME CONTROLS ═══

export function setMasterVolume(v) {
  volumes.master = Math.max(0, Math.min(1, v));
  applyVolumes();
  persistVolumes();
}

export function setMusicVolume(v) {
  volumes.music = Math.max(0, Math.min(1, v));
  applyVolumes();
  persistVolumes();
}

export function setSfxVolume(v) {
  volumes.sfx = Math.max(0, Math.min(1, v));
  applyVolumes();
  persistVolumes();
}

export function toggleMute() {
  volumes.muted = !volumes.muted;
  applyVolumes();
  persistVolumes();
  return volumes.muted;
}

export function isMuted() {
  return volumes.muted;
}

export function getVolumes() {
  return { ...volumes };
}

function applyVolumes() {
  // Update all active sounds
  for (const [id, howl] of Object.entries(sounds)) {
    const def = soundDefs[id];
    if (def) {
      howl.volume(getEffectiveVolume(def.category));
    }
  }
  // Global mute
  Howler.mute(volumes.muted);
}

// ═══ GAME EVENT HOOKS ═══
// Convenience functions to call from game systems

export function onIngredientAdded() { playSound('ingredient-drop'); }
export function onBrewStart() { playSound('brew-start'); startLoop('brew-bubble'); }
export function onBrewComplete(isNew, isNearMiss) {
  stopLoop('brew-bubble');
  if (isNew) {
    playSound('recipe-discovered');
  } else if (isNearMiss) {
    playSound('near-miss');
  } else {
    playSound('brew-complete');
  }
}
export function onCoinEarned(amount) {
  if (amount > 20) playSound('coins-multiple');
  else playSound('coin-earned');
}
export function onCustomerArrive() { playSound('customer-arrive'); }
export function onCustomerReact(quality) {
  if (quality === 'perfect' || quality === 'good') playSound('customer-happy');
  else playSound('customer-unhappy');
}
export function onHotStreak() { playSound('hot-streak'); }
export function onLevelUpSound() { playSound('level-up'); }
export function onMerchantArrive() { playSound('merchant-arrive'); }
export function onIngredientPick() { playSound('ingredient-pick'); }
export function onButtonClick() { playSound('button-click'); }
export function onPanelOpen() { playSound('panel-open'); }
export function onPanelClose() { playSound('panel-close'); }
export function onCrierAnnounce() { playSound('crier-trumpet'); }
export function onBarrelPlace() { playSound('barrel-place'); }
export function onBarrelComplete() { playSound('barrel-complete'); }
export function onJournalOpen() { playSound('journal-open'); }
export function onMilestone() { playSound('milestone'); }
