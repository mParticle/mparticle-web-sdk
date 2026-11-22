import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Optional SDK modules each live in one folder under src/, so a build can leave
// a module out of the core. This spec fails when a new value import crosses the
// line between core and a module folder, in either direction. Type-only imports
// are erased by the compiler and never count.

const SRC = path.join(__dirname, '../../src');

// Add a folder here when another module gets one.
const MODULE_FOLDERS = ['buttonTracking'];

// The full SDK registers each module from its entry point, through the module's
// own `<name>Module.ts` file.
const FULL_SDK_ENTRY = 'mparticle-instance-manager.ts';
const isModuleFile = (file: string): boolean => /^[^/]+\/[^/]+Module\.ts$/.test(file);

// Core imports that still reach into a module folder. Each one keeps module code
// in a core build that leaves the module out.
const CORE_INTO_MODULE: Record<string, string[]> = {
    'mp-instance.ts -> buttonTracking/buttonTracker.ts': ['ButtonTracker', 'resetButtonTracking'],
    'mp-instance.ts -> buttonTracking/buttonClickEvent.ts': ['getButtonClickBlocker'],
};

// The core files each module reads values from. A module build has to share
// these with the core or carry its own copy.
const MODULE_READS_FROM_CORE: Record<string, string[]> = {
    buttonTracking: ['forwarder-utils.ts', 'kitFilterHelper.ts', 'pathMasking.ts', 'types.ts', 'utils.ts'],
};

interface ValueImport {
    from: string;
    to: string;
    names: string[];
}

const listSourceFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return listSourceFiles(full);
        }
        return /\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
    });

const resolveImport = (fromFile: string, specifier: string): string | null => {
    if (!specifier.startsWith('.')) {
        return null;
    }
    const base = path.resolve(path.dirname(fromFile), specifier.replace(/\.js$/, ''));
    const candidates = [base + '.ts', base + '.js', path.join(base, 'index.ts')];
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    return found ? path.relative(SRC, found).split(path.sep).join('/') : null;
};

const isTypePosition = (node: ts.Node): boolean => {
    for (let current = node.parent; current; current = current.parent) {
        if (
            ts.isTypeNode(current) ||
            ts.isInterfaceDeclaration(current) ||
            ts.isTypeAliasDeclaration(current) ||
            (ts.isHeritageClause(current) && current.token === ts.SyntaxKind.ImplementsKeyword)
        ) {
            return true;
        }
    }
    return false;
};

// The names a file uses as values. An import used only as a type is erased.
const valueIdentifiers = (sourceFile: ts.SourceFile): Set<string> => {
    const used = new Set<string>();
    const visit = (node: ts.Node): void => {
        if (ts.isImportDeclaration(node)) {
            return;
        }
        if (ts.isIdentifier(node)) {
            const parent = node.parent;
            const isMemberName =
                (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
                (ts.isPropertyAssignment(parent) && parent.name === node) ||
                (ts.isMethodDeclaration(parent) && parent.name === node) ||
                (ts.isPropertyDeclaration(parent) && parent.name === node);
            if (!isMemberName && !isTypePosition(node)) {
                used.add(node.text);
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return used;
};

const collectValueImports = (): ValueImport[] =>
    listSourceFiles(SRC).flatMap((file) => {
        const sourceFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
        const usedAsValue = valueIdentifiers(sourceFile);
        const from = path.relative(SRC, file).split(path.sep).join('/');
        const imports: ValueImport[] = [];
        sourceFile.statements.forEach((statement) => {
            let specifier: ts.Expression | undefined;
            let names: string[] = [];
            if (ts.isImportDeclaration(statement)) {
                specifier = statement.moduleSpecifier;
                const clause = statement.importClause;
                if (!clause) {
                    names = ['(side effect)'];
                } else if (!clause.isTypeOnly) {
                    if (clause.name) {
                        names.push(clause.name.text);
                    }
                    const bindings = clause.namedBindings;
                    if (bindings && ts.isNamespaceImport(bindings)) {
                        names.push(bindings.name.text);
                    } else if (bindings && ts.isNamedImports(bindings)) {
                        bindings.elements.filter((element) => !element.isTypeOnly).forEach((element) => names.push(element.name.text));
                    }
                    names = names.filter((name) => usedAsValue.has(name));
                }
            } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && !statement.isTypeOnly) {
                specifier = statement.moduleSpecifier;
                names = ['(re-export)'];
            }
            if (!specifier || !ts.isStringLiteral(specifier) || names.length === 0) {
                return;
            }
            const to = resolveImport(file, specifier.text);
            if (to) {
                imports.push({ from, to, names });
            }
        });
        return imports;
    });

const moduleOf = (file: string): string | undefined => MODULE_FOLDERS.find((folder) => file.startsWith(folder + '/'));

describe('module boundaries', () => {
    const valueImports = collectValueImports();

    it('finds the files and imports it checks', () => {
        MODULE_FOLDERS.forEach((folder) => {
            expect(fs.existsSync(path.join(SRC, folder))).toBe(true);
        });
        expect(valueImports.some(({ from, to }) => moduleOf(from) && !moduleOf(to))).toBe(true);
    });

    it('lets core reach into a module folder only through the listed imports', () => {
        const unlisted = valueImports
            .filter(({ from, to }) => !moduleOf(from) && moduleOf(to))
            .filter(({ from, to }) => !(from === FULL_SDK_ENTRY && isModuleFile(to)))
            .flatMap(({ from, to, names }) => {
                const allowed = CORE_INTO_MODULE[`${from} -> ${to}`] || [];
                return names.filter((name) => !allowed.includes(name)).map((name) => `${from} -> ${to}: ${name}`);
            });
        expect(unlisted, 'Core code now imports module code, so a core build without the module would still carry it. Reach the module through the module registry instead.').toEqual([]);
    });

    it('lets each module read values only from the core files listed for it', () => {
        const unlisted = valueImports
            .filter(({ from }) => moduleOf(from))
            .filter(({ from, to }) => moduleOf(to) !== moduleOf(from))
            .filter(({ from, to }) => moduleOf(to) || !MODULE_READS_FROM_CORE[moduleOf(from)].includes(to))
            .map(({ from, to, names }) => `${from} -> ${to}: ${names.join(', ')}`);
        expect(unlisted, 'A module now reads a core file its build does not share or copy yet. Add the file to MODULE_READS_FROM_CORE once the module build accounts for it, or import a type only.').toEqual([]);
    });
});
