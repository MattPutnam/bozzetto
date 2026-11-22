/**
 * bozzetto: seeded placeholder images as tiny SVGs.
 *
 * Every kind of picture is its own export, like icons in an icon library. Import a kind and render it,
 * and your bundle only carries the kinds you use:
 *
 * ```ts
 * import { owl, toDataUri } from "bozzetto";
 * img.src = toDataUri(owl, { seed: 3, palette: "pastel" });
 * ```
 *
 * Or let `placeholder` and `placeholders` choose from a list, a category, or every kind
 * (these pull in every kind):
 *
 * ```ts
 * import { animals, donut, placeholders } from "bozzetto";
 * const photos = placeholders(12, { kind: [animals, donut], size: ["400x300", "300x400"] });
 * ```
 *
 * @module bozzetto
 */
import { seedToInt, type Kind } from "./draw/core";
import { faces, kinds } from "./kinds";
import { makeAvatar, type AvatarOptions, type AvatarsOptions } from "./render/avatar";
import {
  makePlaceholders,
  type KindChoice,
  type PlaceholderOptions,
  type PlaceholdersOptions,
} from "./render/placeholder";
import type { Picture } from "./render/render";

// Kinds and categories
export * from "./kinds";

// Rendering
export { defineKind, seedToInt } from "./draw/core";
export type { Draw, Kind, Notes, OptionSpec, OptionValue, OptionValues, Rand } from "./draw/core";
export { render, resolveSize, toDataUri, toSvg } from "./render/render";
export type { Picture, RenderOptions, Size } from "./render/render";
export { toImageBlob } from "./render/raster";
export type { ImageOptions } from "./render/raster";

// Colors
export {
  ADJUSTMENTS,
  PALETTES,
  PALETTE_NAMES,
  SCHEMES,
  decodePalette,
  encodePalette,
  makePalette,
  randomPalette,
  resolvePalette,
} from "./color/palettes";
export type { Adjustment, PaletteOptions, PaletteSpec, Scheme } from "./color/palettes";
export { MAPPINGS, stylize } from "./color/style";
export type { Mapping, StyleOptions, Texture } from "./color/style";

// Choosing kinds
export type { AvatarOptions, AvatarShape, AvatarsOptions } from "./render/avatar";
export type { KindChoice, OneOrMany, Order, PlaceholderOptions, PlaceholdersOptions } from "./render/placeholder";

// The chooser over every kind is made on first use, not when the package loads, so a bundle that
// only renders a few kinds can leave the rest out.
type Chooser = ReturnType<typeof makePlaceholders>;
let chooser: Chooser | undefined;
const choose = (): Chooser => (chooser ??= makePlaceholders(kinds));

/**
 * The kind a choice and seed pick: a kind, an id, or a list or category to choose from by seed.
 * With no choice, the seed picks from every kind.
 *
 * @category Choosing kinds
 */
export function resolveKind(choice?: KindChoice, seed?: number | string): Kind {
  return choose().resolveKind(choice, seed);
}

/**
 * One picture of a kind chosen by the seed from `kind` (every kind by default).
 *
 * @category Choosing kinds
 */
export function placeholder(options?: PlaceholderOptions): Picture {
  return choose().placeholder(options);
}

/**
 * `count` pictures, going through the kinds in `kind` by `order`, picture k with seed `seed + k`.
 *
 * @category Choosing kinds
 */
export function placeholders(count: number, options?: PlaceholdersOptions): Picture[] {
  return choose().placeholders(count, options);
}

let makeOne: ((options?: AvatarOptions) => Picture) | undefined;

/**
 * An avatar: a face kind framed in a square around its head, round by default. With no `kind`, the
 * seed picks one of `faces`, so a user id gives each user their own avatar.
 *
 * @category Avatars
 */
export function avatar(options?: AvatarOptions): Picture {
  return (makeOne ??= makeAvatar(resolveKind, faces))(options);
}

/**
 * `count` avatars. With a list of kinds (by default every face) and the default `shuffle` order,
 * each is used once, in a seeded order, before any repeats; avatar k uses seed `seed + k`, as in `placeholders`.
 *
 * @category Avatars
 */
export function avatars(count: number, options: AvatarsOptions = {}): Picture[] {
  const { order, ...rest } = options;
  const base = seedToInt(options.seed);
  return choose()
    .kindsFor(count, { kind: options.kind ?? faces, order, seed: options.seed })
    .map((kind, k) => avatar({ ...rest, kind, seed: (base + k) >>> 0 }));
}
