module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    // The built mParticle.js file needs to exist for integration tests
    setupFiles: ['./dist/mparticle.js'],
    setupFilesAfterEnv: ['jest-expect-message'],
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
