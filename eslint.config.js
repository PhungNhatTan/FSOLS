/* eslint-env node */
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import path from "node:path";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended, // 👈 use TS parser + rules

  {
    ignores: [
      "node_modules",
      "build",
      "dist",
      "coverage",
      "server/src/generated/prisma",
      ".vercel",
    ],
  },

  // ------------------ SERVER ------------------
  {
    files: ["server/**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
      parserOptions: {
        project: "./server/tsconfig.json",
        tsconfigRootDir: path.resolve(),
      },
    },
    rules: {
      "no-console": "off",
      "no-process-exit": "off",
    },
  },

  // ------------------ CLIENT (React + TS) ------------------
  {
    files: ["client/**/*.{ts,tsx,js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: {
        project: "./client/tsconfig.json",
        tsconfigRootDir: path.resolve(),
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" }, // 👈 fix “React version not specified” warning
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-irregular-whitespace": ["error", {
        skipStrings: true,
        skipComments: true,
        skipRegExps: true,
        skipTemplates: true,
      }],
    },
  },
];
