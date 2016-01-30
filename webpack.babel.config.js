import path from 'path';
import webpack from 'webpack';
import nunjucks from 'nunjucks';

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
  'noInfo=true'
];
const hotEntry = [
  `webpack-hot-middleware/client?${hmrOpts.join('&')}`
];

babelQuery.plugins = babelPlugins;

const plugins = [
  new webpack.optimize.OccurrenceOrderPlugin(),
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(isDev ? 'development' : 'production')
    }
  }),
];

const addbase = (dir) => path.join(__dirname, dir);
const buildDir = 'dist';
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
  }
];

const entry = {
  main: ['./js/index.js']
};

//TODO: Uncaught Error: [HMR] Hot Module Replacement is disabled.
//if (isDev) {
  //entry.main.unshift(...hotEntry);
//}

export default {
  context: path.join(__dirname, 'src'),
  entry,
  output: {
    path: addbase('dist'),
    publicPath,
    filename: path.join('js', '[name].js')
  },
  module: {
    loaders,
    postLoaders: [
      ...expose
    ]
  },
  plugins
};
