/**
 * bozzetto: seeded placeholder images as tiny SVGs.
 *
 * Import a kind and render it, which keeps your bundle to the kinds you use:
 *
 *     import { owl, toDataUri } from "bozzetto";
 *     img.src = toDataUri(owl, { seed: 3 });
 *
 * Or let `placeholder` choose by name, family or seed (this pulls in every kind):
 *
 *     import { placeholder } from "bozzetto";
 *     img.src = placeholder({ kind: "landscape", seed: "user-42" });
 */
import { makeRand, seedToInt, toDataUri, toSvg, type Family, type Kind, type RenderOptions } from "./core";
import { bird, cat, fish, owl } from "./animals";
import { bauhaus, cutouts, field, grid, orbits, squares } from "./art";
import { portrait } from "./faces";
import { city, dunes, forest, hills, mountains, night, sea } from "./landscapes";

export { defineKind, seedToInt, toDataUri, toSvg } from "./core";
export type { Draw, Family, Kind, Rand, RenderOptions } from "./core";
export { bird, cat, fish, owl } from "./animals";
export { bauhaus, cutouts, field, grid, orbits, squares } from "./art";
export { portrait } from "./faces";
export { city, dunes, forest, hills, mountains, night, sea } from "./landscapes";

/** Every built-in kind, grouped by family. */
export const kinds = [hills, mountains, sea, dunes, forest, night, city, field, grid, squares, orbits, cutouts, bauhaus, portrait, cat, bird, fish, owl] as const;

export type KindId = (typeof kinds)[number]["id"];

export const families: readonly Family[] = ["landscape", "art", "face", "animal"];

/** What to draw: one kind (by id or object), a whole family, or a list to choose from. */
export type KindChoice = KindId | Family | Kind | readonly (KindId | Kind)[];

export interface PlaceholderOptions extends RenderOptions {
  /** Default: any built-in kind, chosen by the seed. */
  kind?: KindChoice;
}

const byId = new Map<string, Kind>(kinds.map(k => [k.id, k]));

function pool(choice: KindChoice | undefined): readonly Kind[] {
  if (choice === undefined) return kinds;
  if (typeof choice === "string") {
    if ((families as readonly string[]).includes(choice)) return kinds.filter(k => k.family === choice);
    const kind = byId.get(choice);
    if (!kind) throw new Error(`bozzetto: unknown kind "${choice}". Known kinds: ${[...byId.keys()].join(", ")}; families: ${families.join(", ")}.`);
    return [kind];
  }
  if (Array.isArray(choice)) {
    const list = choice.flatMap(c => pool(c as KindId | Kind));
    if (list.length === 0) throw new Error("bozzetto: `kind` is an empty list.");
    return list;
  }
  return [choice as Kind];
}

/** The kind a seed picks from a choice. Stable: the same seed always picks the same kind. */
export function resolveKind(choice: KindChoice | undefined, seed: number | string = 1): Kind {
  const list = pool(choice);
  return list.length === 1 ? list[0] : list[Math.floor(makeRand(seedToInt(seed) ^ 0x9e3779b9).next() * list.length)];
}

/** A placeholder picture as a `data:image/svg+xml` URI. */
export function placeholder(options: PlaceholderOptions = {}): string {
  return toDataUri(resolveKind(options.kind, options.seed), options);
}

/** A placeholder picture as SVG markup, for inlining. */
export function placeholderSvg(options: PlaceholderOptions = {}): string {
  return toSvg(resolveKind(options.kind, options.seed), options);
}

export interface PlaceholdersOptions extends Omit<PlaceholderOptions, "label"> {
  /** Number the pictures 1, 2, 3… in the corner. */
  numbered?: boolean;
}

/**
 * `count` different placeholder pictures as data URIs. Picture k uses seed `seed + k`,
 * so a list grows without changing the pictures already in it.
 */
export function placeholders(count: number, options: PlaceholdersOptions = {}): string[] {
  const { numbered, seed, ...rest } = options;
  const base = seedToInt(seed);
  return Array.from({ length: count }, (_, k) => placeholder({ ...rest, seed: (base + k) >>> 0, label: numbered ? k + 1 : undefined }));
}
