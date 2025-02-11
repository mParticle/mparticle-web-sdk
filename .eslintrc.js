module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
    },
    ignorePatterns: ['node_modules', 'dist'],
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module',
        ecmaFeatures: {
            modules: true,
        },
    },
    globals: {
        mParticle: true,
        describe: true,
        assert: true,
        Should: true,
        MockHttpServer: true,
        it: true,
        sinon: true,
        const: true,
        before: true,
        beforeEach: true,
        afterEach: true,
        after: true,
        Promise: true,
    },
    extends: [
        // Recommended rules
        'eslint:recommended',

        // Turn off conflicting rules
        'prettier',
    ],
    plugins: ['@typescript-eslint', 'prettier'],
    overrides: [
        {
            files: ['*.ts'],
            parser: '@typescript-eslint/parser',
            extends: ['plugin:@typescript-eslint/recommended'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/ban-ts-ignore': 'off',
                '@typescript-eslint/ban-ts-comment': 'off',
                '@typescript-eslint/no-empty-interface': 'off',
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                '@typescript-eslint/no-this-alias': 'off',
                'require-await': 'off',
                '@typescript-eslint/no-empty-function': 'off',
            },
        },
        {
            files: ['*.js'],
            parser: '@babel/eslint-parser',

            rules: {
                'prefer-const': [
                    'error',
                    {
                        destructuring: 'any',
                        ignoreReadBeforeAssign: false,
                    },
                ],
            },
        },
    ],
    rules: {
        'prettier/prettier': 'error',
        'no-prototype-builtins': 'off',
        'no-empty': 'warn',
        'no-unused-vars': 'warn',
        'no-useless-escape': 'off',
        'no-var': 'warn',
    },
};
