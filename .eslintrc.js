module.exports = {
  env: {
    amd: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'airbnb', 'prettier'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error'],
  },
};
