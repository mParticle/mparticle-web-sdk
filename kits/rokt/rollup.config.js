import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import json from '@rollup/plugin-json';
import pkg from './package.json';

const kitName = 'Rokt';

const outputs = {
    name: `${kitName}Kit`,
    exports: 'named',
    strict: true,
};

const plugins = [
    resolve({ 
        browser: true
    }),
    commonjs(),
    json(),
    replace({
        'process.env.PACKAGE_VERSION': JSON.stringify(pkg.version),
        preventAssignment: true
    })
];

export default [
    {
        input: `src/${kitName}-Kit.js`,
        output: {
            ...outputs,
            format: 'iife',
            file: `dist/${kitName}-Kit.iife.js`,
        },
        plugins,
    },
    {
        input: `src/${kitName}-Kit.js`,
        output: {
            ...outputs,
            format: 'cjs',
            file: `dist/${kitName}-Kit.common.js`,
        },
        plugins,
    },
];