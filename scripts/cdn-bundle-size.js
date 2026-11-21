/* eslint-env node, es2021 */

// Measures bundles as built, after the CDN's NUglify pass and gzipped at level 9, and reports two such
// measurements side by side.

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const COLUMNS = [
    ['built', 'Built'],
    ['minified', 'CDN-minified'],
    ['gzip', 'Gzip'],
];

function sizes(built, minified) {
    return {
        built: built.length,
        minified: minified.length,
        gzip: zlib.gzipSync(minified, { level: 9 }).length,
    };
}

function measure(bundles) {
    const built = bundles.filter(bundle => fs.existsSync(bundle));
    let outputDir;
    if (built.length > 0) {
        outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdn-size-'));
        const minify = spawnSync(
            'dotnet',
            [
                'run',
                '--project',
                path.join(__dirname, 'cdn-minifier'),
                '--configuration',
                'Release',
                '--',
                outputDir,
                ...built,
            ],
            { stdio: ['ignore', 'ignore', 'inherit'] }
        );
        if (minify.status !== 0) {
            throw new Error('CDN minifier failed to run.');
        }
    }
    const measured = {};
    for (const bundle of bundles) {
        measured[bundle] = built.includes(bundle)
            ? sizes(
                  fs.readFileSync(bundle),
                  fs.readFileSync(path.join(outputDir, bundle))
              )
            : null;
    }
    return measured;
}

function formatBytes(bytes) {
    return String(bytes).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatChange(change) {
    if (change === 0) {
        return '0';
    }
    return (change > 0 ? '+' : '-') + formatBytes(Math.abs(change));
}

// A measurement is null when it was never written; a bundle in it is null when its build failed.
function formatCell(base, head, bundle, key) {
    if (!head || !head[bundle]) {
        return head ? 'not built' : 'not measured';
    }
    const bytes = formatBytes(head[bundle][key]);
    if (!base || !base[bundle]) {
        return `${bytes} (base not ${base ? 'built' : 'measured'})`;
    }
    return `${bytes} (${formatChange(head[bundle][key] - base[bundle][key])})`;
}

function formatReport(base, head) {
    if (!base && !head) {
        return '### CDN-shaped bundle sizes\n\nNeither side could be measured.\n';
    }
    const bundles = Array.from(
        new Set(Object.keys(head || {}).concat(Object.keys(base || {})))
    );
    const rows = bundles.map(
        bundle =>
            `| \`${bundle}\` | ${COLUMNS.map(([key]) =>
                formatCell(base, head, bundle, key)
            ).join(' | ')} |`
    );
    return [
        '### CDN-shaped bundle sizes',
        '',
        `| Bundle | ${COLUMNS.map(([, title]) => title).join(' | ')} |`,
        `| --- |${COLUMNS.map(() => ' --- |').join('')}`,
        ...rows,
        '',
        'Bytes for this pull request merged onto its base, with the change from the base in brackets. ' +
            'CDN-minified is the bundle after the minifier pinned in `scripts/cdn-minifier`, and Gzip is that output at level 9.',
        '',
    ].join('\n');
}

function readMeasurement(file) {
    return fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file, 'utf8'))
        : null;
}

function main([command, ...args]) {
    if (command === 'measure' && args.length >= 2) {
        const [output, ...bundles] = args;
        fs.writeFileSync(output, JSON.stringify(measure(bundles), null, 2));
        return 0;
    }
    if (command === 'report' && args.length === 2) {
        const [base, head] = args.map(readMeasurement);
        process.stdout.write(formatReport(base, head));
        return 0;
    }
    console.error(
        'usage: cdn-bundle-size.js measure <out.json> <bundle.js>... | report <base.json> <head.json>'
    );
    return 2;
}

if (require.main === module) {
    process.exitCode = main(process.argv.slice(2));
}

module.exports = { sizes, measure, formatReport };
