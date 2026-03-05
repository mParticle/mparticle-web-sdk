import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/TaplyticsKit.js',
        output: {
            file: 'dist/TaplyticsKit.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpTapylitcsKit',
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
        input: 'src/TaplyticsKit.js',
        output: {
            file: 'dist/TaplyticsKit.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpTapylitcsKit',
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