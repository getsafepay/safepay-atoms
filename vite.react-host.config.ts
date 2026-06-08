import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// tsup compiles CSS files as text strings via `loader: { '.css': 'text' }`.
// Vite doesn't do that — it injects CSS into the DOM without a default export,
// and PostCSS then errors if it sees a JS string where CSS is expected.
// This plugin routes CSS imports from the atoms style loaders through a virtual
// module that returns the CSS content as a plain string export, bypassing PostCSS.
const cssAsText = (): Plugin => {
  const VIRTUAL = '\0css-text:';
  return {
    name: 'css-as-text',
    enforce: 'pre',
    resolveId(id, importer) {
      if (importer?.includes('/src/styles/') && id.endsWith('.css')) {
        // Strip .css from the virtual ID so PostCSS doesn't process it
        return VIRTUAL + path.resolve(path.dirname(importer), id).slice(0, -4);
      }
    },
    load(id) {
      if (id.startsWith(VIRTUAL)) {
        return `export default ${JSON.stringify(fs.readFileSync(id.slice(VIRTUAL.length) + '.css', 'utf-8'))}`;
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), cssAsText()],
  root: 'tests/host',
  server: { port: 4174 },
});
