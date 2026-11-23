module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  setupFiles: ['<rootDir>/src/tests/setup/env.js'], // runs before every test file, before any app code is loaded
  testTimeout: 20000,
  collectCoverageFrom: ['src/**/*.js', '!src/tests/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  // The lab asks for at least 80% across services and middleware. The whole of src/ is held to the same bar.
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/services/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/middlewares/': { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
