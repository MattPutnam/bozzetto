import { describe, expect, it } from "vitest";
import { cat, defineKind, hills, kinds, placeholders, portrait, render } from "../src";

const SEEDS = Array.from({ length: 40 }, (_, k) => k * 7919 + 1);
const withOptions = kinds.filter(k => Object.keys(k.options).length > 0);

describe("kind options", () => {
  it("are offered by some kinds, and described as data", () => {
    expect(withOptions.map(k => k.id).sort()).toEqual([
      "airplane",
      "astronaut",
      "beach",
      "bear",
      "bridge",
      "bus",
      "cat",
      "cottage",
      "dolphin",
      "dots",
      "flamingo",
      "greenhouse",
      "guitar",
      "hills",
      "hockey",
      "lamp",
      "lion",
      "night",
      "piano",
      "pizza",
      "portrait",
      "record",
      "rocket",
      "seal",
      "skateboard",
      "snowman",
      "surfboard",
      "walker",
      "windmill",
    ]);
    expect(cat.options).toEqual({ tabby: [true, false], muzzle: [true, false], pupils: ["slit", "round"] });
    expect(Object.keys(render(cat).options).sort()).toEqual(["muzzle", "pupils", "tabby"]);
  });

  describe.each(withOptions.map(k => [k.id, k] as const))("%s", (_, kind) => {
    it("takes each value it allows, and leaves its other options as the seed chose them", () => {
      for (const [option, values] of Object.entries(kind.options)) {
        for (const value of values) {
          const variant = kind.with({ [option]: value });
          for (const seed of SEEDS) {
            const base = render(kind, { seed }).options;
            const fixed = render(variant, { seed }).options;
            expect(fixed[option], `${option}=${value} seed ${seed}`).toBe(value);
            for (const other of Object.keys(kind.options).filter(o => o !== option)) {
              expect(fixed[other], `${option}=${value} moved ${other} at seed ${seed}`).toBe(base[other]);
            }
          }
        }
      }
    });

    it("draws the same picture when an option is fixed to the seed's own choice", () => {
      const strip = (svg: string) => svg.replace(/bz[a-z0-9]+-/g, "");
      for (const seed of SEEDS) {
        const base = render(kind, { seed });
        expect(strip(render(kind.with(base.options), { seed }).svg)).toBe(strip(base.svg));
      }
    });

    it("draws clean markup with any option fixed", () => {
      for (const [option, values] of Object.entries(kind.options)) {
        for (const value of values) {
          for (const size of ["400x300", "300x400"] as const) {
            expect(render(kind.with({ [option]: value }), { seed: 5, size }).svg).not.toMatch(/NaN|undefined|Infinity/);
          }
        }
      }
    });
  });

  it("show in the alt text", () => {
    for (const seed of SEEDS.slice(0, 10)) {
      expect(render(cat.with({ tabby: true, pupils: "round" }), { seed }).alt).toMatch(
        /^A tabby cat's face.*round pupils/,
      );
      expect(render(portrait.with({ hair: "curly", glasses: true }), { seed }).alt).toMatch(/curly hair.*glasses/);
    }
  });

  it("chain and merge", () => {
    const variant = cat.with({ tabby: true }).with({ pupils: "round" });
    expect(variant.fixed).toEqual({ tabby: true, pupils: "round" });
    expect(variant.id).toBe("cat");
    expect(cat.fixed).toEqual({});
  });

  it("leave a kind unchanged when none are given", () => {
    expect(render(cat.with({}), { seed: 3 }).svg).toBe(render(cat, { seed: 3 }).svg);
  });

  it("give variants their own element ids, so they can share a page", () => {
    const ids = (svg: string) => [...svg.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    const plain = ids(render(hills, { seed: 3 }).svg);
    const variant = ids(render(hills.with({ tree: true }), { seed: 3 }).svg);
    expect(plain.length).toBeGreaterThan(0);
    expect(variant.some(id => plain.includes(id))).toBe(false);
  });

  it("reject values and names a kind doesn't have", () => {
    // @ts-expect-error: not one of the allowed values
    expect(() => cat.with({ pupils: "plaid" })).toThrow(/cat's pupils can be "slit", "round", not "plaid"/);
    // @ts-expect-error: not an option of cat
    expect(() => cat.with({ wings: true })).toThrow(/cat has no option "wings". Its options are tabby, muzzle, pupils/);
  });

  it("work in lists of kinds", () => {
    const pictures = placeholders(4, {
      kind: [cat.with({ tabby: true }), hills.with({ tree: false })],
      order: "cycle",
    });
    expect(pictures.map(p => [p.kind, p.options.tabby ?? p.options.tree])).toEqual([
      ["cat", true],
      ["hills", false],
      ["cat", true],
      ["hills", false],
    ]);
  });

  it("work for your own kinds", () => {
    const flag = defineKind("flag", "Flag", { stripes: [2, 3] }, (r, w, h, note) => {
      const stripes = r.option("stripes", r.pick([2, 3]));
      note.alt(`A flag with ${stripes} stripes`);
      return `<rect width="${w}" height="${h}" fill="#eee"/>`;
    });
    expect(render(flag.with({ stripes: 3 })).alt).toBe("A flag with 3 stripes");
    expect(render(flag.with({ stripes: 3 })).options).toEqual({ stripes: 3 });
  });
});
