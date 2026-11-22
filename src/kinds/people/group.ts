import { defineKind, el, fill, hsl } from "../../draw/core";
import { figure, headBox, person, traits } from "./shared";

/**
 * Three people, head and shoulders, close together like a team photo. The middle one stands in front.
 *
 * @category People
 */
export const group = /* @__PURE__ */ defineKind("group", "Group of three", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const rx = unit * g.f(0.11, 0.125);
  const spread = rx * g.f(1.85, 2.05);
  const hue = g.f(0, 360);
  let out = fill(w, h, hsl(hue, 35, 82));
  out += el("rect", { y: h * 0.62, width: w, height: h, fill: hsl(hue + 20, 30, 74) });
  const people = [person(g.fork("left")), person(g.fork("middle")), person(g.fork("right"))];
  // Left and right stand a step back, so a little higher and smaller.
  for (const k of [0, 2]) {
    const p = people[k];
    const back = rx * 0.92;
    const cy = h / 2 - back * p.long * g.f(0.5, 0.75);
    out += figure(p, w / 2 + (k - 1) * spread, cy, back, back * g.f(1.9, 2.1), h + 2, (1 - k) * g.f(2, 5));
  }
  const p = people[1];
  const ry = rx * p.long;
  const cx = w / 2;
  const cy = h / 2 - ry * g.f(0.0, 0.2);
  out += figure(p, cx, cy, rx, rx * g.f(1.95, 2.15), h + 2, g.f(-3, 3));
  note.alt(
    `Three smiling people close together for a group photo, the ${p.older ? "older one" : "one"} in the middle with ${traits(p)}`,
  );
  note.focus(cx, cy);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});
