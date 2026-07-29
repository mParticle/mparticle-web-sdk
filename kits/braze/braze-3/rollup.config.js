import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import pkg from './package.json';

const plugins = [
    replace({
        'process.env.PACKAGE_VERSION': JSON.stringify(pkg.version),
        preventAssignment: true,
    }),
    resolve({
        browser: true,
    }),
    commonjs(),
];

export default [
    {
        input: 'src/BrazeKit-dev.js',
        output: {
            file: 'dist/BrazeKit.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpBrazeKitV3',
            strict: false,
        },
        plugins,
    },
    {
        input: 'src/BrazeKit-dev.js',
        output: {
            file: 'dist/BrazeKit.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpBrazeKitV3',
            strict: false,
        },
        plugins,
    },
];
