# Driftwood Isles

A cozy multiplayer fishing game built with three.js and Vite.

## How fishing works

1. Hold **Cast** (F, a long click, or the Cast button) and release to throw your line.
2. While the float bobs, tap, click or press Space to twitch the lure. A nibble means a fish is close, so twitch right then.
3. When the float dives under, **strike** quickly (click, tap or Space). A fast strike is a Perfect strike, and the fish starts out tired.
4. **Hold to reel in.** Keep an eye on the tension needle: let go before it reaches red, or the line snaps.
   When the fish runs sideways, pull the other way (drag on touch screens, A / D on a keyboard) to tire it faster.

Your float or lure changes with the bait you have equipped. Better rods reel faster, have tougher lines and hold more tension.

## World

Nine islands (Pebble Cove, Mossreach, Frostmere, Emberkey, Sunken Atoll, Amberglen, Petalshore, Duneveil, Glimmerholt),
each with its own pond, shops and quests, plus open-sea fishing, weather, a day/night cycle and big shared world events.
Two story quest lines: *The Cartographer's Voyage* (Isolde, Pebble Cove) and *Spirit of the Tides* (Old Mirren, Petalshore).

## Run it locally

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build
```

The finished site is written to `dist/`. Any static host can serve it.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com choose **Add New → Project**, import the repository and keep the detected settings
   (framework Vite, build `npm run build`, output `dist`). `vercel.json` already sets these.
3. Every push to the main branch redeploys automatically.

Or from this folder with the Vercel CLI: `npx vercel --prod`.

## Project layout

- `index.html`: page shell, HUD markup and styles.
- `src/game/*.js`: game scripts, concatenated in order into one module by the plugin in `vite.config.js`:
  - `_header.js`: three.js imports.
  - `di-core.js`: data (islands, fish, rods, events) and save/load.
  - `di-gfx.js`: procedural textures, materials, sky and the shared ocean wave model.
  - `di-world.js`: renderer, post-processing, quality tiers, terrain, ocean, props and ambient life.
  - `di-actors.js`: characters, rods, fish, boats and remote players.
  - `di-game.js`: input, weather and day/night, fishing and the event clock.
  - `di-events.js`: big world events (Leviathan Passage, Starfall, Aurora Tide, The Great Swell).
  - `di-ui.js`: panels, chat, online play and the main loop.

## Testing helpers

- `?event=leviathan`, `?event=starfall`, `?event=aurora` or `?event=swell` starts that big event straight away.
- `?debug` exposes `window.__DI` for inspection.

## Credits

All art is procedural, generated in code. Sky model: Preetham et al. (via three.js).
