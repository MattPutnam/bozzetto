import { defineKind, el, fill, hsl } from "../../draw/core";
import { describe, figure, headBox, person } from "./shared";

/**
 * Two people side by side, head and shoulders, leaning in. Each varies on their own.
 *
 * @category People
 */
export const pair = /* @__PURE__ */ defineKind("pair", "Pair of friends", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const rx = unit * g.f(0.125, 0.145);
  const gap = rx * g.f(1.2, 1.35);
  const people = [person(g.fork("left")), person(g.fork("right"))];
  const front = g.i(0, 1);
  const drop = g.f(-0.18, 0.18);
  const hue = g.f(0, 360);
  let out = fill(w, h, hsl(hue, 35, 82));
  out += el("circle", { cx: w / 2, cy: h * 0.45, r: unit * 0.42, fill: "#fff", opacity: "0.25" });
  const place = (k: number) => {
    const p = people[k];
    const ry = rx * p.long;
    const cx = w / 2 + (k ? gap : -gap);
    const cy = h / 2 - ry * 0.3 + (k ? -drop : drop) * ry;
    return { p, ry, cx, cy };
  };
  for (const k of [1 - front, front]) {
    const { p, cx, cy } = place(k);
    // Heads lean in toward each other.
    out += figure(p, cx, cy, rx, rx * g.f(1.9, 2.2), h + 2, (k ? -1 : 1) * g.f(3, 7));
  }
  const { p, ry, cx, cy } = place(front);
  const other = people[1 - front];
  note.alt(`Two smiling friends side by side, ${describe(p, true)} and ${describe(other, true)}`);
  note.focus(w / 2, cy);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});
