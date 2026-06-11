# 🐉 D&D Virtual Tabletop (VTT) Engine

A custom-built, lightweight dual-screen Virtual Tabletop (VTT) designed for running D&D campaigns for kids and young heroes (Ages 8–13). This project hosts the engine and the campaign **"The Dragon of Whispering Peak"**—a whimsical, Ghibli-esque adventure about empathy, problem-solving, and friendship.

---

## 📸 Overview & Design

The engine runs as a dual-view web application:
1. **DM Console** (default view `/`): Allows the Dungeon Master to control the scenes, track turns, manage hit points, trigger reactions, show handouts, run interactive puzzles, and direct music and dialogue.
2. **Player TV View** (`/?mode=player`): Designed to be displayed on a second monitor or TV. It presents a borderless cinematic view of the current scene, monster portraits, active combat turn alerts, real-time HP stats, full-screen handouts, floating emoji reactions, and screen shake effects.
3. **Campaign Builder** (`/?mode=builder`): A utility mode to edit and export custom characters and campaigns.

---

## 📂 Project Structure

```
├── dnd-engine/              # Main VTT web application (React + Vite)
│   ├── public/              # Static files (art assets, campaign files)
│   ├── src/                 # Source code (views, hooks, state manager)
│   └── server/              # Optional WebSocket relay server for remote play
├── docs/                    # Campaign guides and setup documentation
│   ├── character_sheets.md  # Simplified character sheets for kids
│   ├── dm_quick_sheet.md    # Quick reference guide for the DM Console
│   ├── documentation.md     # General project architecture overview
│   └── vtt_setup_guide.md   # Detailed TV/second screen hardware setup guide
├── demo/                    # Playtest recording scripts and assets
│   ├── captures/            # Screenshot sequence for the trailer slider
│   ├── trailer.html         # HTML canvas slider for generating trailers
│   └── render_demo.mjs      # Playwright rendering script to produce .webm videos
└── life-is-something-more/  # Standalone audio synthesis lab & experiments
```

---

## 🛠️ Key Features

- **Procedural Ambience & SFX**: A custom Web Audio engine synthesizes dynamic background tracks and ambient noise for every scene.
- **LiteLLM / OpenAI & Ollama Integration**:
  - **Ambient Music Director**: Feeds active game state context (alive monsters, active player turn, puzzle status, mood) into local models (e.g., `qwen3.5`) to dynamically direct the speed, tension, register, and motifs of the synthesized score.
  - **In-Character Monster Dialogue**: DM can prompt active monsters, generating contextual, roleplay-ready responses in 2-3 sentences without mechanical meta-text.
- **Interactive Puzzles**: Includes built-in interactive puzzles (Spotlight Search, Sneak Path, and Dragon's Hoard) synced between screens.
- **Responsive Layout**: Designed with a sleek, 8-bit retro theme using Lucide icons.

---

## 🚀 Quick Start

### 1. Pre-requisites
- **Node.js** (v18+)
- (Optional) **Ollama** or **LiteLLM** running locally for AI features.
  - LiteLLM defaults to proxying `http://127.0.0.1:4000`.
  - Native Ollama falls back to `http://127.0.0.1:11434`.

### 2. Configure the LLM Key (optional, for AI features)
```bash
cd dnd-engine
cp .env.example .env   # then put your LiteLLM master key in .env
```
`.env` is gitignored; the key is injected by the Vite dev proxy and never reaches the browser.

### 3. Run the App
```bash
cd dnd-engine
npm install
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

### 4. Open the Screens
- **DM Console**: Open `http://localhost:5173/` on your primary screen.
- **Player View**: Drag a tab with `http://localhost:5173/?mode=player` to your TV/projector and press `F11` for fullscreen.

---

## 📖 Campaign & Guides

- **Full Campaign Walkthrough**: [dnd-engine/public/DM_Campaign_Walkthrough.md](dnd-engine/public/DM_Campaign_Walkthrough.md) *(also browseable directly in the DM Console sidebar)*
- **Console Setup & Troubleshooting**: [docs/vtt_setup_guide.md](docs/vtt_setup_guide.md)
- **Dungeon Master Console Reference**: [docs/dm_quick_sheet.md](docs/dm_quick_sheet.md)
- **Player Character Sheets**: [docs/character_sheets.md](docs/character_sheets.md)

---

## 🧪 Testing

The engine contains standard units and browser playtest simulation tests.

```bash
cd dnd-engine
# Run unit tests
npm test

# Run UI/Playwright simulation tests
npx playwright test
```
