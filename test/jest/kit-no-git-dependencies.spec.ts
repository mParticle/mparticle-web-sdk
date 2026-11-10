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

const npa = loadNpmPackageArg();

const EXPLICIT_GIT_SCHEME_PATTERN =
    /^(?:(?:git(?:\+(?:https?|ssh|file|ftp|rsync))?|ssh):\/\/|git\+(?:file|https?|ssh):|(?:github|gitlab|bitbucket|gist):)/i;
const HTTPS_DOT_GIT_PATTERN = /^https?:\/\/[^?#\s]+\.git(?:[#?].*)?$/i;
const HOSTED_GIT_ARCHIVE_OR_RAW_PATTERN =
    /\/(?:-+\/)?(?:archive|tarball|zipball|releases\/download|raw)\//i;
const HOSTED_GIT_HTTPS_REPO_PATTERN =
    /^https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org)\/[^/#?\s]+\/[^/#?\s]+(?:\.git)?(?:[#?].*)?$/i;
const SCP_GIT_SPEC_PATTERN =
    /^(?:[^@/\s]+@)?[a-z0-9.-]+\.[a-z]{2,}:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:#.*)?$/i;
const BARE_GITHUB_SHORTHAND_PATTERN =
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:#.*)?$/;

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
    const namedFromMatch = /^(?:@[^/\s]+\/[^@\s]+|[A-Za-z0-9_.-]+)@(.+)$/.exec(
        trimmed
    );
    if (
        namedFromMatch &&
        !trimmed.includes('://') &&
        !SCP_GIT_SPEC_PATTERN.test(trimmed)
    ) {
        return namedFromMatch[1].trim();
    }
    return trimmed;
}

function isGitDependencySpec(rawSpec: string, pkgName = 'dep'): boolean {
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
            if (effective?.type === 'git' || Boolean(effective?.hosted)) {
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
        (HOSTED_GIT_HTTPS_REPO_PATTERN.test(spec) &&
            !HOSTED_GIT_ARCHIVE_OR_RAW_PATTERN.test(spec)) ||
        SCP_GIT_SPEC_PATTERN.test(spec)
    ) {
        return true;
    }

    if (!npa && BARE_GITHUB_SHORTHAND_PATTERN.test(spec)) {
        return true;
    }

    return false;
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

function collectManifestGitDependencies(
    manifest: Record<string, any>
): Array<[string, string]> {
    return collectManifestDependencies(manifest)
        .filter(([, pkg, spec]) => isGitDependencySpec(spec, pkg))
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
        for (const field of ['resolved', 'version', 'from']) {
            const value = info[field];
            if (
                typeof value === 'string' &&
                isGitDependencySpec(value, pkgName)
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
                    isGitDependencySpec(reqSpec, reqName)
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

function collectLockfileGitEntries(lockfile: Record<string, any>): string[] {
    const hits: string[] = [];

    if (lockfile.packages && typeof lockfile.packages === 'object') {
        for (const [pkgPath, info] of Object.entries<any>(lockfile.packages)) {
            if (!info || typeof info !== 'object') {
                continue;
            }
            for (const [field, value] of collectManifestGitDependencies(info)) {
                hits.push(`packages[${pkgPath}].${field}=${value}`);
            }
            for (const field of ['resolved', 'version', 'from']) {
                const value = info[field];
                if (typeof value === 'string' && isGitDependencySpec(value)) {
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

describe('Kit manifests and lockfiles avoid git dependencies that fail npm ci with EALLOWGIT', () => {
    const matrix: KitMatrixEntry[] = readJson('kits/matrix.json');
    const kitsDir = path.join(repositoryRoot, 'kits');

    it('classifies git URLs, git+file:, git+https:, HTTPS .git URLs, and GitHub/GitLab/Bitbucket shorthands as git specs', () => {
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
            'mparticle-sdk-javascript@github:mparticle/mparticle-sdk-javascript',
        ];
        for (const spec of gitSpecs) {
            expect({ spec, isGit: isGitDependencySpec(spec) }).toEqual({
                spec,
                isGit: true,
            });
        }

        const nonGitSpecs = [
            '^2.25.3',
            '~1.0.0',
            '1.0.0-rc9',
            '2.x || 3.x || 4 || 5',
            'latest',
            'https://registry.npmjs.org/@mparticle/web-sdk/-/web-sdk-2.25.3.tgz',
            'npm:string-width@^4.2.0',
            'file:../packages/AdobeClient',
            './local-package',
        ];
        for (const spec of nonGitSpecs) {
            expect({ spec, isGit: isGitDependencySpec(spec) }).toEqual({
                spec,
                isGit: false,
            });
        }
    });

    it('walks nested lockfile-v1 dependencies and requires entries recursively', () => {
        const syntheticLockfileV1 = {
            lockfileVersion: 1,
            dependencies: {
                '@mparticle/web-kit-wrapper': {
                    version: '1.0.0-rc9',
                    resolved:
                        'https://registry.npmjs.org/@mparticle/web-kit-wrapper/-/web-kit-wrapper-1.0.0-rc9.tgz',
                    requires: {
                        express: '^4.16.4',
                        'git-req-shorthand': 'mparticle/mparticle-sdk-javascript#main',
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
                    },
                },
            },
        };

        expect(collectLockfileGitEntries(syntheticLockfileV1)).toEqual([
            'dependencies[@mparticle/web-kit-wrapper].requires.git-req-shorthand=mparticle/mparticle-sdk-javascript#main',
            'dependencies[@mparticle/web-kit-wrapper].requires.gitlab-req=gitlab:owner/repo',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-git-pkg].resolved=https://github.com/owner/nested-git-pkg.git',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-git-pkg].version=git+file:///tmp/nested-git-pkg.git',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-git-pkg].from=bitbucket:owner/nested-git-pkg',
            'dependencies[@mparticle/web-kit-wrapper].dependencies[nested-git-pkg].requires.deep-req=git+https://github.com/owner/deep-req.git',
        ]);
    });

    it('includes Google Tag Manager in kits/matrix.json and keeps its manifest and lockfile free of git URLs', () => {
        const gtm = matrix.find(
            entry => entry.local_path === 'kits/google-tag-manager'
        );
        expect(gtm).toEqual({
            name: 'Google Tag Manager',
            local_path: 'kits/google-tag-manager',
        });

        const manifest = readJson('kits/google-tag-manager/package.json');
        expect(collectManifestGitDependencies(manifest)).toEqual([]);

        const lockfile = readJson('kits/google-tag-manager/package-lock.json');
        expect(collectLockfileGitEntries(lockfile)).toEqual([]);
    });

    it('keeps every kit in kits/matrix.json and every nested kit package.json under kits/ free of git dependency specifiers', () => {
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
                gitDeps: collectManifestGitDependencies(manifest),
            }).toEqual({
                file: manifestPath,
                gitDeps: [],
            });
        }
    });

    it('keeps every kit in kits/matrix.json and every nested kit package-lock.json under kits/ free of git dependency entries', () => {
        const lockfiles = walkKitFiles(kitsDir, 'package-lock.json');
        expect(lockfiles).toContain('kits/adobe/HeartbeatKit/package-lock.json');

        for (const kit of matrix) {
            expect(lockfiles).toContain(`${kit.local_path}/package-lock.json`);
        }

        for (const lockfilePath of lockfiles) {
            const lockfile = readJson(lockfilePath);
            expect({
                file: lockfilePath,
                gitEntries: collectLockfileGitEntries(lockfile),
            }).toEqual({
                file: lockfilePath,
                gitEntries: [],
            });
        }
    });
});
