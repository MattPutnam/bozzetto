import { defineKind, el, facing, fill, hsl, mix, type Point, pts, s } from "../../draw/core";
import { field, flipFrame, flipX, leafShape, limb, tube } from "./shared";

const SQUIRRELS = [
  { fur: "#c4622d", belly: "#f3e3cc", tufts: true },
  { fur: "#b3552a", belly: "#f6e8d4", tufts: true },
  { fur: "#8e8c8a", belly: "#eeeae4" },
  { fur: "#7d7774", belly: "#ebe5de" },
  { fur: "#8a5a3a", belly: "#e9d6bd" },
  { fur: "#b9743e", belly: "#e8b77c" },
] as const;

/**
 * A squirrel sitting up on a branch or the ground, its bushy tail curled over its back, holding a nut.
 *
 * @category Animals
 */
export const squirrel = /* @__PURE__ */ defineKind("squirrel", "Squirrel", (g, w, h, note) => {
  const coat = g.pick(SQUIRRELS);
  const dir = g.pick([-1, 1]);
  const size = Math.min(w, h);
  const bh = size * g.f(0.36, 0.41);
  const onBranch = g.chance(0.5);
  const gy = h * (onBranch ? g.f(0.74, 0.8) : g.f(0.82, 0.87));
  const cx = w / 2 + dir * bh * 0.12 + w * g.f(-0.03, 0.03);
  const far = mix(coat.fur, "#000000", 0.18);
  const tufts = "tufts" in coat && g.chance(0.7);
  const acorn = g.chance(0.6);
  const scene = g.fork("scene");
  let out = "";
  if (onBranch) {
    // Soft leafy woods behind, and a branch across the picture
    const hue = scene.f(85, 130);
    out += fill(w, h, hsl(hue, 30, scene.f(80, 86)));
    for (let k = scene.i(9, 14); k > 0; k--)
      out += el("circle", {
        cx: w * scene.f(0, 1),
        cy: h * scene.f(0, 0.9),
        r: size * scene.f(0.08, 0.2),
        fill: hsl(hue + scene.f(-15, 15), 35, scene.f(62, 74)),
        opacity: "0.6",
      });
    const thick = size * 0.075;
    const slope = scene.f(-0.08, 0.08);
    const yAt = (x: number) => gy + (x - cx) * slope;
    const bark = hsl(scene.f(20, 32), 28, scene.f(32, 40));
    out += el("polygon", {
      points: pts([
        [-2, yAt(-2) - thick * 0.05],
        [w + 2, yAt(w + 2) - thick * 0.05],
        [w + 2, yAt(w + 2) + thick],
        [-2, yAt(-2) + thick],
      ]),
      fill: bark,
    });
    out += el("rect", {
      x: -2,
      y: 0,
      width: w + 4,
      height: thick * 0.18,
      fill: "#ffffff",
      opacity: "0.15",
      transform: s`translate(0 ${yAt(0) - thick * 0.05}) skewY(${(Math.atan(slope) * 180) / Math.PI})`,
    });
    // A twig with leaves, away from the squirrel
    const tx = cx - dir * bh * scene.f(0.9, 1.2);
    const leafHue = hue + scene.f(-10, 10);
    let leaves = "";
    for (let k = scene.i(3, 5); k > 0; k--)
      leaves += leafShape(tx, yAt(tx), -90 + scene.f(-70, 70), size * scene.f(0.08, 0.12), 0.3);
    out += el("path", { d: leaves, fill: hsl(leafHue, 40, 42) });
  } else {
    // A woodland floor with a tree trunk behind and fallen leaves
    const hz = h * scene.f(0.45, 0.55);
    out += field(scene, w, h, hz, scene.f(185, 210), [scene.f(70, 100), 35, scene.f(48, 56)]);
    const trunkX = dir > 0 ? w * scene.f(0.04, 0.14) : w * scene.f(0.86, 0.96);
    out += el("rect", {
      x: trunkX - size * 0.08,
      y: 0,
      width: size * 0.16,
      height: hz + (h - hz) * 0.25,
      fill: hsl(scene.f(20, 32), 22, 36),
    });
    out += el("ellipse", {
      cx: trunkX,
      cy: hz + (h - hz) * 0.25,
      rx: size * 0.13,
      ry: size * 0.025,
      fill: hsl(scene.f(20, 32), 22, 36),
    });
    let leaves = "";
    for (let k = scene.i(6, 10); k > 0; k--)
      leaves += leafShape(w * scene.f(0, 1), hz + (h - hz) * scene.f(0.35, 1), scene.f(0, 360), size * 0.035, 0.35);
    out += el("path", { d: leaves, fill: hsl(scene.f(15, 40), 60, 50), opacity: "0.8" });
  }
  // Shadow
  out += el("ellipse", { cx, cy: gy, rx: bh * 0.45, ry: bh * 0.05, fill: "#000", opacity: "0.18" });
  out += facing(cx, dir);
  // Bushy tail: up behind the back, then curling forward at the top
  const base: Point = [cx - bh * 0.2, gy - bh * 0.1];
  const bend: Point = [cx - bh * g.f(0.7, 0.8), gy - bh * 0.35];
  const top: Point = [cx - bh * g.f(0.45, 0.55), gy - bh * g.f(0.9, 1)];
  const curlCtl: Point = [cx - bh * g.f(0.3, 0.4), gy - bh * g.f(1.28, 1.36)];
  const tip: Point = [cx - bh * g.f(0.02, 0.12), gy - bh * g.f(1.12, 1.22)];
  const tail = (grow: number) =>
    tube(base, bend, top, bh * (0.22 + grow), bh * (0.36 + grow)) +
    tube(top, curlCtl, tip, bh * (0.36 + grow), bh * (0.18 + grow));
  out += el("path", { d: tail(0.07), fill: coat.fur, opacity: "0.45" });
  out += el("path", { d: tail(0), fill: coat.fur });
  // Head position, and the nut held up under the chin
  const hc: Point = [cx + bh * 0.13, gy - bh * 0.86];
  const r = bh * 0.19;
  const nut: Point = [hc[0] + r * 0.9, hc[1] + r * 1.25];
  const nr = bh * 0.09;
  // Far arm
  out += limb(cx + bh * 0.08, gy - bh * 0.58, nut[0] - nr * 0.3, nut[1] + nr * 0.6, bh * 0.065, far);
  // Body, leaning forward, with a pale belly
  const bodyShape = el("ellipse", {
    cx,
    cy: gy - bh * 0.4,
    rx: bh * 0.27,
    ry: bh * 0.4,
    transform: s`rotate(15 ${cx} ${gy - bh * 0.4})`,
  });
  out += el("g", { fill: coat.fur }, bodyShape);
  const clip = g.id("hide");
  out += el("defs", {}, el("clipPath", { id: clip }, bodyShape));
  out += el("ellipse", {
    cx: cx + bh * 0.2,
    cy: gy - bh * 0.42,
    rx: bh * 0.15,
    ry: bh * 0.34,
    fill: coat.belly,
    transform: s`rotate(15 ${cx} ${gy - bh * 0.4})`,
    "clip-path": `url(#${clip})`,
  });
  // Haunch and long hind foot
  out += el("circle", { cx: cx - bh * 0.07, cy: gy - bh * 0.19, r: bh * 0.2, fill: coat.fur });
  out += el("ellipse", { cx: cx + bh * 0.1, cy: gy - bh * 0.035, rx: bh * 0.17, ry: bh * 0.045, fill: far });
  // Far ear, head, cheek and snout
  const ear = (dx: number, paint: string) =>
    el("polygon", {
      points: pts([
        [hc[0] - r * 0.55 + dx, hc[1] - r * 0.55],
        [hc[0] - r * 0.35 + dx, hc[1] - r * 1.45],
        [hc[0] + dx, hc[1] - r * 0.8],
      ]),
      fill: paint,
    });
  out += ear(r * 0.35, far);
  out += el("circle", { cx: hc[0], cy: hc[1], r, fill: coat.fur });
  out += el("ellipse", { cx: hc[0] + r * 0.72, cy: hc[1] + r * 0.22, rx: r * 0.52, ry: r * 0.42, fill: coat.fur });
  out += el("ellipse", { cx: hc[0] + r * 0.45, cy: hc[1] + r * 0.55, rx: r * 0.4, ry: r * 0.28, fill: coat.belly });
  // Nose and eye with a pale ring
  out += el("circle", { cx: hc[0] + r * 1.18, cy: hc[1] + r * 0.12, r: r * 0.1, fill: "#2a1e1a" });
  out += el("circle", { cx: hc[0] + r * 0.3, cy: hc[1] - r * 0.12, r: r * 0.25, fill: coat.belly });
  out += el("circle", { cx: hc[0] + r * 0.32, cy: hc[1] - r * 0.12, r: r * 0.18, fill: "#1a1210" });
  out += el("circle", { cx: hc[0] + r * 0.38, cy: hc[1] - r * 0.18, r: r * 0.06, fill: "#ffffff" });
  // Near ear, with a tuft on some
  out += ear(0, coat.fur);
  if (tufts)
    out += el("path", {
      d: leafShape(hc[0] - r * 0.35, hc[1] - r * 1.35, -100 + g.f(-10, 10), r * 0.5, 0.25),
      fill: coat.fur,
    });
  // The nut: an acorn with its cap, or a round hazelnut
  if (acorn) {
    out += el("ellipse", { cx: nut[0], cy: nut[1] + nr * 0.25, rx: nr * 0.8, ry: nr, fill: "#c08a4a" });
    out += el("path", {
      d: s`M ${nut[0] - nr * 0.95} ${nut[1]} Q ${nut[0]} ${nut[1] - nr * 1.3} ${nut[0] + nr * 0.95} ${nut[1]} Z`,
      fill: "#7a5434",
    });
    out += limb(nut[0], nut[1] - nr * 0.6, nut[0] + nr * 0.15, nut[1] - nr * 0.95, nr * 0.2, "#7a5434");
  } else {
    out += el("circle", { cx: nut[0], cy: nut[1], r: nr, fill: "#a8703e" });
    out += el("ellipse", { cx: nut[0], cy: nut[1] - nr * 0.65, rx: nr * 0.55, ry: nr * 0.3, fill: "#e4c79a" });
  }
  // Near arm and paws around the nut
  out += limb(cx + bh * 0.05, gy - bh * 0.55, nut[0] - nr * 0.9, nut[1] + nr * 0.3, bh * 0.07, coat.fur);
  out += el("ellipse", { cx: nut[0] - nr * 0.85, cy: nut[1] + nr * 0.1, rx: nr * 0.42, ry: nr * 0.55, fill: coat.fur });
  out += el("ellipse", { cx: nut[0] + nr * 0.8, cy: nut[1] + nr * 0.2, rx: nr * 0.32, ry: nr * 0.45, fill: far });
  out += "</g>";
  note.alt(
    `A squirrel${tufts ? " with tufted ears" : ""} sitting ${onBranch ? "on a branch" : "on the ground"} holding ${acorn ? "an acorn" : "a nut"}`,
  );
  note.focus(flipX(cx, dir, hc[0] + r * 0.3), hc[1]);
  // Head and ears, out to the snout.
  flipFrame(note, cx, dir, hc[0] - r * 1.3, hc[1] - r * 1.6, r * 2.7, r * 2.7);
  return out;
});
