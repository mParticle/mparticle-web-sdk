module.exports = {
    env: {
        browser: true,
        node: true,
    },
    parser: '@babel/eslint-parser',
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
    rules: {
        'prefer-const': [
            'error',
            {
                destructuring: 'any',
                ignoreReadBeforeAssign: false,
            },
        ],
        'no-prototype-builtins': 'off',
        'no-empty': 'warn',
        'no-unused-vars': 'warn',
        'no-useless-escape': 'off',
    },
};
