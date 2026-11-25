/* eslint-env node, es2021 */

// Fails when the CDN's NUglify pass leaves a name undeclared that the built bundle declares.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { Linter } = require('eslint');
const { smokeTest } = require('./smoke-cdn-minified');
const { firstNonAsciiByte } = require('./check-ascii-dist');

// NUglify writes string escapes back out as raw characters, and a page that is not UTF-8 then fails
// to parse the bundle (3.33.0). These vendor kits already ship non-ASCII text after NUglify; any
// other bundle that does fails the check.
const KNOWN_NON_ASCII = [/^kits\/adobe\//, /^kits\/braze\//];

function nonAsciiAfterMinification(bundle, minified) {
    const offset = firstNonAsciiByte(minified);
    if (offset === -1 || KNOWN_NON_ASCII.some(known => known.test(bundle))) {
        return undefined;
    }
    const character = minified.subarray(offset, offset + 4).toString('utf8');
    return `${bundle} is not ASCII after minification: byte ${offset} starts "${
        Array.from(character)[0]
    }". Write the character with String.fromCharCode, or escape the backslash in a RegExp pattern.`;
}

const linter = new Linter();
const config = {
    env: { browser: true, es2022: true },
    parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
    rules: { 'no-undef': 'error' },
};

function undeclaredNames(code) {
    // Ignore /* global */ and eslint comments: the minifier strips them, so only code may count.
    const messages = linter.verify(code, config, { allowInlineConfig: false });
    const fatal = messages.find(message => message.fatal);
    if (fatal) {
        throw new Error(`does not parse: ${fatal.message}`);
    }
    return new Set(
        messages
            .filter(message => message.ruleId === 'no-undef')
            .map(message => /'(.+)' is not defined/.exec(message.message)[1])
    );
}

function introducedUndeclaredNames(original, minified) {
    const before = undeclaredNames(original);
    return Array.from(undeclaredNames(minified)).filter(
        name => !before.has(name)
    );
}

async function main(bundles) {
    if (bundles.length === 0) {
        console.error('usage: check-cdn-minifier.js <bundle.js>...');
        return 2;
    }

    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdn-minifier-'));
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
            ...bundles,
        ],
        { stdio: 'inherit' }
    );
    if (minify.status !== 0) {
        console.error('CDN minifier failed to run.');
        return 1;
    }

    let failed = false;
    for (const bundle of bundles) {
        const original = fs.readFileSync(bundle, 'utf8');
        const minifiedBytes = fs.readFileSync(path.join(outputDir, bundle));
        const minified = minifiedBytes.toString('utf8');
        const nonAscii = nonAsciiAfterMinification(bundle, minifiedBytes);
        if (nonAscii) {
            failed = true;
            console.error(`CDN minifier check failed: ${nonAscii}`);
        }
        let introduced;
        try {
            introduced = introducedUndeclaredNames(original, minified);
        } catch (error) {
            failed = true;
            console.error(
                `CDN minifier check failed: ${bundle} ${error.message}`
            );
            continue;
        }
        if (introduced.length > 0) {
            failed = true;
            console.error(
                `CDN minifier check failed: ${bundle} references undeclared ${introduced.join(
                    ', '
                )} after minification.`
            );
        } else if (!nonAscii) {
            console.log(`CDN minifier check passed: ${bundle}`);
        }
    }
    const core = bundles.find(
        bundle => path.basename(bundle) === 'mparticle.js'
    );
    if (core) {
        const read = (dir, bundle) =>
            bundle
                ? fs.readFileSync(path.join(dir, bundle), 'utf8')
                : undefined;
        for (const kit of [
            undefined,
            ...bundles.filter(bundle => bundle !== core),
        ]) {
            const label = kit || core;
            const {
                errors,
                loadOnly,
                checkoutMissesBeforeMinification,
            } = await smokeTest(
                { core: read('.', core), kit: read('.', kit) },
                { core: read(outputDir, core), kit: read(outputDir, kit) }
            );
            const checkoutMisses = checkoutMissesBeforeMinification || [];
            if (errors.length > 0) {
                failed = true;
                console.error(
                    `CDN minifier smoke test failed: ${label} only after minification: ${errors.join(
                        ', '
                    )}`
                );
            }
            if (checkoutMisses.length > 0) {
                failed = true;
                console.error(
                    `CDN minifier smoke test failed: ${label} checkout scenario before minification: ${checkoutMisses.join(
                        ', '
                    )}`
                );
            }
            if (errors.length === 0 && checkoutMisses.length === 0) {
                console.log(
                    `CDN minifier smoke test passed: ${label}${
                        loadOnly
                            ? ' (load only: it does not register as a kit)'
                            : ''
                    }${
                        checkoutMissesBeforeMinification
                            ? ' (with its checkout scenario)'
                            : ''
                    }`
                );
            }
        }
    }
    return failed ? 1 : 0;
}

if (require.main === module) {
    main(process.argv.slice(2)).then(
        code => process.exit(code),
        error => {
            console.error(`CDN minifier check could not run: ${error.message}`);
            process.exit(1);
        }
    );
}

module.exports = { introducedUndeclaredNames, nonAsciiAfterMinification };
