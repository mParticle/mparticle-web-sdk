module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    // The built mParticle.js file needs to exist for integration tests
    setupFiles: ['./test/jest/setup.ts', './dist/mparticle.js'],
    setupFilesAfterEnv: ['jest-expect-message'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/build/',
        '<rootDir>/.agents/',
        '<rootDir>/.claude/',
        // Exclude Adobe kit test files. Adobe uses Jest through its own
        // kit-level config; running it from the root skips kit setup.
        '<rootDir>/kits/adobe',
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/build/',
        '<rootDir>/.agents/',
        '<rootDir>/.claude/',
    ],
    transform: {
        '^.+\\.(js)$': 'ts-jest',
    },
    globals: {
        'ts-jest': {
            tsconfig: {
                allowJs: true,
            },
        },
    },
};
