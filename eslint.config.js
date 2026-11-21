import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "demo/dist/",
      "demo/out/",
      "media/",
      "docs/.vitepress/dist/",
      "docs/.vitepress/cache/",
      "docs/reference/api/",
      ".vitepress/",
    ],
  },
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
    files: ["scripts/**", "docs/scripts/**", "docs/.vitepress/config.ts", "demo/vite.config.ts", "*.config.{js,ts}"],
    languageOptions: { globals: { ...globals.node } },
  },
);
