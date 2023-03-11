import type { JestConfigWithTsJest } from "ts-jest";

import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  modulePaths: [compilerOptions.baseUrl],
  preset: "@shelf/jest-dynamodb",
  roots: ["<rootDir>"],
  setupFiles: ["<rootDir>/setEnvVars.js"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
  verbose: true,
};

export default jestConfig;
