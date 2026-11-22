import { defineKind, el, hsl, type Rand, s } from "../../draw/core";
import { dot, LIT, local, shade, skyAt, timeOfDay, tone, UNLIT, veil, when } from "./shared";

/** Four lattice sails around a hub at (hx, hy), `len` long, turned by `angle` radians. */
function sails(g: Rand, hx: number, hy: number, len: number, angle: number, frame: string, cloth: string): string {
  const stock = len * 0.035;
  const width = len * 0.21;
  const r0 = len * 0.16;
  const covered = g.chance(0.55) ? g.f(0.4, 1) : 0;
  let stocks = "";
  let lattice = "";
  let cloths = "";
  for (let k = 0; k < 4; k++) {
    const theta = angle + (k * Math.PI) / 2;
    const at = (along: number, across: number): string =>
      s`${hx + Math.sin(theta) * along + Math.cos(theta) * across} ${hy - Math.cos(theta) * along + Math.sin(theta) * across}`;
    const near = stock / 2;
    const far = stock / 2 + width;
    stocks += `M${at(-len * 0.08, 0)}L${at(len, 0)}`;
    lattice += `M${at(r0, near)}L${at(len, near)}L${at(len, far)}L${at(r0, far)}Z`;
    lattice += `M${at(r0, (near + far) / 2)}L${at(len, (near + far) / 2)}`;
    for (let j = 1; j < 7; j++) {
      const along = r0 + ((len - r0) * j) / 7;
      lattice += `M${at(along, near)}L${at(along, far)}`;
    }
    if (covered) {
      const from = len - (len - r0) * covered;
      cloths += `M${at(from, near)}L${at(len, near)}L${at(len, far)}L${at(from, far)}Z`;
    }
  }
  let out = el("path", { d: lattice, fill: "none", stroke: frame, "stroke-width": len * 0.014 });
  if (cloths) out += el("path", { d: cloths, fill: cloth, opacity: 0.9 });
  out += el("path", { d: stocks, stroke: frame, "stroke-width": stock, "stroke-linecap": "round" });
  return out;
}

const TULIPS = ["#e8505b", "#f9d56e", "#f3a6c8", "#f08a5d", "#b48ede", "#f4f1ea", "#d6453d"];

/**
 * A traditional windmill with four sails, among tulip fields or beside a canal.
 *
 * @category Buildings
 */
export const windmill = /* @__PURE__ */ defineKind(
  "windmill",
  "Windmill",
  { setting: ["tulips", "canal"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const time = timeOfDay(g);
    const dark = shade(time);
    const setting = g.option("setting", g.pick(["tulips", "canal"] as const));
    const ground = h * (setting === "canal" ? g.f(0.6, 0.66) : g.f(0.63, 0.7));
    const horizon = ground - h * g.f(0.02, 0.05);
    const size = Math.min(unit * 0.55, (w * 0.46) / 0.9, (ground - h * 0.03) / 1.9);
    const mx = Math.max(size * 0.95, Math.min(w - size * 0.95, w * g.f(0.38, 0.62)));
    const grass = g.f(85, 120);
    let out = skyAt(g, w, h, time, horizon);
    // Flat land to the horizon, with a far windmill and trees along it.
    out += el("rect", { y: horizon, width: w, height: h - horizon, fill: tone(grass, 38, 48, dark) });
    const far = tone(grass + 20, 15, 52, dark);
    let trees = "";
    for (let k = g.i(2, 5); k > 0; k--) {
      const x = w * g.f(0, 1);
      if (Math.abs(x - mx) < size * 0.4) continue;
      const r = unit * g.f(0.015, 0.03);
      trees += dot(x, horizon - r * 0.4, r) + dot(x + r * 1.1, horizon - r * 0.2, r * 0.8);
    }
    out += el("path", { d: trees, fill: far });
    if (g.chance(0.6)) {
      const fx = mx + (mx < w / 2 ? 1 : -1) * Math.min(w * 0.35, size * g.f(1.4, 2.2));
      const fs = size * g.f(0.18, 0.25);
      const v = local(fx, horizon + 1, fs);
      out += v.poly(
        [
          [-0.25, 0],
          [-0.15, -1],
          [0.15, -1],
          [0.25, 0],
        ],
        { fill: far },
      );
      const a = g.f(0, Math.PI / 2);
      let x = "";
      for (const t of [a, a + Math.PI / 2])
        x += `M ${Math.sin(t) * 0.8} ${-1.05 - Math.cos(t) * 0.8} L ${-Math.sin(t) * 0.8} ${-1.05 + Math.cos(t) * 0.8} `;
      out += v.path(x, { stroke: far, "stroke-width": v.k(0.08) });
    }
    // The near ground: a canal, or tulip fields in stripes running toward the horizon.
    const waterTop = ground + size * 0.04;
    if (setting === "canal") {
      out += el("rect", { y: ground - size * 0.01, width: w, height: h - ground, fill: tone(grass - 5, 42, 40, dark) });
      out += el("rect", {
        y: waterTop,
        width: w,
        height: h - waterTop,
        fill: time === "night" ? hsl(225, 35, 22) : time === "dusk" ? hsl(300, 25, 50) : hsl(205, 45, 62),
      });
    } else {
      out += el("rect", { y: ground, width: w, height: h - ground, fill: tone(grass, 42, 40, dark) });
      const vx = w * g.f(0.3, 0.7);
      const vy = ground - (h - ground) * 0.7;
      const f = (ground - vy) / (h - vy);
      const band = unit * g.f(0.1, 0.15);
      const hues = [...TULIPS].sort(() => g.next() - 0.5).slice(0, g.i(2, 4));
      const byColor = new Map<string, string>();
      const reach = Math.max(vx, w - vx) / f + band;
      for (let k = Math.floor(-reach / band); k * band < reach; k++) {
        const a = vx + k * band;
        const b = a + band * 0.72;
        if (vx + (b - vx) * f < 0 || vx + (a - vx) * f > w) continue;
        const color = hues[((k % hues.length) + hues.length) % hues.length];
        byColor.set(
          color,
          (byColor.get(color) ?? "") +
            s`M${vx + (a - vx) * f} ${ground}L${vx + (b - vx) * f} ${ground}L${b} ${h}L${a} ${h}Z`,
        );
      }
      for (const [color, d] of byColor) out += el("path", { d, fill: color, opacity: dark < 1 ? 0.75 : 1 });
    }
    // The mill: a tapering tower on a brick base, a gallery, a cap and the sails.
    const u = local(mx, ground, size);
    const tower = g.pick([
      [30, 22, 32],
      [150, 15, 26],
      [5, 40, 40],
      [40, 18, 86],
      [210, 12, 40],
    ] as const);
    const body = tone(tower[0], tower[1], tower[2], dark);
    const wood = tone(25, 30, 22, dark);
    let mill = u.ellipse(0, 0, 0.36, 0.035, { fill: "#000", opacity: 0.15 });
    mill += u.poly(
      [
        [-0.27, 0],
        [-0.16, -1],
        [0.16, -1],
        [0.27, 0],
      ],
      { fill: body },
    );
    const gallery = g.chance(0.6);
    if (gallery) {
      mill += u.poly(
        [
          [-0.27, 0],
          [-0.226, -0.4],
          [0.226, -0.4],
          [0.27, 0],
        ],
        { fill: tone(g.f(5, 20), 40, 42, dark) },
      );
      mill += u.rect(-0.4, -0.42, 0.8, 0.03, { fill: wood });
      let rail = "M -0.4 -0.5 H 0.4 ";
      for (let k = 0; k <= 8; k++) rail += `M ${-0.4 + k * 0.1} -0.5 V -0.42 `;
      mill += u.path(rail, { stroke: wood, "stroke-width": u.k(0.012) });
    }
    mill += u.poly(
      [
        [0, 0],
        [0, -1],
        [0.16, -1],
        [0.27, 0],
      ],
      { fill: "#000", opacity: 0.12 },
    );
    mill += u.path("M -0.07 0 V -0.14 A 0.07 0.07 0 0 1 0.07 -0.14 V 0 Z", { fill: wood });
    const lit = time !== "day";
    let lights = "";
    const panes = [
      u.rect(-0.04, -0.72, 0.08, 0.1, { rx: u.k(0.04) }),
      u.rect(-0.035, gallery ? -0.3 : -0.5, 0.07, 0.09, {}),
    ];
    const glass = el("g", { fill: lit ? LIT : UNLIT }, ...panes);
    if (lit) lights += glass;
    else mill += glass;
    const capPaint = tone(g.pick([20, 30, 200]), 20, 25, dark);
    mill += u.path("M -0.21 -0.98 Q -0.21 -1.2 0 -1.23 Q 0.21 -1.2 0.21 -0.98 Z", { fill: capPaint });
    const frame = g.chance(0.5) ? tone(40, 15, 92, dark) : tone(25, 30, 28, dark);
    const angle = g.f(0, Math.PI / 2);
    mill += sails(g, u.x(0), u.y(-1.06), size * 0.82, angle, frame, tone(40, 30, 88, dark));
    mill += u.circle(0, -1.06, 0.045, { fill: wood });
    if (setting === "canal") {
      const id = g.id("mill");
      const clip = g.id("clip");
      out += el("defs", {}, el("clipPath", { id: clip }, el("rect", { y: waterTop, width: w, height: h - waterTop })));
      out += el("g", { id }, mill);
      out += el(
        "g",
        { "clip-path": `url(#${clip})`, opacity: 0.3 },
        el("use", { href: `#${id}`, transform: s`translate(0 ${2 * waterTop}) scale(1 -1)` }),
      );
      let ripples = "";
      for (let k = g.i(5, 9); k > 0; k--) {
        const x = w * g.f(0, 1);
        const y = waterTop + (h - waterTop) * g.f(0.1, 0.95);
        ripples += s`M${x} ${y}h${unit * g.f(0.04, 0.1)}`;
      }
      out += el("path", { d: ripples, stroke: "#ffffff", opacity: 0.35, "stroke-width": unit * 0.006 });
      out += el("rect", { y: waterTop, width: w, height: size * 0.012, fill: "#000", opacity: 0.15 });
    } else out += mill;
    out += veil(w, h, time) + lights;
    const place = setting === "canal" ? "beside a canal" : "among striped tulip fields";
    note.alt(`A windmill with four sails ${place}${when(time)}`);
    note.focus(mx, ground - size * 0.8);
    return out;
  },
);
