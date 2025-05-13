import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'Safepay',
    outDir: 'dist/components',
    dts: {
        entry: 'src/index.ts',
    },
    tsconfig: 'tsconfig.components.json',
    splitting: false,
    minify: true,
    clean: true,
    loader: {
        '.css': 'text',
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': '{}',
        'process': '{}',
    }
});
