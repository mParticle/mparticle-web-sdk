import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import terserPlugin from '../../scripts/rollup/terserPlugin';

const plugins = [resolve({ browser: true }), commonjs()];

export default [
    {
        input: 'src/DynamicYieldKit.js',
        output: {
            file: 'dist/DynamicYieldKit.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpDynamicYieldKit',
            strict: false,
        },
        plugins: [...plugins, terserPlugin],
    },
    {
        input: 'src/DynamicYieldKit.js',
        output: {
            file: 'dist/DynamicYieldKit.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpDynamicYieldKit',
            strict: false,
        },
        plugins,
    },
];
