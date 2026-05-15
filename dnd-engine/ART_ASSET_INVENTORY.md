# Art Asset Inventory and Update Notes

## Goal
Keep the project visually consistent with a playful fantasy/pixel-art direction while still tolerating mixed local and remote assets during active iteration.

## Current State
The project no longer lives in a single “all SVG” art strategy. The active build uses a mix of:

- DiceBear-style avatar sources
- local pixel-art assets in `dnd-engine/public/`
- screenshot-driven demo materials in `demo/captures/`
- some remote images still referenced by campaign data or earlier content

### 1. Player Characters
- Character presentation is currently optimized for readability in the DM card layout and player HUD first.
- Portrait source consistency matters less than silhouette clarity, HP readability, and fast recognition.

### 2. Monsters
- Monster visuals should stay family-friendly and legible at a glance.
- For current playtests, UI coherence matters more than strict source uniformity.

### 3. Scenes / Backgrounds
- The player-facing experience now leans harder into stylized pixel-art backgrounds and overlays.
- Demo/trailer visuals should use current captures from `demo/captures/`, not stale screenshots from older visual phases.

### 4. Handouts / Items
- Handouts should remain bold, simple, and readable from across a room.
- Whenever possible, prefer assets that hold up on the player screen and in recorded demo footage.

## Summary
Treat this file as a visual-direction note, not a strict inventory of exact live asset URLs. The current priority is:

- strong TV readability
- cohesive playful fantasy tone
- updated captures for demo material
- minimal reliance on stale screenshots
