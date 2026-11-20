import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import terserPlugin from '../../../scripts/rollup/terserPlugin';

const plugins = [resolve({ browser: true }), commonjs()];

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
        plugins: [...plugins, terserPlugin],
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
        plugins,
    },
];
