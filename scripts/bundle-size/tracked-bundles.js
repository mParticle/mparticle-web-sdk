const { readFileSync } = require('fs');
const { resolve } = require('path');
const { gzipSync } = require('zlib');

const KIBIBYTE = 1024;

// Every artefact a consumer actually downloads, either from npm or from the CDN.
// `dist/mparticle.js` is unminified on purpose: it is what npm ships and what a
// partner's own bundler consumes. Paths are relative to a repo root.
const trackedBundles = [
    { label: 'mparticle.js (IIFE, npm)', relativePath: 'dist/mparticle.js' },
    {
        label: 'mparticle.min.js (IIFE, minified)',
        relativePath: 'dist/mparticle.min.js',
    },
    {
        label: 'mparticle.common.js (CJS)',
        relativePath: 'dist/mparticle.common.js',
    },
    { label: 'mparticle.esm.js (ESM)', relativePath: 'dist/mparticle.esm.js' },
    {
        label: 'mparticle.stub.js (stub)',
        relativePath: 'dist/mparticle.stub.js',
    },
    { label: 'snippet.rokt.min.js', relativePath: 'snippet.rokt.min.js' },
    {
        label: 'Rokt-Kit.iife.js',
        relativePath: 'kits/rokt/dist/Rokt-Kit.iife.js',
    },
];

const formatKiB = bytes => `${(bytes / KIBIBYTE).toFixed(2)} KiB`;

const measureBundle = (relativePath, cwd = process.cwd()) => {
    const contents = readFileSync(resolve(cwd, relativePath));
    return {
        rawBytes: contents.byteLength,
        gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
    };
};

// A bundle a branch never built is reported as missing rather than throwing, so a
// base branch without kits/rokt still produces a usable report.
const measureBundles = (bundles = trackedBundles, cwd = process.cwd()) => {
    const measured = [];
    const missing = [];

    for (const bundle of bundles) {
        let measurement;
        try {
            measurement = measureBundle(bundle.relativePath, cwd);
        } catch (error) {
            if (error && error.code === 'ENOENT') {
                missing.push(bundle.relativePath);
                continue;
            }
            throw error;
        }

        measured.push({
            label: bundle.label,
            relativePath: bundle.relativePath,
            rawBytes: measurement.rawBytes,
            gzipBytes: measurement.gzipBytes,
        });
    }

    return { measured, missing };
};

module.exports = {
    KIBIBYTE,
    trackedBundles,
    formatKiB,
    measureBundle,
    measureBundles,
};
