const gulp = require('gulp');
const minimist = require('minimist');
const fs = require('fs');
const yaml = require('js-yaml');
const exec = require('child_process').exec;
// const webpack = require('webpack-stream');
const _ = require('lodash');
const babel = require('gulp-babel');
const rollup = require('gulp-rollup');

let config = {
};

config = _.merge(config, yaml.safeLoad(fs.readFileSync('./env-config.yaml').toString()));

const knownOptions = {
  string: 'target',
  default: { target: 'test' }
};

let options = minimist(process.argv.slice(2), knownOptions);

function layerTargetConfig(target, cfg) {
  const envConfigFile = `./etc/targets/${target}.yaml`;
  if (fs.existsSync(envConfigFile)) {
    const envConfig = yaml.safeLoad(fs.readFileSync(envConfigFile).toString());
    if (envConfig.inherit) {
      cfg = layerTargetConfig(envConfig.inherit, cfg);
    }
    cfg = _.merge(cfg, envConfig);
  }

  return cfg;
}

config = layerTargetConfig(options.target, config);
//
// gulp.task('babel', () => {
//   return gulp.src(config.src)
//       .pipe(babel(config.babel))
//       .pipe(gulp.dest(config.dest + '/babelified-' + options.target));
// });
//
// gulp.task('webpack', () => {
//   return gulp.src(config.src)
//       .pipe(webpack(config.webpack))
//       .pipe(gulp.dest(config.dest + '/wp-' + options.target));
// });

gulp.task('rollup', () => {
  return gulp.src(`./src/${options.target}/**/*.js`, { base: `./src/${options.target}` })
      // transform the files here.
      .pipe(rollup({
        input: `./src/${options.target}/app.js`,
        output: {
          format: 'cjs'
        },
      }))
      .pipe(babel(config.babel))
      .pipe(gulp.dest('./dist/' + options.target));
})

gulp.task('upload', (cb) => {
  const outFile = config.dest + '/' + options.target + '/app.js';
  const args = [];
  Object.keys(config.espruino.config).forEach((name) => {
    args.push('--config');
    args.push(`${name}=${JSON.stringify(config.espruino.config[name])}`);
  });

  if (config.espruino.port) {
    args.push('-p ' + config.espruino.port);
  }

  if (config.espruino.baud) {
    args.push('-b ' + config.espruino.baud);
  }

  if (config.espruino.board) {
    args.push('--board ' + config.espruino.board);
  }

  const argString = args.join(' ');

  const cmd = `npx espruino ${argString} ${outFile}`;
  try {
    exec(cmd, (err, stdout, stderr) => {
      console.log(err);
      console.log(stdout);
      console.log(stderr);

      cb(err);
    });
  } catch (e) {
    console.log(e);
  }
});


gulp.task('default', gulp.series(['rollup', 'upload']));

