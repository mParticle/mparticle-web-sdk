import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const plugins = [resolve({ browser: true }), commonjs()];

export default [
    {
        input: 'src/LeanplumAnalyticsEventForwarder.js',
        output: {
            file: 'dist/LeanplumAnalyticsEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpLeanplumKit',
            strict: false,
        },
        plugins,
    },
    {
        input: 'src/LeanplumAnalyticsEventForwarder.js',
        output: {
            file: 'dist/LeanplumAnalyticsEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpLeanplumKit',
            strict: false,
        },
        plugins,
    },
];
