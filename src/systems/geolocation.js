// ═══ GEOLOCATION SYSTEM ═══
// IP-based region detection → garden bonus ingredients

import state from './state.js';
import { notify } from '../ui/notifications.js';

const COUNTRY_TO_REGION = {
  // Japan/Korea
  JP: 'japan_korea', KR: 'japan_korea',
  // Indonesia/SEA
  ID: 'indonesia_sea', MY: 'indonesia_sea', TH: 'indonesia_sea', VN: 'indonesia_sea',
  PH: 'indonesia_sea', SG: 'indonesia_sea', MM: 'indonesia_sea', KH: 'indonesia_sea', LA: 'indonesia_sea',
  // India/South Asia
  IN: 'india_south_asia', PK: 'india_south_asia', BD: 'india_south_asia', LK: 'india_south_asia', NP: 'india_south_asia',
  // North Africa/Middle East
  MA: 'north_africa_middle_east', DZ: 'north_africa_middle_east', TN: 'north_africa_middle_east',
  EG: 'north_africa_middle_east', LY: 'north_africa_middle_east', SA: 'north_africa_middle_east',
  AE: 'north_africa_middle_east', QA: 'north_africa_middle_east', KW: 'north_africa_middle_east',
  IQ: 'north_africa_middle_east', IR: 'north_africa_middle_east', TR: 'north_africa_middle_east',
  JO: 'north_africa_middle_east', LB: 'north_africa_middle_east', SY: 'north_africa_middle_east',
  OM: 'north_africa_middle_east', BH: 'north_africa_middle_east', YE: 'north_africa_middle_east',
  // France/Western Europe
  FR: 'france_western_europe', ES: 'france_western_europe', PT: 'france_western_europe',
  IT: 'france_western_europe', BE: 'france_western_europe', NL: 'france_western_europe',
  CH: 'france_western_europe', AT: 'france_western_europe', DE: 'france_western_europe',
  // UK/Northern Europe
  GB: 'uk_northern_europe', IE: 'uk_northern_europe', SE: 'uk_northern_europe',
  NO: 'uk_northern_europe', DK: 'uk_northern_europe', FI: 'uk_northern_europe',
  IS: 'uk_northern_europe', PL: 'uk_northern_europe', CZ: 'uk_northern_europe',
  // West Africa
  NG: 'west_africa', GH: 'west_africa', SN: 'west_africa', CI: 'west_africa',
  CM: 'west_africa', ML: 'west_africa', BF: 'west_africa', NE: 'west_africa',
  KE: 'west_africa', ZA: 'west_africa', TZ: 'west_africa', ET: 'west_africa',
  // Latin America
  MX: 'latin_america', GT: 'latin_america', HN: 'latin_america', SV: 'latin_america',
  NI: 'latin_america', CR: 'latin_america', PA: 'latin_america', CO: 'latin_america',
  VE: 'latin_america', PE: 'latin_america', EC: 'latin_america', BO: 'latin_america',
  CL: 'latin_america', AR: 'latin_america', UY: 'latin_america', PY: 'latin_america',
  BR: 'latin_america', CU: 'latin_america', DO: 'latin_america',
  // Americas/US
  US: 'americas_us', CA: 'americas_us',
  // Australia/Oceania
  AU: 'australia_oceania', NZ: 'australia_oceania', FJ: 'australia_oceania', PG: 'australia_oceania',
  // China/East Asia → map to japan_korea (closest)
  CN: 'japan_korea', TW: 'japan_korea', HK: 'japan_korea', MO: 'japan_korea', MN: 'japan_korea',
};

/**
 * Detect player region from IP geolocation.
 * Sets state.region, state.regionData, and unlocks garden ingredients.
 */
export async function detectRegion() {
  const apiUrl = state.gameConfig?.geolocation?.apiUrl || 'https://ipapi.co/json/';
  const fallback = state.gameConfig?.geolocation?.fallbackRegion || 'americas_us';

  let regionId = fallback;
  let countryCode = null;

  try {
    const resp = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const data = await resp.json();
      countryCode = data.country_code || data.country;
      if (countryCode && COUNTRY_TO_REGION[countryCode]) {
        regionId = COUNTRY_TO_REGION[countryCode];
      }
    }
  } catch (err) {
    console.warn('Geolocation failed, using fallback region:', err.message);
  }

  applyRegion(regionId, countryCode);
}

/**
 * Apply a region to the player state
 */
export function applyRegion(regionId, countryCode) {
  const regionsData = state.regions || [];
  const regionInfo = regionsData.find(r => r.id === regionId);

  if (!regionInfo) {
    console.warn(`Region ${regionId} not found in regions.json`);
    return;
  }

  const previousRegion = state.region;
  state.region = regionId;
  state.regionData = regionInfo;
  state.countryCode = countryCode;

  // Unlock garden bonus ingredients
  const gardenIngredients = regionInfo.gardenIngredients || [];
  for (const ingId of gardenIngredients) {
    state.availableIngredients.add(ingId);
    // Also mark as free garden ingredients
    if (!state.gardenPlots) state.gardenPlots = [];
    // Auto-plant wild regional ingredients
    const existing = state.gardenPlots.find(p => p.ingredientId === ingId && p.type === 'wild');
    if (!existing) {
      state.gardenPlots.push({
        ingredientId: ingId,
        type: 'wild', // grows free, regrows automatically
        plantedAt: Date.now(),
        growthMs: 0, // wild = always ready
        harvestsRemaining: Infinity,
        ready: true,
      });
    }
  }

  // If region changed (IP change), replant garden
  if (previousRegion && previousRegion !== regionId) {
    // Remove old wild plots
    state.gardenPlots = state.gardenPlots.filter(p => p.type !== 'wild');
    // Add new wild plots
    for (const ingId of gardenIngredients) {
      state.gardenPlots.push({
        ingredientId: ingId,
        type: 'wild',
        plantedAt: Date.now(),
        growthMs: 0,
        harvestsRemaining: Infinity,
        ready: true,
      });
    }
    notify(`🌍 ${state.gameConfig?.geolocation?.relocationMessage || "You've arrived in a new land!"}`);
  }

  console.log(`🌍 Region: ${regionInfo.name} (${regionInfo.emoji}) — garden: ${gardenIngredients.join(', ')}`);
}

/**
 * Get the player's origin badge text
 */
export function getOriginBadge() {
  if (!state.regionData) return '';
  return `${state.regionData.emoji} ${state.regionData.name}`;
}
