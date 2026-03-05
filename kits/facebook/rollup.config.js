import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/FacebookEventForwarder.js',
        output: {
            file: 'dist/FacebookEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpFacebookKit',
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
        input: 'src/FacebookEventForwarder.js',
        output: {
            file: 'dist/FacebookEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpFacebookKit',
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
        input: 'src/FacebookEventForwarder.js',
        output: {
            file: 'dist/FacebookEventForwarder.esm.js',
            format: 'esm',
            exports: 'named',
            name: 'mpFacebookKit',
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
