/**
 * @jest-environment node
 */
import asciiOnly from '../../scripts/rollup-plugin-ascii-only';

// The 3.17.0 checkout-intent regexes that broke on Shift_JIS and GBK pages
const SOURCE = [
    "var quotes = /[’‘]/g;",
    "var money = /[0-9０-９$€£¥￥₹円.,，]/g;",
    "var dash = /[\\s()\\-‐-―]/g;",
    "var label = 'カート — ギフト 😀';",
    'var tpl = `注文 ${1}`;',
].join('\n');

const render = (code: string): string =>
    asciiOnly().renderChunk(code).code;

const evaluate = (code: string) =>
    new Function(`${code}\nreturn { quotes, money, dash, label, tpl };`)();

describe('ascii-only rollup plugin', () => {
    ['shift_jis', 'gbk'].forEach(encoding => {
        it(`unescaped source breaks when decoded as ${encoding}`, () => {
            const decoded = new TextDecoder(encoding).decode(
                Buffer.from(SOURCE, 'utf8')
            );

            expect(() => new Function(decoded)).toThrow(SyntaxError);
        });
    });

    it('emits only ASCII', () => {
        expect(render(SOURCE)).toMatch(/^[\x00-\x7f]*$/);
    });

    ['shift_jis', 'gbk', 'euc-kr', 'windows-1252'].forEach(encoding => {
        it(`output parses when decoded as ${encoding}`, () => {
            const decoded = new TextDecoder(encoding).decode(
                Buffer.from(render(SOURCE), 'utf8')
            );

            expect(() => new Function(decoded)).not.toThrow();
        });
    });

    it('keeps strings, templates and regex matches unchanged', () => {
        const before = evaluate(SOURCE);
        const after = evaluate(render(SOURCE));

        expect(after.label).toBe(before.label);
        expect(after.tpl).toBe(before.tpl);
        ['quotes', 'money', 'dash'].forEach(name => {
            for (let code = 0; code < 0x10000; code++) {
                const char = String.fromCharCode(code);
                expect(char.replace(after[name], '')).toBe(
                    char.replace(before[name], '')
                );
            }
        });
    });

    it('refuses a backslash-escaped non-ASCII character', () => {
        expect(() => render("var s = '\\é';")).toThrow(/ascii-only/);
    });
});
