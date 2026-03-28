# 📺 D&D Engine: TV Setup Guide
*A guide to running "The Dragon of Whispering Peak" on your big screen using the custom VTT app.*

---

## 🖥️ 1. Setup the "Big Screen" (TV)
The `dnd-engine` is designed for a dual-screen experience:

1.  **Laptop (DM Console):** Open `http://localhost:5173/` in your browser. This is your control center.
2.  **TV (Player View):** Open `http://localhost:5173/?mode=player` in a second tab or window.
3.  **Drag & Fullscreen:** Drag the **Player View** window to your TV screen (via HDMI or Casting) and press `F11` for a borderless cinematic experience.

### Browser Requirements
- A modern browser with **BroadcastChannel** and **Web Audio API** support.
- Recommended: Chrome 54+, Firefox 38+, Edge 79+, Safari 15.4+.
- BroadcastChannel does **not** work in private/incognito mode on some browsers.

### Network Note
Both views must be on the **same origin** (`localhost:5173`). If accessing from a second device on LAN (e.g., a Smart TV browser), use the machine's IP address (e.g., `http://192.168.1.100:5173/?mode=player`). Vite is configured with `host: true` for this. Both devices must use the same URL host for BroadcastChannel sync to work.

### Internet Dependency
Character portraits and scene backgrounds load from external URLs (Unsplash, DiceBear). An internet connection is required for full visuals. If images fail to load, fallback placeholders will appear automatically.

---

## 🎮 2. Interactive Features for Players
The TV view isn't just a static image; it's an interactive portal.

### ✨ Digital Pings (The "Magic Pointer")
In the DM Console, click anywhere on the **Scene Context** parchment. A pulsing golden ring will appear on the TV at that exact spot. Use this to point out clues like "Blue Scales" or "Crumb Trails."

### 📜 Quest Handouts
When the players find an item, click it in the **Handouts** gallery in the DM sidebar. A high-resolution image of the item (like a Sun-Cake or Dragon Medal) will fade in on the TV view with a magical sparkle effect.

### 🎉 Quick Reactions
Use the emoji bar in the DM Console to send floating reactions (🎉, ❤️, 🌟) to the TV. It's a great way to reward kids for funny or heroic ideas without saying a word.

---

## 🎨 3. Character Customization
At the start of your session, let the kids choose their look:
1.  In the DM Console, hover over a character's portrait.
2.  Click the **CHANGE** button.
3.  Choose from the **Portrait Gallery** (8 options). The TV view will update instantly!

---

## 💡 DM Pro-Tips for TV Play
- **Minecraft Moods:** Use the `Ambience` controls to switch from `calm` (exploration) to `tense` (finding a clue) to `combat` (boss fight). The Minecraft-style procedural music will crossfade automatically.
- **Narrative Subtitles:** Type dialogue into the **Narration** box and hit **Send**. It appears as large, readable text on the TV, perfect for Mrs. Crumb's dramatic lines.
- **Auto-Sync:** If you refresh either page, the game state is saved in `localStorage`. Your HP, Quests, and Scene will stay exactly where you left them.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| TV not syncing with DM Console | Both must be on the same origin. Check the URL — `localhost` ≠ `127.0.0.1`. Refresh both pages. |
| No audio playing | Click inside the page first (browsers require user interaction to enable audio). Then click **Start** in Ambience controls. |
| Images appear as placeholders | Check internet connection. External image services (Unsplash) must be reachable. |
| Game state seems stuck | Use **Reset Campaign** (bottom of DM sidebar). This clears localStorage and restarts fresh. |
| Blank screen / crash | The app has a built-in recovery screen. Click **Restart Adventure** to reload. If it persists, clear browser data for localhost:5173. |
