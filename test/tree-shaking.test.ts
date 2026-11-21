import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";

// The published package is one bundled file, as tsup builds it, so the library is bundled the same
// way first. Bundling straight from the source would hide trouble: there, unused files drop out whole.
let dir = "";

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "bozzetto-shake-"));
  await build({
    entryPoints: [new URL("../src/index.ts", import.meta.url).pathname],
    bundle: true,
    format: "esm",
    outfile: join(dir, "index.js"),
    logLevel: "silent",
  });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module", sideEffects: false }));
});

/** The minified size of an app that imports `names` from the bundled library and uses them. */
async function appSize(code: string): Promise<number> {
  const result = await build({
    stdin: { contents: code, resolveDir: dir },
    bundle: true,
    minify: true,
    write: false,
    format: "esm",
    logLevel: "silent",
  });
  return result.outputFiles[0].text.length;
}

describe("tree shaking", () => {
  it("leaves out the kinds an app doesn't use", async () => {
    const one = await appSize(`import { owl, toDataUri } from "./index.js"; console.log(toDataUri(owl));`);
    const all = await appSize(`import { placeholders } from "./index.js"; console.log(placeholders(3));`);
    // Every kind together is hundreds of KB; one kind and the renderer, a few dozen at most.
    expect(all).toBeGreaterThan(300_000);
    expect(one).toBeLessThan(40_000);
  });
});
