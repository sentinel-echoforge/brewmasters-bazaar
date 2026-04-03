> ⚠️ For latest economy, trading, and progression design, see ECONOMY.md — it supersedes sections 15-16 in this document.

# 🍺 BREWMASTER'S BAZAAR — Game Design Document

**Version:** v4 (Final)
**Competition:** 2026 Vibe Coding Game Jam by @levelsio
**Deadline:** May 1, 2026 @ 13:37 UTC
**Developer:** Fabio Jonathan Arifin (@FabioJonathanA)
**Engine:** ThreeJS (isometric 3D)
**Platform:** Web (free, no login, instant play)

---

## 1. ELEVATOR PITCH

Run a medieval traveling brew cart — forage ingredients, discover secret recipes through experimentation, brew and sell drinks in a living economy shaped by hundreds of real players you never see. Cozy solo gameplay meets invisible multiplayer warfare.

**One-liner for jam form:** "Discover secret recipes, brew legendary drinks, and outsell rival brewers in a living medieval economy."

**Genre:** Simulation / Crafting / Strategy

---

## 2. DESIGN PILLARS

1. **Discovery is the game.** The joy of "what happens if I mix THESE?" drives everything.
2. **Cozy but competitive.** Your brew cart is peaceful. The economy is ruthless.
3. **Instant play, long pull.** Fun in 30 seconds. Addictive over days.
4. **Feel the world breathing.** Prices move, recipes trend, a herald announces events — you're never alone even though you play solo.

---

## 2b. PSYCHOLOGICAL HOOKS (Addiction & Dopamine Design)

Every mechanic should trigger at least one of these:

### Variable Reward Schedule (Slot Machine Psychology)
- **Near-miss feedback:** When you brew something 1 ingredient off from a real recipe, the cauldron sparks and says "This is CLOSE to something special... try a different method?" Keeps you experimenting.
- **Mystery ingredient:** Sometimes foraging gives you a "???" glowing item. You don't know what it is until you brew with it. Pure curiosity gap.
- **Lucky customer:** Random gold-trimmed customer appears — "I'll pay TRIPLE for anything!" Scramble to serve your best.

### Streak & Flow State
- **Hot Streak:** 3 perfect serves in a row = "🔥 Hot Streak! 2x gold for 30 sec!" Pushes you into flow state.
- **Combo multiplier:** Serve 5+ customers fast without a bad serve = escalating gold multiplier (1.5x → 2x → 3x). One bad serve resets it.

### FOMO & Return Triggers
- **Daily Special:** "Today: customers pay 3x for any drink with Elderflower!" Changes daily. Gives a reason to come back every day.
- **Seasonal ingredients:** Some ingredients only available certain weeks. Miss it = wait for next season.
- **First-of-server discovery:** "🎉 YOU are the FIRST brewer to discover Dragonfire Mead!" Permanent badge. Once someone claims it, it's gone forever.

### Completionism & Progress
- **Collection milestones:** 10 recipes → unlock new ingredient. 25 → brewery cosmetic. 50 → title ("Master Brewer"). 75 → legendary recipe hint. 100 → ???
- **The "almost" journal:** Undiscovered recipe pages show ingredient silhouettes that get CLEARER the more you experiment in that flavor family. You can almost see what it is. Zeigarnik effect — incomplete things nag your brain.
- **Mastery track:** Brew same recipe 10x/25x/50x/100x for increasing rewards. Makes even "solved" recipes worth revisiting.

### Social Status & Competition
- **Rumor system:** Town Crier drops vague hints about what OTHER players discovered: "Rumor has it a brewer in the east combined moonberry with something fiery..." Creates curiosity + FOMO.
- **Leaderboard proximity:** "You are 340 gold behind #7! One good hour could do it." Anchoring effect.
- **Crown permanence:** Weekly top-10 crowns are FOREVER visible. Status symbol that compounds.

### Delayed Gratification
- **Barrel aging anticipation:** When aging a brew, a visible timer + rising quality bar plays. You WATCH it improve. The wait makes the reveal sweeter. You can check it obsessively.
- **Recipe mastery unlocks:** You know the reward is coming at 50 brews. Every brew feels like progress toward something.

### Loss Aversion
- **Streak protection:** At 4/5 combo streak, the game subtly highlights which customer wants what you already have. Helps you maintain the streak — losing it HURTS.
- **Expiring rare ingredients:** Legendary ingredients found while foraging expire after 24h if unused. Use it or lose it.

---

## 3. FIRST 60 SECONDS (Critical for Judges)

```
0s   → Page loads. Low-poly brew cart fades in. Warm lighting. Gentle music.
3s   → "What's your name, brewer?" — type name, hit enter.
5s   → "And what shall we call your cart?" — type cart name, hit enter.
7s   → You're at YOUR brew cart. Small handcart. Cauldron in center. 
        Shelf with 3 ingredients (Honey, Grain, Water). 
        A customer is already waiting.
10s  → Tooltip: "Drag ingredients into the cauldron to brew!"
14s  → Player drags Honey + Water into cauldron. Hits BREW.
17s  → Bubbling animation. Color shifts. Steam rises.
20s  → Result: "Honey Water ★☆☆☆☆" — weak, but it's something!
22s  → Customer takes it. Pays 2 gold. Meh.
24s  → Player tries Honey + Grain + BREW...
27s  → "Golden Mead ★★★☆☆" — RECIPE DISCOVERED! 
        Journal opens, recipe logged. Satisfying chime.
30s  → Next customer wants "something sweet" — Golden Mead is perfect!
34s  → Served! 15 gold + tip. Reputation +1.
37s  → Player is hooked. "What else can I make?"
```

**No loading screen. No tutorial popup. No menu. Just: name → cart name → brew → play.**

---

## 4. GAME WORLD

### 4a. Your Brew Cart (Main Play Area)

Isometric 3D view of your personal traveling cart. Camera can rotate slightly for feel but mostly fixed.

**Layout:**
```
┌─────────────────────────────────┐
│  [Ingredient Shelf]             │
│                                 │
│  [Garden Door]    [Cauldron]    │
│                                 │
│  [Barrel Rack]    [Serve Counter]──→ Customers
│                                 │
│  [Recipe Journal] [Market Board]│
│  [Upgrade Bench]  [Town Crier]  │
└─────────────────────────────────┘
```

**Interactable objects:**
- **Ingredient Shelf** — your stored ingredients, drag from here
- **Cauldron** — the brewing station, drag ingredients TO here
- **Barrel Rack** — for aging brews (unlocked at level 2)
- **Serve Counter** — where customers line up
- **Recipe Journal** — your discovered recipes (the collectible book)
- **Market Board** — live leaderboard + economy prices + trending recipes
- **Upgrade Bench** — spend gold to level up brewery
- **Garden Door** — leads to your foraging area
- **Town Crier spot** — where the herald NPC stands when announcing

### 4b. The Foraging Area (Ingredient Discovery)

A separate small scene. Click the Garden Door on your cart to enter.

Your personal outdoor area — small forest clearing with a garden plot. ~30 interactable nodes.

**Layout:**
```
┌─────────────────────────────────┐
│  🌲      🍄        🌲          │
│      🌿      🫐                 │
│  🌲           🐝🪵             │
│        [Garden Plot]            │
│     🌸    🌿    🌾              │
│  🌲    💧(stream)    🌲        │
│              🪨                  │
│         [Back to Brewery]       │
└─────────────────────────────────┘
```

**How foraging works:**
- Walk your character (click to move) around the area
- Ingredients appear as glowing/highlighted objects
- Click to pick up → goes to your shelf
- Items RESPAWN over real time (every 5-10 min per node)
- Some nodes only appear after you reach certain levels
- Rare items spawn randomly — a glowing mushroom, a golden apple
- Seasonal items rotate weekly (server-controlled)

**Ingredient spawn tiers:**
- Always available: herbs, grain, water, basic fruit
- Level 2+: honey (beehive), ginger root, berries
- Level 3+: cinnamon bark, juniper, elderflower
- Level 4+: saffron, rare mushrooms, exotic fruit
- Random rare spawn (any level): Dragon Pepper, Moonberry, Starfruit, Ancient Yeast

**Foraging creates natural pacing:** you can't just spam-brew forever, you need to go gather. It also means higher-level players have access to better ingredients = better recipes = more gold. Progression feels earned.

### 4c. The Market Board (Multiplayer Window)

A physical board at your brew cart that shows the living world:

**Live Leaderboard:**
```
═══════ REALM'S FINEST BREWERS ═══════
🥇 BrewKing99      — 12,450 gold ⭐87
🥈 MeadMaster      — 11,200 gold ⭐82  
🥉 GingerSnap      — 9,870 gold  ⭐76
4. You             — 3,200 gold  ⭐34
...
═══════════════════════════════════════
🌍 847 brewers in the realm
📖 You've discovered 12/100 recipes
```

**Leaderboard tracks (tabs):**
- 💰 **Wealth** — total gold earned
- 📖 **Discovery** — recipes found
- ⭐ **Reputation** — customer satisfaction
- 👑 **Royal Favor** — special event points

**Live Economy Ticker:**
```
MARKET PRICES (updated live):
🍯 Honey      12g  ↑ (+3 in last hour — high demand!)
🌾 Grain       4g  → (stable)
🫐 Berries     8g  ↓ (-2 — oversupply)
🌶 Ginger     15g  ↑ (trending!)
🧂 Saffron    45g  → (rare — limited stock)
```

**Trending Recipes:**
```
WHAT'S SELLING:
🔥 Berry Mead — 23 brewers making this (price dropping!)
📈 Ginger Fire Ale — only 4 brewers know this (premium price)
🆕 Someone discovered "Moonfire Mead"!!! (legendary)
```

This board is the main way you FEEL other players. Always live, always updating.

### 4d. The Town Crier (Flavor Delivery)

A small medieval herald NPC who stands near your brew cart's Market Board.

**Every ~60 minutes (server event), the Town Crier announces:**
- Leaderboard changes: "Hear ye! BrewKing99 has claimed the #1 spot!"
- New discoveries: "A brewer has discovered a LEGENDARY recipe — Dragonfire Mead!"
- Economy shifts: "The price of honey has CRASHED! Oversupply in the realm!"
- Royal Commissions: "The King demands 100 Spiced Meads by sundown! Rewards for top contributors!"
- Seasonal changes: "Winter approaches! Elderberries now available in the forest!"

**Implementation:** Text bubble appears over the NPC + a small notification banner at top of screen. Optional: short trumpet sound effect.

Crier announcements also appear in a scrollable log on the Market Board so you can catch up on what you missed.

---

## 5. CORE MECHANICS

### 5a. Brewing

**The central mechanic. Must feel GOOD.**

**Steps:**
1. Drag 2-3 ingredients from shelf → cauldron (slots light up)
2. Choose method button: 🔥 Boil | 🫧 Ferment | 💨 Distill
3. Press BREW
4. Animation plays (3-5 seconds): liquid color blends, bubbles, steam, glow
5. Result bottle appears with name + star rating

**Methods affect results:**
- 🔥 **Boil** (instant) — fast, good for simple drinks. Brings out "warm" and "sweet" properties.
- 🫧 **Ferment** (15 sec wait) — medium. Creates alcohol. Brings out "complex" and "deep" properties.
- 💨 **Distill** (30 sec wait) — slow but powerful. Concentrates flavors. Brings out "sharp" and "intense" properties.

**Longer methods = higher quality ceiling but costs you time.** A speed-focused player boils everything fast. A quality-focused player ferments/distills.

At level 3+ you unlock Barrel Aging:
- 🪵 **Barrel Age** (5 min real-time) — take any brewed drink and age it. Massive quality boost. Limited barrel slots.

### 5b. The Recipe System (The Heart of Discovery)

**~100 total recipes across 5 tiers:**

| Tier | Stars | Count | Example | Sell Price |
|------|-------|-------|---------|-----------|
| Swill | ★☆☆☆☆ | Any bad combo | "Murky Brew" | 1-3g |
| Common | ★★☆☆☆ | ~30 recipes | "Honey Water", "Grain Ale" | 5-10g |
| Fine | ★★★☆☆ | ~30 recipes | "Golden Mead", "Berry Cider" | 15-30g |
| Rare | ★★★★☆ | ~25 recipes | "Ginger Fire Ale", "Elderflower Wine" | 40-80g |
| Legendary | ★★★★★ | ~10 recipes | "Dragonfire Mead", "Moonfire Elixir" | 100-200g |

**30 INGREDIENTS — Designed by an ex-Michelin starred chef. Grounded in real gastronomy, elevated with fantasy.**

Hidden properties (NOT shown to player initially) drive the recipe matching system.

### Tier 1 — Pantry Staples (Free / Start)
```
🍯 Honey          → [sweet, golden, viscous, warm]         "Rich, floral sweetness"
🌾 Grain          → [earthy, dry, starchy, neutral]        "Clean, bready base"
💧 Spring Water   → [clean, neutral, thin, cool]           "Pure, mineral"
🌿 Wild Herbs     → [herbal, green, aromatic, fresh]       "Bright, green, aromatic"
```

### Tier 2 — Garden (Level 1, cheap to buy)
```
🍎 Apple          → [fruity, crisp, tart, bright]          "Crisp tartness, autumn"
🫐 Berries        → [sweet, fruity, tart, red]             "Sweet-tart burst, jammy"
🍋 Citrus Peel    → [bright, zesty, bitter, aromatic]      "Zesty, bitter oils"
🌸 Chamomile      → [floral, calming, delicate, light]     "Gentle, calming floral"
```

### Tier 3 — Forest Floor (Level 2)
```
🍄 Wild Mushroom  → [earthy, umami, dark, mysterious]      "Deep umami, forest floor"
🫚 Ginger Root    → [spicy, warm, sharp, aromatic]         "Sharp warm heat that builds"
🌰 Roasted Acorn  → [nutty, smoky, toasty, warm]           "Nutty, smoky, surprisingly sweet"
🍒 Sour Cherry    → [tart, deep, fruity, complex]          "Tart, deep red, complex"
```

### Tier 4 — Spice Merchant (Level 3)
```
🪵 Cinnamon Bark  → [warm, sweet, woody, spicy]            "Warm, sweet, woody"
🌲 Juniper Berry  → [piney, bitter, aromatic, dry]         "Piney, gin-forward, crisp"
🌺 Elderflower    → [floral, delicate, perfumy, sweet]     "Perfumy, delicate, ethereal"
🫛 Vanilla Pod    → [rich, creamy, sweet, smooth]           "Rich, creamy, round"
🌶️ Long Pepper    → [spicy, complex, warm, lingering]      "Slow-building heat that evolves"
```

### Tier 5 — Exotic (Level 4)
```
🧵 Saffron Thread → [exotic, earthy, golden, complex]      "Worth-its-weight golden luxury"
🫒 Tonka Bean     → [rich, almond, cherry, intoxicating]   "Almond + cherry + tobacco (banned IRL!)"
🌿 Lemongrass     → [bright, citrusy, aromatic, clean]     "Bright, citrusy, Southeast Asian"
🍯 Truffle Honey  → [funky, luxurious, earthy, divisive]   "Funky, luxurious, polarizing"
🌑 Charcoal       → [smoky, dramatic, dark, neutral]       "Turns drinks JET BLACK"
```

### Legendary (Random rare foraging spawns — expire in 24h if unused!)
```
🐉 Dragon Pepper  → [fiery, volatile, intense, alive]      "Almost alive with heat. Handle with care."
🌙 Moonberry      → [ethereal, cool, luminous, magical]    "Glows faint blue. Otherworldly."
⭐ Starfruit      → [cosmic, bright, sweet, otherworldly]   "Cosmic sweetness from another realm"
🧬 Ancient Yeast  → [alive, transformative, deep, unpredic] "Thousands of years old. Transforms anything."
🔥 Phoenix Honey  → [fiery, golden, sweet, mythical]       "Collected from volcanic beehives."
```

**Why these ingredients:** Real chefs will recognize tonka, long pepper, lemongrass, sour cherry — they'll nod. The legendary ingredients feel special BECAUSE the base is grounded in actual gastronomy, not random fantasy words.

### FULL INGREDIENT CODEX: 70+ Ingredients Across 7 Regions

The complete ingredient database with full lore, map origins, visual effects, and regional recipes is in:
**📖 `strategies/brewmasters-bazaar-ingredient-codex.md`** (viewable in MC Docs)

**Regions covered:**
- 🏜️ North African / Moroccan (14 ingredients) — ras el hanout, preserved lemon, mastic, black lime...
- 🌸 Japanese (13 ingredients) — yuzu, koji, sakura blossom, sanshō pepper...
- 🇫🇷 French / Avant-Garde (13 ingredients) — verjus, chartreuse herbs, sea buckthorn, gentian...
- 🌴 Southeast Asian / Indonesian (10 ingredients) — pandan, butterfly pea flower, torch ginger, galangal...
- 🌵 Latin American (7 ingredients) — cacao nibs, mezcal worm salt, hibiscus, epazote...
- 🌍 Global Notable (5 ingredients) — szechuan peppercorn, wattleseed, rooibos, baobab...
- 🐉 Fantasy / Legendary (8 ingredients) — each with unique unlock conditions and visual effects

**Every ingredient has:**
- Specific famous origin location (for the world map pin illustration)
- 2-3 sentence educational lore in medieval narrator voice
- 4 hidden flavor property tags
- Rarity tier + region tag
- Visual brew effects where applicable (28 total visual effects mapped)

### Ingredient Sourcing Mechanics

NOT everything is found in your backyard. Different ingredient tiers come from different sources:

**🌿 Your Garden (always available)**
Tier 1-2 staples. Herbs, grain, berries, basic local ingredients.
- Wild patches regrow automatically over time
- Planting plots (3-5 slots, scales with brewery level): buy seeds → plant → wait real time → harvest
- Perennial plants keep producing; annual plants die after harvest and need replanting
- Garden upgrades unlock more plots and faster regrowth

**🌲 The Wilds (foraging area)**
Tier 2-3 regional ingredients. Mushrooms, ginger root, sour cherry, wild herbs.
- Walk and click to pick up. Items respawn every 5-10 min per node.
- New nodes appear as you level up
- Rare glowing spawns appear randomly (mystery ingredients!)
- Seasonal items rotate weekly (server-controlled)

**🐪 The Traveling Merchant**
Tier 4-5 exotic and rare ingredients from around the world.
- Arrives every 2-3 hours (real time). Trumpet fanfare. Town Crier announces.
- Rotating stock — different every visit. "Today: saffron from Persia, yuzu from Japan, and... something from a Siberian village."
- **Limited stock** — he has 5 of each item. Server-wide. First come, first served. Economy warfare.
- **Seeds for sale** — plant exotic ingredients in your garden. Cheaper long-term but slow to grow.
- **Trade offers** — "I'll trade 3 Saffron for 20 of your Golden Mead." Your RECIPES become currency.
- **Map fragments** — collect 3 fragments of the same map → unlocks a legendary ingredient expedition

**🐉 Legendary Encounters (special events)**
Legendary ingredients ONLY. NOT random finds.
- Server events: "A phoenix was spotted near the volcanic springs!" → one-time special foraging map
- Map fragment quests from the Merchant → assemble a treasure map → expedition
- Achievement unlocks (e.g. "Brew 5 floral recipes" → Moonpetal Bloom becomes discoverable)
- Each legendary has a specific unlock condition — see the Ingredient Codex for details

**🌱 The Growing/Farming System**
- Buy seeds from Merchant → plant in garden plots → wait real time → harvest
- Growth times: Common seeds (1-2 hours), Fine (4-6 hours), Rare (12-24 hours), Exotic (24-48 hours)
- Some plants are perennial (keep producing every harvest cycle) vs annual (die after one harvest)
- Garden upgrades: better soil (faster growth), irrigation (auto-water), greenhouse (grow out-of-season plants)
- This creates a long-term investment strategy: grow your own saffron instead of buying from merchant

### The Ingredient Encyclopedia (In-Game UI)

When a player clicks on any ingredient, they see:
- **Illustration** of the ingredient
- **World map** with a PIN showing where it's famously from (e.g. "Souss Valley, Morocco" for Argan Oil)
- **Lore text** (educational, fun, medieval narrator voice)
- **Flavor properties** (revealed progressively as you use the ingredient more)
- **Recipes it appears in** (discovered ones shown, undiscovered as "???")
- **Times used** and mastery progress

This transforms the game from "just a crafting sim" into a world food encyclopedia. Players LEARN real things about real ingredients while playing.

### Interactive Visual Effects

Key visual effects that create "wow" moments:
- **Butterfly Pea Flower** — THE centerpiece. Blue → purple → pink based on acidity of other ingredients. Interactive color-change in real time.
- **Quince** — turns from pale gold to pink during fermentation (real chemistry!)
- **Chartreuse Herb Blend** — glows eerie green (UV-accurate to real Chartreuse)
- **Saffron** — liquid gold luminescence
- **Dreaming Spore** — chaotic color-cycling with purple smoke
- **Glacial Memory** — frost crystals form on the outside of the brewing vat

Full visual effects reference: 28 effects mapped in the Ingredient Codex.

### Regional Recipe Families (unlockable)

| Family | Tradition | Unlock |
|--------|-----------|--------|
| Gruit Ale | Medieval European | Default |
| Metheglin | Medieval Mead | Brew 3 meads |
| Koji Ferment | Japanese | Discover koji |
| Jamu Tonic | Indonesian | Collect 5 SEA ingredients |
| North African Shrub | Moroccan | Collect 5 North African |
| Monastic Elixir | French | Discover 3 rare French |
| Mesoamerican Ferment | Latin American | Collect 5 Latin American |
| Alpine Bitter | French | Discover Gentian |
| Legendary Elixir | Fantasy | Unlock 5 Legendaries |

### Mentor NPCs (Stretch Goal)

5 regional mentor NPCs who teach you their brewing tradition:
- **Fatima** (Moroccan) — shrubs, spice waters, North African spice work
- **Kenji** (Japanese) — koji, amazake, sake lineage
- **Brother Gaspard** (French) — monastic elixirs, alpine bitters
- **Dewi** (Indonesian) — jamu tonics, Southeast Asian ferments
- **Xochitl** (Mexican) — tepache, pulque, mesoamerican traditions

**Recipe matching logic:**
- Each recipe = specific ingredients + specific method
- Some recipes are flexible (any "sweet" + any "fruity" + ferment = some kind of fruit wine)
- Some are EXACT (Dragon Pepper + Moonberry + Distill = Dragonfire Mead, nothing else works)
- When you brew something new, the game checks against the recipe database
- Match → named recipe discovered! Entry added to journal.
- No match → "Murky Brew" or a generic description based on dominant properties

**Discovery hints system:**
- After discovering 5 recipes: you start seeing "flavor notes" on ingredients ("Honey — you notice its sweetness")
- After 15 recipes: method hints ("Fermenting seems to bring out deeper flavors...")
- After 30 recipes: recipe family hints ("You sense there's a legendary drink involving fire and moonlight...")
- After 50 recipes: you can see property tags on ingredients directly

This creates a LEARNING CURVE. Early game is pure experimentation. Mid game you start understanding the system. Late game you're strategically hunting specific legendary combos.

### 5c. The Recipe Journal

A beautiful in-game book. Major collectible/completionist hook.

**Left page — Ingredient Encyclopedia:**
```
🍯 HONEY
"A gift from the forest bees."
Properties: Sweet, Golden (more revealed as you use it)
Found: Beehive in foraging area
Used in: Golden Mead, Berry Mead, Honey Water, ??? , ???
Times used: 47
```

**Right page — Discovered Recipes:**
```
⭐⭐⭐ GOLDEN MEAD
Honey + Grain | Fermented
"A classic drink with a warm golden hue."
Times brewed: 23
Mastery: ████████░░ (80% — brew 7 more for mastery bonus!)
Sell price: 18-25g (depends on market)
```

**Undiscovered recipes show as silhouettes:**
```
⭐⭐⭐⭐ ??? RARE RECIPE ???
"Something involving spice and fire..."
Hint: Uses a method you haven't tried with spicy ingredients
```

**Recipe Mastery:**
- Brew a recipe 10x → "Apprentice" — 10% faster brew time
- Brew 25x → "Journeyman" — 15% quality bonus (higher sell price)
- Brew 50x → "Expert" — can brew while doing other things (auto-brew)
- Brew 100x → "Master" — recipe scroll drops (tradeable in future/v2 stretch)

### 5d. Customers

NPC customers walk up to your serve counter. Queue of 1-3 visible.

**Each customer has:**
- A visible mood/preference bubble icon
- A patience timer (they'll leave if you take too long)
- A gold budget (richer customers = pay more)

**Customer types:**
```
🟡 Peasant     — "Anything, please" — buys anything, pays little (3-8g)
🟢 Traveler    — "Something refreshing" — wants light/fruity/cool drinks (8-15g)
🔴 Soldier     — "Something STRONG" — wants high-alcohol/aged/intense (10-20g)
🟣 Noble       — "Surprise me with your finest" — wants rare+ recipes (20-50g)
👑 Royal Taster — "The King sends me" — wants legendary, pays huge (50-200g)
```

**Matching:**
- Serve what they want → full price + tip + reputation
- Serve something okay → half price, no tip
- Serve swill or wrong type → they spit it out. Reputation -1. Comedy animation.
- Don't serve in time → they leave. Missed opportunity.

**Customer frequency scales with reputation:**
- Low rep: 1 customer every 30-45 sec, mostly peasants
- Mid rep: 1 every 15-20 sec, travelers and soldiers show up
- High rep: 1 every 10 sec, nobles frequent your stall
- Max rep: Royal Tasters visit regularly

### 5e. Economy (Invisible Multiplayer Engine)

The server maintains a GLOBAL economy that all players participate in.

**Ingredient Pricing:**
- Base prices set per ingredient
- Every 60 seconds, server recalculates based on total purchases across ALL players
- High demand → price goes up (max 3x base)
- Low demand → price drops (min 0.5x base)
- Players can buy ingredients from the Market Board (alternative to foraging)
- Buying from market is faster but costs gold. Foraging is free but takes time.

**Drink Pricing (what customers pay):**
- Base price per recipe tier
- Modified by SUPPLY: if 50 players are all selling Berry Mead, the market is flooded → customers pay less for it
- Modified by DEMAND: server randomly shifts demand categories ("this week, the realm craves strong drinks")
- Creates natural incentive to discover niche recipes nobody else is making

**The Economic Cycle:**
```
Many players discover Berry Mead
  → Berry Mead floods the market
    → Berry Mead price drops  
      → Berry ingredient demand rises
        → Berry prices rise
          → Smart players switch to different recipes
            → Berry Mead becomes rare again
              → Price recovers
```

Players who READ the market and ADAPT make the most gold. Players who just brew the same thing get squeezed.

### 5f. Progression & Upgrades

**Cart Levels:**

| Level | Name | Cost | Unlocks |
|-------|------|------|---------|
| 1 | Handcart | Free (start) | 1 cauldron, basic shelf (6 slots), 3 starter ingredients |
| 2 | Donkey Cart | 500g | 2 cauldrons, barrel rack (1 barrel), expanded shelf (12 slots), garden upgrade (more forage nodes) |
| 3 | Covered Wagon | 2,000g | 3 cauldrons, 3 barrels, distillery station, herb garden (grow specific ingredients), shelf (18 slots) |
| 4 | Grand Caravan | 8,000g | 4 cauldrons, 6 barrels, rare ingredient vault, auto-serve for mastered recipes, cart sign visible in Market Square |
| 5 | Legendary Yatai | 25,000g | 5 cauldrons, 10 barrels, legendary brewing station, Town Crier announces your name, crown on your cart |

**Each level visually transforms your traveling cart.** Level 1 is a humble wooden handcart. Level 5 is a legendary yatai with banners and a glowing sign. Players who visit the Market Square can SEE this progression on other carts.

**Equipment upgrades (within each level):**
- Better cauldron → faster brew animation
- Copper barrels → better aging bonus
- Fancy counter → customers tip more
- Recipe display → shows your best recipe to visitors (flex)
- Garden tools → faster forage respawn

---

## 6. SERVER-WIDE EVENTS

### 6a. Royal Commissions (Every ~2 Hours)

Server-wide challenges announced by the Town Crier:

- **"The King demands 200 Meads!"** — collective goal, top contributors get bonus gold + Royal Favor points
- **"A plague strikes! Brew Elderberry Tonic!"** — specific recipe needed, demand spikes, ingredient rush
- **"The Royal Wedding! 50 UNIQUE drinks needed!"** — rewards recipe diversity
- **"Trade embargo! Market closed for 30 minutes!"** — forces use of foraged ingredients only
- **"The Tasting Festival! Double gold for the next hour!"** — frenzy event

### 6b. Seasonal Shifts (Every Week)

- New seasonal ingredients become available in foraging area
- Some ingredients become unavailable (winter = no berries)
- Customer preferences shift ("Summer: everyone wants refreshing drinks")
- Unlocks seasonal-exclusive recipes (only discoverable during that season)

### 6c. Weekly Season Rankings

At end of each week:
- Top 10 get a **Crown badge** (permanent, visible on stall)
- Top 3 get a **Legendary recipe hint** (not available any other way)
- #1 gets their name on the **Town Monument** (visible in Market Square)
- All gold resets for the new season. Brewery level + recipes PERSIST.

This creates a weekly competitive cycle while keeping long-term progression meaningful.

---

## 7. MARKET SQUARE (Stretch Goal — If Finished Early)

**Restaurant City vibes.** A separate view showing a bird's-eye view of the medieval town square.

**What you see:**
```
┌─────────────────────────────────────────┐
│           TOWN SQUARE                    │
│                                          │
│  [Stall]  [Small    [GRAND      [Stall] │
│  Lvl 1    Brewery]  BREWHOUSE]   Lvl 2  │
│  noob123  AleWife   BrewKing99  hops4lyf│
│            Lvl 2     ⭐LVL 5👑          │
│                                          │
│        [Town Monument]                   │
│        "BrewKing99 — Week 3 Champion"    │
│                                          │
│  [Stall]  [Brewery]  [Stall]   [Stall]  │
│  newguy   you ← ★    beerBro   meadLady │
│  Lvl 1    Lvl 3      Lvl 2     Lvl 3    │
│                                          │
│  [🌀 VIBE JAM PORTAL]                   │
└─────────────────────────────────────────┘
```

**Each stall shows:**
- Player name
- Brewery level (visual size of building)
- Crown badge if they've won a season
- Their "signature recipe" on a sign
- Online/offline indicator (lantern lit = online)

**Click a stall to see:**
- Player's stats (gold earned, recipes discovered, reputation)
- Their top 3 recipes (names only, not ingredients — keep secrets!)
- How long they've been playing

**NOT included (too complex):**
- Walking around as a character
- Real-time player movement
- Chat
- Visiting the inside of other breweries

It's a STATIC overview that loads from the database. Refresh to update. Zero real-time sync needed.

---

## 8. PERSISTENCE MODEL

### Player Data (Server-Side)

```json
{
  "id": "uuid",
  "name": "BrewKing99",
  "token": "random-recovery-token",
  "created_at": "2026-04-05T12:00:00Z",
  "brewery_level": 3,
  "gold": 4250,
  "total_gold_earned": 18400,
  "reputation": 67,
  "royal_favor": 12,
  "ingredients_owned": ["honey", "grain", "berries", "ginger", ...],
  "recipes_discovered": ["golden-mead", "berry-cider", "ginger-fire-ale", ...],
  "recipe_mastery": {"golden-mead": 47, "berry-cider": 23, ...},
  "equipment": {"cauldron": 2, "barrels": 3, "counter": "copper"},
  "crowns": ["week-3-top10"],
  "last_online": "2026-04-05T15:30:00Z"
}
```

### Client-Side (localStorage)

```json
{
  "player_token": "random-recovery-token",
  "player_name": "BrewKing99",
  "settings": {"music": true, "sfx": true, "camera_angle": 45}
}
```

### Recovery

If localStorage is cleared:
- "Welcome! Are you new or returning?"
- "Returning" → enter recovery code (shown once on first play, player can screenshot)
- "New" → fresh start

This satisfies the "no login/signup" jam requirement while enabling persistence.

---

## 9. VIBE JAM PORTAL

A glowing archway at the edge of the brewery scene (or in the Market Square).

**Label:** "✨ Vibe Jam Portal"
**Visual:** Swirling purple/blue energy, particle effects
**On enter:** Redirects to `https://jam.pieter.com/portal/2026?username={name}&color=amber&ref=brewmastersbazaar.com`

**Incoming portal players** (when ?portal=true is in URL):
- Skip name entry
- Use `?username=` as their name
- Spawn them looking at their (new) brewery with the portal glowing behind them
- Extra text: "You've arrived from another realm! Welcome to Brewmaster's Bazaar!"

---

## 10. VISUAL STYLE

**Isometric low-poly 3D.** Warm, cozy, medieval fantasy.

**Color palette:**
- Warm wood browns and ambers
- Golden honey tones
- Deep green foliage
- Purple/blue for rare/magical items
- Cream/parchment for UI elements

**Reference vibes:**
- Overcooked (camera angle, chunky style)
- Potion Craft (crafting UI, journal aesthetic)
- Stardew Valley (cozy farming, foraging feel)
- Tavern Keeper / Shoppe Keep (medieval market stall)

**Key animations (juice):**
- Ingredients bounce slightly when picked up
- Cauldron bubbles and changes color during brewing
- Steam/particles on brew completion
- Coins scatter when customer pays
- Stars burst when new recipe discovered
- Customer reactions (heart eyes for good drink, sick face for bad)
- Barrel aging: visible timer with aging effect (wood darkens)

**Sound:**
- Ambient: medieval market bustle, birds, distant crowd
- Brewing: bubble, sizzle, pop, satisfying completion chime
- Customer: coin clink, happy murmur, disgusted spit
- Town Crier: trumpet fanfare before announcements
- Discovery: magical chime + page turn
- Music: gentle medieval tavern soundtrack (lute, soft percussion)

---

## 11. TECH STACK

### Frontend
- **ThreeJS** — 3D rendering (isometric camera)
- **Vite** — bundler (fast builds, instant HMR)
- **Vanilla JS or lightweight framework** — UI overlays (recipe journal, market board)
- **Howler.js** — audio

### Backend
- **Node.js + Express** — REST API
- **Fetch polling every 30-60s** — client polls for economy updates + Town Crier events (no WebSocket needed)
- **SQLite** (or **Turso** for edge) — player data, economy state, recipes
- **Simple tick loop** (setInterval 60s) — recalculate economy prices

> **Note:** All 3D geometry is procedural (code-generated primitives, no model files). Pieter Levels approach.

### Hosting
- **Railway** or **Fly.io** — backend (persistent process for economy sim)
- **Cloudflare Pages** or **Vercel** — static frontend
- **Custom domain** — brewmastersbazaar.com (or similar)

### Server Load Estimate
- Economy tick: 1 SQL query every 60 sec (trivial)
- Player save: on brew/sell events (maybe 1 write/sec per active player)
- Fetch polling: clients poll for price updates every 30-60 sec
- 1000 concurrent players: totally fine on a $7/mo Railway instance

---

## 12. DEVELOPMENT ROADMAP

### Week 1 (Apr 3-9): Core Brewing Loop — THE FOUNDATION
*If this isn't fun by day 7, nothing else matters.*
- [ ] ThreeJS scene: isometric brewery with cauldron, shelf, serve counter
- [ ] Ingredient system: shelf UI, drag-to-cauldron interaction
- [ ] Brewing mechanic: combine 2-3 ingredients → choose method → animate → result
- [ ] Recipe matching engine: hidden property tags, combo logic, star ratings
- [ ] 30 starter recipes coded (Common + Fine tiers)
- [ ] Recipe journal: book UI showing discoveries + undiscovered silhouettes
- [ ] Customer NPCs: walk up, show preference bubble, serve, pay, react
- [ ] Basic gold (Crowns) economy: earn from sales, spend at ingredient shop
- [ ] Near-miss feedback: "This is CLOSE to something special..."
- [ ] Hot Streak system: 3 perfect serves = 2x gold
- [ ] Pre-generated tasting notes: load 3-4 per recipe from data file

### Week 2 (Apr 10-16): Foraging + Progression + Merchant
- [ ] Foraging area: separate ThreeJS scene, click-to-move, pickable nodes
- [ ] Geolocation: IP lookup → assign 2-3 regional garden bonus ingredients
- [ ] Garden system: wild patches (regrow) + planting plots (seeds → grow → harvest)
- [ ] Full ingredient set: 30-40 ingredients across tiers (expand to 70 post-jam)
- [ ] Expand recipe database to 50+ recipes (load cross-regional from data)
- [ ] Traveling Merchant NPC (Omar): arrives every 2-3h, rotating exotic stock, seeds, map fragments
- [ ] Merchant dialogue system: 200+ pre-gen lines, context-tagged (first visit, returning, haggling, etc.)
- [ ] Brewery upgrades: levels 1-3 with visual transformation
- [ ] Equipment upgrades: faster cauldron, barrel rack, better counter
- [ ] Barrel aging mechanic: place brew → timer → quality boost
- [ ] Ingredient encyclopedia: click ingredient → lore + world map pin + properties

### Week 3 (Apr 17-23): Multiplayer Economy + Backend
- [ ] Backend: Node.js + Express + SQLite, player persistence via token
- [ ] Player save/load: brewery state, recipes, gold, level
- [ ] Global economy engine: supply/demand curves, price recalculation every 60s
- [ ] Export Board: sell local (instant) vs export (30 min, premium based on distance/scarcity)
- [ ] Player Marketplace: post buy/sell orders, match + execute trades
- [ ] Market Board UI: live leaderboard, economy ticker, trending recipes, discovery feed
- [ ] Town Crier: templated announcements with dynamic data injection
- [ ] Royal Commissions: server events every ~2 hours based on economy state
- [ ] Weekly seasons: ranking reset, Crown rewards, permanent badges
- [ ] Seasonal demand shifts: server flag changes weekly ("Winter: warm drinks +50%")
- [ ] Fetch polling: client polls for price updates + Crier announcements every 30-60s

### Week 4 (Apr 24-30): Polish + Portal + Stretch Goals
- [ ] Sound effects: brew bubbles, coin clink, customer reactions, trumpet fanfare, recipe discovery chime
- [ ] Music: gentle medieval tavern soundtrack (lute, soft percussion)
- [ ] Visual polish: particles, brew color effects (butterfly pea color-shift!), steam, coin scatter
- [ ] Recipe hints system: progressive discovery (flavor notes → method hints → family hints)
- [ ] Collection milestones: 10/25/50/75/100 recipe unlock rewards
- [ ] Pre-gen content integration: customer descriptions, recipe lore, loading screen tips
- [ ] Vibe Jam portal: glowing archway, query params, incoming portal spawn
- [ ] Mobile responsive: touch-friendly controls, simplified layout for small screens
- [ ] Performance: instant load, no loading screens, asset optimization
- [ ] Deploy: custom domain (brewmastersbazaar.com or similar)
- [ ] STRETCH: Market Square overview (Restaurant City vibes — see other stalls)
- [ ] STRETCH: Brewery levels 4-5 (Grand Brewery, Master Brewhouse)
- [ ] STRETCH: Mentor NPCs (Fatima, Kenji, Gaspard, Dewi, Xochitl)
- [ ] STRETCH: Daily Special ("Today: 3x for Elderflower drinks!")
- [ ] STRETCH: First-of-server discovery badges

### May 1: Submit! 🎉

---

## 13. RECIPE DATABASE (50 Recipes — Expandable to 100+)

*Designed with real culinary logic. Flavor pairings that make sense to a chef — not random combos.*

### Common (★★☆☆☆) — 12 Recipes
Easy to stumble into. Teaches the system.
| Recipe | Ingredients | Method | Why It Works (Chef Logic) |
|--------|------------|--------|--------------------------|
| Honey Water | Honey + Water | Boil | The simplest drink. Every culture has one. |
| Grain Ale | Grain + Water | Ferment | Beer in its most primitive form. |
| Simple Mead | Honey + Water | Ferment | Water + sugar + time = alcohol. Ancient. |
| Herb Tea | Herbs + Water | Boil | Herbal infusion. As old as fire. |
| Berry Juice | Berries + Water | Boil | Fruit + heat = juice. |
| Apple Cider | Apple + Water | Ferment | Natural yeasts on apple skin do the work. |
| Farmer's Ale | Grain + Herbs | Ferment | Herbs were used before hops existed. |
| Hot Honey Tonic | Honey + Ginger | Boil | Classic cold remedy. Sweet meets heat. |
| Chamomile Calm | Chamomile + Water | Boil | Sleepy time tea. |
| Lemon Shrub | Citrus Peel + Honey + Water | Boil | Oxymel — vinegar-honey-citrus. Ancient recipe. |
| Acorn Coffee | Roasted Acorn + Water | Boil | Wartime substitute. Nutty, earthy. |
| Cherry Squash | Sour Cherry + Water | Boil | Tart refreshment. |

### Fine (★★★☆☆) — 15 Recipes
Requires some experimentation. Real flavor pairing logic.
| Recipe | Ingredients | Method | Why It Works |
|--------|------------|--------|-------------|
| Golden Mead | Honey + Grain | Ferment | The classic. Grain adds body to honey. |
| Berry Mead | Honey + Berries | Ferment | Melomel — real mead category. |
| Spiced Cider | Apple + Cinnamon | Ferment | Warm spice + tart fruit = autumn in a cup. |
| Ginger Beer | Ginger + Grain + Water | Ferment | Ginger bug fermentation. Real thing. |
| Elderflower Cordial | Elderflower + Honey + Water | Boil | English countryside classic. |
| Dark Ale | Grain + Mushroom | Ferment | Umami adds depth. Craft brewers do this. |
| Pine Ale | Juniper + Grain | Ferment | Proto-gin. Before distillation existed. |
| Cinnamon Mead | Honey + Cinnamon | Ferment | Metheglin — spiced mead. Real category. |
| Cherry Lambic | Sour Cherry + Grain | Ferment | Belgian kriek. Tart cherry + beer = magic. |
| Vanilla Cream Ale | Vanilla + Grain + Honey | Ferment | Smooth, dessert-like. |
| Ginger Lemon Fizz | Ginger + Citrus Peel | Ferment | Natural soda. The ferment gives carbonation. |
| Forest Floor Porter | Mushroom + Roasted Acorn + Grain | Ferment | Dark, earthy, nutty — real porter territory. |
| Chamomile Mead | Chamomile + Honey | Ferment | Floral + sweet. Calming but alcoholic. |
| Herb Garden Gin | Herbs + Juniper + Citrus Peel | Distill | Classic gin botanical profile. |
| Long Pepper Cider | Long Pepper + Apple | Ferment | Slow heat meets crisp fruit. Unexpected. |

### Rare (★★★★☆) — 15 Recipes
Requires level 3+ ingredients and method mastery. Real chef knowledge helps.
| Recipe | Ingredients | Method | Why It Works |
|--------|------------|--------|-------------|
| Ginger Fire Ale | Ginger + Cinnamon + Grain | Distill | Concentrated heat. Warming spirit. |
| Elderflower Wine | Elderflower + Berries + Honey | Ferment + Barrel Age | Complex floral + fruit. Aging rounds it. |
| Saffron Elixir | Saffron + Honey + Water | Distill | Golden luxury. Saffron needs concentration. |
| Juniper Gin | Juniper + Herbs + Grain | Distill | London Dry style. Clean, aromatic. |
| Tonka Old Fashioned | Tonka Bean + Honey + Cinnamon | Distill | Almond-cherry warmth. Cocktail logic. |
| Mushroom Stout | Mushroom + Grain + Honey | Ferment + Barrel Age | Dark, deep, umami bomb. |
| Lemongrass Saison | Lemongrass + Grain + Herbs | Ferment | Belgian-Thai fusion. Bright + earthy. |
| Truffle Honey Mead | Truffle Honey + Grain | Ferment + Barrel Age | Funky, divisive, luxurious. Love-it-or-hate-it. |
| Black Velvet | Charcoal + Vanilla + Grain | Distill | Jet black, smooth. Instagram-bait IRL. |
| Sour Cherry Kriek Royale | Sour Cherry + Elderflower + Honey | Ferment + Barrel Age | Belgian kriek meets elderflower. Elegant. |
| Long Pepper Chai Mead | Long Pepper + Cinnamon + Honey + Ginger | Ferment | Every chai spice in mead form. Heat builds. |
| Smoked Acorn Stout | Roasted Acorn + Charcoal + Grain | Ferment + Barrel Age | Smoky, nutty, dark. Campfire in a glass. |
| Vanilla Saffron Cream | Vanilla + Saffron + Honey | Distill | Two most expensive spices. Opulent. |
| Citrus Elderflower Spritz | Citrus Peel + Elderflower + Chamomile | Ferment | Light, bubbly, brunch energy. |
| Dragon Pepper Ale | Dragon Pepper + Grain | Ferment | The gateway legendary. Fiery + bold. |

### Legendary (★★★★★) — 8 Recipes
Require legendary ingredients + exact methods. The grail recipes.
| Recipe | Ingredients | Method | Lore |
|--------|------------|--------|------|
| Dragonfire Mead | Dragon Pepper + Moonberry + Honey | Distill | "Fire and ice in one sip. The bottle glows." |
| Moonfire Elixir | Moonberry + Saffron + Vanilla | Distill + Barrel Age | "Golden light with a blue shimmer. Tastes like a dream." |
| Starweaver's Draft | Starfruit + Ancient Yeast + Honey | Ferment + Barrel Age | "The yeast has been alive since before kingdoms. It knows things." |
| The Philosopher's Brew | Ancient Yeast + Saffron + Mushroom | Distill + Barrel Age | "They say one sip reveals truth. Most can't handle truth." |
| Ambrosia | Phoenix Honey + Elderflower + Starfruit | Ferment + Barrel Age | "What the gods drink when they think no one's watching." |
| Void Stout | Charcoal + Ancient Yeast + Mushroom | Ferment + Barrel Age | "So dark it absorbs light. Tastes like the universe thinking." |
| Phoenix Rising | Phoenix Honey + Dragon Pepper + Ginger | Distill | "Three kinds of fire. Somehow harmonious. You feel reborn." |
| The Last Word | Moonberry + Tonka Bean + Elderflower | Distill + Barrel Age | "Named because after tasting it, there's nothing left to say." |

### Secret Recipes (★★★★★ — Not in journal hints, fully hidden)
| Recipe | Ingredients | Method | Discovery |
|--------|------------|--------|-----------|
| Primordial Soup | Ancient Yeast + Spring Water | Ferment | "Just yeast and water. The simplest combo. But THIS yeast..." |
| Chef's Kiss | ALL 5 legendary ingredients | Distill + Barrel Age | "The ultimate flex. Nobody will find this by accident." |

**Total: 52 defined recipes. Expandable to 100+ by combining remaining ingredient pairs.**

*The recipe logic follows real culinary principles: sweet balances bitter, acid cuts richness, heat needs sweetness to anchor it, umami deepens everything, floral lifts heavy flavors. A chef will intuitively find more recipes than a random player — that's the hidden advantage.*

---

## 14. COMPETITIVE EDGE (Why This Wins Vibe Jam)

1. **Instant play** — brewing in 5 seconds. No loading. No menus. Name → brew → hooked.
2. **"One more brew" addiction** — recipe discovery is a dopamine machine. 12 psychological hooks baked in.
3. **Geolocation-aware gameplay** — your REAL location determines your garden. Nobody else in the jam will have this.
4. **Living world feel** — economy shifts, Town Crier announces, leaderboard moves, marketplace trades happen. Solo but never alone.
5. **Free trade economy** — player marketplace + export system creates emergent Bannerlord-style trade dynamics without the complexity.
6. **Chef-designed recipes** — 156 recipes following real culinary logic. Ex-Michelin starred chef (Mourad, Nodoguro, Atelier Crenn) designed the ingredient system. Judges will taste the authenticity.
7. **Educational depth** — 70 ingredients with real-world lore, map origins, historical context. It's a world food encyclopedia disguised as a game.
8. **Interactive visual effects** — butterfly pea color-change (blue→purple→pink), 28 mapped brew visual effects. Screenshots that sell themselves.
9. **Multiplayer without friction** — no matchmaking, no lobbies, no waiting. Invisible economic multiplayer.
10. **Replayability** — persistent brewery, weekly seasons, 156 recipes to discover. Judges come back.
11. **AI-ready architecture** — pre-gen content now, live AI merchant post-jam. Designed for the future.
12. **Portal-ready** — natural medieval archway. Players walk into it. Webring continuity.
13. **Scales infinitely** — server just tracks numbers. 10 or 100,000 players, same $7/mo server.

---

## 15. GEOLOCATION SYSTEM + ECONOMY

### 15a. IP-Based Garden Bonus

On first load, game geolocates player via IP and assigns 2-3 regional bonus ingredients that grow FREE in their garden:

| Player Location | Garden Bonus Ingredients |
|----------------|------------------------|
| Japan/Korea | Yuzu, Shiso, Sakura Blossom |
| Indonesia | Torch Ginger, Butterfly Pea, Pandan |
| Southeast Asia (other) | Galangal, Lemongrass, Kaffir Lime |
| India/South Asia | Turmeric, Saffron, Cardamom |
| China/East Asia | Szechuan Peppercorn, Lemongrass, Ginger |
| North Africa/Middle East | Preserved Lemon, Dates, Orange Blossom |
| Mediterranean/Greece | Mastic, Borage, Quince |
| France/Western Europe | Lavender, Verjus, Elderflower |
| UK/Northern Europe | Wild Herbs, Chamomile, Berries |
| Scandinavia | Juniper, Berries, Wild Herbs |
| West Africa | Grains of Paradise, Baobab, Hibiscus |
| Latin America/Mexico | Cacao Nibs, Epazote, Piloncillo |
| Brazil/South America | Pink Peppercorn, Vanilla, Achiote |
| Australia/Oceania | Wattleseed, Lemongrass, Ginger |
| Americas/US general | Apple, Wild Herbs, Berries |

**Fallback:** VPN/unknown → random region. "The winds blew you here from a distant land..."

**Implementation:** ~20 lines. `fetch('https://ipapi.co/json/')` → map country/coords to region → set garden bonus.

**Why this matters:** Every player starts with a different garden. Creates natural scarcity, drives Merchant demand, and makes the export system meaningful.

### 15b. Export Board

A panel at your brew cart: "Sell Local" (instant, base price) vs "Export" (30 min delivery, premium price based on distance + scarcity).

```
═══ EXPORT PRICES ═══
                 Local    Europe   Americas   East Asia
Jamu Tonic        8c       22c      28c        18c
Golden Mead      15c       12c      15c        20c
Sake Brew        25c       20c      18c        10c
```

**Export price formula:**
```
export_price = base_price × distance_multiplier × scarcity_bonus
- distance_multiplier: how far ingredient region is from target
- scarcity_bonus: how few players in target region can make this drink
```

Indonesian player exporting jamu to Europe = high distance + high scarcity = big premium.
European player exporting lavender mead to France = no premium.

### 15c. Player Marketplace (Free Trade Economy)

A marketplace board where players list items for sale/wanted:

```
═══ BREWERS MARKETPLACE ═══
SELLING:
🧵 Saffron ×3 — 50 Crowns each — BrewKing99
🫚 Ginger Root ×10 — 8 Crowns each — JamuMaster
🍶 Golden Mead ×5 — 30 Crowns each — MeadLord

BUYING:
🌸 Sakura Blossom — offering 40c — CaliBrewer
🐉 Dragon Pepper — offering 200c — SpiceLord
```

**How it works:**
- Players post sell/buy orders (item, quantity, price)
- Orders sit on the board until matched
- Other players browse and click Buy/Sell to complete
- Transaction instant, both notified
- Implementation: one DB table + match logic

**Emergent arbitrage loop:**
- Tokyo player → free yuzu → lists on marketplace cheap
- Mexico player → buys yuzu → brews Yuzu-Piloncillo Fizz (cross-regional)
- Exports to East Asia → premium price → profit
- Players become TRADERS, not just brewers. Emergent gameplay.

### 15d. Currency

**Crowns (c).** One currency. Earned by selling drinks, spent on ingredients/upgrades/seeds/marketplace. No premium currency, no gems, no dual economy. Clean and medieval.

### 15e. Macro Economy Factors

| Factor | Effect | Implementation |
|--------|--------|---------------|
| Seasonal demand | "Winter: +50% for warm/spiced brews" | Server flag, changes weekly |
| Supply/demand curves | Oversupply → price crash | Already in core economy |
| Regional scarcity | Geolocation creates natural rarity | Free from IP mechanic |
| Export premiums | Exotic drinks cost more in distant regions | Price multiplier |
| Royal Commissions | "King wants 100 meads!" → mead spikes | Already in GDD |
| Merchant inflation | Popular merchant items cost more | Simple buy counter |
| Ingredient spoilage | Legendary ingredients expire 24h | Already in GDD |
| Marketplace speculation | Players hoarding ingredients → price rises | Emergent from marketplace |

### 15f. Monetization Plan (Post-Jam Only — Jam Version is 100% Free)

**Jam rules require: free-to-play, no login. Zero monetization at launch.**

Design hooks now, flip the switch post-jam:

| Revenue Stream | Timing | Model |
|---------------|--------|-------|
| Season Pass | Post-jam | Free track (gameplay) + Premium track ($4.99/week, cosmetics ONLY) |
| Cosmetic IAP | Post-jam | Brewery skins, cauldron styles, stall decorations, brew effects |
| Growth Multiplier | Post-jam | "Fertile Soil — plants grow 2x" ($1.99 one-time) |
| Premium Merchant | Post-jam | Unlimited AI merchant conversations ($2.99/mo) |
| Rewarded Ads | Post-jam | Watch ad → Merchant restocks early / bonus foraging time |

**Never sell:** Recipes (discovery is the game), competitive advantage, ingredients unavailable otherwise.

**Revenue estimate:** 1000 players × 5% conversion × $4.99/week season pass = $250/week. At 10K players = $2,500/week.

---

## 16. AI / LLM INTEGRATION PLAN

### Phase 1: Launch (Pre-Generated — ~$1 total cost)

All AI-generated content is created BEFORE launch and baked into the game data files.

**Pre-generated assets:**
- **Tasting notes:** 3-4 unique variations per recipe (~100 recipes × 4 = 400 notes). Pulled randomly on brew.
- **Customer descriptions:** 50+ natural-language descriptions per customer type (peasant, traveler, soldier, noble, royal). "I crave something that reminds me of warm spices and tropical nights..."
- **Recipe discovery lore:** Unique origin story per recipe. "Legend speaks of a brewer caught in a storm..."
- **Town Crier announcements:** Templates with dynamic data: "Hear ye! {{player}} has discovered {{recipe}}!" + 50 pre-written flavor lines.
- **Ingredient lore:** Already complete — 70 ingredients with full educational text (from Ingredient Codex).
- **Loading screen tips:** 30 written, expand to 50+.

**Merchant Dialogue System (Pre-Gen):**
- 200+ dialogue lines tagged by context:
  - `first_visit`, `returning`, `player_rich`, `player_broke`, `bought_X_last_time`
  - `haggling_open`, `haggling_counter`, `haggling_offended`, `haggling_deal`
  - `asking_about_ingredient`, `asking_for_hint`, `asking_about_rare`
  - `seasonal_event`, `low_stock`, `just_arrived`
- Simple state machine for haggling: offer → counter → accept/reject
- Context-aware line selection based on player state (gold, level, purchase history, recipes discovered)
- Feels alive without any live LLM calls

**Customer matching (no LLM needed):**
- Each pre-written customer description has hidden tags (e.g. "warm spices and tropical nights" → [warm, spicy, tropical])
- Player's served drink properties compared to customer tags via cosine similarity or simple tag overlap
- Multiple valid answers per customer — semantic matching, not exact matching

**Cost: ~$1 one-time for generating all pre-gen content via Sonnet/Haiku.**

### Phase 2: With Traction (Live LLM — ~$1-2/day at 100 players)

If the game gains traction post-jam, upgrade to live LLM for the Merchant only:

**The AI Merchant (Live):**
- Model: Haiku or Gemini Flash (cheapest, fastest)
- Natural language haggling — players type freely, merchant responds in character
- Context window includes: player name, level, purchase history, recipes discovered, current stock, economy state
- Remembers past interactions (stored in player data)
- 5 free conversations per day per player (throttle). "The merchant is weary. Return tomorrow." (= FOMO hook)
- Gives recipe hints based on what player hasn't discovered yet
- Personality develops: buy often = friendly, haggle hard = respectful but wary, ignore him = salty

**AI Town Crier (Live):**
- Runs every hour as an agentic task
- Input: full server state (economy, player rankings, recent discoveries, events)
- Output: 2-3 colorful announcements in medieval herald voice
- Generates dynamic Royal Commissions based on actual economy needs
- Basically an AI game master narrating the persistent world

**AI Tasting Notes (Live):**
- Replace pre-gen with live generation per brew
- Input: ingredients used, method, quality score, player's journal state
- Output: unique tasting note that teaches WHY it worked/failed
- "The honey backbone carries the fruit, but the fermentation was cut short — another 10 seconds might have unlocked something rare."

**Cost estimate at scale:**
| Players | Merchant only | Full AI suite |
|---------|--------------|---------------|
| 50 | ~$0.50/day | ~$3/day |
| 100 | ~$1-2/day | ~$7/day |
| 500 | ~$5-10/day | ~$35/day |
| 1000+ | Consider Ollama on GPU VPS ($20/mo flat) | |

**Monetization trigger:** If daily players > 500, consider optional "Premium Merchant" pass ($1.99) that unlocks unlimited merchant conversations + richer AI tasting notes. Jam version stays free forever.

### Phase 3: Agentic (Dream State)

Full AI Game Master running the world:
```
AI Game Master Agent
├── Monitors economy, player behavior, trends
├── Decides Merchant stock (what the server needs)
├── Generates Royal Commissions (based on economy state)
├── Triggers seasonal shifts and events
├── Writes Town Crier script
├── Creates emergent narratives ("A price war brews!")
└── Adjusts difficulty/pacing per player
```

This is the "living world" endgame. Save for post-jam if the game has legs.

---

## 18. OPEN QUESTIONS

- [x] ~~Game name~~ → **Brewmaster's Bazaar** ✅
- [ ] Domain: brewmastersbazaar.com? brewbazaar.gg? Check availability.
- [ ] Mobile controls: tap to interact, but small screen = cramped brewery. Simplify mobile layout? Maybe portrait mode with stacked panels?
- [ ] Sound: royalty-free medieval music source? (Pixabay, Freesound, Kevin MacLeod)
- [ ] IP geolocation API: ipapi.co free tier (1K/day)? Or ip-api.com (45/min, no key needed)?
- [ ] Hosting decision: Railway vs Fly.io vs Render? Need persistent process for economy tick.
- [ ] Custom domain: buy early so DNS propagates before May 1.
- [ ] How many recipes to ship in jam version? All 156 or curate top 80?
- [ ] Marketplace abuse: bot prevention? Rate limit trades?

## 19. CONTENT INVENTORY

All game content files:
| File | Location | Contents |
|------|----------|---------|
| GDD (this file) | `vibejam/GDD.md` | Master game design document |
| Ingredient Codex | `strategies/brewmasters-bazaar-ingredient-codex.md` | 70 ingredients, full lore, map origins, visual effects |
| Cross-Regional Recipes | `vibejam/content/cross-regional-recipes.md` | 61 cross-regional recipes with chef's notes |
| Merchant Dialogue | `vibejam/content/merchant-dialogue.md` | 215 lines for Omar the Wanderer |
| All synced to MC Docs | `http://echoforge-hq:3456/docs` | Browsable in Mission Control |
