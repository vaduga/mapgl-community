// webpack.config.ts
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';
const webpack = require('webpack');

const config = async (env): Promise<Configuration> => {
    const baseConfig = await grafanaConfig(env);

    return merge(baseConfig, {

         plugins: [
             new webpack.optimize.LimitChunkCountPlugin({
                 maxChunks: 1,
             }),
         ],

        output: {
            asyncChunks: true,
        },

    });
};

export default config;
