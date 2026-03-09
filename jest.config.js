module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    // The built mParticle.js file needs to exist for integration tests
    setupFiles: ['./test/jest/setup.ts', './dist/mparticle.js'],
    setupFilesAfterEnv: ['jest-expect-message'],
    // Exclude kit test directories — kits use karma, not jest
    testPathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/kits'],
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
