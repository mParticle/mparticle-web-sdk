import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import terserPlugin from '../../../scripts/rollup/terserPlugin';

const plugins = [resolve({ browser: true }), commonjs()];

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
        plugins: [...plugins, terserPlugin],
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
        plugins,
    },
];
