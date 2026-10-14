/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// A script served without a charset is decoded in the host page's encoding, so any
// non-ASCII byte in a bundle can corrupt the code around it on a non-UTF-8 page.
const BUNDLES = ['mparticle.js', 'mparticle.common.js', 'mparticle.esm.js'];

describe('built bundle encoding', () => {
    BUNDLES.forEach(bundle => {
        const bytes = readFileSync(join(__dirname, '../../dist', bundle));

        it(`${bundle} is ASCII only`, () => {
            const offset = bytes.findIndex(byte => byte > 0x7f);
            expect(offset).toBe(-1);
        });
    });

    ['shift_jis', 'gbk', 'euc-kr', 'windows-1252'].forEach(encoding => {
        it(`mparticle.js parses when decoded as ${encoding}`, () => {
            const bytes = readFileSync(join(__dirname, '../../dist/mparticle.js'));
            const source = new TextDecoder(encoding).decode(bytes);

            // Compiles without running, so a mis-decoded regex or string throws here
            expect(() => new Function(source)).not.toThrow();
        });
    });
});
