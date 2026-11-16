import { production } from './node_modules/@mparticle/web-kit-wrapper/rollup.base';
import terserPlugin from '../../scripts/rollup/terserPlugin';

export default [
    {
        input: production.input,
        output: {
            ...production.output,
            format: 'iife',
            file: 'dist/DoubleClick-Kit.iife.js',
            name: 'mpDoubleClickKit',
        },
        plugins: [...production.plugins, terserPlugin],
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
