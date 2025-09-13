// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,

  {
    ignores: [
      "node_modules",
      "client/.dist",
      "client/dist",
      "build",
      ".vercel",
      "generated/prisma",
      "server/src/generated/prisma", 
      "coverage",
    ],
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-irregular-whitespace": ["error", {
        skipStrings: true,
        skipComments: true,
        skipRegExps: true,
        skipTemplates: true, 
      }],
      "no-control-regex": "off",
    },
  },

  {
    files: ["server/**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      "no-console": "off",
      "no-process-exit": "off",
      "no-irregular-whitespace": ["error", { skipStrings: true, skipComments: true, skipRegExps: true, skipTemplates: true }],
    },
  },

  {
    files: ["client/**/*.{js,jsx,ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "no-irregular-whitespace": ["error", { skipStrings: true, skipComments: true, skipRegExps: true, skipTemplates: true }],
    },
  },
];
