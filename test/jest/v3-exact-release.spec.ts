/* eslint-env jest, node, es2021 */

const {
    auditPackages,
    preflightPackages,
    publicationPlan,
    publishPackages,
    validateProvenanceStatements,
} = require('../../scripts/release/exact-release');

function createManifest(count = 34) {
    return {
        packages: Array.from({length: count}, (_, index) => ({
            integrity: `sha512-${index}`,
            name: `@test/package-${index}`,
            tarball: `package-${index}.tgz`,
        })),
        version: '3.2.0',
    };
}

describe('v3 exact release publication API', () => {
    it('preflights every package before publication', () => {
        const manifest = createManifest();
        const specs: string[] = [];

        preflightPackages(manifest, (spec: string, field: string) => {
            specs.push(`${spec}:${field}`);
            return null;
        });

        expect(specs).toHaveLength(34);
        expect(specs[0]).toBe(
            '@test/package-0@3.2.0:dist.integrity'
        );
    });

    it('rejects any package version already consumed on npm', () => {
        const manifest = createManifest(2);
        expect(() =>
            preflightPackages(
                manifest,
                (spec: string) =>
                    spec.startsWith('@test/package-1@')
                        ? 'sha512-existing'
                        : null
            )
        ).toThrow('@test/package-1@3.2.0 already exists');
    });

    it.each([0, 1, 17, 33])(
        'recovers after %i packages without republishing existing bytes',
        publishedCount => {
            const manifest = createManifest();
            const published: string[] = [];
            const view = (spec: string) => {
                const index = Number(spec.match(/package-(\d+)@/)?.[1]);
                return index < publishedCount ? `sha512-${index}` : null;
            };

            expect(
                publicationPlan(manifest, 'recovery', view).filter(
                    (pkg: {published: boolean}) => !pkg.published
                )
            ).toHaveLength(34 - publishedCount);
            expect(
                publishPackages(
                    manifest,
                    '/artifacts',
                    'recovery',
                    view,
                    (_tarball: string, pkg: {name: string}) =>
                        published.push(pkg.name)
                )
            ).toEqual(
                manifest.packages
                    .slice(publishedCount)
                    .map((pkg: {name: string}) => pkg.name)
            );
            expect(published).toEqual(
                manifest.packages
                    .slice(publishedCount)
                    .map((pkg: {name: string}) => pkg.name)
            );
        }
    );

    it('fails recovery when any published package has different bytes', () => {
        const manifest = createManifest(3);
        expect(() =>
            publicationPlan(manifest, 'recovery', (spec: string) =>
                spec.includes('package-1') ? 'sha512-wrong' : null
            )
        ).toThrow('registry integrity does not match recorded tarball');
    });

    it('audits integrity, next, and exposed provenance identity for all 34 packages', async () => {
        const manifest = createManifest();
        const calls: string[] = [];
        const count = await auditPackages(
            manifest,
            (spec: string, field: string) => {
                calls.push(`${spec}:${field}`);
                if (field === 'dist.integrity') {
                    const index = Number(spec.match(/package-(\d+)@/)![1]);
                    return `sha512-${index}`;
                }
                if (field === 'dist-tags.next') {
                    return '3.2.0';
                }
                const index = Number(spec.match(/package-(\d+)@/)![1]);
                return {
                    provenance: {
                        predicateType: 'https://slsa.dev/provenance/v1',
                    },
                    statements: [
                        {
                            predicateType: 'https://slsa.dev/provenance/v1',
                            subject: [
                                {
                                    digest: {
                                        sha512: Buffer.from(`${index}`, 'base64')
                                            .toString('hex'),
                                    },
                                    name: `pkg:npm/%40test/package-${index}@3.2.0`,
                                },
                            ],
                            predicate: {
                                buildDefinition: {
                                    externalParameters: {
                                        workflow: {
                                            path: '/.github/workflows/staging-step-1.yml',
                                            ref: 'refs/heads/main',
                                            repository:
                                                'https://github.com/mParticle/mparticle-web-sdk',
                                        },
                                    },
                                },
                                runDetails: {
                                    builder: {
                                        id: 'https://github.com/actions/runner/github-hosted',
                                    },
                                },
                            },
                        },
                    ],
                    url: 'https://registry.npmjs.org/-/npm/v1/attestations',
                };
            }
        );

        expect(count).toBe(34);
        expect(calls).toHaveLength(102);
    });

    it('rejects provenance from the wrong top-level caller or subject', () => {
        const manifest = createManifest(1);
        const statement = {
            predicateType: 'https://slsa.dev/provenance/v1',
            subject: [
                {
                    digest: {
                        sha512: Buffer.from('0', 'base64').toString('hex'),
                    },
                    name: 'pkg:npm/%40test/package-0@3.2.0',
                },
            ],
            predicate: {
                buildDefinition: {
                    externalParameters: {
                        workflow: {
                            path: '/.github/workflows/staging-step-2.yml',
                            ref: 'refs/heads/main',
                            repository:
                                'https://github.com/mParticle/mparticle-web-sdk',
                        },
                    },
                },
                runDetails: {
                    builder: {
                        id: 'https://github.com/actions/runner/github-hosted',
                    },
                },
            },
        };
        expect(
            validateProvenanceStatements(
                manifest.packages[0],
                manifest,
                [statement]
            )
        ).toBe(false);
        statement.predicate.buildDefinition.externalParameters.workflow.path =
            '/.github/workflows/staging-step-1.yml';
        statement.subject[0].name = 'pkg:npm/%40test/wrong@3.2.0';
        expect(
            validateProvenanceStatements(
                manifest.packages[0],
                manifest,
                [statement]
            )
        ).toBe(false);
    });
});
