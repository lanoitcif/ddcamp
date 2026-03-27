# D&D Engine Documentation (Updated)

## ✅ Current Build Status

- Core gameplay + DM tools complete
- Immersive audio/visual layer complete
- Interactive puzzle system complete (3 puzzles)
- Automated full-campaign playtest complete (**0 issues found**)

Recent validation:
- `npx playwright test` (15 existing tests): pass
- `npx playwright test playtest_campaign.spec.js`: pass
- `npx vite build`: pass

---

## 🌐 Runtime & Sync Architecture

```mermaid
graph TD
    subgraph Host["DM Laptop (Vite :5173)"]
        App[React SPA]
        Hook[useCampaign state]
        LS[(localStorage dnd_game_state)]
        BC[BroadcastChannel dnd_engine_sync]
        Audio[useAudio Web Audio Engine]
        Puzzles[Puzzles Registry]
        Data[campaign_data.json]
    end

    subgraph Views
        DM[DM Console /]
        TV[Player View /?mode=player]
    end

    Data --> Hook
    Hook <--> LS
    Hook <--> BC
    Hook --> DM
    Hook --> TV
    Audio --> DM
    Audio --> TV
    Puzzles --> DM
    Puzzles --> TV

    DM -->|Actions + controls| Hook
    TV -->|Stepping-stone clicks| Hook
```

---

## 🎛️ DM-to-Player Experience Flow

```mermaid
sequenceDiagram
    participant DM as DM Console
    participant State as useCampaign
    participant Sync as BroadcastChannel + localStorage
    participant TV as Player View
    participant Audio as useAudio

    DM->>State: Scene change / roll / HP / quest / narration
    State->>Sync: Persist + broadcast
    Sync-->>TV: Shared state update
    TV->>TV: Render scene transition + overlays + hero bar

    DM->>Audio: Set mood (calm/tense/combat), volume, play/pause
    Audio-->>TV: Ambient crossfade + SFX

    DM->>State: Start scene puzzle
    State-->>TV: Activate puzzle overlay
    TV->>State: Player interaction (stepping stones)
    State-->>DM: Puzzle progress mirrored in controls
```

---

## 🧩 Campaign UX Journey (Kids-first)

```mermaid
flowchart LR
    A[Act 1: Bakery] --> A1[Spotlight Search Puzzle]
    A1 --> A2[Find clues + Quest toast]
    A2 --> B[Act 2: Sparkle Woods]
    B --> B1[Hoot Riddle: Typewriter + Hints]
    B1 --> B2[Combat vs Hoot]
    B2 --> C[Act 3: Whispering Peak]
    C --> C1[Stepping Stones Puzzle - Interactive]
    C1 --> C2[Boss fight vs Glint]
    C2 --> D[Final quest: Recover Sun-Cakes]
    D --> E[Celebration toast + narration]
```

---

## 🎮 User Experience Highlights

### Player View (TV)
- Cinematic scene transitions
- Ambient music per scene + mood switching
- Particle effects (bakery/woods/peak variants)
- Dice tumble animation + critical hit/fail moments
- Quest completion toasts
- DM narration subtitles
- Interactive puzzle overlays (especially stepping stones)

### DM Console
- Fast scene switching and turn control
- Character + monster cards with HP controls and custom HP delta
- Skill check + secret roll tools
- Combat log with roll history
- Audio control panel (play/pause, mood, volume)
- Scene-specific puzzle launcher + live puzzle management

---

## 🧪 Playtest Coverage & Outcome

The automated multi-agent campaign playtest (`playtest_campaign.spec.js`) simulates:
- DM orchestration across all three acts
- Lily/Thorne/Valerius action flow
- All three puzzles end-to-end
- Quest completion flow
- Combat + HP sync behavior
- Overlay visibility
- Persistence after page refresh

```mermaid
flowchart TD
    T0[Playtest Start] --> T1[Act 1: Bakery + Spotlight]
    T1 --> T2[Act 2: Riddle + Hoot Combat]
    T2 --> T3[Act 3: Stones + Glint Combat]
    T3 --> T4[Edge Cases]
    T4 --> T5[Report]

    T4 --> E1[HP floor/ceiling]
    T4 --> E2[Secret roll hidden]
    T4 --> E3[Quest button lockout]
    T4 --> E4[State persistence]
    T4 --> E5[Monster scene filtering]

    T5 --> R0[Result: 0 issues]
```

---

## 🗂️ Source of Truth Files

- Game UI: `dnd-engine/src/App.jsx`
- State engine: `dnd-engine/src/useCampaign.js`
- Audio engine: `dnd-engine/src/useAudio.js`
- Puzzle system: `dnd-engine/src/Puzzles.jsx`
- Campaign data: `dnd-engine/src/campaign_data.json`
- Full playtest: `dnd-engine/playtest_campaign.spec.js`
