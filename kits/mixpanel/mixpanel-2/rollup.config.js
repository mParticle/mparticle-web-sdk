import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/MixpanelEventForwarder.js',
        output: {
            file: 'dist/MixpanelEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpMixpanelKit',
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
        input: 'src/MixpanelEventForwarder.js',
        output: {
            file: 'dist/MixpanelEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpMixpanelKit',
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
        input: 'src/MixpanelEventForwarder.js',
        output: {
            file: 'dist/MixpanelEventForwarder.esm.js',
            format: 'esm',
            exports: 'named',
            name: 'mpMixpanelKit',
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
