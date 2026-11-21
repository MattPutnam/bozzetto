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
import {
  bear,
  bird,
  cat,
  cow,
  deer,
  dog,
  elephant,
  fish,
  fox,
  frog,
  giraffe,
  horse,
  koala,
  lion,
  owl,
  panda,
  penguin,
  pig,
  rabbit,
  sheep,
  snail,
  squirrel,
  whale,
} from "./animals";
import {
  arches,
  bauhaus,
  confetti,
  cutouts,
  dots,
  field,
  grid,
  orbits,
  pebbles,
  squares,
  stripes,
  sunburst,
  triangles,
  waves,
} from "./art";
import {
  bee,
  butterfly,
  crab,
  dolphin,
  duck,
  hedgehog,
  jellyfish,
  ladybug,
  mouse,
  octopus,
  seal,
  shark,
  turtle,
} from "./critters";
import { daisy, hibiscus, lotus, poppy, rose, sunflower, tulip } from "./blooms";
import { chicken, flamingo, hummingbird, parrot } from "./birds";
import { bridge, castle, cottage, greenhouse, rowHouses, windmill } from "./buildings";
import { portrait } from "./faces";
import { cds, drums, guitar, notes, piano, record } from "./music";
import { baseball, basketball, football, hockey, skateboard, surfboard, tennis } from "./sports";
import { eggBasket, gifts, holidayTree, pumpkins, snowman } from "./holidays";
import { astronaut, moon, nebula, planets } from "./space";
import { backpack, handbag, perfume, sneakers, sunglasses, watch } from "./products";
import { controller, headphones, laptop, phone, speaker } from "./gadgets";
import { cafe, group, pair, reader, walker, worker } from "./people";
import { gingham, gradient, marble, plaid, terrazzo, topography } from "./patterns";
import {
  avocado,
  bread,
  burger,
  cake,
  cheeseBoard,
  cocktail,
  cookies,
  croissant,
  cupcake,
  donut,
  dumplings,
  egg,
  iceCream,
  pancakes,
  pie,
  pizza,
  popsicle,
  ramen,
  salad,
  smoothie,
  sushi,
  taco,
  watermelon,
} from "./food";
import {
  aquarium,
  aurora,
  autumn,
  beach,
  campsite,
  canal,
  canyon,
  city,
  dunes,
  farm,
  forest,
  hills,
  island,
  kelp,
  lake,
  lighthouse,
  mountains,
  night,
  rainbow,
  rainyStreet,
  reef,
  savanna,
  sea,
  terraces,
  volcano,
  winter,
} from "./landscapes";
import { makeAvatar, type AvatarsOptions } from "./avatar";
import { makePlaceholders } from "./placeholder";
import { seedToInt } from "./core";
import type { Picture } from "./render";
import {
  armchair,
  balloons,
  books,
  bottles,
  cactus,
  camera,
  candles,
  clock,
  coffee,
  flowers,
  fruitBowl,
  houseplant,
  lamp,
  succulents,
  teapot,
} from "./objects";
import { airplane, bicycle, bus, car, hotAirBalloon, rocket, sailboat, train } from "./vehicles";

// Kinds
export {
  bear,
  bird,
  cat,
  cow,
  deer,
  dog,
  elephant,
  fish,
  fox,
  frog,
  giraffe,
  horse,
  koala,
  lion,
  owl,
  panda,
  penguin,
  pig,
  rabbit,
  sheep,
  snail,
  squirrel,
  whale,
} from "./animals";
export {
  arches,
  bauhaus,
  confetti,
  cutouts,
  dots,
  field,
  grid,
  orbits,
  pebbles,
  squares,
  stripes,
  sunburst,
  triangles,
  waves,
} from "./art";
export {
  bee,
  butterfly,
  crab,
  dolphin,
  duck,
  hedgehog,
  jellyfish,
  ladybug,
  mouse,
  octopus,
  seal,
  shark,
  turtle,
} from "./critters";
export { daisy, hibiscus, lotus, poppy, rose, sunflower, tulip } from "./blooms";
export { chicken, flamingo, hummingbird, parrot } from "./birds";
export { bridge, castle, cottage, greenhouse, rowHouses, windmill } from "./buildings";
export { portrait } from "./faces";
export { cds, drums, guitar, notes, piano, record } from "./music";
export { baseball, basketball, football, hockey, skateboard, surfboard, tennis } from "./sports";
export { eggBasket, gifts, holidayTree, pumpkins, snowman } from "./holidays";
export { astronaut, moon, nebula, planets } from "./space";
export { backpack, handbag, perfume, sneakers, sunglasses, watch } from "./products";
export { controller, headphones, laptop, phone, speaker } from "./gadgets";
export { cafe, group, pair, reader, walker, worker } from "./people";
export { gingham, gradient, marble, plaid, terrazzo, topography } from "./patterns";
export {
  avocado,
  bread,
  burger,
  cake,
  cheeseBoard,
  cocktail,
  cookies,
  croissant,
  cupcake,
  donut,
  dumplings,
  egg,
  iceCream,
  pancakes,
  pie,
  pizza,
  popsicle,
  ramen,
  salad,
  smoothie,
  sushi,
  taco,
  watermelon,
} from "./food";
export {
  aquarium,
  aurora,
  autumn,
  beach,
  campsite,
  canal,
  canyon,
  city,
  dunes,
  farm,
  forest,
  hills,
  island,
  kelp,
  lake,
  lighthouse,
  mountains,
  night,
  rainbow,
  rainyStreet,
  reef,
  savanna,
  sea,
  terraces,
  volcano,
  winter,
} from "./landscapes";
export {
  armchair,
  balloons,
  books,
  bottles,
  cactus,
  camera,
  candles,
  clock,
  coffee,
  flowers,
  fruitBowl,
  houseplant,
  lamp,
  succulents,
  teapot,
} from "./objects";
export { airplane, bicycle, bus, car, hotAirBalloon, rocket, sailboat, train } from "./vehicles";

// Rendering
export { defineKind, seedToInt } from "./core";
export type { Draw, Kind, Notes, OptionSpec, OptionValue, OptionValues, Rand } from "./core";
export { render, resolveSize, toDataUri, toSvg } from "./render";
export type { Picture, RenderOptions, Size } from "./render";
export { toImageBlob } from "./raster";
export type { ImageOptions } from "./raster";

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
export type { AvatarOptions, AvatarShape, AvatarsOptions } from "./avatar";
export type { KindChoice, OneOrMany, Order, PlaceholderOptions, PlaceholdersOptions } from "./placeholder";

/**
 * Categories group kinds for convenience: use one wherever a list of kinds is accepted,
 * alone or mixed with single kinds, as in `[animals, donut]`.
 */
export const landscapes = [
  hills,
  mountains,
  sea,
  dunes,
  forest,
  night,
  city,
  lake,
  beach,
  island,
  lighthouse,
  volcano,
  winter,
  autumn,
  farm,
  rainbow,
  canyon,
  savanna,
  aurora,
  rainyStreet,
  campsite,
  terraces,
  canal,
  reef,
  kelp,
  aquarium,
] as const;
export const art = [
  field,
  grid,
  squares,
  orbits,
  cutouts,
  bauhaus,
  waves,
  dots,
  arches,
  confetti,
  triangles,
  sunburst,
  pebbles,
  stripes,
] as const;
export const people = [portrait, reader, worker, cafe, pair, group, walker] as const;
export const animals = [
  cat,
  bird,
  fish,
  owl,
  dog,
  fox,
  penguin,
  whale,
  frog,
  rabbit,
  snail,
  bear,
  panda,
  elephant,
  lion,
  giraffe,
  sheep,
  pig,
  koala,
  turtle,
  duck,
  hedgehog,
  mouse,
  butterfly,
  ladybug,
  bee,
  octopus,
  jellyfish,
  crab,
  horse,
  deer,
  cow,
  squirrel,
  chicken,
  parrot,
  flamingo,
  hummingbird,
  dolphin,
  shark,
  seal,
] as const;
export const food = [
  donut,
  pizza,
  iceCream,
  sushi,
  cake,
  egg,
  burger,
  taco,
  cupcake,
  watermelon,
  popsicle,
  pancakes,
  avocado,
  ramen,
  cookies,
  pie,
  salad,
  bread,
  croissant,
  cocktail,
  smoothie,
  cheeseBoard,
  dumplings,
] as const;
export const objects = [
  fruitBowl,
  flowers,
  coffee,
  books,
  bottles,
  teapot,
  lamp,
  clock,
  candles,
  balloons,
  camera,
  armchair,
] as const;
export const plants = [cactus, houseplant, succulents, sunflower, rose, tulip, daisy, poppy, hibiscus, lotus] as const;
export const products = [
  sneakers,
  watch,
  backpack,
  sunglasses,
  handbag,
  perfume,
  headphones,
  phone,
  laptop,
  speaker,
  controller,
] as const;
export const patterns = [terrazzo, marble, gingham, plaid, topography, gradient] as const;
export const buildings = [cottage, windmill, castle, bridge, rowHouses, greenhouse] as const;
export const music = [guitar, piano, drums, record, cds, notes] as const;
export const sports = [baseball, basketball, football, hockey, tennis, skateboard, surfboard] as const;
export const holidays = [pumpkins, snowman, holidayTree, gifts, eggBasket] as const;
export const space = [planets, nebula, astronaut, moon] as const;
export const vehicles = [car, bicycle, sailboat, hotAirBalloon, rocket, train, bus, airplane] as const;

/** Every category by name, for listing them (in a demo, say). */
export const categories = {
  landscapes,
  art,
  people,
  animals,
  food,
  objects,
  plants,
  buildings,
  vehicles,
  products,
  music,
  sports,
  holidays,
  space,
  patterns,
} as const;

/** Every built-in kind. */
export const kinds = [
  ...landscapes,
  ...art,
  ...people,
  ...animals,
  ...food,
  ...objects,
  ...plants,
  ...buildings,
  ...vehicles,
  ...products,
  ...music,
  ...sports,
  ...holidays,
  ...space,
  ...patterns,
] as const;

/** The id of any built-in kind, such as `"owl"` or `"ice-cream"`. */
export type KindId = (typeof kinds)[number]["id"];

const chooser = makePlaceholders(kinds);
export const { resolveKind, placeholder, placeholders } = chooser;

/** Kinds with a face, which can be avatars. Unlike the categories above, it overlaps them. */
export const faces = [
  portrait,
  reader,
  worker,
  cafe,
  pair,
  group,
  cat,
  dog,
  fox,
  rabbit,
  owl,
  frog,
  penguin,
  bear,
  panda,
  lion,
  koala,
  sheep,
  pig,
  elephant,
  giraffe,
  turtle,
  duck,
  hedgehog,
  mouse,
  octopus,
  crab,
  horse,
  deer,
  cow,
  squirrel,
  chicken,
  parrot,
  flamingo,
  hummingbird,
  dolphin,
  shark,
  seal,
  snowman,
  astronaut,
] as const;

/**
 * An avatar: a face kind framed in a square around its head, round by default. With no `kind`, the
 * seed picks one of `faces`, so a user id gives each user their own avatar.
 */
export const avatar = makeAvatar(resolveKind, faces);

/**
 * `count` avatars. With a list of kinds (by default every face), each is used once, in a seeded
 * order, before any repeats; avatar k uses seed `seed + k`, as in `placeholders`.
 */
export function avatars(count: number, options: AvatarsOptions = {}): Picture[] {
  const { order, ...rest } = options;
  const base = seedToInt(options.seed);
  return chooser
    .kindsFor(count, { kind: options.kind ?? faces, order, seed: options.seed })
    .map((kind, k) => avatar({ ...rest, kind, seed: (base + k) >>> 0 }));
}
