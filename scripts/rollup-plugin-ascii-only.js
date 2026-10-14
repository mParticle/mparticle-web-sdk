import MagicString from 'magic-string';

// A script served without a charset is decoded in the host page's encoding. Escaping every
// non-ASCII code unit as \uXXXX keeps the bundle parseable on Shift_JIS, GBK and similar pages.
export default function asciiOnly() {
    return {
        name: 'ascii-only',
        renderChunk(code) {
            const s = new MagicString(code);
            const nonAscii = /[\u0080-￿]/g;
            let match;
            while ((match = nonAscii.exec(code))) {
                // `\é` would become `\\u00e9`, a literal backslash, so refuse rather than change meaning
                if (code[match.index - 1] === '\\') {
                    throw new Error(
                        `ascii-only: escaped non-ASCII character at offset ${match.index}`
                    );
                }
                const hex = match[0]
                    .charCodeAt(0)
                    .toString(16)
                    .padStart(4, '0');
                s.overwrite(match.index, match.index + 1, `\\u${hex}`);
            }
            return { code: s.toString(), map: s.generateMap({ hires: true }) };
        },
    };
}
