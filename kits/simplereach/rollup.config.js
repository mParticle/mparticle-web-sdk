import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/SimpleReach.js',
        output: {
            file: 'dist/SimpleReach.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpSimpleReachKit',
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
        input: 'src/SimpleReach.js',
        output: {
            file: 'dist/SimpleReach.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpSimpleReachKit',
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