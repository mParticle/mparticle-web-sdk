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
        file: 'dist/mparticle.js',
        format: 'iife',
        name: 'mParticle',
        sourcemap: ENVIRONMENT !== 'prod',
        strict: false
    }
}

const cjsBuild = {
    ...defaultOutput,
    output: {
        file: 'dist/mparticle.common.js',
        format: 'cjs',
        name: 'mParticle',
        sourcemap: ENVIRONMENT !== 'prod',
        strict: false
    }
}

const stubBuild = {
    input: 'src/stub/mParticle-stub.js',
    output: {
        file: 'dist/mparticle.stub.js',
        format: 'iife',
        name: 'mParticle',
        strict: false
    }
}

export default [iifeBuild, cjsBuild, stubBuild];