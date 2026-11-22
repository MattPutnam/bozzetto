import { defineKind, el, fill, hsl, pts, s } from "../../draw/core";
import { andList } from "../../draw/words";

const DOG_COATS = [
  { fur: "#c8945c", ear: "#8a5a32", muzzle: "#f1dcc0" },
  { fur: "#e9d7b8", ear: "#b8875a", muzzle: "#fbf3e6" },
  { fur: "#2e2a2b", ear: "#1d1a1b", muzzle: "#b9895c" },
  { fur: "#d9a441", ear: "#b07a26", muzzle: "#f3dfae" },
  { fur: "#8b5a3c", ear: "#5f3a24", muzzle: "#d7b79a" },
  { fur: "#f4f1ea", ear: "#2b2b2b", muzzle: "#ffffff", spots: true },
] as const;

/**
 * A dog's face: floppy or pointed ears, a muzzle, sometimes an eye patch, a tongue and a collar.
 *
 * @category Animals
 */
export const dog = /* @__PURE__ */ defineKind("dog", "Dog", (g, w, h, note) => {
  const coat = g.pick(DOG_COATS);
  const size = Math.min(w, h);
  const cx = w / 2;
  const cy = h * 0.47;
  const rx = size * g.f(0.22, 0.26);
  const ry = rx * g.f(0.88, 1);
  let out = fill(w, h, hsl(g.f(0, 360), 32, 84));
  // Body
  out += el("ellipse", { cx, cy: cy + ry * 1.75, rx: rx * 1.35, ry: ry * 1.1, fill: coat.fur });
  // Collar and tag
  const collar = hsl(g.f(0, 360), 65, 48);
  out += el("path", {
    d: s`M ${cx - rx * 0.75} ${cy + ry * 0.92}
         Q ${cx} ${cy + ry * 1.18} ${cx + rx * 0.75} ${cy + ry * 0.92}`,
    stroke: collar,
    "stroke-width": ry * 0.14,
    fill: "none",
  });
  out += el("circle", { cx, cy: cy + ry * 1.2, r: rx * 0.1, fill: "#f2c14e" });
  const floppy = g.chance(0.65);
  // Pointed ears, behind the head
  if (!floppy)
    for (const sd of [-1, 1])
      out += el("polygon", {
        points: pts([
          [cx + sd * rx * 0.85, cy - ry * 0.25],
          [cx + sd * rx * g.f(0.75, 0.95), cy - ry * 1.35],
          [cx + sd * rx * 0.25, cy - ry * 0.8],
        ]),
        fill: coat.ear,
      });
  // Head
  out += el("ellipse", { cx, cy, rx, ry, fill: coat.fur });
  // Spots
  if ("spots" in coat)
    for (let k = g.i(3, 5); k > 0; k--) {
      // A spot somewhere on the upper face, pulled in if it would hang over the edge of the head.
      let dx = rx * g.f(-0.8, 0.8);
      let dy = ry * g.f(-0.8, 0.1);
      const r = rx * g.f(0.06, 0.12);
      const reach = (dx / (rx - r * 1.3)) ** 2 + (dy / (ry - r * 1.3)) ** 2;
      if (reach > 1) {
        dx /= Math.sqrt(reach);
        dy /= Math.sqrt(reach);
      }
      out += el("circle", { cx: cx + dx, cy: cy + dy, r, fill: "#2b2b2b" });
    }
  // Eye patch
  const patchSide = g.chance(0.4) ? g.pick([-1, 1]) : 0;
  if (patchSide)
    out += el("ellipse", {
      cx: cx + patchSide * rx * 0.38,
      cy: cy - ry * 0.12,
      rx: rx * 0.3,
      ry: ry * 0.28,
      fill: coat.ear,
    });
  if (floppy) {
    // Ears hang from the top corners of the head, nearly straight down, splaying out a little.
    const len = ry * g.f(0.55, 0.7);
    const splay = g.f(0, 10);
    for (const sd of [-1, 1]) {
      const px = cx + sd * rx * 0.8;
      const py = cy - ry * 0.6;
      out += el("ellipse", {
        cx: px,
        cy: py + len,
        rx: rx * 0.27,
        ry: len,
        fill: coat.ear,
        transform: s`rotate(${-sd * splay} ${px} ${py})`,
      });
    }
  }
  // Muzzle
  out += el("ellipse", { cx, cy: cy + ry * 0.4, rx: rx * 0.5, ry: ry * 0.38, fill: coat.muzzle });
  // Eyes with highlights
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: cx + sd * rx * 0.38, cy: cy - ry * 0.12, r: rx * 0.1, fill: "#1c1512" });
    out += el("circle", { cx: cx + sd * rx * 0.38 + rx * 0.03, cy: cy - ry * 0.15, r: rx * 0.03, fill: "#fff" });
  }
  // Nose
  out += el("ellipse", { cx, cy: cy + ry * 0.2, rx: rx * 0.16, ry: ry * 0.11, fill: "#1c1512" });
  // Tongue
  const tongue = g.chance(0.5);
  if (tongue) out += el("ellipse", { cx, cy: cy + ry * 0.62, rx: rx * 0.12, ry: ry * 0.16, fill: "#e46f7b" });
  // Mouth: a line down from the nose, then two curves
  out += el("path", {
    d: s`M ${cx} ${cy + ry * 0.3}
         v ${ry * 0.16}
         M ${cx - rx * 0.2} ${cy + ry * 0.5}
         Q ${cx - rx * 0.1} ${cy + ry * 0.58} ${cx} ${cy + ry * 0.46}
         Q ${cx + rx * 0.1} ${cy + ry * 0.58} ${cx + rx * 0.2} ${cy + ry * 0.5}`,
    stroke: "#1c1512",
    "stroke-width": rx * 0.04,
    fill: "none",
    "stroke-linecap": "round",
  });
  const features = [
    floppy ? "floppy ears" : "pointed ears",
    patchSide && "an eye patch",
    tongue && "its tongue out",
    "a collar",
  ];
  note.alt(`A ${"spots" in coat ? "spotted " : ""}dog's face with ${andList(features)}`);
  note.focus(cx, cy - ry * 0.12);
  // Head, ears and collar.
  note.frame(cx - rx * 1.2, cy - ry * 1.4, rx * 2.4, ry * 2.6);
  return out;
});
