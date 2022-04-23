const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
// const util = require('util')

const srcFiles = fs.readdirSync('./src')

let entries = {
  'gallery/gallery.min': './src/gallery.js',
}

// Compile vanta.xxxxx.js files
for (let i = 0; i < srcFiles.length; i++) {
  let file = srcFiles[i]
  if (file.indexOf('vanta') == 0) {
    let fileWithoutExtension = file.replace(/\.[^/.]+$/, "")
    entries['dist/' + fileWithoutExtension + '.min'] = './src/' + file
  }
}

module.exports = {
  mode: 'production',
  entry: entries,
  // watch: true,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '.'),
    library: '_vantaEffect',
    libraryTarget: 'umd',
    globalObject: 'typeof self !== \'undefined\' ? self : this',
  },
  module: {
    rules: [
      { test: /\.(glsl|frag|vert)$/, use: ['raw-loader', 'glslify-loader'], exclude: /node_modules/ },
    ],
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
  devServer: {
    // contentBase: './dist',
    // publicPath: '',
    static: {
      directory: path.join(__dirname, ''),
    },
    compress: true,
    // port: 9000
  }
}