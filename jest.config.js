module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',

    setupFilesAfterEnv: ['jest-expect-message'],
};
