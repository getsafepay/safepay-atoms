// tsup.react.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/atoms/index.ts'],
    format: ['esm'],
    outDir: 'dist/react',
    dts: {
        entry: 'src/atoms/index.ts',
    },
    clean: true,
    sourcemap: false,
    tsconfig: 'tsconfig.react.json',
    define: {
        'document': 'undefined'
    }
});
