import { defineConfig, globalIgnores } from 'eslint/config';
import _import from 'eslint-plugin-import';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

const testGlobals = {
    ...globals.mocha,
    ...globals.jest,
    mParticle: 'readonly',
    assert: 'readonly',
    Should: 'readonly',
    MockHttpServer: 'readonly',
    sinon: 'readonly',
    should: 'readonly',
    expect: 'readonly',
};

export default defineConfig([
    globalIgnores(['**/node_modules/']),
    {
        ignores: [
            '**/node_modules/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/*.config.*',
            'snippet.min.js',
            'snippet.rokt.min.js',
            'test/lib/**',
            'test/reports/**',
            'test/integrations/**',
            'test/cross-browser-testing/**',
            'test/stub/test-stub-bundle.js',
            'test/test-bundle.js',
        ],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...testGlobals,
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            ...js.configs.recommended.rules,
            // Legacy JS still relies on these patterns; keep them off so the
            // TypeScript rule set can land without a full JS rewrite.
            'no-prototype-builtins': 'off',
            'no-empty': 'off',
            'no-useless-escape': 'off',
            'no-unexpected-multiline': 'off',
            'no-unused-vars': ['error', { caughtErrors: 'none' }],
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: compat.extends('plugin:@typescript-eslint/recommended'),
        plugins: {
            import: fixupPluginRules(_import),
            '@typescript-eslint': typescriptEslint,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...testGlobals,
            },
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            '@typescript-eslint/no-require-imports': [
                'off',
                {
                    patterns: ['**.*.config.js'],
                },
            ],
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        accessors: 'off',
                        constructors: 'no-public',
                        methods: 'explicit',
                        properties: 'explicit',
                        parameterProperties: 'off',
                    },
                },
            ],
            '@typescript-eslint/array-type': [
                'error',
                {
                    default: 'generic',
                },
            ],
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/member-ordering': [
                'warn',
                {
                    default: [
                        'public-static-field',
                        'public-instance-field',
                        'private-static-field',
                        'private-instance-field',
                        'public-constructor',
                        'private-constructor',
                        'public-instance-method',
                        'protected-instance-method',
                        'private-instance-method',
                    ],
                },
            ],
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'variable',
                    format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
                    leadingUnderscore: 'allowSingleOrDouble',
                    trailingUnderscore: 'forbid',
                },
                {
                    selector: 'interface',
                    format: ['PascalCase'],
                    custom: {
                        regex: '^I[A-Z]',
                        match: true,
                    },
                },
                {
                    selector: 'memberLike',
                    modifiers: ['private'],
                    format: ['camelCase'],
                    leadingUnderscore: 'require',
                },
            ],
            '@typescript-eslint/no-unused-vars': 'warn',
            'import/no-extraneous-dependencies': 'warn',
            'max-len': [
                'error',
                {
                    code: 200,
                    ignoreComments: true,
                    ignoreUrls: true,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                },
            ],
            'no-fallthrough': 'error',
            'one-var': ['off', 'never'],
            'quote-props': ['error', 'as-needed'],
            quotes: 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-empty-function': 'warn',
            '@typescript-eslint/no-empty-object-type': 'off',
            // Legacy callback style in this SDK aliases `this` for nested functions.
            '@typescript-eslint/no-this-alias': 'warn',
            // Public API surfaces still use `Function`; tighten later without a type break.
            '@typescript-eslint/no-unsafe-function-type': 'warn',
        },
    },
    {
        files: ['test/**/*.{js,ts}'],
        rules: {
            // Chai/Should assertions look like unused expressions.
            '@typescript-eslint/no-unused-expressions': 'off',
            'no-unused-expressions': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
            '@typescript-eslint/member-ordering': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            'max-len': 'off',
        },
    },
]);
