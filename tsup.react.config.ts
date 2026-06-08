// tsup.react.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/atoms/index.ts'],
    format: ['esm'],
    outDir: 'dist/react',
    dts: {
        entry: 'src/atoms/index.ts',
        compilerOptions: {
            // tsup injects baseUrl into its DTS compilation context, which
            // TypeScript 6.0 flags as deprecated (TS5101). This suppresses
            // it only for the DTS build — the tsconfigs themselves stay clean.
            ignoreDeprecations: '6.0',
        },
    },
    clean: true,
    sourcemap: false,
    tsconfig: 'tsconfig.react.json',
    define: {
        'document': 'undefined'
    }
});
