import path from 'node:path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import TerserPlugin from 'terser-webpack-plugin'

export default {
    mode: 'production',
    entry: {
        bundle: ['./src/js/main.js', './src/styles/main.scss']
    },
    output: {
        path: path.resolve(process.cwd(), 'dist/webpack'),
        filename: 'js/[name].min.js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.pug$/,
                use: [
                    {
                        loader: 'pug-loader',
                        options: { pretty: true }
                    }
                ]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: { sourceMap: false }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                includePaths: ['node_modules'],
                                quietDeps: true,
                                silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'legacy-js-api']
                            }
                        }
                    }
                ]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/style.min.css'
        }),
        new HtmlWebpackPlugin({
            template: './src/pages/index.pug',
            filename: 'index.html',
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: './src/pages/friends.pug',
            filename: 'friends.html',
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: './src/pages/news.pug',
            filename: 'news.html',
            inject: false
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()]
    },
    performance: {
        hints: false
    }
}
