import { describe, expect, it } from "vitest";
import { animals, owl, placeholders, render } from "../src";
import { run } from "../src/cli";

/** Runs the command against an in-memory terminal and file system. */
function cli(...args: string[]) {
  const out = { stdout: "", stderr: "", files: new Map<string, string>(), folders: [] as string[] };
  const code = run(args, {
    stdout: text => (out.stdout += text),
    stderr: text => (out.stderr += text),
    writeFile: (path, contents) => out.files.set(path, contents),
    mkdir: path => out.folders.push(path),
  });
  return { code, ...out };
}

describe("bozzetto", () => {
  it("writes one picture to standard output", () => {
    const { code, stdout } = cli("owl", "--seed", "3", "--size", "320x240", "--palette", "riso");
    expect(code).toBe(0);
    expect(stdout).toBe(render(owl, { seed: 3, size: "320x240", palette: "riso" }).svg + "\n");
  });

  it("accepts kind ids, export names and categories", () => {
    expect(cli("ice-cream").code).toBe(0);
    expect(cli("iceCream").code).toBe(0);
    expect(cli("FruitBowl").code).toBe(0);
    const ids = JSON.parse(cli("animals", "-n", String(animals.length), "-f", "json").stdout).map(
      (p: { kind: string }) => p.kind,
    );
    expect(new Set(ids)).toEqual(new Set(animals.map(k => k.id)));
  });

  it("matches placeholders, with repeated flags as lists", () => {
    const { stdout } = cli(
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

  it("writes a folder of pictures with a manifest", () => {
    const { code, files, folders, stderr } = cli("hills", "owl", "-n", "3", "--seed", "10", "-o", "out/");
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

  it("records the real seed for text seeds", () => {
    const { files } = cli("hills", "-n", "2", "--seed", "user-42", "-o", "out");
    const expected = placeholders(2, { kind: "hills", seed: "user-42" });
    const [first, second] = JSON.parse(files.get("out/manifest.json")!);
    expect(second.seed).toBe(first.seed + 1);
    expect(files.get(`out/${first.file}`)).toBe(expected[0].svg + "\n");
    expect(files.get(`out/${second.file}`)).toBe(expected[1].svg + "\n");
  });

  it("writes one picture to a file", () => {
    const { files } = cli("owl", "-o", "owl.svg");
    expect(files.get("owl.svg")).toBe(render(owl).svg + "\n");
  });

  it("prints JSON with alt text and markup", () => {
    const [picture] = JSON.parse(cli("owl", "-f", "json").stdout);
    expect(picture).toMatchObject({ kind: "owl", seed: 1, width: 400, height: 300, alt: render(owl).alt });
    expect(picture.svg).toBe(render(owl).svg);
  });

  it("lists kinds and palettes, and shows help and the version", () => {
    expect(cli("--list").stdout).toContain("animals     cat, bird");
    expect(cli("--help").stdout).toContain("Usage");
    expect(cli("--version").stdout).toMatch(/^\d+\.\d+\.\d+\n$/);
  });

  it("explains mistakes and exits with 1", () => {
    for (const [args, message] of [
      [["dragon"], 'unknown kind "dragon"'],
      [["-n", "3"], "several pictures need --out"],
      [["-n", "0"], "--count must be"],
      [["--mapping", "bogus"], "--mapping must be one of"],
      [["--format", "png"], "--format must be one of"],
      [["--size", "big"], "isn't a size"],
      [["--palette", "plaid"], "neither a palette name"],
      [["--frobnicate"], "Unknown option"],
    ] as const) {
      const { code, stderr } = cli(...args);
      expect(code, args.join(" ")).toBe(1);
      expect(stderr, args.join(" ")).toContain(message);
    }
  });
});
