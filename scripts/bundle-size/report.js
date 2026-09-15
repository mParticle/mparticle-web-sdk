const { readFileSync, writeFileSync } = require('fs');
const { parseArgs } = require('util');

const {
    trackedBundles,
    formatKiB,
    measureBundles,
} = require('./tracked-bundles.js');

// Identifies our own comment so repeated runs update one comment instead of piling up.
const STICKY_MARKER = '<!-- bundle-size-report -->';

const toSnapshot = ({ measured, sha }) => ({
    sha: sha || null,
    bundles: measured,
});

const formatDelta = (currentBytes, baselineBytes) => {
    if (!Number.isFinite(baselineBytes)) {
        return 'new';
    }

    const deltaBytes = currentBytes - baselineBytes;
    if (deltaBytes === 0) {
        return 'no change';
    }

    const sign = deltaBytes > 0 ? '+' : '-';
    const percent =
        baselineBytes > 0
            ? ` (${sign}${(
                  (Math.abs(deltaBytes) / baselineBytes) *
                  100
              ).toFixed(2)}%)`
            : '';

    return `${sign}${formatKiB(Math.abs(deltaBytes))}${percent}`;
};

const buildReport = ({ measured, missing, baseline }) => {
    const baselineByPath = new Map(
        (baseline && baseline.bundles ? baseline.bundles : []).map(bundle => [
            bundle.relativePath,
            bundle,
        ])
    );
    const missingSet = new Set(missing);

    const rows = trackedBundles.map(tracked => {
        const current = measured.find(
            bundle => bundle.relativePath === tracked.relativePath
        );
        const baselineBundle = baselineByPath.get(tracked.relativePath);
        const baselineGzipBytes = baselineBundle
            ? baselineBundle.gzipBytes
            : null;
        const isMissing = missingSet.has(tracked.relativePath) || !current;

        return {
            label: tracked.label,
            relativePath: tracked.relativePath,
            gzipBytes: current ? current.gzipBytes : null,
            baselineGzipBytes,
            isMissing,
            delta: isMissing
                ? 'not built'
                : formatDelta(current.gzipBytes, baselineGzipBytes),
        };
    });

    return {
        rows,
        hasBaseline: Boolean(baseline),
        hasMissing: rows.some(row => row.isMissing),
    };
};

const cell = value => (Number.isFinite(value) ? formatKiB(value) : 'n/a');

const renderMarkdown = (
    report,
    { baseLabel, headLabel, baseSha, headSha, runUrl }
) => {
    const lines = [STICKY_MARKER, '## :package: Bundle Size', ''];

    if (!report.hasBaseline) {
        lines.push(
            `> Could not measure \`${baseLabel}\`, so this run reports sizes without a comparison.`,
            ''
        );
    }

    lines.push(`| Bundle | ${baseLabel} (gzip) | ${headLabel} (gzip) | Δ |`);
    lines.push('| --- | ---: | ---: | ---: |');

    for (const row of report.rows) {
        lines.push(
            `| ${row.label} | ${cell(row.baselineGzipBytes)} | ${cell(
                row.gzipBytes
            )} | ${row.delta} |`
        );
    }

    lines.push('');

    if (report.hasMissing) {
        lines.push(
            '⚠️ Rows marked `not built` were not produced by this branch — check the build steps in the run.',
            ''
        );
    }

    const footer = ['gzip level 9 of the built artefact'];
    if (baseSha) {
        footer.push(`${baseLabel} \`${baseSha.slice(0, 8)}\``);
    }
    if (headSha) {
        footer.push(`${headLabel} \`${headSha.slice(0, 8)}\``);
    }
    lines.push(
        `<sub>${footer.join(' · ')}${runUrl ? ` · [run](${runUrl})` : ''}</sub>`
    );

    return `${lines.join('\n')}\n`;
};

// Stands in for the table when the report cannot be produced. It carries the marker so
// it replaces the last good report rather than leaving it on the PR looking current.
const renderFailure = (error, { runUrl }) =>
    [
        STICKY_MARKER,
        '## :package: Bundle Size',
        '',
        `> The bundle size report could not be produced${
            runUrl ? ` — see the [run](${runUrl})` : ''
        }.`,
        '>',
        `> \`${error.message}\``,
        '',
    ].join('\n');

// A baseline we cannot parse is treated as absent: a report without a comparison is
// more useful than a failed job on a check that never gates.
const loadBaseline = baselinePath => {
    if (!baselinePath) {
        return null;
    }

    try {
        const parsed = JSON.parse(readFileSync(baselinePath, 'utf8'));
        // A snapshot with no bundles in it means the base side built nothing, which is a
        // failure to report as such rather than a baseline in which everything is new.
        const isUsable =
            Array.isArray(parsed.bundles) &&
            parsed.bundles.length > 0 &&
            parsed.bundles.every(
                bundle =>
                    bundle &&
                    typeof bundle.relativePath === 'string' &&
                    Number.isFinite(bundle.gzipBytes)
            );
        return isUsable ? parsed : null;
    } catch (error) {
        return null;
    }
};

const main = () => {
    const { values } = parseArgs({
        options: {
            cwd: { type: 'string' },
            out: { type: 'string' },
            baseline: { type: 'string' },
            'base-label': { type: 'string' },
            'head-label': { type: 'string' },
            'base-sha': { type: 'string' },
            'head-sha': { type: 'string' },
            'run-url': { type: 'string' },
        },
    });

    const cwd = values.cwd || process.cwd();

    // Always end up with markdown to publish. A report that throws would otherwise
    // leave a previous run's sticky comment on the PR, looking current.
    let markdown;
    try {
        const { measured, missing } = measureBundles(trackedBundles, cwd);

        if (values.out) {
            const snapshot = toSnapshot({ measured, sha: values['head-sha'] });
            writeFileSync(values.out, `${JSON.stringify(snapshot, null, 2)}\n`);
        }

        markdown = renderMarkdown(
            buildReport({
                measured,
                missing,
                baseline: loadBaseline(values.baseline),
            }),
            {
                baseLabel: values['base-label'] || 'base',
                headLabel: values['head-label'] || 'this PR',
                baseSha: values['base-sha'],
                headSha: values['head-sha'],
                runUrl: values['run-url'],
            }
        );
    } catch (error) {
        markdown = renderFailure(error, { runUrl: values['run-url'] });
    }

    // stdout is the only sink for the markdown: the caller redirects it to a file, so
    // there is no write of our own left that could fail after the report is in hand.
    process.stdout.write(markdown);
};

if (require.main === module) {
    main();
}

module.exports = {
    STICKY_MARKER,
    formatDelta,
    renderFailure,
    buildReport,
    renderMarkdown,
    loadBaseline,
    toSnapshot,
};
