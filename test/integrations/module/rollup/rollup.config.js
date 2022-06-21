import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const iifeBuild = {
    input: './test/integrations/module/rollup/index.js',
    output: {
        file: './test/integrations/module/dist/rollup-output.js',
        format: 'iife',
        name: 'mParticle',
    },
    plugins: [resolve(), commonjs()],
};

export default [iifeBuild];
