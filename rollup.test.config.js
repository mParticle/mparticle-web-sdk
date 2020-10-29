const { ENVIRONMENT, TESTTYPE } = process.env;
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';

const extensions = ['.js', '.ts'];

const builds = {
    main: {
        input: 'test/src/tests-main.js',
        output: {
            file: 'test/test-bundle.js',
            format: 'iife',
            name: 'mParticleTests',
            sourcemap: ENVIRONMENT !== 'prod',
        },
        plugins: [
            resolve(),
            commonjs({
                include: 'node_modules/**',
                namedExports: { chai: ['expect'] },
            }),
            babel({
                extensions,
                include: ['src/**/*'],
                runtimeHelpers: true,
            }),
            typescript(),
            json(),
        ],
    },
    stub: {
        input: 'test/stub/tests-mParticle-stub.js',
        output: {
            file: 'test/stub/test-stub-bundle.js',
            format: 'iife',
            name: 'mParticleStubTests',
        },
        plugins: [resolve(), json()],
    },
};

export default builds[TESTTYPE];
