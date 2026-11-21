import { defineConfig } from "tsup";

// The library (index) and the `bozzetto` command (bin) in one build, so cleaning dist/ can't race
// a second build. tsup keeps bin.ts's #! line and marks the file executable.
export default defineConfig({
  entry: { index: "src/index.ts", bin: "src/bin.ts" },
  format: ["esm", "cjs"],
  dts: { entry: { index: "src/index.ts" } },
  clean: true,
  sourcemap: true,
  target: "es2020",
});
