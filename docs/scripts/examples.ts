/**
 * Renders the manual's example pictures: every function exported from docs/examples/*.ts that
 * takes no arguments is called, and the SVG it returns is written to docs/public/examples as
 * `<file>.svg` for a default export or `<file>-<export>.svg` for a named one. The manual shows
 * the same files as code, so every picture comes with the code that drew it.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "examples");
const out = join(root, "public", "examples");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let count = 0;
const started = performance.now();
for (const file of readdirSync(src)
  .filter(f => f.endsWith(".ts") && f !== "shared.ts")
  .sort()) {
  const mod = (await import(join(src, file))) as Record<string, unknown>;
  const base = basename(file, ".ts");
  for (const [key, value] of Object.entries(mod)) {
    // Only argument-free functions are examples; kinds (objects) and helpers are skipped.
    if (typeof value !== "function" || value.length > 0) continue;
    const result = (value as () => unknown)();
    if (typeof result !== "string" || !result.startsWith("<svg")) continue;
    writeFileSync(join(out, `${key === "default" ? base : `${base}-${key}`}.svg`), result);
    count++;
  }
}
console.log(`Wrote ${count} example pictures in ${Math.round(performance.now() - started)} ms`);
