const { ENVIRONMENT } = process.env;

export default {
    input: 'test/src/tests-main.js',
    output: {
        file: 'test/test-bundle.js',
        format: 'iife',
        name: 'mParticleTests',
        sourcemap: ENVIRONMENT !== 'prod'
    }
};
