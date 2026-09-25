import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

// Shared on purpose: rollup-plugin-commonjs <19 keeps CJS detection in a
// process-global map, so per-config instances race on the second build.
const plugins = [
    resolve({
        browser: true,
    }),
    commonjs(),
];

export default [
    {
        input: 'src/Inspectlet.js',
        output: {
            file: 'dist/Inspectlet.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpInspectletKit',
            strict: false,
        },
        plugins,
    },
    {
        input: 'src/Inspectlet.js',
        output: {
            file: 'dist/Inspectlet.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpInspectletKit',
            strict: false,
        },
        plugins,
    },
];
