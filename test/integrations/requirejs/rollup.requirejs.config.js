import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const requirejs = {
    input: 'test/integrations/requirejs/test-requirejs.js',
    output: {
        file: 'test/integrations/requirejs/test-requirejs-bundle.js',
        format: 'iife',
        name: 'mpRequireJs',
    },
    plugins: [resolve(), commonjs()],
};

export default [requirejs];
