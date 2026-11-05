import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// The game is written as a set of plain scripts that share one scope (di-core → di-ui).
// This plugin concatenates them, in order, behind a header that imports three.js and
// exposes it as the `THREE` namespace the scripts expect. Vite then bundles and minifies it.
const ORDER = ['_header', 'di-core', 'di-gfx', 'di-world', 'di-actors', 'di-game', 'di-events', 'di-ui'];
const VID = 'virtual:driftwood-game';

function driftwoodGame() {
  return {
    name: 'driftwood-game',
    resolveId(id) { if (id === VID) return '\0' + VID; },
    load(id) {
      if (id !== '\0' + VID) return;
      const dir = path.resolve('src/game');
      return ORDER.map((n) => {
        const f = path.join(dir, n + '.js');
        this.addWatchFile(f);
        return `// ---- ${n}.js ----\n` + fs.readFileSync(f, 'utf8');
      }).join('\n');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [driftwoodGame()],
  build: { target: 'es2020', chunkSizeWarningLimit: 2000, assetsInlineLimit: 0 },
  server: { host: true },
});
