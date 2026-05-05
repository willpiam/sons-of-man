const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.experiments = {
        asyncWebAssembly: true,
        topLevelAwait: true,
        layers: true,
      };

      webpackConfig.output = {
        ...webpackConfig.output,
        environment: {
          ...(webpackConfig.output && webpackConfig.output.environment),
          asyncFunction: true,
        },
      };

      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          stream: require.resolve('stream-browserify'),
          buffer: require.resolve('buffer/'),
          crypto: require.resolve('crypto-browserify'),
          process: require.resolve('process/browser'),
          path: require.resolve('path-browserify'),
          url: require.resolve('url/'),
          fs: false,
          vm: false,
        },
      };

      webpackConfig.module.rules.push({
        test: /\.wasm$/,
        type: 'webassembly/async',
      });

      const excludeFromSourceMapLoader = /node_modules/;
      const extendExclude = (rule) => {
        const existing = rule.exclude;
        const list = Array.isArray(existing) ? existing : existing ? [existing] : [];
        rule.exclude = [...list, excludeFromSourceMapLoader];
      };
      const patchRule = (rule) => {
        if (!rule) return;
        const loader = rule.loader;
        if (typeof loader === 'string' && loader.includes('source-map-loader')) {
          extendExclude(rule);
        }
        if (Array.isArray(rule.use)) {
          rule.use.forEach((use) => {
            const l = typeof use === 'string' ? use : use && use.loader;
            if (l && l.includes('source-map-loader')) extendExclude(rule);
          });
        }
        if (Array.isArray(rule.oneOf)) rule.oneOf.forEach(patchRule);
      };
      (webpackConfig.module.rules || []).forEach(patchRule);

      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        (warning) =>
          /Failed to parse source map/.test(warning.message || '') &&
          excludeFromSourceMapLoader.test((warning.module && warning.module.resource) || ''),
      ];

      return webpackConfig;
    },
  },
  style: {
    postcss: {
      mode: 'extends',
      loaderOptions: {
        postcssOptions: {
          config: path.resolve(__dirname, 'postcss.config.js'),
        },
      },
    },
  },
};
