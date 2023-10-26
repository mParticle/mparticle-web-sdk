export default {
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": "3.33",
      },
    ]
  ],
  "plugins": ['@babel/plugin-transform-runtime'],
}