import { defineKind, el, hex, type Point, pts, type Rand, s } from "../../draw/core";
import { andList, capitalize } from "../../draw/words";
import { darker, dot, fit, lighter, place, type Spot } from "./shared";

/** Short grass seen from above, with mowing stripes. */
function grass(g: Rand, w: number, h: number): string {
  const unit = Math.min(w, h);
  const hue = g.f(92, 122);
  const base = hex(hue, g.f(38, 50), g.f(36, 44));
  let out = el("rect", { width: w, height: h, fill: base });
  // Wide mowing stripes.
  const band = unit * g.f(0.3, 0.45);
  const tilt = g.f(-30, 30);
  let d = "";
  // Turned, they still cover the picture: it fits in a circle as wide as w + h.
  const reach = (w + h) * 0.6;
  for (let x = w / 2 - reach; x < w / 2 + reach; x += band * 2) d += s`M${x} ${h / 2 - reach}V${h / 2 + reach}`;
  out += el("path", {
    d,
    stroke: "#ffffff",
    opacity: 0.06,
    "stroke-width": band,
    transform: s`rotate(${tilt} ${w / 2} ${h / 2})`,
  });
  // Blades, as two tiles of different sizes so the repeat doesn't show.
  let defs = "";
  let layers = "";
  for (const [k, size] of [0.07, 0.097].entries()) {
    const t = unit * size;
    const id = g.id(`blades${k}`);
    let dark = "";
    let light = "";
    for (let j = 0; j < 5; j++) {
      const x = g.f(0, t);
      const y = g.f(0, t);
      const len = t * g.f(0.25, 0.45);
      const lean = g.f(-0.3, 0.3) * len;
      const blade = s`M${x} ${y}l${lean} ${-len}`;
      if (j % 2) dark += blade;
      else light += blade;
    }
    const wd = Math.max(0.8, unit * 0.005);
    defs += el(
      "pattern",
      { id, width: t, height: t, patternUnits: "userSpaceOnUse", patternTransform: s`rotate(${g.f(-8, 8)})` },
      el("path", { d: dark, stroke: hex(hue, 45, 26), "stroke-width": wd, "stroke-linecap": "round" }),
      el("path", { d: light, stroke: hex(hue - 8, 45, 56), "stroke-width": wd, "stroke-linecap": "round" }),
    );
    layers += el("rect", { width: w, height: h, fill: `url(#${id})`, opacity: 0.55 });
  }
  return out + el("defs", {}, defs) + layers;
}

/** A soft round shadow under something resting on a surface, in design units. */
const shadow = (x: number, y: number, rx: number, ry: number, opacity = 0.25): string =>
  el("ellipse", { cx: x, cy: y, rx, ry, fill: "#000", opacity });

/** A baseball seen from above at (0, 0), radius r: leather with two curving seams of V stitches. */
function baseballBall(g: Rand, r: number): string {
  const leather = g.pick(["#f5f1e6", "#f2ecdd", "#efe7d4"]);
  const thread = g.pick(["#d23a32", "#c8302e", "#d8463a"]);
  let out = el("circle", { cx: 0, cy: 0, r, fill: leather });
  let seam = "";
  let stitches = "";
  for (const side of [-1, 1]) {
    const p0: Point = [side * 0.5 * r, -0.86 * r];
    const p1: Point = [side * 0.02 * r, 0];
    const p2: Point = [side * 0.5 * r, 0.86 * r];
    seam += `M${pts([p0])}Q${pts([p1, p2])}`;
    for (let k = 1; k < 8; k++) {
      const t = k / 8;
      const x = (1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * p1[0] + t * t * p2[0];
      const y = (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * p1[1] + t * t * p2[1];
      const tx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
      const ty = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      const len = Math.hypot(tx, ty);
      const ux = tx / len;
      const uy = ty / len;
      // Each stitch is a little V pointing along the seam.
      const a = r * 0.15;
      const b = r * 0.07;
      stitches += s`M${x - uy * a - ux * b} ${y + ux * a - uy * b}L${x} ${y}L${x + uy * a - ux * b} ${y - ux * a - uy * b}`;
    }
  }
  out += el("path", { d: seam, fill: "none", stroke: thread, opacity: 0.45, "stroke-width": r * 0.04 });
  out += el("path", {
    d: stitches,
    fill: "none",
    stroke: thread,
    "stroke-width": r * 0.065,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  // Shading on the side away from the light.
  out += el("path", {
    d: s`M${-r * 0.7} ${r * 0.71}A${r} ${r} 0 0 0 ${r * 0.71} ${-r * 0.7}A${r * 1.15} ${r * 1.15} 0 0 1 ${-r * 0.7} ${r * 0.71}Z`,
    fill: "#000",
    opacity: 0.12,
  });
  return el("g", { transform: s`rotate(${g.f(-50, 50)})` }, out);
}

/** A ball with its shadow, at (x, y) in design units. */
const ballAt = (g: Rand, x: number, y: number, r: number): string =>
  shadow(x + r * 0.25, y + r * 0.3, r * 1.05, r * 0.95, 0.28) +
  el("g", { transform: s`translate(${x} ${y})` }, baseballBall(g, r));

/** Glove leather: tan, caramel, chestnut, near black or now and then a bold color. */
function gloveLeather(g: Rand): string {
  const pick = g.i(0, 5);
  return [
    hex(g.f(28, 34), g.f(50, 60), g.f(48, 56)),
    hex(g.f(22, 28), g.f(58, 68), g.f(38, 44)),
    hex(g.f(10, 18), g.f(45, 55), g.f(28, 34)),
    hex(g.f(210, 230), 8, g.f(16, 22)),
    hex(g.f(34, 40), g.f(40, 50), g.f(60, 66)),
    hex(g.pick([0, 215, 350, 200]), g.f(45, 60), g.f(30, 40)),
  ][pick];
}

/** Where a stall of length len, leaning ang degrees from straight up out of (x, y), has gone at t. */
const along = (x: number, y: number, ang: number, len: number, t: number, side = 0): Point => {
  const a = (ang * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  return [x + ux * len * t - uy * side, y + uy * len * t + ux * side];
};

/** A rounded stall (a finger or thumb) leaning ang degrees, from (x, y) up. */
const stall = (x: number, y: number, ang: number, len: number, wd: number, round = wd / 2): string =>
  el("rect", {
    x: -wd / 2,
    y: -len,
    width: wd,
    height: len + wd * 0.6,
    rx: round,
    transform: s`translate(${x} ${y}) rotate(${ang})`,
  });

type Stall = [x: number, y: number, ang: number, len: number, wd: number];

/**
 * A fielder's glove palm up, seen from above, fingers toward -y and the thumb on the left, about
 * 115 units long. The fingers are laced together nearly to their tips, and a wide laced web fills
 * the space between thumb and index finger. Its pocket is at (2, 0).
 */
function fieldersGlove(g: Rand, leather: string, lace: string): string {
  const deep = darker(leather, 0.22);
  // Pinky to index finger: wide and short, so only their rounded tips stand apart.
  const fingers: Stall[] = [
    [30, -2, 14, 35, 21],
    [16, -11, 5, 43, 21],
    [1, -14, -3, 46, 21],
    [-14, -11, -11, 42, 21],
  ];
  const thumb: Stall = [-28, 12, -50, 42, 22];
  const at = (f: Stall, t: number, side = 0) => along(f[0], f[1], f[2], f[3], t, side);
  let body = stall(...thumb);
  for (const f of fingers) body += stall(...f, f[4] * 0.3);
  let gaps = "";
  for (let j = 0; j < 3; j++) {
    const [right, left] = [fingers[j], fingers[j + 1]];
    gaps += `M${pts([at(left, 0), at(left, 0.97), at(right, 0.97), at(right, 0)])}Z`;
  }
  body += el("path", { d: gaps });
  body += el("ellipse", { cx: 3, cy: 6, rx: 34, ry: 33 });
  body += el("rect", { x: -27, y: 14, width: 56, height: 34, rx: 13 });

  // The web: from the thumb's tip to the index finger's, bulging out between them.
  const index = fingers[3];
  const [t0, t1] = [at(thumb, 0.2, 9), at(thumb, 1, 6)];
  const [i0, i1] = [at(index, 0.15, -8), at(index, 0.9, -6)];
  const mid: Point = [(t1[0] + i1[0]) / 2, (t1[1] + i1[1]) / 2];
  const out0 = Math.hypot(mid[0] - 2, mid[1]);
  const bulge: Point = [mid[0] + ((mid[0] - 2) / out0) * 7, mid[1] + (mid[1] / out0) * 7];
  const rim = `M${pts([t1])}Q${pts([bulge, i1])}`;
  const web = `M${pts([t0, t1])}Q${pts([bulge, i1])}L${pts([i0])}Z`;
  // The body is drawn twice, as a shadow and in leather, so it's written once.
  const id = g.id("glove");
  let out = el("defs", {}, el("g", { id }, body));
  out += el(
    "g",
    { transform: "translate(5 6)", fill: "#000", opacity: 0.25 },
    el("use", { href: `#${id}` }),
    el("path", { d: web }),
  );
  out += el("path", { d: web, fill: darker(leather, 0.32) });
  // A leather post up the middle of the web, crossed by laces, and a bound edge around its top.
  const top: Point = [0.25 * t1[0] + 0.5 * bulge[0] + 0.25 * i1[0], 0.25 * t1[1] + 0.5 * bulge[1] + 0.25 * i1[1]];
  const foot: Point = [(t0[0] + i0[0]) / 2, (t0[1] + i0[1]) / 2];
  out += el("path", { d: `M${pts([foot, top])}`, stroke: leather, "stroke-width": 9, "stroke-linecap": "round" });
  out += el("path", { d: `M${pts([foot, top])}`, stroke: deep, "stroke-width": 1.2, "stroke-dasharray": "2 3" });
  let ladder = "";
  for (let k = 1; k < 7; k++) {
    const t = k / 7;
    const a: Point = [t0[0] + (t1[0] - t0[0]) * t, t0[1] + (t1[1] - t0[1]) * t];
    const b: Point = [i0[0] + (i1[0] - i0[0]) * t, i0[1] + (i1[1] - i0[1]) * t];
    // Bow each rung outward a little, following the rim.
    const c: Point = [
      (a[0] + b[0]) / 2 + (bulge[0] - mid[0]) * t * 0.6,
      (a[1] + b[1]) / 2 + (bulge[1] - mid[1]) * t * 0.6,
    ];
    ladder += `M${pts([a])}Q${pts([c, b])}`;
  }
  out += el("path", { d: ladder, stroke: lace, "stroke-width": 2.4, "stroke-linecap": "round", fill: "none" });
  out += el("path", { d: rim, stroke: leather, "stroke-width": 5, "stroke-linecap": "round", fill: "none" });
  out += el("path", { d: rim, stroke: lace, "stroke-width": 1.6, "stroke-dasharray": "2.5 3", fill: "none" });
  out += el("use", { href: `#${id}`, fill: leather });

  // Seams between the fingers and a highlight down each.
  let seams = "";
  let shine = "";
  for (let j = 0; j < 3; j++) {
    const [right, left] = [fingers[j], fingers[j + 1]];
    const between = (t: number): Point => {
      const [a, b] = [at(left, t), at(right, t)];
      return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    };
    seams += `M${pts([between(0.12), between(0.85)])}`;
  }
  for (const f of fingers) shine += `M${pts([at(f, 0.3, -f[4] * 0.12), at(f, 0.9, -f[4] * 0.12)])}`;
  shine += `M${pts([at(thumb, 0.3, -3), at(thumb, 0.9, -3)])}`;
  out += el("path", { d: seams, stroke: deep, "stroke-width": 1.3, "stroke-linecap": "round" });
  out += el("path", { d: shine, stroke: "#ffffff", opacity: 0.12, "stroke-width": 6, "stroke-linecap": "round" });
  // The pocket, the heel pad and the wrist strap with a small oval patch.
  out += el("ellipse", { cx: 2, cy: 0, rx: 24, ry: 25, fill: "#000", opacity: 0.16 });
  out += el("ellipse", { cx: 2, cy: 1, rx: 15, ry: 16, fill: "#000", opacity: 0.1 });
  out += el("path", { d: "M-24 26Q2 21 28 26", stroke: deep, "stroke-width": 1.4, fill: "none" });
  out += el("rect", { x: -25, y: 30, width: 52, height: 13, rx: 6, fill: darker(leather, 0.1) });
  out += el("ellipse", { cx: 12, cy: 36.5, rx: 7, ry: 4, fill: lighter(leather, 0.55) });
  out += el("path", { d: "M-22 46H26", stroke: lace, "stroke-width": 2.2, "stroke-dasharray": "3 3" });
  return out;
}

const BAT_FINISHES = ["ash", "maple", "dark", "two-tone", "metal"] as const;

/**
 * A baseball bat lying along +x, seen from above, centered on (0, 0) and len units long: the knob
 * at -len/2, a thin handle, the taper and the barrel. Returns the markup and whether it's metal.
 */
function bat(g: Rand, len: number): { out: string; metal: boolean } {
  const finish = g.pick(BAT_FINISHES);
  const knob = 8.5;
  const handle = 4.6;
  const barrel = 12.5;
  const x0 = -len / 2;
  // The profile, knob to barrel: distance along, half the width, and whether it eases in on a curve.
  const t0 = len * 0.36;
  const t1 = len * 0.72;
  const nodes: [number, number, boolean][] = [
    [0, knob * 0.7, false],
    [3, knob, false],
    [7, knob, false],
    [12, handle, false],
    [t0, handle * 1.15, false],
    [t1, barrel, true],
    [len - 4, barrel, false],
  ];
  const P = (x: number, y: number) => s`${x0 + x} ${y}`;
  const edge = (sc: number, back: boolean): string => {
    const list = back ? [...nodes].reverse() : nodes;
    return list
      .map(([x, hw], i) => {
        if (i === 0) return "";
        const [px, pw] = list[i - 1];
        const curved = back ? list[i - 1][2] : list[i][2];
        const mid = (px + x) / 2;
        return curved ? `C${P(mid, pw * sc)} ${P(mid, hw * sc)} ${P(x, hw * sc)}` : `L${P(x, hw * sc)}`;
      })
      .join("");
  };
  /** The band of the bat between -from and +to times its half width, rounded off at the end when end. */
  const strip = (from: number, to: number, end = true): string => {
    const cap = end
      ? s`Q${x0 + len + 1} ${-barrel * from} ${x0 + len + 1} ${(to - from) * barrel * 0.5}Q${x0 + len + 1} ${barrel * to} ${x0 + len - 4} ${barrel * to}`
      : s`L${x0 + len - 4} ${barrel * to}`;
    return `M${P(0, -nodes[0][1] * from)}${edge(-from, false)}${cap}${edge(to, true)}Z`;
  };
  const outline = strip(1, 1);
  const wood = {
    ash: hex(g.f(36, 42), g.f(45, 58), g.f(70, 77)),
    maple: hex(g.f(26, 32), g.f(42, 55), g.f(58, 66)),
    dark: g.pick([hex(10, 8, 17), hex(5, 45, 26), hex(215, 30, 22)]),
    "two-tone": hex(g.f(32, 38), g.f(45, 55), g.f(66, 72)),
    metal: hex(g.f(0, 360), g.f(0, 35), g.f(55, 68)),
  }[finish];
  let out = el("path", { d: outline, fill: "#000", opacity: 0.25, transform: "translate(4 5)" });
  out += el("path", { d: outline, fill: wood });
  if (finish === "two-tone") {
    // A dark barrel, starting partway up the taper.
    const split = len * 0.62;
    const t = (split - t0) / (t1 - t0);
    const hs = handle * 1.15 + (barrel - handle * 1.15) * t * t * (3 - 2 * t);
    const end = s`L${x0 + len - 4} ${-barrel}Q${x0 + len + 1} ${-barrel} ${x0 + len + 1} 0Q${x0 + len + 1} ${barrel} ${x0 + len - 4} ${barrel}`;
    out += el("path", {
      d: `M${P(split, -hs)}L${P(t1, -barrel)}${end}L${P(t1, barrel)}L${P(split, hs)}Z`,
      fill: g.pick([hex(10, 8, 17), hex(5, 45, 26)]),
    });
  }
  // Grip tape wound round the handle: always on metal bats, sometimes on wood.
  if (finish === "metal" || g.chance(0.3)) {
    const grip = g.pick(["#1d1d20", hex(g.f(0, 360), 55, 42), "#e9e4d8"]);
    const gx = len * 0.3;
    out += el("rect", { x: x0 + 7, y: -handle * 1.08, width: gx - 7, height: handle * 2.16, rx: 2, fill: grip });
    let wraps = "";
    for (let x = 10; x < gx - 2; x += 7) wraps += s`M${x0 + x} ${-handle}l3 ${handle * 2}`;
    out += el("path", { d: wraps, stroke: "#000", opacity: 0.25, "stroke-width": 0.9 });
  }
  // The knob's lip, and a burned or printed label on the barrel.
  out += el("path", {
    d: s`M${x0 + 7} ${-knob}V${knob}`,
    stroke: "#000",
    opacity: 0.2,
    "stroke-width": 1.4,
  });
  const lx = x0 + len * 0.8;
  if (finish === "metal") {
    out += el("rect", {
      x: lx - len * 0.07,
      y: -barrel * 0.5,
      width: len * 0.14,
      height: barrel,
      rx: 2,
      fill: g.pick(["#1d1d20", "#f4f1e8", hex(g.f(0, 360), 60, 45)]),
    });
  } else {
    out += el("ellipse", {
      cx: lx,
      cy: 0,
      rx: len * 0.05,
      ry: barrel * 0.5,
      fill: "none",
      stroke: "#000",
      opacity: 0.35,
      "stroke-width": 1.6,
    });
    out += el("path", {
      d: s`M${lx - len * 0.03} 0H${lx + len * 0.03}`,
      stroke: "#000",
      opacity: 0.3,
      "stroke-width": 2.4,
    });
  }
  // Rounded light along the top and shade along the bottom.
  out += el("path", { d: strip(0.62, -0.2, false), fill: "#ffffff", opacity: finish === "metal" ? 0.4 : 0.22 });
  out += el("path", { d: strip(-0.35, 1, false), fill: "#000", opacity: 0.16 });
  return { out, metal: finish === "metal" };
}

/** A baseball cap seen from above, crown radius 34, brim toward +y. */
function cap(g: Rand): string {
  const hue = g.f(0, 360);
  const crown = g.chance(0.25) ? hex(hue, 10, g.f(18, 26)) : hex(hue, g.f(40, 65), g.f(32, 50));
  // The brim is a shade darker than the crown, or a contrasting color, so it always stands out.
  const brimPaint = g.chance(0.55)
    ? darker(crown, 0.42)
    : g.pick([hex(hue + 180, 40, 45), "#f1ede4", hex(hue, 10, 22), hex(hue, 50, 72)]);
  const r = 34;
  // The brim, a wide curved bill reaching well out from the front.
  const brim = s`M${-r * 0.99} ${r * 0.15}C${-r * 1.04} ${r * 2.4} ${r * 1.04} ${r * 2.4} ${r * 0.99} ${r * 0.15}Z`;
  let out = el(
    "g",
    { transform: "translate(4 5)", fill: "#000", opacity: 0.25 },
    el("circle", { cx: 0, cy: 0, r }),
    el("path", { d: brim }),
  );
  out += el("path", { d: brim, fill: brimPaint });
  out += el("path", {
    d: s`M${-r * 0.88} ${r * 0.5}C${-r * 0.9} ${r * 2.2} ${r * 0.9} ${r * 2.2} ${r * 0.88} ${r * 0.5}
         M${-r * 0.78} ${r * 0.62}C${-r * 0.8} ${r * 2.02} ${r * 0.8} ${r * 2.02} ${r * 0.78} ${r * 0.62}`,
    stroke: lighter(brimPaint, 0.35),
    opacity: 0.8,
    "stroke-width": 1.1,
    fill: "none",
    "stroke-dasharray": "2.5 2",
  });
  // The crown, with six panels meeting at a button.
  out += el("circle", { cx: 0, cy: 0, r, fill: crown });
  // A shade line where the crown meets the brim.
  out += el("path", {
    d: s`M${-r * 0.99} ${r * 0.15}A${r} ${r} 0 0 0 ${r * 0.99} ${r * 0.15}`,
    stroke: "#000",
    opacity: 0.3,
    "stroke-width": 2.2,
    fill: "none",
  });
  let seams = "";
  for (let k = 0; k < 6; k++) {
    const a = ((k * 60 + 30) * Math.PI) / 180;
    seams += s`M0 0L${Math.cos(a) * r} ${Math.sin(a) * r}`;
  }
  out += el("path", { d: seams, stroke: darker(crown, 0.3), "stroke-width": 1.4 });
  // Eyelets, one per panel.
  let holes = "";
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 * Math.PI) / 180;
    holes += dot(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, 1.4);
  }
  out += el("path", { d: holes, fill: darker(crown, 0.4) });
  // An abstract emblem on the front panels, sometimes.
  const accent = g.pick(["#f4f1e8", hex(hue + 180, 60, 60), hex(48, 85, 60)]);
  const mark = g.i(0, 3);
  if (mark === 1) out += el("circle", { cx: 0, cy: r * 0.62, r: r * 0.17, fill: accent });
  if (mark === 2)
    out += el("path", {
      d: s`M0 ${r * 0.44}L${r * 0.18} ${r * 0.64}L0 ${r * 0.84}L${-r * 0.18} ${r * 0.64}Z`,
      fill: accent,
    });
  if (mark === 3) {
    const star: Point[] = [];
    for (let k = 0; k < 10; k++) {
      const a = (k * Math.PI) / 5 - Math.PI / 2;
      const rr = (k % 2 ? 0.08 : 0.19) * r;
      star.push([Math.cos(a) * rr, r * 0.64 + Math.sin(a) * rr]);
    }
    out += el("path", { d: `M${pts(star)}Z`, fill: accent });
  }
  // Light on the dome, shade on its far side, and the button.
  out += el("circle", { cx: -r * 0.3, cy: -r * 0.3, r: r * 0.5, fill: "#ffffff", opacity: 0.1 });
  out += el("path", {
    d: s`M${-r * 0.7} ${r * 0.71}A${r} ${r} 0 0 0 ${r * 0.71} ${-r * 0.7}A${r * 1.2} ${r * 1.2} 0 0 1 ${-r * 0.7} ${r * 0.71}Z`,
    fill: "#000",
    opacity: 0.15,
  });
  out += el("circle", { cx: 0, cy: 0, r: 3.4, fill: darker(crown, 0.15) });
  out += el("circle", { cx: -0.8, cy: -0.8, r: 1.4, fill: "#ffffff", opacity: 0.25 });
  return out;
}

/** A bat, a ball, a glove and a cap on the grass: all four, or three of them. */
export const baseball = /* @__PURE__ */ defineKind("baseball", "Baseball", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = grass(g, w, h);
  const left = g.pick(["none", "bat", "ball", "glove", "cap"] as const);
  const has = { bat: left !== "bat", ball: left !== "ball", glove: left !== "glove", cap: left !== "cap" };
  const inPocket = has.ball && has.glove && g.chance(0.6);
  // The smaller pieces sit in a row along the picture's long side, beside the bat when there is one.
  const ratio = w / h;
  const axis = ratio > 1.15 ? 0 : ratio < 0.87 ? 90 : g.pick([30, -30]);
  const a = ((axis + g.f(-8, 8)) * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), Math.sin(a)];
  const toXY = (u: number, v: number): Point => [u * ux - v * uy, u * uy + v * ux];
  const side = g.pick([-1, 1]);
  type Piece = "glove" | "cap" | "ball";
  const row: Piece[] = [];
  if (has.glove) row.push("glove");
  if (has.cap) row.push("cap");
  if (has.ball && !inPocket) row.push("ball");
  const order = row.map(p => ({ p, key: g.f(0, 1) })).sort((m, n) => m.key - n.key);
  const radius = { glove: 62, cap: 50, ball: 18 };
  const gap = has.bat ? 12 : 20;
  const length = order.reduce((sum, { p }) => sum + radius[p] * 2, 0) + gap * (order.length - 1);
  let u = -length / 2;
  const spots: Spot[] = [];
  const placed: { p: Piece; x: number; y: number }[] = [];
  for (const { p } of order) {
    u += radius[p];
    const v = has.bat ? side * (radius[p] + 24) : g.f(-0.25, 0.25) * radius[p];
    const [x, y] = toXY(u, v);
    placed.push({ p, x, y });
    spots.push({ x, y, r: radius[p] });
    u += radius[p] + gap;
  }
  const batLen = 290;
  const batShift = g.f(-0.08, 0.08) * batLen;
  const batTurn = (Math.atan2(uy, ux) * 180) / Math.PI + g.f(-3, 3) + (g.chance(0.5) ? 180 : 0);
  if (has.bat) {
    for (let t = -0.5; t <= 0.5; t += 0.1) {
      const [x, y] = toXY(batShift + t * batLen, 0);
      spots.push({ x, y, r: 14 });
    }
  }
  const { k, at } = fit(spots, w, h, unit * 0.05);
  let metal = false;
  if (has.bat) {
    const [bx, by] = at(...toXY(batShift, 0));
    const made = bat(g, batLen);
    metal = made.metal;
    out += el("g", { transform: place(bx, by, k, batTurn) }, made.out);
  }
  const leather = gloveLeather(g);
  const lace = g.chance(0.6) ? darker(leather, 0.35) : lighter(leather, 0.4);
  let focus: Point = [w / 2, h / 2];
  for (const { p, x, y } of placed) {
    const [px, py] = at(x, y);
    if (p === "cap") {
      // The brim points away from the bat, or out to one side of the row, never under its neighbors.
      const turn = (Math.atan2(side * uy, side * ux) * 180) / Math.PI;
      const [dx, dy] = [-side * uy * 12 * k, side * ux * 12 * k];
      out += el("g", { transform: place(px - dx, py - dy, k, turn + g.f(-40, 40)) }, cap(g));
    } else if (p === "glove") {
      let mitt = fieldersGlove(g, leather, lace);
      if (inPocket) mitt += ballAt(g, 2, -2, 14);
      out += el("g", { transform: place(px, py - k * 4, k, g.f(-25, 25), g.chance(0.3)) }, mitt);
      focus = [px, py];
    } else {
      out += el("g", { transform: place(px, py, k) }, ballAt(g, 0, 0, 14));
      if (!has.glove) focus = [px, py];
    }
  }
  const batName = `a ${metal ? "metal" : "wooden"} ${has.ball ? "" : "baseball "}bat`;
  const things = inPocket
    ? `A baseball resting in a glove beside ${andList([has.bat && batName, has.cap && "a cap"])}`
    : capitalize(andList([has.ball && "a baseball", has.bat && batName, has.glove && "a glove", has.cap && "a cap"]));
  note.alt(`${things} on the grass`);
  note.focus(...focus);
  return out;
});
