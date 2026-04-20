# CLAUDE.md — project context for Claude Code

> Auto-loaded every session. Keep short, factual, current.
> Full roadmap: `PLAN.md`. Read that first on any new task.

## ⚠️ User profile — READ FIRST

**The user has zero coding experience.** This changes how you must operate:

- **Never assume the user can read code.** Explain changes in plain English.
- **Never ask the user to debug.** If you hit an error, diagnose it yourself from the error message.
- **Never ship without planning mode.** Every multi-file change starts with a plain-English plan for the user to approve.
- **Never push back with jargon.** If pushing back on a request, translate to concrete trade-offs ("this would take 3× longer" not "this violates SRP").
- **Bias toward small, tested steps.** The user commits after each working step as a safety net. Don't bundle 5 features into one execution.
- **When the user reports a bug with a screenshot,** treat the screenshot as the source of truth. Ask for additional screenshots if needed, not code questions.
- **If a task fails twice, stop and propose splitting it smaller.** Don't accumulate partial fixes.

## What this project is

Top-down 3D helicopter combat, HTML5, iframe-embeddable, targeting arcade platforms (CrazyGames, Poki, GameDistribution, itch.io).

- Real 3D helicopter (full 360° rotation, all sides visible)
- 2.5D world: low-poly 3D + sprites inside a Three.js scene
- **Extensible map system** — maps are data files (`src/content/maps/*.ts`), never hardcoded
- Large scoutable maps, forest + hills + enemy bases
- Shop-driven upgrades, points from destruction
- Global leaderboard, per-map
- 3–10 minute runs

## Tech stack

- **Three.js** (r160+) — rendering
- **TypeScript** — strict mode on
- **Vite** — bundler, static single-bundle output
- **Howler.js** — audio
- **Supabase** — leaderboard backend
- Custom **planar physics** (circle-circle, circle-AABB). No rigid-body library.
- Lightweight **ECS** — see `src/ecs/`

## Controls (canonical)

| Action | Key |
|---|---|
| Move forward (facing-relative) | `W` |
| Move backward | `S` |
| Strafe right | `D` |
| Strafe left | `A` |
| Rotate CW | `E` |
| Rotate CCW | `Q` |
| Primary fire (machine gun) | `SPACE` |
| Secondary fire (rocket) | `F` |
| Pause | `ESC` |
| Shop | `TAB` |

Movement **facing-relative** (tank-style). Rotation **unbounded 360°**.

## Helicopter feel — MANDATORY from Phase 1

All six techniques must be in place before the helicopter is considered "done" at any phase. Do not defer these to polish.

1. **Real 3D GLB model** with separable main rotor + tail rotor meshes.
2. **Angular velocity rotation**, max ~2.0 rad/s, ease-in 0.15s / ease-out 0.25s. Never snap.
3. **Tilt-into-turn** — `mesh.rotation.z` lerps toward `-angularVelocity * 0.3`, smoothing ~0.15.
4. **Nose pitch on move** — `mesh.rotation.x` lerps toward `forwardSpeed * 0.2`, smoothing ~0.1.
5. **Idle hover bob** — `mesh.position.y = baseY + sin(t * 2.0) * 0.1`.
6. **Dynamic shadow** — `DirectionalLight` with `castShadow`, 2048² shadow map.

Plus: main rotor ~40 rad/s, tail rotor ~50 rad/s, camera follows with lerp smoothing ~0.1, camera stays world-aligned (does NOT rotate with helicopter).

## Map system — architecture rules

- Maps live in `src/content/maps/<id>.ts`, exported as `MapDefinition` objects
- Registry: `src/content/maps/index.ts`
- `MapLoader` reads a `MapDefinition` and builds the world via `Spawner`
- **No hardcoded entities in engine code.** All spawns come from MapDefinition.spawns.
- Adding a new map must require **zero changes** to engine, ECS, or gameplay code — only a new data file and a one-line registry addition.

## Conventions

- **TS strict.** No `any` without a `// TODO:` with a reason.
- **ECS discipline.** Logic in `src/ecs/systems/`. Three.js objects created by `render-sync.ts` — never touched by gameplay systems directly.
- **No global state.** Pass `World` and `PlayerStats` explicitly.
- **One system per file.** Systems under ~150 lines.
- **Fixed timestep (60 Hz) for logic**, variable render. See `engine/loop.ts`.
- **Units:** world-space meters. 1 unit = 1 meter. Helicopter ~8m long.
- **Licensing:** CC0 / CC-BY / custom only. Every CC-BY asset tracked in `CREDITS.md`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `perf:`).

## Asset strategy

- **Helicopter 3D model:** Poly Pizza or Quaternius, CC0, `.glb` format
- **Gameplay assets (trees, buildings, turrets):** Kenney.nl + Quaternius, CC0
- **Shop icons:** game-icons.net, CC BY 3.0 — credit in `CREDITS.md`
- **Audio:** Kenney, Freesound (per-file check), Pixabay Music, Incompetech
- **Hero/menu art ONLY:** AI-generated (DALL-E 3 / Midjourney) — one consistent prompt style saved in `assets/ai-prompts.md`
- **Never AI-generate** in-game sprites (trees, buildings, icons). Style drift + arcade platform scrutiny.

## Rules for Claude Code

1. Read `PLAN.md` before starting any phase.
2. Use planning mode for every multi-file change. Show the plan, wait for approval.
3. Don't add dependencies without asking. Locked: `three`, `howler`, `@supabase/supabase-js`.
4. Don't bypass the ECS. New features = new components/systems, not hacks.
5. Don't hardcode entities outside MapDefinitions.
6. Performance: 60 fps on a 2021 mid-range laptop. Profile before adding shadow casters, post-processing, or particle counts > 200.
7. Bundle: initial load < 5 MB. Music + secondary assets lazy-load.
8. Accessibility: keyboard-only playable, colorblind-safe UI (not relying on red/green alone).
9. Mobile: every feature needs a touch-control equivalent to be "done."
10. Tests: unit tests for pure logic (combat math, AI transitions, stats). Skip tests for rendering.
11. Ask before refactoring files you didn't write in this session.

## Current phase

<!-- Update as you progress -->
**Phase 0 — Scaffolding.** Goal: Vite + TS + Three.js booting, empty scene renders, `CLAUDE.md` + `PLAN.md` committed.

## Key files (once scaffolded)

- `src/main.ts` — entry
- `src/engine/renderer.ts` — Three.js scene, camera, lights
- `src/engine/loop.ts` — fixed-timestep update loop
- `src/ecs/world.ts` — entity registry + system runner
- `src/game/player.ts` — helicopter controller (implements §6 feel specs)
- `src/game/map-loader.ts` — loads MapDefinition → builds world
- `src/game/spawner.ts` — reads SpawnRules → entities
- `src/content/maps/` — map data files
- `src/content/upgrades.ts` — shop catalog
- `src/ui/hud.ts`, `menu.ts`, `map-select.ts`, `shop.ts` — HTML UI layers
- `src/platform/platform.ts` — unified arcade-platform adapter

## Commands

```
npm run dev        # dev server :5173
npm run build      # production → dist/
npm run preview    # preview production build
npm run typecheck  # tsc --noEmit
npm run test       # vitest (once set up)
```

## Out-of-scope for v1.0

Multiplayer · procedural maps · story · IAP · UGC · gamepad

Ship v1.0. Iterate.
