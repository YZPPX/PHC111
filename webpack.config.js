const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const paths = {
    src: path.resolve(__dirname, 'src'),
    dist: path.resolve(__dirname, 'build')
};

module.exports = {
    context: paths.src,
    mode: "production",

    entry: {
        app: './index'
    },

    output: {
        path: paths.dist,
        filename: '[name].bundle.js',
        publicPath: '/PHC1/'
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        fallback: {
          fs: false,
          path: false,
          crypto: false
        }
    },

    devServer: {
      historyApiFallback: true,
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html'
        }),
        new CopyPlugin({
            patterns: [
                { from: '../node_modules/onnxruntime-web/dist/*.wasm', to: '[name][ext]' }
                // 移除 { from: './model.onnx', to: '[name][ext]' } 这一行
            ]
        })
    ],

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                          compilerOptions: {
                            noEmit: false,
                          },
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                    }
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ["file-loader"]
            }
        ]
    }
};