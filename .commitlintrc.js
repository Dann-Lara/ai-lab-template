module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['frontend', 'backend', 'ai-core', 'shared', 'n8n', 'docker', 'ci', 'deps', 'config'],
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 200],
  },
};
