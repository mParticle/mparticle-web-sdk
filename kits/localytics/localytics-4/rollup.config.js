import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/LocalyticsEventForwarder.js',
        output: {
            file: 'dist/LocalyticsEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpLocalyticsKit',
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
        input: 'src/LocalyticsEventForwarder.js',
        output: {
            file: 'dist/LocalyticsEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpLocalyticsKit',
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
        input: 'src/LocalyticsEventForwarder.js',
        output: {
            file: 'dist/LocalyticsEventForwarder.esm.js',
            format: 'esm',
            exports: 'named',
            name: 'mpLocalyticsKit',
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
