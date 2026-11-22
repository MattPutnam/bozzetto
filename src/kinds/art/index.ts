/** Art: loose homages to familiar 20th-century styles, from a few rectangles, circles and blobs. */
import { field } from "./field";
import { grid } from "./grid";
import { squares } from "./squares";
import { orbits } from "./orbits";
import { cutouts } from "./cutouts";
import { bauhaus } from "./bauhaus";
import { waves } from "./waves";
import { dots } from "./dots";
import { arches } from "./arches";
import { confetti } from "./confetti";
import { triangles } from "./triangles";
import { sunburst } from "./sunburst";
import { pebbles } from "./pebbles";
import { stripes } from "./stripes";

export {
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
};

/**
 * Every kind in the art category: loose homages to familiar 20th-century styles, from a few
 * rectangles, circles and blobs.
 *
 * @category Categories
 */
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
