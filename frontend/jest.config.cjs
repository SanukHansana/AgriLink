module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/style-mock.cjs',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/components/**/*.web.tsx',
  ],
  coverageDirectory: 'coverage',
};
