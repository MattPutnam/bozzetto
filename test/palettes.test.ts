import { describe, expect, it } from "vitest";
import { hills, owl, render, toSvg } from "../src";
import { hexToLch, lchToHex, parseColor, toHex } from "../src/color/color";
import { stylize } from "../src/color/style";
import {
  PALETTES,
  SCHEMES,
  decodePalette,
  encodePalette,
  makePalette,
  randomPalette,
  resolvePalette,
  type Scheme,
} from "../src/color/palettes";

const HEX = /^#[0-9a-f]{6}$/;
const hueGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe("color", () => {
  it("parses hex, rgb() and hsl()", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("2a9d8f")).toEqual([42, 157, 143]);
    expect(parseColor("rgb(10, 20, 30)")).toEqual([10, 20, 30]);
    expect(toHex(parseColor("hsl(0 100% 50%)")!)).toBe("#ff0000");
    expect(parseColor("tomato")).toBeUndefined();
  });

  it("round-trips through OKLCH", () => {
    for (const c of ["#264653", "#e76f51", "#ffffff", "#000000", "#7a3b52"]) expect(lchToHex(hexToLch(c))).toBe(c);
  });

  it("fits colors sRGB can't show by lowering chroma", () => {
    const out = lchToHex([0.7, 0.4, 145]);
    expect(out).toMatch(HEX);
    const [L, , h] = hexToLch(out);
    expect(L).toBeCloseTo(0.7, 1);
    expect(hueGap(h, 145)).toBeLessThan(4);
  });
});

describe("makePalette", () => {
  it("gives valid colors, dark to light, for every scheme and count", () => {
    for (const scheme of Object.keys(SCHEMES) as Scheme[]) {
      for (let count = 2; count <= 9; count++) {
        const colors = makePalette({ scheme, count, seed: count });
        expect(colors).toHaveLength(count);
        colors.forEach(c => expect(c).toMatch(HEX));
        const ls = colors.map(c => hexToLch(c)[0]);
        for (let k = 1; k < ls.length; k++) expect(ls[k]).toBeGreaterThan(ls[k - 1] - 0.05);
      }
    }
  });

  it("is deterministic and varies with the seed", () => {
    expect(makePalette({ seed: 3 })).toEqual(makePalette({ seed: 3 }));
    expect(makePalette({ seed: 3 })).not.toEqual(makePalette({ seed: 4 }));
  });

  it("includes a base color exactly", () => {
    for (const base of ["#e76f51", "#2a9d8f", "#f2c14e"])
      expect(makePalette({ base, scheme: "triadic" })).toContain(base);
  });

  it("follows the scheme's hues", () => {
    const colors = makePalette({ base: 200, scheme: "complementary", count: 4, vibrance: 0.9 });
    const hues = colors.map(c => hexToLch(c)[2]);
    expect(hues.some(h => hueGap(h, 200) < 30)).toBe(true);
    expect(hues.some(h => hueGap(h, 20) < 30)).toBe(true);
  });

  it("goes grey at zero vibrance and spreads further with more contrast", () => {
    for (const c of makePalette({ vibrance: 0 })) expect(hexToLch(c)[1]).toBeLessThan(0.02);
    const spread = (contrast: number) => {
      const ls = makePalette({ contrast }).map(c => hexToLch(c)[0]);
      return Math.max(...ls) - Math.min(...ls);
    };
    expect(spread(1)).toBeGreaterThan(spread(0.2) + 0.3);
  });

  it("keeps locked colors and leaves the others as they were", () => {
    const free = makePalette({ seed: 9 });
    const locked = makePalette({ seed: 9, locked: [null, "#123456", undefined, null, "#abcdef"] });
    expect(locked[1]).toBe("#123456");
    expect(locked[4]).toBe("#abcdef");
    expect([locked[0], locked[2], locked[3]]).toEqual([free[0], free[2], free[3]]);
  });

  it("rejects unreadable colors", () => {
    expect(() => makePalette({ base: "nope" })).toThrow(/can't read/);
    expect(() => makePalette({ locked: ["nope"] })).toThrow(/can't read/);
  });
});

describe("randomPalette", () => {
  it("is deterministic, varied and valid", () => {
    expect(randomPalette("a")).toEqual(randomPalette("a"));
    const all = Array.from({ length: 50 }, (_, k) => randomPalette(k));
    expect(new Set(all.map(p => p.join())).size).toBe(50);
    all.flat().forEach(c => expect(c).toMatch(HEX));
  });
});

describe("palette codes", () => {
  it("round-trip", () => {
    const colors = ["#264653", "#2a9d8f", "#e9c46a"];
    expect(encodePalette(colors)).toBe("264653-2a9d8f-e9c46a");
    expect(decodePalette("264653-2a9d8f-e9c46a")).toEqual(colors);
    expect(decodePalette("#264653-2A9D8F")).toEqual(["#264653", "#2a9d8f"]);
    expect(decodePalette("sunset")).toBeUndefined();
  });

  it("resolve names, codes and color lists", () => {
    expect(resolvePalette("riso")).toEqual(PALETTES.riso);
    expect(resolvePalette("264653-2a9d8f")).toEqual(["#264653", "#2a9d8f"]);
    expect(resolvePalette(["#fff", "rgb(0,0,0)"])).toEqual(["#ffffff", "#000000"]);
    expect(() => resolvePalette("nope")).toThrow(/neither/);
    expect(() => resolvePalette([])).toThrow(/at least one/);
  });
});

describe("balanced mapping", () => {
  it("uses only the exact palette colors, and more than one of them", () => {
    const palette = makePalette({ seed: 5, scheme: "triadic" });
    const out = stylize(toSvg(hills, { seed: 4 }), { palette, mapping: "balanced" });
    const used = new Set(out.match(/#[0-9a-f]{6}\b/g));
    for (const c of used) expect(palette).toContain(c);
    expect(used.size).toBeGreaterThanOrEqual(3);
  });
});

describe("styling edge cases", () => {
  it("ramps a one-color palette to that one color", () => {
    const svg = stylize(toSvg(hills), { palette: ["#264653"], mapping: "ramp" });
    const fills = [...svg.matchAll(/fill="(#[0-9a-f]{6}|hsl\([^)]*\))"/g)].map(m => m[1]);
    expect(fills.length).toBeGreaterThan(0);
    expect(new Set(fills)).toEqual(new Set(["#264653"]));
  });

  it("leaves text that looks like a color as written", () => {
    for (const palette of ["pastel", "sunset"]) {
      expect(render(owl, { label: "#100", palette }).svg).toContain(">#100</text>");
    }
  });

  it("adds texture to markup that ends in a newline", () => {
    const svg = stylize(`${toSvg(hills)}\n`, { texture: "grain" });
    expect(svg).toContain("feTurbulence");
    expect(svg.endsWith("</svg>\n")).toBe(true);
  });

  it("doesn't take names from an object's prototype for palettes", () => {
    expect(() => resolvePalette("constructor")).toThrow(/neither a palette name/);
  });
});
