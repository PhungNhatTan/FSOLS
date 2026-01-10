/* eslint-env node */
import js from "@eslint/js";

export default [
  js.configs.recommended,

  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".vercel/**",
      "client/**",
      "server/**",
    ],
  },
];
