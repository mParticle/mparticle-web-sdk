import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import terserPlugin from '../../scripts/rollup/terserPlugin';

const plugins = [resolve({ browser: true }), commonjs()];

export default [
    {
        input: 'src/IntercomEventForwarder.js',
        output: {
            file: 'dist/IntercomEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpIntercomKit',
            strict: false,
        },
        plugins: [...plugins, terserPlugin],
    },
    {
        input: 'src/IntercomEventForwarder.js',
        output: {
            file: 'dist/IntercomEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpIntercomKit',
            strict: false,
        },
        plugins,
    },
];
