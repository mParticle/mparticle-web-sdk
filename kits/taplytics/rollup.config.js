import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import terserPlugin from '../../scripts/rollup/terserPlugin';

const plugins = [resolve({ browser: true }), commonjs()];

export default [
    {
        input: 'src/TaplyticsKit.js',
        output: {
            file: 'dist/TaplyticsKit.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpTapylitcsKit',
            strict: false,
        },
        plugins: [...plugins, terserPlugin],
    },
    {
        input: 'src/TaplyticsKit.js',
        output: {
            file: 'dist/TaplyticsKit.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpTapylitcsKit',
            strict: false,
        },
        plugins,
    },
];
