export default [
  {
    ignores: ["src/generated/**", "node_modules/**", "dist/**"],
  },
  {
    files: ["src/**/*.js"],
    languageOptions: { sourceType: "module" },
    rules: {
      "no-unused-vars": "warn",
    },
  },
];
