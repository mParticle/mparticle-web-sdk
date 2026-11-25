/* eslint-env node, es2021 */

// Checks the lean SDK and module builds in test/modular/: each module's code is
// in its module file and not in the lean SDK, every file and the lean SDK joined
// with each module as served parse as ES5 before and after terser, and the
// sizes stay inside the gates.
// The source-level boundary check is test/jest/moduleBoundaries.spec.ts; this
// one sees what Rollup actually bundled.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const acorn = require('acorn');
const { minify } = require('terser');

const dir = path.join(__dirname, '..', 'test', 'modular');
const FULL = 'mparticle.js';
const LEAN = 'mparticle.lean.js';
const MODULES = { buttonTracking: 'mparticle.buttonTracking.js' };

// Strings that survive minification: literals and property names.
const MODULE_MARKERS = {
    buttonTracking: [
        'mParticle button tracking: ',
        'ApplePaySession',
        'aria-haspopup',
    ],
};
const CORE_MARKERS = ['_BatchValidator', '_registerErrorReportingService'];

// The lean SDK must leave out at least this share of the full SDK, and the lean
// SDK plus every module may cost at most this much more than the full SDK
// (terser output, gzip -9).
const MAX_LEAN_SHARE_OF_FULL = 0.9;
const MAX_LEAN_PLUS_MODULES_SHARE_OF_FULL = 1.04;

const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
const gzip = text => zlib.gzipSync(text, { level: 9 }).length;

function parsesAsES5(label, code, failures) {
    try {
        acorn.parse(code, { ecmaVersion: 5, sourceType: 'script' });
    } catch (error) {
        failures.push(`${label} does not parse as ES5: ${error.message}`);
    }
}

async function minified(code) {
    const result = await minify(code, {
        compress: true,
        mangle: true,
        format: { ascii_only: true },
    });
    return result.code;
}

async function main() {
    const failures = [];
    const full = read(FULL);
    const lean = read(LEAN);
    const modules = Object.fromEntries(
        Object.entries(MODULES).map(([name, file]) => [name, read(file)])
    );

    for (const [name, markers] of Object.entries(MODULE_MARKERS)) {
        for (const marker of markers) {
            if (lean.includes(marker))
                failures.push(
                    `${LEAN} carries ${name} code: ${JSON.stringify(marker)}`
                );
            if (!modules[name].includes(marker))
                failures.push(
                    `${MODULES[name]} lacks ${JSON.stringify(marker)}`
                );
            if (!full.includes(marker))
                failures.push(`${FULL} lacks ${JSON.stringify(marker)}`);
        }
    }
    for (const marker of CORE_MARKERS) {
        if (!lean.includes(marker))
            failures.push(`${LEAN} lacks ${JSON.stringify(marker)}`);
        for (const [name, code] of Object.entries(modules)) {
            if (code.includes(marker))
                failures.push(
                    `${MODULES[name]} carries core code: ${JSON.stringify(
                        marker
                    )}`
                );
        }
    }

    parsesAsES5(FULL, full, failures);
    parsesAsES5(LEAN, lean, failures);
    for (const [name, code] of Object.entries(modules)) {
        parsesAsES5(MODULES[name], code, failures);
        parsesAsES5(
            `${LEAN} joined with ${MODULES[name]}`,
            lean + '\n' + code,
            failures
        );
    }

    const sizes = {
        full: await minified(full),
        lean: await minified(lean),
    };
    const moduleCode = await Promise.all(Object.values(modules).map(minified));
    const leanPlusModules = [sizes.lean, ...moduleCode].join('\n');
    parsesAsES5(`${LEAN} after terser`, sizes.lean, failures);
    parsesAsES5(
        `${LEAN} joined with every module after terser`,
        leanPlusModules,
        failures
    );
    const rows = [
        ['full SDK', gzip(full), gzip(sizes.full)],
        ['lean SDK', gzip(lean), gzip(sizes.lean)],
        ...Object.keys(modules).map((name, i) => [
            `module ${name}`,
            gzip(modules[name]),
            gzip(moduleCode[i]),
        ]),
        [
            'lean SDK + modules',
            gzip([lean, ...Object.values(modules)].join('\n')),
            gzip(leanPlusModules),
        ],
    ];
    console.log('Build sizes, gzip -9 in bytes (as built / terser):');
    for (const [label, built, terse] of rows) {
        console.log(
            `  ${label.padEnd(26)} ${String(built).padStart(8)} ${String(
                terse
            ).padStart(8)}`
        );
    }

    const fullSize = gzip(sizes.full);
    const leanSize = gzip(sizes.lean);
    const leanPlusSize = gzip(leanPlusModules);
    if (leanSize > fullSize * MAX_LEAN_SHARE_OF_FULL) {
        failures.push(
            `lean SDK is ${leanSize} B, more than ${MAX_LEAN_SHARE_OF_FULL *
                100}% of the full SDK's ${fullSize} B`
        );
    }
    if (leanPlusSize > fullSize * MAX_LEAN_PLUS_MODULES_SHARE_OF_FULL) {
        failures.push(
            `lean SDK plus modules is ${leanPlusSize} B, more than ${MAX_LEAN_PLUS_MODULES_SHARE_OF_FULL *
                100}% of the full SDK's ${fullSize} B`
        );
    }

    if (failures.length) {
        failures.forEach(failure =>
            console.error(`Modular build check failed: ${failure}`)
        );
        return 1;
    }
    console.log('Modular build check passed.');
    return 0;
}

main().then(
    code => process.exit(code),
    error => {
        console.error(`Modular build check could not run: ${error.message}`);
        process.exit(1);
    }
);
