#!/usr/bin/env node

const fs = require('fs');

const filePath = process.argv[2] || 'dist/mparticle.js';
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
    process.exit(0);
}

const offendingByte = bytes[firstNonAsciiIndex];
console.error(
    `ASCII check failed: ${filePath} contains non-ASCII byte 0x${offendingByte
        .toString(16)
        .toUpperCase()
        .padStart(2, '0')} at offset ${firstNonAsciiIndex}.`
);
process.exit(1);
