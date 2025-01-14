module.exports = {
    env: {
      node: true,
      es2021: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:node/recommended',
      'airbnb-base',
    ],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['node'],
    rules: {
      'no-console': 'off', 
      'no-unused-vars': 'warn', 
      'node/no-missing-require': 'warn', 
      'node/no-unpublished-require': 'warn', 
      'prefer-const': 'warn', 
      'no-undef': 'warn', 
      'no-debugger': 'warn', 
      'no-async-promise-executor': 'warn',
    },
  };
  