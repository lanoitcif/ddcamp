# DnD Engine

`dnd-engine` is a React + Vite virtual tabletop for **The Dragon of Whispering Peak**. It runs as a dual-view app: a DM console at `/`, a player view at `/?mode=player`, and a campaign builder at `/?mode=builder`.

## What It Does

- Synced DM/player state via `BroadcastChannel` by default
- Optional remote sync via `?ws=host:port&room=name`
- **Party Setup wizard**: adapts the game to your real table — 1–6 heroes with
  your kids' names and classes (Rogue/Fighter/Paladin/Wizard), plus an optional
  "Short adventure" first-session arc (Bakery → Fairy Glade, ~60–90 min).
  Auto-opens on first run; reopen anytime via the sidebar **Party Setup** button.
  The config syncs to the player TV and survives resets.
- Procedural Web Audio ambience in `src/useAudio.js`
- LiteLLM-backed LLM features (proxied to local Ollama or any provider):
  - monster response generation via `src/useOllama.js`
  - context-aware music direction via `src/useMusicDirector.js`
  - all share model config in `src/llmConfig.js`
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

The app talks to a **LiteLLM proxy on `127.0.0.1:4000`**. Vite proxies
`/api/llm/*` to it and injects the master key (`LITELLM_KEY` from `.env`)
server-side, so browser code stays same-origin and never sees the key. A legacy
`/api/ollama/*` → `127.0.0.1:11434` proxy is kept for compatibility.

Start the proxy from the example config (alias → backend map):

```bash
cp litellm.config.example.yaml litellm.config.yaml   # then edit targets
litellm --config litellm.config.yaml --port 4000
curl -sS http://127.0.0.1:4000/v1/models               # what's actually served
```

### Choosing / swapping the model

The browser sends a **model name** (a LiteLLM alias) to the proxy. Default is
`fast-local`. Three ways to change it — no rebuild needed for the first two:

- **DM Console → Ambience → AI Model**: pick a listed model, or choose **Custom…**
  and type any model name the proxy currently serves.
- **`VITE_DEFAULT_LLM_MODEL`** in `.env`: sets the startup default.
- **`src/llmConfig.js`** (`LLM_MODEL_OPTIONS`) + `litellm.config.example.yaml`:
  edit when the available aliases themselves change.

If a model "stops being served," repoint its alias in `litellm.config.yaml` to a
model you have (e.g. `ollama list`) and restart LiteLLM, or just pick another in
the AI Model selector.

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
