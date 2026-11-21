import { defineKind, el, hsl, mix, type Point, type Rand, s } from "../../draw/core";
import { arm, field, leafShape, limb } from "./shared";

/** A bamboo stalk from (x0, y0) to (x1, y1), with joints and `leaves` leaves on its upper part. */
function bamboo(
  g: Rand,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  paint: string,
  leaf: string,
  leaves: number,
): string {
  const gap = width * 5;
  let out = limb(x0, y0, x1, y1, width, paint);
  // Joints
  out += el("path", {
    d: s`M ${x0} ${y0} L ${x1} ${y1}`,
    stroke: "#000",
    "stroke-opacity": "0.22",
    "stroke-width": width,
    "stroke-dasharray": s`${width * 0.3} ${gap}`,
  });
  let d = "";
  for (let k = 0; k < leaves; k++) {
    const t = g.f(0.55, 1);
    const angle = g.pick([-1, 1]) * g.f(15, 70) + g.pick([0, 180]);
    d += leafShape(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, angle, width * g.f(4.4, 6.4), 0.25);
  }
  return out + el("path", { d, fill: leaf });
}

/** A giant panda sitting in a bamboo grove, holding a stalk of bamboo. */
export const panda = /* @__PURE__ */ defineKind("panda", "Panda", (g, w, h, note) => {
  const white = g.pick(["#f6f4ee", "#f1eee5", "#faf8f2"]);
  const black = g.pick(["#1f1d1f", "#2a2628", "#2b2622"]);
  const size = Math.min(w, h);
  const cx = w * g.f(0.42, 0.58);
  const hz = h * g.f(0.58, 0.68);
  const gy = h * g.f(0.85, 0.9);
  const bw = size * g.f(0.2, 0.23);
  const bh = bw * g.f(1, 1.08);
  const by = gy - bh * 0.92;
  const rx = bw * 0.66;
  const ry = rx * 0.88;
  const hy = by - bh * 0.86;
  const fx = cx + rx * g.f(-0.12, 0.12);
  const leafHue = g.f(85, 120);
  const leaf = hsl(leafHue, 45, g.f(32, 42));
  const side = g.pick([-1, 1]);
  const chewing = g.chance(0.35);
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(150, 200), [leafHue - 5, 35, 46]);
  // Bamboo grove behind
  for (let k = scene.i(5, 9); k > 0; k--) {
    const x = w * scene.f(0, 1);
    out += bamboo(
      scene,
      x,
      hz + (gy - hz) * scene.f(0, 0.3),
      x + h * scene.f(-0.06, 0.06),
      -size * 0.05,
      size * scene.f(0.022, 0.034),
      hsl(leafHue + scene.f(-10, 10), 35, scene.f(46, 60)),
      leaf,
      2,
    );
  }
  // Shadow
  out += el("ellipse", { cx, cy: gy, rx: bw * 1.35, ry: bw * 0.13, fill: "#000", opacity: "0.15" });
  // Body and the black band over the shoulders
  out += el("ellipse", { cx, cy: by, rx: bw, ry: bh, fill: white });
  out += el("ellipse", { cx, cy: by - bh * 0.52, rx: bw * 0.8, ry: bh * 0.34, fill: black });
  // Hind legs, soles toward us
  for (const sd of [-1, 1]) {
    out += el("ellipse", { cx: cx + sd * bw * 0.6, cy: gy - bw * 0.2, rx: bw * 0.36, ry: bw * 0.26, fill: black });
    out += el("ellipse", {
      cx: cx + sd * bw * 0.62,
      cy: gy - bw * 0.17,
      rx: bw * 0.17,
      ry: bw * 0.11,
      fill: "#4a4446",
    });
  }
  // The stalk it holds, resting in its lap
  const paw: Point = [cx + side * bw * 0.4, by + bh * 0.08];
  out += bamboo(
    g,
    paw[0] - side * bw * 0.2,
    by + bh * 0.62,
    cx + side * bw * 1.25,
    hy - ry * g.f(1.2, 1.6),
    size * 0.032,
    hsl(leafHue, 40, 55),
    leaf,
    3,
  );
  // Arms: one holds the stalk, the other rests on the belly
  for (const sd of [-1, 1]) {
    const [px, py] = sd === side ? paw : [cx + sd * bw * 0.3, by + bh * 0.38];
    out += arm(cx + sd * bw * 0.66, by - bh * 0.48, cx + sd * bw * 0.88, by + bh * 0.1, px, py, bw * 0.34, black);
  }
  // Ears and head
  for (const sd of [-1, 1])
    out += el("circle", { cx: cx + sd * rx * 0.76, cy: hy - ry * 0.72, r: rx * 0.3, fill: black });
  out += el("ellipse", { cx, cy: hy, rx, ry, fill: white });
  // Eye patches, drooping outward, with small eyes
  for (const sd of [-1, 1]) {
    const ex = fx + sd * rx * 0.38;
    const ey = hy - ry * 0.02;
    out += el("ellipse", {
      cx: ex,
      cy: ey,
      rx: rx * 0.18,
      ry: rx * 0.27,
      fill: black,
      transform: s`rotate(${-sd * 35} ${ex} ${ey})`,
    });
    out += el("circle", { cx: ex - sd * rx * 0.02, cy: ey - ry * 0.06, r: rx * 0.065, fill: "#ffffff" });
    out += el("circle", { cx: ex - sd * rx * 0.02, cy: ey - ry * 0.06, r: rx * 0.035, fill: "#111111" });
  }
  // Muzzle, nose and mouth
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.45, rx: rx * 0.34, ry: ry * 0.25, fill: mix(white, "#000000", 0.04) });
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.32, rx: rx * 0.13, ry: ry * 0.09, fill: black });
  out += el("path", {
    d: s`M ${fx} ${hy + ry * 0.38} v ${ry * 0.12}
         M ${fx - rx * 0.11} ${hy + ry * 0.55} Q ${fx} ${hy + ry * 0.63} ${fx + rx * 0.11} ${hy + ry * 0.55}`,
    stroke: black,
    "stroke-width": rx * 0.04,
    fill: "none",
    "stroke-linecap": "round",
  });
  if (chewing) {
    // A bamboo leaf poking out of the corner of its mouth
    const lx = fx + side * rx * 0.28;
    const ly = hy + ry * 0.58;
    out += el("ellipse", {
      cx: lx,
      cy: ly,
      rx: rx * 0.26,
      ry: rx * 0.06,
      fill: leaf,
      transform: s`rotate(${side * 20} ${lx - side * rx * 0.2} ${ly})`,
    });
  }
  note.alt(`A panda sitting in a bamboo grove, holding a stalk of bamboo${chewing ? " and chewing a leaf" : ""}`);
  note.focus(fx, hy);
  // Head and ears.
  note.frame(cx - rx * 1.2, hy - ry * 1.2, rx * 2.4, ry * 2.35);
  return out;
});
