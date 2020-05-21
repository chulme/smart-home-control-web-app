const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './public/javascripts/mainscript.js',
  output: {
      path: path.resolve(__dirname, 'public/dist'),
      filename: 'bundle.js',
      publicPath: '/public/dist'
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};