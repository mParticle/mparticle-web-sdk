import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const iifeBuild = {
    input: './test/integrations/cjs/rollup/index.js',
    output: {
        file: './test/integrations/cjs/dist/rollup-output.js',
        format: 'iife',
        name: 'mParticle',
    },
    plugins: [resolve(), commonjs()],
};

export default [iifeBuild];
