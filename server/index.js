// ═══ BREWMASTER'S BAZAAR — Backend Server ═══
// Express + better-sqlite3 | Week 3: Multiplayer Economy
// No Socket.io — polling only

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ═══ LOAD GAME DATA ═══
const dataDir = join(__dirname, '..', 'data');
const gameConfig = JSON.parse(readFileSync(join(dataDir, 'game-config.json'), 'utf8'));
const regionsData = JSON.parse(readFileSync(join(dataDir, 'regions.json'), 'utf8'));
const commissionsData = JSON.parse(readFileSync(join(dataDir, 'royal-commissions.json'), 'utf8'));
const recipesData = JSON.parse(readFileSync(join(dataDir, 'recipes.json'), 'utf8'));

// ═══ DATABASE SETUP ═══
const db = new Database(join(__dirname, 'brewmasters.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      cart_name TEXT NOT NULL,
      crowns INTEGER DEFAULT 50,
      level INTEGER DEFAULT 1,
      region TEXT DEFAULT 'americas_us',
      origin_region TEXT DEFAULT 'americas_us',
      recipes_discovered TEXT DEFAULT '[]',
      equipment TEXT DEFAULT '[]',
      brewed_drinks TEXT DEFAULT '[]',
      available_ingredients TEXT DEFAULT '[]',
      garden_plots TEXT DEFAULT '[]',
      aging_barrels TEXT DEFAULT '[]',
      served_count INTEGER DEFAULT 0,
      reputation INTEGER DEFAULT 0,
      recipe_mastery TEXT DEFAULT '{}',
      season_score INTEGER DEFAULT 0,
      season_crowns_earned INTEGER DEFAULT 0,
      badges TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS economy (
      recipe_id TEXT PRIMARY KEY,
      base_price INTEGER NOT NULL,
      current_price INTEGER NOT NULL,
      supply_count INTEGER DEFAULT 0,
      demand_count INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS marketplace (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      price INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (seller_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS trade_board (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offerer_id INTEGER NOT NULL,
      offer_items TEXT NOT NULL,
      want_items TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (offerer_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commission_id TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now')),
      ends_at TEXT NOT NULL,
      progress TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      player_id INTEGER NOT NULL,
      season_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      rank INTEGER DEFAULT 0,
      PRIMARY KEY (player_id, season_id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS crier_announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exports_pending (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      recipe_id TEXT NOT NULL,
      target_region TEXT NOT NULL,
      price INTEGER NOT NULL,
      delivers_at TEXT NOT NULL,
      spoilage_chance REAL DEFAULT 0,
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS trade_cooldowns (
      player_id INTEGER PRIMARY KEY,
      trade_count INTEGER DEFAULT 0,
      window_start TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE INDEX IF NOT EXISTS idx_marketplace_expires ON marketplace(expires_at);
    CREATE INDEX IF NOT EXISTS idx_trade_expires ON trade_board(expires_at);
    CREATE INDEX IF NOT EXISTS idx_exports_delivers ON exports_pending(delivers_at);
    CREATE INDEX IF NOT EXISTS idx_crier_created ON crier_announcements(created_at);
  `);

  // Seed economy table with recipe base prices if empty
  const economyCount = db.prepare('SELECT COUNT(*) as cnt FROM economy').get();
  if (economyCount.cnt === 0) {
    seedEconomy();
  }
}

function seedEconomy() {
  const starPrices = { 0: 1, 1: 10, 2: 25, 3: 55, 4: 100, 5: 200 };
  const insert = db.prepare('INSERT OR IGNORE INTO economy (recipe_id, base_price, current_price) VALUES (?, ?, ?)');
  const insertMany = db.transaction((recipes) => {
    for (const recipe of recipes) {
      const basePrice = starPrices[recipe.stars] || 10;
      insert.run(recipe.id, basePrice, basePrice);
    }
  });
  insertMany(recipesData);
}

initDatabase();

// ═══ AUTH MIDDLEWARE ═══
function authMiddleware(req, res, next) {
  const token = req.headers['x-player-token'] || req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const player = db.prepare('SELECT * FROM players WHERE token = ?').get(token);
  if (!player) return res.status(401).json({ error: 'Invalid token' });

  req.player = player;
  next();
}

// ═══ HELPER: get current season ID ═══
function getCurrentSeasonId() {
  const now = new Date();
  const durationDays = gameConfig.seasons?.durationDays || 7;
  const epochMs = new Date('2026-01-01').getTime();
  const weekNum = Math.floor((now.getTime() - epochMs) / (durationDays * 24 * 60 * 60 * 1000));
  return `season_${weekNum}`;
}

// ═══ HELPER: get current season modifier ═══
function getSeasonalModifier() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const mods = gameConfig.seasons?.modifiers || {};
  if (month >= 11 || month <= 1) return mods.winter || null;
  if (month >= 2 && month <= 4) return mods.spring || null;
  if (month >= 5 && month <= 7) return mods.summer || null;
  return mods.autumn || null;
}

// ═══ HELPER: add town crier announcement ═══
function addAnnouncement(message, category = 'general') {
  db.prepare('INSERT INTO crier_announcements (message, category) VALUES (?, ?)').run(message, category);
  // Keep only last 50
  db.prepare(`DELETE FROM crier_announcements WHERE id NOT IN (SELECT id FROM crier_announcements ORDER BY id DESC LIMIT 50)`).run();
}

// ═══ API: Health ═══
app.get('/api/health', (req, res) => {
  const playerCount = db.prepare('SELECT COUNT(*) as cnt FROM players').get().cnt;
  const seasonId = getCurrentSeasonId();
  const seasonal = getSeasonalModifier();
  res.json({
    status: 'ok',
    game: "Brewmaster's Bazaar",
    players: playerCount,
    season: seasonId,
    seasonalModifier: seasonal,
  });
});

// ═══ API: Player Create ═══
app.post('/api/player/create', (req, res) => {
  const { name, cartName, region } = req.body;
  if (!name || !cartName) return res.status(400).json({ error: 'Name and cartName required' });

  const token = crypto.randomBytes(32).toString('hex');
  const playerRegion = region || 'americas_us';

  try {
    const result = db.prepare(`
      INSERT INTO players (token, name, cart_name, region, origin_region, crowns)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(token, name, cartName, playerRegion, playerRegion, gameConfig.economy?.startingGold || 50);

    const playerId = result.lastInsertRowid;

    // Initialize leaderboard entry
    db.prepare('INSERT OR IGNORE INTO leaderboard (player_id, season_id, score) VALUES (?, ?, 0)')
      .run(playerId, getCurrentSeasonId());

    addAnnouncement(`📜 A new brewmaster "${name}" of "${cartName}" has joined the realm!`, 'player');

    res.json({ token, playerId, name, cartName, region: playerRegion });
  } catch (err) {
    console.error('Player create error:', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// ═══ API: Player Load ═══
app.get('/api/player/:token', (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE token = ?').get(req.params.token);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // Parse JSON fields
  const parsed = {
    id: player.id,
    name: player.name,
    cartName: player.cart_name,
    crowns: player.crowns,
    level: player.level,
    region: player.region,
    originRegion: player.origin_region,
    recipesDiscovered: JSON.parse(player.recipes_discovered || '[]'),
    equipment: JSON.parse(player.equipment || '[]'),
    brewedDrinks: JSON.parse(player.brewed_drinks || '[]'),
    availableIngredients: JSON.parse(player.available_ingredients || '[]'),
    gardenPlots: JSON.parse(player.garden_plots || '[]'),
    agingBarrels: JSON.parse(player.aging_barrels || '[]'),
    servedCount: player.served_count,
    reputation: player.reputation,
    recipeMastery: JSON.parse(player.recipe_mastery || '{}'),
    seasonScore: player.season_score,
    badges: JSON.parse(player.badges || '[]'),
    createdAt: player.created_at,
  };

  res.json(parsed);
});

// ═══ API: Player Save ═══
app.post('/api/player/save', authMiddleware, (req, res) => {
  const { crowns, level, region, recipesDiscovered, equipment, brewedDrinks,
    availableIngredients, gardenPlots, agingBarrels, servedCount, reputation,
    recipeMastery } = req.body;

  const updates = [];
  const params = [];

  if (crowns !== undefined) { updates.push('crowns = ?'); params.push(crowns); }
  if (level !== undefined) { updates.push('level = ?'); params.push(level); }
  if (region !== undefined) { updates.push('region = ?'); params.push(region); }
  if (recipesDiscovered !== undefined) { updates.push('recipes_discovered = ?'); params.push(JSON.stringify(recipesDiscovered)); }
  if (equipment !== undefined) { updates.push('equipment = ?'); params.push(JSON.stringify(equipment)); }
  if (brewedDrinks !== undefined) { updates.push('brewed_drinks = ?'); params.push(JSON.stringify(brewedDrinks)); }
  if (availableIngredients !== undefined) { updates.push('available_ingredients = ?'); params.push(JSON.stringify(availableIngredients)); }
  if (gardenPlots !== undefined) { updates.push('garden_plots = ?'); params.push(JSON.stringify(gardenPlots)); }
  if (agingBarrels !== undefined) { updates.push('aging_barrels = ?'); params.push(JSON.stringify(agingBarrels)); }
  if (servedCount !== undefined) { updates.push('served_count = ?'); params.push(servedCount); }
  if (reputation !== undefined) { updates.push('reputation = ?'); params.push(reputation); }
  if (recipeMastery !== undefined) { updates.push('recipe_mastery = ?'); params.push(JSON.stringify(recipeMastery)); }

  updates.push("updated_at = datetime('now')");
  params.push(req.player.id);

  if (updates.length > 1) {
    db.prepare(`UPDATE players SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  res.json({ ok: true });
});

// ═══ API: Economy — Get current prices ═══
app.get('/api/economy', (req, res) => {
  const prices = db.prepare('SELECT * FROM economy').all();
  const seasonal = getSeasonalModifier();
  res.json({ prices, seasonal, season: getCurrentSeasonId() });
});

// ═══ API: Economy — Sell drink locally ═══
app.post('/api/economy/sell', authMiddleware, (req, res) => {
  const { recipeId, customerId } = req.body;
  if (!recipeId) return res.status(400).json({ error: 'recipeId required' });

  const economy = db.prepare('SELECT * FROM economy WHERE recipe_id = ?').get(recipeId);
  if (!economy) return res.status(404).json({ error: 'Recipe not found in economy' });

  const price = economy.current_price;

  // Increase supply count
  db.prepare('UPDATE economy SET supply_count = supply_count + 1, last_updated = datetime(\'now\') WHERE recipe_id = ?')
    .run(recipeId);

  // Update player crowns and season score
  const recipe = recipesData.find(r => r.id === recipeId);
  const tierBonus = { common: 0, fine: 5, rare: 15, legendary: 50, secret: 100 };
  const bonus = tierBonus[recipe?.tier] || 0;

  db.prepare('UPDATE players SET crowns = crowns + ?, served_count = served_count + 1, season_score = season_score + ?, season_crowns_earned = season_crowns_earned + ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(price, price + bonus, price, req.player.id);

  // Update leaderboard
  db.prepare('INSERT OR REPLACE INTO leaderboard (player_id, season_id, score) VALUES (?, ?, COALESCE((SELECT score FROM leaderboard WHERE player_id = ? AND season_id = ?), 0) + ?)')
    .run(req.player.id, getCurrentSeasonId(), req.player.id, getCurrentSeasonId(), price + bonus);

  res.json({ price, bonus, total: price + bonus });
});

// ═══ API: Economy — Export drink ═══
app.post('/api/economy/export', authMiddleware, (req, res) => {
  const { recipeId, targetRegion } = req.body;
  if (!recipeId || !targetRegion) return res.status(400).json({ error: 'recipeId and targetRegion required' });

  const economy = db.prepare('SELECT * FROM economy WHERE recipe_id = ?').get(recipeId);
  if (!economy) return res.status(404).json({ error: 'Recipe not found in economy' });

  const playerRegion = req.player.region;
  const distanceOrder = regionsData.distanceMatrixOrder;
  const distanceMatrix = regionsData.distanceMatrix;

  const fromIdx = distanceOrder.indexOf(playerRegion);
  const toIdx = distanceOrder.indexOf(targetRegion);

  if (fromIdx === -1 || toIdx === -1) return res.status(400).json({ error: 'Invalid region' });

  const distanceBonus = distanceMatrix[playerRegion]?.[toIdx] || 0;

  // Calculate scarcity bonus — how many players in target region can make this
  const totalInRegion = db.prepare('SELECT COUNT(*) as cnt FROM players WHERE region = ?').get(targetRegion).cnt || 1;
  const canMakeIt = db.prepare(`SELECT COUNT(*) as cnt FROM players WHERE region = ? AND recipes_discovered LIKE ?`)
    .get(targetRegion, `%"${recipeId}"%`).cnt;
  const supplyRatio = canMakeIt / Math.max(totalInRegion, 1);
  const scarcityBonus = (1 - supplyRatio) * 0.5;

  // export_price = base_price × (1 + distance_bonus) × (1 + scarcity_bonus)
  const exportPrice = Math.round(economy.base_price * (1 + distanceBonus) * (1 + scarcityBonus));

  // Determine delivery time and spoilage
  const deliveryMinutes = getDeliveryTime(distanceBonus);
  const spoilageChance = getSpoilageChance(distanceBonus);
  const deliveryTime = new Date(Date.now() + deliveryMinutes * 60 * 1000).toISOString();

  // Create pending export
  db.prepare(`INSERT INTO exports_pending (player_id, recipe_id, target_region, price, delivers_at, spoilage_chance)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.player.id, recipeId, targetRegion, exportPrice, deliveryTime, spoilageChance);

  // Increase supply
  db.prepare('UPDATE economy SET supply_count = supply_count + 1, last_updated = datetime(\'now\') WHERE recipe_id = ?')
    .run(recipeId);

  res.json({
    exportPrice,
    deliveryMinutes,
    spoilageChance,
    distanceBonus: Math.round(distanceBonus * 100),
    scarcityBonus: Math.round(scarcityBonus * 100),
    deliversAt: deliveryTime,
  });
});

function getDeliveryTime(distance) {
  const cfg = gameConfig.economy?.exportDeliveryMinutes || {};
  if (distance <= 0) return cfg.sameRegion || 10;
  if (distance <= 0.3) return cfg.adjacent || 20;
  if (distance <= 0.6) return cfg.far || 30;
  return cfg.opposite || 45;
}

function getSpoilageChance(distance) {
  const cfg = gameConfig.economy?.exportSpoilageChance || {};
  if (distance <= 0) return cfg.sameRegion || 0;
  if (distance <= 0.3) return cfg.adjacent || 0;
  if (distance <= 0.6) return cfg.far || 0.05;
  return cfg.opposite || 0.10;
}

// ═══ API: Marketplace — Browse ═══
app.get('/api/marketplace', (req, res) => {
  const listings = db.prepare(`
    SELECT m.*, p.name as seller_name, p.cart_name as seller_cart, p.region as seller_region
    FROM marketplace m
    JOIN players p ON m.seller_id = p.id
    WHERE m.expires_at > datetime('now')
    ORDER BY m.created_at DESC
    LIMIT 100
  `).all();

  res.json({ listings });
});

// ═══ API: Marketplace — Create listing ═══
app.post('/api/marketplace/list', authMiddleware, (req, res) => {
  const { type, itemId, quantity, price } = req.body;
  if (!type || !itemId || !quantity || !price) {
    return res.status(400).json({ error: 'type, itemId, quantity, price required' });
  }

  // Max listings check
  const maxListings = gameConfig.economy?.marketplace?.maxListings || 10;
  const currentListings = db.prepare('SELECT COUNT(*) as cnt FROM marketplace WHERE seller_id = ? AND expires_at > datetime(\'now\')')
    .get(req.player.id).cnt;
  if (currentListings >= maxListings) {
    return res.status(400).json({ error: `Max ${maxListings} active listings` });
  }

  // Price floor/ceiling
  const floorMult = gameConfig.economy?.marketplace?.priceFloorMultiplier || 0.5;
  const ceilMult = gameConfig.economy?.marketplace?.priceCeilingMultiplier || 10;
  // We'd need base cost per item, but for now just enforce min 1
  if (price < 1) return res.status(400).json({ error: 'Price too low' });

  // Hoarding check
  const maxPerItem = gameConfig.economy?.maxInventoryPerItem || 50;
  if (quantity > maxPerItem) {
    return res.status(400).json({ error: `Max ${maxPerItem} per item` });
  }

  const expiryHours = gameConfig.economy?.marketplace?.listingExpiryHours || 24;
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO marketplace (seller_id, item_type, item_id, quantity, price, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.player.id, type, itemId, quantity, price, expiresAt);

  res.json({ ok: true, expiresAt });
});

// ═══ API: Marketplace — Buy listing ═══
app.post('/api/marketplace/buy', authMiddleware, (req, res) => {
  const { listingId } = req.body;
  if (!listingId) return res.status(400).json({ error: 'listingId required' });

  const listing = db.prepare('SELECT * FROM marketplace WHERE id = ? AND expires_at > datetime(\'now\')').get(listingId);
  if (!listing) return res.status(404).json({ error: 'Listing not found or expired' });

  if (listing.seller_id === req.player.id) {
    return res.status(400).json({ error: "Can't buy your own listing" });
  }

  const totalCost = listing.price * listing.quantity;
  const fee = Math.round(totalCost * (gameConfig.economy?.transactionFee || 0.05));

  if (req.player.crowns < totalCost) {
    return res.status(400).json({ error: `Need ${totalCost} crowns (have ${req.player.crowns})` });
  }

  // Execute transaction
  const buyTransaction = db.transaction(() => {
    // Deduct buyer crowns
    db.prepare('UPDATE players SET crowns = crowns - ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(totalCost, req.player.id);

    // Pay seller (minus fee)
    const sellerPayment = totalCost - fee;
    db.prepare('UPDATE players SET crowns = crowns + ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(sellerPayment, listing.seller_id);

    // Remove listing
    db.prepare('DELETE FROM marketplace WHERE id = ?').run(listingId);
  });

  buyTransaction();

  // Announce big sales (> 100 crowns)
  if (totalCost > 100) {
    const seller = db.prepare('SELECT name, cart_name FROM players WHERE id = ?').get(listing.seller_id);
    addAnnouncement(`📜 A grand trade! ${seller?.name || 'A brewer'} of "${seller?.cart_name}" sold ${listing.quantity}× ${listing.item_id} for ${totalCost}c!`, 'trade');
  }

  res.json({ ok: true, totalCost, fee, itemType: listing.item_type, itemId: listing.item_id, quantity: listing.quantity });
});

// ═══ API: Marketplace — Cancel own listing ═══
app.delete('/api/marketplace/:id', authMiddleware, (req, res) => {
  const listing = db.prepare('SELECT * FROM marketplace WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.seller_id !== req.player.id) return res.status(403).json({ error: 'Not your listing' });

  db.prepare('DELETE FROM marketplace WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ═══ API: Trade Board — Browse ═══
app.get('/api/trades', (req, res) => {
  const trades = db.prepare(`
    SELECT t.*, p.name as offerer_name, p.cart_name as offerer_cart, p.region as offerer_region
    FROM trade_board t
    JOIN players p ON t.offerer_id = p.id
    WHERE t.expires_at > datetime('now')
    ORDER BY t.created_at DESC
    LIMIT 100
  `).all();

  // Parse JSON fields
  const parsed = trades.map(t => ({
    ...t,
    offer_items: JSON.parse(t.offer_items),
    want_items: JSON.parse(t.want_items),
  }));

  res.json({ trades: parsed });
});

// ═══ API: Trade Board — Create offer ═══
app.post('/api/trades/offer', authMiddleware, (req, res) => {
  const { offerItems, wantItems } = req.body;
  if (!offerItems || !wantItems) return res.status(400).json({ error: 'offerItems and wantItems required' });

  const maxOffers = gameConfig.economy?.tradeBoard?.maxOffers || 5;
  const currentOffers = db.prepare('SELECT COUNT(*) as cnt FROM trade_board WHERE offerer_id = ? AND expires_at > datetime(\'now\')')
    .get(req.player.id).cnt;
  if (currentOffers >= maxOffers) {
    return res.status(400).json({ error: `Max ${maxOffers} active trade offers` });
  }

  // Trade cooldown check
  const cooldownCfg = gameConfig.economy?.tradeBoard || {};
  const cooldown = db.prepare('SELECT * FROM trade_cooldowns WHERE player_id = ?').get(req.player.id);
  if (cooldown) {
    const windowStart = new Date(cooldown.window_start).getTime();
    const windowMs = 60 * 60 * 1000; // 1 hour
    if (Date.now() - windowStart < windowMs) {
      if (cooldown.trade_count >= (cooldownCfg.cooldownAfterTrades || 5)) {
        return res.status(429).json({ error: `Trade cooldown! Wait ${cooldownCfg.cooldownMinutes || 30} minutes.` });
      }
    } else {
      // Reset window
      db.prepare('UPDATE trade_cooldowns SET trade_count = 0, window_start = datetime(\'now\') WHERE player_id = ?')
        .run(req.player.id);
    }
  }

  const expiryHours = cooldownCfg.offerExpiryHours || 12;
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO trade_board (offerer_id, offer_items, want_items, expires_at)
    VALUES (?, ?, ?, ?)`)
    .run(req.player.id, JSON.stringify(offerItems), JSON.stringify(wantItems), expiresAt);

  res.json({ ok: true, expiresAt });
});

// ═══ API: Trade Board — Accept trade ═══
app.post('/api/trades/accept', authMiddleware, (req, res) => {
  const { tradeId } = req.body;
  if (!tradeId) return res.status(400).json({ error: 'tradeId required' });

  const trade = db.prepare('SELECT * FROM trade_board WHERE id = ? AND expires_at > datetime(\'now\')').get(tradeId);
  if (!trade) return res.status(404).json({ error: 'Trade not found or expired' });

  if (trade.offerer_id === req.player.id) {
    return res.status(400).json({ error: "Can't accept your own trade" });
  }

  // Update trade cooldown for both
  const updateCooldown = (playerId) => {
    const existing = db.prepare('SELECT * FROM trade_cooldowns WHERE player_id = ?').get(playerId);
    if (existing) {
      db.prepare('UPDATE trade_cooldowns SET trade_count = trade_count + 1 WHERE player_id = ?').run(playerId);
    } else {
      db.prepare('INSERT INTO trade_cooldowns (player_id, trade_count) VALUES (?, 1)').run(playerId);
    }
  };

  const acceptTransaction = db.transaction(() => {
    updateCooldown(req.player.id);
    updateCooldown(trade.offerer_id);
    db.prepare('DELETE FROM trade_board WHERE id = ?').run(tradeId);
  });

  acceptTransaction();

  const offerItems = JSON.parse(trade.offer_items);
  const wantItems = JSON.parse(trade.want_items);

  addAnnouncement(`📜 A trade caravan has arrived! A barter was completed between two brewmasters.`, 'trade');

  res.json({ ok: true, received: offerItems, given: wantItems });
});

// ═══ API: Trade Board — Cancel own offer ═══
app.delete('/api/trades/:id', authMiddleware, (req, res) => {
  const trade = db.prepare('SELECT * FROM trade_board WHERE id = ?').get(req.params.id);
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  if (trade.offerer_id !== req.player.id) return res.status(403).json({ error: 'Not your trade' });

  db.prepare('DELETE FROM trade_board WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ═══ API: Commission — Get current ═══
app.get('/api/commission', (req, res) => {
  const commission = db.prepare(`
    SELECT * FROM commissions WHERE ends_at > datetime('now') ORDER BY started_at DESC LIMIT 1
  `).get();

  if (!commission) return res.json({ commission: null });

  const commissionDef = commissionsData.find(c => c.id === commission.commission_id);
  const progress = JSON.parse(commission.progress || '{}');

  res.json({
    commission: {
      id: commission.id,
      commissionId: commission.commission_id,
      definition: commissionDef,
      startedAt: commission.started_at,
      endsAt: commission.ends_at,
      progress,
    },
  });
});

// ═══ API: Commission — Submit ═══
app.post('/api/commission/submit', authMiddleware, (req, res) => {
  const { recipeIds } = req.body;
  if (!recipeIds || !Array.isArray(recipeIds)) {
    return res.status(400).json({ error: 'recipeIds array required' });
  }

  const commission = db.prepare(`
    SELECT * FROM commissions WHERE ends_at > datetime('now') ORDER BY started_at DESC LIMIT 1
  `).get();

  if (!commission) return res.status(404).json({ error: 'No active commission' });

  const commissionDef = commissionsData.find(c => c.id === commission.commission_id);
  if (!commissionDef) return res.status(500).json({ error: 'Commission definition missing' });

  const progress = JSON.parse(commission.progress || '{}');
  const playerId = req.player.id.toString();
  const playerProgress = progress[playerId] || { count: 0, completed: false };

  if (playerProgress.completed) {
    return res.status(400).json({ error: 'Already completed this commission' });
  }

  // Count valid submissions
  let validCount = 0;
  for (const recipeId of recipeIds) {
    const recipe = recipesData.find(r => r.id === recipeId);
    if (!recipe) continue;

    // Check if recipe matches commission target
    if (matchesCommissionTarget(recipe, commissionDef.target)) {
      validCount++;
    }
  }

  playerProgress.count += validCount;

  // Check completion
  const targetCount = commissionDef.target.count || 1;
  if (playerProgress.count >= targetCount) {
    playerProgress.completed = true;
    const reward = commissionDef.reward || 500;

    db.prepare('UPDATE players SET crowns = crowns + ?, season_score = season_score + ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(reward, Math.round(reward / 2), req.player.id);

    addAnnouncement(`📜 ${req.player.name} of "${req.player.cart_name}" completed the Royal Commission: "${commissionDef.name}"!`, 'commission');
  }

  progress[playerId] = playerProgress;
  db.prepare('UPDATE commissions SET progress = ? WHERE id = ?')
    .run(JSON.stringify(progress), commission.id);

  res.json({
    ok: true,
    validCount,
    totalProgress: playerProgress.count,
    target: targetCount,
    completed: playerProgress.completed,
    reward: playerProgress.completed ? commissionDef.reward : 0,
  });
});

function matchesCommissionTarget(recipe, target) {
  if (target.base && recipe.base !== target.base) return false;
  if (target.tag) {
    const recipeTags = getRecipeTags(recipe);
    if (!recipeTags.includes(target.tag)) return false;
  }
  if (target.minStars && recipe.stars < target.minStars) return false;
  return true;
}

function getRecipeTags(recipe) {
  // Aggregate tags from recipe ingredients
  const tags = [];
  for (const ingId of (recipe.ingredients || [])) {
    const ing = recipesData.find(r => r.id === ingId); // Note: this searches wrong array
    // We don't have ingredients loaded server-side easily, so use recipe-level tags
  }
  // Use recipe-level data
  if (recipe.base === 'honey') tags.push('sweet', 'warm');
  if (recipe.base === 'grain') tags.push('earthy', 'dry');
  if (recipe.base === 'fruit') tags.push('fruity', 'bright');
  if (recipe.tier === 'rare') tags.push('complex');
  if (recipe.tier === 'legendary') tags.push('legendary');
  if (recipe.family) tags.push(recipe.family.toLowerCase());
  // Check ingredient names for tag hints
  for (const ingId of (recipe.ingredients || [])) {
    if (ingId.includes('ginger') || ingId.includes('pepper') || ingId.includes('cinnamon')) tags.push('spicy');
    if (ingId.includes('elderflower') || ingId.includes('chamomile') || ingId.includes('lavender')) tags.push('floral');
    if (ingId.includes('mushroom') || ingId.includes('acorn')) tags.push('earthy');
    if (ingId.includes('berries') || ingId.includes('cherry') || ingId.includes('apple')) tags.push('fruity');
  }
  return [...new Set(tags)];
}

// ═══ API: Leaderboard ═══
app.get('/api/leaderboard', (req, res) => {
  const seasonId = getCurrentSeasonId();
  const leaders = db.prepare(`
    SELECT l.score, l.rank, p.name, p.cart_name, p.level, p.region, p.served_count,
           (SELECT COUNT(*) FROM json_each(p.recipes_discovered)) as recipe_count
    FROM leaderboard l
    JOIN players p ON l.player_id = p.id
    WHERE l.season_id = ?
    ORDER BY l.score DESC
    LIMIT 50
  `).all(seasonId);

  // Assign ranks
  leaders.forEach((l, i) => { l.rank = i + 1; });

  const seasonal = getSeasonalModifier();
  res.json({ season: seasonId, seasonal, leaderboard: leaders });
});

// ═══ API: Town Crier ═══
app.get('/api/crier', (req, res) => {
  const announcements = db.prepare(`
    SELECT * FROM crier_announcements ORDER BY id DESC LIMIT 10
  `).all();

  res.json({ announcements: announcements.reverse() });
});

// ═══ API: Player Exports (check pending) ═══
app.get('/api/exports', authMiddleware, (req, res) => {
  const pending = db.prepare(`
    SELECT * FROM exports_pending WHERE player_id = ? AND resolved = 0 ORDER BY created_at DESC
  `).all(req.player.id);

  const resolved = db.prepare(`
    SELECT * FROM exports_pending WHERE player_id = ? AND resolved = 1 ORDER BY created_at DESC LIMIT 20
  `).all(req.player.id);

  res.json({ pending, resolved });
});

// ═══ API: Regions (for export UI) ═══
app.get('/api/regions', (req, res) => {
  res.json(regionsData);
});

// ═══ API: Recipe first discovery notification ═══
app.post('/api/discovery', authMiddleware, (req, res) => {
  const { recipeId } = req.body;
  if (!recipeId) return res.status(400).json({ error: 'recipeId required' });

  const recipe = recipesData.find(r => r.id === recipeId);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  // Check if anyone else has discovered this recipe
  const existingDiscovery = db.prepare(`
    SELECT id FROM players WHERE recipes_discovered LIKE ? AND id != ?
  `).get(`%"${recipeId}"%`, req.player.id);

  if (!existingDiscovery) {
    // First on server!
    addAnnouncement(`🎉 ${req.player.name} of "${req.player.cart_name}" is the FIRST to discover "${recipe.name}"! ${'⭐'.repeat(recipe.stars)}`, 'discovery');

    // Bonus crowns for first discovery
    const firstBonus = recipe.stars * 25;
    db.prepare('UPDATE players SET crowns = crowns + ?, season_score = season_score + ? WHERE id = ?')
      .run(firstBonus, firstBonus, req.player.id);

    return res.json({ firstOnServer: true, bonus: firstBonus });
  }

  // Increase demand when recipes are discovered
  db.prepare('UPDATE economy SET demand_count = demand_count + 1, last_updated = datetime(\'now\') WHERE recipe_id = ?')
    .run(recipeId);

  res.json({ firstOnServer: false, bonus: 0 });
});

// ═══ API: Level up notification ═══
app.post('/api/levelup', authMiddleware, (req, res) => {
  const { newLevel } = req.body;
  if (!newLevel) return res.status(400).json({ error: 'newLevel required' });

  const levelNames = { 1: 'Handcart', 2: 'Donkey Cart', 3: 'Covered Wagon', 4: 'Grand Caravan', 5: 'Legendary Yatai' };

  db.prepare('UPDATE players SET level = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newLevel, req.player.id);

  if (newLevel >= 3) {
    addAnnouncement(`📜 ${req.player.name} of "${req.player.cart_name}" has upgraded to a ${levelNames[newLevel] || 'new cart'}!`, 'player');
  }

  res.json({ ok: true });
});

// ═══ ECONOMY ENGINE — Tick Loop ═══
function economyTick() {
  const now = new Date().toISOString();

  // 1. Recalculate recipe prices: base_price × (1 + demand_modifier)
  //    demand_modifier = (demand - supply) / max(supply, 1), capped at +100%
  const allEconomy = db.prepare('SELECT * FROM economy').all();
  const updatePrice = db.prepare('UPDATE economy SET current_price = ?, last_updated = ? WHERE recipe_id = ?');

  const priceUpdates = db.transaction(() => {
    for (const entry of allEconomy) {
      const supply = Math.max(entry.supply_count, 1);
      const demandMod = Math.min((entry.demand_count - entry.supply_count) / supply, 1.0);
      const newPrice = Math.max(1, Math.round(entry.base_price * (1 + demandMod)));
      updatePrice.run(newPrice, now, entry.recipe_id);
    }
  });
  priceUpdates();

  // 2. Purge expired marketplace listings
  db.prepare("DELETE FROM marketplace WHERE expires_at <= datetime('now')").run();

  // 3. Purge expired trade board offers
  db.prepare("DELETE FROM trade_board WHERE expires_at <= datetime('now')").run();

  // 4. Resolve pending exports
  resolveExports();

  // 5. Decay supply/demand slowly (prevent runaway)
  db.prepare('UPDATE economy SET supply_count = MAX(0, supply_count - 1), demand_count = MAX(0, demand_count - 1)').run();
}

function resolveExports() {
  const pendingExports = db.prepare(`
    SELECT * FROM exports_pending WHERE resolved = 0 AND delivers_at <= datetime('now')
  `).all();

  for (const exp of pendingExports) {
    const spoiled = Math.random() < exp.spoilage_chance;

    if (spoiled) {
      // Drink lost
      db.prepare('UPDATE exports_pending SET resolved = 1 WHERE id = ?').run(exp.id);
      addAnnouncement(`📜 A shipment from a brewmaster to ${exp.target_region} has spoiled on the journey!`, 'export');
    } else {
      // Pay the player
      db.prepare('UPDATE players SET crowns = crowns + ?, season_crowns_earned = season_crowns_earned + ?, season_score = season_score + ? WHERE id = ?')
        .run(exp.price, exp.price, exp.price, exp.player_id);
      db.prepare('UPDATE exports_pending SET resolved = 1 WHERE id = ?').run(exp.id);

      // Update leaderboard
      db.prepare('INSERT OR REPLACE INTO leaderboard (player_id, season_id, score) VALUES (?, ?, COALESCE((SELECT score FROM leaderboard WHERE player_id = ? AND season_id = ?), 0) + ?)')
        .run(exp.player_id, getCurrentSeasonId(), exp.player_id, getCurrentSeasonId(), exp.price);
    }
  }
}

// ═══ ROYAL COMMISSION — Rotation ═══
function commissionTick() {
  // Check if there's an active commission
  const active = db.prepare("SELECT * FROM commissions WHERE ends_at > datetime('now')").get();
  if (active) return; // Still running

  // Pick a random commission
  if (commissionsData.length === 0) return;
  const pick = commissionsData[Math.floor(Math.random() * commissionsData.length)];
  const endsAt = new Date(Date.now() + (pick.timeMinutes || 120) * 60 * 1000).toISOString();

  db.prepare('INSERT INTO commissions (commission_id, ends_at) VALUES (?, ?)').run(pick.id, endsAt);

  addAnnouncement(`👑 ROYAL COMMISSION: "${pick.name}" — ${pick.description} Reward: ${pick.reward}c!`, 'commission');
}

// ═══ SEASON CHECK — Weekly reset ═══
function seasonCheck() {
  // This runs every tick but only acts when season changes
  // For now, just ensure leaderboard rows exist for current season
  const seasonId = getCurrentSeasonId();
  const players = db.prepare('SELECT id FROM players').all();
  const insert = db.prepare('INSERT OR IGNORE INTO leaderboard (player_id, season_id, score) VALUES (?, ?, 0)');
  for (const p of players) {
    insert.run(p.id, seasonId);
  }
}

// ═══ START TICK LOOPS ═══
// Economy tick every 60 seconds
setInterval(economyTick, 60 * 1000);

// Commission check every 5 minutes (commissions last ~2 hours)
setInterval(commissionTick, 5 * 60 * 1000);

// Season check every 10 minutes
setInterval(seasonCheck, 10 * 60 * 1000);

// Run initial ticks
setTimeout(() => {
  economyTick();
  commissionTick();
  seasonCheck();
  console.log('⚙️  Economy engine started (60s tick)');
  console.log('👑 Commission system started (5m check)');
  console.log(`📅 Current season: ${getCurrentSeasonId()}`);
}, 1000);

// ═══ START SERVER ═══
app.listen(PORT, () => {
  console.log(`🍺 Brewmaster's Bazaar server running on port ${PORT}`);
  console.log(`📊 Database: ${join(__dirname, 'brewmasters.db')}`);
});
