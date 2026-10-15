import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import ts from 'typescript';

const SRC_DIR = join(__dirname, '../../src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

// True when `node` is written by `=` or a for-of/for-in head, directly or nested in a larger target.
function isAssignmentTarget(node: ts.Node): boolean {
  const parent = node.parent;
  if (ts.isArrayLiteralExpression(parent) || ts.isSpreadElement(parent)) return isAssignmentTarget(parent);
  if (ts.isPropertyAssignment(parent)) return isAssignmentTarget(parent.parent);
  if (ts.isBinaryExpression(parent)) {
    return parent.left === node && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
  }
  if (ts.isForOfStatement(parent) || ts.isForInStatement(parent)) {
    return parent.initializer === node;
  }
  return false;
}

function computedDestructuringKeys(fileName: string, text: string): string[] {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isComputedPropertyName(node)) {
      const element = node.parent;
      const form = ts.isBindingElement(element)
        ? 'destructuring binding'
        : ts.isPropertyAssignment(element) && isAssignmentTarget(element.parent)
          ? 'destructuring assignment'
          : undefined;
      if (form) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart());
        found.push(`${fileName}:${line + 1} ${form}: ${element.getText()}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const FLAGGED: [string, string, string][] = [
  ['destructuring binding', 'variable declaration', 'const { [K]: x, ...rest } = obj;'],
  ['destructuring binding', 'function parameter', 'function f({ [K]: x }) {}'],
  ['destructuring binding', 'arrow parameter', 'const f = ({ [K]: x }) => x;'],
  ['destructuring binding', 'method parameter', 'class C { m({ [K]: x }) {} }'],
  ['destructuring binding', 'catch clause', 'try {} catch ({ [K]: x }) {}'],
  ['destructuring binding', 'for-of head', 'for (const { [K]: x } of list) {}'],
  ['destructuring binding', 'for-in head', 'for (const { [K]: x } in obj) {}'],
  ['destructuring binding', 'nested in an array pattern', 'const [{ [K]: x }] = list;'],
  ['destructuring binding', 'nested in an object pattern with a default', 'const { a: { [K]: x } = {} } = obj;'],
  ['destructuring assignment', 'parenthesized statement', '({ [K]: y, ...rest } = obj);'],
  ['destructuring assignment', 'nested in an array target', '[{ [K]: y }] = list;'],
  ['destructuring assignment', 'after a rest element', '[...{ [K]: y }] = list;'],
  ['destructuring assignment', 'nested in an object target', '({ a: { [K]: y } } = obj);'],
  ['destructuring assignment', 'nested target with a default', '[{ [K]: y } = {}] = list;'],
  ['destructuring assignment', 'compound nesting', '[a, { b: [{ [K]: y }] }] = list;'],
  ['destructuring assignment', 'for-of head', 'for ({ [K]: y } of list) {}'],
  ['destructuring assignment', 'for-in head', 'for ({ [K]: y } in obj) {}'],
  ['destructuring assignment', 'chained assignment', 'x = { [K]: y } = obj;'],
  ['destructuring assignment', 'arrow body', 'const f = () => ({ [K]: y } = obj);'],
];

const ALLOWED: [string, string][] = [
  ['a computed key in an object literal value', 'const o = { [K]: v };'],
  ['a computed key in a call argument', 'fn({ [K]: v });'],
  ['a computed key on the right of an assignment', 'o = { [K]: v };'],
  ['a computed key in a parenthesized value', 'o = ({ [K]: v });'],
  ['a computed key on the left of another operator', 'const b = { [K]: v } instanceof C;'],
  ['a computed key in the value being destructured', '({ a: y } = { [K]: v });'],
  ['a computed key in a property default inside an assignment target', '({ a: y = { [K]: v } } = obj);'],
  ['a computed key in an array target default', '[y = { [K]: v }] = list;'],
  ['a computed key in a for-of iterable', 'for (const x of [{ [K]: v }]) {}'],
  ['a computed key in a spread array value', 'const l = [...{ [K]: v }.items];'],
  ['computed class member names', 'class C { [K] = 1; [K]() {} }'],
  ['a computed object literal method name', 'const o = { [K]() {} };'],
  ['a computed key in a type literal', 'type T = { [K]: string };'],
  ['a binding without computed keys', 'const { a: x, ...rest } = obj;'],
  ['an assignment without computed keys', '({ a: y, ...rest } = obj);'],
  ['a nested assignment without computed keys', '[{ a: y }] = list;'],
  ['string and numeric keys in patterns', "const { 'a-b': x, 0: z } = obj; ({ 'a-b': y, 0: w } = obj);"],
];

describe('minifier-safe syntax', () => {
  it('has no computed property keys in destructuring patterns', () => {
    const files = sourceFiles(SRC_DIR);
    expect(files.length).toBeGreaterThan(0);
    expect(
      files.flatMap((path) => computedDestructuringKeys(relative(SRC_DIR, path), readFileSync(path, 'utf8'))),
    ).toEqual([]);
  });

  it.each(FLAGGED)('flags a %s (%s)', (form, _position, code) => {
    expect(computedDestructuringKeys('probe.ts', code)).toEqual([expect.stringContaining(`probe.ts:1 ${form}: `)]);
  });

  it.each(ALLOWED)('allows %s', (_description, code) => {
    expect(computedDestructuringKeys('probe.ts', code)).toEqual([]);
  });

  it('names the file, line, form and element in each finding', () => {
    const code = 'const o = { [K]: v };\n\nconst { [K]: x } = obj;\n({ a: { [K]: y = 1 } } = obj);';
    expect(computedDestructuringKeys('dir/probe.ts', code)).toEqual([
      'dir/probe.ts:3 destructuring binding: [K]: x',
      'dir/probe.ts:4 destructuring assignment: [K]: y = 1',
    ]);
  });
});
