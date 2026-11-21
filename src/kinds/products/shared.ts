/** Helpers shared by several products kinds. */
import { el, fill, hsl, mix, type Rand } from "../../draw/core";

/**
 * Product shots: one item, centered and large, on a seamless studio backdrop.
 */

/**
 * The studio backdrop: a soft sweep from wall to floor in one muted hue, or a flat wall with a
 * round spotlight glow behind the item at (cx, cy).
 */
export function studio(g: Rand, w: number, h: number, floorY: number, cx: number, cy: number): string {
  const hue = g.f(0, 360);
  const sat = g.f(12, 32);
  const light = g.f(80, 88);
  const wall = hsl(hue, sat, light);
  if (g.chance(0.35)) {
    const id = g.id("spot");
    const r = Math.max(w, h) * g.f(0.4, 0.55);
    return (
      el(
        "defs",
        {},
        el(
          "radialGradient",
          { id },
          el("stop", { offset: 0, "stop-color": "#ffffff", "stop-opacity": g.f(0.35, 0.55) }),
          el("stop", { offset: 1, "stop-color": "#ffffff", "stop-opacity": 0 }),
        ),
      ) +
      fill(w, h, wall) +
      el("ellipse", { cx, cy, rx: r, ry: r * 0.9, fill: `url(#${id})` })
    );
  }
  const id = g.id("sweep");
  const floor = hsl(hue, sat, light + g.pick([-7, -5, 5, 7]));
  const bend = floorY / h;
  return (
    el(
      "defs",
      {},
      el(
        "linearGradient",
        { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        el("stop", { offset: 0, "stop-color": hsl(hue, sat, light + 3) }),
        el("stop", { offset: Math.max(0.1, bend - 0.3), "stop-color": wall }),
        el("stop", { offset: Math.min(0.98, bend + 0.06), "stop-color": floor }),
        el("stop", { offset: 1, "stop-color": floor }),
      ),
    ) + fill(w, h, `url(#${id})`)
  );
}

/** The soft contact shadow under an item. */
export const contact = (cx: number, y: number, rx: number, ry: number, opacity = 0.18): string =>
  el("ellipse", { cx, cy: y, rx, ry, fill: "#000", opacity: String(opacity) });

export const shade = (color: string, t: number): string => mix(color, "#000000", t);

export const tint = (color: string, t: number): string => mix(color, "#ffffff", t);

/**
 * A seamless studio sweep: the wall fades softly into a slightly lighter or darker floor at
 * `horizon`. Sometimes it's one flat color instead, and often there's a spotlight glow at (cx, cy).
 */
export function sweepStudio(g: Rand, w: number, h: number, horizon: number, cx: number, cy: number): string {
  const unit = Math.min(w, h);
  const hue = g.f(0, 360);
  const sat = g.f(10, 32);
  const light = g.f(80, 89);
  const floorLight = light + (g.chance(0.5) ? g.f(3, 6) : -g.f(3, 7));
  const flat = g.chance(0.3);
  const spot = flat || g.chance(0.35);
  const sweep = g.id("sweep");
  const glow = g.id("spot");
  const stop = (offset: number, color: string, opacity?: string) =>
    el("stop", {
      offset: Math.max(0, Math.min(1, offset)),
      "stop-color": color,
      "stop-opacity": opacity,
    });
  const t = horizon / h;
  let defs = el("radialGradient", { id: glow }, stop(0, "#ffffff", flat ? "0.5" : "0.35"), stop(1, "#ffffff", "0"));
  if (!flat) {
    defs += el(
      "linearGradient",
      { id: sweep, x1: 0, y1: 0, x2: 0, y2: 1 },
      stop(0, hsl(hue, sat, light - 5)),
      stop(t - 0.1, hsl(hue, sat, light)),
      stop(t + 0.12, hsl(hue, sat, floorLight)),
      stop(1, hsl(hue, sat, floorLight + (floorLight > light ? 2 : -2))),
    );
  }
  let out = el("defs", {}, defs);
  out += fill(w, h, flat ? hsl(hue, sat, light) : `url(#${sweep})`);
  if (spot) out += el("circle", { cx, cy, r: unit * 0.55, fill: `url(#${glow})` });
  return out;
}

/** A soft contact shadow: a faint wide ellipse and a darker tight one. */
export const softContact = (cx: number, cy: number, rx: number, ry: number): string =>
  el("ellipse", { cx, cy, rx: rx * 1.3, ry: ry * 1.7, fill: "#000", opacity: "0.07" }) +
  el("ellipse", { cx, cy, rx, ry, fill: "#000", opacity: "0.16" });

/** Where an item of height `itemH` stands: centered, but never too low. */
export const baseFor = (h: number, unit: number, itemH: number): number =>
  Math.min(h * 0.86, h / 2 + itemH / 2 + unit * 0.05);
