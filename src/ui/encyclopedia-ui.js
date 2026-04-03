// ═══ INGREDIENT ENCYCLOPEDIA UI ═══
// Click any ingredient → popup with lore, tier, tags, origin map pin, recipes

import state from '../systems/state.js';

const encyclopediaOverlay = document.getElementById('encyclopedia-overlay');

export function initEncyclopedia() {
  const overlay = document.getElementById('encyclopedia-overlay');
  if (!overlay) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeEncyclopedia();
  });

  const closeBtn = overlay.querySelector('.encyclopedia-close');
  if (closeBtn) closeBtn.addEventListener('click', closeEncyclopedia);
}

export function openEncyclopedia(ingredientId) {
  const overlay = document.getElementById('encyclopedia-overlay');
  if (!overlay) return;

  const ing = state.ingredients.find(i => i.id === ingredientId);
  if (!ing) return;

  const tierNames = { 1: 'Pantry Staple', 2: 'Garden', 3: 'Forest Floor', 4: 'Spice Merchant', 5: 'Exotic', 99: 'Legendary' };
  const tierColors = { 1: '#888', 2: '#6a8', 3: '#86a', 4: '#a86', 5: '#a6a', 99: '#da6' };

  // Find recipes using this ingredient
  const recipesUsing = state.recipes.filter(r =>
    r.ingredients.includes(ingredientId) || r.base === ingredientId
  );
  const discoveredRecipes = recipesUsing.filter(r => state.discoveredRecipes.has(r.id));
  const undiscoveredCount = recipesUsing.length - discoveredRecipes.length;

  // Region info
  const regionName = ing.region || 'Global';
  const regionData = state.regions?.find(r =>
    r.gardenIngredients?.includes(ingredientId)
  );

  const card = overlay.querySelector('.encyclopedia-card') || overlay;

  let html = `
    <div class="encyclopedia-header">
      <span class="encyclopedia-emoji">${ing.emoji}</span>
      <div>
        <h2 class="encyclopedia-name">${ing.name}</h2>
        <span class="encyclopedia-tier" style="color:${tierColors[ing.tier] || '#888'}">
          ${tierNames[ing.tier] || `Tier ${ing.tier}`}
        </span>
      </div>
    </div>

    <div class="encyclopedia-lore">${ing.description || ''}</div>

    <div class="encyclopedia-section">
      <h4>🏷️ Flavor Tags</h4>
      <div class="encyclopedia-tags">
        ${(ing.tags || []).map(t => `<span class="encyclopedia-tag">${t}</span>`).join('')}
      </div>
    </div>

    <div class="encyclopedia-section">
      <h4>🌍 Origin</h4>
      <div class="encyclopedia-origin">
        ${regionData ? `${regionData.emoji} ${regionData.name}` : `🌐 ${regionName}`}
      </div>
    </div>

    <div class="encyclopedia-section">
      <h4>📖 Used in Recipes</h4>
      <div class="encyclopedia-recipes">
        ${discoveredRecipes.map(r => {
          const stars = '★'.repeat(r.stars) + '☆'.repeat(Math.max(0, 5 - r.stars));
          return `<div class="encyclopedia-recipe-item">${stars} ${r.name}</div>`;
        }).join('')}
        ${undiscoveredCount > 0 ? `<div class="encyclopedia-recipe-unknown">${undiscoveredCount} undiscovered recipe${undiscoveredCount > 1 ? 's' : ''}...</div>` : ''}
        ${recipesUsing.length === 0 ? '<div class="encyclopedia-recipe-unknown">No known recipes yet</div>' : ''}
      </div>
    </div>

    <button class="encyclopedia-close">Close</button>
  `;

  card.innerHTML = html;
  overlay.style.display = 'flex';

  // Close handler
  card.querySelector('.encyclopedia-close')?.addEventListener('click', closeEncyclopedia);
}

export function closeEncyclopedia() {
  const overlay = document.getElementById('encyclopedia-overlay');
  if (overlay) overlay.style.display = 'none';
}
