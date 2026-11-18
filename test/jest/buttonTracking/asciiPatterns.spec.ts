import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// These patterns are compiled when the bundle loads. The CDN's minifier turns a JavaScript string
// escape such as 'を' back into the raw character, and a page that is not UTF-8 can then make
// the browser decode the bundle with the page's encoding, where a multi-byte character swallows
// the next byte (a `]`, `)` or quote): the RegExp throws and the SDK never loads. So their code,
// comments aside, must be ASCII: a non-ASCII character is written as a regex escape, '\\u3092' in
// a string or /·/ in a regex literal, which the minifier leaves alone.
const FILES = [
    'src/buttonTracking/checkoutIntent.ts',
    'src/buttonTracking/labelMasking.ts',
];

function nonAsciiTokens(file: string): string[] {
    const text = fs.readFileSync(path.join(__dirname, '../../..', file), 'utf8');
    const sourceFile = ts.createSourceFile(
        file,
        text,
        ts.ScriptTarget.Latest,
        true
    );
    const found: string[] = [];
    // Comments are trivia, not nodes, so only tokens that reach the bundle are visited.
    const visit = (node: ts.Node): void => {
        if (node.getChildCount(sourceFile) === 0) {
            const token = node.getText(sourceFile);
            if (/[^\x00-\x7F]/.test(token)) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(
                    node.getStart(sourceFile)
                );
                found.push(`line ${line + 1}: ${token.slice(0, 80)}`);
            }
            return;
        }
        node.getChildren(sourceFile).forEach(visit);
    };
    visit(sourceFile);
    return found;
}

describe('button tracking patterns stay ASCII', () => {
    it.each(FILES)('%s has no non-ASCII outside comments', file => {
        expect(nonAsciiTokens(file)).toEqual([]);
    });
});
