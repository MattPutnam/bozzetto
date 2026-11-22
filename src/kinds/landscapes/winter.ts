import { defineKind, el, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { cabin, curve, PINE, PINE_SNOW, snowyPine } from "./shared";

/**
 * Snowy hills with a cabin or two among snow-laden pines.
 *
 * @category Landscapes
 */
export const winter = /* @__PURE__ */ defineKind("winter", "Winter hills", (g, w, h, note) => {
  const time = g.pick(["day", "overcast", "evening"] as const);
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const hue = time === "evening" ? g.f(250, 280) : g.f(200, 222);
  const stops =
    time === "day"
      ? [hsl(hue, 55, 68), hsl(hue - 5, 50, 92)]
      : time === "overcast"
        ? [hsl(hue, 12, 70), hsl(hue, 15, 88)]
        : [hsl(hue, 30, 42), hsl(g.f(320, 345), 40, 72), hsl(g.f(25, 40), 70, 84)];
  const tree = g.id("pine");
  const snow = (light: number) => hsl(hue, time === "evening" ? 30 : 35, light);
  let out = el(
    "defs",
    {},
    lin(skyId, stops),
    // A snowy pine, 100 units tall, to reuse.
    el(
      "g",
      { id: tree },
      el("path", { d: `M${pts(PINE.map(([x, y]): Point => [x * 100, y * 100]))}Z` }),
      el("path", { d: PINE_SNOW, fill: snow(96) }),
    ),
  );
  out += fill(w, h, `url(#${skyId})`);
  if (time !== "overcast")
    out += el("circle", {
      cx: w * g.f(0.15, 0.85),
      cy: h * (time === "day" ? g.f(0.12, 0.25) : g.f(0.3, 0.4)),
      r: unit * g.f(0.05, 0.07),
      fill: time === "day" ? hsl(50, 100, 96) : hsl(35, 95, 86),
    });
  const green = g.f(140, 170);
  const lit = time !== "day";
  // Far, middle and near slopes.
  const far = curve(w, h * g.f(0.45, 0.55), h * g.f(0.45, 0.55), -h * g.f(0.02, 0.1));
  const mid = curve(w, h * g.f(0.6, 0.7), h * g.f(0.6, 0.7), -h * g.f(0.02, 0.08));
  const near = curve(w, h * g.f(0.74, 0.8), h * g.f(0.74, 0.8), -h * g.f(0, 0.05));
  out += el("path", { d: far.d() + s`V${h}H0Z`, fill: snow(84) });
  // A row of small, pale pines along the far ridge.
  for (let x = g.f(0, 0.1) * w; x < w; x += unit * g.f(0.06, 0.16)) {
    const ht = unit * g.f(0.06, 0.1);
    out += snowyPine(tree, x, far.at(x) + ht * 0.15, ht, ht * 0.55, hsl(green, 15, 55));
  }
  out += el("path", { d: mid.d() + s`V${h}H0Z`, fill: snow(90) });
  // The main cabin on the near slope, a smaller one sometimes on the middle slope.
  const cx = w * g.f(0.28, 0.72);
  const cw = unit * g.f(0.24, 0.3);
  const second = g.chance(0.5);
  const sx = cx < w / 2 ? w * g.f(0.68, 0.85) : w * g.f(0.15, 0.32);
  const sw = cw * 0.5;
  // Pines on the middle slope, kept clear of the small cabin.
  const midPines = g.i(2, 5);
  for (let k = 0; k < midPines; k++) {
    const x = w * ((k + g.f(0.1, 0.9)) / midPines);
    if (second && Math.abs(x - sx) < sw) continue;
    const ht = unit * g.f(0.12, 0.18);
    out += snowyPine(tree, x, mid.at(x) + ht * 0.05, ht, ht * 0.55, hsl(green, 30, 30));
  }
  if (second) out += cabin(g, sx, mid.at(sx) + sw * 0.05, sw, snow(96), lit);
  out += el("path", { d: near.d() + s`V${h}H0Z`, fill: snow(97) });
  // Big pines beside the main cabin.
  for (const dir of [-1, 1]) {
    if (g.chance(0.3)) continue;
    const x = cx + dir * cw * g.f(0.85, 1.3);
    const ht = unit * g.f(0.26, 0.36);
    out += snowyPine(tree, x, near.at(x) + ht * 0.04, ht, ht * 0.55, hsl(green, 35, 24));
  }
  const cy = near.at(cx) + cw * 0.05;
  out += cabin(g, cx, cy, cw, snow(98), lit);
  // Falling snow.
  const flakes = time === "overcast" ? g.i(20, 32) : g.chance(0.4) ? g.i(12, 24) : 0;
  let dots = "";
  for (let k = 0; k < flakes; k++) {
    const r = unit * g.f(0.004, 0.009);
    const x = w * g.f(0, 1);
    const y = h * g.f(0, 1);
    dots += s`M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  if (dots) out += el("path", { d: dots, fill: "#fff", opacity: "0.85" });
  const cabins = second ? "Two cabins" : "A cabin";
  const when = time === "day" ? "on a clear day" : time === "overcast" ? "on an overcast day" : "at dusk, windows lit";
  note.alt(`${cabins} among snowy pines on winter hills ${flakes ? "in falling snow " : ""}${when}`);
  note.focus(cx, cy - cw * 0.4);
  return out;
});
