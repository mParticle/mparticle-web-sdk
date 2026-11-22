import * as fs from 'fs';
import * as os from 'os';
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

// An import() whose target is not a plain string, so no check can follow it.
const UNKNOWN_TARGET = '(unknown target)';

interface RuntimeImport {
    from: string;
    to: string;
    // Exported names; '*' for a namespace import, `export *` or import().
    names: string[];
}

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

// Compiles every file under srcDir in memory with the build's tsconfig, keeping
// ES module syntax, and lists the relative imports left in the output.
const collectRuntimeImports = (srcDir: string): RuntimeImport[] => {
    const relative = (file: string): string =>
        path
            .relative(srcDir, file)
            .split(path.sep)
            .join('/');
    const resolveImport = (fromFile: string, specifier: string): string | null => {
        if (!specifier.startsWith('.')) {
            return null;
        }
        const base = path.resolve(
            path.dirname(fromFile),
            specifier.replace(/\.js$/, '')
        );
        const found = [
            base + '.ts',
            base + '.js',
            path.join(base, 'index.ts'),
        ].find(candidate => fs.existsSync(candidate));
        return found ? relative(found) : null;
    };

    const configFile = ts.readConfigFile(
        path.join(ROOT, 'tsconfig.json'),
        ts.sys.readFile
    );
    const { options } = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        ROOT
    );
    const sources = listSourceFiles(srcDir);
    const program = ts.createProgram(sources, {
        ...options,
        rootDir: srcDir,
        allowJs: true,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        noEmit: false,
        noEmitOnError: false,
        declaration: false,
        sourceMap: false,
    });

    const imports: RuntimeImport[] = [];
    sources.forEach(source => {
        let code = '';
        program.emit(program.getSourceFile(source), (fileName, text) => {
            if (/\.js$/.test(fileName)) {
                code = text;
            }
        });
        const add = (specifier: string, names: string[]): void => {
            const to = resolveImport(source, specifier);
            if (to) {
                imports.push({ from: relative(source), to, names });
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
                add((node.moduleSpecifier as ts.StringLiteral).text, names);
            } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
                const clause = node.exportClause;
                add(
                    (node.moduleSpecifier as ts.StringLiteral).text,
                    clause && ts.isNamedExports(clause)
                        ? clause.elements.map(
                              element =>
                                  (element.propertyName || element.name).text
                          )
                        : ['*']
                );
            } else if (
                ts.isCallExpression(node) &&
                node.expression.kind === ts.SyntaxKind.ImportKeyword
            ) {
                let target = node.arguments[0];
                while (target && ts.isParenthesizedExpression(target)) {
                    target = target.expression;
                }
                if (target && ts.isStringLiteralLike(target)) {
                    add(target.text, ['*']);
                } else {
                    imports.push({
                        from: relative(source),
                        to: UNKNOWN_TARGET,
                        names: ['*'],
                    });
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(
            ts.createSourceFile(source, code, ts.ScriptTarget.Latest, true)
        );
    });
    return imports;
};

const moduleOf = (file: string): string | undefined =>
    MODULE_FOLDERS.find(folder => file.startsWith(folder + '/'));

describe('module boundaries', () => {
    const runtimeImports = collectRuntimeImports(SRC);

    it('finds the files and imports it checks', () => {
        MODULE_FOLDERS.forEach(folder => {
            expect(fs.existsSync(path.join(SRC, folder))).toBe(true);
        });
        expect(
            runtimeImports.some(({ from, to }) => moduleOf(from) && !moduleOf(to))
        ).toBe(true);
    });

    it('can follow every import() in src/', () => {
        const unknown = runtimeImports
            .filter(({ to }) => to === UNKNOWN_TARGET)
            .map(({ from }) => from);
        expect(
            unknown,
            'This import() has a computed target, so this spec cannot check which side of the line it lands on. Use a string literal.'
        ).toEqual([]);
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

describe('module boundaries import reader', () => {
    const fixture: Record<string, string> = {
        'base.ts': 'export default class Base {}\n',
        'thing.ts': 'export interface IThing { a: number }\n',
        'mod/values.ts': 'export const one = 1;\nexport const two = 2;\n',
        'aliased.ts':
            "import { one as two } from './mod/values';\nexport const x = two;\n",
        'namespace.ts':
            "import * as all from './mod/values';\nexport const y = all;\n",
        'mod/extends.ts':
            "import Base from '../base';\nexport class Child extends Base {}\n",
        'mod/typeOnly.ts': [
            "import { IThing } from '../thing';",
            'export type { IThing };',
            'export function read(x: IThing) {',
            '    const IThing = 1;',
            '    return IThing;',
            '}',
            '',
        ].join('\n'),
        'mod/reexportType.ts': "export { IThing } from '../thing';\n",
        'mod/dynamic.ts': "export const load = () => import(('../base'));\n",
        'mod/computed.ts':
            "const target = '../base';\nexport const load = () => import(target);\n",
    };
    let dir: string;

    beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'module-boundaries-'));
        Object.keys(fixture).forEach(file => {
            fs.mkdirSync(path.dirname(path.join(dir, file)), {
                recursive: true,
            });
            fs.writeFileSync(path.join(dir, file), fixture[file]);
        });
    });

    afterAll(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('reports exported names, namespaces, extends and import(), and skips type-only use', () => {
        const found = collectRuntimeImports(dir)
            .map(({ from, to, names }) => `${from} -> ${to}: ${names.join(', ')}`)
            .sort();
        expect(found).toEqual([
            'aliased.ts -> mod/values.ts: one',
            `mod/computed.ts -> ${UNKNOWN_TARGET}: *`,
            'mod/dynamic.ts -> base.ts: *',
            'mod/extends.ts -> base.ts: default',
            'namespace.ts -> mod/values.ts: *',
        ]);
    });
});
