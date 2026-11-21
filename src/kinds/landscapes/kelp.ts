import { defineKind, el, hsl, type Point, type Rand, s } from "../../draw/core";
import { glowDef, lerp, smallFish, underwater, whole } from "./shared";

/** A school of tiny fish drawn as one path: `count` of them around (x, y), all facing `dir`. */
function school(g: Rand, x: number, y: number, count: number, r: number, dir: number, paint: string): string {
  let d = "";
  for (let k = 0; k < count; k++) {
    const a = g.f(0, Math.PI * 2);
    const dist = Math.sqrt(g.f(0, 1));
    const fx = x + Math.cos(a) * dist * r * 9;
    const fy = y + Math.sin(a) * dist * r * 4;
    d += s`M${fx - r} ${fy}a${r} ${r * 0.45} 0 1 0 ${2 * r} 0a${r} ${r * 0.45} 0 1 0 ${-2 * r} 0`;
    d += s`M${fx - dir * r * 0.8} ${fy}l${-dir * r * 0.8} ${-r * 0.45}v${r * 0.9}Z`;
  }
  return el("path", { d: whole(d), fill: paint });
}

/**
 * One giant kelp plant from its holdfast at (x, base) up to `top`, leaning with the current
 * (`drift`, -1 or 1): path data for its thin stalk, for its long ribbon blades in two tones, and
 * for the round float at the foot of each blade. Near the top the blades spread into a canopy.
 * `gap` spaces the blades out.
 */
function kelpPlant(
  g: Rand,
  x: number,
  base: number,
  top: number,
  unit: number,
  drift: number,
  gap = 1,
): [string, string, string, string] {
  const rise = base - top;
  const sway = unit * g.f(0.02, 0.05);
  const lean = drift * g.f(0.04, 0.14) * rise;
  const ph = g.f(0, 6);
  const at = (t: number): Point => [x + sway * Math.sin(t * Math.PI * 1.5 + ph) + lean * t * t, base - rise * t];
  const line: Point[] = [];
  for (let k = 0; k <= 6; k++) line.push(at(k / 6));
  let stem = s`M${line[0][0]} ${line[0][1]}`;
  for (let k = 1; k < line.length - 1; k++) {
    const [mx, my] = lerp(line[k], line[k + 1], 0.5);
    stem += s`Q${line[k][0]} ${line[k][1]} ${mx} ${my}`;
  }
  stem += s`L${line[6][0]} ${line[6][1]}`;
  const blades = ["", ""];
  let floats = "";
  const step = (unit * gap * g.f(0.11, 0.13)) / rise;
  for (let t = g.f(0.08, 0.14); t < 1.02; t += step * g.f(0.85, 1.15)) {
    const [bx, by] = at(Math.min(t, 1));
    const canopy = t > 0.82;
    // Most blades stream the way the current runs; a few stand up against it.
    const a = drift * (canopy ? g.f(1.1, 1.5) : g.chance(0.7) ? g.f(0.4, 1.05) : -g.f(0.15, 0.45));
    const L = unit * g.f(0.2, 0.27) * (canopy ? 1.2 : 1);
    const W = L * g.f(0.12, 0.15);
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const along = (f: number, side: number): Point => [
      bx + dx * L * f - dy * W * side,
      by + dy * L * f + dx * W * side,
    ];
    const tip: Point = [bx + dx * L + drift * L * 0.12, by + dy * L + L * 0.04];
    const end = (side: number): Point => [tip[0] - dy * W * 0.45 * side, tip[1] + dx * W * 0.45 * side];
    const [c1, c2, e1] = [along(0.25, g.f(0.7, 0.95)), along(0.65, g.f(0.95, 1.2)), end(1)];
    const [c3, c4, e2] = [along(0.65, -g.f(0.95, 1.2)), along(0.25, -g.f(0.7, 0.95)), end(-1)];
    blades[g.i(0, 1)] += s`M${bx} ${by}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${e1[0]} ${e1[1]}
      Q${tip[0] + dx * W * 0.7} ${tip[1] + dy * W * 0.7} ${e2[0]} ${e2[1]}C${c3[0]} ${c3[1]} ${c4[0]} ${c4[1]} ${bx} ${by}Z`;
    floats += s`M${bx} ${by}h0`;
  }
  return [stem, blades[0], blades[1], floats];
}

/** A seal swimming, as a dark shape far off in the water, `L` long and facing `dir`. */
const sealShape = (x: number, y: number, L: number, dir: number, paint: string) =>
  el("path", {
    transform: s`translate(${x} ${y}) scale(${(dir * L) / 100} ${L / 100})`,
    d: `M50 0C47-9 30-13 8-12C-18-10-40-5-58-1L-72-10L-69 1L-76 11L-57 4C-38 8-12 11 8 10L-2 22L16 10C33 8 47 6 50 0Z`,
    fill: paint,
    opacity: "0.4",
  });

/** A sea otter floating on its back at the surface, seen from below, `L` long and facing `dir`. */
const otterShape = (x: number, y: number, L: number, dir: number, paint: string) =>
  el("path", {
    transform: s`translate(${x} ${y}) scale(${(dir * L) / 100} ${L / 100})`,
    d: `M-38 0C-30-9 20-11 34-6A13 12 0 1 1 46 8C30 12-10 12-30 8L-58 6L-58 1Z
        M12 6L18 18L23 6ZM-14 7L-12 18L-6 7Z`,
    fill: paint,
    opacity: "0.45",
  });

/** A kelp forest: tall fronds swaying up toward a bright surface, fish among them, rocks below. */
export const kelp = /* @__PURE__ */ defineKind("kelp", "Kelp forest", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.f(165, 195);
  let out = underwater(g, w, h, hsl(hue - 5, 45, 74), hsl(hue + 15, 55, 22));
  // The bright surface overhead.
  const sx = w * g.f(0.2, 0.8);
  const glow = g.id("glow");
  out += el("defs", {}, glowDef(glow, "#ffffff", 0.7));
  out += el("ellipse", { cx: sx, cy: 0, rx: unit * 0.6, ry: unit * 0.3, fill: `url(#${glow})` });
  let surface = s`M0 0V${h * 0.035}`;
  for (let k = 1; k <= 12; k++)
    surface += s`Q${(w * (k - 0.5)) / 12} ${h * (k % 2 ? 0.055 : 0.02)} ${(w * k) / 12} ${h * 0.035}`;
  out += el("path", { d: whole(surface + "V0Z"), fill: "#fff", opacity: "0.25" });
  // Far kelp, hazy in the water, all leaning the way the current runs.
  const drift = g.pick([-1, 1]);
  const plants = Math.max(2, Math.min(4, Math.round(w / (unit * 0.34))));
  const haze = hsl(hue + 10, 30, 48);
  const layer = (parts: [string, string, string, string][], paints: readonly string[], width: number) =>
    el("path", {
      d: whole(parts.map(p => p[0]).join("")),
      fill: "none",
      stroke: paints[0],
      "stroke-width": width,
    }) +
    [1, 2]
      .map(k =>
        el("path", {
          d: whole(parts.map(p => p[k]).join("")),
          fill: paints[k],
          "fill-opacity": "0.92",
          stroke: paints[3],
          "stroke-width": paints[3] ? width * 0.45 : undefined,
        }),
      )
      .join("") +
    (paints[4]
      ? el("path", {
          d: whole(parts.map(p => p[3]).join("")),
          stroke: paints[4],
          "stroke-width": unit * 0.022,
          "stroke-linecap": "round",
        })
      : "");
  const far: [string, string, string, string][] = [];
  for (let k = 0; k <= plants; k++)
    far.push(kelpPlant(g, (w * (k + g.f(0.1, 0.9))) / (plants + 1), h, h * g.f(0.05, 0.25), unit * 0.7, drift, 2.6));
  out += el("g", { opacity: "0.3" }, layer(far, [haze, haze, haze, ""], unit * 0.005));
  // A seal far off, or an otter floating at the surface.
  const visitor = g.pick(["seal", "otter", "none"] as const);
  const shade = hsl(hue + 20, 40, 18);
  const vdir = g.pick([-1, 1]);
  if (visitor === "seal") out += sealShape(w * g.f(0.2, 0.8), h * g.f(0.25, 0.4), unit * g.f(0.18, 0.24), vdir, shade);
  if (visitor === "otter") out += otterShape(w * g.f(0.2, 0.8), h * 0.04, unit * g.f(0.18, 0.22), vdir, shade);
  // Rocks along the bottom.
  const rock = hsl(hue + g.f(0, 40), 12, g.f(26, 34));
  let rocks = s`M-5 ${h}V${h - unit * 0.03}`;
  for (let x = -5; x < w;) {
    const rw = unit * g.f(0.1, 0.2);
    const ry = h - unit * g.f(0.02, 0.05);
    rocks += s`C${x} ${ry - unit * g.f(0.06, 0.1)} ${x + rw} ${ry - unit * g.f(0.06, 0.1)} ${x + rw} ${ry}`;
    x += rw;
  }
  // Kelp, in two layers with the fish between them: golden olive to amber, with pale rims.
  const kh = g.f(32, 46);
  const kelpColors = (d: number) => [
    hsl(kh - 4, 40, 36 + d),
    hsl(kh, 58, 36 + d),
    hsl(kh + 10, 62, 43 + d),
    hsl(kh + 14, 75, 64 + d),
    hsl(kh + 16, 70, 56 + d),
  ];
  const rooted = (n: number) =>
    Array.from({ length: n }, (_, k) =>
      kelpPlant(
        g,
        (w * (k + g.f(0.15, 0.85))) / n - drift * unit * 0.08,
        h - unit * g.f(0.03, 0.06),
        h * g.f(0, 0.1),
        unit,
        drift,
      ),
    );
  out += layer(rooted(plants), kelpColors(-8), unit * 0.007);
  out += el("path", { d: whole(rocks + "V" + h + "Z"), fill: rock });
  // Fish: a school of small ones, or a few larger ones.
  const fx = w * g.f(0.3, 0.7);
  const fy = h * g.f(0.35, 0.6);
  const fdir = g.pick([-1, 1]);
  const many = g.chance(0.6);
  if (many) {
    out += school(g, fx, fy, g.i(9, 14), unit * 0.022, fdir, hsl(hue, 15, 84));
  } else {
    const fh = g.f(15, 40);
    for (let k = g.i(2, 3); k > 0; k--)
      out += smallFish(
        fx + g.f(-0.25, 0.25) * w,
        fy + g.f(-0.15, 0.15) * h,
        unit * g.f(0.04, 0.055),
        g.pick([-1, 1]),
        hsl(fh, 90, 56),
        hsl(fh - 5, 85, 48),
      );
  }
  out += layer(rooted(Math.max(1, Math.round(plants * 0.5))), kelpColors(0), unit * 0.007);
  const extra =
    visitor === "seal" ? ", a seal far off" : visitor === "otter" ? ", an otter floating at the surface" : "";
  note.alt(
    `Giant kelp swaying up toward a bright surface, ${many ? "a school of small fish" : "fish"} among the fronds${extra}`,
  );
  note.focus(fx, fy);
  return out;
});
