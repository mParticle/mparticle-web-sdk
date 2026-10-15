/* eslint-env node, es2021 */

// Fails when the CDN's NUglify pass leaves a name undeclared that the built bundle declares.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { Linter } = require('eslint');

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

function main(bundles) {
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
        const minified = fs.readFileSync(path.join(outputDir, bundle), 'utf8');
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
        } else {
            console.log(`CDN minifier check passed: ${bundle}`);
        }
    }
    return failed ? 1 : 0;
}

if (require.main === module) {
    process.exit(main(process.argv.slice(2)));
}

module.exports = { introducedUndeclaredNames };
