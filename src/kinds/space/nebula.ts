import { defineKind, el, fill, hsl, lin, type Point, s } from "../../draw/core";
import { blob } from "../../draw/shapes";
import { starCount, starDots } from "./shared";

/** A four-pointed glint for a bright star. */
const glint = (x: number, y: number, len: number) => {
  const t = len * 0.12;
  const p: Point[] = [
    [0, -len],
    [t, -t],
    [len, 0],
    [t, t],
    [0, len],
    [-t, t],
    [-len, 0],
    [-t, -t],
  ];
  return "M" + p.map(([px, py]) => s`${x + px} ${y + py}`).join("L") + "Z";
};

/**
 * A glowing nebula: soft blurred clouds of two or three hues over stars, with a few bright glinting stars.
 *
 * @category Space
 */
export const nebula = /* @__PURE__ */ defineKind("nebula", "Nebula", (g, w, h, note) => {
  const unit = Math.min(w, h);
  // Two or three hues from the ones real nebulae glow in, never two alike.
  const pool = [g.f(320, 345), g.f(270, 290), g.f(205, 230), g.f(175, 192), g.f(8, 28)];
  const first = g.i(0, 4);
  const second = (first + g.i(1, 4)) % 5;
  const hues = [pool[first], pool[second]];
  if (g.chance(0.5)) hues.push(pool[(second + 1) % 5 === first ? (second + 2) % 5 : (second + 1) % 5]);
  const base = g.f(225, 275);
  const sky = g.id("sky");
  const soft = g.id("soft");
  const bg = hsl(base, 40, 5);
  let out = el(
    "defs",
    {},
    lin(sky, [bg, hsl(base + 20, 35, 11)]),
    el(
      "filter",
      { id: soft, x: "-50%", y: "-50%", width: "200%", height: "200%" },
      el("feGaussianBlur", { stdDeviation: unit * 0.065 }),
    ),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, h, starCount(g, w, h), unit);
  // The clouds gather along a gently curving band across the picture.
  const y0 = h * g.f(0.25, 0.75);
  const y1 = h * g.f(0.25, 0.75);
  const wave = h * g.f(0.05, 0.15);
  const phase = g.f(0, 6);
  const along = (t: number): Point => [w * t, y0 + (y1 - y0) * t + wave * Math.sin(phase + t * 5)];
  const count = Math.round(4 + 2.5 * Math.min(3, w / h));
  // A faint wide glow under the whole band.
  let clouds = el("ellipse", {
    cx: w / 2,
    cy: (y0 + y1) / 2,
    rx: w * 0.55,
    ry: unit * 0.28,
    fill: hsl(hues[0], 55, 40),
    opacity: 0.3,
    transform: s`rotate(${(Math.atan2(y1 - y0, w) * 180) / Math.PI} ${w / 2} ${(y0 + y1) / 2})`,
  });
  for (let k = 0; k < count; k++) {
    const t = (k + g.f(0, 1)) / count;
    const [x, y] = along(t * 1.1 - 0.05);
    const rx = unit * g.f(0.18, 0.32);
    const hue = hues[k % hues.length];
    clouds += el("path", {
      d: blob(g, x, y + unit * g.f(-0.15, 0.15), rx, rx * g.f(0.5, 0.9), 2, 0.25, 0.2),
      fill: hsl(hue, g.f(60, 75), g.f(50, 62)),
      opacity: g.f(0.3, 0.55),
    });
  }
  // Brighter cores, then a lane or two of dark dust.
  let focus: Point = along(0.5);
  for (let k = g.i(2, 3); k > 0; k--) {
    const t = g.f(0.15, 0.85);
    const [x, y] = along(t);
    const rx = unit * g.f(0.07, 0.13);
    if (k === 1) focus = [x, y];
    clouds += el("path", {
      d: blob(g, x, y, rx, rx * 0.7, 2, 0.2),
      fill: hsl(hues[k % hues.length] + 15, 80, 80),
      opacity: 0.6,
    });
  }
  const dusty = g.chance(0.6);
  if (dusty) {
    const [x, y] = along(g.f(0.25, 0.75));
    clouds += el("path", {
      d: blob(g, x, y + unit * g.f(-0.05, 0.05), unit * g.f(0.18, 0.28), unit * g.f(0.04, 0.07), 2, 0.3),
      fill: bg,
      opacity: 0.6,
    });
  }
  out += el("g", { filter: `url(#${soft})` }, clouds);
  // A few faint stars shine through in front, and some bright ones glint.
  out += starDots(g, w, h, Math.round(starCount(g, w, h) / 3), unit);
  const bright = g.i(3, 5);
  let glints = "";
  let halos = "";
  for (let k = 0; k < bright; k++) {
    const x = w * g.f(0.05, 0.95);
    const y = h * g.f(0.05, 0.95);
    const len = unit * g.f(0.025, 0.055);
    glints += glint(x, y, len);
    halos += s`M${x - len * 0.35} ${y}a${len * 0.35} ${len * 0.35} 0 1 0 ${len * 0.7} 0a${len * 0.35} ${len * 0.35} 0 1 0 ${-len * 0.7} 0`;
  }
  out += el("path", { d: halos, fill: "#fff", opacity: 0.3 });
  out += el("path", { d: glints, fill: "#fff" });
  note.alt(
    `A glowing nebula of soft ${hues.length === 3 ? "many-hued" : "two-toned"} clouds${dusty ? " crossed by a lane of dark dust" : ""}, bright stars glinting around it`,
  );
  note.focus(focus[0], focus[1]);
  return out;
});
