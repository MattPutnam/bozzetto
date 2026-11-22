import { defineKind, el, fill, hsl, lin, mix, pts, s } from "../../draw/core";

const RABBITS = [
  { fur: "#f4f1ea", inner: "#f4b6c2" },
  { fur: "#c9b39a", inner: "#f0b6b6" },
  { fur: "#8d7b6a", inner: "#e9a8a8" },
  { fur: "#5a5049", inner: "#d99a9a" },
  { fur: "#e3d3bd", inner: "#f4b6c2" },
] as const;

/**
 * A rabbit in a meadow: tall or lop ears, pink nose, whiskers.
 *
 * @category Animals
 */
export const rabbit = /* @__PURE__ */ defineKind("rabbit", "Rabbit", (g, w, h, note) => {
  const coat = g.pick(RABBITS);
  const size = Math.min(w, h);
  const cx = w / 2;
  const cy = h * 0.58;
  const rx = size * g.f(0.17, 0.2);
  const ry = rx * g.f(0.88, 0.98);
  const lop = g.chance(0.3);
  const gy = h * g.f(0.78, 0.86);
  const sky = g.id("sky");
  const skyHue = g.f(160, 210);
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 45, 80), hsl(skyHue - 20, 50, 94)])) + fill(w, h, `url(#${sky})`);
  // Meadow
  out += el("rect", { y: gy, width: w, height: h - gy, fill: hsl(g.f(85, 120), 40, 52) });
  // Body
  out += el("ellipse", { cx, cy: cy + ry * 1.45, rx: rx * 1.25, ry: ry * 0.95, fill: coat.fur });
  if (!lop) {
    // Tall ears, behind the head, each tilted about its base
    const tilt = g.f(4, 16);
    const len = g.f(1.2, 1.5);
    for (const sd of [-1, 1]) {
      const ex = cx + sd * rx * 0.42;
      const ey = cy - ry * (0.55 + len * 0.6);
      const rot = sd * tilt * (sd < 0 ? 1 : g.f(0.4, 1.6));
      out += el(
        "g",
        { transform: s`rotate(${rot} ${ex} ${cy - ry * 0.6})` },
        el("ellipse", { cx: ex, cy: ey, rx: rx * 0.26, ry: ry * len * 0.62, fill: coat.fur }),
        el("ellipse", { cx: ex, cy: ey + ry * 0.05, rx: rx * 0.13, ry: ry * len * 0.48, fill: coat.inner }),
      );
    }
  }
  // Head
  out += el("ellipse", { cx, cy, rx, ry, fill: coat.fur });
  if (lop) {
    // Lop ears start on top of the head and drape down past the cheeks, angled outward.
    const len = ry * g.f(0.75, 0.9);
    const splay = g.f(18, 30);
    const ear = mix(coat.fur, "#000000", 0.1);
    for (const sd of [-1, 1]) {
      const px = cx + sd * rx * 0.45;
      const py = cy - ry * 0.82;
      out += el("ellipse", {
        cx: px,
        cy: py + len,
        rx: rx * 0.3,
        ry: len,
        fill: ear,
        transform: s`rotate(${-sd * splay} ${px} ${py})`,
      });
    }
    out += el("ellipse", { cx, cy: cy - ry * 0.8, rx: rx * 0.55, ry: ry * 0.2, fill: ear });
  }
  // Eyes and blushing cheeks
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: cx + sd * rx * 0.4, cy: cy - ry * 0.08, r: rx * 0.1, fill: "#1c1512" });
    out += el("circle", {
      cx: cx + sd * rx * 0.55,
      cy: cy + ry * 0.35,
      r: rx * 0.16,
      fill: "#f28b9b",
      opacity: "0.3",
    });
  }
  // Nose
  out += el("polygon", {
    points: pts([
      [cx - rx * 0.09, cy + ry * 0.2],
      [cx + rx * 0.09, cy + ry * 0.2],
      [cx, cy + ry * 0.3],
    ]),
    fill: "#e46f86",
  });
  // Mouth
  out += el("path", {
    d: s`M ${cx} ${cy + ry * 0.3}
         v ${ry * 0.1}
         M ${cx - rx * 0.12} ${cy + ry * 0.46}
         Q ${cx - rx * 0.06} ${cy + ry * 0.5} ${cx} ${cy + ry * 0.4}
         Q ${cx + rx * 0.06} ${cy + ry * 0.5} ${cx + rx * 0.12} ${cy + ry * 0.46}`,
    stroke: "#3a2a2a",
    "stroke-width": rx * 0.035,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Whiskers: two on each side
  let whiskers = "";
  for (const sd of [-1, 1])
    for (const k of [-1, 1])
      whiskers += s`M ${cx + sd * rx * 0.2} ${cy + ry * 0.33 + k * ry * 0.04} L ${cx + sd * rx * 0.95} ${cy + ry * 0.28 + k * ry * 0.14} `;
  out += el("path", { d: whiskers, stroke: "#6b5d55", "stroke-width": rx * 0.02, opacity: "0.6" });
  note.alt(lop ? "A lop-eared rabbit in a meadow" : "A rabbit with tall ears in a meadow");
  note.focus(cx, cy - ry * 0.08);
  // Head and ears: lop ears hang beside the face, tall ones stand above it.
  if (lop) note.frame(cx - rx * 1.3, cy - ry * 1.05, rx * 2.6, ry * 2.1);
  else note.frame(cx - rx * 1.05, cy - ry * 2, rx * 2.1, ry * 3.05);
  return out;
});
