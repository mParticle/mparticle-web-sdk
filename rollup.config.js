const { BUILD, ENVIRONMENT, BUILDALL } = process.env;

import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
const extensions = ['.js', '.ts'];

const defaultOutputOptions = {
    name: 'mParticle',
    strict: false,
    sourceMap: ENVIRONMENT !== 'prod' ? 'inline' : false,
};

const defaultBabel = babel({
    extensions,
    include: ['src/**/*'],
    runtimeHelpers: true,
});

const babelMinify = babel({
    extensions,
    include: ['src/**/*'],
    runtimeHelpers: true,
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
            typescript(),
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
        },
        plugins: [
            babelMinify,
            resolve(),
            commonjs({
                include: 'node_modules/**',
            }),
            typescript(),
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
        },
        plugins: [
            babelMinify,
            resolve(),
            commonjs({
                include: 'node_modules/**',
            }),
            typescript(),
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
