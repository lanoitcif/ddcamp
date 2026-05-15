# DnD Engine

`dnd-engine` is a React + Vite virtual tabletop for **The Dragon of Whispering Peak**. It runs as a dual-view app: a DM console at `/`, a player view at `/?mode=player`, and a campaign builder at `/?mode=builder`.

## What It Does

- Synced DM/player state via `BroadcastChannel` by default
- Optional remote sync via `?ws=host:port&room=name`
- Procedural Web Audio ambience in `src/useAudio.js`
- Local Ollama-backed LLM features:
  - monster response generation via `src/useOllama.js`
  - context-aware music direction via `src/useMusicDirector.js`
- Data-driven campaign content in `src/campaign_data.json`
- Playwright-style gameplay tests and demo capture scripts

## Run Locally

```bash
cd dnd-engine
npm install
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Expected local URLs:

- DM console: `http://localhost:5173/`
- Player view: `http://localhost:5173/?mode=player`
- Builder: `http://localhost:5173/?mode=builder`

For LAN or Tailscale play, use the machine IP instead of `localhost`.

## Local Services

The app expects Ollama on `127.0.0.1:11434`. Vite proxies `/api/ollama/*` to Ollama, so browser code stays same-origin.

Recommended verification:

```bash
curl -sS http://127.0.0.1:11434/api/tags
```

Current local model defaults:

- music director: `qwen3:8b`
- monster/character response generation: `qwen3:8b`

## Commands

```bash
npm run dev
npm run build
npm run lint
```

Optional relay server:

```bash
cd server
npm install
npm run dev
```

## Tests And Demo Assets

Useful files:

- `playtest_campaign.spec.js`
- `ui_gameplay_test.spec.js`
- `simulate_campaign.spec.js`
- `demo/capture_playtest.mjs`
- `demo/render_demo.mjs`

Demo outputs currently live in:

- `../demo/creative_llm_demo.webm`
- `../demo/creative_llm_demo.mp4`
- `public/creative_llm_demo.webm`
