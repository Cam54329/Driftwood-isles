# Driftwood Isles: project guide for Claude

Driftwood Isles is a 3D multiplayer fishing game by Cam (GitHub: Cam54329). It's grindy and everything in it is
original: never imitate another game's names, UI layout, art, terms or signature mechanics. Cam plays on a
**Mac in Google Chrome**, so optimise for that.

## Where it lives

- Repo: https://github.com/Cam54329/Driftwood-isles. Pushing to `main` auto-deploys to Vercel.
- Main site: **https://driftwood-isles-alpha.vercel.app**. Always give Cam this link, never a per-deployment link.
- Backup site: https://cam54329.github.io/Driftwood-isles/, built by `.github/workflows/backup-site.yml` into the `gh-pages` branch.
- Godot port: `godot/` is a Godot 4.4+ project with the world, the player angler, the water and the sky
  (see `godot/README.md`). Re-export the models with `tools/godot-export/export.js`.
  `.vercelignore` keeps `godot/` out of web deploys.

## How the web game is built

- Vite + three.js 0.186.1, Firebase RTDB for multiplayer. Commands: `npm run build`, `npx vite preview --port 4173`.
- The game scripts in `src/game/` are **concatenated into one scope** in this order:
  `_header, di-core, di-gfx, di-world, di-actors, di-game, di-events, di-extra, di-quests, di-menu, di-net, di-ui`.
  A name defined in an earlier file is visible in later ones; watch for name clashes.
- `index.html` holds all the CSS and HUD markup.
- What each file holds:
  - `di-core`: data (ZONES, SPECIES, RODS, BOATS, HATS, UPDATES, GAME_VER), save sanitising and the Music engine.
  - `di-gfx`: the world texture array (cached in IndexedDB), world and terrain materials, the sky shader.
  - `di-world`: graphics tiers (TIERS, GFX, applyTier), post-processing, water shader, islands, props, particles.
  - `di-actors`: characters. `makeAngler` is the low-poly player in the reference style. NPCs use `makeChar`.
    Animation is in `CharAnim`. Also rods, fish, boats and `RemotePlayer`.
  - `di-game`: input, camera, fishing, boats and flight, and `updateEnv` (day/night, weather, sky, lighting).
- Every graphics effect must respect the quality tiers (Auto / Ultra / High / Medium / Low).
  Auto picks a tier from the detected GPU.
- `?debug` in the URL exposes `window.__DI` for headless testing.
- Test with Playwright plus software WebGL (swiftshader), and take screenshots to check visuals.
  A save in localStorage needs `seenVer` equal to `GAME_VER`, or the "What's new" panel covers the screen.

## Rules

- Keep all gameplay, multiplayer and saved progress working. Old saves must still load (see `sanitize` in di-core).
- The repo is public. Never commit the dev key; only its SHA-256 (`DEV_HASH`) is in the code.
  Firebase config comes from `VITE_FIREBASE_*` environment variables.
- Every release: bump `GAME_VER`, add an entry to `UPDATES`, build, test, push to `main`, then give Cam the main link.
- Don't put model names or identifiers in commits.
- Cam's workflow: **do one phase, redeploy, give the main domain link, then stop so Cam can test.**

## Status and plan (last release: 8.0)

- Phase 1, performance (5.2): done.
- Phase 2, graphics (6.0): done.
  - Reference-style player anglers.
  - Sky: lit clouds and cloud shadows, Milky Way, shooting stars.
  - Ocean: clear shallows with caustics, shore foam and a boat wake.
  - Spray particles, and focus blur in photo mode.
- 7.0 Remaster: done.
  - Foliage rebuilt: `canopy` / `roundTree` / `palm` / `pine` / `bush` in di-world. Foliage uses the smooth,
    near-camera-fading world material `worldMatS`. `Builder.cn` gives soft canopy normals.
  - Rocks are plane-cut (`cutRockGeo`), and cacti are ribbed.
  - Contact shading is baked into terrain colours (`aoSpot` / `applyContactAO`).
  - Grass is one InstancedMesh per island, coloured from the ground and culled by distance (`GRASSU.uGF`, tier `gf`).
  - NPCs use `makeAngler(npcLook(n))`.
- 8.0 Launch Edition: done.
  - Original "Driftwood Ledger" UI: the map has a brass XP ring (`#xpRing`, `--xp`) beside a ledger card; rod and bait
    are brass medallions; the menus are logbook tabs in `#tabs` on the right edge. Theme tokens are in the last CSS block.
  - Storm fronts with twisters replace the old whirlpools (di-extra: `activeWells`, `updateWells`, `twisterLift`).
    Internal ids still say `well`.
  - Display-only renames (save keys unchanged):
    - Sea Glass (`state.relics`), Runes / Runestone (`ench`), Variants (`MUTS`).
    - Journal, Creel, Weighmaster (role `appraiser`).
    - Rarities Fabled / Starborn / Hidden.
  - `cleanText` masks bad words for every name and chat line.
- Phase 3, features: next.
  - Fishing quests and daily challenges.
  - Aquarium / trophy room.
  - Crab pots and traps (a basic version exists as `POTS`).
  - Weather events: storms with rare fish, fog, meteor showers (`MET` meteors exist; `env.meteorK` speeds them up).
  - Achievements and titles above player names.
  - Friends list, fish trading and tournaments.
  - Photo mode filters.
  - Mac keyboard and trackpad controls with rebindable keys.
- Phase 4, PWA: manifest, Dock icon, splash screen, standalone window, offline caching, and an "Install game" button.
- Possible later work:
  - Bring fishing, boats and shops into the Godot project.
  - Real CC0 assets (Poly Haven, ambientCG, Quaternius, Kenney). Those hosts were blocked from the old cloud
    environment, so the network settings may need to allow them.
