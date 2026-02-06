module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect']
};