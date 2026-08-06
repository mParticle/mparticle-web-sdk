/// <reference types="vitest" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    build: {
        target: 'es2020',
        lib: {
            entry: resolve(__dirname, 'src/Rokt-Kit.ts'),
            name: 'RoktKit',
            formats: ['iife', 'cjs', 'es'],
            fileName: (format) => {
                if (format === 'iife') return 'Rokt-Kit.iife.js';
                if (format === 'es') return 'Rokt-Kit.esm.js';
                return 'Rokt-Kit.common.js';
            },
        },
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            // @mparticle/web-sdk is a peer dependency — keep it external in all builds
            external: (id) => id.startsWith('@mparticle/web-sdk'),
            output: {
                exports: 'named',
            },
        },
    },
    define: {
        'process.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
    },
    plugins: [dts({ rollupTypes: true })],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/vitest.setup.ts'],
        include: ['test/src/**/*.spec.ts', 'src/**/*.spec.ts'],
        execArgv: ['--no-experimental-webstorage'],
        // More-specific alias must come first so @mparticle/web-sdk/internal
        // resolves to the monorepo source types rather than falling through to
        // the main bundle alias.
        alias: {
            '@mparticle/web-sdk/internal': resolve(
                __dirname,
                '../../src/internal-types.ts'
            ),
            '@mparticle/web-sdk': resolve(
                __dirname,
                '../../dist/mparticle.common.js'
            ),
        },
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
        },
    },
});
