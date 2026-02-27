/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.ts', '!**/*.module.ts', '!**/index.ts', '!main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@ai-lab/shared': '<rootDir>/../../packages/shared/src/index.ts',
    '@ai-lab/ai-core': '<rootDir>/../../packages/ai-core/src/index.ts',
  },
};
