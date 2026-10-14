const NON_ASCII_REGEX = /[\u0080-\u{10FFFF}]/gu;

function escapeCodePoint(character) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xffff) {
        return `\\u${codePoint
            .toString(16)
            .toUpperCase()
            .padStart(4, '0')}`;
    }

    const surrogatePairValue = codePoint - 0x10000;
    const highSurrogate = 0xd800 + (surrogatePairValue >> 10);
    const lowSurrogate = 0xdc00 + (surrogatePairValue & 0x3ff);
    return `\\u${highSurrogate
        .toString(16)
        .toUpperCase()
        .padStart(4, '0')}\\u${lowSurrogate
        .toString(16)
        .toUpperCase()
        .padStart(4, '0')}`;
}

export function escapeNonAscii(source) {
    return source.replace(NON_ASCII_REGEX, escapeCodePoint);
}

export function escapeNonAsciiPlugin() {
    return {
        name: 'escape-non-ascii-output',
        renderChunk(code) {
            const escapedCode = escapeNonAscii(code);
            if (escapedCode === code) {
                return null;
            }

            return {
                code: escapedCode,
                map: null,
            };
        },
    };
}
