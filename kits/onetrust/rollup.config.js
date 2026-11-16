import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import terserPlugin from '../../scripts/rollup/terserPlugin';

const plugins = [resolve({ browser: true }), commonjs()];

export default [
    {
        input: 'src/oneTrustWrapper.js',
        output: {
            file: 'dist/OneTrustKit.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpOneTrustKit',
            strict: false,
        },
        plugins: [...plugins, terserPlugin],
    },
    {
        input: 'src/oneTrustWrapper.js',
        output: {
            file: 'dist/OneTrustKit.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpOneTrustKit',
            strict: false,
        },
        plugins,
    },
];
