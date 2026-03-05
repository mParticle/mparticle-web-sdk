import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/IntercomEventForwarder.js',
        output: {
            file: 'dist/IntercomEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpIntercomKit',
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
        input: 'src/IntercomEventForwarder.js',
        output: {
            file: 'dist/IntercomEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpIntercomKit',
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