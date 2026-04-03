# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Brewmaster's Bazaar is a browser-based cozy brewery simulation game for Vibe Jam 2026. Players forage ingredients, discover recipes through experimentation, brew drinks, and compete in a living economy shaped by real players (invisible multiplayer via async trading and geolocation-based regional economies).

**Status:** Pre-alpha. Game data and design docs are complete (~8,000 lines of JSON config, ~4,000 lines of design docs). Frontend and backend implementation have not started beyond scaffolding.

## Commands

```bash
npm run dev       # Vite dev server (localhost:5173, proxies /api to localhost:3000)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run server    # Express backend on port 3000
```

Run frontend and backend together: start `npm run server` in one terminal, `npm run dev` in another.

## Tech Stack

- **Frontend:** ThreeJS + vanilla JS (ES modules) + Vite
- **Backend:** Express 5 + better-sqlite3
- **Audio:** Howler.js
- **No TypeScript.** JavaScript only.

## Architecture

### Data-Driven Design
All game balance lives in JSON files under `data/`. The `game-config.json` is the central config (brewing params, customer behavior, economy constants, progression costs, geolocation regions, seasons). Other data files define ingredients, recipes, customers, merchants, bases, equipment, regions, and royal commissions.

When implementing game logic, always read parameters from these JSON configs rather than hardcoding values.

### Frontend (`src/`)
Entry point: `src/main.js` → bootstraps ThreeJS isometric scene. Currently a scaffold.

### Backend (`server/`)
Entry point: `server/index.js` → Express app with CORS. Currently has only `GET /api/health`. Vite proxies `/api` routes to port 3000 during development.

### Design Docs (`docs/`)
- `GDD.md` — Full game design document including first-60-seconds flow, psychology hooks, progression
- `ECONOMY.md` — Economy formulas, pricing tiers, geolocation trade mechanics, gold sinks
- `cross-regional-recipes.md` — Trade route strategies, regional ingredient advantages
- `gdd-strategies.md` — Advanced gameplay strategies
- `merchant-dialogue.md` — NPC dialogue scripts

Read these before implementing any game system. They contain specific formulas, timing values, and design rationale.

## Key Game Systems

- **Brewing:** Base (grain/honey/fruit/none) + 2-3 flavor ingredients + method (boil/ferment/distill). Recipe discovery through experimentation with near-miss hints.
- **Geolocation economy:** IP-based regional assignment gives each player unique garden ingredients. Cross-region trading creates natural trade routes with distance/scarcity bonuses.
- **Async trading:** Marketplace (crowns) + Trade Board (barter). No real-time interaction. Dragon Nest-inspired.
- **Progression:** 5 cart tiers requiring both gold AND reputation. Level 3 unlocks the 3rd flavor slot (critical gate for rare/legendary recipes).
- **Anti-manipulation:** Hoarding caps, listing limits, trade cooldowns, ingredient expiry.

## Data File Relationships

Recipes in `recipes.json` reference ingredient IDs from `ingredients.json`. Customer multipliers in `customers.json` interact with base prices from `game-config.json`. Regional garden ingredients in `game-config.json` reference ingredient IDs. Always cross-check IDs when modifying data files.
