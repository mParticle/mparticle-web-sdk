import { escapeNonAscii, escapeNonAsciiPlugin } from '../../../scripts/rollup/escapeNonAsciiPlugin';
import { TextDecoder } from 'util';

describe('escapeNonAsciiPlugin', () => {
    it('escapes non-ASCII characters in strings and regex classes', () => {
        const source = "const a='注文を確定する'; const b=/[’‘]/g;";
        const escaped = escapeNonAscii(source);

        expect(escaped).toContain('\\u6CE8\\u6587\\u3092\\u78BA\\u5B9A\\u3059\\u308B');
        expect(escaped).toContain('/[\\u2019\\u2018]/g');
    });

    it('prevents Shift_JIS decode parse failures for affected patterns', () => {
        const source = "const a='注文を確定する'; const b=/[’‘]/g;";
        const decodedSource = new TextDecoder('shift_jis').decode(Buffer.from(source, 'utf8'));
        expect(() => new Function(decodedSource)).toThrow();

        const escapedSource = escapeNonAscii(source);
        const decodedEscapedSource = new TextDecoder('shift_jis').decode(Buffer.from(escapedSource, 'utf8'));
        expect(() => new Function(decodedEscapedSource)).not.toThrow();
    });

    it('throws when a non-ASCII character is already backslash-escaped', () => {
        const source = String.raw`const a = '\é';`;
        expect(() => escapeNonAscii(source)).toThrow(
            'Cannot safely escape non-ASCII character after backslash'
        );
    });

    it('transforms rollup chunks through renderChunk', () => {
        const plugin = escapeNonAsciiPlugin();
        const output = plugin.renderChunk?.(
            "const a='注文を確定する';",
            { fileName: 'dist/mparticle.js' }
        );

        expect(output?.code).toBe("const a='\\u6CE8\\u6587\\u3092\\u78BA\\u5B9A\\u3059\\u308B';");
        expect(output?.map).toBeTruthy();
    });
});
