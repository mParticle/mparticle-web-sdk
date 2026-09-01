#!/usr/bin/env node
'use strict';

const version = process.argv[2];
const track = process.env.TRACK;
const expectedMajors = {
    v2: 2,
    v3: 3,
};

if (!Object.prototype.hasOwnProperty.call(expectedMajors, track)) {
    console.log(
        `Invalid release track "${track || ''}": expected TRACK to be v2 or v3.`
    );
    process.exit(1);
}

const versionMatch =
    typeof version === 'string' &&
    /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(version);

if (!versionMatch) {
    console.log(
        `Invalid predicted release version "${version ||
            ''}": expected a stable SemVer version (major.minor.patch).`
    );
    process.exit(1);
}

const actualMajor = Number(versionMatch[1]);
const expectedMajor = expectedMajors[track];

if (actualMajor !== expectedMajor) {
    console.log(
        `Release track mismatch: ${track} expects major ${expectedMajor}, but semantic-release predicted ${version} (major ${actualMajor}).`
    );
    process.exit(1);
}

console.error(
    `Release track validation passed: ${track} matches predicted version ${version}.`
);
