// https://go.mparticle.com/work/SQDSDKS-6875
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        input: 'test/tests.js',
        output: {
            file: 'test/test-bundle.js',
            format: 'iife',
            exports: 'named',
            name: 'mpBrazeKit',
            strict: false,
        },
        plugins: [
            resolve({
                browser: true,
            }),
            commonjs(),
        ],
    },
];
