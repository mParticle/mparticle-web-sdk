module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    // The built mParticle.js file needs to exist for integration tests
    setupFiles: ['./test/jest/setup.ts', './dist/mparticle.js'],
    setupFilesAfterEnv: ['jest-expect-message'],
    // Exclude Adobe kit test files — Adobe uses Jest but via its own kit-level
    // jest.config.js; running them from the root would be missing kit setup.
    // Other kits use Karma and name their tests `tests.js` (plural), which
    // doesn't match Jest's default testMatch, so they don't need exclusion.
    testPathIgnorePatterns: ['<rootDir>/kits/adobe'],
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
