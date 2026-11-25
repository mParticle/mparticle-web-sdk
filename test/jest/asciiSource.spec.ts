import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const { nonAsciiValues } = require('../../scripts/check-ascii-dist');

// Every source file that ships in the core or a Rokt kit bundle. Checkout patterns are compiled when the
// bundle loads. The CDN's minifier turns a JavaScript string
// escape such as 'を' back into the raw character, and a page that is not UTF-8 can then make
// the browser decode the bundle with the page's encoding, where a multi-byte character swallows
// the next byte (a `]`, `)` or quote): the RegExp throws and the SDK never loads. So the code,
// comments aside, must be ASCII: a non-ASCII character is written as a regex escape, '\\u3092' in
// a string or /·/ in a regex literal, which the minifier leaves alone.
//
// scripts/check-ascii-dist.js checks the built bundles and scripts/check-cdn-minifier.js what NUglify
// makes of them; this catches the same thing at the source line, before a build.
const ROOT = path.join(__dirname, '../..');
const FILES = execFileSync(
    'git',
    ['ls-files', 'src', 'kits/rokt/src', 'kits/roktpayplus/src'],
    { cwd: ROOT, encoding: 'utf8' }
)
    .split('\n')
    .filter(file => /\.(ts|js)$/.test(file) && !/\.(spec|test)\.ts$/.test(file));

describe('shipped source stays ASCII', () => {
    it('finds the source files', () => {
        expect(FILES).toContain('src/buttonTracking/checkoutIntent.ts');
        expect(FILES).toContain('kits/rokt/src/Rokt-Kit.ts');
    });

    it.each(FILES)('%s has no non-ASCII outside comments', file => {
        const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
        expect(nonAsciiValues(text, file)).toEqual([]);
    });
});
