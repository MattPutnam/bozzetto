/** Helpers shared by several vehicles kinds. */
import { type AttrValue, el, hsl, lin, n, type Point, pts, type Rand, s } from "../../draw/core";

export type Time = "day" | "dusk" | "night";

export const timeOfDay = (g: Rand): Time => g.pick(["day", "day", "day", "dusk", "night"] as const);

/** How much to darken scenery at each time of day. */
export const shade = (time: Time): number => (time === "night" ? 0.5 : time === "dusk" ? 0.85 : 1);

/** Words for the time of day, to end an alt sentence. */
export const when = (time: Time): string => (time === "night" ? " at night" : time === "dusk" ? " at dusk" : "");

/** The sky down to `horizon`: a gradient, then the sun, or the moon and stars. */
export function skyAt(g: Rand, w: number, h: number, time: Time, horizon: number, sun = true): string {
  const id = g.id("sky");
  const hue = g.f(-12, 12);
  const stops =
    time === "day"
      ? [hsl(205 + hue, 62, g.f(58, 68)), hsl(198 + hue, 60, 88)]
      : time === "dusk"
        ? [hsl(250 + hue, 35, 36), hsl(330 + hue, 45, 62), hsl(28 + hue, 90, 74)]
        : [hsl(228 + hue, 50, 8), hsl(238 + hue, 40, 25)];
  let out = el("defs", {}, lin(id, stops));
  out += el("rect", { width: w, height: horizon + 2, fill: `url(#${id})` });
  const unit = Math.min(w, h);
  const x = w * g.f(0.1, 0.9);
  const r = unit * g.f(0.05, 0.075);
  if (time === "night") {
    // Stars and a moon.
    let stars = "";
    for (let k = g.i(14, 26); k > 0; k--) {
      const sx = w * g.f(0, 1);
      const sy = horizon * g.f(0, 0.85);
      const sr = g.f(0.5, 1.5);
      stars += s`M${sx - sr} ${sy}a${sr} ${sr} 0 1 0 ${sr * 2} 0a${sr} ${sr} 0 1 0 ${-sr * 2} 0`;
    }
    out += el("path", { d: stars, fill: "#ffffff", opacity: 0.8 });
    if (sun) out += el("circle", { cx: x, cy: horizon * g.f(0.15, 0.4), r, fill: hsl(50, 70, 92) });
  } else if (time === "dusk") {
    if (sun) out += el("circle", { cx: x, cy: horizon - r * g.f(0.2, 1.6), r: r * 1.3, fill: hsl(32, 95, 80) });
  } else if (sun && g.chance(0.75)) {
    out += el("circle", { cx: x, cy: horizon * g.f(0.18, 0.45), r, fill: hsl(48, 95, 90) });
  }
  return out;
}

/** A wash over the whole picture that dims it for dusk or night. Lights are drawn after it. */
export const veil = (w: number, h: number, time: Time): string =>
  time === "night"
    ? el("rect", { width: w, height: h, fill: hsl(232, 55, 12), opacity: 0.35 })
    : time === "dusk"
      ? el("rect", { width: w, height: h, fill: hsl(15, 70, 45), opacity: 0.1 })
      : "";

/** A puffy cloud with a flat base, centered on x with its base at y. */
export const cloud = (x: number, y: number, size: number, paint: string, opacity: number): string =>
  el(
    "g",
    { fill: paint, opacity },
    el("rect", { x: x - size, y: y - size * 0.32, width: size * 2, height: size * 0.32, rx: size * 0.16 }),
    el("circle", { cx: x - size * 0.45, cy: y - size * 0.32, r: size * 0.36 }),
    el("circle", { cx: x + size * 0.08, cy: y - size * 0.48, r: size * 0.48 }),
    el("circle", { cx: x + size * 0.6, cy: y - size * 0.28, r: size * 0.3 }),
  );

/** A gentle hill line across the picture, filled down to the bottom. */
export const hill = (g: Rand, w: number, h: number, y: number, rise: number, paint: string): string =>
  el("path", {
    d: s`M0 ${y + rise * g.f(-0.3, 0.5)}
         Q ${w * g.f(0.2, 0.8)} ${y - rise} ${w} ${y + rise * g.f(-0.3, 0.5)}
         V ${h} H0Z`,
    fill: paint,
  });

/** A round-topped tree whose trunk stands at (x, y). */
export const tree = (x: number, y: number, ht: number, leaf: string, trunk: string): string =>
  el("rect", { x: x - ht * 0.05, y: y - ht * 0.5, width: ht * 0.1, height: ht * 0.5 + 1, fill: trunk }) +
  el("circle", { cx: x, cy: y - ht * 0.68, r: ht * 0.32, fill: leaf });

/**
 * Drawing in local units: (0, 0) maps to (ox, oy) and one unit to k px. Path data uses absolute
 * commands only, with spaces between every token.
 */
export function local(ox: number, oy: number, k: number) {
  const x = (v: number) => ox + v * k;
  const y = (v: number) => oy + v * k;
  const path = (d: string): string => {
    const out: string[] = [];
    let cmd = "";
    let index = 0;
    for (const token of d.trim().split(/\s+/)) {
      if (/^[A-Z]$/.test(token)) {
        cmd = token;
        index = 0;
        out.push(token);
        continue;
      }
      const v = Number(token);
      let px: number;
      if (cmd === "A") {
        const slot = index % 7;
        px = slot < 2 ? v * k : slot < 5 ? v : slot === 5 ? x(v) : y(v);
      } else if (cmd === "H") px = x(v);
      else if (cmd === "V") px = y(v);
      else px = index % 2 === 0 ? x(v) : y(v);
      out.push(String(n(px)));
      index++;
    }
    return out.join(" ");
  };
  return {
    x,
    y,
    k: (v: number) => v * k,
    path: (d: string, attrs: Record<string, AttrValue> = {}) => el("path", { d: path(d), ...attrs }),
    poly: (points: readonly Point[], attrs: Record<string, AttrValue>) =>
      el("polygon", { points: pts(points.map(([px, py]): Point => [x(px), y(py)])), ...attrs }),
    circle: (cx: number, cy: number, r: number, attrs: Record<string, AttrValue>) =>
      el("circle", { cx: x(cx), cy: y(cy), r: r * k, ...attrs }),
    ellipse: (cx: number, cy: number, rx: number, ry: number, attrs: Record<string, AttrValue>) =>
      el("ellipse", { cx: x(cx), cy: y(cy), rx: rx * k, ry: ry * k, ...attrs }),
    rect: (rx0: number, ry0: number, rw: number, rh: number, attrs: Record<string, AttrValue>) =>
      el("rect", { x: x(rx0), y: y(ry0), width: rw * k, height: rh * k, ...attrs }),
    line: (x1: number, y1: number, x2: number, y2: number, attrs: Record<string, AttrValue>) =>
      el("path", { d: s`M${x(x1)} ${y(y1)}L${x(x2)} ${y(y2)}`, ...attrs }),
  };
}

export const PAINTS = [
  "#d6453d",
  "#6fa8dc",
  "#8fd1c0",
  "#f2c94c",
  "#f08a5d",
  "#9b7ed1",
  "#5bab6e",
  "#2f4f6f",
  "#e8e0cf",
];

export const TIRE = "#2a2b30";

export const CHROME = "#d5dae0";
