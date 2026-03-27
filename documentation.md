# Infrastructure & User Journey: D&D Engine

## 🌐 Network Infrastructure

Your D&D Engine is configured for **Local Network & Tailscale** access. By using the `host: true` setting in Vite, the server listens on all network interfaces.

```mermaid
graph TD
    subgraph "Host Machine (DM Laptop)"
        Vite[Vite Dev Server :5173]
        App[React D&D Engine]
        DB[(Local Storage)]
        Vite --> App
        App --> DB
    end

    subgraph "Local Network (Home WiFi)"
        TV[Smart TV Browser]
        Tablet1[Kid 1 Tablet]
        Tablet2[Kid 2 Tablet]
    end

    subgraph "Tailscale (Remote/Mesh)"
        Phone[Remote Phone]
        RemoteLaptop[Remote Laptop]
    end

    Vite -- "http://192.168.x.x:5173" --> TV
    Vite -- "http://192.168.x.x:5173" --> Tablet1
    Vite -- "http://192.168.x.x:5173" --> Tablet2
    
    Vite -- "http://100.x.x.x:5173" --> Phone
    Vite -- "http://100.x.x.x:5173" --> RemoteLaptop
```

---

## 🎭 User Journey: The DM Workflow

This chart outlines how you manage the game session from the DM Dashboard.

```mermaid
sequenceDiagram
    participant DM as DM Dashboard (Laptop)
    participant Engine as Game Engine (State)
    participant TV as Player View (TV Screen)

    Note over DM: Start Session
    DM->>Engine: Select "Mrs. Crumb's Bakery"
    Engine->>TV: Update Background & Music
    
    Note over DM: Combat Starts
    DM->>Engine: Click "Lily: Sneak Attack"
    Engine->>Engine: Roll d20 + Bonus
    Engine-->>TV: Trigger Cinematic Dice Animation
    
    Note over DM: Health Management
    DM->>Engine: Decrease Thorne HP (-5)
    Engine->>TV: Update HP Bar (Green -> Red)
    
    Note over DM: Reward Player
    DM->>Engine: Award Loot: "Golden Crumb"
    Engine-->>TV: Trigger Golden Trophy Popup
    
    Note over DM: Next Turn
    DM->>Engine: Click "Next Player"
    Engine->>TV: Move Glow to Next Hero Portrait
```

---

## 🎲 User Journey: The Player Experience

This chart outlines what the kids see and how they interact with the world you've built.

```mermaid
graph LR
    subgraph "Visual Input (TV)"
        Scene[Atmospheric Map]
        Heroes[Hero Status Bar]
        Dice[Dice Overlay]
        Toast[Quest Toasts]
    end

    subgraph "Player Actions (Physical/Tablet)"
        Roll[Roll Physical Dice]
        DDB[Check D&D Beyond]
        Talk[Roleplay with DM]
    end

    Scene -->|Set Mood| Talk
    Heroes -->|Check Health| Talk
    Talk -->|Declare Action| Roll
    Roll -->|Result| DM[Tell DM Result]
    DM -->|Input to App| Dice
    Dice -->|Visual Confirmation| Heroes
```

---

## 🛠️ Data-Driven Engine Architecture

How the app remains reusable for future campaigns.

```mermaid
graph TD
    JSON[campaign_data.json] -->|Load| Hook[useCampaign Hook]
    Hook -->|State| DM[DM Dashboard]
    Hook -->|State| TV[Player View]
    
    subgraph "Sync Mechanism"
        BC[BroadcastChannel API]
        LS[LocalStorage]
        DM <--> BC <--> TV
        DM --> LS
    end
```
