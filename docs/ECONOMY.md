# 💰 Brewmaster's Bazaar — Economy Design

Currency: **Crowns (c)**. Single currency. No gems, no premium currency.

---

## 1. INGREDIENT COSTS

### Base Costs (per use)
| Base | Cost | Notes |
|------|------|-------|
| Water | Free | Always implicit |
| Grain | 2c | Abundant, cheap |
| Honey | 5c | Sweeter = pricier |
| Fruit (apple/berries/cherry) | 3c | Seasonal, mid-range |

### Flavor Ingredient Costs (by tier)
| Tier | Cost Range | Examples | Source |
|------|-----------|----------|--------|
| Tier 1 (Pantry) | 0c (free) | Wild herbs | Always available |
| Tier 2 (Garden) | 1-3c | Chamomile, citrus peel | Grow or cheap buy |
| Tier 3 (Forest) | 5-8c | Mushroom, ginger, acorn | Forage or buy |
| Tier 4 (Merchant) | 12-20c | Cinnamon, juniper, elderflower, vanilla | Buy from Omar |
| Tier 5 (Exotic) | 30-50c | Saffron (50c), tonka (35c), lemongrass (30c), charcoal (30c), truffle honey (45c) | Rare merchant stock |
| Tier 6 (Legendary) | Not buyable | Dragon pepper, moonberry, starfruit, ancient yeast, phoenix honey | Forage only, expire in 24h |

### Merchant Pricing (Omar)
- Base prices as above
- **Demand inflation:** each purchase increases price by 5% until restock
- **Restock cycle:** every 2-3 hours, prices reset
- **Stock limits:** 3-5 units per ingredient per restock
- Seeds: 2x ingredient cost, but grow unlimited once planted

---

## 2. DRINK SALE PRICES

### Base Price by Star Rating
| Stars | Base Sale Price | Typical Profit Margin |
|-------|----------------|----------------------|
| ★★☆☆☆ Common | 8-15c | ~60-80% (cheap ingredients) |
| ★★★☆☆ Fine | 20-35c | ~50-70% |
| ★★★★☆ Rare | 50-80c | ~40-60% |
| ★★★★★ Legendary | 150-300c | ~30-50% (expensive ingredients but massive sale price) |
| ★★★★★ Secret | 500c+ | Bragging rights + huge profit |

### Price Calculation
```
sale_price = base_star_price × customer_multiplier × freshness × streak_bonus × seasonal_modifier
```

**Customer multiplier:**
| Customer | Multiplier | Notes |
|----------|-----------|-------|
| Peasant | 0.8x | Pays less, tips rarely |
| Herbalist | 1.1x | Fair price for herbal drinks |
| Scholar | 1.2x | Pays for complexity |
| Warrior | 1.3x | Pays for strong drinks |
| Merchant | 1.5x | Knows value, pays well |
| Noble | 2.0x | Pays premium for luxury |
| Food Critic | 2.5x | Highest payer, but pickiest |
| Bard | 1.0x | Fair price, tips with lore |

**Freshness:** Drinks served immediately after brewing = 1.2x. Served from stock = 1.0x.

**Streak bonus:** Hot Streak (3 perfect serves in a row) = 2x gold for next serve.

**Seasonal modifier:** +50% for seasonal drinks (warm/spiced in winter, light/floral in summer).

### Profit Margin Examples
```
COMMON: Herb Tea
  Cost: 0c (water + free herbs, no base)
  Sell: 8c to peasant (8 × 0.8) or 20c to noble (8 × 2.0 × 1.2 freshness)
  Margin: 100% — great for beginners, low reward

FINE: Spiced Cider  
  Cost: 3c (fruit base) + 12c (cinnamon) = 15c
  Sell: 25c to merchant (25 × 1.5) = 37c
  Margin: ~60% — solid mid-game income

RARE: Saffron Elixir
  Cost: 5c (honey base) + 50c (saffron) = 55c
  Sell: 65c base × 2.0 (noble) × 1.2 (freshness) = 156c
  Margin: ~65% — but only if you serve to the RIGHT customer

LEGENDARY: Dragonfire Mead
  Cost: 5c (honey base) + 0c (dragon pepper, foraged) + 0c (moonberry, foraged)
  Sell: 200c base × 2.5 (critic) × 1.2 (freshness) × 2.0 (streak) = 1,200c
  Margin: 99% — but ingredients expire in 24h and the critic is picky
```

---

## 3. PROGRESSION COSTS

### Brewery Upgrades
| Level | Name | Cost | Unlocks |
|-------|------|------|---------|
| 1 | Humble Brewery | Free | 1 cauldron, 1 barrel, basic shelf |
| 2 | Proper Brewhouse | 500c | 2 cauldrons, 3 barrels, garden expansion |
| 3 | Fine Establishment | 2,500c | 3 cauldrons, 5 barrels, 3rd flavor slot, exotic shelf |
| 4 | Grand Brewery | 10,000c | 4 cauldrons, 8 barrels, merchant discount 10% |
| 5 | Master Brewhouse | 25,000c | 5 cauldrons, 10 barrels, legendary brewing station, Town Crier announces your name |

### Equipment Upgrades
| Upgrade | Cost | Effect |
|---------|------|--------|
| Copper Cauldron | 200c | Brew 20% faster |
| Oak Barrel Rack | 300c | Age 2 drinks at once (was 1) |
| Stone Counter | 500c | Serve 2 customers at once |
| Spice Cabinet | 400c | Store 5 exotic ingredients (prevents spoilage for 48h) |
| Crystal Bottles | 800c | +10% sale price (presentation bonus) |
| Ancient Thermometer | 1,000c | Shows "near miss" hints more clearly |

### Seed Prices (from Merchant)
| Tier | Seed Cost | Grow Time | Harvests |
|------|-----------|-----------|----------|
| Tier 2 seeds | 5-8c | 30 min | Unlimited (once planted) |
| Tier 3 seeds | 15-20c | 1 hour | Unlimited |
| Tier 4 seeds | 40-60c | 2 hours | Unlimited |
| Tier 5 seeds | 100-150c | 4 hours | 3 harvests, then replant |

---

## 4. ECONOMY BALANCE TARGETS

### Pacing (how long to reach each milestone)
| Milestone | Target Time | Crowns Needed |
|-----------|------------|---------------|
| First recipe discovered | 1 minute | 0c |
| Buy first garden ingredient | 5 minutes | 3c |
| Upgrade to Level 2 | 30-45 minutes | 500c |
| First rare recipe | 1-2 hours | ~200c in ingredients |
| Upgrade to Level 3 | 3-4 hours | 2,500c |
| First legendary ingredient found | 4-6 hours | 0c (foraged) |
| First legendary recipe | 6-10 hours | Skill + luck |
| Upgrade to Level 5 | 20-30 hours | 25,000c |
| Find all recipes | 50+ hours | Completionist goal |

### Income Targets (per hour of active play)
| Player Stage | Expected Income/Hour | How |
|-------------|---------------------|-----|
| Beginner (Level 1) | 30-50c/hr | Common drinks to peasants |
| Intermediate (Level 2) | 100-200c/hr | Fine drinks, better customers |
| Advanced (Level 3) | 300-500c/hr | Rare drinks, nobles, exports |
| Expert (Level 4-5) | 800-1,500c/hr | Legendary drinks, critic serves, trading |

### Anti-Inflation Mechanics
- Brewery upgrades are expensive (gold sinks)
- Ingredient spoilage (legendary expire in 24h)
- Merchant inflation (prices rise with demand)
- Seasonal demand shifts (can't just spam one recipe forever)
- Equipment upgrades provide permanent gold sinks
- Seeds need replanting for Tier 5 (recurring cost)

---

## 5. GEOLOCATION ECONOMY

### Regional Garden Bonus (Free Ingredients by Location)
Each player gets 2-3 FREE ingredients based on IP geolocation. These grow in their garden without seeds.

| Region | Free Garden Ingredients | Trade Advantage |
|--------|------------------------|----------------|
| Japan/Korea | Yuzu, Shiso, Sakura Blossom | High demand in Western markets |
| Indonesia/SEA | Pandan, Butterfly Pea, Torch Ginger | Color-changing drinks (visual premium) |
| India/South Asia | Turmeric, Cardamom, Saffron | Saffron is Tier 5 — massive advantage |
| North Africa/Middle East | Preserved Lemon, Dates, Orange Blossom | Exotic in Americas/Asia |
| France/Western Europe | Lavender, Verjus, Elderflower | Floral recipes popular everywhere |
| UK/Northern Europe | Wild Herbs, Chamomile, Berries | Common but reliable base |
| West Africa | Grains of Paradise, Baobab, Hibiscus | Rare spices, high export value |
| Latin America | Cacao Nibs, Epazote, Piloncillo | Unique flavor profiles |
| Americas/US | Apple, Wild Herbs, Berries | Common, low trade value |
| Australia/Oceania | Wattleseed, Lemongrass, Ginger | Mid-tier, reliable |

### Export Pricing Formula
```
export_price = base_price × (1 + distance_bonus) × (1 + scarcity_bonus)

distance_bonus = region_distance / 5
  - Same region: 0 (no bonus)
  - Adjacent region: 0.2 (+20%)
  - 2 regions away: 0.4 (+40%)
  - Opposite side of world: 0.8-1.0 (+80-100%)

scarcity_bonus = (1 - regional_supply_ratio) × 0.5
  - If 50% of players in target region can make this drink: 0.25 (+25%)
  - If 5% can make it: 0.475 (+47.5%)
  - If nobody in target region can make it: 0.5 (+50%)
```

### Export Examples
```
Indonesian player brewing Pandan Mead:
  Base price: 25c
  Export to Europe: 25 × 1.8 (distance) × 1.45 (scarcity) = 65c
  Export to SEA: 25 × 1.0 (same region) × 1.1 (low scarcity) = 27c
  → Export to Europe is 2.4x more profitable

French player brewing Lavender Mead:
  Base price: 30c
  Export to Japan: 30 × 1.6 (distance) × 1.3 (scarcity) = 62c
  Export to UK: 30 × 1.0 (adjacent) × 1.0 (elderflower common there) = 30c
  → Japan export is 2x more profitable
```

### Export Delivery Time
| Distance | Delivery Time | Risk |
|----------|--------------|------|
| Same region | 10 minutes | None |
| Adjacent | 20 minutes | None |
| 2 regions | 30 minutes | 5% spoilage chance |
| Opposite side | 45 minutes | 10% spoilage chance |

Spoilage = drink lost, no payment. Risk/reward for long-distance exports.

### Trade Routes (Emergent Gameplay)
Players naturally discover profitable routes:
```
Japan → free Yuzu → brew Yuzu Fizz → export to Latin America (high distance + scarcity) = 3x profit
Indonesia → free Butterfly Pea → brew color-changing drinks → export anywhere (visual premium) = 2x profit
Africa → free Grains of Paradise → sell raw on marketplace → Europeans buy for rare recipes
```

The geolocation system creates a global economy where every player has a natural advantage in SOMETHING.

---

## 6. MARKETPLACE RULES

### Listing Rules
- Max 10 active listings per player
- Listings expire after 24 hours
- Minimum price: 1c
- Maximum price: 10x the ingredient's base tier cost (prevents absurd gouging)
- 5% transaction fee on sales (gold sink)

### Anti-Manipulation
- **Dumping prevention:** Can't list more than 20 of any single item
- **Price floor:** Ingredients can't be listed below 50% of their base cost
- **Hoarding limit:** Players can hold max 50 of any single ingredient
- **Market cooldown:** After buying 10 of the same item, 30 min cooldown

### Supply/Demand Pricing (NPC sales, not marketplace)
```
npc_price = base_price × (1 + demand_modifier)

demand_modifier = (total_bought_today - average_daily_buys) / average_daily_buys
  - Capped at +100% (price can max double)
  - Resets on merchant restock (every 2-3 hours)
```

---

## 7. STARTING RESOURCES

New player begins with:
- 50 Crowns (enough to buy a few Tier 2-3 ingredients)
- 1 Cauldron
- 1 Barrel
- Pantry stocked: unlimited Grain, Honey, Fruit bases + Wild Herbs (Tier 1)
- Garden: 2-3 regional bonus ingredients (from geolocation)
- Recipe Journal: empty (all undiscovered)

First 60 seconds should yield first recipe discovery (Honey Water or Herb Tea) and first sale (~8-15c). Player should feel immediate progress.
