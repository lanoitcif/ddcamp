# Copilot Instructions

## Project Overview

A D&D virtual tabletop (VTT) engine designed for playing "The Dragon of Whispering Peak" campaign with kids ages 8–13. The app runs as a dual-view React SPA: a **DM Console** for the game master and a **Player View** displayed on a shared TV/screen. Both views share state via BroadcastChannel and localStorage.

## Build, Test, and Lint

All commands run from the `dnd-engine/` directory:

```bash
npm run dev          # Vite dev server on http://localhost:5173 (host: true for LAN)
npm run build        # Production build → dist/
npm run lint         # ESLint
npm run lint -- --fix
```

### Tests (Playwright)

The dev server must be running before executing tests.

```bash
npx playwright test                                       # All tests
npx playwright test ui_gameplay_test.spec.js              # Single file
npx playwright test ui_gameplay_test.spec.js -g "Critical Hit"  # Single test by name
npx playwright test --headed                              # Watch in browser
```

Test files live in `dnd-engine/` root (not a `tests/` subdirectory):
- `simulate_campaign.spec.js` — DM→Player sync and scene transitions
- `ui_gameplay_test.spec.js` — Exhaustive UI/gameplay assertions
- `visual_documentation.spec.js` — Screenshot-based visual regression (saves to `screenshots/`)

## Architecture

### Dual-View, Single State Source

`App.jsx` renders either `<DMControl />` or `<PlayerView />` based on the `?mode=player` URL param. Both consume the same `useCampaign()` hook.

- **DM Console** (`/`) — Sidebar with scene selector, initiative tracker, quest log, and DM tools (skill check roller, secret rolls, narration text, overlay dismiss, campaign reset). Main area has character cards and scene-relevant monster cards with HP controls, custom HP delta input, and action buttons that trigger attack + damage rolls. Combat log at bottom.
- **Player View** (`/?mode=player`) — Full-screen cinematic display with scene crossfade transitions, "YOUR TURN" banner, dice roll overlays (5s) with damage, critical hit/fail callouts, quest toasts (6s), DM narration subtitles, and a hero+monster status bar with HP numbers.

### State Sync (`useCampaign.js`)

`useCampaign()` is the single custom hook for all game logic. It manages:

- `currentSceneId`, `characterHp`, `activeTurnId`, `completedQuests`, `lastRoll`, `toast`, `narration`, `rollLog`

State flows: DM action → `updateGameState()` → React state + `localStorage('dnd_game_state')` + `BroadcastChannel('dnd_engine_sync')` → Player View reacts.

Key functions: `handleHpChange` (clamped to 0–maxHp), `setHp`, `rollDice` (d20 + damage), `rollSkillCheck`, `rollSecret` (DM-only), `nextTurn`, `awardLoot`, `setNarration`, `dismissOverlay`, `resetGame`.

### Data-Driven Campaign (`campaign_data.json`)

All campaign content — characters, scenes, monsters, quests — lives in `src/campaign_data.json`. Components iterate over this data to generate UI. To run a different campaign, swap this file.

## Key Conventions

### Styling

- **Tailwind-first** with custom theme colors: `dnd-gold` (#d4af37), `dnd-red` (#8b0000), `dnd-parchment` (#f4f1ea), `dnd-dark` (#1a1a1a).
- Custom CSS classes in `index.css`: `.parchment`, `.dnd-button`, `.dnd-card`. Use these for consistent D&D-themed elements.
- Inline styles only for dynamic values (background images, width percentages).
- `clsx` and `tailwind-merge` are available for conditional class composition.

### Components and State

- Functional components only. No class components.
- All game state lives in the `useCampaign` hook — components don't manage their own game state.
- `framer-motion` is installed for animations. `lucide-react` provides icons (Sword, Heart, Trophy, Scroll, etc.).

### Naming

- Files: `snake_case` (`campaign_data.json`, `useCampaign.js`)
- Components: `PascalCase` (`DMControl`, `PlayerView`)
- Variables/functions: `camelCase`
- CSS/Tailwind: `dnd-*` prefix for project-specific tokens

### Network Access

Vite is configured with `host: true` so the app is accessible over LAN/Tailscale. The DM runs the console on their laptop while the Player View displays on a TV via a second device or browser window.
