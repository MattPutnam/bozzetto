import { describe, expect, it } from "vitest";
import { ADJUSTMENTS, MAPPINGS, PALETTES, hills, kinds, stylize, toDataUri, toSvg } from "../src";

const SEEDS = Array.from({ length: 150 }, (_, k) => k * 7919 + 1);
const SIZES = ["400x300", "300x400", "256x256", "960x240"] as const;
const BAD = /NaN|undefined|Infinity|\[object/;

describe.each(kinds.map(k => [k.id, k] as const))("%s", (_, kind) => {
  it("draws clean markup at every size and seed", () => {
    for (const size of SIZES) {
      for (const seed of SEEDS) {
        const svg = toSvg(kind, { size, seed });
        expect(svg).not.toMatch(BAD);
        expect(svg.startsWith("<svg ")).toBe(true);
        expect(svg.endsWith("</svg>")).toBe(true);
      }
    }
  });

  it("is deterministic and varies with the seed", () => {
    expect(toSvg(kind, { seed: 42 })).toBe(toSvg(kind, { seed: 42 }));
    expect(new Set(SEEDS.slice(0, 20).map(seed => toSvg(kind, { seed }))).size).toBeGreaterThanOrEqual(18);
  });

  it("stays small", () => {
    expect(Math.max(...SEEDS.map(seed => toDataUri(kind, { seed }).length))).toBeLessThan(12_000);
  });

  it("closes every group it opens", () => {
    for (const seed of SEEDS.slice(0, 30)) {
      const svg = toSvg(kind, { seed });
      expect((svg.match(/<g[ >]/g) ?? []).length).toBe((svg.match(/<\/g>/g) ?? []).length);
    }
  });
});

describe("stylize", () => {
  const every = kinds;
  it("recolors every kind with every adjustment, palette and mapping without breaking markup", () => {
    for (const kind of every) {
      const svg = toSvg(kind, { seed: 3 });
      for (const palette of ADJUSTMENTS) expect(stylize(svg, { palette })).not.toMatch(BAD);
      for (const palette of Object.keys(PALETTES)) {
        for (const mapping of MAPPINGS) expect(stylize(svg, { palette, mapping })).not.toMatch(BAD);
      }
    }
  });
  it("treats adjustments the same whatever the mapping", () => {
    const svg = toSvg(kinds[0], { seed: 3 });
    expect(stylize(svg, { palette: "pastel", mapping: "nearest" })).toBe(stylize(svg, { palette: "pastel" }));
  });
  it("changes colors and leaves masks alone", () => {
    const svg = toSvg(hills, { seed: 1 });
    expect(stylize(svg, { palette: "grayscale" })).not.toBe(svg);
    const masked = '<svg width="10" height="10"><mask id="m"><rect fill="#fff"/></mask><rect fill="#ff0000"/></svg>';
    expect(stylize(masked, { palette: "grayscale" })).toContain('<mask id="m"><rect fill="#fff"/></mask>');
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

describe("default mapping", () => {
  it("is balanced for color palettes", () => {
    const svg = toSvg(kinds[0], { seed: 3 });
    expect(stylize(svg, { palette: "riso" })).toBe(stylize(svg, { palette: "riso", mapping: "balanced" }));
    expect(stylize(svg, { palette: "riso" })).not.toBe(stylize(svg, { palette: "riso", mapping: "ramp" }));
  });
});

describe("toSvg with style options", () => {
  it("matches styling the plain picture", () => {
    const plain = toSvg(hills, { seed: 5 });
    expect(toSvg(hills, { seed: 5, palette: "riso", texture: "grain" })).toBe(
      stylize(plain, { palette: "riso", texture: "grain" }),
    );
  });
});
