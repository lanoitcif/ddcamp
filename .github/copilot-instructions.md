# Copilot Instructions

## Project Overview

A D&D virtual tabletop (VTT) engine designed for playing "The Dragon of Whispering Peak" with kids ages 8–13. The app runs as a dual-view React SPA: a **DM Console** for the game master and a **Player View** for a shared TV/screen. Local state sync is handled through `BroadcastChannel`; optional remote sync is handled by `useSync` and the relay server.

## Build, Test, and Lint

All commands run from the `dnd-engine/` directory:

```bash
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
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

Test files mostly live in `dnd-engine/` root, with some additional specs under `dnd-engine/tests/`:
- `simulate_campaign.spec.js` — DM→Player sync and scene transitions
- `ui_gameplay_test.spec.js` — Exhaustive UI/gameplay assertions
- `visual_documentation.spec.js` — Screenshot-based visual regression (saves to `screenshots/`)

## Architecture

### Dual-View, Single State Source

`App.jsx` renders either the DM console, player view, or builder mode based on the URL params. All consume the same `useCampaign()` hook.

- **DM Console** (`/`) — Sidebar with scenes, quests, narration, reactions, ambience controls, overlays, and reset controls. Main area has character/monster cards, HP controls, and action buttons.
- **Player View** (`/?mode=player`) — Full-screen cinematic display with scene transitions, turn banner, dice/quest overlays, narration, and status bars.
- **Builder** (`/?mode=builder`) — Campaign editor with validation and import/export support.

### State Sync (`useCampaign.js`)

`useCampaign()` is the single custom hook for all game logic. It manages:

- `currentSceneId`, `characterHp`, `activeTurnId`, `completedQuests`, `lastRoll`, `toast`, `narration`, `rollLog`, `audioSettings`, `audioDirector`

State flows: DM action → `updateGameState()` → React state + `localStorage('dnd_game_state')` + sync transport → Player View reacts.

Key functions include HP clamping, action rolling, narration, quest rewards, puzzle updates, and synced audio state changes.

### Data-Driven Campaign (`campaign_data.json`)

All campaign content — characters, scenes, monsters, quests — lives in `src/campaign_data.json`. Components iterate over this data to generate UI.

## Key Conventions

### Styling

- **Tailwind-first** with custom theme colors: `dnd-gold` (#d4af37), `dnd-red` (#8b0000), `dnd-parchment` (#f4f1ea), `dnd-dark` (#1a1a1a).
- Custom CSS classes in `index.css`: `.parchment`, `.dnd-button`, `.dnd-card`. Use these for consistent D&D-themed elements.
- Inline styles only for dynamic values (background images, width percentages).
- `clsx` and `tailwind-merge` are available for conditional class composition.

### Components and State

- Functional components only. No class components.
- All game state lives in the `useCampaign` hook — components don't manage their own game state.
- `lucide-react` provides icons. Prefer existing project styles and terse, readable controls over adding new visual systems.

### Naming

- Files: `snake_case` (`campaign_data.json`, `useCampaign.js`)
- Components: `PascalCase` (`DMControl`, `PlayerView`)
- Variables/functions: `camelCase`
- CSS/Tailwind: `dnd-*` prefix for project-specific tokens

### Network Access

Vite is configured for LAN/Tailscale access. When you need predictable networking, start it with `--host 0.0.0.0 --port 5173 --strictPort` so it does not silently drift to `5174`.
