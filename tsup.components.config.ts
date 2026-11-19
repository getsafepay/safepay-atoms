import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'Safepay',
    outDir: 'dist/components',
    dts: false,
    tsconfig: 'tsconfig.components.json',
    splitting: false,
    minify: true,
    clean: true,
    loader: {
        '.css': 'text',
    },
    define: {
        '__SFPY_BETTER_STACK_RUM_TOKEN__': JSON.stringify(process.env.BETTER_STACK_CHECKOUT_RUM_TOKEN || ''),
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': '{}',
        'process': '{}',
    }
});
