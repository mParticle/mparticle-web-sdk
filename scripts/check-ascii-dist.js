/* eslint-env node, es2021 */

// A bundle must stay ASCII after the CDN's NUglify pass, not just as built. NUglify writes a string
// escape (backslash, u, four hex digits) back out as the raw character. A page that is not UTF-8 can
// then make the browser decode the bundle with the page's encoding, where a multi-byte character
// swallows the next byte, and the bundle fails to parse (3.17.0 and 3.33.0). So this fails on raw
// non-ASCII bytes and on any string, template or identifier whose value is not ASCII. Regex literals
// are left to scripts/check-cdn-minifier.js, which checks NUglify's real output.

const fs = require('fs');
const ts = require('typescript');

function hasNonAscii(text) {
    return Array.from(text).some(character => character.charCodeAt(0) > 0x7f);
}

// Returns "line N: text" for every string, template or identifier whose value is not ASCII.
// Comments are trivia, not nodes, so they never count.
function nonAsciiValues(code, fileName) {
    const sourceFile = ts.createSourceFile(
        fileName,
        code,
        ts.ScriptTarget.Latest,
        true,
        /\.tsx?$/.test(fileName) ? ts.ScriptKind.TS : ts.ScriptKind.JS
    );
    const found = [];
    const visit = node => {
        if (
            (ts.isStringLiteralLike(node) ||
                ts.isTemplateLiteralToken(node) ||
                ts.isIdentifier(node) ||
                ts.isPrivateIdentifier(node)) &&
            hasNonAscii(node.text)
        ) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(
                node.getStart(sourceFile)
            );
            found.push(
                `line ${line + 1}: ${node.getText(sourceFile).slice(0, 80)}`
            );
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return found;
}

function firstNonAsciiByte(bytes) {
    return bytes.findIndex(byte => byte > 0x7f);
}

function main(filePaths) {
    const targets =
        filePaths.length > 0
            ? filePaths
            : [
                  'dist/mparticle.js',
                  'dist/mparticle.common.js',
                  'dist/mparticle.esm.js',
              ];

    let hasFailures = false;
    for (const filePath of targets) {
        const bytes = fs.readFileSync(filePath);
        const offset = firstNonAsciiByte(bytes);
        if (offset !== -1) {
            hasFailures = true;
            console.error(
                `ASCII check failed: ${filePath} contains non-ASCII byte 0x${bytes[
                    offset
                ]
                    .toString(16)
                    .toUpperCase()
                    .padStart(2, '0')} at offset ${offset}.`
            );
            continue;
        }

        const values = nonAsciiValues(bytes.toString('utf8'), filePath);
        if (values.length > 0) {
            hasFailures = true;
            console.error(
                `ASCII check failed: ${filePath} has values the CDN minifier would write as non-ASCII. ` +
                    'Build the character at runtime with String.fromCharCode, or for a RegExp pattern ' +
                    `escape the backslash too:\n  ${values
                        .slice(0, 10)
                        .join('\n  ')}`
            );
            continue;
        }

        console.log(`ASCII check passed: ${filePath}`);
    }
    return hasFailures ? 1 : 0;
}

if (require.main === module) {
    process.exit(main(process.argv.slice(2)));
}

module.exports = { nonAsciiValues, firstNonAsciiByte };
