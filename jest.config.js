module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    // Ignore all legecy tests for now until all tests are migrated
    // to support JEST
    modulePathIgnorePatterns: ['./test/*'],

    setupFilesAfterEnv: ['jest-expect-message'],
};
