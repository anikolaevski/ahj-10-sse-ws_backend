const path = require('path');

const APP_DIR = path.resolve(__dirname, './src');
const BUILD_DIR = path.resolve(__dirname, 'dist');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// eslint-disable-next-line no-unused-vars
// const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

module.exports = {
  output: {
    path: BUILD_DIR,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        include: `${APP_DIR}/js`,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.html$/i,
        use: [
          {
            loader: 'html-loader',
            options: {
              root: './src/index.html',
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              mimetype: 'image/png',
              limit: false,
              esModule: false,
            },
          },
        ],
      },
      {
        test: /\.(txt)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'licenses.txt',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './src/index.html',
      filename: './index.html',
      favicon: 'src/favicon.ico',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    // new LicenseWebpackPlugin({
    //   outputFilename: 'licenses.txt',
    //   licenseTextOverrides: {
    //     foopkg: 'License text for foopkg',
    //   },
    // }),
  ],
};
