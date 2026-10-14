#!/usr/bin/env node

const fs = require('fs');

const filePaths = process.argv.slice(2);
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

    let firstNonAsciiIndex = -1;
    for (let index = 0; index < bytes.length; index += 1) {
        if (bytes[index] > 0x7f) {
            firstNonAsciiIndex = index;
            break;
        }
    }

    if (firstNonAsciiIndex === -1) {
        console.log(`ASCII check passed: ${filePath}`);
        continue;
    }

    hasFailures = true;
    const offendingByte = bytes[firstNonAsciiIndex];
    console.error(
        `ASCII check failed: ${filePath} contains non-ASCII byte 0x${offendingByte
            .toString(16)
            .toUpperCase()
            .padStart(2, '0')} at offset ${firstNonAsciiIndex}.`
    );
}

process.exit(hasFailures ? 1 : 0);
