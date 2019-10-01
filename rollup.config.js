const { ENVIRONMENT } = process.env;

import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
const extensions = ['.js', '.ts'];

const defaultBabel = babel({ 
    extensions, 
    include: ['src/**/*'],
    runtimeHelpers: true 
});

const babelMinify = babel({ 
    extensions, 
    include: ['src/**/*'],
    runtimeHelpers: true,
    babelrc: false,
    presets: [
        '@babel/preset-typescript', 
        ['minify', { builtIns: false }], 
        ['@babel/env', { modules: false}]
    ],
    plugins: [
        "@babel/proposal-class-properties",
        "@babel/proposal-object-rest-spread",
        "@babel/plugin-transform-runtime"
    ]
});

const iifeBuild = {
    input: 'src/main.js',
    plugins: [
        defaultBabel, 
        resolve(),
        commonjs({
            include: 'node_modules/**'
        }),
        typescript()
    ],
    output: {
        file: 'dist/mparticle.js',
        format: 'iife',
        name: 'mParticle',
        sourceMap: ENVIRONMENT !== 'prod',
        strict: false
    }
}

const cjsBuild = {
    input: 'src/main.js',
    plugins: [
        babelMinify,
        resolve(),
        commonjs({
            include: 'node_modules/**'
        }),
        typescript()
    ],
    output: {
        file: 'dist/mparticle.common.js',
        format: 'cjs',
        name: 'mParticle',
        sourceMap: 'inline',
        strict: false
    }
}

const stubBuild = {
    input: 'src/stub/mparticle.stub.js',
    output: {
        file: 'dist/mparticle.stub.js',
        format: 'iife',
        name: 'mParticle',
    }
}

const esmBuild = {
    input: 'src/main.js',
    plugins: [
        babelMinify,
        resolve(),
        commonjs({
            include: 'node_modules/**'
        }),
        typescript()
    ],
    output: {
        file: 'dist/mparticle.esm.js',
        format: 'esm',
        name: 'mParticle',
        sourceMap: 'inline',
        strict: false
    }
}

export default [iifeBuild, cjsBuild, stubBuild, esmBuild];
