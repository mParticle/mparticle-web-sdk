import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Optional SDK modules each live in one folder under src/, so a build can leave
// a module out of the core. This spec fails when a new runtime import crosses
// the line between core and a module folder, in either direction. It reads the
// imports the compiler keeps, so imports used only as types never count.

const ROOT = path.join(__dirname, '../..');
const SRC = path.join(ROOT, 'src');

// Add a folder here when another module gets one.
const MODULE_FOLDERS = ['buttonTracking'];

// The full SDK registers each module from its entry point, through the module's
// own `<name>Module.ts` file.
const FULL_SDK_ENTRY = 'mparticle-instance-manager.ts';
const isModuleFile = (file: string): boolean =>
    /^[^/]+\/[^/]+Module\.ts$/.test(file);

// Core imports that still reach into a module folder, by exported name. Each
// one keeps module code in a core build that leaves the module out.
const CORE_INTO_MODULE: Record<string, string[]> = {
    'mp-instance.ts -> buttonTracking/buttonTracker.ts': [
        'ButtonTracker',
        'resetButtonTracking',
    ],
    'mp-instance.ts -> buttonTracking/buttonClickEvent.ts': [
        'getButtonClickBlocker',
    ],
};

// The core files each module reads values from. A module build has to share
// these with the core or carry its own copy.
const MODULE_READS_FROM_CORE: Record<string, string[]> = {
    buttonTracking: [
        'forwarder-utils.ts',
        'kitFilterHelper.ts',
        'pathMasking.ts',
        'types.ts',
        'utils.ts',
    ],
};

interface RuntimeImport {
    from: string;
    to: string;
    // Exported names; '*' for a namespace import or `export *`.
    names: string[];
}

const toSrcPath = (file: string): string =>
    path
        .relative(SRC, file)
        .split(path.sep)
        .join('/');

const listSourceFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return listSourceFiles(full);
        }
        return /\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')
            ? [full]
            : [];
    });

const resolveImport = (fromFile: string, specifier: string): string | null => {
    if (!specifier.startsWith('.')) {
        return null;
    }
    const base = path.resolve(
        path.dirname(fromFile),
        specifier.replace(/\.js$/, '')
    );
    const found = [base + '.ts', base + '.js', path.join(base, 'index.ts')].find(
        candidate => fs.existsSync(candidate)
    );
    return found ? toSrcPath(found) : null;
};

// Compiles src/ in memory with the build's tsconfig, keeping ES module syntax,
// and returns each source file's emitted JavaScript.
const emitSources = (): Map<string, string> => {
    const configFile = ts.readConfigFile(
        path.join(ROOT, 'tsconfig.json'),
        ts.sys.readFile
    );
    const { options } = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        ROOT
    );
    const sources = listSourceFiles(SRC);
    const program = ts.createProgram(sources, {
        ...options,
        allowJs: true,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        noEmit: false,
        noEmitOnError: false,
        declaration: false,
        sourceMap: false,
    });
    const emitted = new Map<string, string>();
    sources.forEach(source => {
        const sourceFile = program.getSourceFile(source);
        program.emit(sourceFile, (fileName, text) => {
            if (/\.js$/.test(fileName)) {
                emitted.set(source, text);
            }
        });
    });
    return emitted;
};

const importsIn = (source: string, code: string): RuntimeImport[] => {
    const parsed = ts.createSourceFile(
        source,
        code,
        ts.ScriptTarget.Latest,
        true
    );
    const imports: RuntimeImport[] = [];
    const add = (specifier: ts.Node | undefined, names: string[]): void => {
        if (!specifier || !ts.isStringLiteralLike(specifier)) {
            return;
        }
        const to = resolveImport(source, specifier.text);
        if (to) {
            imports.push({ from: toSrcPath(source), to, names });
        }
    };
    const visit = (node: ts.Node): void => {
        if (ts.isImportDeclaration(node)) {
            const clause = node.importClause;
            const bindings = clause && clause.namedBindings;
            const names: string[] = [];
            if (!clause) {
                names.push('(side effect)');
            }
            if (clause && clause.name) {
                names.push('default');
            }
            if (bindings && ts.isNamespaceImport(bindings)) {
                names.push('*');
            }
            if (bindings && ts.isNamedImports(bindings)) {
                bindings.elements.forEach(element =>
                    names.push((element.propertyName || element.name).text)
                );
            }
            add(node.moduleSpecifier, names);
        } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
            const clause = node.exportClause;
            add(
                node.moduleSpecifier,
                clause && ts.isNamedExports(clause)
                    ? clause.elements.map(
                          element => (element.propertyName || element.name).text
                      )
                    : ['*']
            );
        } else if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword
        ) {
            add(node.arguments[0], ['*']);
        }
        ts.forEachChild(node, visit);
    };
    visit(parsed);
    return imports;
};

const moduleOf = (file: string): string | undefined =>
    MODULE_FOLDERS.find(folder => file.startsWith(folder + '/'));

describe('module boundaries', () => {
    const runtimeImports: RuntimeImport[] = [];
    emitSources().forEach((code, source) =>
        runtimeImports.push(...importsIn(source, code))
    );

    it('finds the files and imports it checks', () => {
        MODULE_FOLDERS.forEach(folder => {
            expect(fs.existsSync(path.join(SRC, folder))).toBe(true);
        });
        expect(
            runtimeImports.some(({ from, to }) => moduleOf(from) && !moduleOf(to))
        ).toBe(true);
    });

    it('lets core reach into a module folder only through the listed imports', () => {
        const unlisted = runtimeImports
            .filter(({ from, to }) => !moduleOf(from) && moduleOf(to))
            .filter(({ from, to }) => !(from === FULL_SDK_ENTRY && isModuleFile(to)))
            .flatMap(({ from, to, names }) => {
                const allowed = CORE_INTO_MODULE[`${from} -> ${to}`] || [];
                return names
                    .filter(name => !allowed.includes(name))
                    .map(name => `${from} -> ${to}: ${name}`);
            });
        expect(
            unlisted,
            'Core code now imports module code, so a core build without the module would still carry it. Reach the module through the module registry instead.'
        ).toEqual([]);
    });

    it('lets each module read values only from the core files listed for it', () => {
        const unlisted = runtimeImports
            .filter(({ from }) => moduleOf(from))
            .filter(({ from, to }) => moduleOf(to) !== moduleOf(from))
            .filter(
                ({ from, to }) =>
                    moduleOf(to) ||
                    !MODULE_READS_FROM_CORE[moduleOf(from)].includes(to)
            )
            .map(({ from, to, names }) => `${from} -> ${to}: ${names.join(', ')}`);
        expect(
            unlisted,
            'A module now reads a core file its build does not share or copy yet. Add the file to MODULE_READS_FROM_CORE once the module build accounts for it, or import a type only.'
        ).toEqual([]);
    });
});
