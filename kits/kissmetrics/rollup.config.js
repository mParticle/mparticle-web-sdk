import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const plugins = [resolve({ browser: true }), commonjs()];

export default [
    {
        input: 'src/KissMetricsForwarder.js',
        output: {
            file: 'dist/KissMetricsForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpKissMetricsKit',
            strict: false,
        },
        plugins,
    },
    {
        input: 'src/KissMetricsForwarder.js',
        output: {
            file: 'dist/KissMetricsForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpKissMetricsKit',
            strict: false,
        },
        plugins,
    },
];
