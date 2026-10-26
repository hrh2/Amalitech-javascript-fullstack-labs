import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  collectCoverageFrom: ['src/app/**/*.ts', '!src/app/**/*.routes.ts', '!src/app/app.config.ts', '!src/app/testing/**'],
  coverageDirectory: 'coverage',
  // Fails `npm run test:coverage` if coverage drops below these floors.
  coverageThreshold: { global: { statements: 95, branches: 85, functions: 95, lines: 95 } },
  coverageReporters: ['text-summary', 'text', 'lcov'],
};

export default config;
