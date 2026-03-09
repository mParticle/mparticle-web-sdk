const { ENVIRONMENT } = process.env;

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'test/src/tests.js',
    output: {
        file: 'test/test-bundle.js',
        format: 'iife',
        name: 'mParticleTests',
    },
    plugins: [resolve(), commonjs(), json()],
};
