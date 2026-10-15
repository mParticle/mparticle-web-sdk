import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import ts from 'typescript';

const SRC_DIR = join(__dirname, '../../src');

const COMPUTED_BINDING = 'computed key in a destructuring binding';
const COMPUTED_ASSIGNMENT = 'computed key in a destructuring assignment';
const DEFAULT_BINDING = 'default in a destructuring binding';
const DEFAULT_ASSIGNMENT = 'default in a destructuring assignment';
const FOR_OF_HEAD = 'destructuring assignment in a for-of head';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

function isEqualsAssignment(node: ts.Node): node is ts.BinaryExpression {
  return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken;
}

// True when `node` is written by `=` or a for-of/for-in head, directly or nested in a larger target.
function isAssignmentTarget(node: ts.Node): boolean {
  const parent = node.parent;
  if (ts.isArrayLiteralExpression(parent) || ts.isSpreadElement(parent)) return isAssignmentTarget(parent);
  if (ts.isPropertyAssignment(parent)) return isAssignmentTarget(parent.parent);
  if (isEqualsAssignment(parent)) return parent.left === node;
  if (ts.isForOfStatement(parent) || ts.isForInStatement(parent)) {
    return parent.initializer === node;
  }
  return false;
}

// Lists the destructuring shapes NUglify, the CDN's minifier, renames or rewrites wrongly.
function unsafeDestructuring(fileName: string, text: string): string[] {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const report = (form: string, node: ts.Node): void => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    found.push(`${fileName}:${line + 1} ${form}: ${node.getText()}`);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isComputedPropertyName(node)) {
      if (ts.isBindingElement(node.parent)) report(COMPUTED_BINDING, node.parent);
      else if (ts.isPropertyAssignment(node.parent) && isAssignmentTarget(node.parent.parent)) {
        report(COMPUTED_ASSIGNMENT, node.parent);
      }
    } else if (ts.isBindingElement(node) && node.initializer) {
      report(DEFAULT_BINDING, node);
    } else if (ts.isShorthandPropertyAssignment(node) && node.objectAssignmentInitializer) {
      report(DEFAULT_ASSIGNMENT, node);
    } else if (isEqualsAssignment(node) && isAssignmentTarget(node)) {
      // An `=` that sits inside a destructuring target is a default, as in `[y = 5] = list`.
      report(DEFAULT_ASSIGNMENT, node);
    } else if (ts.isForOfStatement(node)) {
      const head = node.initializer;
      if (ts.isObjectLiteralExpression(head) || ts.isArrayLiteralExpression(head)) report(FOR_OF_HEAD, head);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const FLAGGED: [string, string, ...string[]][] = [
  ['a computed key in a variable declaration', 'const { [K]: x, ...rest } = obj;', COMPUTED_BINDING],
  ['a computed key in a function parameter', 'function f({ [K]: x }) {}', COMPUTED_BINDING],
  ['a computed key in an arrow parameter', 'const f = ({ [K]: x }) => x;', COMPUTED_BINDING],
  ['a computed key in a method parameter', 'class C { m({ [K]: x }) {} }', COMPUTED_BINDING],
  ['a computed key in a catch clause', 'try {} catch ({ [K]: x }) {}', COMPUTED_BINDING],
  ['a computed key in a for-of declaration', 'for (const { [K]: x } of list) {}', COMPUTED_BINDING],
  ['a computed key in a for-in declaration', 'for (const { [K]: x } in obj) {}', COMPUTED_BINDING],
  ['a computed key nested in an array binding', 'const [{ [K]: x }] = list;', COMPUTED_BINDING],
  ['a computed key nested in an object binding', 'const { a: { [K]: x } } = obj;', COMPUTED_BINDING],
  ['a computed key in a parenthesized assignment', '({ [K]: y, ...rest } = obj);', COMPUTED_ASSIGNMENT],
  ['a computed key nested in an array target', '[{ [K]: y }] = list;', COMPUTED_ASSIGNMENT],
  ['a computed key after a rest element', '[...{ [K]: y }] = list;', COMPUTED_ASSIGNMENT],
  ['a computed key nested in an object target', '({ a: { [K]: y } } = obj);', COMPUTED_ASSIGNMENT],
  ['a computed key in compound nesting', '[a, { b: [{ [K]: y }] }] = list;', COMPUTED_ASSIGNMENT],
  ['a computed key in a for-in assignment head', 'for ({ [K]: y } in obj) {}', COMPUTED_ASSIGNMENT],
  ['a computed key in a chained assignment', 'x = { [K]: y } = obj;', COMPUTED_ASSIGNMENT],
  ['a computed key in an arrow body assignment', 'const f = () => ({ [K]: y } = obj);', COMPUTED_ASSIGNMENT],
  ['a computed key in a for-of assignment head', 'for ({ [K]: y } of list) {}', FOR_OF_HEAD, COMPUTED_ASSIGNMENT],
  ['a default in a variable declaration', 'const { x = A } = obj;', DEFAULT_BINDING],
  ['a renamed default in a variable declaration', 'const { a: x = 5 } = obj;', DEFAULT_BINDING],
  ['a default in an array binding', 'const [, x = A] = list;', DEFAULT_BINDING],
  ['a default holding a computed key', 'const { x = { [K]: 1 } } = obj;', DEFAULT_BINDING],
  ['a default on a nested binding', 'const { a: { x } = {} } = obj;', DEFAULT_BINDING],
  ['a default in an arrow parameter pattern', 'const f = ({ x = A }) => x;', DEFAULT_BINDING],
  ['a renamed default in an arrow parameter pattern', 'const f = ({ a: q = 5 }) => q;', DEFAULT_BINDING],
  ['a default in an array parameter pattern', 'const f = ([q = 5]) => q;', DEFAULT_BINDING],
  ['a default in a function parameter pattern', 'function f({ x = A }) {}', DEFAULT_BINDING],
  ['a default in a catch clause', 'try {} catch ({ x = A }) {}', DEFAULT_BINDING],
  ['a default in a for-of declaration', 'for (const { x = A } of list) {}', DEFAULT_BINDING],
  ['a shorthand default in an assignment', '({ a = 5 } = obj);', DEFAULT_ASSIGNMENT],
  ['a renamed default in an assignment', '({ a: y = 5 } = obj);', DEFAULT_ASSIGNMENT],
  ['a default in an array target', '[y = 5] = list;', DEFAULT_ASSIGNMENT],
  ['a defaulted nested array target', '[{ a: y } = {}] = list;', DEFAULT_ASSIGNMENT],
  ['a defaulted nested object target', '({ b: { k: y } = {} } = obj);', DEFAULT_ASSIGNMENT],
  ['a default in a for-in assignment head', 'for ({ length: y = 0 } in obj) {}', DEFAULT_ASSIGNMENT],
  ['an object pattern in a for-of assignment head', 'for ({ a: y } of list) {}', FOR_OF_HEAD],
  ['an array pattern in a for-of assignment head', 'for ([y] of list) {}', FOR_OF_HEAD],
];

const ALLOWED: [string, string][] = [
  ['a computed key in an object literal value', 'const o = { [K]: v };'],
  ['a computed key in a call argument', 'fn({ [K]: v });'],
  ['a computed key on the right of an assignment', 'o = { [K]: v };'],
  ['a computed key in a parenthesized value', 'o = ({ [K]: v });'],
  ['a computed key on the left of another operator', 'const b = { [K]: v } instanceof C;'],
  ['a computed key in the value being destructured', '({ a: y } = { [K]: v });'],
  ['a computed key in a for-of iterable', 'for (const x of [{ [K]: v }]) {}'],
  ['a computed key in a spread array value', 'const l = [...{ [K]: v }.items];'],
  ['computed class member names', 'class C { [K] = 1; [K]() {} }'],
  ['a computed object literal method name', 'const o = { [K]() {} };'],
  ['a computed key in a type literal', 'type T = { [K]: string };'],
  ['a plain parameter default', 'function f(a = A) {} const g = (b = A) => b;'],
  ['a default for a whole parameter pattern', 'const f = ({ a } = A) => a; function g([b] = [A]) {}'],
  ['an assignment inside an object or array value', 'o = { a: y = 5 }; const l = [x = 5];'],
  ['an assignment inside an element access target', '[o[i = 0]] = list;'],
  ['a chained destructuring assignment', 'x = [a] = list;'],
  ['a binding without computed keys or defaults', 'const { a: x, ...rest } = obj;'],
  ['an assignment without computed keys or defaults', '({ a, b: y, ...rest } = obj);'],
  ['a nested assignment without computed keys or defaults', '[{ a: y }] = list;'],
  ['string and numeric keys in patterns', "const { 'a-b': x, 0: z } = obj; ({ 'a-b': y, 0: w } = obj);"],
  ['a plain variable in a for-of head', 'for (y of list) {}'],
  ['patterns in for-of declarations', 'for (const { a: x } of list) {} for (const [k, v] of entries) {}'],
  ['patterns in for-in assignment heads', 'for ({ length: y } in obj) {} for ([y] in obj) {}'],
];

describe('minifier-safe syntax', () => {
  it('has no destructuring shapes the CDN minifier mishandles', () => {
    const files = sourceFiles(SRC_DIR);
    expect(files.length).toBeGreaterThan(0);
    expect(files.flatMap((path) => unsafeDestructuring(relative(SRC_DIR, path), readFileSync(path, 'utf8')))).toEqual(
      [],
    );
  });

  it.each(FLAGGED)('flags %s', (_description, code, ...forms) => {
    const found = unsafeDestructuring('probe.ts', code).map((finding) =>
      finding.replace(/^probe\.ts:1 (.+?): .*$/, '$1'),
    );
    expect(found).toEqual(forms);
  });

  it.each(ALLOWED)('allows %s', (_description, code) => {
    expect(unsafeDestructuring('probe.ts', code)).toEqual([]);
  });

  it('names the file, line, form and element in each finding', () => {
    const code =
      'const o = { [K]: v };\nconst { [K]: x, w = 2 } = obj;\n({ a: { [K]: y = 1 } } = obj);\nfor ([z] of list) {}';
    expect(unsafeDestructuring('dir/probe.ts', code)).toEqual([
      `dir/probe.ts:2 ${COMPUTED_BINDING}: [K]: x`,
      `dir/probe.ts:2 ${DEFAULT_BINDING}: w = 2`,
      `dir/probe.ts:3 ${COMPUTED_ASSIGNMENT}: [K]: y = 1`,
      `dir/probe.ts:3 ${DEFAULT_ASSIGNMENT}: y = 1`,
      `dir/probe.ts:4 ${FOR_OF_HEAD}: [z]`,
    ]);
  });
});
