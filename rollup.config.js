const rollup = require('rollup').rollup;
const babel = require('@rollup/plugin-babel').babel;
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;
const commonjs = require('@rollup/plugin-commonjs');
const fs = require('fs');
const yaml = require('js-yaml');
const minimist = require('minimist');
const _ = require('lodash');

let config = {
  babel: require('./.babelrc.js'),
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


async function build() {
  const bundle = await rollup({
    input: `./src/${options.target}/app.js`,
    plugins: [
      babel(config.babel),
    ]
  });
  await bundle.write({
    file: './dist/' + options.target + '/app.js',
    format: 'cjs'
  });
}
build();

