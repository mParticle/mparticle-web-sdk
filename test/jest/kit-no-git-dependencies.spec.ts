import * as fs from 'fs';
import * as path from 'path';

const repositoryRoot = path.join(__dirname, '../..');

interface KitMatrixEntry {
    name: string;
    local_path: string;
}

interface NpaResult {
    type?: string;
    hosted?: unknown;
    subSpec?: NpaResult;
}

interface NpaModule {
    (arg: string, where?: string): NpaResult;
    resolve: (name: string, spec: string, where?: string) => NpaResult;
}

const NPM_PACKAGE_ARG_SEARCH_PATHS = [
    path.join(
        repositoryRoot,
        'node_modules/semantic-release/node_modules/npm/node_modules'
    ),
    path.join(repositoryRoot, 'node_modules/npm/node_modules'),
    path.join(repositoryRoot, 'node_modules'),
];

function loadNpmPackageArg(): NpaModule | null {
    for (const searchPath of NPM_PACKAGE_ARG_SEARCH_PATHS) {
        try {
            const resolvedPath = require.resolve('npm-package-arg', {
                paths: [searchPath],
            });
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const candidate = require(resolvedPath) as NpaModule;
            if (
                typeof candidate?.resolve === 'function' &&
                candidate.resolve('dep', 'github:owner/repo')?.type === 'git'
            ) {
                return candidate;
            }
        } catch {
            // Try next candidate path.
        }
    }
    return null;
}

const loadedNpa = loadNpmPackageArg();
let npa: NpaModule | null = loadedNpa;

const EXPLICIT_GIT_SCHEME_PATTERN =
    /^(?:(?:git(?:\+(?:https?|ssh|file|ftp|rsync))?|ssh):\/\/|git\+(?:file|https?|ssh):|(?:github|gitlab|bitbucket|gist):)/i;
const HTTPS_DOT_GIT_PATTERN = /^https?:\/\/[^?#\s]+\.git(?:[#?].*)?$/i;
const HTTP_OR_HTTPS_URL_PATTERN = /^https?:\/\//i;
const HOSTED_GIT_HTTPS_REPO_PATTERN =
    /^https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org)\/[^/#?\s]+\/[^/#?\s]+(?:\.git)?(?:[#?].*)?$/i;
const SCP_GIT_SPEC_PATTERN =
    /^(?:[^@/\s]+@)?[a-z0-9.-]+\.[a-z]{2,}:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:#.*)?$/i;
const PROTOCOL_RELATIVE_URL_PATTERN = /^\/\//;
const RELATIVE_OR_LOCAL_PATH_PATTERN = /^(?:\.\.?(?:\/|\\)|\/(?!\/)|~\/)/;
const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const BARE_GITHUB_SHORTHAND_PATTERN =
    /^(?!\.\.?(?:\/|$))[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:#.*)?$/;
// Lockfile resolved entries must point to tarballs on registry.npmjs.org.
// Allow http://registry.npmjs.org/ alongside https://registry.npmjs.org/ because
// kits/adobe/HeartbeatKit/package-lock.json (33 entries) and
// kits/optimizely/package-lock.json (7 entries) on main record legacy http://
// registry tarball URLs.
const NPM_REGISTRY_RESOLVED_URL_PATTERN =
    /^https?:\/\/registry\.npmjs\.org\/[^?#\s]+\.tgz(?:[#?].*)?$/i;

function normalizeSpecCandidate(rawSpec: string, pkgName?: string): string {
    const trimmed = rawSpec.trim();
    if (!trimmed) {
        return '';
    }
    if (pkgName && trimmed.startsWith(`${pkgName}@`)) {
        return trimmed.slice(pkgName.length + 1).trim();
    }
    const npmAliasMatch = /^npm:(?:@[^/]+\/[^@]+|[^@]+)@(.+)$/i.exec(trimmed);
    if (npmAliasMatch) {
        return npmAliasMatch[1].trim();
    }
    const namedFromMatch =
        /^(?:@[^/\s:]+\/[^@\s:]+|[A-Za-z0-9_.-]+)@(.+)$/.exec(trimmed);
    if (namedFromMatch && !SCP_GIT_SPEC_PATTERN.test(trimmed)) {
        return namedFromMatch[1].trim();
    }
    return trimmed;
}

function isDisallowedDependencySpec(
    rawSpec: string,
    pkgName = 'dep'
): boolean {
    if (typeof rawSpec !== 'string') {
        return false;
    }
    const spec = normalizeSpecCandidate(rawSpec, pkgName);
    if (!spec) {
        return false;
    }

    if (npa) {
        try {
            const parsed = npa.resolve('dep', spec);
            const effective =
                parsed?.type === 'alias' && parsed.subSpec
                    ? parsed.subSpec
                    : parsed;
            if (
                effective?.type === 'git' ||
                effective?.type === 'remote' ||
                Boolean(effective?.hosted)
            ) {
                return true;
            }
            if (
                effective?.type === 'range' ||
                effective?.type === 'version' ||
                effective?.type === 'tag'
            ) {
                return false;
            }
        } catch {
            // Fall through to protocol/URL checks when npm-package-arg rejects the syntax.
        }
    }

    if (
        EXPLICIT_GIT_SCHEME_PATTERN.test(spec) ||
        HTTPS_DOT_GIT_PATTERN.test(spec) ||
        HTTP_OR_HTTPS_URL_PATTERN.test(spec) ||
        PROTOCOL_RELATIVE_URL_PATTERN.test(spec) ||
        HOSTED_GIT_HTTPS_REPO_PATTERN.test(spec) ||
        SCP_GIT_SPEC_PATTERN.test(spec)
    ) {
        return true;
    }

    if (
        !npa &&
        !RELATIVE_OR_LOCAL_PATH_PATTERN.test(spec) &&
        BARE_GITHUB_SHORTHAND_PATTERN.test(spec)
    ) {
        return true;
    }

    return false;
}

function isNpmRegistryResolvedUrl(rawResolved: string): boolean {
    if (typeof rawResolved !== 'string') {
        return false;
    }
    const trimmed = rawResolved.trim();
    if (
        !NPM_REGISTRY_RESOLVED_URL_PATTERN.test(trimmed) ||
        HTTPS_DOT_GIT_PATTERN.test(trimmed)
    ) {
        return false;
    }
    try {
        const parsed = new URL(trimmed);
        return (
            (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
            parsed.hostname.toLowerCase() === 'registry.npmjs.org' &&
            parsed.port === '' &&
            parsed.username === '' &&
            parsed.password === '' &&
            parsed.pathname.length > 1
        );
    } catch {
        return false;
    }
}

function isLocalOrRelativeLockfileResolved(rawResolved: string): boolean {
    if (typeof rawResolved !== 'string') {
        return false;
    }
    const trimmed = rawResolved.trim();
    if (!trimmed || PROTOCOL_RELATIVE_URL_PATTERN.test(trimmed)) {
        return false;
    }
    if (
        /^file:/i.test(trimmed) ||
        RELATIVE_OR_LOCAL_PATH_PATTERN.test(trimmed)
    ) {
        return true;
    }
    if (
        !URL_SCHEME_PATTERN.test(trimmed) &&
        !SCP_GIT_SPEC_PATTERN.test(trimmed)
    ) {
        return true;
    }
    return false;
}

function isAllowedLockfileResolvedUrl(rawResolved: string): boolean {
    return (
        isLocalOrRelativeLockfileResolved(rawResolved) ||
        isNpmRegistryResolvedUrl(rawResolved)
    );
}

function readJson(relativePath: string) {
    return JSON.parse(
        fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
    );
}

function collectManifestDependencies(
    manifest: Record<string, any>
): Array<[string, string, string]> {
    const entries: Array<[string, string, string]> = [];
    for (const section of [
        'dependencies',
        'devDependencies',
        'optionalDependencies',
        'peerDependencies',
    ]) {
        const deps = manifest[section];
        if (deps && typeof deps === 'object') {
            for (const [pkg, spec] of Object.entries(deps)) {
                if (typeof spec === 'string') {
                    entries.push([`${section}.${pkg}`, pkg, spec]);
                }
            }
        }
    }
    return entries;
}

function collectManifestDisallowedDependencies(
    manifest: Record<string, any>
): Array<[string, string]> {
    return collectManifestDependencies(manifest)
        .filter(([, pkg, spec]) => isDisallowedDependencySpec(spec, pkg))
        .map(([field, , spec]) => [field, spec]);
}

function walkLockfileV1Dependencies(
    depsObj: Record<string, any>,
    prefix = 'dependencies',
    hits: string[] = []
): string[] {
    for (const [pkgName, info] of Object.entries<any>(depsObj)) {
        if (!info || typeof info !== 'object') {
            continue;
        }
        const entryPath = `${prefix}[${pkgName}]`;
        if (
            typeof info.resolved === 'string' &&
            !isLocalOrRelativeLockfileResolved(info.resolved) &&
            !isNpmRegistryResolvedUrl(info.resolved)
        ) {
            hits.push(`${entryPath}.resolved=${info.resolved}`);
        }
        for (const field of ['version', 'from']) {
            const value = info[field];
            if (
                typeof value === 'string' &&
                isDisallowedDependencySpec(value, pkgName)
            ) {
                hits.push(`${entryPath}.${field}=${value}`);
            }
        }
        if (info.requires && typeof info.requires === 'object') {
            for (const [reqName, reqSpec] of Object.entries<any>(
                info.requires
            )) {
                if (
                    typeof reqSpec === 'string' &&
                    isDisallowedDependencySpec(reqSpec, reqName)
                ) {
                    hits.push(`${entryPath}.requires.${reqName}=${reqSpec}`);
                }
            }
        }
        if (info.dependencies && typeof info.dependencies === 'object') {
            walkLockfileV1Dependencies(
                info.dependencies,
                `${entryPath}.dependencies`,
                hits
            );
        }
    }
    return hits;
}

function collectLockfileDisallowedEntries(
    lockfile: Record<string, any>
): string[] {
    const hits: string[] = [];

    if (lockfile.packages && typeof lockfile.packages === 'object') {
        for (const [pkgPath, info] of Object.entries<any>(lockfile.packages)) {
            if (!info || typeof info !== 'object') {
                continue;
            }
            for (const [field, value] of collectManifestDisallowedDependencies(
                info
            )) {
                hits.push(`packages[${pkgPath}].${field}=${value}`);
            }
            if (
                typeof info.resolved === 'string' &&
                !isLocalOrRelativeLockfileResolved(info.resolved) &&
                !isNpmRegistryResolvedUrl(info.resolved)
            ) {
                hits.push(`packages[${pkgPath}].resolved=${info.resolved}`);
            }
            for (const field of ['version', 'from']) {
                const value = info[field];
                if (
                    typeof value === 'string' &&
                    isDisallowedDependencySpec(value)
                ) {
                    hits.push(`packages[${pkgPath}].${field}=${value}`);
                }
            }
        }
    }

    if (lockfile.dependencies && typeof lockfile.dependencies === 'object') {
        walkLockfileV1Dependencies(lockfile.dependencies, 'dependencies', hits);
    }

    return hits;
}

function walkKitFiles(
    dir: string,
    targetName: 'package.json' | 'package-lock.json',
    relativePrefix = 'kits'
): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist') {
            continue;
        }
        const fullPath = path.join(dir, entry.name);
        const relPath = `${relativePrefix}/${entry.name}`;
        if (entry.isDirectory()) {
            results.push(...walkKitFiles(fullPath, targetName, relPath));
        } else if (entry.isFile() && entry.name === targetName) {
            results.push(relPath);
        }
    }
    return results.sort();
}

describe('Kit manifests and lockfiles avoid git, tarball URL, and non-registry dependencies', () => {
    const matrix: KitMatrixEntry[] = readJson('kits/matrix.json');
    const kitsDir = path.join(repositoryRoot, 'kits');

    const gitSpecs = [
        'github:mparticle/mparticle-sdk-javascript',
        'gitlab:mparticle/mparticle-sdk-javascript#v1.0.0',
        'bitbucket:mparticle/mparticle-sdk-javascript',
        'gist:11081aaa281',
        'mparticle/mparticle-sdk-javascript',
        'mparticle/mparticle-sdk-javascript#6f2e1eb9d1c8ad50f8d8b037d2d70032ef455879',
        'git+file:///tmp/mparticle-sdk-javascript.git',
        'git+file:../mparticle-sdk-javascript.git',
        'git+https://github.com/mparticle/mparticle-sdk-javascript.git#c906742',
        'git+http://git.example.com/mparticle/mparticle-sdk-javascript.git',
        'git+ssh://git@github.com/mparticle/mparticle-sdk-javascript.git#c906742',
        'git://github.com/mparticle/mparticle-sdk-javascript.git',
        'ssh://git@github.com/mparticle/mparticle-sdk-javascript.git',
        'https://github.com/mparticle/mparticle-sdk-javascript.git',
        'https://git.example.com/mparticle/mparticle-sdk-javascript.git#main',
        'git@github.com:mparticle/mparticle-sdk-javascript.git',
        'npm:mparticle-sdk-javascript@github:mparticle/mparticle-sdk-javascript',
        'npm:@mparticle/web-sdk@github:mparticle/mparticle-sdk-javascript',
        'mparticle-sdk-javascript@github:mparticle/mparticle-sdk-javascript',
    ];

    const httpTarballSpecs = [
        'https://github.com/mparticle/mparticle-sdk-javascript/archive/refs/heads/main.tar.gz',
        'https://github.com/mparticle/mparticle-sdk-javascript/tarball/main',
        'https://codeload.github.com/mparticle/mparticle-sdk-javascript/tar.gz/main',
        'https://gitlab.com/mparticle/mparticle-sdk-javascript/-/archive/main/mparticle-sdk-javascript-main.tar.gz',
        'https://bitbucket.org/mparticle/mparticle-sdk-javascript/get/main.tar.gz',
        'https://example.com/packages/mparticle-sdk-javascript-1.0.0.tgz',
        'http://example.com/packages/mparticle-sdk-javascript-1.0.0.tgz',
        'https://registry.npmjs.org/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        'npm:mparticle-sdk-javascript@https://codeload.github.com/mparticle/mparticle-sdk-javascript/tar.gz/main',
        'npm:@mparticle/web-sdk@https://codeload.github.com/mparticle/mparticle-sdk-javascript/tar.gz/main',
        'mparticle-sdk-javascript@https://github.com/mparticle/mparticle-sdk-javascript/archive/refs/heads/main.tar.gz',
    ];

    const allowedSpecs = [
        '^2.25.3',
        '~1.0.0',
        '1.0.0-rc9',
        '2.x || 3.x || 4 || 5',
        'latest',
        'npm:string-width@^4.2.0',
        'npm:@mparticle/web-sdk@^2.25.3',
        'npm:@scope/pkg@~1.2.3',
        'file:../packages/AdobeClient',
        'link:../packages/AdobeClient',
        'link:./local-package',
        'workspace:*',
        'workspace:^1.0.0',
        './local-package',
        '../local-package',
        '/tmp/local-package',
    ];

    const allowedRegistryLockfileResolvedUrls = [
        'https://registry.npmjs.org/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        'https://registry.npmjs.org/@mparticle/web-kit-wrapper/-/web-kit-wrapper-1.0.0-rc9.tgz',
        'http://registry.npmjs.org/browserify-aes/-/browserify-aes-1.2.0.tgz',
        'https://REGISTRY.NPMJS.ORG/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
    ];

    const allowedLockfileResolvedUrls = [
        ...allowedRegistryLockfileResolvedUrls,
        'file:../packages/AdobeClient',
        './local-package',
        '../packages/AdobeClient',
        'packages/foo',
    ];

    const disallowedLockfileResolvedUrls = [
        'https://codeload.github.com/mparticle/mparticle-sdk-javascript/tar.gz/main',
        'https://github.com/mparticle/mparticle-sdk-javascript/archive/refs/heads/main.tar.gz',
        'https://github.com/mparticle/mparticle-sdk-javascript.git',
        'https://packages.example.com/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        'http://packages.example.com/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        '//packages.example.com/x.tgz',
        'https://registry.npmjs.org.example.com/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        'https://registry.npmjs.org@example.com/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        'https://registry.npmjs.org:443/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        'https://registry.npmjs.org:8443/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        'https://registry.npmjs.org/mparticle/mparticle-sdk-javascript.git',
        'git+https://github.com/mparticle/mparticle-sdk-javascript.git#c906742',
        'git+file:///tmp/mparticle-sdk-javascript.git',
        'git@github.com:mparticle/mparticle-sdk-javascript.git',
    ];

    it('classifies git URLs, direct http(s):// tarball URLs, git+file:, git+https:, HTTPS .git URLs, and GitHub/GitLab/Bitbucket shorthands as disallowed dependency specs', () => {
        for (const spec of [...gitSpecs, ...httpTarballSpecs]) {
            expect({
                spec,
                disallowed: isDisallowedDependencySpec(spec),
            }).toEqual({
                spec,
                disallowed: true,
            });
        }

        for (const spec of allowedSpecs) {
            expect({
                spec,
                disallowed: isDisallowedDependencySpec(spec),
            }).toEqual({
                spec,
                disallowed: false,
            });
        }
    });

    it('excludes relative and local paths while catching git and direct http(s):// tarball specs when npm-package-arg fallback mode is forced', () => {
        npa = null;
        try {
            for (const spec of [...gitSpecs, ...httpTarballSpecs]) {
                expect({
                    spec,
                    disallowed: isDisallowedDependencySpec(spec),
                }).toEqual({
                    spec,
                    disallowed: true,
                });
            }
            for (const spec of allowedSpecs) {
                expect({
                    spec,
                    disallowed: isDisallowedDependencySpec(spec),
                }).toEqual({
                    spec,
                    disallowed: false,
                });
            }
            expect(isDisallowedDependencySpec('./local-package')).toBe(false);
            expect(isDisallowedDependencySpec('../local-package')).toBe(false);
            expect(
                isDisallowedDependencySpec('../../packages/AdobeClient')
            ).toBe(false);
            expect(isDisallowedDependencySpec('/tmp/local-package')).toBe(
                false
            );
            expect(
                isDisallowedDependencySpec(
                    'local-pkg@./local-package',
                    'local-pkg'
                )
            ).toBe(false);
            expect(
                isDisallowedDependencySpec(
                    'local-pkg@../local-package',
                    'local-pkg'
                )
            ).toBe(false);
            expect(isDisallowedDependencySpec('owner/repo')).toBe(true);
        } finally {
            npa = loadedNpa;
        }
    });

    it('fails when a fixture kit manifest declares an http(s):// tarball dependency in both normal and fallback modes', () => {
        const baseKitManifest = readJson(
            'kits/google-tag-manager/package.json'
        );
        const fixtureKitManifest = {
            ...baseKitManifest,
            dependencies: {
                ...(baseKitManifest.dependencies || {}),
                'https-archive-dep':
                    'https://github.com/mparticle/mparticle-sdk-javascript/archive/refs/heads/main.tar.gz',
            },
            devDependencies: {
                ...(baseKitManifest.devDependencies || {}),
                'codeload-tarball-dep':
                    'https://codeload.github.com/mparticle/mparticle-sdk-javascript/tar.gz/main',
            },
            optionalDependencies: {
                'http-tarball-dep':
                    'http://example.com/packages/mparticle-sdk-javascript-1.0.0.tgz',
            },
            peerDependencies: {
                'local-kit-dep': 'file:../packages/AdobeClient',
                'relative-kit-dep': './local-package',
                'link-kit-dep': 'link:../packages/AdobeClient',
                'workspace-kit-dep': 'workspace:*',
                'scoped-npm-alias-dep': 'npm:@mparticle/web-sdk@^2.25.3',
            },
        };

        const expectedHits = [
            [
                'dependencies.https-archive-dep',
                'https://github.com/mparticle/mparticle-sdk-javascript/archive/refs/heads/main.tar.gz',
            ],
            [
                'devDependencies.codeload-tarball-dep',
                'https://codeload.github.com/mparticle/mparticle-sdk-javascript/tar.gz/main',
            ],
            [
                'optionalDependencies.http-tarball-dep',
                'http://example.com/packages/mparticle-sdk-javascript-1.0.0.tgz',
            ],
        ];

        expect(
            collectManifestDisallowedDependencies(fixtureKitManifest)
        ).toEqual(expectedHits);

        npa = null;
        try {
            expect(
                collectManifestDisallowedDependencies(fixtureKitManifest)
            ).toEqual(expectedHits);
        } finally {
            npa = loadedNpa;
        }
    });

    it('fails when a fixture kit lockfile resolves an entry outside registry.npmjs.org while keeping registry tarballs and local or workspace entries passing', () => {
        for (const resolvedUrl of allowedRegistryLockfileResolvedUrls) {
            expect({
                resolvedUrl,
                registryAllowed: isNpmRegistryResolvedUrl(resolvedUrl),
            }).toEqual({
                resolvedUrl,
                registryAllowed: true,
            });
        }

        for (const resolvedUrl of allowedLockfileResolvedUrls) {
            expect({
                resolvedUrl,
                allowed: isAllowedLockfileResolvedUrl(resolvedUrl),
            }).toEqual({
                resolvedUrl,
                allowed: true,
            });
        }

        for (const resolvedUrl of disallowedLockfileResolvedUrls) {
            expect({
                resolvedUrl,
                registryAllowed: isNpmRegistryResolvedUrl(resolvedUrl),
                allowed: isAllowedLockfileResolvedUrl(resolvedUrl),
            }).toEqual({
                resolvedUrl,
                registryAllowed: false,
                allowed: false,
            });
        }

        const baseKitLockfile = readJson(
            'kits/google-tag-manager/package-lock.json'
        );
        const fixturePackagesLockfile = {
            ...baseKitLockfile,
            packages: {
                ...(baseKitLockfile.packages || {}),
                '': {
                    name: '@mparticle/web-google-tag-manager-kit',
                    version: '1.0.0',
                },
                'packages/foo': {
                    name: '@mparticle/foo',
                    version: '1.0.0',
                },
                'node_modules/foo': {
                    resolved: 'packages/foo',
                    link: true,
                },
                'node_modules/adobe-client': {
                    version: '1.0.0',
                    resolved: 'file:../packages/AdobeClient',
                },
                'node_modules/relative-pkg': {
                    version: '1.0.0',
                    resolved: '../packages/AdobeClient',
                },
                'node_modules/bundled-dep': {
                    version: '1.0.0',
                    bundled: true,
                },
                'node_modules/in-bundle-dep': {
                    version: '1.0.0',
                    inBundle: true,
                },
                'node_modules/@mparticle/web-sdk': {
                    version: '2.25.3',
                    resolved:
                        'https://registry.npmjs.org/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
                },
                'node_modules/uppercase-registry-host': {
                    version: '2.25.3',
                    resolved:
                        'https://REGISTRY.NPMJS.ORG/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
                },
                'node_modules/non-registry-tarball': {
                    version: '1.0.0',
                    resolved:
                        'https://codeload.github.com/mparticle/mparticle-sdk-javascript/tar.gz/main',
                },
                'node_modules/mirror-tarball': {
                    version: '1.0.0',
                    resolved:
                        'https://packages.example.com/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
                },
                'node_modules/linked-mirror-tarball': {
                    resolved: 'https://packages.example.com/x.tgz',
                    link: true,
                },
                'node_modules/protocol-relative-tarball': {
                    version: '1.0.0',
                    resolved: '//packages.example.com/x.tgz',
                },
                'node_modules/explicit-port-tarball': {
                    version: '1.0.0',
                    resolved:
                        'https://registry.npmjs.org:443/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
                },
            },
        };

        expect(
            collectLockfileDisallowedEntries(fixturePackagesLockfile)
        ).toEqual([
            'packages[node_modules/non-registry-tarball].resolved=https://codeload.github.com/mparticle/mparticle-sdk-javascript/tar.gz/main',
            'packages[node_modules/mirror-tarball].resolved=https://packages.example.com/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
            'packages[node_modules/linked-mirror-tarball].resolved=https://packages.example.com/x.tgz',
            'packages[node_modules/protocol-relative-tarball].resolved=//packages.example.com/x.tgz',
            'packages[node_modules/explicit-port-tarball].resolved=https://registry.npmjs.org:443/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
        ]);
    });

    it('walks nested lockfile-v1 dependencies and requires entries recursively', () => {
        const syntheticLockfileV1 = {
            lockfileVersion: 1,
            dependencies: {
                'local-v1-pkg': {
                    version: 'file:../packages/AdobeClient',
                    resolved: 'file:../packages/AdobeClient',
                },
                'bundled-v1-pkg': {
                    version: '1.0.0',
                    bundled: true,
                    inBundle: true,
                },
                '@mparticle/web-kit-wrapper': {
                    version: '1.0.0-rc9',
                    resolved:
                        'https://registry.npmjs.org/@mparticle/web-kit-wrapper/-/web-kit-wrapper-1.0.0-rc9.tgz',
                    requires: {
                        express: '^4.16.4',
                        'git-req-shorthand':
                            'mparticle/mparticle-sdk-javascript#main',
                        'gitlab-req': 'gitlab:owner/repo',
                    },
                    dependencies: {
                        'nested-git-pkg': {
                            version: 'git+file:///tmp/nested-git-pkg.git',
                            from: 'bitbucket:owner/nested-git-pkg',
                            resolved:
                                'https://github.com/owner/nested-git-pkg.git',
                            requires: {
                                'deep-req':
                                    'git+https://github.com/owner/deep-req.git',
                            },
                        },
                        'nested-non-registry-tarball': {
                            version: '1.0.0',
                            resolved:
                                'https://packages.example.com/foo-1.0.0.tgz',
                        },
                    },
                },
            },
        };

        expect(collectLockfileDisallowedEntries(syntheticLockfileV1)).toEqual([
            'dependencies[@mparticle/web-kit-wrapper].requires.git-req-shorthand=mparticle/mparticle-sdk-javascript#main',
            'dependencies[@mparticle/web-kit-wrapper].requires.gitlab-req=gitlab:owner/repo',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-git-pkg].resolved=https://github.com/owner/nested-git-pkg.git',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-git-pkg].version=git+file:///tmp/nested-git-pkg.git',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-git-pkg].from=bitbucket:owner/nested-git-pkg',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-git-pkg].requires.deep-req=git+https://github.com/owner/deep-req.git',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-non-registry-tarball].resolved=https://packages.example.com/foo-1.0.0.tgz',
        ]);
    });

    it('includes Google Tag Manager in kits/matrix.json and keeps its manifest and lockfile free of disallowed dependencies', () => {
        const gtm = matrix.find(
            entry => entry.local_path === 'kits/google-tag-manager'
        );
        expect(gtm).toEqual({
            name: 'Google Tag Manager',
            local_path: 'kits/google-tag-manager',
        });

        const manifest = readJson('kits/google-tag-manager/package.json');
        expect(collectManifestDisallowedDependencies(manifest)).toEqual([]);

        const lockfile = readJson('kits/google-tag-manager/package-lock.json');
        expect(collectLockfileDisallowedEntries(lockfile)).toEqual([]);
    });

    it('keeps every kit in kits/matrix.json and every nested kit package.json under kits/ free of disallowed dependency specifiers', () => {
        const manifests = walkKitFiles(kitsDir, 'package.json');
        expect(manifests).toContain(
            'kits/adobe/packages/AdobeClient/package.json'
        );
        expect(manifests).toContain(
            'kits/google-analytics-4/packages/GA4Client/package.json'
        );

        for (const kit of matrix) {
            expect(manifests).toContain(`${kit.local_path}/package.json`);
        }

        for (const manifestPath of manifests) {
            const manifest = readJson(manifestPath);
            expect({
                file: manifestPath,
                disallowedDeps: collectManifestDisallowedDependencies(manifest),
            }).toEqual({
                file: manifestPath,
                disallowedDeps: [],
            });
        }
    });

    it('keeps every kit in kits/matrix.json and every nested kit package-lock.json under kits/ free of disallowed dependency entries', () => {
        const lockfiles = walkKitFiles(kitsDir, 'package-lock.json');
        expect(lockfiles).toContain('kits/adobe/HeartbeatKit/package-lock.json');

        for (const kit of matrix) {
            expect(lockfiles).toContain(`${kit.local_path}/package-lock.json`);
        }

        for (const lockfilePath of lockfiles) {
            const lockfile = readJson(lockfilePath);
            expect({
                file: lockfilePath,
                disallowedEntries: collectLockfileDisallowedEntries(lockfile),
            }).toEqual({
                file: lockfilePath,
                disallowedEntries: [],
            });
        }
    });
});
