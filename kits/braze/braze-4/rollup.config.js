import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const packageVersion = process.env.npm_package_version;
if (!packageVersion) {
    throw new Error('npm_package_version is required to build the Braze kit');
}

function replacePackageVersion() {
    return replace({
        preventAssignment: true,
        'process.env.PACKAGE_VERSION': JSON.stringify(packageVersion),
    });
}

export default [
    {
        input: 'src/BrazeKit-dev.js',
        output: {
            file: 'dist/BrazeKit.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpBrazeKitV4',
            strict: false,
            inlineDynamicImports: true,
        },
        plugins: [
            replacePackageVersion(),
            resolve({
                browser: true,
            }),
            commonjs(),
        ],
    },
    {
        input: 'src/BrazeKit-dev.js',
        output: {
            file: 'dist/BrazeKit.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpBrazeKitV4',
            strict: false,
            inlineDynamicImports: true,
        },
        plugins: [
            replacePackageVersion(),
            resolve({
                browser: true,
            }),
            commonjs(),
        ],
    },
];
