/** Helpers shared by several music kinds. */
import { el, fill, hsl, type Rand } from "../../draw/core";

/**
 * Music: instruments, records, CDs and drum kits in simple settings, and scattered notes.
 */

/** A room corner seen straight on: a plain wall, a baseboard and a wooden floor from floorY down. */
export function room(g: Rand, w: number, h: number, floorY: number): string {
  const unit = Math.min(w, h);
  const wall = hsl(g.f(0, 360), g.f(10, 30), g.f(78, 88));
  const floor = hsl(g.f(20, 38), g.f(25, 40), g.f(40, 58));
  let out = fill(w, h, wall);
  out += el("rect", { y: floorY, width: w, height: h - floorY, fill: floor });
  // Baseboard along the foot of the wall
  out += el("rect", {
    y: floorY - unit * 0.035,
    width: w,
    height: unit * 0.035,
    fill: g.pick(["#f4f1ea", "#ece6da", "#e2ddd3"]),
  });
  out += el("rect", { y: floorY, width: w, height: Math.max(1.5, unit * 0.006), fill: "#000", opacity: "0.12" });
  return out;
}
