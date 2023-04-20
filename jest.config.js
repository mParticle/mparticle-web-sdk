module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    // modulePaths: ['./src/foo.test.ts', './test/src/tests-vault.ts'],

    // Ignore all legecy tests for now until all tests are migrated
    // to support JEST
    // modulePathIgnorePatterns: ['./test/*'],

    setupFilesAfterEnv: ['jest-expect-message'],
};
