// Builds self-contained copies of the demo pages in demo/out/: each page's module script is bundled
// and inlined, so a page works as a single file (for sharing, or hosting without a build step).
// For development, `npm run dev` serves the same pages with Vite instead.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const demo = new URL("../demo/", import.meta.url);
const SCRIPT = /<script type="module" src="\.\/([\w-]+\.ts)"><\/script>/;

mkdirSync(new URL("out/", demo), { recursive: true });
for (const file of readdirSync(demo).filter(f => f.endsWith(".html"))) {
  const html = readFileSync(new URL(file, demo), "utf8");
  const entry = SCRIPT.exec(html)?.[1];
  if (!entry) throw new Error(`demo/${file} has no <script type="module" src="./….ts"> to inline.`);
  const result = await build({
    entryPoints: [new URL(entry, demo).pathname],
    bundle: true,
    format: "iife",
    target: "es2020",
    minify: true,
    write: false,
  });
  const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  // A function replacement inserts the script literally; a string one would treat `$&`, `$'` and the like in it as patterns.
  const page = html.replace(SCRIPT, () => `<script>${js}</script>`);
  writeFileSync(new URL(`out/${file}`, demo), page);
  console.log(`demo/out/${file}: ${(page.length / 1024).toFixed(1)} KB`);
}
