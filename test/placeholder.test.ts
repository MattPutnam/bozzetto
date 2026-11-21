import { describe, expect, it } from "vitest";
import {
  animals,
  categories,
  donut,
  hills,
  kinds,
  owl,
  placeholder,
  placeholders,
  placeholderSvg,
  resolveKind,
  resolveSize,
  seedToInt,
  toDataUri,
  toSvg,
} from "../src";

const decode = (uri: string) => decodeURIComponent(uri.slice(uri.indexOf(",") + 1));
const sizeOf = (uri: string) => /width="([\d.]+)" height="([\d.]+)"/.exec(decode(uri))!.slice(1).join("x");
/** Which kind drew each picture of a `placeholders` list, given its base seed: picture k uses seed + k. */
const kindsIn = (uris: string[], seed = 1) =>
  uris.map((uri, k) => {
    const size = sizeOf(uri) as `${number}x${number}`;
    return kinds.find(kind => toSvg(kind, { size, seed: seed + k }) === decode(uri))?.id;
  });

describe("categories", () => {
  it("cover every kind exactly once", () => {
    const listed = Object.values(categories).flat();
    expect(listed).toHaveLength(kinds.length);
    expect(new Set(listed.map(k => k.id)).size).toBe(kinds.length);
  });
});

describe("sizes", () => {
  it("accept strings and objects", () => {
    expect(resolveSize("320x240")).toEqual({ width: 320, height: 240 });
    expect(resolveSize({ width: 10, height: 20 })).toEqual({ width: 10, height: 20 });
    expect(resolveSize()).toEqual({ width: 400, height: 300 });
    expect(toSvg(hills, { size: "320x240" })).toContain('width="320" height="240"');
  });

  it("reject anything else", () => {
    // @ts-expect-error: not a size
    expect(() => resolveSize("big")).toThrow(/isn't a size/);
    expect(() => resolveSize({ width: 0, height: 10 })).toThrow(/isn't a size/);
  });
});

describe("seeds, ids and labels", () => {
  it("accept string seeds", () => {
    expect(seedToInt("user-42")).toBe(seedToInt("user-42"));
    expect(seedToInt("user-42")).not.toBe(seedToInt("user-43"));
  });

  it("give each picture its own element ids", () => {
    const a = toSvg(hills, { seed: 1 }).match(/id="([^"]+)"/)?.[1];
    const b = toSvg(hills, { seed: 2 }).match(/id="([^"]+)"/)?.[1];
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it("draw and escape labels", () => {
    expect(toSvg(hills, { label: 3 })).toContain(">3</text>");
    expect(toSvg(hills, { label: "<b>" })).toContain("&#60;b&#62;");
  });
});

describe("placeholder", () => {
  it("returns a data URI or markup", () => {
    expect(placeholder({ kind: "owl", seed: 1 })).toBe(toDataUri(owl, { seed: 1 }));
    expect(placeholderSvg({ kind: hills, seed: 5 })).toBe(toSvg(hills, { seed: 5 }));
  });

  it("chooses from nested lists of kinds, ids and categories", () => {
    const pool = new Set([...animals.map(k => k.id), "donut"]);
    for (let seed = 0; seed < 60; seed++) expect(pool).toContain(resolveKind([animals, "donut"], seed).id);
    const seen = new Set(Array.from({ length: 300 }, (_, seed) => resolveKind(undefined, seed).id));
    expect(seen.size).toBe(kinds.length);
  });

  it("passes style options through", () => {
    expect(placeholder({ kind: hills, seed: 2, palette: "pastel" })).toBe(
      toDataUri(hills, { seed: 2, palette: "pastel" }),
    );
  });

  it("rejects unknown kinds and empty lists", () => {
    expect(() => placeholder({ kind: "dragon" })).toThrow(/unknown kind "dragon"/);
    expect(() => placeholder({ kind: [] })).toThrow(/empty list/);
  });
});

describe("placeholders", () => {
  it("is stable as the list grows", () => {
    const five = placeholders(5, { kind: animals, seed: 10 });
    expect(placeholders(8, { kind: animals, seed: 10 }).slice(0, 5)).toEqual(five);
  });

  it("shuffles: every kind once per round, in a seeded order", () => {
    const pool = [animals, donut];
    const n = animals.length + 1;
    const ids = kindsIn(placeholders(n * 2, { kind: pool, seed: 3 }), 3);
    expect(new Set(ids.slice(0, n)).size).toBe(n);
    expect(new Set(ids.slice(n)).size).toBe(n);
    expect(ids.slice(0, n)).not.toEqual(ids.slice(n));
  });

  it("cycles in the order given", () => {
    const ids = kindsIn(placeholders(6, { kind: [hills, owl, donut], order: "cycle" }));
    expect(ids).toEqual(["hills", "owl", "donut", "hills", "owl", "donut"]);
  });

  it("goes through a list of sizes", () => {
    const sizes = ["400x300", "300x400", "300x300"] as const;
    const got = placeholders(6, { kind: hills, size: sizes, order: "cycle" }).map(sizeOf);
    expect(got).toEqual([...sizes, ...sizes]);
    const shuffled = placeholders(6, { kind: hills, size: sizes }).map(sizeOf);
    expect(new Set(shuffled.slice(0, 3)).size).toBe(3);
  });

  it("tells one palette of colors from a list of palettes", () => {
    const colors = ["#264653", "#e76f51", "#e9c46a"];
    const onePalette = placeholders(3, { kind: hills, palette: colors, order: "cycle" });
    expect(onePalette).toEqual([0, 1, 2].map(k => toDataUri(hills, { seed: 1 + k, palette: colors })));
    const twoPalettes = placeholders(2, { kind: hills, palette: ["pastel", colors], order: "cycle" });
    expect(twoPalettes[0]).toBe(toDataUri(hills, { seed: 1, palette: "pastel" }));
    expect(twoPalettes[1]).toBe(toDataUri(hills, { seed: 2, palette: colors }));
  });

  it("picks randomly but deterministically", () => {
    const a = placeholders(10, { kind: animals, order: "random", seed: 4 });
    expect(placeholders(10, { kind: animals, order: "random", seed: 4 })).toEqual(a);
  });

  it("numbers pictures on request", () => {
    const [first, second] = placeholders(2, { kind: hills, numbered: true });
    expect(decode(first)).toContain(">1</text>");
    expect(decode(second)).toContain(">2</text>");
  });
});
