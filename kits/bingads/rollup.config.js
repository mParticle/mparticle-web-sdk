import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const plugins = [resolve({ browser: true }), commonjs()];

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
