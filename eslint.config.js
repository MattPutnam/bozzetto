import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "demo/dist/", "demo/out/", "media/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "prefer-const": "error",
      // One declaration per statement: Prettier formats `const a = 1, b = 2` awkwardly.
      "one-var": ["error", "never"],
      eqeqeq: ["error", "always"],
      "no-var": "error",
    },
  },
  {
    files: ["scripts/**", "*.config.{js,ts}"],
    languageOptions: { globals: { ...globals.node } },
  },
);
