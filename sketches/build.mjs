// Bundles each sketch page's script and inlines it into its HTML template, giving self-contained pages.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const here = new URL(".", import.meta.url);
const pages = [
  ["main.ts", "sketchbook.html"],
  ["picker.ts", "picker.html"],
];

mkdirSync(new URL("out/", here), { recursive: true });
for (const [entry, template] of pages) {
  const result = await build({
    entryPoints: [new URL(entry, here).pathname],
    bundle: true,
    format: "iife",
    target: "es2020",
    minify: true,
    write: false,
  });
  const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  // A function replacement inserts the script literally; a string one would treat `$&`, `$'` and the like in it as patterns.
  const page = readFileSync(new URL(template, here), "utf8").replace("<!--SCRIPT-->", () => `<script>${js}</script>`);
  writeFileSync(new URL(`out/${template}`, here), page);
  console.log(`sketches/out/${template}: ${(page.length / 1024).toFixed(1)} KB`);
}
