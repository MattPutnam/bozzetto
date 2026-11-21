/** Choosing kinds and options for one picture or a whole list. */
import { hash, makeRand, seedToInt, type Kind } from "./core";
import { parseColor } from "./color";
import { render, type Picture, type RenderOptions, type Size } from "./render";
import type { Mapping, Texture } from "./style";
import type { PaletteSpec } from "./palettes";

/**
 * What to draw: a kind, a kind's id, or a list of them. Lists can nest, so categories mix with
 * single kinds: `[animals, donut]` is every animal plus the donut.
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
 */
export type Order = "shuffle" | "cycle" | "random";

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

export interface PlaceholderOptions extends RenderOptions {
  /** Default: any kind, chosen by the seed. */
  kind?: KindChoice;
}

/** A value, or a list of values that `placeholders` goes through picture by picture. */
export type OneOrMany<T> = T | readonly T[];

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
  mapping?: OneOrMany<Mapping>;
  /** A texture, or a list; `undefined` in a list leaves those pictures plain. */
  texture?: Texture | readonly (Texture | undefined)[];
  /** Picture k uses seed `seed + k`, so a list grows without changing the pictures already in it. Default 1. */
  seed?: number | string;
  /** Number the pictures 1, 2, 3… in the corner. */
  numbered?: boolean;
  /** Build a dark-mode version into every picture: `true` for the `dim` adjustment, or a palette. */
  dark?: boolean | PaletteSpec;
  /** Also use the dark colors under this selector, for inline SVG on pages with their own theme switch. */
  darkSelector?: string;
  /** How lists of values are gone through. Default `shuffle`. */
  order?: Order;
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
    const list = pool(choice);
    return list.length === 1 ? list[0] : list[Math.floor(makeRand(seedToInt(seed) ^ 0x9e3779b9).next() * list.length)];
  };

  /** One picture, its kind chosen by the seed when given a list. */
  const placeholder = (options: PlaceholderOptions = {}): Picture =>
    render(resolveKind(options.kind, options.seed), options);

  /** `count` pictures, going through each option's list of values. */
  const placeholders = (count: number, options: PlaceholdersOptions = {}): Picture[] => {
    const base = seedToInt(options.seed);
    const order = options.order ?? "shuffle";
    const kindAt = picker(pool(options.kind), order, base, "kind");
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
    const kindAt = picker(pool(options.kind), options.order ?? "shuffle", seedToInt(options.seed), "kind");
    return Array.from({ length: count }, (_, k) => kindAt(k));
  };

  return { resolveKind, kindsFor, placeholder, placeholders };
}
