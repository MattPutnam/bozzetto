/** Choosing kinds and options for one picture or a whole list. */
import { checkOneOf, hash, makeRand, seedToInt, type Kind } from "../draw/core";
import { parseColor } from "../color/color";
import { render, type Picture, type RenderOptions, type Size } from "./render";
import type { Mapping, Texture } from "../color/style";
import type { PaletteSpec } from "../color/palettes";

/**
 * What to draw: a kind, a kind's id, or a list of them. Lists can nest, so categories mix with
 * single kinds: `[animals, donut]` is every animal plus the donut. A kind listed twice comes up twice
 * as often: `[animals, owl]` favors the owl. A string is a built-in kind's id
 * (`"ice-cream"`), not an export or category name: pass the category itself (`animals`).
 *
 * @category Choosing kinds
 */
export type KindChoice = Kind | string | readonly KindChoice[];

/** Every kind a choice stands for, flattened, with ids looked up in `known`. */
export function kindsOf(choice: KindChoice, known: ReadonlyMap<string, Kind>): Kind[] {
  if (typeof choice === "string") {
    const kind = known.get(choice);
    if (!kind) throw new Error(`bozzetto: unknown kind "${choice}". Known kinds: ${[...known.keys()].join(", ")}.`);
    return [kind];
  }
  if (Array.isArray(choice)) return choice.flatMap(c => kindsOf(c, known));
  return [choice as Kind];
}

/**
 * How `placeholders` goes through a list of values (kinds, sizes, palettes and so on):
 * - `shuffle` (default): every value once, in a seeded order, then again in a new order.
 * - `cycle`: every value once, in the order given, and around again.
 * - `random`: an independent seeded pick each time, so values can repeat or be skipped.
 *
 * @category Choosing kinds
 */
export type Order = "shuffle" | "cycle" | "random";

/** Every order. */
export const ORDERS: readonly Order[] = ["shuffle", "cycle", "random"];

/** Picks value `k` of a list for one option, deterministically from the seed and the option's name. */
function picker<T>(values: readonly T[], order: Order, seed: number, name: string): (k: number) => T {
  const salt = seed ^ hash(name);
  if (values.length === 1) return () => values[0];
  if (order === "cycle") return k => values[k % values.length];
  if (order === "random")
    return k => values[Math.floor(makeRand((salt + Math.imul(k, 0x9e3779b1)) >>> 0).next() * values.length)];
  const rounds = new Map<number, T[]>();
  return k => {
    const round = Math.floor(k / values.length);
    let shuffled = rounds.get(round);
    if (!shuffled) {
      // Fisher–Yates, seeded per round, so picture k never depends on how many pictures are asked for.
      const rand = makeRand((salt + Math.imul(round + 1, 0x85ebca6b)) >>> 0);
      shuffled = [...values];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rand.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      rounds.set(round, shuffled);
    }
    return shuffled[k % values.length];
  };
}

const many = <T>(value: T | readonly T[] | undefined): readonly (T | undefined)[] =>
  value === undefined ? [undefined] : Array.isArray(value) ? (value as readonly T[]) : [value as T];

/**
 * The palettes a `palette` option stands for. A list whose items are all colors is one palette;
 * any other list is several palettes (names, codes, or lists of colors).
 */
function palettesOf(
  value: PaletteSpec | readonly (PaletteSpec | undefined)[] | undefined,
): readonly (PaletteSpec | undefined)[] {
  if (value === undefined || typeof value === "string") return [value];
  const isOnePalette = value.every(item => typeof item === "string" && parseColor(item) !== undefined);
  return isOnePalette ? [value as PaletteSpec] : (value as readonly (PaletteSpec | undefined)[]);
}

/** Murmur3's finalizer: mixes a 32-bit number so every bit of it moves every bit of the result. */
function mix32(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Picks kinds by rendezvous hashing: under a seed, every kind gets a score from its own key, and
 * the highest score wins. A kind's score never depends on the rest of the list, so adding kinds (to
 * the package, a category, or your own list) only changes the seeds a new kind wins, and every
 * other seed keeps its kind. Shuffles sort by score, so a new kind slots in without reordering the rest.
 */
function kindPicker(kinds: readonly Kind[], order: Order, seed: number): (k: number) => Kind {
  if (kinds.length === 1) return () => kinds[0];
  if (order === "cycle") return k => kinds[k % kinds.length];
  // A kind's key is its id plus any options fixed with `with`, so `cat` and `cat.with(…)` differ. A
  // kind listed again gets a key of its own for each repeat, so `[cat, cat, dog]` picks cat twice as often.
  const copies = new Map<string, number>();
  const keys = kinds.map(kind => {
    const key = Object.keys(kind.fixed).length ? kind.id + JSON.stringify(kind.fixed) : kind.id;
    const copy = copies.get(key) ?? 0;
    copies.set(key, copy + 1);
    return hash(copy ? `${key}#${copy}` : key);
  });
  const best = (salt: number): number => {
    let top = 0;
    let topScore = -1;
    for (let i = 0; i < kinds.length; i++) {
      const score = mix32(keys[i] ^ salt);
      if (score > topScore) [top, topScore] = [i, score];
    }
    return top;
  };
  if (order === "random") return k => kinds[best(mix32((seed + Math.imul(k + 1, 0x9e3779b1)) >>> 0))];
  const rounds = new Map<number, Kind[]>();
  return k => {
    const round = Math.floor(k / kinds.length);
    let sorted = rounds.get(round);
    if (!sorted) {
      const salt = mix32((seed + Math.imul(round + 1, 0x85ebca6b)) >>> 0);
      const scores = keys.map(key => mix32(key ^ salt));
      sorted = kinds
        .map((kind, i) => ({ kind, i }))
        .sort((a, b) => scores[b.i] - scores[a.i] || a.i - b.i)
        .map(({ kind }) => kind);
      rounds.set(round, sorted);
    }
    return sorted[k % kinds.length];
  };
}

/**
 * How to draw one placeholder: as for `render`, plus the kinds to choose from.
 *
 * @category Choosing kinds
 */
export interface PlaceholderOptions extends RenderOptions {
  /** Default: any kind, chosen by the seed. */
  kind?: KindChoice;
}

/**
 * A value, or a list of values that `placeholders` goes through picture by picture.
 *
 * @category Choosing kinds
 */
export type OneOrMany<T> = T | readonly T[];

/**
 * How to draw a list of placeholders: each option takes one value or a list to go through.
 *
 * @category Choosing kinds
 */
export interface PlaceholdersOptions {
  /** Default: every kind. */
  kind?: KindChoice;
  /** Default `"400x300"`. A list mixes sizes, for example `["400x300", "300x400", "300x300"]`. */
  size?: OneOrMany<Size>;
  /**
   * A palette, or a list of palettes. A list made only of colors is a single palette:
   * `["#264653", "#e76f51"]` is one palette, `["pastel", "riso"]` is two. `undefined` in a list
   * keeps those pictures' own colors: `[undefined, "pastel"]` alternates original and pastel.
   */
  palette?: PaletteSpec | readonly (PaletteSpec | undefined)[];
  /** A mapping, or a list of them, as for `StyleOptions.mapping`. */
  mapping?: OneOrMany<Mapping>;
  /** A texture, or a list; `undefined` in a list leaves those pictures plain. */
  texture?: Texture | readonly (Texture | undefined)[];
  /** Picture k uses seed `seed + k`, so a list grows without changing the pictures already in it. Default 1. */
  seed?: number | string;
  /** Number the pictures 1, 2, 3… in the corner. */
  numbered?: boolean;
  /** Build a dark-mode version into every picture: `true` for the `dim` adjustment, or a palette. */
  dark?: boolean | PaletteSpec;
  /** Use the dark colors under this selector instead of the system setting, for inline SVG on pages with their own theme switch. */
  darkSelector?: string;
  /** How lists of values are gone through. Default `shuffle`. */
  order?: Order;
}

/** Throws unless `count` is a whole number of at least 0, so a bad count isn't an empty list. */
function checkCount(count: number): void {
  if (!(Number.isInteger(count) && count >= 0))
    throw new Error(`bozzetto: the count must be a whole number of at least 0, not ${count}.`);
}

/** Builds the functions behind `placeholder` and `placeholders` for a set of known kinds. */
export function makePlaceholders(all: readonly Kind[]) {
  const known = new Map(all.map(k => [k.id, k]));
  const pool = (choice: KindChoice | undefined) => {
    const list = choice === undefined ? all : kindsOf(choice, known);
    if (list.length === 0) throw new Error("bozzetto: `kind` is an empty list.");
    return list;
  };

  /** The kind a seed picks from a choice. The same seed always picks the same kind. */
  const resolveKind = (choice: KindChoice | undefined, seed: number | string = 1): Kind => {
    return kindPicker(pool(choice), "random", mix32(seedToInt(seed) ^ 0x9e3779b9))(0);
  };

  /** One picture, its kind chosen by the seed when given a list. */
  const placeholder = (options: PlaceholderOptions = {}): Picture =>
    render(resolveKind(options.kind, options.seed), options);

  /** `count` pictures, going through each option's list of values. */
  const placeholders = (count: number, options: PlaceholdersOptions = {}): Picture[] => {
    checkCount(count);
    checkOneOf(options.order, ORDERS, "order");
    const base = seedToInt(options.seed);
    const order = options.order ?? "shuffle";
    const kindAt = kindPicker(pool(options.kind), order, base);
    const sizeAt = picker(many(options.size), order, base, "size");
    const paletteAt = picker(palettesOf(options.palette), order, base, "palette");
    const mappingAt = picker(many(options.mapping), order, base, "mapping");
    const textureAt = picker(many(options.texture), order, base, "texture");
    return Array.from({ length: count }, (_, k) =>
      render(kindAt(k), {
        size: sizeAt(k),
        palette: paletteAt(k),
        mapping: mappingAt(k),
        texture: textureAt(k),
        seed: (base + k) >>> 0,
        label: options.numbered ? k + 1 : undefined,
        dark: options.dark,
        darkSelector: options.darkSelector,
      }),
    );
  };

  /** The kinds `placeholders` would use for `count` pictures: the same order, for lists of other things. */
  const kindsFor = (count: number, options: { kind?: KindChoice; order?: Order; seed?: number | string } = {}) => {
    checkCount(count);
    checkOneOf(options.order, ORDERS, "order");
    const kindAt = kindPicker(pool(options.kind), options.order ?? "shuffle", seedToInt(options.seed));
    return Array.from({ length: count }, (_, k) => kindAt(k));
  };

  return { resolveKind, kindsFor, placeholder, placeholders };
}
