import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "*.tsbuildinfo"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // relative to client/
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { react: reactPlugin },
    settings: { react: { version: "detect" } },
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
  prettier
);
