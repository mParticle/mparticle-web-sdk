import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/oneTrustWrapper.js',
        output: {
            file: 'dist/OneTrustKit.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpOneTrustKit',
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
        input: 'src/oneTrustWrapper.js',
        output: {
            file: 'dist/OneTrustKit.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpOneTrustKit',
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