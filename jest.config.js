module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [
    "**/tests/unit/**/*.spec.ts",
    "**/tests/unit/**/*.test.ts",
    // "**/?(*.)+(spec|test|specs).[tj]s",
    "**/tests/unit/**/*.specs.ts",
  ],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  roots: ["<rootDir>/src", "<rootDir>/tests/unit"],
  clearMocks: true,

  // ✅ AÑADE ESTAS CONFIGURACIONES:
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/index.ts", "!src/**/bootstrap/**"],
  setupFilesAfterEnv: ["<rootDir>/tests/unit/setup.ts"],
};
