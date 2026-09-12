module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    // The built mParticle.js file needs to exist for integration tests
    setupFiles: ['./test/jest/setup.ts', './dist/mparticle.js'],
    setupFilesAfterEnv: ['jest-expect-message'],
    // Exclude kit test files that have their own test runners.
    // Adobe uses kit-level Jest; running from the root would be missing kit setup.
    // Rokt uses Vitest with .spec.ts naming, which matches Jest's default testMatch
    // and would be falsely picked up here. Other kits use Karma with tests.js
    // (no .spec suffix) so they don't need exclusion.
    testPathIgnorePatterns: ['<rootDir>/kits/adobe', '<rootDir>/kits/rokt'],
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
