# Driftwood Isles in Godot

This folder is a Godot 4 project containing the Driftwood Isles world and the player angler,
exported from the web game (version 6.0).

## Open it

1. Install **Godot 4.4 or newer** (the standard build, not .NET).
2. In the Godot Project Manager click **Import**, choose this folder's `project.godot`, then **Import & Edit**.
3. The first import takes a minute or two (about 90 MB of island models).
4. Press **F5** (or the Play button) to play.

## Controls

| Action | Keys |
| --- | --- |
| Move | W A S D or arrow keys |
| Run | Shift |
| Jump / swim up | Space |
| Orbit camera | drag with the mouse, or two-finger swipe on a trackpad |
| Zoom | scroll wheel or pinch |
| Change time of day | `[` and `]` |

## What's here

- `assets/islands/*.glb` – all 13 islands and caves (terrain, houses, docks, trees, rocks, props, NPCs), split into 80 m tiles.
- `assets/angler.glb` – the low-poly player angler with named joints (hips, spine, neck, head, armL/R, elbowL/R, legL/R, kneeL/R).
- `assets/world.json` – island names, positions, radius and spawn points.
- `scripts/main.gd` – loads the islands, adds collision, sky, sun, day/night cycle and the ocean.
- `scripts/player.gd` – third-person movement, swimming, camera and procedural walk/run/idle/jump/swim animation.
- `shaders/lowpoly.gdshader` – the faceted look (vertex colours, flat normals).
- `shaders/water.gdshader` – waves, refraction, depth colour and shore foam (needs the Forward+ renderer).

## Not ported yet

Fishing, boats, shops, quests, inventory, saving and multiplayer still live in the web game
(`src/game`). They can be rebuilt here system by system.
