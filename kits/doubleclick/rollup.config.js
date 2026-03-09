import { production } from './node_modules/@mparticle/web-kit-wrapper/rollup.base';

export default [
    {
        input: production.input,
        output: {
            ...production.output,
            format: 'iife',
            file: 'dist/DoubleClick-Kit.iife.js',
            name: 'mpDoubleClickKit',
        },
        plugins: [...production.plugins],
    },
    {
        input: production.input,
        output: {
            ...production.output,
            format: 'cjs',
            file: 'dist/DoubleClick-Kit.common.js',
            name: 'mpDoubleClickKit',
        },
        plugins: [...production.plugins],
    },
];
