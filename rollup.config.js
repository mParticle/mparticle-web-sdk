const { BUILD, ENVIRONMENT, BUILDALL } = process.env;

import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import MagicString from 'magic-string';
const extensions = ['.js', '.ts'];

// A script served without a charset is decoded in the host page's encoding. Escaping every
// non-ASCII code unit as \uXXXX keeps the bundle parseable on Shift_JIS, GBK and similar pages.
const asciiOnly = () => ({
    name: 'ascii-only',
    renderChunk(code) {
        const s = new MagicString(code);
        const nonAscii = /[\u0080-￿]/g;
        let match;
        while ((match = nonAscii.exec(code))) {
            // `\é` would become `\\u00e9`, a literal backslash, so refuse rather than change meaning
            if (code[match.index - 1] === '\\') {
                throw new Error(
                    `ascii-only: escaped non-ASCII character at offset ${match.index}`
                );
            }
            const hex = match[0]
                .charCodeAt(0)
                .toString(16)
                .padStart(4, '0');
            s.overwrite(match.index, match.index + 1, `\\u${hex}`);
        }
        return { code: s.toString(), map: s.generateMap({ hires: true }) };
    },
});

const defaultOutputOptions = {
    name: 'mParticle',
    strict: false,
    sourcemap: ENVIRONMENT !== 'prod' ? 'inline' : false,
    plugins: [asciiOnly()],
};

const defaultBabel = babel({
    extensions,
    include: ['src/**/*'],
    babelHelpers: 'runtime',
});

const babelMinify = babel({
    extensions,
    include: ['src/**/*'],
    babelHelpers: 'runtime',
    babelrc: false,
    presets: [
        '@babel/preset-typescript',
        ['minify', { builtIns: false }],
        ['@babel/env', { modules: false }],
    ],
    plugins: [
        '@babel/proposal-class-properties',
        '@babel/proposal-object-rest-spread',
        '@babel/plugin-transform-runtime',
    ],
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
        },
        plugins: [
            babelMinify,
            resolve(),
            commonjs({
                include: 'node_modules/**',
            }),
            typescript({ tsconfig: './tsconfig.json' }),
            json(),
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
        },
        plugins: [
            babelMinify,
            resolve(),
            commonjs({
                include: 'node_modules/**',
            }),
            typescript({ tsconfig: './tsconfig.json' }),
            json(),
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
