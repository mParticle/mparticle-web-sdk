import MagicString from 'magic-string';

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
    return escapeNonAsciiWithMetadata(source).code;
}

function hasEscapedPrefix(source, index) {
    let backslashCount = 0;
    for (
        let cursor = index - 1;
        cursor >= 0 && source[cursor] === '\\';
        cursor--
    ) {
        backslashCount += 1;
    }

    return backslashCount % 2 === 1;
}

function escapeNonAsciiWithMetadata(source) {
    const magicString = new MagicString(source);
    let didChange = false;

    for (let startIndex = 0; startIndex < source.length; ) {
        const codePoint = source.codePointAt(startIndex);
        if (codePoint === undefined) {
            break;
        }

        const character = String.fromCodePoint(codePoint);
        if (codePoint <= 0x7f) {
            startIndex += character.length;
            continue;
        }

        if (hasEscapedPrefix(source, startIndex)) {
            const codePointHex = codePoint.toString(16).toUpperCase();
            throw new Error(
                `Cannot safely escape non-ASCII character after backslash at index ${startIndex} (U+${codePointHex}).`
            );
        }

        magicString.overwrite(
            startIndex,
            startIndex + character.length,
            escapeCodePoint(character)
        );
        didChange = true;
        startIndex += character.length;
    }

    return {
        code: didChange ? magicString.toString() : source,
        didChange,
        magicString,
    };
}

export function escapeNonAsciiPlugin() {
    return {
        name: 'escape-non-ascii-output',
        renderChunk(code, chunk) {
            const transformed = escapeNonAsciiWithMetadata(code);
            if (!transformed.didChange) {
                return null;
            }

            return {
                code: transformed.code,
                map: transformed.magicString.generateMap({
                    hires: true,
                    includeContent: true,
                    source: chunk.fileName,
                }),
            };
        },
    };
}
