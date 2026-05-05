const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'node_modules/libsodium-sumo/dist/modules-sumo-esm/libsodium-sumo.mjs');
const destDir = path.join(root, 'node_modules/libsodium-wrappers-sumo/dist/modules-sumo-esm');
const dest = path.join(destDir, 'libsodium-sumo.mjs');

try {
  if (fs.existsSync(src) && fs.existsSync(destDir)) {
    fs.copyFileSync(src, dest);
  }
} catch (e) {
  console.warn('[patch-libsodium]', e && e.message ? e.message : e);
}
