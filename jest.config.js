// https://docs.expo.dev/develop/unit-testing/
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
  collectCoverageFrom: ['src/lib/**/*.ts', '!src/lib/**/*.web.ts', '!src/lib/__tests__/**'],
  coverageThreshold: { global: { functions: 70, lines: 70 } },
};
