import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/DeviceMatchEventForwarder.js',
        output: {
            file: 'dist/DeviceMatchEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpDeviceMatchKit',
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
        input: 'src/DeviceMatchEventForwarder.js',
        output: {
            file: 'dist/DeviceMatchEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpDeviceMatchKit',
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