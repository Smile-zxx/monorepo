const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');
const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/index.tsx',
  mode: 'development',
  output: {
    publicPath: 'auto',
  },
  devServer: {
    port: 3001,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      // 模块联邦应用的唯一名称，消费端应用通过此名称来定位和引用该远程应用
      name: 'remote_app',
      // 生成的远程入口文件名，消费端通过加载这个文件来获取暴露的组件
      filename: 'remoteEntry.js',
      // 定义该应用暴露给外部使用的组件或模块映射
      exposes: {
        './RemoteTable': './src/components/RemoteTable/index.tsx',
      },
      // 共享依赖配置，防止消费端和远程端重复加载相同的库
      shared: {
        ...deps,
        // React 设为单例模式，确保整个组件树中只存在一个 React 实例，避免 Hook 报错
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        // React-DOM 同样设为单例，确保渲染器一致性
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom'],
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
