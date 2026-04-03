// ═══ BREWMASTER'S BAZAAR — Main Entry Point ═══
// Vibe Jam 2026 | ThreeJS + Vanilla JS
// No loading screen. No menus. Name → cart name → brew → play.

import state from './systems/state.js';
import { loadGameData } from './systems/data-loader.js';
import { executeBrew, getBrewCost } from './systems/brewing.js';
import { spawnCustomer, updateCustomers, serveDrink, getSpawnInterval } from './systems/customers.js';
import { detectRegion, getOriginBadge } from './systems/geolocation.js';
import { initMerchant, checkMerchantRestock, isMerchantAvailable } from './systems/merchant.js';
import { updateForageNodes, updateGardenPlots } from './systems/garden.js';
import { updateBarrels } from './systems/barrel-aging.js';
import { reapplyEquipmentEffects } from './systems/progression.js';
import { initScene, setCauldronColor, spawnBubbles, spawnSteam, spawnSparkles, spawnCoinScatter, spawnCustomerMesh, removeCustomerMesh, updateCartVisuals } from './scene/scene.js';
import { initForagingScene, updateForagingScene, activateForagingScene, deactivateForagingScene, isForagingActive, resizeForagingScene } from './scene/foraging-scene.js';
import { showHud, updateHud } from './ui/hud.js';
import { showShelf, renderShelf, setIngredientClickHandler } from './ui/shelf.js';
import { showCauldron, renderCauldron, setCauldronHandlers } from './ui/cauldron-ui.js';
import { showCustomerPanel, renderCustomers, setServeHandler } from './ui/customer-ui.js';
import { initJournal } from './ui/journal.js';
// Week 4 imports
import { startMusic, onIngredientAdded, onBrewStart, onBrewComplete, onCoinEarned, onCustomerArrive, onCustomerReact, onHotStreak, onButtonClick, onCrierAnnounce } from './systems/audio.js';
import { recordFailedAttempt } from './systems/hints.js';
import { checkMilestones } from './systems/milestones.js';
import { checkIncomingPortal, createPortal, updatePortal, activatePortal, isPortalHit, showPortalWelcome } from './ui/portal.js';
import { initSettings } from './ui/settings-ui.js';
import { initResult, showResult } from './ui/result.js';
import { notify } from './ui/notifications.js';
import { initMerchantUI, openMerchantUI } from './ui/merchant-ui.js';
import { initGardenUI, openGardenUI, closeGardenUI, renderGarden } from './ui/garden-ui.js';
import { initBarrelUI, openBarrelUI, renderBarrels } from './ui/barrel-ui.js';
import { initEquipmentUI, openEquipmentUI } from './ui/equipment-ui.js';
import { initEncyclopedia, openEncyclopedia } from './ui/encyclopedia-ui.js';
import { initMarketplaceUI, openMarketplace } from './ui/marketplace-ui.js';
import { initTradeUI, openTrade } from './ui/trade-ui.js';
import { initExportUI, openExport } from './ui/export-ui.js';
import { initLeaderboardUI, openLeaderboard } from './ui/leaderboard-ui.js';
import { initCrierUI, updateCrier, showCommissionAlert } from './ui/crier-ui.js';
import { initCommissionUI, openCommission } from './ui/commission-ui.js';
import { initMultiplayer, createServerPlayer, startPolling, setMultiplayerCallbacks, onRecipeDiscovered, onSellDrink, onLevelUp, queueSave, doSave, isConnected } from './systems/multiplayer.js';
import { hasSession } from './systems/api-client.js';

console.log('🍺 Brewmaster\'s Bazaar loading...');

// ═══ INTRO FLOW ═══
const introOverlay = document.getElementById('intro-overlay');
const nameInput = document.getElementById('name-input');
const cartInput = document.getElementById('cart-input');
const introName = document.getElementById('intro-name');
const introCart = document.getElementById('intro-cart');

let gameStarted = false;
let customerMeshes = new Map(); // customerId -> THREE mesh
let forageCanvas = null;

// Check for incoming portal BEFORE anything else
const portalData = checkIncomingPortal();

// Load data immediately, then check for existing session
loadGameData().then(async () => {
  console.log('📦 Game data loaded!');
  initScene();
  
  // If incoming portal player, skip name entry
  if (portalData && portalData.isPortal) {
    state.playerName = portalData.username;
    state.cartName = `${portalData.username}'s Cart`;
    console.log(`🌀 Portal arrival: ${portalData.username}`);
    startGame(true); // pass isPortal flag
    return;
  }
  
  // Try to restore session from server
  const restored = await initMultiplayer();
  if (restored && state.playerName && state.cartName) {
    console.log('🌐 Session restored from server');
    startGame();
  }
}).catch(err => {
  console.error('Failed to load game data:', err);
});

// Name input
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && nameInput.value.trim()) {
    state.playerName = nameInput.value.trim();
    introName.style.display = 'none';
    introCart.style.display = 'block';
    cartInput.focus();
  }
});

// Cart name input
cartInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && cartInput.value.trim()) {
    state.cartName = cartInput.value.trim();
    startGame();
  }
});

// ═══ START GAME ═══
async function startGame(isPortal = false) {
  introOverlay.style.display = 'none';
  gameStarted = true;
  
  // Detect region (async, non-blocking)
  detectRegion().then(() => {
    const badge = getOriginBadge();
    if (badge) notify(`🌍 Origin: ${badge}`);
    renderShelf(); // Update shelf with regional ingredients
    renderGarden();
    // Create player on server after region is detected
    createServerPlayer();
  });
  
  // Initialize merchant
  initMerchant(state.merchantStockData, state.merchantDialogueData);
  
  // Reapply equipment effects
  reapplyEquipmentEffects();
  
  // Show all UI
  showHud();
  showShelf();
  showCauldron();
  showCustomerPanel();
  initJournal();
  initResult();
  initMerchantUI();
  initGardenUI();
  initBarrelUI();
  initEquipmentUI();
  initEncyclopedia();
  
  // Week 3: Multiplayer UI
  initMarketplaceUI();
  initTradeUI();
  initExportUI();
  initLeaderboardUI();
  initCrierUI();
  initCommissionUI();
  
  // Week 4: Settings, Portal, Audio
  initSettings();
  
  // Create portal in scene
  if (state.scene) {
    createPortal(state.scene);
  }
  
  // Start background music (lazy-loaded, non-blocking)
  // First user interaction will unlock audio context
  document.addEventListener('click', function unlockAudio() {
    startMusic();
    document.removeEventListener('click', unlockAudio);
  }, { once: true });
  
  // Portal welcome message
  if (isPortal) {
    setTimeout(() => showPortalWelcome(state.playerName), 1500);
  }
  
  // Set up multiplayer callbacks
  setMultiplayerCallbacks({
    onEconomy: (data) => { /* economy updates handled in state */ },
    onCrier: (announcements) => { updateCrier(announcements); onCrierAnnounce(); },
    onCommission: (commission) => {
      if (commission && commission.definition) {
        showCommissionAlert(commission);
      }
    },
  });
  
  // Start server polling
  startPolling();
  
  // Set up interaction handlers
  setupHandlers();
  
  // Start game loop (requestAnimationFrame-based)
  requestAnimationFrame(gameLoop);
  
  // Spawn first customer quickly
  setTimeout(() => {
    const customer = spawnCustomer();
    if (customer) {
      const mesh = spawnCustomerMesh();
      customerMeshes.set(customer.id, mesh);
      onCustomerArrive();
    }
    renderCustomers();
  }, 3000);
  
  // Tutorial toast
  setTimeout(() => {
    notify('💡 Select a base, add ingredients, choose a method, then BREW!');
  }, 1000);
  
  // Default selections
  state.selectedBase = 'honey';
  state.selectedMethod = 'boil';
  renderCauldron();
  
  updateHud();
}

// ═══ VIEW SWITCHING ═══
function switchToForaging() {
  state.currentView = 'foraging';
  
  // Hide cart UI panels
  document.getElementById('shelf-panel').style.display = 'none';
  document.getElementById('cauldron-panel').style.display = 'none';
  document.getElementById('customer-panel').style.display = 'none';
  
  // Show foraging canvas
  const mainCanvas = document.getElementById('game-canvas');
  
  if (!forageCanvas) {
    forageCanvas = document.createElement('canvas');
    forageCanvas.id = 'forage-canvas';
    forageCanvas.width = mainCanvas.width;
    forageCanvas.height = mainCanvas.height;
    forageCanvas.style.cssText = mainCanvas.style.cssText;
    forageCanvas.style.position = 'fixed';
    forageCanvas.style.inset = '0';
    forageCanvas.style.width = '100vw';
    forageCanvas.style.height = '100vh';
    forageCanvas.style.zIndex = '0';
    document.body.insertBefore(forageCanvas, mainCanvas);
    initForagingScene(forageCanvas);
  }
  
  mainCanvas.style.display = 'none';
  forageCanvas.style.display = 'block';
  activateForagingScene();
  
  // Show garden UI
  openGardenUI();
  
  // Show back button
  document.getElementById('back-to-cart-btn').style.display = 'block';
}

function switchToCart() {
  state.currentView = 'cart';
  
  const mainCanvas = document.getElementById('game-canvas');
  mainCanvas.style.display = 'block';
  
  if (forageCanvas) {
    forageCanvas.style.display = 'none';
    deactivateForagingScene();
  }
  
  // Show cart UI panels
  document.getElementById('shelf-panel').style.display = 'block';
  document.getElementById('cauldron-panel').style.display = 'block';
  document.getElementById('customer-panel').style.display = 'block';
  
  // Hide garden UI
  closeGardenUI();
  
  // Hide back button
  document.getElementById('back-to-cart-btn').style.display = 'none';
  
  renderShelf();
  renderCauldron();
  renderCustomers();
}

// ═══ HANDLERS ═══
function setupHandlers() {
  // Ingredient shelf → cauldron
  setIngredientClickHandler((ingredientId) => {
    if (state.isBrewing) return;
    if (state.cauldronSlots.length >= state.maxFlavorSlots) {
      notify('Cauldron is full! Remove an ingredient or brew.');
      return;
    }
    if (state.cauldronSlots.includes(ingredientId)) {
      notify('Already in the cauldron!');
      return;
    }
    
    state.cauldronSlots.push(ingredientId);
    
    // Visual feedback — change cauldron color based on ingredients
    updateCauldronVisuals();
    
    // Audio
    onIngredientAdded();
    
    renderShelf();
    renderCauldron();
    notify(`Added ${getIngredientName(ingredientId)} to cauldron`);
  });
  
  // Cauldron handlers
  setCauldronHandlers({
    onBaseSelect: (baseId) => {
      if (state.isBrewing) return;
      state.selectedBase = baseId;
      updateCauldronVisuals();
      renderCauldron();
    },
    onMethodSelect: (method) => {
      if (state.isBrewing) return;
      state.selectedMethod = method;
      renderCauldron();
    },
    onSlotRemove: (slotIndex) => {
      if (state.isBrewing) return;
      state.cauldronSlots.splice(slotIndex, 1);
      updateCauldronVisuals();
      renderShelf();
      renderCauldron();
    },
    onBrew: () => {
      if (state.isBrewing) return;
      doBrew();
    },
  });
  
  // Serve handler
  setServeHandler((customerId, drinkIndex) => {
    doServe(customerId, drinkIndex);
  });
  
  // HUD buttons
  document.getElementById('merchant-btn')?.addEventListener('click', () => {
    openMerchantUI(() => { renderShelf(); updateHud(); });
  });
  
  document.getElementById('garden-btn')?.addEventListener('click', () => {
    switchToForaging();
  });
  
  document.getElementById('barrel-btn')?.addEventListener('click', () => {
    openBarrelUI();
  });
  
  document.getElementById('equipment-btn')?.addEventListener('click', () => {
    openEquipmentUI(() => {
      updateCartVisuals(state.breweryLevel);
      renderCauldron();
      renderShelf();
      updateHud();
    });
  });
  
  document.getElementById('back-to-cart-btn')?.addEventListener('click', () => {
    switchToCart();
  });
  
  // Week 3: Multiplayer buttons
  document.getElementById('marketplace-btn')?.addEventListener('click', () => {
    openMarketplace(() => { renderShelf(); updateHud(); });
  });
  
  document.getElementById('trade-btn')?.addEventListener('click', () => {
    openTrade(() => { renderShelf(); updateHud(); });
  });
  
  document.getElementById('export-btn')?.addEventListener('click', () => {
    openExport(() => { renderShelf(); updateHud(); });
  });
  
  document.getElementById('leaderboard-btn')?.addEventListener('click', () => {
    openLeaderboard();
  });
  
  document.getElementById('commission-btn')?.addEventListener('click', () => {
    openCommission(() => { updateHud(); });
  });
  
  // Portal click detection on game canvas
  const gameCanvas = document.getElementById('game-canvas');
  gameCanvas?.addEventListener('click', (e) => {
    if (state.currentView !== 'cart' || !state.camera || !state.scene) return;
    
    const rect = gameCanvas.getBoundingClientRect();
    import('three').then(({ Raycaster, Vector2 }) => {
      const mouse = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, state.camera);
      const intersects = raycaster.intersectObjects(state.scene.children, true);
      if (isPortalHit(intersects)) {
        activatePortal();
      }
    });
  });
}

// ═══ BREWING ═══
function doBrew() {
  if (!state.selectedBase || !state.selectedMethod) {
    notify('Select a base and method first!');
    return;
  }
  
  const cost = getBrewCost();
  if (state.crowns < cost) {
    notify(`Need ${cost} crowns! You have ${state.crowns}.`, 'gold');
    return;
  }
  
  state.isBrewing = true;
  renderCauldron();
  
  // Get brew time from config (apply speed multiplier)
  const brewTimes = state.gameConfig?.brewing?.brewTimeSeconds || {};
  const baseTime = (brewTimes[state.selectedMethod] || 5) * 1000;
  const brewTime = Math.round(baseTime * (state.brewSpeedMultiplier || 1.0));
  
  // Audio: brew start
  onBrewStart();
  
  // Show brewing animation
  const brewingOverlay = document.getElementById('brewing-overlay');
  const brewingText = document.getElementById('brewing-text');
  brewingOverlay.style.display = 'flex';
  
  const methodLabels = { boil: 'Boiling', ferment: 'Fermenting', distill: 'Distilling' };
  brewingText.textContent = `${methodLabels[state.selectedMethod] || 'Brewing'}...`;
  
  // Spawn visual effects during brew
  const effectInterval = setInterval(() => {
    spawnBubbles(3);
    if (Math.random() > 0.5) spawnSteam(2);
  }, 500);
  
  // Color shift during brewing
  const colorShiftInterval = setInterval(() => {
    const colors = [0x3A6A4A, 0x6A4A3A, 0x4A3A6A, 0x6A6A3A, 0x3A4A6A];
    setCauldronColor(colors[Math.floor(Math.random() * colors.length)]);
  }, 800);
  
  setTimeout(() => {
    clearInterval(effectInterval);
    clearInterval(colorShiftInterval);
    brewingOverlay.style.display = 'none';
    
    // Execute the brew
    const result = executeBrew();
    state.isBrewing = false;
    
    if (!result) {
      renderCauldron();
      return;
    }
    
    // Visual feedback
    if (result.isNew) {
      spawnSparkles(20);
      setCauldronColor(0xFFDD44);
    } else if (result.nearMiss) {
      spawnSparkles(8);
      setCauldronColor(0xFF8844);
    } else if (result.recipe && result.recipe.id === 'mystery_slop') {
      setCauldronColor(0x4A3A2A);
    } else {
      spawnSteam(6);
    }
    
    // Audio: brew complete
    onBrewComplete(result.isNew, result.nearMiss);
    
    // Hints: record failed attempt
    if (!result.isNew && !result.recipe?.id?.startsWith('mystery') === false) {
      recordFailedAttempt(state.selectedBase, [...state.cauldronSlots], state.selectedMethod);
    }
    if (result.nearMiss || (result.recipe && result.recipe.id === 'mystery_slop')) {
      recordFailedAttempt(state.selectedBase, [...state.cauldronSlots], state.selectedMethod);
    }
    
    // Milestones: check after discovery
    if (result.isNew) {
      checkMilestones();
    }
    
    // Show result
    showResult(result, () => {
      // Reset cauldron after dismiss
      state.cauldronSlots = [];
      // Keep base and method selected for convenience
      updateCauldronVisuals();
      renderCauldron();
      renderShelf();
      renderCustomers();
      updateHud();
    });
    
    // Notify server of discovery
    if (result.isNew && result.recipe) {
      onRecipeDiscovered(result.recipe.id);
    }
    
    // Auto-save on brew
    queueSave();
    updateHud();
    
  }, brewTime);
}

// ═══ SERVING ═══
function doServe(customerId, drinkIndex) {
  const result = serveDrink(customerId, drinkIndex);
  if (!result) return;
  
  // Show feedback
  const qualityMessages = {
    perfect: `${result.reaction} +${result.payment} crowns! "${result.dialogue}"`,
    good: `${result.reaction} +${result.payment} crowns. "${result.dialogue}"`,
    bad: `${result.reaction} +${result.payment} crown. "${result.dialogue}"`,
  };
  
  notify(qualityMessages[result.quality] || `+${result.payment} crowns`, 
    result.quality === 'perfect' ? 'gold' : '');
  
  // Audio
  onCoinEarned(result.payment);
  onCustomerReact(result.quality);
  
  // Notify server of sell
  if (result.customer?.data?.id) {
    onSellDrink(result.recipeId || 'unknown', result.customer.id);
  }
  
  // Auto-save on serve
  queueSave();
  
  // Coin scatter particles on sale
  if (result.payment > 5) spawnCoinScatter(Math.min(result.payment / 5, 12));
  
  // Floating feedback
  showServeFeedback(result.reaction, result.payment);
  
  // Remove customer mesh after delay
  setTimeout(() => {
    const mesh = customerMeshes.get(customerId);
    if (mesh) {
      removeCustomerMesh(mesh);
      customerMeshes.delete(customerId);
    }
  }, 1500);
  
  renderCustomers();
  updateHud();
}

function showServeFeedback(emoji, payment) {
  const el = document.createElement('div');
  el.className = 'serve-feedback';
  el.textContent = `${emoji} +${payment}c`;
  el.style.right = '120px';
  el.style.top = '200px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ═══ GAME LOOP ═══
let lastGameTick = 0;
const GAME_TICK_INTERVAL = 1000; // 1 second for game logic

function gameLoop(timestamp) {
  if (!gameStarted) return;
  
  requestAnimationFrame(gameLoop);
  
  // Throttle game logic to ~1Hz (animations run at render framerate in scene.js)
  if (timestamp - lastGameTick < GAME_TICK_INTERVAL) return;
  lastGameTick = timestamp;
  
  // Update customers (even in foraging view — they wait!)
  updateCustomers();
  
  // Update garden growth timers
  updateGardenPlots();
  
  // Update barrel aging
  updateBarrels();
  
  // Check merchant restock
  checkMerchantRestock();
  
  // Update foraging scene if active
  if (isForagingActive()) {
    updateForagingScene(0.016);
    renderGarden();
  }
  
  // Spawn new customers (only while on cart view)
  if (state.currentView === 'cart') {
    const now = Date.now();
    const interval = getSpawnInterval();
    if (now - state.lastCustomerSpawn > interval && state.customerQueue.filter(c => !c.served).length < 3) {
      const customer = spawnCustomer();
      if (customer) {
        state.lastCustomerSpawn = now;
        const mesh = spawnCustomerMesh();
        customerMeshes.set(customer.id, mesh);
        onCustomerArrive();
      }
    }
    
    // Update portal animation
    if (state.scene) updatePortal(1.0, state.scene);
    
    // Clean up meshes for departed customers
    const activeIds = new Set(state.customerQueue.map(c => c.id));
    for (const [id, mesh] of customerMeshes) {
      if (!activeIds.has(id)) {
        removeCustomerMesh(mesh);
        customerMeshes.delete(id);
      }
    }
    
    // Update UI
    renderCustomers();
  }
  
  updateHud();
}

// ═══ HELPERS ═══
function getIngredientName(id) {
  const ing = state.ingredients.find(i => i.id === id);
  return ing ? `${ing.emoji} ${ing.name}` : id;
}

function updateCauldronVisuals() {
  // Calculate a color based on ingredients in cauldron
  if (state.cauldronSlots.length === 0) {
    // Base color only
    const baseColors = { grain: 0x8A7A4A, honey: 0xD4A44C, fruit: 0xAA4455, none: 0x6688AA };
    setCauldronColor(baseColors[state.selectedBase] || 0x3A6A4A);
    return;
  }
  
  // Mix ingredient tag colors
  let r = 0, g = 0, b = 0, count = 0;
  
  const tagColors = {
    sweet: [0.9, 0.8, 0.3], fruity: [0.8, 0.3, 0.4], spicy: [0.9, 0.4, 0.1],
    floral: [0.8, 0.5, 0.7], herbal: [0.3, 0.7, 0.3], earthy: [0.5, 0.4, 0.2],
    dark: [0.2, 0.15, 0.1], bitter: [0.3, 0.5, 0.2], warm: [0.8, 0.5, 0.2],
    cool: [0.3, 0.5, 0.8], tart: [0.9, 0.3, 0.3], umami: [0.4, 0.3, 0.2],
    exotic: [0.7, 0.5, 0.8], fiery: [0.9, 0.2, 0.05], ethereal: [0.6, 0.7, 0.9],
    golden: [0.85, 0.7, 0.2], blue: [0.2, 0.3, 0.9], smoky: [0.3, 0.25, 0.2],
  };
  
  for (const ingId of state.cauldronSlots) {
    const ing = state.ingredients.find(i => i.id === ingId);
    if (ing) {
      for (const tag of ing.tags) {
        const tc = tagColors[tag];
        if (tc) { r += tc[0]; g += tc[1]; b += tc[2]; count++; }
      }
    }
  }
  
  // Mix with base color
  const baseContrib = { grain: [0.5, 0.45, 0.25], honey: [0.8, 0.65, 0.25], fruit: [0.7, 0.25, 0.3], none: [0.4, 0.5, 0.6] };
  const bc = baseContrib[state.selectedBase] || [0.4, 0.4, 0.4];
  r += bc[0]; g += bc[1]; b += bc[2]; count++;
  
  if (count > 0) {
    r /= count; g /= count; b /= count;
  }
  
  const color = (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
  setCauldronColor(color);
}
