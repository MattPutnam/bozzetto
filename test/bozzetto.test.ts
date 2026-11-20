import { describe, expect, it } from "vitest";
import {
  families,
  hills,
  kinds,
  owl,
  placeholder,
  placeholders,
  placeholderSvg,
  resolveKind,
  seedToInt,
  toDataUri,
  toSvg,
} from "../src";

const SEEDS = Array.from({ length: 200 }, (_, k) => k * 7919 + 1);
const SIZES: [number, number][] = [
  [400, 300],
  [300, 400],
  [256, 256],
  [960, 240],
];

describe.each(kinds.map(k => [k.id, k] as const))("%s", (_, kind) => {
  it("draws clean markup at every size and seed", () => {
    for (const [width, height] of SIZES) {
      for (const seed of SEEDS) {
        const svg = toSvg(kind, { width, height, seed });
        expect(svg).not.toMatch(/NaN|undefined|Infinity|\[object/);
        expect(svg.startsWith("<svg ")).toBe(true);
        expect(svg.endsWith("</svg>")).toBe(true);
      }
    }
  });

  it("is deterministic", () => {
    expect(toSvg(kind, { seed: 42 })).toBe(toSvg(kind, { seed: 42 }));
  });

  it("varies with the seed", () => {
    const distinct = new Set(SEEDS.slice(0, 20).map(seed => toSvg(kind, { seed })));
    expect(distinct.size).toBeGreaterThanOrEqual(18);
  });

  it("stays small", () => {
    const sizes = SEEDS.map(seed => toDataUri(kind, { seed }).length);
    expect(Math.max(...sizes)).toBeLessThan(12_000);
  });

  it("closes every group it opens", () => {
    const svg = toSvg(kind, { seed: 7 });
    expect((svg.match(/<g[ >]/g) ?? []).length).toBe((svg.match(/<\/g>/g) ?? []).length);
  });
});

describe("element ids", () => {
  it("differ between pictures so inline SVGs can share a page", () => {
    const a = toSvg(hills, { seed: 1 }).match(/id="([^"]+)"/)?.[1];
    const b = toSvg(hills, { seed: 2 }).match(/id="([^"]+)"/)?.[1];
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
});

describe("seeds", () => {
  it("accept strings", () => {
    expect(seedToInt("user-42")).toBe(seedToInt("user-42"));
    expect(seedToInt("user-42")).not.toBe(seedToInt("user-43"));
    expect(toSvg(owl, { seed: "abc" })).toBe(toSvg(owl, { seed: "abc" }));
  });
});

describe("labels", () => {
  it("are drawn and escaped", () => {
    expect(toSvg(hills, { label: 3 })).toContain(">3</text>");
    expect(toSvg(hills, { label: "<b>" })).toContain("&#60;b&#62;");
  });
});

describe("placeholder", () => {
  it("returns a data URI", () => {
    expect(placeholder({ kind: "owl", seed: 1 })).toBe(toDataUri(owl, { seed: 1 }));
  });

  it("chooses within a family", () => {
    for (const family of families) {
      for (const seed of SEEDS.slice(0, 30)) expect(resolveKind(family, seed).family).toBe(family);
    }
  });

  it("chooses from every kind when none is given", () => {
    const seen = new Set(SEEDS.map(seed => resolveKind(undefined, seed).id));
    expect(seen.size).toBe(kinds.length);
  });

  it("chooses from a list", () => {
    for (const seed of SEEDS.slice(0, 30)) expect(["cat", "owl"]).toContain(resolveKind(["cat", owl], seed).id);
  });

  it("rejects unknown kinds", () => {
    // @ts-expect-error: not a kind
    expect(() => placeholder({ kind: "dragon" })).toThrow(/unknown kind "dragon"/);
  });

  it("can return markup", () => {
    expect(placeholderSvg({ kind: "hills", seed: 5 })).toBe(toSvg(hills, { seed: 5 }));
  });
});

describe("placeholders", () => {
  it("returns a stable, growable list", () => {
    const five = placeholders(5, { kind: "landscape", seed: 10 });
    const eight = placeholders(8, { kind: "landscape", seed: 10 });
    expect(five).toHaveLength(5);
    expect(eight.slice(0, 5)).toEqual(five);
    expect(new Set(eight).size).toBe(8);
  });

  it("numbers pictures on request", () => {
    const [first, second] = placeholders(2, { kind: "hills", numbered: true });
    expect(decodeURIComponent(first)).toContain(">1</text>");
    expect(decodeURIComponent(second)).toContain(">2</text>");
  });
});
