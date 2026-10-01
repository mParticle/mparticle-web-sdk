const {
    STICKY_MARKER,
    formatDelta,
    renderFailure,
    buildReport,
    renderMarkdown,
    loadBaseline,
} = require('./report.js');
const { trackedBundles, measureBundles } = require('./tracked-bundles.js');
const { readFileSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

const measuredFor = (relativePath, gzipBytes) => ({
    label: trackedBundles.find(bundle => bundle.relativePath === relativePath)
        .label,
    relativePath,
    rawBytes: gzipBytes * 4,
    gzipBytes,
});

const IIFE = 'dist/mparticle.js';
const KIT = 'kits/rokt/dist/Rokt-Kit.iife.js';

describe('formatDelta', () => {
    it('reports a bundle with no baseline as new', () => {
        expect(formatDelta(1024, null)).toBe('new');
        expect(formatDelta(1024, undefined)).toBe('new');
    });

    it('reports an identical size as no change', () => {
        expect(formatDelta(1024, 1024)).toBe('no change');
    });

    it('signs growth and shrinkage and includes a percentage', () => {
        expect(formatDelta(2048, 1024)).toBe('+1.00 KiB (+100.00%)');
        expect(formatDelta(512, 1024)).toBe('-0.50 KiB (-50.00%)');
    });

    it('omits the percentage when the baseline is zero', () => {
        expect(formatDelta(1024, 0)).toBe('+1.00 KiB');
    });
});

describe('buildReport', () => {
    it('emits one row per tracked bundle, in the tracked order', () => {
        const report = buildReport({
            measured: [],
            missing: [],
            baseline: null,
        });

        expect(report.rows.map(row => row.relativePath)).toEqual(
            trackedBundles.map(bundle => bundle.relativePath)
        );
    });

    it('marks a bundle this branch did not build as not built', () => {
        const report = buildReport({
            measured: [],
            missing: [KIT],
            baseline: { bundles: [measuredFor(KIT, 1024)] },
        });
        const row = report.rows.find(
            candidate => candidate.relativePath === KIT
        );

        expect(row.isMissing).toBe(true);
        expect(row.delta).toBe('not built');
        expect(report.hasMissing).toBe(true);
    });

    it('marks a bundle the baseline does not cover as new', () => {
        const report = buildReport({
            measured: [measuredFor(IIFE, 2048)],
            missing: [],
            baseline: { bundles: [measuredFor(KIT, 1024)] },
        });
        const row = report.rows.find(
            candidate => candidate.relativePath === IIFE
        );

        expect(row.delta).toBe('new');
        expect(report.hasBaseline).toBe(true);
    });
});

describe('renderMarkdown', () => {
    const render = overrides =>
        renderMarkdown(
            buildReport({
                measured: [measuredFor(IIFE, 2048)],
                missing: [],
                baseline: { bundles: [measuredFor(IIFE, 1024)] },
                ...overrides,
            }),
            {
                baseLabel: 'v3-development',
                headLabel: 'this PR',
                baseSha: 'abcdef1234567890',
                headSha: '1234567890abcdef',
                runUrl: 'https://example.invalid/run',
            }
        );

    it('leads with the sticky marker so repeat runs update one comment', () => {
        expect(render().startsWith(STICKY_MARKER)).toBe(true);
    });

    it('renders the delta and abbreviated shas', () => {
        const markdown = render();

        expect(markdown).toContain(
            '| 1.00 KiB | 2.00 KiB | +1.00 KiB (+100.00%) |'
        );
        expect(markdown).toContain('v3-development `abcdef12`');
        expect(markdown).toContain('this PR `12345678`');
        expect(markdown).toContain('[run](https://example.invalid/run)');
    });

    it('says so when there is no baseline to compare against', () => {
        expect(render({ baseline: null })).toContain('without a comparison');
    });
});

describe('renderFailure', () => {
    it('carries the sticky marker so it replaces the last good report', () => {
        const markdown = renderFailure({
            runUrl: 'https://example.invalid/run',
        });

        expect(markdown.startsWith(STICKY_MARKER)).toBe(true);
        expect(markdown).toContain('could not be produced');
        expect(markdown).toContain('[run](https://example.invalid/run)');
    });

    it('publishes nothing about the cause, which belongs in the run log', () => {
        const markdown = renderFailure({ runUrl: undefined });

        expect(markdown).not.toMatch(/EACCES|ENOENT|\/home\/runner|Error:/);
    });
});

// Holds the duplicated marker in the comment-posting step of
// .github/workflows/pull-request.yml, which explains why it cannot require() this module.
describe('sticky marker parity with the workflow', () => {
    const readWorkflow = () =>
        readFileSync(
            join(
                __dirname,
                '..',
                '..',
                '.github',
                'workflows',
                'pull-request.yml'
            ),
            'utf8'
        );

    it('matches the one literal inlined in the comment step', () => {
        // String.match with /g, not matchAll: ts-jest downlevels a spread of the
        // iterator matchAll returns into a slice-based helper, which yields [] and
        // makes this assertion fail whatever the workflow says.
        const occurrences =
            readWorkflow().match(/const STICKY_MARKER = '[^']+';/g) || [];

        // Exactly one, so this cannot be satisfied by whichever copy the regex
        // happened to reach first.
        expect(occurrences).toHaveLength(1);
        expect(occurrences[0]).toBe(
            `const STICKY_MARKER = '${STICKY_MARKER}';`
        );
    });

    // Bans the computed-path shape only, not PR code execution in general.
    it('never require()s a computed path', () => {
        const computed = readWorkflow().match(/require\(\s*[^'")\s]/g) || [];

        expect(computed).toEqual([]);
    });

    // A text guard rather than a unit test because the predicate lives inline in the
    // workflow: it cannot be imported from here, since the step must not require() the
    // PR's own checkout. `user` is nullable, and an unguarded read throws inside a
    // continue-on-error step, which silently leaves the last report looking current.
    it('reads a comment author through an optional chain', () => {
        const workflow = readWorkflow();

        expect(workflow).toMatch(/comment\.user\?\.type/);
        expect(workflow).not.toMatch(/comment\.user\.type/);
    });
});

describe('loadBaseline', () => {
    it('treats a missing, unparseable or malformed baseline as absent', () => {
        expect(loadBaseline(undefined)).toBeNull();
        expect(
            loadBaseline('scripts/bundle-size/does-not-exist.json')
        ).toBeNull();
        expect(loadBaseline('scripts/bundle-size/report.js')).toBeNull();
    });

    it('rejects a snapshot that measured nothing, so a failed base build is reported', () => {
        const snapshot = join(tmpdir(), 'empty-bundle-size-snapshot.json');
        writeFileSync(snapshot, JSON.stringify({ sha: null, bundles: [] }));

        expect(loadBaseline(snapshot)).toBeNull();
    });

    it('accepts a snapshot that measured at least one bundle', () => {
        const snapshot = join(tmpdir(), 'bundle-size-snapshot.json');
        writeFileSync(
            snapshot,
            JSON.stringify({ sha: null, bundles: [measuredFor(IIFE, 1024)] })
        );

        expect(loadBaseline(snapshot).bundles).toHaveLength(1);
    });
});

describe('measureBundles', () => {
    it('collects missing bundles instead of throwing', () => {
        const { measured, missing } = measureBundles(
            [{ label: 'absent', relativePath: 'no/such/bundle.js' }],
            process.cwd()
        );

        expect(measured).toEqual([]);
        expect(missing).toEqual(['no/such/bundle.js']);
    });

    it('measures a real file as raw bytes plus a smaller gzip size', () => {
        const { measured } = measureBundles(
            [{ label: 'self', relativePath: 'scripts/bundle-size/report.js' }],
            process.cwd()
        );

        expect(measured[0].rawBytes).toBeGreaterThan(0);
        expect(measured[0].gzipBytes).toBeLessThan(measured[0].rawBytes);
    });
});
