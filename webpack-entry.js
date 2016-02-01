import 'babel-polyfill';
import webpack from 'webpack';
import config from './webpack.babel.config';
import Express from 'express';

const isDev = process.argv.indexOf('watch') !== -1;
const compiler = webpack(config);

if (isDev) {
  const app = new Express();
  const serverOptions = {
    contentBase: './dist',
    publicPath: '/',
    quiet: true,
    noInfo: true,
    hot: true,
    inline: true,
    lazy: false,
    publicPath: '/',
    headers: {'Access-Control-Allow-Origin': '*'},
    stats: {colors: true}
  };

  app.use(require('webpack-dev-middleware')(compiler, serverOptions));
  app.use(require('webpack-hot-middleware')(compiler));

  const hotPort = 8080;

  app.listen(hotPort, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.info('==> 🚧  Webpack development server listening on port %s', hotPort);
    }
  });
} else {
  compiler.run((err, stats) => {
    if (err) throw err;

    console.log(stats.toString());
  });
}
