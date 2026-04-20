# New Game — Top-Down 3D Helicopter Combat
**Codename:** `new-game-1` · **Repo:** `New-Game-1` · **Target:** HTML5, iframe-embeddable, arcade-platform ready

---

## 1. Executive summary

A browser-based, top-down helicopter combat game. A real 3D helicopter (full 360° rotation, all sides visible) flies over a large 2.5D-styled map (forest, hills, enemy bases) rendered inside a Three.js scene with real lighting and shadows. The player destroys bases, turrets, and tracking rocket launchers, earns points, and spends them in a shop on weapon upgrades. Runs are 3–10 minutes. Global leaderboard. Extensible map system — new maps can be added without engine changes. Single-bundle, iframe-ready build for CrazyGames / Poki / GameDistribution / itch.io.

**Core loop:** scout → engage → destroy → earn points → upgrade → push deeper → beat leaderboard.

---

## 2. Roles — who does what

**You are the Director, Producer, and QA.**
- Describe what you want in plain English
- Play what Claude Code builds
- Report bugs (screenshots + plain-English descriptions)
- Approve or reject Claude's plans before it writes code
- Commit frequently (your safety net)
- Manage assets (download, organize into folders)
- Write shop copy, pick music, name maps

**Claude Code is the Developer.**
- Writes every line of code
- Explains changes in plain English before writing them
- Fixes bugs you report
- Never ships code without showing the plan first

**You never edit code yourself.** Even if something looks like a one-character fix, route it through Claude Code. Hand-edits by non-coders tend to cascade into problems that are hard to describe back to an AI.

---

## 3. Zero-coding playbook

The single biggest factor in whether this project ships: whether you follow this loop.

### 3.1 — The loop

For every task, in order:

1. **Describe.** In the Claude Code panel, write what you want in plain English. *"Add a turret enemy that tracks the helicopter and fires every 2 seconds."*
2. **Plan.** Planning mode is ON. Claude writes a plan, not code. You read it. It's plain English.
3. **Approve or push back.** If the plan sounds wrong or over-complicated, say so: *"Simpler please. Just one turret type for now."*
4. **Execute.** Claude writes the code.
5. **Test.** Run the game. Click around. Does it work? Does it look right?
6. **Commit or revert.**
   - Works → commit (see §3.3). This is your restore point.
   - Broken → describe what you see (or screenshot it), tell Claude to fix. Don't commit broken.
7. **Clear.** When the topic is done, type `/clear` in Claude Code to reset context before the next task.

### 3.2 — Running the game

Every time you want to see the game:

1. In VS Code: top menu → **Terminal → New Terminal** (or `` Ctrl+` ``).
2. Type `npm run dev` and press Enter.
3. A URL appears (usually `http://localhost:5173`). Ctrl+click it, or paste into browser.
4. The game loads. Leave this running. Every time Claude changes code, the browser auto-refreshes.
5. When done, click in the terminal and press `Ctrl+C` to stop.

### 3.3 — Committing via VS Code (no terminal needed)

Committing = making a restore point. Do this every time the game works after a change.

1. Click the **Source Control** icon in the left sidebar (branching-tree icon, 3rd from top).
2. You'll see a list of changed files.
3. In the message box, type a short description — *"add turret enemy"* is fine.
4. Click the blue **Commit** button.
5. Click **Sync Changes** to push it to GitHub (`New-Game-1` repo).

If something breaks later, go to Source Control → three-dot menu → **Checkout to...** → pick your last good commit. Ask Claude Code to walk you through if it ever happens — it's rare but it's your escape hatch.

### 3.4 — Describing bugs to Claude

You don't need technical vocabulary:

- **Screenshots.** Paste directly into Claude Code. *"The tree is floating above the ground."*
- **Short videos / GIFs.** For motion issues. *"Watch the helicopter rotate — it feels sticky and slow."*
- **Expected vs actual.** *"I pressed F and expected a rocket. Nothing happened."*
- **Error messages.** If the browser shows an error, screenshot it. Claude can read it.

Do not try to guess the cause. Just describe what you saw.

### 3.5 — Session hygiene

- **One task per Claude Code session.** Finish → commit → `/clear` → next task.
- **Planning mode stays ON.** Every session, always.
- **If a task takes more than 3 back-and-forths to get right, stop and reset.** `/clear`, restart from last commit, describe the task more specifically.
- **Stick with Claude Opus 4.7.** See §15.

### 3.6 — When you're stuck

If Claude Code introduces a bug it can't fix after 2–3 attempts:

1. Stop digging. Don't let Claude keep trying things.
2. Revert to last commit (Source Control → Discard All Changes).
3. `/clear` in Claude Code.
4. Describe the original task again, more specifically. Often the first ask was ambiguous.
5. If it repeats, the task is too big — ask Claude to break it into smaller steps.

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Engine** | **Three.js** (r160+) | Real 3D for the helicopter, orthographic top-down camera, real shadows. Mature, iframe-friendly. |
| **Language** | **TypeScript (strict)** | Fewer bugs. You never read it — doesn't matter. |
| **Bundler** | **Vite** | Fast dev loop, single-bundle static build that iframes cleanly. |
| **Physics** | Custom planar | Movement is on a plane. Circle-vs-circle + circle-vs-AABB. No heavy library. |
| **State** | Lightweight ECS | Keeps enemy/projectile logic clean. |
| **UI / HUD / Menu / Shop** | HTML + CSS over the canvas | Easier, more polished, accessible. |
| **Audio** | Howler.js | Cross-browser, handles autoplay policies. |
| **Leaderboard** | Supabase (free tier) | Simple backend. One table + one validation function. |
| **Arcade SDKs** | CrazyGames SDK, Poki SDK | Optional, behind an adapter. |
| **Model format** | `.glb` (GLTF, Draco-compressed) | Single file, small, fast. |

---

## 5. Visual approach — the "2.5D" look

- **Helicopter:** real 3D GLB model. Casts real shadows. See §6 for feel specs.
- **Ground:** large tiled plane with seamless texture. Slight heightmap displacement for gentle hills.
- **Trees:** low-poly 3D cones/cylinders with baked textures (Kenney's nature pack). Instanced — 1000+ trees as one draw call.
- **Buildings / bases:** simple extruded boxes, textured. Low-poly, high-impact.
- **Turrets / rocket launchers:** two-part 3D — static base + rotating top tracking the helicopter.
- **Shadows:** one `DirectionalLight` with `castShadow = true`. Helicopter + tall objects cast; ground receives. Bounded GPU cost.
- **Parallax background:** cloud layer above (slow scroll), distant-terrain layer below (very slow, blurred). Depth without a skybox.
- **Post-processing (Phase 4+ optional):** vignette, color grading. Ship v1 without if frame budget tight.

---

## 6. Helicopter feel — non-negotiable specs

A stiff helicopter kills this game. Six techniques work together; **all six must be implemented**.

| # | Technique | Implementation detail |
|---|---|---|
| 1 | **Real 3D geometry** | `.glb` from Poly Pizza or Quaternius with separable main rotor + tail rotor meshes. Not a sprite. |
| 2 | **Controlled angular velocity** | Q/E rotates at ~2.0 rad/s max, ease-in 0.15s, ease-out 0.25s. Never snap. Full 360° unbounded. |
| 3 | **Tilt-into-turn (roll)** | `mesh.rotation.z` lerps toward `-angularVelocity * 0.3`, smoothing ~0.15. Leans into turns. |
| 4 | **Nose pitch on move (pitch)** | `mesh.rotation.x` lerps toward `forwardSpeed * 0.2`, smoothing ~0.1. Noses down accelerating, up braking. |
| 5 | **Idle hover bob** | `mesh.position.y = baseY + sin(elapsed * 2.0) * 0.1`. Constant subtle vertical drift. |
| 6 | **Dynamic shadow** | `DirectionalLight` with `castShadow = true`, 2048² shadow map. Shadow moves and rotates with the helicopter. |

**Plus:**
- Main rotor spins at ~40 rad/s (speed blur + semi-transparent disc mesh).
- Tail rotor spins at ~50 rad/s.
- Camera follows with lerp smoothing ~0.1 (slight cinematic lag).
- Camera stays world-aligned (doesn't rotate with helicopter) — easier to play, standard for top-down.

These specs go straight into `CLAUDE.md` so Claude Code implements them from day one, not as polish later.

---

## 7. Map system — extensible by design

**Maps are data, not code.** Each map is a single definition file. Adding map #2 = writing a new file, zero engine changes.

### 7.1 — The MapDefinition shape

```
MapDefinition {
  id: string                    // "forest-valley"
  name: string                  // "Forest Valley"
  description: string           // shown on map-select screen
  size: { width, height }       // world units (meters)
  terrain: {
    type: "grass" | "desert" | "snow" | "jungle"
    heightmap?: string          // optional PNG for hills
    groundTexture: string
    ambientColor: number        // hex
    fogColor?: number
    fogNear?: number
    fogFar?: number
  }
  spawns: SpawnRule[]           // forest clusters, bases, decorations
  ambience: {
    music: string
    skyTint: number
    lightDirection: [x, y, z]
  }
  objectives: {
    basesToDestroy?: number
    timeLimit?: number
    scoreTarget?: number
  }
}
```

### 7.2 — SpawnRule types

Spawn rules are declarative: "forest cluster here," "base here."

- **forest-cluster** — center, radius, density, allowed tree variants
- **base** — center, turret count, launcher count, building count, difficulty level
- **lone-turret** — position, orientation
- **hill** — center, radius, height
- **pickup-cache** — position, contents
- **decoration** — position, type (crashed plane, rusted tank, etc.)

The `MapLoader` reads these rules on game start and spawns the actual entities.

### 7.3 — File layout

```
src/content/maps/
├── forest-valley.ts         (v1.0 ships with this)
├── desert-outpost.ts        (post-launch)
├── mountain-pass.ts         (post-launch)
└── index.ts                 (registers all maps, feeds the menu)
```

A map-select screen in the menu (Phase 4) reads from `index.ts` and displays all registered maps with thumbnails + descriptions.

### 7.4 — What this means for you

Post-launch, adding a new map is a conversation: *"Add a desert map, 600×600, scattered oil pumps instead of trees, three heavily-defended bases, sandy ground."* Claude writes one data file. Done. Zero risk of breaking gameplay.

---

## 8. Controls (finalized)

| Action | Key |
|---|---|
| Move forward (facing-relative) | `W` |
| Move backward | `S` |
| Strafe right | `D` |
| Strafe left | `A` |
| Rotate clockwise | `E` |
| Rotate counter-clockwise | `Q` |
| Primary fire (machine gun) | `SPACE` |
| Secondary fire (rocket) | `F` |
| Pause / menu | `ESC` |
| Shop (after run ends) | `TAB` |

Movement is **facing-relative** (tank-style). Rotation **unbounded 360°**. Mobile: two virtual joysticks + fire/rocket buttons (Phase 4).

---

## 9. Phased roadmap

Each phase is a commit milestone. Don't skip.

### Phase 0 — Scaffolding (~1 hour)
- Vite + TypeScript project created
- Three.js + deps installed
- `CLAUDE.md` + `PLAN.md` in repo root
- `npm run dev` shows a rendered empty scene
- First commit pushed to `New-Game-1`

### Phase 1 — Playable core (~1 week of sessions)
- Three.js scene, orthographic top-down camera follows player
- Textured ground plane
- Placeholder helicopter (primitives) with **all 6 feel techniques (§6) working**
- WASD movement + QE rotation, facing-relative
- Main rotor spinning
- SPACE fires bullets (lifetime + velocity)
- One stationary destroyable test enemy
- HUD: HP, ammo, score
- **MapLoader skeleton in place** — loads a minimal hardcoded map

### Phase 2 — Combat depth
- Real helicopter GLB (Poly Pizza) swapped in
- **Turret enemy** — 3D base + rotating top, tracks player, fires bullets
- **Rocket launcher enemy** — fires homing rockets (limited turn-rate)
- **Building enemy** — static, high HP, big points
- Player rocket (F) — higher damage, small AoE, limited ammo
- Damage system, death state, game-over screen
- Particles: muzzle flash, explosions, smoke trails
- Screen shake on impacts

### Phase 3 — World & progression
- Full `forest-valley.ts` populated (large, varied, ~10 bases)
- Varied tree types (3–4 Kenney variants), hill displacement, instanced rendering
- Minimap in HUD corner
- Points accumulation
- **Shop overlay (HTML)** — rapid fire, bullet spread, rocket capacity, armor, speed. Each item: icon, name, description, cost, level 1/5.
- Upgrade effects wired through `PlayerStats`

### Phase 4 — Menu, leaderboard, polish
- Interactive main menu: rotating helicopter background, animated buttons, ambient audio, AI-generated hero art
- **Map-select screen** (even with one map)
- Settings: volume, quality toggle, controls help
- Parallax cloud + distant-terrain layers
- Supabase leaderboard (top 100, personal best, **per-map**)
- Audio pass: BGM, SFX, rotor ambience
- Mobile touch controls

### Phase 5 — Arcade-readiness
- Bundle analysis, tree-shake
- Texture (KTX2) + model (Draco) compression
- Initial load **< 5 MB**
- Loading screen with progress
- Pause on tab-blur
- Platform adapter stubs
- Responsive canvas + letterbox
- Iframe test locally

### Phase 6 — Ship
- itch.io private test first
- Then CrazyGames, Poki, GameDistribution

---

## 10. Architecture — high level

```
src/
├── main.ts                    Entry point
├── engine/
│   ├── renderer.ts            Three.js scene, camera, lights, shadows
│   ├── input.ts               Keyboard + touch → InputState
│   ├── loop.ts                Fixed-timestep logic + variable render
│   ├── assets.ts              GLB / texture / audio loader with progress
│   └── audio.ts               Howler wrapper
├── ecs/
│   ├── world.ts               Entity registry + system runner
│   ├── components.ts          Transform, Velocity, Health, Weapon, AI, Collider, ...
│   └── systems/               One per file: movement, collision, combat, ai-*, projectile, ...
├── game/
│   ├── player.ts              Helicopter controller (§6 specs)
│   ├── stats.ts               PlayerStats + upgrade effects
│   ├── spawner.ts             Reads SpawnRules → entities
│   ├── map-loader.ts          Loads MapDefinition → builds world
│   └── state.ts               menu / map-select / play / shop / dead
├── content/
│   ├── maps/                  MapDefinitions (forest-valley.ts, ...)
│   ├── upgrades.ts            Shop catalog
│   └── enemies.ts             Enemy stat presets
├── ui/
│   ├── hud.ts                 HP, ammo, score, minimap
│   ├── menu.ts
│   ├── map-select.ts
│   ├── shop.ts
│   ├── leaderboard.ts
│   └── styles.css
├── platform/
│   ├── supabase.ts
│   ├── crazygames.ts
│   ├── poki.ts
│   └── platform.ts
└── assets/
    ├── models/
    ├── textures/
    ├── audio/
    └── icons/
```

---

## 11. Assets — sourcing strategy

**Decided:** Kenney + CC0 3D models for gameplay, AI for hero/menu art only.

### 11.1 — 3D models (gameplay)

- **Helicopter:** [Poly Pizza](https://poly.pizza) or [Quaternius](https://quaternius.com). Filter CC0, search "helicopter", download `.glb`.
- **Buildings / military:** Quaternius "Ultimate Modular Military Pack" or Kenney [Military Kit](https://kenney.nl/assets/military-kit).
- **Trees / nature:** Kenney [Nature Kit](https://kenney.nl/assets/nature-kit) or Quaternius nature packs.
- **Turrets / launchers:** Kenney's military kit or compose from primitives.

### 11.2 — 2D icons & UI

- **Shop icons:** [game-icons.net](https://game-icons.net) — thousands, CC BY 3.0. Credit in `CREDITS.md`.
- **HUD:** Kenney UI packs (CC0).

### 11.3 — Audio

- **SFX:** Kenney audio packs (CC0), [Freesound](https://freesound.org) (check per-file).
- **Music:** [Pixabay Music](https://pixabay.com/music) or [Incompetech](https://incompetech.com) (CC BY).

### 11.4 — AI art (hero/menu only)

Use DALL-E 3, Midjourney, or similar for:
- Main menu hero illustration (~1920×1080 landscape)
- Game-over backdrop
- Loading screen
- Arcade platform key art / thumbnails

**Style-consistency trick:** establish one strong prompt and reuse its phrasing across all AI art.
Example template: *"Top-down aerial view of a stylized low-poly [SCENE], dramatic cinematic lighting, muted saturated palette, 16:9, no text, game concept art."*

Save every prompt in `assets/ai-prompts.md` so you can regenerate in-style later.

**Do not AI-generate in-game sprites** (trees, buildings, shop icons). Style drift across generations will make the game look inconsistent, and some arcade reviewers flag it.

### 11.5 — Credits

Every CC-BY asset → `CREDITS.md`. Required by most arcade platforms.

---

## 12. Leaderboard design (Supabase, per-map)

**Table `scores`:**
```sql
create table scores (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 16),
  score int not null check (score >= 0),
  run_seconds int not null,
  bases_destroyed int not null,
  map_id text not null,
  created_at timestamptz default now(),
  client_hash text not null
);
create index on scores (map_id, score desc);
```

Leaderboard is **per-map**. Each new map you add gets its own board automatically.

**Anti-cheat (casual game):**
- Edge function validates `score <= (bases_destroyed × MAX_PER_BASE) + (run_seconds × MAX_PER_SEC)`
- Rate limit: one submission per IP per 10s
- `client_hash` = SHA-256 of signed payload, secret rotates per deploy

Read public (RLS select); insert only via edge function.

---

## 13. Arcade-platform checklist

| Requirement | Plan |
|---|---|
| HTML5, no Flash | ✅ Vite static build |
| Iframe-embeddable | ✅ No top-level nav |
| < 5 MB initial load (Poki) | Aim for it; lazy-load music |
| 60 fps on mid-tier mobile | Shadow toggle; pixel-ratio cap 2 |
| Desktop + mobile | Touch controls Phase 4 |
| Pause on blur | `visibilitychange` listener |
| No external links mid-play | All nav internal |
| No audio autoplay before interaction | Gated behind first click |
| Responsive canvas | Aspect-lock + letterbox |
| Platform SDK | Adapter pattern |
| Clean licensing | Kenney/Quaternius/game-icons + `CREDITS.md` |

---

## 14. Claude Code workflow notes

Covered in §3. Additional:

- **VS Code extension is your primary mode.** Terminal-mode Claude Code is for bulk autonomous work; you don't need it.
- **Planning mode toggle** is in the Claude Code panel. Always on.
- **`/clear`** between major topics.
- **Model selector** at top of the Claude Code panel — keep on Opus 4.7.

---

## 15. Model selection

| Model | Use for |
|---|---|
| **Claude Opus 4.7** (primary) | All planning, all feature work, all debugging. For someone who can't read code, Opus's higher code quality is your biggest safety net — fewer bugs, fewer moments of being stuck. |
| Claude Sonnet 4.6 (backup) | Only if Opus is rate-limited. Mechanical tasks: UI polish, CSS tweaks, wiring existing assets. |
| Claude Haiku 4.5 | Tiny tasks: rename a file, update copy. Rare. |

**Default: stay on Opus 4.7.**

---

## 16. Launching — first steps (non-coder walkthrough)

You do this once. After, daily work is just "open VS Code → Claude Code → describe task."

### Step 1 — Open the terminal
VS Code top menu: **Terminal → New Terminal**.

### Step 2 — Scaffold the project
Paste these one at a time (Enter after each, wait for each to finish):

```
npm create vite@latest . -- --template vanilla-ts
npm install
npm install three howler @supabase/supabase-js
npm install -D @types/three @types/howler
```

If `npm create` asks questions, press Enter to accept defaults.

### Step 3 — Drop in the plan files
Copy `PLAN.md` and `CLAUDE.md` into the root of `New Game` folder (same level as `package.json`).

### Step 4 — Sanity check
Terminal: `npm run dev`

A URL prints (`http://localhost:5173`). Ctrl+click it. Default Vite welcome page = working. Ctrl+C to stop.

### Step 5 — First commit
Source Control panel → message *"chore: scaffold + planning docs"* → Commit → Sync Changes.

### Step 6 — First Claude Code session
- Open Claude Code panel
- Confirm model: **Claude Opus 4.7**
- Confirm **planning mode: ON**
- Paste this as your first message:

> Read PLAN.md and CLAUDE.md completely. Then produce a detailed execution plan for Phase 1 — Playable Core. List every file you will create, in what order, and what each will contain in plain English. Do not write any code yet. I will review the plan and approve before you start.

- Claude produces a plan. Read it. If anything sounds wrong: *"Break step 3 into smaller pieces"* or *"Skip the minimap for now."*
- When happy: *"Approved. Execute step 1."* — go one step at a time.

### Step 7 — The loop begins
After each step: run the game → test → commit if good → next step.

---

## 17. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Mobile performance | Shadow toggle, pixel-ratio cap, instanced trees, LOD |
| Bundle > 5 MB | Draco + KTX2 compression, lazy-load music |
| Leaderboard abuse | Edge validation, rate limit, score bounds |
| Helicopter feels stiff | §6 enforced from Phase 1, not polished later |
| Forest tanks FPS | InstancedMesh — 1000+ trees, 1 draw call |
| Mobile audio blocked | Init after first tap |
| You get stuck | Revert → `/clear` → re-describe smaller |

---

## 18. Definition of done (v1.0)

- [ ] Main menu → map-select → run → death → leaderboard → back to menu
- [ ] At least 3 enemy types (turret, rocket launcher, building)
- [ ] At least 5 shop upgrades with icons
- [ ] One fully populated map (`forest-valley`)
- [ ] Map system ready to accept map #2 as a data file
- [ ] Parallax cloud + distant-terrain layers
- [ ] Global leaderboard (per-map)
- [ ] Desktop keyboard + mobile touch
- [ ] 60 fps on mid-tier laptop
- [ ] Load < 5 MB
- [ ] Pauses on tab blur
- [ ] Iframe-embeddable, clean
- [ ] `CREDITS.md` complete
- [ ] Uploaded to itch.io as private test

All boxes → submit to CrazyGames and Poki.

---

## 19. Out of scope for v1.0

- Multiplayer
- Procedural maps
- Story / cutscenes
- In-app purchases
- User-generated content
- Full gamepad support

Ship v1.0. Then iterate.
