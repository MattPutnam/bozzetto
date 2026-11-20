// Bundles sketches/main.ts and inlines it into sketchbook.html, giving one self-contained page.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const here = new URL(".", import.meta.url);
const result = await build({ entryPoints: [new URL("main.ts", here).pathname], bundle: true, format: "iife", target: "es2020", minify: true, write: false });
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const page = readFileSync(new URL("sketchbook.html", here), "utf8").replace("<!--SCRIPT-->", `<script>${js}</script>`);
mkdirSync(new URL("out/", here), { recursive: true });
writeFileSync(new URL("out/sketchbook.html", here), page);
console.log(`sketches/out/sketchbook.html: ${(page.length / 1024).toFixed(1)} KB`);
