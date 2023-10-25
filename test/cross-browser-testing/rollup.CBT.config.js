import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import babelSettings from './babel.config.js'
const extensions = ['.js', '.ts'];
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default [
    {
        input: 'test/src/tests-main.js',
        output: {
            file: 'test/cross-browser-testing/CBT-tests.js',
            format: 'umd',
            name: 'mParticleTests',
        },
        plugins: [
            resolve({
                preferBuiltins: true,
            }),
            commonjs({
                include: 'node_modules/**',
            }),
            typescript({
                tsconfig: './tsconfig.json',
                sourceMap: false,
            }),
            babel({
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-transform-runtime'],
                extensions,
                // ...babelSettings,
                // exclude: ['node_modules/**/*'],
                babelHelpers: 'runtime',
            }),
            json()
        ],
    },
    {
        input: 'test/cross-browser-testing/CBT-tests.js',
        output: {
            file: 'test/cross-browser-testing/CBT-tests-es5.js',
            format: 'umd',
            name: 'mParticleTests',
        },
        plugins: [
            resolve({
                preferBuiltins: true
            }),
            commonjs({
                include: 'node_modules/**',
            }),
            babel({
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-transform-runtime'],
                ...babelSettings,
                exclude: ['node_modules/**/*'],
                babelHelpers: 'runtime',
            }),
            json()
        ],
    },
]