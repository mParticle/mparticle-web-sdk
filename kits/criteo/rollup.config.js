import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import terserPlugin from '../../scripts/rollup/terserPlugin';

const plugins = [resolve({ browser: true }), commonjs()];

export default [
    {
        input: 'src/CriteoEventForwarder.js',
        output: {
            file: 'dist/CriteoEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpCriteoKit',
            strict: false,
        },
        plugins: [...plugins, terserPlugin],
    },
    {
        input: 'src/CriteoEventForwarder.js',
        output: {
            file: 'dist/CriteoEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpCriteoKit',
            strict: false,
        },
        plugins,
    },
];
