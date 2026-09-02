/* eslint-env node, es2021 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateVersion } = require('./prepare-kit-release');

const repositoryRoot = path.resolve(__dirname, '..');
const npmExecutable = path.join(
    path.dirname(process.execPath),
    process.platform === 'win32' ? 'npm.cmd' : 'npm'
);

function runGit(args) {
    execFileSync('/usr/bin/git', args, {
        cwd: repositoryRoot,
        stdio: 'inherit',
    });
}

function runNpm(args, cwd) {
    execFileSync(npmExecutable, args, {
        cwd,
        stdio: 'inherit',
    });
}

function previewKitRelease(version, distTag) {
    validateVersion(version);
    if (distTag !== 'next') {
        throw new Error(
            `V3 kit previews require npm dist-tag next, got ${distTag}`
        );
    }

    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mparticle-kit-preview-')
    );
    const worktreePath = path.join(temporaryRoot, 'repository');
    const packDirectory = path.join(temporaryRoot, 'packages');
    let worktreeCreated = false;

    try {
        runGit(['worktree', 'add', '--detach', worktreePath, 'HEAD']);
        worktreeCreated = true;
        fs.mkdirSync(packDirectory);

        const { loadReleaseInventory, prepareKitRelease } = require(path.join(
            worktreePath,
            'scripts',
            'prepare-kit-release.js'
        ));
        const { packKitArtifacts, preflightTarball } = require(path.join(
            worktreePath,
            'scripts',
            'publish-kits.js'
        ));

        prepareKitRelease(version);
        const inventory = loadReleaseInventory();

        for (const buildPath of inventory.buildPaths) {
            runNpm(['ci', '--prefix', buildPath], worktreePath);
            fs.rmSync(path.join(worktreePath, buildPath, 'dist'), {
                force: true,
                recursive: true,
            });
            runNpm(['run', 'build', '--prefix', buildPath], worktreePath);
        }

        const packageArtifacts = packKitArtifacts(
            inventory,
            version,
            packDirectory
        );
        for (const packageInfo of packageArtifacts) {
            const status = preflightTarball(packageInfo, version, distTag);
            console.log(`${packageInfo.name}: ${status}`);
        }

        console.log(
            `Previewed ${inventory.publishEntries.length} kits at ${version} with dist-tag ${distTag}`
        );
    } finally {
        try {
            if (worktreeCreated) {
                runGit(['worktree', 'remove', '--force', worktreePath]);
            }
        } finally {
            fs.rmSync(temporaryRoot, { force: true, recursive: true });
        }
    }
}

if (require.main === module) {
    try {
        previewKitRelease(process.argv[2], process.env.NPM_DIST_TAG);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = {
    previewKitRelease,
};
