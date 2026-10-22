export default {
  // Top-level so the polyfill plugin targets the same browsers as preset-env
  "targets": "ie 11",
  "presets": ["@babel/preset-env"],
  "plugins": [
    ['polyfill-corejs3', { "method": "usage-global", "version": "3.33" }],
    '@babel/plugin-transform-runtime',
  ],
}
