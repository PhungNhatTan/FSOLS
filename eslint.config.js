/* eslint-env node */
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,

  {
    ignores: [
      "node_modules",
      "build",
      "dist",
      "coverage",
      "server/src/generated/prisma",
      ".vercel",
      "client",
    ],
  },

  // ------------------ SERVER ------------------
  {
    files: ["server/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
      "no-process-exit": "off",
    },
  },

  // ------------------ CLIENT (React + TS) ------------------
  ...tseslint.configs.recommended, // 👈 use TS parser + rules for client
  {
    files: ["client/**/*.{ts,tsx,js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: path.join(__dirname, "client"),
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
