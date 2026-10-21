export default {
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": "ie 11",
      },
    ]
  ],
  "plugins": [
    ['polyfill-corejs3', { "method": "usage-global", "version": "3.33" }],
    '@babel/plugin-transform-runtime',
  ],
}