module.exports = {
  presets: [['@babel/preset-env', {modules: 'auto', loose: true}], '@babel/preset-typescript'],
  plugins: [['@babel/plugin-transform-runtime', {corejs: 3}]],
};
