/**
 * bozzetto: seeded placeholder images as tiny SVGs.
 *
 * Every kind of picture is its own export, like icons in an icon library. Import a kind and render it,
 * and your bundle only carries the kinds you use:
 *
 *     import { owl, toDataUri } from "bozzetto";
 *     img.src = toDataUri(owl, { seed: 3, palette: "pastel" });
 *
 * Or let `placeholder` and `placeholders` choose from a list, a category, or every kind
 * (these pull in every kind):
 *
 *     import { animals, donut, placeholders } from "bozzetto";
 *     const photos = placeholders(12, { kind: [animals, donut], size: ["400x300", "300x400"] });
 */
import { bird, cat, dog, fish, fox, frog, owl, penguin, rabbit, snail, whale } from "./animals";
import { bauhaus, cutouts, field, grid, orbits, squares } from "./art";
import { portrait } from "./faces";
import { cake, donut, egg, iceCream, pizza, sushi } from "./food";
import { city, dunes, forest, hills, mountains, night, sea } from "./landscapes";
import { makePlaceholders } from "./placeholder";
import { books, bottles, cactus, coffee, flowers, fruitBowl } from "./objects";

// Kinds
export { bird, cat, dog, fish, fox, frog, owl, penguin, rabbit, snail, whale } from "./animals";
export { bauhaus, cutouts, field, grid, orbits, squares } from "./art";
export { portrait } from "./faces";
export { cake, donut, egg, iceCream, pizza, sushi } from "./food";
export { city, dunes, forest, hills, mountains, night, sea } from "./landscapes";
export { books, bottles, cactus, coffee, flowers, fruitBowl } from "./objects";

// Rendering
export { defineKind, seedToInt } from "./core";
export type { Draw, Kind, Notes, OptionSpec, OptionValue, OptionValues, Rand } from "./core";
export { render, resolveSize, toDataUri, toSvg } from "./render";
export type { Picture, RenderOptions, Size } from "./render";

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
} from "./palettes";
export type { Adjustment, PaletteOptions, PaletteSpec, Scheme } from "./palettes";
export { MAPPINGS, stylize } from "./style";
export type { Mapping, StyleOptions, Texture } from "./style";

// Choosing kinds
export type { KindChoice, OneOrMany, Order, PlaceholderOptions, PlaceholdersOptions } from "./placeholder";

/**
 * Categories group kinds for convenience: use one wherever a list of kinds is accepted,
 * alone or mixed with single kinds, as in `[animals, donut]`.
 */
export const landscapes = [hills, mountains, sea, dunes, forest, night, city] as const;
export const art = [field, grid, squares, orbits, cutouts, bauhaus] as const;
export const people = [portrait] as const;
export const animals = [cat, bird, fish, owl, dog, fox, penguin, whale, frog, rabbit, snail] as const;
export const food = [donut, pizza, iceCream, sushi, cake, egg] as const;
export const objects = [fruitBowl, flowers, cactus, coffee, books, bottles] as const;

/** Every category by name, for listing them (in a demo, say). */
export const categories = { landscapes, art, people, animals, food, objects } as const;

/** Every built-in kind. */
export const kinds = [...landscapes, ...art, ...people, ...animals, ...food, ...objects] as const;

/** The id of any built-in kind, such as `"owl"` or `"ice-cream"`. */
export type KindId = (typeof kinds)[number]["id"];

export const { resolveKind, placeholder, placeholders } = makePlaceholders(kinds);
