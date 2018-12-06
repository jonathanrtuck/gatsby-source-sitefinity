module.exports = {
  env: {
    amd: true,
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
    ecmaVersion: 6,
  },
  rules: {
    'no-console': 'off',
    quotes: ['error', 'single', {avoidEscape: true}],
    'valid-jsdoc': [
      'warn',
      {
        prefer: {
          return: 'returns',
        },
        requireParamDescription: false,
        requireReturn: false,
        requireReturnDescription: false,
      },
    ],
  },
};
