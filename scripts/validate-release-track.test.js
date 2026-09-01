#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const validator = path.join(__dirname, 'validate-release-track.js');

function run(version, track) {
    const env = { ...process.env };
    const args = [validator];
    if (track === undefined) {
        delete env.TRACK;
    } else {
        env.TRACK = track;
    }
    if (version !== undefined) {
        args.push(version);
    }

    return spawnSync(process.execPath, args, {
        encoding: 'utf8',
        env,
    });
}

const cases = [
    { name: 'accepts a v2 version for v2', version: '2.82.0', track: 'v2' },
    { name: 'accepts a v3 version for v3', version: '3.1.0', track: 'v3' },
];

for (const testCase of cases) {
    const result = run(testCase.version, testCase.track);
    assert.strictEqual(result.status, 0, testCase.name);
}

const mismatchedV2 = run('3.1.0', 'v2');
assert.notStrictEqual(mismatchedV2.status, 0, 'rejects v3 for v2');
assert.match(mismatchedV2.stdout, /v2 expects major 2.*major 3/);

const mismatchedV3 = run('2.82.0', 'v3');
assert.notStrictEqual(mismatchedV3.status, 0, 'rejects v2 for v3');
assert.match(mismatchedV3.stdout, /v3 expects major 3.*major 2/);

for (const [name, version, track, message] of [
    [
        'rejects an unknown track',
        '3.1.0',
        'v4',
        /expected TRACK to be v2 or v3/,
    ],
    [
        'rejects a missing track',
        '3.1.0',
        undefined,
        /expected TRACK to be v2 or v3/,
    ],
    [
        'rejects a missing version',
        undefined,
        'v3',
        /expected a stable SemVer version/,
    ],
    [
        'rejects malformed SemVer',
        '3.1',
        'v3',
        /expected a stable SemVer version/,
    ],
    [
        'rejects prerelease SemVer',
        '3.1.0-beta.1',
        'v3',
        /expected a stable SemVer version/,
    ],
]) {
    const result = run(version, track);
    assert.notStrictEqual(result.status, 0, name);
    assert.match(result.stdout, message);
}

console.log('Release track validator tests passed.');
