/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/../tsconfig.test.json',
    }],
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./setup.ts'],
  moduleNameMapper: {
    '^@uritech/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
    '^~/(.*)$': '<rootDir>/../src/$1',
  },
};
