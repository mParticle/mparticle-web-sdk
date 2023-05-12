module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFiles: ['./dist/mparticle.js'],
    setupFilesAfterEnv: ['jest-expect-message'],
    transform: {},
};
