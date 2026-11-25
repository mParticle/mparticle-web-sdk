const { nonAsciiValues, firstNonAsciiByte } = require('../../scripts/check-ascii-dist');
const { nonAsciiAfterMinification } = require('../../scripts/check-cdn-minifier');

// Built from a backslash so this file stays ASCII and the code under test holds a real escape.
const BS = String.fromCharCode(92);
const WO = String.fromCharCode(0x3092);

describe('nonAsciiValues', () => {
    it('flags a string escape the CDN minifier writes back as the raw character', () => {
        const code = `var p=new RegExp('add to cart[^${BS}u3092]','i');`;

        expect(nonAsciiValues(code, 'bundle.js')).toEqual([
            `line 1: 'add to cart[^${BS}u3092]'`,
        ]);
    });

    it('flags template, hex and code point escapes', () => {
        const code = [
            `var a=\`${BS}u20AC\`;`,
            `var b='${BS}xE9';`,
            `var c="${BS}u{1F600}";`,
        ].join('\n');

        expect(nonAsciiValues(code, 'bundle.js')).toHaveLength(3);
    });

    it('flags escaped identifiers, private ones included', () => {
        const code = `var ${BS}u00E9=1;class C{#${BS}u00E9=2}`;

        expect(nonAsciiValues(code, 'bundle.js')).toHaveLength(2);
    });

    it('passes an escaped backslash, which stays ASCII after minification', () => {
        const code = `var p=new RegExp('[^${BS}${BS}u3092]');var s=String.fromCharCode(65533);`;

        expect(nonAsciiValues(code, 'bundle.js')).toEqual([]);
    });

    it('ignores comments and leaves regex literals to the NUglify check', () => {
        const code = `// ${WO}\nvar r=/[${BS}u2019${BS}u2018]/g;`;

        expect(nonAsciiValues(code, 'bundle.js')).toEqual([]);
    });

    it('reads TypeScript sources', () => {
        const code = `const label: string = '${WO}';`;

        expect(nonAsciiValues(code, 'source.ts')).toEqual([
            `line 1: '${WO}'`,
        ]);
    });
});

describe('firstNonAsciiByte', () => {
    it('returns the offset of the first byte above 0x7F', () => {
        expect(firstNonAsciiByte(Buffer.from(`ab${WO}`, 'utf8'))).toBe(2);
        expect(firstNonAsciiByte(Buffer.from('abc'))).toBe(-1);
    });
});

describe('nonAsciiAfterMinification', () => {
    const minified = Buffer.from(`window.p=new RegExp("[^${WO}]")`, 'utf8');

    it('reports a bundle the minifier left non-ASCII', () => {
        expect(
            nonAsciiAfterMinification('kits/rokt/dist/Rokt-Kit.iife.js', minified)
        ).toEqual(
            `kits/rokt/dist/Rokt-Kit.iife.js is not ASCII after minification: byte 23 starts "${WO}". ` +
                'Write the character with String.fromCharCode, or escape the backslash in a RegExp pattern.'
        );
    });

    it('passes an ASCII bundle', () => {
        expect(
            nonAsciiAfterMinification('dist/mparticle.js', Buffer.from('window.a=1'))
        ).toBeUndefined();
    });

    it('lets the vendor kits that already ship non-ASCII through', () => {
        expect(
            nonAsciiAfterMinification('kits/braze/braze-6/dist/BrazeKit.iife.js', minified)
        ).toBeUndefined();
    });
});
