import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/DynamicYieldKit.js',
        output: {
            file: 'dist/DynamicYieldKit.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpDynamicYieldKit',
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
        input: 'src/DynamicYieldKit.js',
        output: {
            file: 'dist/DynamicYieldKit.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpDynamicYieldKit',
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