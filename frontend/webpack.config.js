const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      main: './src/scripts/main.js',
      gameplay: './src/scripts/gameplay-enhanced.js',
      maker: './src/scripts/maker.js'
    },
    output: {
      filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    module: {
      rules: [
        // JavaScript
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        // CSS
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },
        // 이미지
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024 // 8kb 이하는 인라인 처리
            }
          },
          generator: {
            filename: 'images/[name].[hash][ext]'
          }
        },
        // 폰트
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash][ext]'
          }
        }
      ]
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction
            },
            format: {
              comments: false
            }
          },
          extractComments: false
        }),
        new CssMinimizerPlugin()
      ],
      splitChunks: {
        chunks: 'all',
        name: 'vendors',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/pages/index.html',
        filename: 'index.html',
        chunks: ['main', 'vendors']
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/GamePlay.html',
        filename: 'play.html',
        chunks: ['gameplay', 'vendors']
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/WordSearchMaker.html',
        filename: 'maker.html',
        chunks: ['maker', 'vendors']
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? 'css/[name].[contenthash].css' : 'css/[name].css'
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
      proxy: {
        '/api': 'http://localhost:8000',
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true
        }
      }
    }
  };
};