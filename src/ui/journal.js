// ═══ RECIPE JOURNAL UI ═══

import state from '../systems/state.js';
import { openEncyclopedia } from './encyclopedia-ui.js';

const journalOverlay = document.getElementById('journal-overlay');
const journalRecipes = document.getElementById('journal-recipes');
const journalClose = document.getElementById('journal-close');
const journalBtn = document.getElementById('journal-btn');

export function initJournal() {
  journalBtn.addEventListener('click', () => openJournal());
  journalClose.addEventListener('click', () => closeJournal());
  journalOverlay.addEventListener('click', (e) => {
    if (e.target === journalOverlay) closeJournal();
  });
}

function openJournal() {
  renderJournal();
  journalOverlay.style.display = 'flex';
}

function closeJournal() {
  journalOverlay.style.display = 'none';
}

function renderJournal() {
  // Sort: discovered first, then by stars desc
  const allRecipes = [...state.recipes].sort((a, b) => {
    const aDisc = state.discoveredRecipes.has(a.id) ? 0 : 1;
    const bDisc = state.discoveredRecipes.has(b.id) ? 0 : 1;
    if (aDisc !== bDisc) return aDisc - bDisc;
    return b.stars - a.stars;
  });
  
  const discovered = state.discoveredRecipes.size;
  const total = state.recipes.length;
  
  let html = `<p style="text-align:center;color:#a08c6a;margin-bottom:12px">📖 ${discovered} / ${total} recipes discovered</p>`;
  
  for (const recipe of allRecipes) {
    const isDiscovered = state.discoveredRecipes.has(recipe.id);
    const stars = '★'.repeat(recipe.stars) + '☆'.repeat(Math.max(0, 5 - recipe.stars));
    
    if (isDiscovered) {
      // Get ingredient names
      const ingNames = recipe.ingredients.map(id => {
        const ing = state.ingredients.find(i => i.id === id);
        return ing ? `<span class="journal-ingredient-link" data-ing-id="${id}">${ing.emoji} ${ing.name}</span>` : id;
      });
      const base = state.bases.find(b => b.id === recipe.base);
      
      html += `
        <div class="journal-recipe">
          <span class="recipe-stars">${stars}</span>
          <span class="recipe-name">${recipe.name}</span>
          <div class="recipe-lore">${recipe.lore}</div>
          <div class="recipe-details">
            Base: ${base ? `${base.emoji} ${base.name}` : recipe.base} | 
            ${ingNames.length > 0 ? ingNames.join(' + ') + ' | ' : ''}
            Method: ${recipe.method}
          </div>
        </div>
      `;
    } else {
      // Show silhouette — clearer if player has experimented with similar ingredients
      const clarity = getRecipeClarity(recipe);
      const blur = clarity > 0.5 ? '0px' : clarity > 0.3 ? '1px' : '2px';
      const hint = getRecipeHint(recipe, clarity);
      
      html += `
        <div class="journal-recipe undiscovered" style="filter:blur(${blur})">
          <span class="recipe-stars">${stars}</span>
          <span class="recipe-name">??? ${recipe.tier.toUpperCase()} ???</span>
          ${hint ? `<div class="recipe-lore">${hint}</div>` : ''}
        </div>
      `;
    }
  }
  
  journalRecipes.innerHTML = html;
  
  // Ingredient link clicks → encyclopedia
  journalRecipes.querySelectorAll('.journal-ingredient-link').forEach(el => {
    el.style.cursor = 'pointer';
    el.style.textDecoration = 'underline';
    el.style.textDecorationColor = '#6b4c2a';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openEncyclopedia(el.dataset.ingId);
    });
  });
}

/**
 * Calculate how "clear" an undiscovered recipe should appear
 * based on how many of its ingredients the player has used
 */
function getRecipeClarity(recipe) {
  if (recipe.ingredients.length === 0) return 0.2;
  
  let known = 0;
  for (const ingId of recipe.ingredients) {
    if (state.availableIngredients.has(ingId)) known++;
  }
  return known / recipe.ingredients.length;
}

function getRecipeHint(recipe, clarity) {
  if (clarity > 0.5) {
    return `Something with ${recipe.ingredients.length} ingredients... ${recipe.family ? `(${recipe.family})` : ''}`;
  }
  if (clarity > 0.3) {
    return recipe.family ? `A ${recipe.family} recipe...` : `A ${recipe.tier} recipe...`;
  }
  return null;
}
