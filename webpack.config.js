var webpack = require("webpack");

module.exports = {

  entry: "./mparticle.js",
  output: {
    path: "./",
    filename: "mparticle.min.js"
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: true})
  ]
};
