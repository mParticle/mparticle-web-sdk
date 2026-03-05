import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/Inspectlet.js',
        output: {
            file: 'dist/Inspectlet.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpInspectletKit',
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
        input: 'src/Inspectlet.js',
        output: {
            file: 'dist/Inspectlet.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpInspectletKit',
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