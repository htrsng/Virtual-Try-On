module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  globalSetup: '<rootDir>/tests/global-setup.js',
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
