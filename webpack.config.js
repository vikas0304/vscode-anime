//@ts-check
const path = require('path');

/** @type {import('webpack').Configuration} */
const panelConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        main: './src/panel/main.ts',
    },
    output: {
        path: path.resolve(__dirname, './media'),
        filename: '[name]-bundle.js',
        library: {
            name: 'animeApp',
            type: 'global',
        },
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.panel.json',
                        },
                    },
                ],
            },
        ],
    },
};

module.exports = [panelConfig];
