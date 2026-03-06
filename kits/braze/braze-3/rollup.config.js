import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/BrazeKit-dev.js',
        output: {
            file: 'dist/BrazeKit.iife.js',
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
    {
        input: 'src/BrazeKit-dev.js',
        output: {
            file: 'dist/BrazeKit.common.js',
            format: 'cjs',
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
