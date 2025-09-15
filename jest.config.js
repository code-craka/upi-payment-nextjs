const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: [
    "<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}",
    "<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}",
  ],
  collectCoverageFrom: [
    "app/**/*.{js,ts,jsx,tsx}",
    "components/**/*.{js,ts,jsx,tsx}",
    "lib/**/*.{js,ts,jsx,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
  },
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
