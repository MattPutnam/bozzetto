import { describe, expect, it } from "vitest";
import {
  animals,
  cat,
  categories,
  donut,
  hills,
  kinds,
  owl,
  placeholder,
  placeholders,
  defineKind,
  render,
  resolveKind,
  resolveSize,
  seedToInt,
  toDataUri,
  toSvg,
} from "../src";

// Color words, except where they name a thing: "an orange" (the fruit), "ice cream" or "cream" on a cake, and
// "chocolate chip" cookies.
const COLOR_WORDS =
  /\b(red|yellow|green|blue|purple|violet|pink|brown|black|white|grey|gray|golden|gold|silver|teal|navy|tan|beige|crimson|scarlet|turquoise)\b|\bchocolate\b(?! chip)|(?<!\ban )\borange\b/i;

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

describe("pictures", () => {
  it("carry their source, markup, size and kind", () => {
    const picture = render(owl, { seed: 1, size: "320x240" });
    expect(picture.src).toBe(toDataUri(owl, { seed: 1, size: "320x240" }));
    expect(picture.svg).toBe(toSvg(owl, { seed: 1, size: "320x240" }));
    expect(picture).toMatchObject({ width: 320, height: 240, kind: "owl" });
  });

  it("describe themselves for every kind, without naming colors", () => {
    for (const kind of kinds) {
      for (const size of ["400x300", "300x400"] as const) {
        for (let seed = 1; seed <= 25; seed++) {
          const { alt, focus, color } = render(kind, { seed, size });
          expect(alt, `${kind.id} seed ${seed}`).toMatch(/^[A-Z]/);
          expect(alt, `${kind.id} seed ${seed}`).not.toMatch(/\.$/);
          // "Black hole" names a thing, not a color.
          expect(alt.replace(/\bblack holes?\b/gi, ""), `${kind.id} seed ${seed}: "${alt}"`).not.toMatch(COLOR_WORDS);
          expect(focus.x).toBeGreaterThanOrEqual(0);
          expect(focus.x).toBeLessThanOrEqual(1);
          expect(focus.y).toBeGreaterThanOrEqual(0);
          expect(focus.y).toBeLessThanOrEqual(1);
          expect(color).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it("give every kind real alt text that varies with the seed", () => {
    for (const kind of kinds) {
      const alts = new Set(Array.from({ length: 40 }, (_, seed) => render(kind, { seed }).alt));
      expect(
        [...alts].some(alt => alt !== kind.name),
        kind.id,
      ).toBe(true);
    }
  });

  it("fall back to the kind's name and the center", () => {
    const dot = defineKind("dot", "Dot", (_, w, h) => `<rect width="${w}" height="${h}" fill="#abcdef"/>`);
    expect(render(dot)).toMatchObject({ alt: "Dot", focus: { x: 0.5, y: 0.5 }, color: "#abcdef" });
  });

  it("report the background after a palette is applied", () => {
    const plain = render(hills, { seed: 3 }).color;
    expect(render(hills, { seed: 3, palette: "grayscale" }).color).not.toBe(plain);
  });
});

describe("placeholder", () => {
  it("returns a picture", () => {
    expect(placeholder({ kind: "owl", seed: 1 })).toEqual(render(owl, { seed: 1 }));
  });

  it("chooses from nested lists of kinds, ids and categories", () => {
    const pool = new Set([...animals.map(k => k.id), "donut"]);
    for (let seed = 0; seed < 60; seed++) expect(pool).toContain(resolveKind([animals, "donut"], seed).id);
    const seen = new Set(Array.from({ length: 2000 }, (_, seed) => resolveKind(undefined, seed).id));
    expect(seen.size).toBe(kinds.length);
  });

  it("passes style options through", () => {
    expect(placeholder({ kind: hills, seed: 2, palette: "pastel" }).src).toBe(
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
    const ids = placeholders(n * 2, { kind: pool, seed: 3 }).map(p => p.kind);
    expect(new Set(ids.slice(0, n)).size).toBe(n);
    expect(new Set(ids.slice(n)).size).toBe(n);
    expect(ids.slice(0, n)).not.toEqual(ids.slice(n));
  });

  it("cycles in the order given", () => {
    const ids = placeholders(6, { kind: [hills, owl, donut], order: "cycle" }).map(p => p.kind);
    expect(ids).toEqual(["hills", "owl", "donut", "hills", "owl", "donut"]);
  });

  it("goes through a list of sizes", () => {
    const sizes = ["400x300", "300x400", "300x300"] as const;
    const sizeOf = (p: { width: number; height: number }) => `${p.width}x${p.height}`;
    const got = placeholders(6, { kind: hills, size: sizes, order: "cycle" }).map(sizeOf);
    expect(got).toEqual([...sizes, ...sizes]);
    const shuffled = placeholders(6, { kind: hills, size: sizes }).map(sizeOf);
    expect(new Set(shuffled.slice(0, 3)).size).toBe(3);
  });

  it("tells one palette of colors from a list of palettes", () => {
    const colors = ["#264653", "#e76f51", "#e9c46a"];
    const onePalette = placeholders(3, { kind: hills, palette: colors, order: "cycle" });
    expect(onePalette.map(p => p.src)).toEqual([0, 1, 2].map(k => toDataUri(hills, { seed: 1 + k, palette: colors })));
    const twoPalettes = placeholders(2, { kind: hills, palette: ["pastel", colors], order: "cycle" });
    expect(twoPalettes[0].src).toBe(toDataUri(hills, { seed: 1, palette: "pastel" }));
    expect(twoPalettes[1].src).toBe(toDataUri(hills, { seed: 2, palette: colors }));
  });

  it("keeps original colors and no texture for undefined in a list", () => {
    const [plain, pastel] = placeholders(2, { kind: hills, palette: [undefined, "pastel"], order: "cycle" });
    expect(plain.src).toBe(toDataUri(hills, { seed: 1 }));
    expect(pastel.src).toBe(toDataUri(hills, { seed: 2, palette: "pastel" }));
    const [smooth, grainy] = placeholders(2, { kind: hills, texture: [undefined, "grain"], order: "cycle" });
    expect(smooth.svg).not.toContain("feTurbulence");
    expect(grainy.svg).toContain("feTurbulence");
  });

  it("picks randomly but deterministically", () => {
    const a = placeholders(10, { kind: animals, order: "random", seed: 4 });
    expect(placeholders(10, { kind: animals, order: "random", seed: 4 })).toEqual(a);
  });

  it("numbers pictures on request", () => {
    const [first, second] = placeholders(2, { kind: hills, numbered: true });
    expect(first.svg).toContain(">1</text>");
    expect(second.svg).toContain(">2</text>");
  });
});

describe("choosing kinds as the list grows", () => {
  const extra = defineKind("new-kind", "New kind", () => "");
  const seeds = Array.from({ length: 3000 }, (_, k) => k);

  it("keeps every seed's kind unless the new kind wins it", () => {
    let moved = 0;
    for (const seed of seeds) {
      const before = placeholder({ seed }).kind;
      const after = placeholder({ seed, kind: [kinds, extra] }).kind;
      if (after !== before) {
        expect(after).toBe("new-kind");
        moved++;
      }
    }
    // About one seed in (kinds + 1) goes to the new kind.
    expect(moved).toBeGreaterThan(0);
    expect(moved).toBeLessThan((seeds.length / kinds.length) * 2);
  });

  it("keeps a shuffled list's order, with the new kind slotted in", () => {
    const before = placeholders(30, { seed: 4 }).map(p => p.kind);
    const after = placeholders(31, { seed: 4, kind: [kinds, extra] })
      .map(p => p.kind)
      .filter(id => id !== "new-kind");
    expect(after.slice(0, 30)).toEqual(before);
  });
});

describe("edge cases", () => {
  it("rejects unknown names instead of drawing something else", () => {
    expect(() => render(owl, { texture: "grainy" as never })).toThrow('texture can be grain, paper, not "grainy"');
    expect(() => render(owl, { palette: "riso", mapping: "bogus" as never })).toThrow(
      "mapping can be balanced, ramp, nearest",
    );
    expect(() => placeholders(2, { order: "bogus" as never })).toThrow("order can be shuffle, cycle, random");
    expect(() => placeholders(2, { texture: [undefined, "rough" as never] })).toThrow('not "rough"');
  });

  it("rejects a count that isn't a whole number of at least 0", () => {
    for (const count of [NaN, -1, 2.5]) expect(() => placeholders(count), String(count)).toThrow(/count must be/);
    expect(placeholders(0)).toEqual([]);
  });

  it("keeps the label white and on top, whatever the palette, texture or dark mode", () => {
    for (const options of [
      { palette: "dusk" },
      { palette: ["#000", "#333"] },
      { texture: "paper" },
      { dark: true },
    ] as const) {
      const svg = render(owl, { seed: 2, label: 3, ...options }).svg;
      expect(svg, JSON.stringify(options)).toMatch(/<text [^>]*fill="#fff"[^>]*>3<\/text><\/svg>$/);
    }
  });

  it("finds the background color at sizes that aren't whole numbers", () => {
    for (const kind of kinds) {
      const picture = render(kind, { size: "400.04x300.02" });
      const full = /<rect (?:x="0" y="0" )?width="400" height="300" fill="(#[0-9a-f]{6}|hsl\([^)]*\))"/.exec(
        picture.svg,
      );
      if (full?.[1].startsWith("#")) expect(picture.color, kind.id).toBe(full[1]);
    }
  });

  it("leaves a picture plain when dark mode is off", () => {
    const plain = render(owl).svg;
    expect(render(owl, { dark: false }).svg).toBe(plain);
    expect(render(owl, { darkSelector: ".dark" }).svg).toBe(plain);
    expect(render(owl, { mapping: "ramp" }).svg).toBe(plain);
    expect(placeholders(3, { dark: false })).toEqual(placeholders(3));
  });

  it("picks a kind listed twice twice as often", () => {
    const picks = Array.from({ length: 3000 }, (_, seed) => resolveKind([cat, cat, donut], seed).id);
    const share = picks.filter(id => id === "cat").length / picks.length;
    expect(share).toBeGreaterThan(0.6);
    expect(share).toBeLessThan(0.73);
  });
});
