/**
 * Every built-in kind, in categories. Each kind is its own module, so a bundle carries only the kinds
 * it imports.
 */
import { landscapes } from "./landscapes";
import { art } from "./art";
import { people, cafe, group, pair, portrait, reader, worker } from "./people";
import {
  animals,
  bear,
  cat,
  chicken,
  cow,
  crab,
  deer,
  dog,
  dolphin,
  duck,
  elephant,
  flamingo,
  fox,
  frog,
  giraffe,
  hedgehog,
  horse,
  hummingbird,
  koala,
  lion,
  mouse,
  octopus,
  owl,
  panda,
  parrot,
  penguin,
  pig,
  rabbit,
  seal,
  shark,
  sheep,
  squirrel,
  turtle,
} from "./animals";
import { food } from "./food";
import { objects } from "./objects";
import { plants } from "./plants";
import { buildings } from "./buildings";
import { vehicles } from "./vehicles";
import { products } from "./products";
import { music } from "./music";
import { sports } from "./sports";
import { holidays, snowman } from "./holidays";
import { space, astronaut } from "./space";
import { patterns } from "./patterns";

export * from "./landscapes";
export * from "./art";
export * from "./people";
export * from "./animals";
export * from "./food";
export * from "./objects";
export * from "./plants";
export * from "./buildings";
export * from "./vehicles";
export * from "./products";
export * from "./music";
export * from "./sports";
export * from "./holidays";
export * from "./space";
export * from "./patterns";

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
// Built in a function marked pure: spreading arrays at load time would keep every kind in a bundle.
export const kinds = /* @__PURE__ */ (() =>
  [
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
  ] as const)();

/** The id of any built-in kind, such as `"owl"` or `"ice-cream"`. */
export type KindId = (typeof kinds)[number]["id"];

/** Kinds with a face, which can be avatars. Unlike the categories, it overlaps them. */
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
