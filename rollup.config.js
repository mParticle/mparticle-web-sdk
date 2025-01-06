const { BUILD, ENVIRONMENT, BUILDALL } = process.env;

import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const extensions = ['.js', '.ts'];

const defaultOutputOptions = {
    name: 'mParticle',
    strict: false,
    // sourcemap: ENVIRONMENT !== 'prod' ? 'inline' : false, // Enable source maps for non-prod environments
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
    presets: ['@babel/preset-typescript', ['@babel/env', { modules: false }]],
    plugins: [
        '@babel/proposal-class-properties',
        '@babel/proposal-object-rest-spread',
        '@babel/plugin-transform-runtime',
    ],
    // sourceMaps: true, // Ensure Babel outputs source maps
});

const builds = {
    iife: {
        input: 'src/mparticle-instance-manager.js',
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
            typescript({ tsconfig: './tsconfig.json' }), // Enable source maps for TypeScript
            json(),
        ],
    },
    cjs: {
        input: 'src/mparticle-instance-manager.js',
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
            typescript({ tsconfig: './tsconfig.json', sourceMap: true }), // Enable source maps for TypeScript
            json(),
        ],
    },
    esm: {
        input: 'src/mparticle-instance-manager.js',
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
            typescript({ tsconfig: './tsconfig.json', sourceMap: true }), // Enable source maps for TypeScript
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
