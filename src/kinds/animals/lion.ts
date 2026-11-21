import { defineKind, el, mix, type Point, s } from "../../draw/core";
import { blob } from "../../draw/shapes";
import { limb, savanna } from "./shared";

const LIONS = [
  { fur: "#d9a55b", mane: "#94562a", light: "#f3dcae" },
  { fur: "#c8955a", mane: "#6b3c22", light: "#ecd4a6" },
  { fur: "#e2b670", mane: "#b2682f", light: "#f7e4bd" },
  { fur: "#cf9f6c", mane: "#4d2e1f", light: "#efdabb" },
] as const;

/** A lion with a shaggy mane, or a lioness, sitting up on the savanna. */
export const lion = /* @__PURE__ */ defineKind("lion", "Lion", { mane: [true, false] }, (g, w, h, note) => {
  const coat = g.pick(LIONS);
  const mane = g.option("mane", g.chance(0.65));
  const size = Math.min(w, h);
  const cx = w * g.f(0.42, 0.58);
  const hz = h * g.f(0.55, 0.65);
  const gy = h * g.f(0.86, 0.9);
  const bw = size * g.f(0.17, 0.19);
  const bh = bw * 1.3;
  const rx = bw * (mane ? 0.6 : 0.56);
  const ry = rx * 1.02;
  const hy = gy - bh * 1.85;
  const fx = cx + rx * g.f(-0.12, 0.12);
  const tailSide = g.pick([-1, 1]);
  const dusk = g.chance(0.35);
  const shade = mix(coat.fur, "#000000", 0.12);
  let out = savanna(g.fork("scene"), w, h, hz, dusk);
  // Shadow
  out += el("ellipse", { cx, cy: gy, rx: bw * 1.5, ry: bw * 0.14, fill: "#000", opacity: "0.15" });
  // Tail along the ground, flicking up at the tuft
  const tip: Point = [cx + tailSide * bw * 1.6, gy - bw * 0.32];
  out += el("path", {
    d: s`M ${cx + tailSide * bw * 0.95} ${gy - bw * 0.2} Q ${cx + tailSide * bw * 1.5} ${gy + bw * 0.04} ${tip[0]} ${tip[1]}`,
    stroke: coat.fur,
    "stroke-width": bw * 0.1,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("ellipse", { cx: tip[0], cy: tip[1] - bw * 0.06, rx: bw * 0.07, ry: bw * 0.11, fill: coat.mane });
  // Haunches and hind paws
  for (const sd of [-1, 1]) {
    out += el("ellipse", { cx: cx + sd * bw * 0.62, cy: gy - bw * 0.48, rx: bw * 0.52, ry: bw * 0.48, fill: shade });
    out += el("ellipse", { cx: cx + sd * bw * 0.85, cy: gy - bw * 0.08, rx: bw * 0.22, ry: bw * 0.1, fill: shade });
  }
  // Chest
  out += el("ellipse", { cx, cy: gy - bh * 0.9, rx: bw * 0.8, ry: bh * 0.92, fill: coat.fur });
  out += el("ellipse", { cx, cy: gy - bh * 1.25, rx: bw * 0.4, ry: bh * 0.42, fill: coat.light });
  // Front legs, edged in shadow, and paws
  for (const sd of [-1, 1]) {
    const lx = cx + sd * bw * 0.3;
    out += limb(lx, gy - bh * 0.9, lx, gy - bw * 0.15, bw * 0.36, shade);
    out += limb(lx, gy - bh * 0.9, lx, gy - bw * 0.15, bw * 0.28, coat.fur);
    out += el("ellipse", { cx: lx + sd * bw * 0.03, cy: gy - bw * 0.1, rx: bw * 0.21, ry: bw * 0.12, fill: coat.fur });
  }
  if (mane) {
    // The mane, with a lighter ring around the face
    const m = g.fork("mane");
    out += el("path", { d: blob(m, cx, hy + ry * 0.2, rx * 1.7, ry * 1.75, 10, 0.07), fill: coat.mane });
    out += el("path", {
      d: blob(m, cx, hy + ry * 0.12, rx * 1.38, ry * 1.42, 9, 0.06),
      fill: mix(coat.mane, coat.fur, 0.45),
    });
  }
  // Ears and head
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: cx + sd * rx * 0.72, cy: hy - ry * 0.72, r: rx * 0.24, fill: coat.fur });
    out += el("circle", { cx: cx + sd * rx * 0.72, cy: hy - ry * 0.7, r: rx * 0.12, fill: shade });
  }
  out += el("ellipse", { cx, cy: hy, rx, ry, fill: coat.fur });
  // Nose bridge, whisker pads and chin
  out += el("ellipse", {
    cx: fx,
    cy: hy + ry * 0.08,
    rx: rx * 0.2,
    ry: ry * 0.42,
    fill: mix(coat.fur, coat.light, 0.5),
  });
  for (const sd of [-1, 1])
    out += el("ellipse", { cx: fx + sd * rx * 0.2, cy: hy + ry * 0.5, rx: rx * 0.26, ry: ry * 0.2, fill: coat.light });
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.74, rx: rx * 0.2, ry: ry * 0.13, fill: coat.light });
  // Nose and mouth
  out += el("path", {
    d: s`M ${fx - rx * 0.15} ${hy + ry * 0.28} L ${fx + rx * 0.15} ${hy + ry * 0.28}
         Q ${fx + rx * 0.08} ${hy + ry * 0.42} ${fx} ${hy + ry * 0.44}
         Q ${fx - rx * 0.08} ${hy + ry * 0.42} ${fx - rx * 0.15} ${hy + ry * 0.28} Z`,
    fill: "#8a4a3e",
  });
  out += el("path", {
    d: s`M ${fx} ${hy + ry * 0.44} v ${ry * 0.12}
         M ${fx - rx * 0.16} ${hy + ry * 0.6} Q ${fx - rx * 0.08} ${hy + ry * 0.66} ${fx} ${hy + ry * 0.56}
         Q ${fx + rx * 0.08} ${hy + ry * 0.66} ${fx + rx * 0.16} ${hy + ry * 0.6}`,
    stroke: "#3a2418",
    "stroke-width": rx * 0.035,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Amber eyes
  for (const sd of [-1, 1]) {
    out += el("ellipse", {
      cx: fx + sd * rx * 0.34,
      cy: hy - ry * 0.12,
      rx: rx * 0.11,
      ry: ry * 0.075,
      fill: "#d79a2e",
    });
    out += el("circle", { cx: fx + sd * rx * 0.34, cy: hy - ry * 0.12, r: rx * 0.05, fill: "#1a1008" });
  }
  note.alt(`${mane ? "A lion with a shaggy mane" : "A lioness"} sitting on the savanna${dusk ? " at dusk" : ""}`);
  note.focus(fx, hy);
  // Head and ears, with the mane around them.
  if (mane) note.frame(cx - rx * 1.8, hy - ry * 1.6, rx * 3.6, ry * 3.4);
  else note.frame(cx - rx * 1.15, hy - ry * 1.15, rx * 2.3, ry * 2.1);
  return out;
});
