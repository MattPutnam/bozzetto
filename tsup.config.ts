import { defineConfig } from "tsup";

// The library (index), its extras (node, react, vue, element) and the `bozzetto` command (bin) in one build, so cleaning dist/ can't race
// a second build. tsup keeps bin.ts's #! line and marks the file executable.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    node: "src/node.ts",
    react: "src/react.ts",
    vue: "src/vue.ts",
    element: "src/element.ts",
    bin: "src/bin.ts",
  },
  format: ["esm", "cjs"],
  dts: {
    entry: {
      index: "src/index.ts",
      node: "src/node.ts",
      react: "src/react.ts",
      vue: "src/vue.ts",
      element: "src/element.ts",
    },
  },
  clean: true,
  // Share the library between entries in CommonJS too, as ESM does, so require("bozzetto/react")
  // and require("bozzetto") load one copy of it.
  splitting: true,
  sourcemap: true,
  target: "es2020",
});
