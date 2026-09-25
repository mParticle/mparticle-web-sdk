import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

// Shared on purpose: rollup-plugin-commonjs <19 keeps CJS detection in a
// process-global map, so per-config instances race on the second build.
const plugins = [
    resolve({
        browser: true,
    }),
    commonjs(),
];

export default [
    {
        input: 'src/BingAdsEventForwarder',
        output: {
            file: 'dist/BingAdsEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpBingAdsKit',
            strict: false,
        },
        plugins,
    },
    {
        input: 'src/BingAdsEventForwarder',
        output: {
            file: 'dist/BingAdsEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpBingAdsKit',
            strict: false,
        },
        plugins,
    },
];
