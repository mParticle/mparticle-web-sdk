import * as fs from 'fs';
import * as path from 'path';

const { loadReleaseInventory } = require('../../scripts/prepare-kit-release');
const releaseConfig = require('../../release.config.js');

const repositoryRoot = path.join(__dirname, '../..');

interface ExtraFile {
    type: string;
    path: string;
    jsonpath: string;
}

function readJson(relativePath: string) {
    return JSON.parse(
        fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
    );
}

const config = readJson('release-please-config.json');
const manifest = readJson('.release-please-manifest.json');
const extraFiles: ExtraFile[] = config.packages['.']['extra-files'];

function serialize(entry: ExtraFile) {
    return `${entry.type} ${entry.path} ${entry.jsonpath}`;
}

function expectedExtraFiles(): string[] {
    const expected: string[] = [];
    for (const manifestPath of loadReleaseInventory().manifestPaths) {
        expected.push(`json ${manifestPath}/package.json $.version`);
        if (
            fs.existsSync(
                path.join(repositoryRoot, manifestPath, 'package-lock.json')
            )
        ) {
            expected.push(`json ${manifestPath}/package-lock.json $.version`);
            expected.push(
                `json ${manifestPath}/package-lock.json $.packages[''].version`
            );
        }
    }
    return expected.sort();
}

describe('Release Please config', () => {
    it('versions exactly the kit manifests and lockfiles in the release inventory', () => {
        const configured = extraFiles.map(serialize).sort();

        expect(new Set(configured).size).toBe(configured.length);
        expect(configured).toEqual(expectedExtraFiles());
    });

    it('leaves the root package.json and package-lock.json to the node strategy', () => {
        const paths = extraFiles.map(entry => entry.path);

        expect(config['release-type']).toBe('node');
        expect(paths).not.toContain('package.json');
        expect(paths).not.toContain('package-lock.json');
    });

    it('points every extra file at a version string that exists', () => {
        for (const entry of extraFiles) {
            const json = readJson(entry.path);
            const value =
                entry.jsonpath === '$.version'
                    ? json.version
                    : json.packages && json.packages['']
                    ? json.packages[''].version
                    : undefined;

            expect(typeof value).toBe('string');
        }
    });

    it('creates v-prefixed tags without a component, matching semantic-release', () => {
        expect(releaseConfig.tagFormat).toBe('v${version}');
        expect(config['include-v-in-tag']).toBe(true);
        expect(config['include-component-in-tag']).toBe(false);
    });

    it('tags on merge and leaves the GitHub Release as a draft', () => {
        expect(config.draft).toBe(true);
        expect(config['force-tag-creation']).toBe(true);
    });

    it('keeps every semantic-release releasable type visible except build', () => {
        const sections: Array<{
            type: string;
            section: string;
            hidden?: boolean;
        }> = config['changelog-sections'];
        const visibleTypes = sections
            .filter(section => !section.hidden)
            .map(section => section.type);
        const releaseRules: Array<{ type: string }> =
            releaseConfig.plugins.find(
                plugin =>
                    Array.isArray(plugin) &&
                    plugin[0] === '@semantic-release/commit-analyzer'
            )[1].releaseRules;

        for (const { type } of releaseRules) {
            if (type === 'build') {
                expect(visibleTypes).not.toContain(type);
            } else {
                expect(visibleTypes).toContain(type);
            }
        }
        expect(sections.find(section => section.type === 'build')).toEqual({
            type: 'build',
            section: 'Build System',
            hidden: true,
        });
    });

    it('groups commit types into the agreed changelog sections', () => {
        expect(config['changelog-sections']).toEqual([
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'perf', section: 'Performance Improvements' },
            { type: 'revert', section: 'Reverts' },
            { type: 'chore', section: 'Miscellaneous' },
            { type: 'ci', section: 'Miscellaneous' },
            { type: 'docs', section: 'Miscellaneous' },
            { type: 'test', section: 'Miscellaneous' },
            { type: 'refactor', section: 'Miscellaneous' },
            { type: 'style', section: 'Miscellaneous' },
            { type: 'build', section: 'Build System', hidden: true },
        ]);
    });

    it('tracks a single root package at a stable version', () => {
        expect(Object.keys(manifest)).toEqual(['.']);
        expect(manifest['.']).toMatch(/^\d+\.\d+\.\d+$/);
    });

    // Until the Release Please cutover, semantic-release cuts V3 releases, so
    // this manifest must be bumped to each new release's version; after
    // cutover Release Please updates it itself.
    it('records the latest released version from the root package.json in the manifest', () => {
        expect(manifest['.']).toBe(readJson('package.json').version);
    });
});
