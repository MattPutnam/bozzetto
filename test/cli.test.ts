import { describe, expect, it } from "vitest";
import { animals, cat, owl, placeholders, render } from "../src";
import { run } from "../src/cli";

/** Runs the command against an in-memory terminal and file system. PNG bytes are kept apart from text. */
async function cli(...args: string[]) {
  const out = {
    stdout: "",
    stdoutBytes: undefined as Uint8Array | undefined,
    stderr: "",
    files: new Map<string, string>(),
    binaries: new Map<string, Uint8Array>(),
    folders: [] as string[],
  };
  const code = await run(args, {
    stdout: contents => (typeof contents === "string" ? (out.stdout += contents) : (out.stdoutBytes = contents)),
    stderr: text => (out.stderr += text),
    writeFile: (path, contents) =>
      typeof contents === "string" ? out.files.set(path, contents) : out.binaries.set(path, contents),
    mkdir: path => out.folders.push(path),
  });
  return { code, ...out };
}

describe("bozzetto", () => {
  it("writes one picture to standard output", async () => {
    const { code, stdout } = await cli("owl", "--seed", "3", "--size", "320x240", "--palette", "riso");
    expect(code).toBe(0);
    expect(stdout).toBe(render(owl, { seed: 3, size: "320x240", palette: "riso" }).svg + "\n");
  });

  it("accepts kind ids, export names and categories", async () => {
    expect((await cli("ice-cream")).code).toBe(0);
    expect((await cli("iceCream")).code).toBe(0);
    expect((await cli("FruitBowl")).code).toBe(0);
    const ids = JSON.parse((await cli("animals", "-n", String(animals.length), "-f", "json")).stdout).map(
      (p: { kind: string }) => p.kind,
    );
    expect(new Set(ids)).toEqual(new Set(animals.map(k => k.id)));
  });

  it("matches placeholders, with repeated flags as lists", async () => {
    const { stdout } = await cli(
      "animals",
      "donut",
      "-n",
      "4",
      "-s",
      "400x300",
      "-s",
      "300x400",
      "-p",
      "pastel",
      "-f",
      "uri",
    );
    const expected = placeholders(4, { kind: [animals, "donut"], size: ["400x300", "300x400"], palette: "pastel" });
    expect(stdout.trim().split("\n")).toEqual(expected.map(p => p.src));
  });

  it("writes a folder of pictures with a manifest", async () => {
    const { code, files, folders, stderr } = await cli("hills", "owl", "-n", "3", "--seed", "10", "-o", "out/");
    expect(code).toBe(0);
    expect(folders).toEqual(["out"]);
    expect(stderr).toContain("Wrote 3 pictures");
    const expected = placeholders(3, { kind: ["hills", "owl"], seed: 10 });
    const manifest = JSON.parse(files.get("out/manifest.json")!);
    expect(manifest).toHaveLength(3);
    for (const [k, entry] of manifest.entries()) {
      expect(entry).toMatchObject({ file: `${k + 1}-${expected[k].kind}.svg`, seed: 10 + k, alt: expected[k].alt });
      expect(files.get(`out/${entry.file}`)).toBe(expected[k].svg + "\n");
    }
  });

  it("records the real seed for text seeds", async () => {
    const { files } = await cli("hills", "-n", "2", "--seed", "user-42", "-o", "out");
    const expected = placeholders(2, { kind: "hills", seed: "user-42" });
    const [first, second] = JSON.parse(files.get("out/manifest.json")!);
    expect(second.seed).toBe(first.seed + 1);
    expect(files.get(`out/${first.file}`)).toBe(expected[0].svg + "\n");
    expect(files.get(`out/${second.file}`)).toBe(expected[1].svg + "\n");
  });

  it("writes one picture to a file", async () => {
    const { files } = await cli("owl", "-o", "owl.svg");
    expect(files.get("owl.svg")).toBe(render(owl).svg + "\n");
  });

  it("prints JSON with alt text and markup", async () => {
    const [picture] = JSON.parse((await cli("owl", "-f", "json")).stdout);
    expect(picture).toMatchObject({ kind: "owl", seed: 1, width: 400, height: 300, alt: render(owl).alt });
    expect(picture.svg).toBe(render(owl).svg);
  });

  it("takes kind options after a colon", async () => {
    const [picture] = JSON.parse((await cli("cat:tabby,pupils=round", "-f", "json")).stdout);
    expect(picture.options).toMatchObject({ tabby: true, pupils: "round" });
    expect(picture.svg).toBe(render(cat.with({ tabby: true, pupils: "round" })).svg);
    const [pizza] = JSON.parse((await cli("pizza:slices=8,topping=margherita", "-f", "json")).stdout);
    expect(pizza.options).toMatchObject({ slices: 8, topping: "margherita" });
    expect((await cli("--list")).stdout).toContain("pupils=slit|round");
  });

  it("writes PNGs: one to a file or standard output, several to a folder", async () => {
    const isPng = (bytes?: Uint8Array) => !!bytes && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e;
    const one = await cli("owl", "-o", "owl.png");
    expect(isPng(one.binaries.get("owl.png"))).toBe(true);
    expect(isPng((await cli("owl", "--format", "png")).stdoutBytes)).toBe(true);
    const folder = await cli("animals", "-n", "3", "--format", "png", "--scale", "2", "-o", "out");
    const manifest = JSON.parse(folder.files.get("out/manifest.json")!);
    for (const entry of manifest) {
      expect(entry.file).toMatch(/\.png$/);
      expect(isPng(folder.binaries.get(`out/${entry.file}`))).toBe(true);
      expect([entry.width, entry.height]).toEqual([800, 600]);
    }
  });

  it("lists kinds and palettes, and shows help and the version", async () => {
    expect((await cli("--list")).stdout).toContain("animals     cat, bird");
    expect((await cli("--help")).stdout).toContain("Usage");
    expect((await cli("--version")).stdout).toMatch(/^\d+\.\d+\.\d+\n$/);
  });

  it("explains mistakes and exits with 1", async () => {
    for (const [args, message] of [
      [["dragon"], 'unknown kind "dragon"'],
      [["-n", "3"], "several pictures need --out"],
      [["-n", "0"], "--count must be"],
      [["--mapping", "bogus"], "--mapping must be one of"],
      [["--format", "gif"], "--format must be one of"],
      [["--size", "big"], "isn't a size"],
      [["--palette", "plaid"], "neither a palette name"],
      [["--frobnicate"], "Unknown option"],
      [["--scale", "2"], "--scale is for --format png"],
      [["-f", "png", "--scale", "0"], "--scale must be a number more than 0"],
      [["-n", "2", "-f", "png"], "several PNGs need --out"],
      [["cat:wings"], 'cat has no option "wings"'],
      [["cat:pupils=plaid"], "cat's pupils can be slit, round"],
      [["animals:tabby"], "options go on a single kind"],
    ] as const) {
      const { code, stderr } = await cli(...args);
      expect(code, args.join(" ")).toBe(1);
      expect(stderr, args.join(" ")).toContain(message);
    }
  });
});
