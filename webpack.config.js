var webpack = require("webpack");

module.exports = {
  entry: [
    './src/mparticle.js'
  ],
  module: {
    loaders:
    [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: true})
  ],
  resolve: {
    extensions: ['', '.js']
  },
  output: {
    path: __dirname + '/',
    publicPath: '/',
    filename: 'mparticle.min.js'
  }
};
