// ═══ BREWMASTER'S BAZAAR — Main Entry Point ═══
// Vibe Jam 2026 | ThreeJS + Vanilla JS
// No loading screen. No menus. Name → cart name → brew → play.

import state from './systems/state.js';
import { loadGameData } from './systems/data-loader.js';
import { executeBrew, getBrewCost } from './systems/brewing.js';
import { spawnCustomer, updateCustomers, serveDrink, getSpawnInterval } from './systems/customers.js';
import { initScene, setCauldronColor, spawnBubbles, spawnSteam, spawnSparkles, spawnCustomerMesh, removeCustomerMesh } from './scene/scene.js';
import { showHud, updateHud } from './ui/hud.js';
import { showShelf, renderShelf, setIngredientClickHandler } from './ui/shelf.js';
import { showCauldron, renderCauldron, setCauldronHandlers } from './ui/cauldron-ui.js';
import { showCustomerPanel, renderCustomers, setServeHandler } from './ui/customer-ui.js';
import { initJournal } from './ui/journal.js';
import { initResult, showResult } from './ui/result.js';
import { notify } from './ui/notifications.js';

console.log('🍺 Brewmaster\'s Bazaar loading...');

// ═══ INTRO FLOW ═══
const introOverlay = document.getElementById('intro-overlay');
const nameInput = document.getElementById('name-input');
const cartInput = document.getElementById('cart-input');
const introName = document.getElementById('intro-name');
const introCart = document.getElementById('intro-cart');

let gameStarted = false;
let customerMeshes = new Map(); // customerId -> THREE mesh

// Load data immediately
loadGameData().then(() => {
  console.log('📦 Game data loaded!');
  initScene();
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
function startGame() {
  introOverlay.style.display = 'none';
  gameStarted = true;
  
  // Show all UI
  showHud();
  showShelf();
  showCauldron();
  showCustomerPanel();
  initJournal();
  initResult();
  
  // Set up interaction handlers
  setupHandlers();
  
  // Start game loop
  gameLoop();
  
  // Spawn first customer quickly
  setTimeout(() => {
    const customer = spawnCustomer();
    if (customer) {
      const mesh = spawnCustomerMesh();
      customerMeshes.set(customer.id, mesh);
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
  
  // Get brew time from config
  const brewTimes = state.gameConfig?.brewing?.brewTimeSeconds || {};
  const brewTime = (brewTimes[state.selectedMethod] || 5) * 1000;
  
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
function gameLoop() {
  if (!gameStarted) return;
  
  // Update customers
  updateCustomers();
  
  // Spawn new customers
  const now = Date.now();
  const interval = getSpawnInterval();
  if (now - state.lastCustomerSpawn > interval && state.customerQueue.filter(c => !c.served).length < 3) {
    const customer = spawnCustomer();
    if (customer) {
      state.lastCustomerSpawn = now;
      const mesh = spawnCustomerMesh();
      customerMeshes.set(customer.id, mesh);
    }
  }
  
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
  updateHud();
  
  // Continue loop
  setTimeout(gameLoop, 1000);
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
