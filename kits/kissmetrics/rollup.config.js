import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/KissMetricsForwarder.js',
        output: {
            file: 'dist/KissMetricsForwarder.iffe.js',
            format: 'iife',
            exports: 'named',
            name: 'mpKissMetricsKit',
            strict: false
        },
        plugins: [
            resolve({
                browser: true
            }),
            commonjs()
        ]
    },
    {
        input: 'src/KissMetricsForwarder.js',
        output: {
            file: 'dist/KissMetricsForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpKissMetricsKit',
            strict: false
        },
        plugins: [
            resolve({
                browser: true
            }),
            commonjs()
        ]
    }
]