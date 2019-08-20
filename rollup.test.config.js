const { ENVIRONMENT } = process.env;
import resolve from 'rollup-plugin-node-resolve';

export default {
    input: 'test/src/tests-main.js',
    output: {
        file: 'test/test-bundle.js',
        format: 'iife',
        name: 'mParticleTests',
        sourcemap: ENVIRONMENT !== 'prod'
    },
    plugins: [
        resolve()
    ]
};
