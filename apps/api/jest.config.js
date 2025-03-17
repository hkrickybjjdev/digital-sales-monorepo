module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'miniflare',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!nanoid|uuid).+\\.js$'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/database/*.sql',
    '!src/**/index.ts'
  ],
};