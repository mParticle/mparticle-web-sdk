const zlib = require('zlib');
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
});
