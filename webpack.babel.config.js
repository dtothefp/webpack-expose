import path from 'path';
import fs from 'fs';
import {dependencies as deps} from './package.json';
import webpack from 'webpack';
import nunjucks from 'nunjucks';
import makeEslintConfig from 'open-eslint-config';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import autoprefixer from 'autoprefixer';
import formatter from 'eslint-friendly-formatter';

const isDev = process.argv.indexOf('watch') !== -1;
const babelrc = `{
  "presets": ["react", "es2015", "stage-0"],
  "env": {
    "development": {
      "plugins": [
        "rewire",
        "transform-decorators-legacy",
        "typecheck",
        ["transform-runtime", {"polyfill": true}],
        ["react-transform",
          {
          "transforms": [{
            "transform": "react-transform-hmr",
            "imports": ["react"],
            "locals": ["module"]
          }, {
            "transform": "react-transform-catch-errors",
            "imports": ["react", "redbox-react"]
          }]
        }]
      ]
    },
    "production": {
      "plugins": [
        ["transform-runtime", {"polyfill": true}],
        "transform-decorators-legacy",
        "typecheck"
      ]
    }
  }
}`;

const includePaths = [
  path.dirname(require.resolve('foundation-sites/scss/foundation.scss'))
];

const sassParams = [
  'sourceMap',
  `outputStyle=${isDev ? 'expanded' : 'compressed'}`,
  'sourceMapContents=true'
];

includePaths.forEach((fp) => sassParams.push(`includePaths[]=${fp}`));

const {rules, configFile} = makeEslintConfig({
  isDev,
  lintEnv: 'web'
});

nunjucks.configure({
  noCache: true,
  watch: false
});

const babelParsed = JSON.parse(babelrc);
const babelQuery = {presets: babelParsed.presets};
let babelPlugins;

if (isDev) {
  babelPlugins = babelParsed.env.development.plugins;
} else {
  babelPlugins = babelParsed.env.production.plugins;
}

const publicPath = '/';
const hmrOpts = [
  `path=${publicPath}__webpack_hmr`,
  'reload=true',
  'noInfo=false'
];
const hotEntry = [
  `webpack-hot-middleware/client?${hmrOpts.join('&')}`
];

babelQuery.plugins = babelPlugins;

const buildDir = 'dist';
const addbase = (...args) => path.join.apply(path, [__dirname, ...args]);
const {DedupePlugin, UglifyJsPlugin, OccurenceOrderPlugin} = webpack.optimize;

const plugins = [
  new OccurenceOrderPlugin(),
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(isDev ? 'development' : 'production')
    }
  }),
  new ExtractTextPlugin(path.join('css', '[name].css'), {
    allChunks: true
  }),
  function() {
    this.plugin('done', (stats) => {
      fs.writeFileSync(
        addbase(buildDir, `${deps.webpack.replace('^', '')}-analysis-stats.json`),
        JSON.stringify(stats.toJson())
      );
    });
  }
];

const exposeMods = {
  'js-cookie': 'Cookie',
  'query-string': 'qs'
};

const expose = Object.keys(exposeMods).map(pkg => {
  const name = exposeMods[pkg];

  return {
    test: require.resolve(pkg),
    loader: `expose?${name}`
  };
});

const preLoaders = [
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: 'eslint-loader'
  }
];

const sassLoader = ExtractTextPlugin.extract('style-loader', [
  'css-loader?sourceMap&importLoaders=2',
  'postcss-loader',
  `sass-loader?${sassParams.join('&')}`
].join('!'));

const loaders = [
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: 'babel',
    query: babelQuery
  },
  {
    test: /\.html$/,
    loader: 'file-loader?name=[path][name].[ext]'
  },
  {
    test: /\.html$/,
    loader: 'template-html-loader',
    query: {
      engine: 'nunjucks',
      raw: true,
      title: 'Something Cool',
      message: 'BleepBloop',
      debug: isDev
    }
  },
  {
    test: /\.json$/,
    loader: 'json'
  },
  {
    test: /\.scss$/,
    loader: sassLoader
  }
];

const entry = {
  main: ['./js/index.js']
};

const apConfig = {
  browsers: [
    'last 2 versions',
    'Explorer >= 9',
    'Safari >= 7',
    'Opera >= 12',
    'iOS >= 5',
    'Android >= 3'
  ],
  cascade: isDev
};

entry.main.unshift(...Object.keys(exposeMods));

if (isDev) {
  entry.main.unshift(...hotEntry);

  plugins.push(...[
    new webpack.HotModuleReplacementPlugin(),
    function() {
      this.plugin('done', (stats) => {
        console.log(stats.toString());
      });
    }
  ]);
} else {
  plugins.push(...[
    new UglifyJsPlugin({
      output: {
        comments: false
      },
      compress: {
        warnings: false
      }
    }),
    new DedupePlugin()
  ]);
}

export default {
  context: path.join(__dirname, 'src'),
  entry,
  output: {
    path: addbase('dist'),
    publicPath,
    filename: path.join('js', '[name].js')
  },
  module: {
    preLoaders,
    loaders,
    postLoaders: [
      ...expose
    ]
  },
  node: {
    dns: 'mock',
    net: 'mock',
    fs: 'empty'
  },
  plugins,
  eslint: {
    rules,
    configFile,
    formatter,
    emitError: false,
    emitWarning: false,
    failOnWarning: !isDev,
    failOnError: !isDev
  },
  postcss: [
    autoprefixer(apConfig)
  ]
};
