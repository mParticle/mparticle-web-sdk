import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const plugins = [resolve({ browser: true }), commonjs()];

export default [
    {
        input: 'src/TwitterEventForwarder.js',
        output: {
            file: 'dist/TwitterEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpTwitterKit',
            strict: false,
        },
        plugins,
    },
    {
        input: 'src/TwitterEventForwarder.js',
        output: {
            file: 'dist/TwitterEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpTwitterKit',
            strict: false,
        },
        plugins,
    },
];
