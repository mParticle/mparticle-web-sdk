const { BUILD, ENVIRONMENT, BUILDALL } = process.env;

import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { escapeNonAsciiPlugin } from './scripts/rollup/escapeNonAsciiPlugin';
const extensions = ['.js', '.ts'];

const defaultOutputOptions = {
    name: 'mParticle',
    strict: false,
    sourcemap: ENVIRONMENT !== 'prod' ? 'inline' : false,
};

const defaultBabel = babel({
    extensions,
    include: ['src/**/*'],
    babelHelpers: 'runtime',
    // tsconfig's sourceMap comments point at .js.map files that never exist on disk
    inputSourceMap: false,
});

const builds = {
    iife: {
        input: 'src/mparticle-instance-manager.ts',
        output: {
            ...defaultOutputOptions,
            file: 'dist/mparticle.js',
            format: 'iife',
            name: 'mParticle',
        },
        plugins: [
            defaultBabel,
            resolve(),
            commonjs({
                include: 'node_modules/**',
            }),
            typescript({ tsconfig: './tsconfig.json' }),
            json(),
            escapeNonAsciiPlugin(),
        ],
    },
    cjs: {
        input: 'src/mparticle-instance-manager.ts',
        output: {
            ...defaultOutputOptions,
            file: 'dist/mparticle.common.js',
            format: 'cjs',
            name: 'mParticle',
            intro:
                "if (typeof globalThis !== 'undefined') {globalThis.regeneratorRuntime = undefined}",
            plugins: [terser()],
        },
        plugins: [
            defaultBabel,
            resolve(),
            commonjs({
                include: 'node_modules/**',
            }),
            typescript({ tsconfig: './tsconfig.json' }),
            json(),
            escapeNonAsciiPlugin(),
        ],
    },
    esm: {
        input: 'src/mparticle-instance-manager.ts',
        output: {
            ...defaultOutputOptions,
            file: 'dist/mparticle.esm.js',
            format: 'esm',
            name: 'mParticle',
            intro:
                "if (typeof globalThis !== 'undefined') {globalThis.regeneratorRuntime = undefined}",
            plugins: [terser()],
        },
        plugins: [
            defaultBabel,
            resolve(),
            commonjs({
                include: 'node_modules/**',
            }),
            typescript({ tsconfig: './tsconfig.json' }),
            json(),
            escapeNonAsciiPlugin(),
        ],
    },
    stub: {
        input: 'src/stub/mparticle.stub.js',
        output: {
            file: 'dist/mparticle.stub.js',
            ...defaultOutputOptions,
            format: 'iife',
            name: 'mParticle',
        },
    },
};

let selectedBuilds = [];
if (BUILDALL) {
    for (let build of Object.keys(builds)) {
        selectedBuilds.push(builds[build]);
    }
} else {
    selectedBuilds.push(builds[BUILD]);
}

export default selectedBuilds;
