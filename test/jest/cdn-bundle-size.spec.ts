// Imports keep this file a module, so its names never join the global scope core's build compiles against.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as zlib from 'zlib';
import { execFileSync } from 'child_process';

const { sizes, measure, formatReport } = require('../../scripts/cdn-bundle-size');

describe('cdn-bundle-size', () => {
    it('measures built bytes, minified bytes and the minified bytes at gzip level 9', () => {
        // Large enough that gzip levels give different sizes.
        const minified = Buffer.from(
            Array.from({ length: 2000 }, (_, i) => `var v${i}=${(i * 7919) % 1000};`).join('')
        );

        const measured = sizes(Buffer.alloc(30000), minified);

        expect(measured).toEqual({
            built: 30000,
            minified: 26670,
            gzip: zlib.gzipSync(minified, { level: 9 }).length,
        });
        expect(measured.gzip).not.toBe(zlib.gzipSync(minified).length);
    });

    it('shows each size with its change from the base', () => {
        const report = formatReport(
            { 'dist/a.js': { built: 1000, minified: 2000, gzip: 300 } },
            { 'dist/a.js': { built: 1052, minified: 1990, gzip: 300 } }
        );

        expect(report).toContain('| `dist/a.js` | 1,052 (+52) | 1,990 (-10) | 300 (0) |');
    });

    it('marks a bundle the base or this pull request did not build', () => {
        const report = formatReport(
            { 'dist/a.js': null, 'dist/b.js': { built: 1, minified: 1, gzip: 1 } },
            { 'dist/a.js': { built: 5, minified: 4, gzip: 3 }, 'dist/b.js': null }
        );

        expect(report).toContain(
            '| `dist/a.js` | 5 (base not built) | 4 (base not built) | 3 (base not built) |'
        );
        expect(report).toContain('| `dist/b.js` | not built | not built | not built |');
    });

    it('marks a side whose measurement was never written', () => {
        const measured = { 'dist/a.js': { built: 5, minified: 4, gzip: 3 } };

        expect(formatReport(null, measured)).toContain(
            '| `dist/a.js` | 5 (base not measured) | 4 (base not measured) | 3 (base not measured) |'
        );
        expect(formatReport(measured, null)).toContain(
            '| `dist/a.js` | not measured | not measured | not measured |'
        );
    });

    it('records a bundle that is not on disk as not built, without running the minifier', () => {
        expect(measure(['dist/no-such-bundle.js'])).toEqual({ 'dist/no-such-bundle.js': null });
    });

    it('says so when neither side was measured', () => {
        expect(formatReport(null, null)).toContain('Neither side could be measured.');
    });
});

describe('cdn-bundle-size-build.sh', () => {
    const script = path.join(__dirname, '../../scripts/cdn-bundle-size-build.sh');
    const core = 'dist/mparticle.js';
    const kit = 'kits/rokt/dist/Rokt-Kit.iife.js';
    let checkout: string;

    // A checkout holding stale committed bundles, where a stand-in npm writes each bundle (unless silent) and then
    // exits with the given status: build:iife for core, build for the kit.
    const build = (status: { ci?: number; core?: number; kit?: number; silent?: boolean }) => {
        checkout = fs.mkdtempSync(path.join(os.tmpdir(), 'cdn-size-build-'));
        fs.mkdirSync(path.join(checkout, 'bin'));
        fs.mkdirSync(path.join(checkout, 'dist'));
        fs.mkdirSync(path.join(checkout, 'kits/rokt/dist'), { recursive: true });
        fs.writeFileSync(path.join(checkout, core), 'stale');
        fs.writeFileSync(path.join(checkout, kit), 'stale');
        fs.writeFileSync(
            path.join(checkout, 'bin/npm'),
            [
                '#!/bin/sh',
                `[ "$1" = ci ] && exit ${status.ci || 0}`,
                `[ -n "${status.silent ? 1 : ''}" ] && exit 0`,
                `[ "$2" = build:iife ] && { echo built > dist/mparticle.js; exit ${status.core || 0}; }`,
                `echo built > dist/Rokt-Kit.iife.js; exit ${status.kit || 0}`,
            ].join('\n'),
            { mode: 0o755 }
        );
        execFileSync('bash', [script], {
            cwd: checkout,
            env: { ...process.env, PATH: `${path.join(checkout, 'bin')}:${process.env.PATH}` },
        });
        const read = (bundle: string) =>
            fs.existsSync(path.join(checkout, bundle))
                ? fs.readFileSync(path.join(checkout, bundle), 'utf8').trim()
                : 'absent';
        return { core: read(core), kit: read(kit) };
    };

    afterEach(() => {
        fs.rmSync(checkout, { recursive: true, force: true });
    });

    it('replaces both stale bundles when both builds pass', () => {
        expect(build({})).toEqual({ core: 'built', kit: 'built' });
    });

    it('drops core when its build fails after writing it, and keeps the kit', () => {
        expect(build({ core: 1 })).toEqual({ core: 'absent', kit: 'built' });
    });

    it('drops the kit when its build fails after writing it, and keeps core', () => {
        expect(build({ kit: 1 })).toEqual({ core: 'built', kit: 'absent' });
    });

    it('leaves no stale bundle when the installs fail', () => {
        expect(build({ ci: 1 })).toEqual({ core: 'absent', kit: 'absent' });
    });

    it('leaves no stale bundle when a passing build writes nothing', () => {
        expect(build({ silent: true })).toEqual({ core: 'absent', kit: 'absent' });
    });
});
