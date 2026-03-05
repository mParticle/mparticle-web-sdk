export default [
    {
        input: 'src/GoogleAdWordsEventForwarder.js',
        output: {
            file: 'dist/GoogleAdWordsEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpAdWordsKit',
            strict: false
        }
    },
    {
        input: 'src/GoogleAdWordsEventForwarder.js',
        output: {
            file: 'dist/GoogleAdWordsEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpAdWordsKit',
            strict: false
        }
    }
]