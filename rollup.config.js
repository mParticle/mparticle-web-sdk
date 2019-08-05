const { ENVIRONMENT } = process.env;

import resolve from 'rollup-plugin-node-resolve';

const defaultOutput = {
    input: 'src/main.js',
    plugins: [
        resolve()
    ]
};

const iifeBuild = {
    ...defaultOutput,
    output: {
        file: 'build/mParticle-dev.js',
        format: 'iife',
        name: 'mParticle',
        sourcemap: ENVIRONMENT !== 'prod',
        strict: false
    }
}

const cjsBuild = {
    ...defaultOutput,
    output: {
        file: 'build/mParticle.common.js',
        format: 'cjs',
        name: 'mParticle',
        sourcemap: ENVIRONMENT !== 'prod',
        strict: false
    }
}

export default [iifeBuild, cjsBuild];