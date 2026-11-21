import { defineKind, el, fill, hsl, type Point, pts, s } from "../../draw/core";

const FOXES = [
  { fur: "#d9692b", dark: "#2a1a14", light: "#fbf3e8", bg: [95, 30, 80] },
  { fur: "#c25a24", dark: "#2a1a14", light: "#f6ead9", bg: [30, 35, 82] },
  { fur: "#e9e6e1", dark: "#5b5f68", light: "#ffffff", bg: [205, 35, 82] },
  { fur: "#dcb07a", dark: "#5a3a22", light: "#fbf3e3", bg: [40, 45, 84] },
] as const;

/** An angular fox face with pale cheeks and dark-tipped ears. */
export const fox = /* @__PURE__ */ defineKind("fox", "Fox", (g, w, h, note) => {
  const palette = g.pick(FOXES);
  const size = Math.min(w, h);
  const cx = w / 2;
  const cy = h * 0.45;
  const rx = size * g.f(0.25, 0.29);
  const ry = rx * g.f(0.85, 1);
  let out = fill(w, h, hsl(palette.bg[0] + g.f(-20, 20), palette.bg[1], palette.bg[2]));
  // Body and pale chest
  out += el("ellipse", { cx, cy: cy + ry * 1.95, rx: rx * 1.1, ry: ry * 1.15, fill: palette.fur });
  out += el("polygon", {
    points: pts([
      [cx - rx * 0.45, cy + ry * 1.05],
      [cx + rx * 0.45, cy + ry * 1.05],
      [cx, cy + ry * 1.75],
    ]),
    fill: palette.light,
  });
  // Ears: fur, a dark tip and a pale inside
  const tip = g.f(1.2, 1.45);
  const spread = g.f(0.75, 0.95);
  for (const sd of [-1, 1]) {
    const ear: Point[] = [
      [cx + sd * rx * 0.95, cy - ry * 0.2],
      [cx + sd * rx * spread, cy - ry * tip],
      [cx + sd * rx * 0.28, cy - ry * 0.6],
    ];
    const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    out += el("polygon", { points: pts(ear), fill: palette.fur });
    out += el("polygon", {
      points: pts([lerp(ear[0], ear[1], 0.62), ear[1], lerp(ear[2], ear[1], 0.62)]),
      fill: palette.dark,
    });
    out += el("polygon", {
      points: pts([
        lerp(ear[0], ear[2], 0.25),
        lerp(ear[0], ear[1], 0.55),
        lerp(ear[2], ear[1], 0.55),
        lerp(ear[0], ear[2], 0.8),
      ]),
      fill: palette.light,
      opacity: "0.8",
    });
  }
  // Head
  out += el("polygon", {
    points: pts([
      [cx - rx, cy - ry * 0.2],
      [cx - rx * 0.55, cy - ry * 0.62],
      [cx + rx * 0.55, cy - ry * 0.62],
      [cx + rx, cy - ry * 0.2],
      [cx, cy + ry],
    ]),
    fill: palette.fur,
  });
  // Pale cheeks and muzzle
  out += el("polygon", {
    points: pts([
      [cx - rx, cy - ry * 0.2],
      [cx - rx * 0.25, cy + ry * 0.18],
      [cx, cy + ry * 0.08],
      [cx + rx * 0.25, cy + ry * 0.18],
      [cx + rx, cy - ry * 0.2],
      [cx, cy + ry],
    ]),
    fill: palette.light,
  });
  // Slanted eyes
  for (const sd of [-1, 1])
    out += el("ellipse", {
      cx: cx + sd * rx * 0.36,
      cy: cy - ry * 0.12,
      rx: rx * 0.1,
      ry: ry * 0.065,
      fill: palette.dark,
      transform: s`rotate(${sd * 18} ${cx + sd * rx * 0.36} ${cy - ry * 0.12})`,
    });
  // Nose
  out += el("circle", { cx, cy: cy + ry * 0.9, r: rx * 0.09, fill: palette.dark });
  note.alt("A fox's face with pale cheeks and dark-tipped ears");
  note.focus(cx, cy - ry * 0.12);
  // Head and ears, down to the chin.
  note.frame(cx - rx, cy - ry * 1.45, rx * 2, ry * 2.5);
  return out;
});
