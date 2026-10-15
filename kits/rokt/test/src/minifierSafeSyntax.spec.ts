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

function computedBindingKeys(path: string): string[] {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isBindingElement(node) && node.propertyName && ts.isComputedPropertyName(node.propertyName)) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart());
      found.push(`${relative(SRC_DIR, path)}:${line + 1} ${node.getText()}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('minifier-safe syntax', () => {
  it('has no computed property keys in destructuring patterns', () => {
    const files = sourceFiles(SRC_DIR);
    expect(files.length).toBeGreaterThan(0);
    expect(files.flatMap(computedBindingKeys)).toEqual([]);
  });
});
