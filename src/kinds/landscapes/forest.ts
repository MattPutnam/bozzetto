import { defineKind, el, fill, hsl, lin, type Point } from "../../draw/core";
import { pine } from "./shared";

/** A pale back row of pines and a dark, scattered front row. */
export const forest = /* @__PURE__ */ defineKind("forest", "Pine forest", (g, w, h, note) => {
  const hue = g.f(90, 165);
  const skyHue = g.f(180, 235);
  const groundY = h * g.f(0.66, 0.76);
  const sky = g.id("sky");
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 45, 76), hsl(skyHue - 30, 50, 93)]));
  out += fill(w, h, `url(#${sky})`);
  // The pale back row, evenly spread along the horizon.
  const back = g.i(9, 14);
  for (let i = 0; i < back; i++) {
    const ht = h * g.f(0.14, 0.26);
    out += pine((w * (i + g.f(0, 1))) / back, groundY + g.f(-2, 3), ht, ht * g.f(0.45, 0.6), hsl(hue, 22, g.f(52, 60)));
  }
  // The ground.
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: hsl(hue, 30, 36) });
  // The dark front row, scattered and drawn far to near.
  const front = Array.from({ length: g.i(4, 8) }, () => ({
    x: w * g.f(-0.05, 1.05),
    y: groundY + (h - groundY) * g.f(0.15, 0.9),
  })).sort((a, b) => a.y - b.y);
  // The eye goes to the tallest front pine that stands fully inside the frame.
  let focus: Point = [w / 2, groundY];
  let tallest = 0;
  for (const tree of front) {
    const ht = h * g.f(0.32, 0.55);
    out += pine(tree.x, tree.y, ht, ht * g.f(0.45, 0.58), hsl(hue + g.f(-10, 10), 35, g.f(18, 28)));
    const inFrame = tree.x > w * 0.08 && tree.x < w * 0.92;
    if (inFrame && tree.y - ht * 0.5 > 0 && ht > tallest) {
      tallest = ht;
      focus = [tree.x, tree.y - ht * 0.5];
    }
  }
  const count = ["four", "five", "six", "seven", "eight"][front.length - 4];
  note.alt(`A pine forest with ${count} tall pines before a distant treeline`);
  note.focus(...focus);
  return out;
});
