import { describe, expect, it } from "vitest";
import { hills, kinds, toSvg } from "../src";
import { animals } from "./animals";
import { food } from "./food";
import { MOODS, PALETTES, stylize } from "./moods";
import { objects } from "./objects";

const SKETCHES = [...animals, ...food, ...objects];
const SEEDS = Array.from({ length: 150 }, (_, k) => k * 7919 + 1);
const SIZES: [number, number][] = [[400, 300], [300, 400], [256, 256], [960, 240]];
const BAD = /NaN|undefined|Infinity|\[object/;

describe.each(SKETCHES.map(k => [k.id, k] as const))("sketch %s", (_, kind) => {
  it("draws clean markup at every size and seed", () => {
    for (const [width, height] of SIZES) for (const seed of SEEDS) expect(toSvg(kind, { width, height, seed })).not.toMatch(BAD);
  });
  it("varies with the seed and stays small", () => {
    const svgs = SEEDS.slice(0, 20).map(seed => toSvg(kind, { seed }));
    expect(new Set(svgs).size).toBeGreaterThanOrEqual(18);
    expect(Math.max(...svgs.map(x => encodeURIComponent(x).length))).toBeLessThan(12_000);
  });
  it("balances its groups", () => {
    for (const seed of SEEDS.slice(0, 30)) {
      const svg = toSvg(kind, { seed });
      expect((svg.match(/<g[ >]/g) ?? []).length).toBe((svg.match(/<\/g>/g) ?? []).length);
    }
  });
});

describe("stylize", () => {
  const every = [...kinds, ...SKETCHES];
  it("recolors every kind with every mood and palette without breaking markup", () => {
    for (const kind of every) {
      const svg = toSvg(kind, { seed: 3 });
      for (const mood of MOODS) expect(stylize(svg, { mood })).not.toMatch(BAD);
      for (const palette of Object.values(PALETTES)) {
        expect(stylize(svg, { palette })).not.toMatch(BAD);
        expect(stylize(svg, { palette, mapping: "nearest" })).not.toMatch(BAD);
      }
    }
  });
  it("changes colors and leaves masks alone", () => {
    const svg = toSvg(hills, { seed: 1 });
    expect(stylize(svg, { mood: "grayscale" })).not.toBe(svg);
    const masked = '<svg width="10" height="10"><mask id="m"><rect fill="#fff"/></mask><rect fill="#ff0000"/></svg>';
    expect(stylize(masked, { mood: "grayscale" })).toContain('<mask id="m"><rect fill="#fff"/></mask>');
  });
  it("uses only palette colors with nearest mapping", () => {
    const palette = PALETTES.riso;
    const out = stylize(toSvg(hills, { seed: 1 }), { palette, mapping: "nearest" });
    for (const c of out.match(/#[0-9a-f]{6}\b/g) ?? []) expect(palette).toContain(c);
  });
  it("adds a texture layer", () => {
    expect(stylize(toSvg(hills), { texture: "grain" })).toContain("feTurbulence");
    expect(stylize(toSvg(hills), { texture: "paper" })).toContain("feDiffuseLighting");
  });
});
