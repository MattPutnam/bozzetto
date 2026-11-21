/** Small creatures of garden, pond, beach and sea. They join the animals category. */
import { defineKind, el, facing, fill, hsl, lin, mix, pts, s, type Point, type Rand } from "./core";
import { smoothClosed } from "./shapes";
import { numberWord } from "./words";

/** Where x lands once a figure drawn facing right around cx is turned to face `dir`. */
const turn = (cx: number, dir: number, x: number): number => cx + dir * (x - cx);

/** The left edge of a box of width `bw` starting at x, after turning about cx. */
const turnBox = (cx: number, dir: number, x: number, bw: number): number => (dir > 0 ? x : 2 * cx - x - bw);

/** A sky gradient filling the picture, light at the bottom. */
function sky(g: Rand, w: number, h: number, hue: number): string {
  const id = g.id("sky");
  return el("defs", {}, lin(id, [hsl(hue, 50, 76), hsl(hue - 15, 55, 93)])) + fill(w, h, `url(#${id})`);
}

/** A point on a cubic Bézier curve, and its direction there. */
function cubic(p: readonly Point[], t: number): [Point, Point] {
  const u = 1 - t;
  const at = (k: 0 | 1): number =>
    u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k];
  const dt = (k: 0 | 1): number =>
    3 * u * u * (p[1][k] - p[0][k]) + 6 * u * t * (p[2][k] - p[1][k]) + 3 * t * t * (p[3][k] - p[2][k]);
  return [
    [at(0), at(1)],
    [dt(0), dt(1)],
  ];
}

/** A filled limb along a cubic curve, tapering from width w0 to w1, with a round tip. */
function limb(p: readonly Point[], w0: number, w1: number, paint: string): string {
  const left: Point[] = [];
  const right: Point[] = [];
  const steps = 8;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const [[x, y], [dx, dy]] = cubic(p, t);
    const len = Math.hypot(dx, dy) || 1;
    const half = (w0 + (w1 - w0) * t) / 2;
    left.push([x - (dy / len) * half, y + (dx / len) * half]);
    right.push([x + (dy / len) * half, y - (dx / len) * half]);
  }
  const outline = [...left, ...right.reverse()];
  return (
    el("polygon", { points: pts(outline), fill: paint }) +
    el("circle", { cx: p[3][0], cy: p[3][1], r: w1 / 2, fill: paint })
  );
}

/** A flower on a stem, its face tipped up toward the sky. Returns the markup. */
function flower(g: Rand, x: number, base: number, top: number, r: number, petal: string, middle: string): string {
  const bend = g.f(-1, 1) * r * 0.6;
  const leafY = base - (base - top) * g.f(0.3, 0.5);
  const leafSide = g.pick([-1, 1]);
  const green = hsl(g.f(95, 130), 40, g.f(32, 42));
  // Stem and a leaf.
  let out = el("path", {
    d: s`M ${x} ${base} Q ${x + bend} ${(base + top) / 2} ${x} ${top}`,
    stroke: green,
    "stroke-width": Math.max(1.5, r * 0.14),
    fill: "none",
  });
  out += el("ellipse", {
    cx: x + bend * 0.5 + leafSide * r * 0.45,
    cy: leafY,
    rx: r * 0.5,
    ry: r * 0.17,
    fill: green,
    transform: s`rotate(${leafSide * -30} ${x + bend * 0.5 + leafSide * r * 0.45} ${leafY})`,
  });
  // Petals and middle, squashed so the face tips up.
  const count = g.i(5, 8);
  const turnBy = g.f(0, Math.PI);
  let petals = "";
  for (let k = 0; k < count; k++) {
    const a = turnBy + (k / count) * Math.PI * 2;
    const px = x + Math.cos(a) * r * 0.55;
    const py = top + Math.sin(a) * r * 0.55;
    petals += el("ellipse", {
      cx: px,
      cy: py,
      rx: r * 0.5,
      ry: r * 0.27,
      transform: s`rotate(${(a * 180) / Math.PI} ${px} ${py})`,
    });
  }
  out += el("g", { fill: petal, transform: s`translate(0 ${top}) scale(1 0.55) translate(0 ${-top})` }, petals);
  out += el("ellipse", { cx: x, cy: top, rx: r * 0.32, ry: r * 0.2, fill: middle });
  return out;
}

const PETALS = ["#f6a6c1", "#ffffff", "#f7d154", "#c9a7f2", "#ff9f80", "#f48fb1"] as const;

/** A turtle plodding across a meadow or a beach, its head out of its shell. */
export const turtle = defineKind("turtle", "Turtle", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const beach = g.chance(0.4);
  const dir = g.pick([1, -1]);
  const gy = h * g.f(0.76, 0.82);
  const rx = unit * g.f(0.27, 0.32);
  const ry = rx * g.f(0.58, 0.7);
  const cx = w / 2 - dir * rx * 0.15 + w * g.f(-0.05, 0.05);
  const shellHue = g.f(25, 110);
  const shellLight = g.f(30, 40);
  const shell = hsl(shellHue, g.f(35, 55), shellLight);
  const scute = hsl(shellHue + g.f(-10, 10), 45, shellLight + g.f(12, 20));
  const skinHue = g.f(65, 110);
  const skin = hsl(skinHue, g.f(25, 45), g.f(48, 58));
  const farSkin = hsl(skinHue, 30, 38);
  const hz = gy - (gy - h * 0.3) * g.f(0.45, 0.6);
  let out = sky(g, w, h, g.f(190, 215));
  if (beach) {
    // The sea and the sand.
    out += el("rect", { y: hz, width: w, height: gy, fill: hsl(g.f(185, 205), 55, 52) });
    out += el("path", {
      d: s`M -5 ${hz + (gy - hz) * 0.55} Q ${w * 0.5} ${hz + (gy - hz) * 0.4} ${w + 5} ${hz + (gy - hz) * 0.6} V ${h} H -5 Z`,
      fill: hsl(g.f(38, 46), 55, g.f(74, 82)),
    });
  } else {
    // A far hill and the meadow, with a few flowers.
    out += el("ellipse", {
      cx: w * g.f(0.2, 0.8),
      cy: hz + h * 0.1,
      rx: w * 0.7,
      ry: h * 0.16,
      fill: hsl(110, 30, 66),
    });
    out += el("path", {
      d: s`M -5 ${hz + (gy - hz) * 0.5} Q ${w * 0.5} ${hz + (gy - hz) * 0.3} ${w + 5} ${hz + (gy - hz) * 0.55} V ${h} H -5 Z`,
      fill: hsl(g.f(85, 115), 40, g.f(48, 56)),
    });
    for (let k = g.i(3, 6); k > 0; k--) {
      const fx = w * g.f(0.03, 0.97);
      const fy = gy + (h - gy) * g.f(0.15, 0.85);
      if (Math.abs(fx - cx) < rx * 1.5) continue;
      out += el("circle", { cx: fx, cy: fy, r: unit * 0.014, fill: g.pick(PETALS) });
    }
  }
  const base = gy - ry * 0.42;
  // Shadow.
  out += el("ellipse", { cx, cy: gy, rx: rx * 1.15, ry: ry * 0.1, fill: "#000", opacity: "0.14" });
  out += facing(cx, dir);
  // Far legs, then near legs, all tucked under the shell.
  for (const [lx, paint] of [
    [cx - rx * 0.32, farSkin],
    [cx + rx * 0.72, farSkin],
    [cx - rx * 0.62, skin],
    [cx + rx * 0.45, skin],
  ] as const)
    out += el("rect", {
      x: lx - rx * 0.12,
      y: base - ry * 0.1,
      width: rx * 0.24,
      height: gy - base + ry * 0.1,
      rx: rx * 0.1,
      fill: paint,
    });
  // Tail.
  out += el("polygon", {
    points: pts([
      [cx - rx * 0.9, base - ry * 0.12],
      [cx - rx * 1.15, base + ry * 0.04],
      [cx - rx * 0.9, base + ry * 0.06],
    ]),
    fill: skin,
  });
  // Neck and head, reaching forward and up.
  const hx = cx + rx * 1.2;
  const hy = base - ry * g.f(0.45, 0.7);
  const hr = rx * 0.25;
  out += el("path", {
    d: s`M ${cx + rx * 0.7} ${base - ry * 0.3}
         Q ${hx - hr * 1.2} ${hy - hr * 0.3} ${hx} ${hy - hr * 0.6}
         L ${hx} ${hy + hr * 0.6}
         Q ${hx - hr * 1.2} ${base} ${cx + rx * 0.7} ${base + ry * 0.12} Z`,
    fill: skin,
  });
  out += el("ellipse", { cx: hx, cy: hy, rx: hr * 1.15, ry: hr * 0.9, fill: skin });
  // Eye, smile and cheek.
  out += el("circle", { cx: hx + hr * 0.35, cy: hy - hr * 0.2, r: hr * 0.17, fill: "#1c1a16" });
  out += el("circle", { cx: hx + hr * 0.4, cy: hy - hr * 0.27, r: hr * 0.06, fill: "#fff" });
  out += el("path", {
    d: s`M ${hx + hr * 0.5} ${hy + hr * 0.3} Q ${hx + hr * 0.8} ${hy + hr * 0.45} ${hx + hr * 1.05} ${hy + hr * 0.2}`,
    stroke: "#2a2a1e",
    "stroke-width": hr * 0.08,
    "stroke-linecap": "round",
    fill: "none",
  });
  out += el("circle", { cx: hx + hr * 0.15, cy: hy + hr * 0.3, r: hr * 0.18, fill: "#ff7a8a", opacity: "0.3" });
  // Shell dome, its rim and scutes.
  out += el("path", { d: s`M ${cx - rx} ${base} A ${rx} ${ry} 0 0 1 ${cx + rx} ${base} Z`, fill: shell });
  out += el("ellipse", {
    cx,
    cy: base,
    rx: rx * 1.04,
    ry: ry * 0.11,
    fill: hsl(shellHue, 40, shellLight - 10),
  });
  const plate = (x: number, y: number, pw: number, ph: number): string =>
    el("path", {
      d: smoothClosed(
        [0, 1, 2, 3, 4, 5].map((k): Point => {
          const a = (k / 6) * Math.PI * 2;
          return [x + Math.cos(a) * pw, y + Math.sin(a) * ph];
        }),
      ),
      fill: scute,
    });
  out += plate(cx, base - ry * 0.58, rx * 0.24, ry * 0.26);
  for (const sd of [-1, 1]) out += plate(cx + sd * rx * 0.56, base - ry * 0.36, rx * 0.19, ry * 0.22);
  out += el("ellipse", {
    cx: cx - rx * 0.3,
    cy: base - ry * 0.78,
    rx: rx * 0.28,
    ry: ry * 0.1,
    fill: "#fff",
    opacity: "0.18",
    transform: s`rotate(-18 ${cx - rx * 0.3} ${base - ry * 0.78})`,
  });
  out += "</g>";
  note.alt(
    `A turtle walking on ${beach ? "a sandy beach by the sea" : "a meadow"}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(turn(cx, dir, hx), hy);
  // Head.
  note.frame(turnBox(cx, dir, hx - hr * 1.6, hr * 3.1), hy - hr * 1.5, hr * 3.1, hr * 2.8);
  return out;
});

interface DuckColors {
  body: string;
  head: string;
  wing: string;
  chest?: string;
  collar?: boolean;
  speculum?: boolean;
}

const DUCKS: readonly (DuckColors & { name: string })[] = [
  {
    name: "mallard drake",
    body: "#c9c4bc",
    head: "#1f7a4a",
    wing: "#8f8a82",
    chest: "#7a4a2e",
    collar: true,
    speculum: true,
  },
  { name: "mallard hen", body: "#a57c52", head: "#8c6a46", wing: "#6e5136", speculum: true },
  { name: "farmyard duck", body: "#f7f4ec", head: "#f7f4ec", wing: "#e2ddd1" },
  { name: "wild duck", body: "#8a6a4c", head: "#5e4a38", wing: "#5a4430", chest: "#b08a62" },
];

const DUCKLING: DuckColors = { body: "#f7d154", head: "#f7d154", wing: "#e8b93a" };

/** A duck floating with its belly at the waterline wy, facing right. Length L is from tail to chest. */
function duckFigure(x: number, wy: number, L: number, c: DuckColors): string {
  const H = L * 0.55;
  const tail: Point = [x - L * 1.1, wy - H * 1.05];
  // Body, flat where it meets the water, with a rounded stern rising to a pointed tail.
  let out = el("path", {
    d: s`M ${tail[0]} ${tail[1]}
         Q ${x - L * 0.6} ${wy - H * 0.72} ${x - L * 0.1} ${wy - H * 0.85}
         Q ${x + L * 0.75} ${wy - H * 0.98} ${x + L * 0.85} ${wy - H * 0.4}
         Q ${x + L * 0.85} ${wy} ${x + L * 0.4} ${wy}
         L ${x - L * 0.5} ${wy}
         Q ${x - L * 0.88} ${wy} ${x - L * 0.95} ${wy - H * 0.45}
         Q ${x - L * 0.98} ${wy - H * 0.8} ${tail[0]} ${tail[1]} Z`,
    fill: c.body,
  });
  const hx = x + L * 0.58;
  const hy = wy - H * 1.75;
  const r = H * 0.5;
  // Neck and head.
  out += el("ellipse", { cx: hx - r * 0.1, cy: wy - H * 1.2, rx: r * 0.62, ry: H * 0.55, fill: c.head });
  out += el("circle", { cx: hx, cy: hy, r, fill: c.head });
  if (c.collar)
    out += el("ellipse", { cx: hx - r * 0.1, cy: wy - H * 0.9, rx: r * 0.6, ry: r * 0.12, fill: "#f4f1ea" });
  if (c.chest) out += el("ellipse", { cx: x + L * 0.6, cy: wy - H * 0.52, rx: L * 0.27, ry: H * 0.38, fill: c.chest });
  // Wing.
  out += el("ellipse", {
    cx: x - L * 0.18,
    cy: wy - H * 0.55,
    rx: L * 0.55,
    ry: H * 0.3,
    fill: c.wing,
    transform: s`rotate(-8 ${x - L * 0.18} ${wy - H * 0.55})`,
  });
  if (c.speculum)
    out += el("ellipse", { cx: x - L * 0.3, cy: wy - H * 0.5, rx: L * 0.18, ry: H * 0.08, fill: "#3b5fb0" });
  // Beak.
  out += el("path", {
    d: s`M ${hx + r * 0.7} ${hy - r * 0.15}
         Q ${hx + r * 1.4} ${hy - r * 0.05} ${hx + r * 1.6} ${hy + r * 0.2}
         Q ${hx + r * 1.2} ${hy + r * 0.4} ${hx + r * 0.7} ${hy + r * 0.3} Z`,
    fill: "#f0a23a",
  });
  // Eye.
  out += el("circle", { cx: hx + r * 0.3, cy: hy - r * 0.2, r: r * 0.14, fill: "#111" });
  out += el("circle", { cx: hx + r * 0.34, cy: hy - r * 0.25, r: r * 0.05, fill: "#fff" });
  return out;
}

/** A duck on a pond, sometimes leading a line of ducklings. */
export const duck = defineKind("duck", "Duck", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const kind = g.pick(DUCKS);
  const dir = g.pick([1, -1]);
  const L = unit * g.f(0.22, 0.26);
  const wy = h * g.f(0.66, 0.74);
  const bank = h * g.f(0.3, 0.4);
  const waterHue = g.f(185, 210);
  const water = g.id("water");
  // How far the group reaches behind and in front of the parent's middle, with n ducklings.
  const behind = (n: number): number => (n ? 2.05 + (n - 1) * 0.75 : 1.15) * L;
  const wanted = g.chance(0.55) ? g.i(1, 4) : 0;
  let babies = wanted;
  while (babies > 0 && behind(babies) + L * 1.25 > w * 0.94) babies--;
  const cx = w / 2 + (dir * (behind(babies) - L * 1.25)) / 2;
  let out = sky(g, w, h, g.f(195, 215));
  // The far bank, and the pond below it.
  out += el("path", {
    d: s`M -5 ${bank} Q ${w * g.f(0.2, 0.8)} ${bank - h * g.f(0.04, 0.12)} ${w + 5} ${bank} V ${bank + h * 0.06} H -5 Z`,
    fill: hsl(g.f(95, 125), 32, g.f(46, 56)),
  });
  out += el("defs", {}, lin(water, [hsl(waterHue, 45, 62), hsl(waterHue + 10, 50, 42)]));
  out += el("rect", { y: bank + h * 0.05, width: w, height: h, fill: `url(#${water})` });
  // Reeds at one edge.
  const reedX = g.chance(0.5) ? w * g.f(0.02, 0.1) : w * g.f(0.9, 0.98);
  for (let k = g.i(2, 4); k > 0; k--) {
    const x = reedX + g.f(-1, 1) * unit * 0.05;
    const top = bank + (wy - bank) * g.f(-0.2, 0.3);
    const lean = g.f(-1, 1) * unit * 0.04;
    out += el("path", {
      d: s`M ${x} ${h * 0.95} L ${x + lean} ${top}`,
      stroke: hsl(g.f(80, 110), 35, 34),
      "stroke-width": Math.max(1.5, unit * 0.012),
      fill: "none",
    });
    if (g.chance(0.6))
      out += el("ellipse", {
        cx: x + lean * (1 - (unit * 0.07) / (h * 0.95 - top)),
        cy: top + unit * 0.07,
        rx: unit * 0.014,
        ry: unit * 0.045,
        fill: "#7a5236",
        transform: s`rotate(${(-Math.atan2(lean, h * 0.95 - top) * 180) / Math.PI} ${x + lean} ${top})`,
      });
  }
  // Ripples around the ducks and their reflections.
  const ripple = (x: number, size: number): string =>
    el("ellipse", { cx: x, cy: wy + size * 0.12, rx: size * 1.35, ry: size * 0.14, fill: "#000", opacity: "0.12" }) +
    el("path", {
      d: s`M ${x - size * 1.5} ${wy + size * 0.22} q ${size * 0.4} ${size * 0.07} ${size * 0.8} 0
           M ${x + size * 0.5} ${wy + size * 0.3} q ${size * 0.4} ${size * 0.07} ${size * 0.8} 0`,
      stroke: "#fff",
      "stroke-width": Math.max(1, size * 0.04),
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.45",
    });
  out += ripple(cx, L);
  out += facing(cx, dir);
  // Ducklings following behind, then the parent.
  for (let k = 0; k < babies; k++) {
    const bx = cx - L * 1.6 - k * L * 0.75;
    const by = wy + g.f(-0.02, 0.04) * L;
    out += ripple(bx, L * 0.38) + duckFigure(bx, by, L * 0.38, DUCKLING);
  }
  out += duckFigure(cx, wy, L, kind);
  out += "</g>";
  const H = L * 0.55;
  const hx = cx + L * 0.58;
  const hy = wy - H * 1.75;
  const r = H * 0.5;
  note.alt(
    `A ${kind.name} swimming on a pond${babies ? ` with ${numberWord(babies)} duckling${babies > 1 ? "s" : ""} behind` : ""}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(turn(cx, dir, hx + r * 0.3), hy);
  // Head and beak.
  note.frame(turnBox(cx, dir, hx - r * 1.3, r * 3.1), hy - r * 1.3, r * 3.1, r * 2.6);
  return out;
});

/** A hedgehog on the forest floor among fallen leaves. */
export const hedgehog = defineKind("hedgehog", "Hedgehog", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([1, -1]);
  const gy = h * g.f(0.74, 0.8);
  const rx = unit * g.f(0.24, 0.28);
  const ry = rx * g.f(0.62, 0.72);
  const cx = w / 2 - dir * rx * 0.15;
  const bx = cx - rx * 0.1;
  const by = gy - ry;
  const spineHue = g.f(20, 35);
  const spine = hsl(spineHue, g.f(25, 40), g.f(24, 32));
  const tipColor = hsl(spineHue + 10, 30, g.f(62, 72));
  const face = g.pick(["#e9cfa8", "#dcc0a0", "#f0dcc0", "#cfb08c"]);
  const autumn = g.chance(0.55);
  const leafHues = autumn ? [15, 30, 42, 8] : [90, 110, 60];
  let out = sky(g, w, h, autumn ? g.f(30, 45) : g.f(90, 130));
  // Trunks in the distance.
  for (let k = g.i(2, 3); k > 0; k--) {
    const tx = w * g.f(0, 1);
    const tw = unit * g.f(0.05, 0.1);
    out += el("rect", { x: tx - tw / 2, width: tw, height: gy, fill: hsl(25, 20, g.f(55, 65)), opacity: "0.6" });
  }
  // The forest floor.
  out += el("rect", { y: gy - unit * 0.02, width: w, height: h, fill: hsl(g.f(25, 40), 35, g.f(36, 44)) });
  // Fallen leaves.
  const leaf = (x: number, y: number, size: number, hue: number, tilt: number): string =>
    el("ellipse", {
      cx: x,
      cy: y,
      rx: size,
      ry: size * 0.42,
      fill: hsl(hue, 60, g.f(42, 55)),
      transform: s`rotate(${tilt} ${x} ${y})`,
    });
  for (let k = g.i(5, 9); k > 0; k--)
    out += leaf(w * g.f(0, 1), gy + (h - gy) * g.f(0.05, 0.95), unit * g.f(0.03, 0.05), g.pick(leafHues), g.f(-40, 40));
  // A mushroom off to one side.
  const shroom = g.chance(0.5);
  if (shroom) {
    const mr = unit * g.f(0.06, 0.08);
    // Behind the hedgehog, but kept inside the picture.
    const mx = Math.min(w - mr * 1.3, Math.max(mr * 1.3, cx - dir * rx * g.f(1.6, 1.9)));
    const red = g.chance(0.5);
    out += el("rect", { x: mx - mr * 0.25, y: gy - mr * 1.2, width: mr * 0.5, height: mr * 1.2, fill: "#f1e8d8" });
    out += el("path", {
      d: s`M ${mx - mr} ${gy - mr * 1.1} Q ${mx} ${gy - mr * 2.6} ${mx + mr} ${gy - mr * 1.1} Z`,
      fill: red ? "#d8432f" : "#b07a4c",
    });
    if (red)
      for (const [dx, dy] of [
        [-0.45, 1.4],
        [0.1, 1.7],
        [0.5, 1.35],
      ])
        out += el("circle", { cx: mx + dx * mr, cy: gy - dy * mr, r: mr * 0.12, fill: "#fff" });
  }
  // Shadow.
  out += el("ellipse", { cx, cy: gy, rx: rx * 1.2, ry: ry * 0.14, fill: "#000", opacity: "0.18" });
  out += facing(cx, dir);
  // Feet, then the pale belly.
  for (const fx of [bx - rx * 0.5, bx + rx * 0.45])
    out += el("ellipse", { cx: fx, cy: gy - rx * 0.02, rx: rx * 0.12, ry: rx * 0.06, fill: "#4a3428" });
  out += el("ellipse", { cx: bx, cy: by, rx, ry, fill: face });
  // Spines: a jagged arc over the back, filled down to the middle of the body.
  const spikes: Point[] = [];
  const count = 30;
  for (let k = 0; k <= count; k++) {
    const a = -0.3 * Math.PI - (k / count) * 1.0 * Math.PI;
    const reach = k % 2 ? g.f(1.1, 1.2) : 0.97;
    spikes.push([bx + Math.cos(a) * rx * reach, by + Math.sin(a) * ry * reach]);
  }
  spikes.push([bx - rx * 0.3, by + ry * 0.72], [bx + rx * 0.1, by + ry * 0.5], [bx + rx * 0.3, by + ry * 0.05]);
  out += el("polygon", { points: pts(spikes), fill: spine });
  // Light tips on some spines.
  let tips = "";
  for (let k = 1; k < count; k += 2) {
    const [x, y] = spikes[k];
    tips += s`M ${x} ${y} L ${bx + (x - bx) * 0.9} ${by + (y - by) * 0.9} `;
  }
  out += el("path", {
    d: tips,
    stroke: tipColor,
    "stroke-width": rx * 0.035,
    "stroke-linecap": "round",
  });
  // A few spine marks within the coat.
  let marks = "";
  for (let k = g.i(6, 9); k > 0; k--) {
    const a = g.f(-0.95, -0.4) * Math.PI;
    const d = g.f(0.35, 0.8);
    const x = bx + Math.cos(a) * rx * d;
    const y = by + Math.sin(a) * ry * d;
    marks += s`M ${x} ${y} l ${Math.cos(a) * rx * 0.14} ${Math.sin(a) * rx * 0.14} `;
  }
  out += el("path", {
    d: marks,
    stroke: tipColor,
    "stroke-width": rx * 0.03,
    "stroke-linecap": "round",
    opacity: "0.6",
  });
  // A leaf caught on its spines.
  const carried = g.chance(0.3);
  if (carried) {
    const a = g.f(-0.75, -0.55) * Math.PI;
    out += leaf(bx + Math.cos(a) * rx * 1.02, by + Math.sin(a) * ry * 1.02, rx * 0.2, g.pick(leafHues), g.f(-30, 30));
  }
  // The face: cheek, pointed snout, nose, ear and eye.
  const fx = bx + rx * 0.62;
  const fy = by + ry * 0.2;
  out += el("ellipse", { cx: fx, cy: fy, rx: rx * 0.4, ry: ry * 0.5, fill: face });
  const nose: Point = [bx + rx * 1.32, by + ry * 0.42];
  out += el("path", {
    d: s`M ${fx} ${fy - ry * 0.42} Q ${fx + rx * 0.45} ${fy - ry * 0.2} ${nose[0]} ${nose[1] - rx * 0.03}
         L ${nose[0]} ${nose[1] + rx * 0.04} Q ${fx + rx * 0.4} ${fy + ry * 0.5} ${fx - rx * 0.1} ${fy + ry * 0.45} Z`,
    fill: face,
  });
  out += el("circle", { cx: nose[0], cy: nose[1], r: rx * 0.065, fill: "#2a1e18" });
  out += el("circle", { cx: fx - rx * 0.12, cy: fy - ry * 0.48, r: rx * 0.085, fill: mix(face, "#5a3a28", 0.35) });
  const ex = fx + rx * 0.12;
  const ey = fy - ry * 0.12;
  out += el("circle", { cx: ex, cy: ey, r: rx * 0.06, fill: "#1a1412" });
  out += el("circle", { cx: ex + rx * 0.02, cy: ey - rx * 0.02, r: rx * 0.02, fill: "#fff" });
  out += el("circle", { cx: fx + rx * 0.05, cy: fy + ry * 0.2, r: rx * 0.08, fill: "#ff7a8a", opacity: "0.3" });
  out += "</g>";
  note.alt(
    `A hedgehog on the forest floor among ${autumn ? "autumn " : ""}leaves${carried ? ", a leaf caught on its spines" : ""}${shroom ? ", beside a mushroom" : ""}`,
  );
  note.focus(turn(cx, dir, ex), ey);
  // Face, from ear to nose.
  const left = fx - rx * 0.5;
  note.frame(turnBox(cx, dir, left, nose[0] + rx * 0.15 - left), fy - ry * 0.75, nose[0] + rx * 0.15 - left, ry * 1.3);
  return out;
});

const MICE = [
  { fur: "#9a9590", light: "#c9c4bf" },
  { fur: "#a5866a", light: "#d8c2a8" },
  { fur: "#efe9e1", light: "#ffffff" },
  { fur: "#7c6a5c", light: "#b8a594" },
] as const;

/** A mouse with big round ears, by a wedge of cheese indoors or among wheat in a field. */
export const mouse = defineKind("mouse", "Mouse", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const coat = g.pick(MICE);
  const dir = g.pick([1, -1]);
  const indoors = g.chance(0.5);
  const gy = h * g.f(0.74, 0.8);
  const rx = unit * g.f(0.17, 0.2);
  const ry = rx * g.f(0.7, 0.8);
  const cx = w / 2 + dir * rx * (indoors ? 0.2 : 0.5);
  const bx = cx - rx * 0.2;
  const by = gy - ry;
  const pink = "#f2a0aa";
  let out = "";
  if (indoors) {
    // Wall, skirting board and floorboards.
    out += fill(w, h, hsl(g.f(20, 60), g.f(20, 40), g.f(80, 88)));
    const board = h * 0.06;
    out += el("rect", { y: gy - unit * 0.12 - board, width: w, height: board, fill: "#f4efe6" });
    out += el("rect", { y: gy - unit * 0.12, width: w, height: h, fill: hsl(g.f(25, 35), 40, g.f(48, 58)) });
    let seams = "";
    for (let k = 1; k < 4; k++) seams += s`M 0 ${gy - unit * 0.12 + ((h - gy + unit * 0.12) * k) / 4} H ${w} `;
    out += el("path", { d: seams, stroke: "#000", "stroke-width": "1", opacity: "0.08" });
  } else {
    out += sky(g, w, h, g.f(190, 215));
    out += el("rect", { y: gy - unit * 0.05, width: w, height: h, fill: hsl(g.f(75, 105), 40, g.f(46, 54)) });
    // Wheat stalks behind the mouse.
    for (let k = g.i(3, 5); k > 0; k--) {
      const x = w * g.f(0.03, 0.97);
      const top = gy - unit * g.f(0.45, 0.7);
      const lean = g.f(-1, 1) * unit * 0.05;
      out += el("path", {
        d: s`M ${x} ${gy} Q ${x} ${(gy + top) / 2} ${x + lean} ${top}`,
        stroke: "#c9a85c",
        "stroke-width": Math.max(1.5, unit * 0.01),
        fill: "none",
      });
      let grains = "";
      for (let j = 0; j < 4; j++) {
        const gx = x + lean * (1 - j * 0.05);
        const gyy = top + j * unit * 0.03;
        for (const sd of [-1, 1])
          grains += el("ellipse", {
            cx: gx + sd * unit * 0.012,
            cy: gyy,
            rx: unit * 0.01,
            ry: unit * 0.02,
            transform: s`rotate(${sd * 25} ${gx + sd * unit * 0.012} ${gyy})`,
          });
      }
      out += el("g", { fill: "#e2c06e" }, grains);
    }
  }
  // Shadow.
  out += el("ellipse", { cx: bx + rx * 0.2, cy: gy, rx: rx * 1.4, ry: ry * 0.12, fill: "#000", opacity: "0.15" });
  out += facing(cx, dir);
  // Tail, lying along the floor and curling up at the end.
  out += el("path", {
    d: s`M ${bx - rx * 0.9} ${by + ry * 0.55}
         C ${bx - rx * 1.4} ${gy + rx * 0.05} ${bx - rx * 1.9} ${gy} ${bx - rx * 2.1} ${gy - rx * g.f(0.25, 0.5)}`,
    stroke: pink,
    "stroke-width": rx * 0.08,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Far ear, body and feet.
  const hx = cx + rx * 0.7;
  const hy = gy - ry * 1.15;
  const hr = rx * 0.45;
  out += el("circle", { cx: hx - hr * 0.55, cy: hy - hr * 1.05, r: rx * 0.27, fill: mix(coat.fur, "#000000", 0.15) });
  for (const fx of [bx - rx * 0.45, bx + rx * 0.35, hx + hr * 0.2])
    out += el("ellipse", { cx: fx, cy: gy - rx * 0.03, rx: rx * 0.13, ry: rx * 0.06, fill: pink });
  out += el("ellipse", { cx: bx, cy: by, rx, ry, fill: coat.fur });
  out += el("ellipse", { cx: bx + rx * 0.25, cy: by + ry * 0.4, rx: rx * 0.55, ry: ry * 0.45, fill: coat.light });
  // Head with a pointed snout.
  const tip: Point = [hx + hr * 1.75, hy + hr * 0.35];
  out += el("path", {
    d: s`M ${hx - hr} ${hy}
         Q ${hx - hr} ${hy - hr} ${hx} ${hy - hr}
         Q ${hx + hr * 0.9} ${hy - hr * 0.8} ${tip[0]} ${tip[1]}
         Q ${hx + hr * 0.8} ${hy + hr * 1.05} ${hx} ${hy + hr * 0.95}
         Q ${hx - hr} ${hy + hr} ${hx - hr} ${hy} Z`,
    fill: coat.fur,
  });
  // Near ear.
  const earX = hx - hr * 0.1;
  const earY = hy - hr * 1.15;
  out += el("circle", { cx: earX, cy: earY, r: rx * 0.32, fill: coat.fur });
  out += el("circle", { cx: earX + rx * 0.03, cy: earY + rx * 0.02, r: rx * 0.2, fill: pink });
  // Nose, eye, cheek and whiskers.
  out += el("circle", { cx: tip[0], cy: tip[1], r: rx * 0.06, fill: "#e46f86" });
  const ex = hx + hr * 0.5;
  const ey = hy - hr * 0.2;
  out += el("circle", { cx: ex, cy: ey, r: rx * 0.07, fill: "#1a1412" });
  out += el("circle", { cx: ex + rx * 0.02, cy: ey - rx * 0.025, r: rx * 0.022, fill: "#fff" });
  out += el("circle", { cx: hx + hr * 0.35, cy: hy + hr * 0.4, r: rx * 0.09, fill: "#f28b9b", opacity: "0.35" });
  let whiskers = "";
  for (const k of [-1, 0, 1])
    whiskers += s`M ${tip[0] - rx * 0.12} ${tip[1] + rx * 0.02} l ${rx * 0.45} ${k * rx * 0.15 - rx * 0.02} `;
  out += el("path", {
    d: whiskers,
    stroke: coat.fur === "#efe9e1" ? "#8a8078" : "#4a403a",
    "stroke-width": rx * 0.018,
    opacity: "0.6",
  });
  if (indoors) {
    // A wedge of cheese in front of the nose, with holes.
    const cx0 = tip[0] + rx * 0.2;
    const cw = rx * 0.85;
    const ch = rx * 0.55;
    out += el("polygon", {
      points: pts([
        [cx0, gy],
        [cx0, gy - ch],
        [cx0 + cw, gy - ch * 0.45],
        [cx0 + cw, gy],
      ]),
      fill: "#f2c14e",
    });
    out += el("polygon", {
      points: pts([
        [cx0, gy - ch],
        [cx0 + cw, gy - ch * 0.45],
        [cx0 + cw * 0.85, gy - ch * 0.5],
      ]),
      fill: "#f7d77a",
    });
    for (const [dx, dy, r] of [
      [0.25, 0.4, 0.09],
      [0.6, 0.22, 0.07],
      [0.45, 0.7, 0.06],
    ])
      out += el("circle", { cx: cx0 + cw * dx, cy: gy - ch * dy, r: rx * r, fill: "#d9a43a" });
  }
  out += "</g>";
  note.alt(indoors ? "A mouse on a wooden floor beside a wedge of cheese" : "A mouse in a field among stalks of wheat");
  note.focus(turn(cx, dir, ex), ey);
  // Head and ears.
  const left = hx - hr * 1.6;
  const right = tip[0] + rx * 0.1;
  note.frame(turnBox(cx, dir, left, right - left), earY - rx * 0.4, right - left, hy + hr - earY + rx * 0.45);
  return out;
});

const WINGS = [
  { name: "orange", wing: "#f08a24", edge: "#2a1e18", spot: "#fff" },
  { name: "blue", wing: "#3d8de0", edge: "#14243a", spot: "#bfe3ff" },
  { name: "yellow", wing: "#f7d154", edge: "#2a2418", spot: "#fff4c2" },
  { name: "pink", wing: "#f48fb1", edge: "#6a2846", spot: "#fff" },
  { name: "white", wing: "#f7f4ec", edge: "#6a6a6a", spot: "#3a3a3a" },
  { name: "purple", wing: "#9b6fd8", edge: "#2a1a44", spot: "#f7d154" },
] as const;

/** A butterfly with open wings, resting on a flower or fluttering beside it. */
export const butterfly = defineKind("butterfly", "Butterfly", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const colors = g.pick(WINGS);
  const perched = g.chance(0.55);
  const fr = unit * g.f(0.13, 0.16);
  const fx = w / 2 + (perched ? 0 : g.pick([-1, 1]) * unit * 0.18);
  const ft = h * g.f(0.56, 0.64);
  const gy = h * g.f(0.82, 0.88);
  let out = sky(g, w, h, g.f(185, 215));
  // Grass.
  out += el("rect", { y: gy, width: w, height: h, fill: hsl(g.f(85, 115), 40, g.f(48, 56)) });
  // Other flowers, smaller and further off.
  for (let k = g.i(1, 3); k > 0; k--) {
    const x = w * g.pick([g.f(0.04, 0.22), g.f(0.78, 0.96)]);
    out += flower(g, x, gy + h * 0.05, gy - (gy - ft) * g.f(0.3, 0.7), fr * g.f(0.6, 0.8), g.pick(PETALS), "#f2c14e");
  }
  // The flower the butterfly visits.
  out += flower(g, fx, h + 2, ft, fr, g.pick(PETALS), g.pick(["#f2c14e", "#e8892e", "#7a4a2e"]));
  const span = unit * (perched ? g.f(0.16, 0.19) : g.f(0.18, 0.22));
  const body = span * 0.85;
  const tilt = perched ? g.f(-8, 8) : g.f(-25, 25);
  const bx = perched ? fx : fx - Math.sign(fx - w / 2) * unit * g.f(0.32, 0.38);
  const by = perched ? ft - body * 0.4 : ft - unit * g.f(0.15, 0.25);
  const ay = by - body * 0.2;
  const near = perched ? 1 : g.f(0.6, 0.8);
  // One pair of wings on the right side of the body: fore and hind.
  const wing = (sd: number, scale: number): string => {
    const W = span * scale;
    const H = span * 0.95;
    const x = (v: number): number => bx + sd * v;
    const fore = s`M ${x(0)} ${ay + body * 0.05}
       C ${x(W * 0.25)} ${ay - H * 0.7} ${x(W * 0.7)} ${ay - H * 1.0} ${x(W)} ${ay - H * 0.9}
       Q ${x(W * 1.02)} ${ay - H * 0.35} ${x(W * 0.7)} ${ay - H * 0.1}
       Q ${x(W * 0.35)} ${ay + H * 0.05} ${x(0)} ${ay + body * 0.15} Z`;
    const hind = s`M ${x(0)} ${ay + body * 0.1}
       C ${x(W * 0.65)} ${ay + H * 0.0} ${x(W * 0.8)} ${ay + H * 0.6} ${x(W * 0.38)} ${ay + H * 0.72}
       Q ${x(W * 0.1)} ${ay + H * 0.72} ${x(0)} ${ay + body * 0.45} Z`;
    const edge = Math.max(1.2, span * 0.045);
    let wings = el("path", {
      d: hind + fore,
      fill: colors.wing,
      stroke: colors.edge,
      "stroke-width": edge,
      "stroke-linejoin": "round",
    });
    // Spots near the wingtip and on the hind wing.
    for (const [dx, dy, r] of [
      [0.84, -0.78, 0.055],
      [0.9, -0.6, 0.045],
      [0.68, -0.84, 0.04],
      [0.45, 0.5, 0.06],
    ])
      wings += el("circle", { cx: x(W * dx), cy: ay + H * dy, r: span * r, fill: colors.spot });
    return wings;
  };
  out += el(
    "g",
    { transform: s`rotate(${tilt} ${bx} ${by + body * 0.5})` },
    wing(-1, near),
    wing(1, perched ? 1 : 1 / near - 0.2),
    // Body.
    el("ellipse", { cx: bx, cy: by, rx: span * 0.07, ry: body * 0.5, fill: "#2a2320" }),
    el("circle", { cx: bx, cy: by - body * 0.5, r: span * 0.08, fill: "#2a2320" }),
    // Antennae with clubbed tips.
    el("path", {
      d: s`M ${bx - span * 0.03} ${by - body * 0.55} Q ${bx - span * 0.1} ${by - body * 0.9} ${bx - span * 0.25} ${by - body * 1.0}
         M ${bx + span * 0.03} ${by - body * 0.55} Q ${bx + span * 0.1} ${by - body * 0.9} ${bx + span * 0.25} ${by - body * 1.0}`,
      stroke: "#2a2320",
      "stroke-width": Math.max(1, span * 0.025),
      fill: "none",
    }),
    el("circle", { cx: bx - span * 0.25, cy: by - body * 1.0, r: span * 0.035, fill: "#2a2320" }),
    el("circle", { cx: bx + span * 0.25, cy: by - body * 1.0, r: span * 0.035, fill: "#2a2320" }),
  );
  note.alt(perched ? "A butterfly resting on a flower" : "A butterfly fluttering beside a flower");
  note.focus(bx, ay);
  return out;
});

const LADYBUGS = [
  { shell: "#d8322b", spot: "#1a1414" },
  { shell: "#e8731c", spot: "#1a1414" },
  { shell: "#f2b71f", spot: "#1a1414" },
  { shell: "#c62828", spot: "#1a1414" },
  { shell: "#1f1a1a", spot: "#d8322b" },
] as const;

/** A ladybug crawling across a leaf, seen from above. */
export const ladybug = defineKind("ladybug", "Ladybug", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const colors = g.pick(LADYBUGS);
  const leafHue = g.f(90, 130);
  const leafAngle = g.f(-30, 30) + g.pick([0, 180]);
  const lx = w / 2;
  const ly = h / 2;
  const L = Math.max(w, h) * 0.55 + unit * 0.2;
  const lw = unit * g.f(0.38, 0.44);
  let out = fill(w, h, hsl(leafHue + g.f(-20, 20), 30, g.f(28, 38)));
  // Leaves behind, blurred into the background.
  for (let k = g.i(3, 5); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = h * g.f(0, 1);
    out += el("ellipse", {
      cx: x,
      cy: y,
      rx: unit * g.f(0.25, 0.4),
      ry: unit * g.f(0.1, 0.16),
      fill: hsl(leafHue + g.f(-15, 15), 35, g.f(36, 46)),
      transform: s`rotate(${g.f(0, 180)} ${x} ${y})`,
    });
  }
  // The leaf, its midrib and veins, all turned to the leaf's angle.
  const leafColor = hsl(leafHue, g.f(45, 60), g.f(44, 52));
  const vein = hsl(leafHue, 40, 66);
  let veins = s`M ${lx - L} ${ly} L ${lx + L * 0.95} ${ly}`;
  for (let k = 1; k <= 6; k++) {
    const x = lx - L + (k / 7) * L * 1.9;
    const width = lw * Math.sin((k / 7) * Math.PI) * 0.85;
    veins += s` M ${x} ${ly} Q ${x + width * 0.4} ${ly - width * 0.5} ${x + width * 0.75} ${ly - width}`;
    veins += s` M ${x} ${ly} Q ${x + width * 0.4} ${ly + width * 0.5} ${x + width * 0.75} ${ly + width}`;
  }
  out += el(
    "g",
    { transform: s`rotate(${leafAngle} ${lx} ${ly})` },
    el("path", {
      d: s`M ${lx - L * 1.05} ${ly}
           C ${lx - L * 0.5} ${ly - lw * 1.3} ${lx + L * 0.5} ${ly - lw * 1.2} ${lx + L} ${ly}
           C ${lx + L * 0.5} ${ly + lw * 1.2} ${lx - L * 0.5} ${ly + lw * 1.3} ${lx - L * 1.05} ${ly} Z`,
      fill: leafColor,
    }),
    el("path", { d: veins, stroke: vein, "stroke-width": Math.max(1.5, unit * 0.01), fill: "none", opacity: "0.7" }),
  );
  // A dewdrop on the leaf.
  const dew = g.chance(0.4);
  // The ladybug, heading along the leaf at a slight angle.
  const r = unit * g.f(0.12, 0.15);
  const heading = leafAngle + g.f(-35, 35) - 90;
  const along = g.f(-0.25, 0.25) * L;
  const rad = (leafAngle * Math.PI) / 180;
  const bx = lx + Math.cos(rad) * along;
  const by = ly + Math.sin(rad) * along;
  if (dew) {
    const dx = bx - Math.cos(rad) * r * 2.2 + Math.sin(rad) * lw * 0.45;
    const dy = by - Math.sin(rad) * r * 2.2 - Math.cos(rad) * lw * 0.45;
    out += el("circle", { cx: dx, cy: dy, r: r * 0.28, fill: "#fff", opacity: "0.35" });
    out += el("circle", { cx: dx - r * 0.08, cy: dy - r * 0.08, r: r * 0.08, fill: "#fff", opacity: "0.8" });
  }
  // Drawn pointing up (head at -y), then turned to its heading.
  let bug = el("ellipse", { cx: bx, cy: by + r * 0.08, rx: r * 1.05, ry: r * 1.08, fill: "#000", opacity: "0.2" });
  // Legs: three a side.
  let legs = "";
  for (const sd of [-1, 1])
    for (const k of [-0.45, 0, 0.45])
      legs += s`M ${bx + sd * r * 0.7} ${by + k * r} l ${sd * r * 0.45} ${k * r * 0.5 - r * 0.05} `;
  bug += el("path", { d: legs, stroke: "#1a1414", "stroke-width": r * 0.08, "stroke-linecap": "round" });
  // Antennae and head.
  bug += el("path", {
    d: s`M ${bx - r * 0.15} ${by - r * 1.15} q ${-r * 0.1} ${-r * 0.3} ${-r * 0.3} ${-r * 0.35}
         M ${bx + r * 0.15} ${by - r * 1.15} q ${r * 0.1} ${-r * 0.3} ${r * 0.3} ${-r * 0.35}`,
    stroke: "#1a1414",
    "stroke-width": r * 0.06,
    "stroke-linecap": "round",
    fill: "none",
  });
  bug += el("ellipse", { cx: bx, cy: by - r * 0.92, rx: r * 0.48, ry: r * 0.36, fill: "#1a1414" });
  for (const sd of [-1, 1])
    bug += el("circle", { cx: bx + sd * r * 0.25, cy: by - r * 0.98, r: r * 0.1, fill: "#f4f1ea" });
  // Shell, split down the middle.
  bug += el("ellipse", { cx: bx, cy: by, rx: r * 0.9, ry: r, fill: colors.shell });
  // Spots, mirrored across the split.
  const pairs = g.i(1, 3);
  let spots = el("circle", { cx: bx, cy: by - r * 0.62, r: r * 0.17, fill: colors.spot });
  const used: Point[] = [];
  for (let k = 0; k < pairs * 4 && used.length < pairs; k++) {
    const sx = r * g.f(0.28, 0.58);
    const sy = r * g.f(-0.45, 0.7);
    if (Math.hypot(sx / 0.9, sy) > r * 0.7) continue;
    if (used.some(([ux, uy]) => Math.hypot(ux - sx, uy - sy) < r * 0.4)) continue;
    used.push([sx, sy]);
  }
  const spotR = r * g.f(0.14, 0.19);
  for (const [sx, sy] of used)
    for (const sd of [-1, 1]) spots += el("circle", { cx: bx + sd * sx, cy: by + sy, r: spotR, fill: colors.spot });
  bug += spots;
  bug += el("path", {
    d: s`M ${bx} ${by - r * 0.62} V ${by + r}`,
    stroke: "#1a1414",
    "stroke-width": r * 0.05,
  });
  bug += el("ellipse", {
    cx: bx - r * 0.4,
    cy: by - r * 0.35,
    rx: r * 0.18,
    ry: r * 0.28,
    fill: "#fff",
    opacity: "0.3",
    transform: s`rotate(20 ${bx - r * 0.4} ${by - r * 0.35})`,
  });
  out += el("g", { transform: s`rotate(${heading + 90} ${bx} ${by})` }, bug);
  const spotCount = 1 + used.length * 2;
  note.alt(
    `A ladybug with ${numberWord(spotCount)} spot${spotCount > 1 ? "s" : ""} crawling on a leaf${dew ? " beside a dewdrop" : ""}`,
  );
  note.focus(bx, by);
  return out;
});

/** A bumblebee buzzing over flowers in a meadow, a dotted trail behind it. */
export const bee = defineKind("bee", "Bee", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([1, -1]);
  const gy = h * g.f(0.8, 0.86);
  const fr = unit * g.f(0.14, 0.17);
  const fx = w / 2 + dir * unit * g.f(0.12, 0.18);
  const ft = h * g.f(0.55, 0.62);
  let out = sky(g, w, h, g.f(185, 215));
  // Meadow.
  out += el("rect", { y: gy, width: w, height: h, fill: hsl(g.f(85, 115), 40, g.f(48, 56)) });
  // Flowers: a few around, then the one the bee is heading for.
  const others = g.i(1, 3);
  for (let k = 0; k < others; k++) {
    const x = w * g.f(0.05, 0.95);
    if (Math.abs(x - fx) < fr * 2) continue;
    out += flower(g, x, h + 2, gy - (gy - ft) * g.f(0.2, 0.7), fr * g.f(0.6, 0.85), g.pick(PETALS), "#f2c14e");
  }
  out += flower(g, fx, h + 2, ft, fr, g.pick(PETALS), g.pick(["#f2c14e", "#e8892e"]));
  const rx = unit * g.f(0.1, 0.12);
  const ry = rx * 0.72;
  const bx = fx - dir * unit * g.f(0.28, 0.32);
  const by = ft - unit * g.f(0.1, 0.16);
  // The dotted trail it flew along, looping behind.
  const back = bx - dir * rx * 1.2;
  const loop = unit * g.f(0.1, 0.16);
  out += el("path", {
    d: s`M ${back} ${by}
         C ${back - dir * loop} ${by - loop * 0.2} ${back - dir * loop * 1.5} ${by - loop * 1.2} ${back - dir * loop * 0.9} ${by - loop * 1.1}
         S ${back - dir * loop * 1.4} ${by + loop * 0.6} ${back - dir * loop * 2.6} ${by + loop * 0.3}`,
    stroke: "#3a3020",
    "stroke-width": Math.max(1.2, unit * 0.007),
    "stroke-dasharray": s`${unit * 0.015} ${unit * 0.02}`,
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.4",
  });
  const clip = g.id("bee");
  out += el("defs", {}, el("clipPath", { id: clip }, el("ellipse", { cx: bx, cy: by, rx, ry })));
  out += facing(bx, dir);
  // Stinger and dangling legs.
  out += el("polygon", {
    points: pts([
      [bx - rx * 0.92, by - ry * 0.15],
      [bx - rx * 1.25, by + ry * 0.05],
      [bx - rx * 0.92, by + ry * 0.2],
    ]),
    fill: "#2a2320",
  });
  out += el("path", {
    d: s`M ${bx - rx * 0.3} ${by + ry * 0.8} l ${-rx * 0.1} ${ry * 0.45}
         M ${bx + rx * 0.1} ${by + ry * 0.85} l ${-rx * 0.05} ${ry * 0.45}
         M ${bx + rx * 0.45} ${by + ry * 0.75} l ${rx * 0.02} ${ry * 0.4}`,
    stroke: "#2a2320",
    "stroke-width": rx * 0.08,
    "stroke-linecap": "round",
  });
  // Back wing, body with stripes, head, front wing.
  const wingAt = (dx: number, rot: number, opacity: string): string =>
    el("ellipse", {
      cx: bx + dx,
      cy: by - ry * 1.2,
      rx: rx * 0.42,
      ry: ry * 0.85,
      fill: "#eaf6ff",
      opacity,
      transform: s`rotate(${rot} ${bx + dx} ${by - ry * 0.4})`,
    });
  out += wingAt(-rx * 0.2, -30, "0.6");
  out += el("ellipse", { cx: bx, cy: by, rx, ry, fill: g.pick(["#f7c531", "#f2b71f", "#f5cf4a"]) });
  out += el(
    "g",
    { "clip-path": `url(#${clip})`, fill: "#2a2320" },
    ...[-0.55, -0.05, 0.45].map(k =>
      el("rect", { x: bx + k * rx - rx * 0.13, y: by - ry, width: rx * 0.26, height: ry * 2 }),
    ),
  );
  const hx = bx + rx * 1.02;
  const hy = by - ry * 0.08;
  const hr = ry * 0.62;
  out += el("circle", { cx: hx, cy: hy, r: hr, fill: "#2a2320" });
  out += el("circle", { cx: hx + hr * 0.35, cy: hy - hr * 0.15, r: hr * 0.3, fill: "#fff" });
  out += el("circle", { cx: hx + hr * 0.45, cy: hy - hr * 0.15, r: hr * 0.15, fill: "#111" });
  out += el("path", {
    d: s`M ${hx} ${hy - hr * 0.9} Q ${hx + hr * 0.2} ${hy - hr * 1.8} ${hx + hr * 0.9} ${hy - hr * 1.9}
         M ${hx + hr * 0.35} ${hy - hr * 0.8} Q ${hx + hr * 0.8} ${hy - hr * 1.5} ${hx + hr * 1.4} ${hy - hr * 1.45}`,
    stroke: "#2a2320",
    "stroke-width": Math.max(1, rx * 0.06),
    "stroke-linecap": "round",
    fill: "none",
  });
  out += wingAt(rx * 0.1, -12, "0.75");
  out += "</g>";
  note.alt(`A bumblebee buzzing toward a flower in a meadow`);
  note.focus(bx, by);
  return out;
});

const OCTOPI = [
  { skin: "#e8735a", name: "red" },
  { skin: "#f08a9a", name: "pink" },
  { skin: "#9b6fd8", name: "purple" },
  { skin: "#f2a54a", name: "orange" },
  { skin: "#5aa0d8", name: "blue" },
] as const;

/** An octopus sitting on the seabed, its arms curling over the sand. */
export const octopus = defineKind("octopus", "Octopus", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const colors = g.pick(OCTOPI);
  const skin = colors.skin;
  const dark = mix(skin, "#000000", 0.18);
  const light = mix(skin, "#ffffff", 0.4);
  const waterHue = g.f(180, 210);
  const water = g.id("water");
  const gy = h * g.f(0.8, 0.86);
  const cx = w * g.f(0.45, 0.55);
  const rx = unit * g.f(0.17, 0.2);
  const ry = rx * g.f(1.0, 1.15);
  const my = gy - unit * 0.17 - ry * 0.55;
  let out =
    el("defs", {}, lin(water, [hsl(waterHue, 55, 60), hsl(waterHue + 15, 60, 30)])) + fill(w, h, `url(#${water})`);
  // Light from above.
  out += el("path", {
    d: s`M ${w * 0.2} -5 L ${w * 0.35} -5 L ${w * 0.55} ${gy} L ${w * 0.25} ${gy} Z`,
    fill: "#fff",
    opacity: "0.06",
  });
  // Seaweed and rocks.
  for (let k = g.i(2, 3); k > 0; k--) {
    const x = w * g.pick([g.f(0.03, 0.2), g.f(0.8, 0.97)]);
    out += el("path", {
      d: s`M ${x} ${gy + 4}
           C ${x + g.f(-20, 20)} ${gy - h * 0.2} ${x + g.f(-20, 20)} ${gy - h * 0.35} ${x + g.f(-12, 12)} ${gy - h * g.f(0.35, 0.55)}`,
      stroke: hsl(g.f(100, 150), 40, g.f(28, 40)),
      "stroke-width": unit * g.f(0.02, 0.035),
      "stroke-linecap": "round",
      fill: "none",
    });
  }
  // The sand, with a rock or two.
  out += el("path", {
    d: s`M -5 ${gy} Q ${w * 0.5} ${gy - h * 0.03} ${w + 5} ${gy + h * 0.01} V ${h} H -5 Z`,
    fill: hsl(g.f(38, 48), 45, g.f(70, 78)),
  });
  for (let k = g.i(1, 2); k > 0; k--) {
    const x = w * g.pick([g.f(0.05, 0.2), g.f(0.8, 0.95)]);
    const rr = unit * g.f(0.04, 0.07);
    out += el("ellipse", { cx: x, cy: gy + rr * 0.3, rx: rr * 1.3, ry: rr * 0.8, fill: hsl(210, 10, g.f(45, 58)) });
  }
  // Shadow.
  out += el("ellipse", { cx, cy: gy + unit * 0.02, rx: rx * 2.6, ry: unit * 0.035, fill: "#000", opacity: "0.15" });
  // Arms: the outer ones first, darker and behind.
  const arm = (sd: number, j: number, paint: string): string => {
    const base: Point = [cx + sd * rx * (0.12 + j * 0.16), my + ry * 0.55];
    const ground: Point = [cx + sd * rx * (0.4 + j * 0.5), gy - rx * 0.05];
    const tip: Point = [cx + sd * rx * (0.75 + j * 0.55 + g.f(0, 0.2)), gy - rx * g.f(0.4, 0.95)];
    const curve: Point[] = [base, [base[0] + sd * rx * 0.05, gy - rx * 0.1], ground, tip];
    let a = limb(curve, rx * 0.42, rx * 0.1, paint);
    // Suckers near the tip.
    for (const t of [0.6, 0.8]) {
      const [[x, y]] = cubic(curve, t);
      a += el("circle", { cx: x, cy: y + rx * 0.03, r: rx * 0.04 * (1.3 - t), fill: light });
    }
    return a;
  };
  for (const j of [3, 2]) for (const sd of [-1, 1]) out += arm(sd, j, dark);
  for (const j of [1, 0]) for (const sd of [-1, 1]) out += arm(sd, j, skin);
  // The head, with a few spots and a highlight.
  out += el("ellipse", { cx, cy: my, rx, ry, fill: skin });
  for (let k = g.i(2, 4); k > 0; k--)
    out += el("circle", {
      cx: cx + rx * g.f(-0.55, 0.55),
      cy: my - ry * g.f(0.35, 0.75),
      r: rx * g.f(0.05, 0.09),
      fill: dark,
      opacity: "0.6",
    });
  out += el("ellipse", {
    cx: cx - rx * 0.4,
    cy: my - ry * 0.55,
    rx: rx * 0.18,
    ry: ry * 0.12,
    fill: "#fff",
    opacity: "0.25",
  });
  // Eyes: wide awake or sleepy.
  const sleepy = g.chance(0.25);
  for (const sd of [-1, 1]) {
    const ex = cx + sd * rx * 0.38;
    const ey = my + ry * 0.15;
    if (sleepy)
      out += el("path", {
        d: s`M ${ex - rx * 0.15} ${ey} Q ${ex} ${ey + rx * 0.12} ${ex + rx * 0.15} ${ey}`,
        stroke: "#1a1414",
        "stroke-width": rx * 0.05,
        "stroke-linecap": "round",
        fill: "none",
      });
    else {
      out += el("circle", { cx: ex, cy: ey, r: rx * 0.17, fill: "#fff" });
      out += el("circle", { cx: ex + sd * rx * 0.02, cy: ey + rx * 0.02, r: rx * 0.09, fill: "#111" });
      out += el("circle", { cx: ex + sd * rx * 0.02 + rx * 0.03, cy: ey - rx * 0.02, r: rx * 0.03, fill: "#fff" });
    }
    out += el("circle", { cx: cx + sd * rx * 0.58, cy: my + ry * 0.38, r: rx * 0.1, fill: "#ff6a7a", opacity: "0.3" });
  }
  out += el("path", {
    d: s`M ${cx - rx * 0.12} ${my + ry * 0.42} Q ${cx} ${my + ry * 0.52} ${cx + rx * 0.12} ${my + ry * 0.42}`,
    stroke: "#1a1414",
    "stroke-width": rx * 0.045,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Bubbles.
  for (let k = g.i(2, 4); k > 0; k--)
    out += el("circle", {
      cx: cx + rx * g.f(0.8, 1.4) * g.pick([-1, 1]),
      cy: my - ry * g.f(0.2, 1.3),
      r: unit * g.f(0.01, 0.02),
      fill: "none",
      stroke: "#fff",
      "stroke-width": "1.5",
      opacity: "0.6",
    });
  note.alt(`A ${sleepy ? "sleepy " : ""}octopus sitting on the sandy seabed`);
  note.focus(cx, my + ry * 0.15);
  // Head.
  note.frame(cx - rx * 1.1, my - ry * 1.08, rx * 2.2, ry * 1.85);
  return out;
});

/** A glowing jellyfish drifting in deep water, trailing its tentacles. */
export const jellyfish = defineKind("jellyfish", "Jellyfish", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.pick([g.f(280, 340), g.f(180, 210), g.f(10, 40)]);
  const deep = g.f(215, 250);
  const water = g.id("water");
  const glow = g.id("glow");
  let out =
    el(
      "defs",
      {},
      lin(water, [hsl(deep, 55, 30), hsl(deep + 10, 60, 12)]),
      el(
        "radialGradient",
        { id: glow },
        el("stop", { offset: 0, "stop-color": hsl(hue, 80, 75), "stop-opacity": "0.45" }),
        el("stop", { offset: 1, "stop-color": hsl(hue, 80, 75), "stop-opacity": "0" }),
      ),
    ) + fill(w, h, `url(#${water})`);
  // Specks drifting in the water.
  let specks = "";
  for (let k = g.i(10, 18); k > 0; k--)
    specks += el("circle", { cx: w * g.f(0, 1), cy: h * g.f(0, 1), r: unit * g.f(0.003, 0.008) });
  out += el("g", { fill: "#fff", opacity: "0.35" }, specks);
  const draw = (cx: number, top: number, rx: number, length: number, fade: string): string => {
    const ry = rx * 0.78;
    const rim = top + ry;
    const bell = hsl(hue, 70, 66);
    const inner = hsl(hue + 10, 80, 82);
    const ribbon = hsl(hue - 10, 65, 60);
    // Glow around the bell.
    let j = el("circle", { cx, cy: rim - ry * 0.3, r: rx * 2, fill: `url(#${glow})` });
    // Thin tentacles from the rim.
    let lines = "";
    const count = 7;
    for (let k = 0; k < count; k++) {
      const x = cx - rx * 0.85 + (k / (count - 1)) * rx * 1.7;
      const sway = rx * g.f(0.15, 0.3) * g.pick([-1, 1]);
      const len = length * g.f(0.75, 1);
      lines += s`M ${x} ${rim} C ${x + sway} ${rim + len * 0.33} ${x - sway} ${rim + len * 0.66} ${x + sway * 0.5} ${rim + len} `;
    }
    j += el("path", {
      d: lines,
      stroke: inner,
      "stroke-width": Math.max(1, rx * 0.03),
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.7",
    });
    // Frilly oral arms from the middle.
    for (const k of [-1, 0, 1]) {
      const x = cx + k * rx * 0.22;
      const len = length * g.f(0.45, 0.7);
      const sway = rx * 0.18 * (k || 1);
      j += el("path", {
        d: s`M ${x} ${rim - ry * 0.1} C ${x + sway} ${rim + len * 0.3} ${x - sway} ${rim + len * 0.65} ${x + sway * 0.6} ${rim + len}`,
        stroke: ribbon,
        "stroke-width": rx * 0.13,
        "stroke-linecap": "round",
        "stroke-dasharray": s`${rx * 0.12} ${rx * 0.04}`,
        fill: "none",
        opacity: "0.85",
      });
    }
    // The bell, with a scalloped rim.
    const scallops = 7;
    let d = s`M ${cx - rx} ${rim} C ${cx - rx} ${top - ry * 0.25} ${cx + rx} ${top - ry * 0.25} ${cx + rx} ${rim}`;
    for (let k = 1; k <= scallops; k++) {
      const x = cx + rx - (k / scallops) * rx * 2;
      d += s` Q ${x + rx / scallops} ${rim + ry * 0.16} ${x} ${rim}`;
    }
    j += el("path", { d: d + " Z", fill: bell, opacity: "0.92" });
    j += el("path", {
      d: s`M ${cx - rx * 0.6} ${rim - ry * 0.05} C ${cx - rx * 0.6} ${top + ry * 0.15} ${cx + rx * 0.6} ${top + ry * 0.15} ${cx + rx * 0.6} ${rim - ry * 0.05} Z`,
      fill: inner,
      opacity: "0.5",
    });
    j += el("ellipse", {
      cx: cx - rx * 0.45,
      cy: top + ry * 0.3,
      rx: rx * 0.2,
      ry: ry * 0.12,
      fill: "#fff",
      opacity: "0.45",
      transform: s`rotate(-30 ${cx - rx * 0.45} ${top + ry * 0.3})`,
    });
    return el("g", { opacity: fade }, j);
  };
  // Smaller ones further off.
  const far = g.i(0, 2);
  for (let k = 0; k < far; k++) {
    const rx = unit * g.f(0.06, 0.09);
    out += draw(w * g.pick([g.f(0.08, 0.25), g.f(0.75, 0.92)]), h * g.f(0.1, 0.55), rx, rx * 2.5, "0.45");
  }
  const rx = unit * g.f(0.19, 0.24);
  const top = h * g.f(0.1, 0.16);
  const cx = w * g.f(0.42, 0.58);
  const tilt = g.f(-12, 12);
  const length = h * 0.92 - top - rx * 0.78;
  out += el("g", { transform: s`rotate(${tilt} ${cx} ${top + rx * 0.6})` }, draw(cx, top, rx, length, "1"));
  note.alt(
    `A glowing jellyfish drifting in deep water${far ? `, with ${far > 1 ? "two smaller ones" : "a smaller one"} behind` : ""}`,
  );
  note.focus(cx, top + rx * 0.45);
  return out;
});

const CRABS = [
  { shell: "#e2553f", name: "red" },
  { shell: "#f08a3a", name: "orange" },
  { shell: "#c8403a", name: "red" },
  { shell: "#5a86c8", name: "blue" },
  { shell: "#8a5aa8", name: "purple" },
] as const;

/** A crab on the sand at the water's edge, claws raised. */
export const crab = defineKind("crab", "Crab", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const colors = g.pick(CRABS);
  const shell = colors.shell;
  const dark = mix(shell, "#000000", 0.2);
  const light = mix(shell, "#ffffff", 0.35);
  const hz = h * g.f(0.3, 0.4);
  const gy = h * g.f(0.8, 0.86);
  const cx = w * g.f(0.45, 0.55);
  const rx = unit * g.f(0.2, 0.23);
  const ry = rx * g.f(0.58, 0.66);
  const cy = gy - ry * 1.3;
  let out = sky(g, w, h, g.f(190, 215));
  // Sea, a line of foam and the sand.
  out += el("rect", { y: hz, width: w, height: h, fill: hsl(g.f(180, 200), 55, g.f(48, 56)) });
  const shore = hz + (h - hz) * g.f(0.18, 0.28);
  out += el("path", {
    d: s`M -5 ${shore} Q ${w * 0.3} ${shore - h * 0.04} ${w * 0.6} ${shore} T ${w + 5} ${shore} V ${h} H -5 Z`,
    fill: "#f4f1ea",
    opacity: "0.85",
  });
  const sand = hsl(g.f(38, 46), 55, g.f(74, 82));
  out += el("path", {
    d: s`M -5 ${shore + h * 0.03} Q ${w * 0.3} ${shore - h * 0.01} ${w * 0.6} ${shore + h * 0.03} T ${w + 5} ${shore + h * 0.03} V ${h} H -5 Z`,
    fill: sand,
  });
  // A shell or a starfish on the sand.
  const extra = g.pick(["shell", "starfish", "none"] as const);
  if (extra !== "none") {
    const sx = cx + g.pick([-1, 1]) * rx * g.f(2.1, 2.5);
    const sy = gy + (h - gy) * g.f(0.1, 0.5);
    const sr = unit * g.f(0.035, 0.05);
    if (extra === "starfish") {
      const star: Point[] = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 ? sr * 0.42 : sr;
        star.push([sx + Math.cos(a) * r, sy + Math.sin(a) * r * 0.8]);
      }
      out += el("path", { d: smoothClosed(star), fill: g.pick(["#f08a5a", "#e86f8a", "#f2b14e"]) });
    } else {
      out += el("path", {
        d: s`M ${sx - sr} ${sy + sr * 0.4} Q ${sx} ${sy - sr * 1.3} ${sx + sr} ${sy + sr * 0.4} Z`,
        fill: "#f6e1d0",
      });
      out += el("path", {
        d: s`M ${sx} ${sy + sr * 0.35} L ${sx} ${sy - sr * 0.4} M ${sx} ${sy + sr * 0.35} L ${sx - sr * 0.5} ${sy - sr * 0.15}
             M ${sx} ${sy + sr * 0.35} L ${sx + sr * 0.5} ${sy - sr * 0.15}`,
        stroke: "#d8b8a0",
        "stroke-width": sr * 0.1,
        "stroke-linecap": "round",
      });
    }
  }
  // Shadow.
  out += el("ellipse", { cx, cy: gy, rx: rx * 1.6, ry: ry * 0.18, fill: "#000", opacity: "0.15" });
  // Legs: three a side, bending up at the knee and down to the sand.
  let legs = "";
  for (const sd of [-1, 1])
    for (let k = 0; k < 3; k++) {
      const hip: Point = [cx + sd * rx * (0.7 - k * 0.1), cy + ry * (0.1 + k * 0.25)];
      const knee: Point = [cx + sd * rx * (1.15 + k * 0.22), cy - ry * (0.45 - k * 0.3)];
      const foot: Point = [cx + sd * rx * (1.05 + k * 0.4), gy];
      legs += s`M ${hip[0]} ${hip[1]} L ${knee[0]} ${knee[1]} L ${foot[0]} ${foot[1]} `;
    }
  out += el("path", {
    d: legs,
    stroke: dark,
    "stroke-width": rx * 0.12,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  });
  // Arms and claws, raised. Each claw is round with a wedge cut out between the pincers.
  const reach = g.f(1.3, 1.6);
  const gape = g.f(0.3, 0.5);
  for (const sd of [-1, 1]) {
    const cr = rx * 0.3;
    const px = cx + sd * rx * 1.15;
    const py = cy - ry * reach;
    out += el("path", {
      d: s`M ${cx + sd * rx * 0.6} ${cy - ry * 0.3} Q ${cx + sd * rx * 1.15} ${cy - ry * 0.3} ${px} ${py}`,
      stroke: shell,
      "stroke-width": rx * 0.18,
      "stroke-linecap": "round",
      fill: "none",
    });
    const mouth = -Math.PI / 2 + sd * 0.35;
    const a1 = mouth + gape;
    const a2 = mouth - gape;
    out += el("path", {
      d: s`M ${px} ${py - cr * 0.1}
           L ${px + Math.cos(a1) * cr} ${py + Math.sin(a1) * cr}
           A ${cr} ${cr * 1.1} 0 1 1 ${px + Math.cos(a2) * cr} ${py + Math.sin(a2) * cr} Z`,
      fill: shell,
    });
  }
  // Eye stalks and eyes.
  for (const sd of [-1, 1]) {
    const ex = cx + sd * rx * 0.3;
    const ey = cy - ry * 1.45;
    out += el("path", {
      d: s`M ${cx + sd * rx * 0.22} ${cy - ry * 0.7} L ${ex} ${ey}`,
      stroke: dark,
      "stroke-width": rx * 0.08,
      "stroke-linecap": "round",
    });
    out += el("circle", { cx: ex, cy: ey, r: rx * 0.14, fill: "#fff" });
    out += el("circle", { cx: ex + sd * rx * 0.02, cy: ey + rx * 0.02, r: rx * 0.075, fill: "#111" });
    out += el("circle", { cx: ex + rx * 0.03, cy: ey - rx * 0.03, r: rx * 0.025, fill: "#fff" });
  }
  // Body, with a highlight, smile and cheeks.
  out += el("ellipse", { cx, cy, rx, ry, fill: shell });
  out += el("ellipse", { cx, cy: cy - ry * 0.45, rx: rx * 0.55, ry: ry * 0.22, fill: light, opacity: "0.5" });
  out += el("path", {
    d: s`M ${cx - rx * 0.2} ${cy + ry * 0.05} Q ${cx} ${cy + ry * 0.35} ${cx + rx * 0.2} ${cy + ry * 0.05}`,
    stroke: "#3a1a14",
    "stroke-width": rx * 0.05,
    "stroke-linecap": "round",
    fill: "none",
  });
  for (const sd of [-1, 1])
    out += el("circle", { cx: cx + sd * rx * 0.5, cy: cy + ry * 0.05, r: rx * 0.1, fill: "#ff6a7a", opacity: "0.35" });
  note.alt(`A crab on the sand at the water's edge, claws raised${extra === "none" ? "" : `, beside a ${extra}`}`);
  note.focus(cx, cy - ry * 0.6);
  // Body and eyes.
  note.frame(cx - rx * 1.1, cy - ry * 1.85, rx * 2.2, ry * 2.85);
  return out;
});

/** Path data written in units of a figure's length: every number is multiplied by `L`. */
const scaled = (L: number, d: string): string => d.replace(/-?\d*\.?\d+/g, v => String(Math.round(+v * L * 10) / 10));

/**
 * Places a figure drawn facing right around (0, 0), `L` long: at (cx, cy), turned to face `dir`
 * and tilted by `tilt` degrees (nose up when negative). Returns the group's opening tag and a
 * function from figure units to picture px.
 */
function pose(cx: number, cy: number, L: number, dir: number, tilt: number): [string, (x: number, y: number) => Point] {
  const a = (dir * tilt * Math.PI) / 180;
  const at = (x: number, y: number): Point => [
    cx + Math.cos(a) * dir * x * L - Math.sin(a) * y * L,
    cy + Math.sin(a) * dir * x * L + Math.cos(a) * y * L,
  ];
  return [s`<g transform="translate(${cx} ${cy}) rotate(${dir * tilt}) scale(${dir} 1)">`, at];
}

/** The box around some figure points, as [x, y, width, height]. */
function boxAround(points: readonly Point[]): [number, number, number, number] {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
}

/** Open water with light falling from the surface. */
function underwater(g: Rand, w: number, h: number): string {
  const hue = g.f(185, 210);
  const water = g.id("water");
  let out = el("defs", {}, lin(water, [hsl(hue, 55, 62), hsl(hue + 15, 60, 30)])) + fill(w, h, `url(#${water})`);
  // Shimmer at the surface, and rays slanting down from it.
  out += el("rect", { width: w, height: h * 0.04, fill: "#fff", opacity: "0.12" });
  const slant = g.f(-0.25, 0.25) * h;
  let rays = "";
  for (let k = g.i(3, 4); k > 0; k--) {
    const x = w * g.f(0, 1);
    const spread = w * g.f(0.04, 0.1);
    rays += s`M ${x} 0 L ${x + spread} 0 L ${x + spread * 2.2 + slant} ${h} L ${x + slant} ${h} Z `;
  }
  out += el("path", { d: rays, fill: "#fff", opacity: "0.08" });
  return out;
}

/** A few bubbles rising around (x, y). */
function bubbles(g: Rand, x: number, y: number, spread: number, r: number): string {
  let out = "";
  for (let k = g.i(2, 4); k > 0; k--)
    out += el("circle", { cx: x + g.f(-0.5, 0.5) * spread, cy: y - k * r * 4.5, r: r * g.f(0.6, 1.2) });
  return el("g", { fill: "none", stroke: "#fff", "stroke-width": "1.5", opacity: "0.6" }, out);
}

/** A splash of water thrown up where something meets the surface at (x, y). */
function splash(x: number, y: number, r: number): string {
  let out = el("ellipse", { cx: x, cy: y, rx: r * 1.2, ry: r * 0.22, fill: "#fff", opacity: "0.5" });
  out += el("path", {
    d: s`M ${x - r} ${y} Q ${x - r * 0.75} ${y - r * 0.55} ${x - r * 0.35} ${y - r * 0.2}
         Q ${x - r * 0.1} ${y - r * 0.95} ${x + r * 0.15} ${y - r * 0.25}
         Q ${x + r * 0.55} ${y - r * 0.7} ${x + r} ${y} Z`,
    fill: "#fff",
    opacity: "0.85",
  });
  for (const [dx, dy] of [
    [-0.8, 0.8],
    [-0.3, 1.25],
    [0.45, 1.05],
    [0.95, 0.65],
  ])
    out += el("circle", { cx: x + dx * r, cy: y - dy * r, r: r * 0.09, fill: "#fff", opacity: "0.85" });
  return out;
}

const DOLPHINS = ["#8aa3bd", "#7b95ad", "#93a7bb", "#6f8aa6", "#8fa2b0"] as const;

/** One dolphin facing right, a unit long, around (0, 0). Clip ids come from `g`. */
function dolphinFigure(g: Rand, L: number, body: string): string {
  const clip = g.id(`dolphin${g.i(0, 1e6)}`);
  const dark = mix(body, "#000000", 0.18);
  const belly = mix(body, "#ffffff", 0.62);
  const bodyD = scaled(
    L,
    `M 0.53 0.03 C 0.5 0.01 0.45 0.0 0.4 -0.005 C 0.37 -0.02 0.37 -0.07 0.32 -0.09
     C 0.24 -0.13 0.1 -0.13 -0.05 -0.1 C -0.2 -0.07 -0.35 -0.03 -0.43 -0.01 L -0.43 0.02
     C -0.3 0.04 -0.1 0.12 0.15 0.1 C 0.3 0.09 0.42 0.06 0.53 0.03 Z`,
  );
  // Flukes, the dorsal fin and the far flipper sit behind the body.
  let out = el("path", {
    d: scaled(
      L,
      "M -0.4 0.0 Q -0.47 -0.03 -0.56 -0.11 Q -0.52 -0.02 -0.5 0.005 Q -0.52 0.04 -0.56 0.12 Q -0.47 0.05 -0.4 0.02 Z",
    ),
    fill: dark,
  });
  out += el("path", {
    d: scaled(L, "M 0.07 -0.115 C 0.04 -0.16 -0.01 -0.19 -0.1 -0.195 C -0.07 -0.16 -0.08 -0.12 -0.13 -0.095 Z"),
    fill: dark,
  });
  out += el("path", { d: scaled(L, "M 0.26 0.07 Q 0.24 0.15 0.17 0.19 Q 0.18 0.12 0.18 0.08 Z"), fill: dark });
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: bodyD })));
  out += el("path", { d: bodyD, fill: body });
  // Pale belly and throat, clipped to the body, and a sheen along the back.
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    el("ellipse", { cx: 0.12 * L, cy: 0.13 * L, rx: 0.42 * L, ry: 0.085 * L, fill: belly }),
    el("ellipse", { cx: 0.1 * L, cy: -0.1 * L, rx: 0.28 * L, ry: 0.02 * L, fill: "#fff", opacity: "0.25" }),
  );
  // Near flipper, smiling mouth and eye.
  out += el("path", { d: scaled(L, "M 0.22 0.06 Q 0.18 0.15 0.08 0.18 Q 0.12 0.1 0.12 0.06 Z"), fill: dark });
  out += el("path", {
    d: scaled(L, "M 0.52 0.035 Q 0.46 0.05 0.39 0.03"),
    stroke: mix(body, "#000000", 0.45),
    "stroke-width": L * 0.008,
    "stroke-linecap": "round",
    fill: "none",
  });
  out += el("circle", { cx: 0.33 * L, cy: -0.02 * L, r: 0.018 * L, fill: "#1a1a22" });
  out += el("circle", { cx: 0.336 * L, cy: -0.026 * L, r: 0.006 * L, fill: "#fff" });
  return out;
}

/** A dolphin leaping from the sea in an arc, or swimming underwater; sometimes two together. */
export const dolphin = defineKind("dolphin", "Dolphin", { scene: ["leap", "swim"] }, (g, w, h, note) => {
  const scene = g.option("scene", g.pick(["leap", "leap", "swim"] as const));
  const dir = g.pick([-1, 1]);
  const pair = g.chance(0.4);
  const body = g.pick(DOLPHINS);
  // The head, in figure units: what an avatar frames.
  const head: Point[] = [
    [0.2, -0.13],
    [0.56, -0.13],
    [0.56, 0.11],
    [0.2, 0.11],
  ];
  let out = "";
  let frame: [number, number, number, number];
  let eye: Point;
  if (scene === "leap") {
    const hz = h * g.f(0.5, 0.6);
    out += sky(g, w, h, g.f(185, 215));
    if (g.chance(0.4))
      out += el("circle", {
        cx: w * g.pick([g.f(0.1, 0.25), g.f(0.75, 0.9)]),
        cy: hz * g.f(0.25, 0.45),
        r: Math.min(w, h) * 0.07,
        fill: "#fff3c4",
      });
    const sea = g.id("sea");
    const seaHue = g.f(190, 210);
    out +=
      el("defs", {}, lin(sea, [hsl(seaHue, 55, 50), hsl(seaHue + 10, 60, 30)])) +
      el("rect", { y: hz, width: w, height: h - hz, fill: `url(#${sea})` });
    // Little waves across the sea.
    let waves = "";
    for (let k = g.i(4, 6); k > 0; k--) {
      const x = w * g.f(0, 1);
      const y = hz + (h - hz) * g.f(0.1, 0.95);
      const r = Math.min(w, h) * g.f(0.02, 0.035);
      waves += s`M ${x - r} ${y} Q ${x} ${y - r * 0.5} ${x + r} ${y} `;
    }
    out += el("path", {
      d: waves,
      stroke: "#fff",
      "stroke-width": "2",
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.5",
    });
    // Rising with the tail just leaving the water, or diving back in nose first.
    const phase = g.pick(["rise", "dive"] as const);
    const tilt = phase === "rise" ? g.f(-32, -18) : g.f(18, 32);
    const L0 = Math.min(w * 0.55, h * 1.25) * g.f(0.85, 1);
    const leap = (x: number, wl: number, L: number, fade: string): [Point, Point[]] => {
      // The low end (tail or beak) touches the water, in a splash.
      const end: Point = phase === "rise" ? [-0.5, 0.01] : [0.52, 0.03];
      const cy = wl - pose(x, 0, L, dir, tilt)[1](...end)[1];
      const [open, at] = pose(x, cy, L, dir, tilt);
      const low = at(...end);
      let d = splash(low[0], wl, L * 0.14);
      d += open + dolphinFigure(g, L, body) + "</g>";
      if (phase === "rise") {
        // Drops falling from the tail.
        for (let k = 1; k <= 3; k++) {
          const [x, y] = at(-0.5 + k * 0.08, 0.1 + k * 0.03);
          d += el("circle", { cx: x, cy: y, r: L * 0.011, fill: "#fff", opacity: "0.8" });
        }
      }
      out += el("g", { opacity: fade }, d);
      return [at(0.33, -0.02), head.map(p => at(p[0], p[1]))];
    };
    let cx = w * g.f(0.45, 0.55);
    if (pair) {
      cx += dir * w * 0.08;
      const L = L0 * 0.68;
      leap(cx - dir * Math.min(L0 * 0.85, w * 0.32), hz + (h - hz) * 0.15, L, "0.9");
    }
    const [e, hd] = leap(cx, hz + (h - hz) * g.f(0.3, 0.4), L0, "1");
    eye = e;
    frame = boxAround(hd);
    const what = phase === "rise" ? "leaping from" : "diving back into";
    note.alt(`${pair ? "Two dolphins" : "A dolphin"} ${what} the sea${pair ? " together" : ""}`);
  } else {
    out += underwater(g, w, h);
    const L0 = Math.min(w * 0.62, h * 1.5) * g.f(0.85, 1);
    const tilt = g.f(-10, 10);
    let cx = w * g.f(0.45, 0.55);
    let cy = h * g.f(0.5, 0.58);
    if (pair) {
      cx += dir * w * 0.06;
      const L = L0 * 0.72;
      const above = g.chance(0.5);
      const [open] = pose(cx - dir * Math.min(L0 * 0.5, w * 0.25), cy + (above ? -1 : 1) * L0 * 0.26, L, dir, tilt);
      out += el("g", { opacity: "0.75" }, open + dolphinFigure(g, L, body) + "</g>");
      if (!above) cy -= L0 * 0.06;
    }
    const [open, at] = pose(cx, cy, L0, dir, tilt);
    out += open + dolphinFigure(g, L0, body) + "</g>";
    const nose = at(0.52, 0.02);
    out += bubbles(g, nose[0] + dir * L0 * 0.04, nose[1], L0 * 0.05, Math.min(w, h) * 0.012);
    eye = at(0.33, -0.02);
    frame = boxAround(head.map(p => at(p[0], p[1])));
    note.alt(`${pair ? "Two dolphins swimming together" : "A dolphin swimming"} underwater, light falling from above`);
  }
  note.focus(eye[0], eye[1]);
  note.frame(...frame);
  return out;
});

const SHARKS = ["#7f8fa0", "#6d7f94", "#8c98a6", "#5d7389", "#7a8a8a"] as const;

/** A friendly shark cruising over the seabed in a side view, light rays falling from above. */
export const shark = defineKind("shark", "Shark", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([-1, 1]);
  const body = g.pick(SHARKS);
  const dark = mix(body, "#000000", 0.2);
  const belly = mix(body, "#ffffff", 0.75);
  let out = underwater(g, w, h);
  // Sandy seabed with a little seaweed.
  const gy = h * g.f(0.86, 0.9);
  for (let k = g.i(2, 4); k > 0; k--) {
    const x = w * g.f(0.03, 0.97);
    out += el("path", {
      d: s`M ${x} ${gy + 4}
           C ${x + g.f(-15, 15)} ${gy - h * 0.1} ${x + g.f(-15, 15)} ${gy - h * 0.18} ${x + g.f(-10, 10)} ${gy - h * g.f(0.15, 0.3)}`,
      stroke: hsl(g.f(100, 150), 40, g.f(28, 40)),
      "stroke-width": unit * g.f(0.02, 0.03),
      "stroke-linecap": "round",
      fill: "none",
    });
  }
  out += el("path", {
    d: s`M -5 ${gy} Q ${w * 0.5} ${gy - h * 0.025} ${w + 5} ${gy + h * 0.01} V ${h} H -5 Z`,
    fill: hsl(g.f(38, 48), 45, g.f(70, 78)),
  });
  const L = Math.min(w * 0.7, h * 1.6) * g.f(0.85, 1);
  const cx = w * g.f(0.46, 0.54);
  const cy = Math.min(h * g.f(0.45, 0.52), gy - L * 0.25);
  const tilt = g.f(-8, 8);
  // A little school of fish in the distance.
  const school = g.chance(0.5);
  if (school) {
    const fx = cx - dir * w * g.f(0.25, 0.35);
    const fy = h * g.f(0.15, 0.25);
    const fr = unit * 0.022;
    let fish = "";
    for (let k = 0; k < 5; k++) {
      const x = fx + dir * (k % 3) * fr * 3 + g.f(-1, 1) * fr;
      const y = fy + Math.floor(k / 2) * fr * 2.2 + g.f(-1, 1) * fr * 0.5;
      fish += el("ellipse", { cx: x, cy: y, rx: fr, ry: fr * 0.5 });
      fish += el("polygon", {
        points: pts([
          [x - dir * fr * 0.8, y],
          [x - dir * fr * 1.6, y - fr * 0.5],
          [x - dir * fr * 1.6, y + fr * 0.5],
        ]),
      });
    }
    out += el("g", { fill: hsl(g.f(30, 60), 70, 60), opacity: "0.75" }, fish);
  }
  // Its shadow on the sand.
  out += el("ellipse", { cx, cy: gy + h * 0.02, rx: L * 0.38, ry: unit * 0.025, fill: "#000", opacity: "0.1" });
  const [open, at] = pose(cx, cy, L, dir, tilt);
  const clip = g.id("shark");
  const bodyD = scaled(
    L,
    `M 0.5 0.01 C 0.49 -0.05 0.4 -0.1 0.22 -0.11 C 0.02 -0.12 -0.25 -0.06 -0.4 -0.02 L -0.4 0.02
     C -0.25 0.05 0.0 0.11 0.2 0.1 C 0.38 0.09 0.48 0.06 0.5 0.01 Z`,
  );
  out += open;
  // Tail, fins behind the body, then the body.
  out += el("path", {
    d: scaled(
      L,
      "M -0.37 -0.02 Q -0.45 -0.1 -0.56 -0.23 Q -0.54 -0.08 -0.5 0.0 Q -0.52 0.06 -0.55 0.13 Q -0.46 0.06 -0.37 0.02 Z",
    ),
    fill: body,
  });
  out += el("path", { d: scaled(L, "M 0.14 -0.1 Q 0.06 -0.2 -0.04 -0.27 Q -0.04 -0.16 -0.1 -0.09 Z"), fill: body });
  out += el("path", { d: scaled(L, "M -0.24 -0.05 L -0.3 -0.1 L -0.31 -0.03 Z"), fill: body });
  out += el("path", { d: scaled(L, "M -0.18 0.06 L -0.25 0.11 L -0.26 0.04 Z"), fill: dark });
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: bodyD })));
  out += el("path", { d: bodyD, fill: body });
  // Pale belly, clipped to the body.
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    el("path", { d: scaled(L, "M 0.52 0.02 C 0.3 0.05 0.0 0.04 -0.42 0.0 L -0.42 0.2 L 0.52 0.2 Z"), fill: belly }),
    el("ellipse", { cx: 0.12 * L, cy: -0.09 * L, rx: 0.25 * L, ry: 0.018 * L, fill: "#fff", opacity: "0.2" }),
  );
  // Gill slits, the near fin, eye and a slight smile.
  out += el("path", {
    d: scaled(
      L,
      "M 0.27 -0.04 Q 0.255 0.0 0.265 0.04 M 0.24 -0.045 Q 0.225 0.0 0.235 0.045 M 0.21 -0.05 Q 0.195 0.0 0.205 0.05",
    ),
    stroke: dark,
    "stroke-width": L * 0.007,
    "stroke-linecap": "round",
    fill: "none",
  });
  out += el("path", { d: scaled(L, "M 0.18 0.07 Q 0.12 0.17 0.0 0.22 Q 0.06 0.12 0.06 0.08 Z"), fill: dark });
  out += el("path", {
    d: scaled(L, "M 0.46 0.045 Q 0.41 0.075 0.35 0.06"),
    stroke: mix(body, "#000000", 0.5),
    "stroke-width": L * 0.008,
    "stroke-linecap": "round",
    fill: "none",
  });
  out += el("circle", { cx: 0.37 * L, cy: -0.03 * L, r: 0.022 * L, fill: "#1a1a22" });
  out += el("circle", { cx: 0.377 * L, cy: -0.037 * L, r: 0.007 * L, fill: "#fff" });
  out += el("circle", { cx: 0.38 * L, cy: 0.03 * L, r: 0.02 * L, fill: "#ff8a8a", opacity: "0.25" });
  out += "</g>";
  const nose = at(0.52, 0.0);
  out += bubbles(g, nose[0] + dir * L * 0.03, nose[1], L * 0.05, unit * 0.012);
  note.alt(
    `A friendly shark swimming over the seabed${school ? " past a school of small fish" : ""}, light rays above`,
  );
  const eye = at(0.37, -0.03);
  note.focus(eye[0], eye[1]);
  note.frame(
    ...boxAround(
      (
        [
          [0.16, -0.13],
          [0.54, -0.13],
          [0.54, 0.12],
          [0.16, 0.12],
        ] as const
      ).map(p => at(p[0], p[1])),
    ),
  );
  return out;
});

const SEALS = ["#8a8f96", "#7d746c", "#9aa3ab", "#666d76", "#a39a8e"] as const;

/** A seal lying on a rock or an ice floe by the sea, head raised, whiskers out. */
export const seal = defineKind("seal", "Seal", { perch: ["rock", "ice"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const perch = g.option("perch", g.pick(["rock", "ice"] as const));
  const ice = perch === "ice";
  const dir = g.pick([-1, 1]);
  const body = g.pick(SEALS);
  const dark = mix(body, "#000000", 0.25);
  const light = mix(body, "#ffffff", 0.35);
  const spotted = g.chance(0.5);
  const hz = h * g.f(0.4, 0.5);
  let out = sky(g, w, h, ice ? g.f(195, 215) : g.f(185, 215));
  if (ice && g.chance(0.6)) {
    // Far-off icebergs on the horizon.
    for (let k = g.i(1, 2); k > 0; k--) {
      const x = w * g.f(0.05, 0.95);
      const r = unit * g.f(0.06, 0.12);
      out += el("polygon", {
        points: pts([
          [x - r, hz + 1],
          [x - r * 0.4, hz - r * 0.5],
          [x, hz - r * 0.35],
          [x + r * 0.35, hz - r * 0.7],
          [x + r, hz + 1],
        ]),
        fill: "#eef6fb",
      });
    }
  }
  const sea = g.id("sea");
  const seaHue = g.f(190, 210);
  out +=
    el("defs", {}, lin(sea, [hsl(seaHue, 50, ice ? 45 : 50), hsl(seaHue + 10, 55, 30)])) +
    el("rect", { y: hz, width: w, height: h - hz, fill: `url(#${sea})` });
  const L = Math.min(w * 0.56, h * 1.1) * g.f(0.85, 1);
  const cx = w * g.f(0.46, 0.54);
  const top = h * g.f(0.7, 0.75);
  const half = L * 0.62;
  // The perch: the seal lies on its flat top.
  if (ice) {
    const depth = (h - top) * 0.35;
    const rim = L * 0.07;
    out += el("polygon", {
      points: pts([
        [cx - half - rim, top + rim * 0.4],
        [cx + half + rim * 1.2, top + rim * 0.6],
        [cx + half + rim, top + rim * 0.6 + depth],
        [cx - half - rim * 0.8, top + rim * 0.4 + depth],
      ]),
      fill: "#a9d4e6",
    });
    out += el("polygon", {
      points: pts([
        [cx - half - rim * 0.2, top - rim],
        [cx + half * 0.6, top - rim * 1.2],
        [cx + half + rim * 1.4, top - rim * 0.3],
        [cx + half + rim * 1.2, top + rim * 0.6],
        [cx - half - rim, top + rim * 0.4],
        [cx - half - rim * 1.3, top - rim * 0.2],
      ]),
      fill: "#f4fafd",
    });
  } else {
    const rock = hsl(g.f(200, 230), g.f(6, 12), g.f(38, 46));
    const r = L * 0.12;
    const base = top + Math.min((h - top) * 0.75, L * 0.32);
    // A boulder with a flat top, a smaller one leaning on it, and a lit upper edge.
    out += el("path", {
      d: s`M ${cx - half - r * 1.8} ${base}
           C ${cx - half - r * 1.9} ${top + r * 0.9} ${cx - half - r * 0.8} ${top} ${cx - half + r * 0.4} ${top}
           L ${cx + half - r * 0.3} ${top}
           C ${cx + half + r * 0.6} ${top - r * 0.1} ${cx + half + r * 1.5} ${top + r * 0.4} ${cx + half + r * 1.6} ${top + r}
           C ${cx + half + r * 2.3} ${top + r * 1.1} ${cx + half + r * 2.4} ${base - r} ${cx + half + r * 2.5} ${base} Z`,
      fill: rock,
    });
    const side = g.pick([-1, 1]);
    const bx = cx + side * (half + r * 1.2);
    out += el("ellipse", {
      cx: bx,
      cy: base - r * 0.3,
      rx: r * 1.5,
      ry: r * 1.1,
      fill: mix("#5a6470", "#000000", 0.15),
    });
    out += el("path", {
      d: s`M ${cx - half - r * 0.9} ${top + r * 0.35} Q ${cx - half - r * 0.6} ${top + r * 0.05} ${cx - half + r * 0.4} ${top + r * 0.05}
           L ${cx + half - r * 0.3} ${top + r * 0.05}`,
      stroke: "#fff",
      "stroke-width": r * 0.22,
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.15",
    });
    out += el("path", {
      d: s`M ${cx - half * 0.5} ${base - r * 0.2} q ${r * 0.3} ${-r * 0.7} ${r * 0.1} ${-r * 1.3}
           M ${cx + half * 0.45} ${base - r * 0.2} q ${-r * 0.2} ${-r * 0.5} ${r * 0.2} ${-r * 1}`,
      stroke: "#000",
      "stroke-width": r * 0.12,
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.15",
    });
    // Water lapping at the foot of the rock.
    out += el("rect", { y: base - r * 0.3, width: w, height: h, fill: hsl(seaHue + 5, 55, 36) });
    out += el("path", {
      d: s`M ${cx - half - r * 2.2} ${base - r * 0.3} Q ${cx - half - r} ${base - r * 0.7} ${cx - half} ${base - r * 0.3}
           M ${cx + half} ${base - r * 0.3} Q ${cx + half + r} ${base - r * 0.7} ${cx + half + r * 2.4} ${base - r * 0.3}`,
      stroke: "#fff",
      "stroke-width": "2.5",
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.7",
    });
  }
  // Shadow under the seal.
  out += el("ellipse", {
    cx: cx - dir * L * 0.08,
    cy: top,
    rx: L * 0.45,
    ry: L * 0.025,
    fill: "#000",
    opacity: "0.18",
  });
  // How high the head is held.
  const lift = Math.round(g.f(0, 0.08) * 1000) / 1000;
  const hx = 0.33;
  const hy = -0.36 - lift;
  const [open, at] = pose(cx - dir * L * 0.05, top, L, dir, 0);
  const clip = g.id("seal");
  const bodyD = scaled(
    L,
    `M 0.28 ${-0.22 - lift * 0.5} C 0.3 -0.05 0.2 0 0.05 0 L -0.3 0 C -0.42 0 -0.48 -0.03 -0.52 -0.06
     C -0.46 -0.12 -0.3 -0.2 -0.1 -0.24 C 0.05 -0.27 0.18 ${-0.33 - lift} 0.25 ${-0.4 - lift} Z`,
  );
  out += open;
  // Hind flippers, fanned at the tail.
  out += el("path", {
    d: scaled(
      L,
      "M -0.48 -0.05 Q -0.58 -0.14 -0.66 -0.16 Q -0.62 -0.1 -0.65 -0.06 Q -0.6 -0.06 -0.63 0.0 Q -0.56 -0.01 -0.47 -0.03 Z",
    ),
    fill: dark,
  });
  out += el(
    "defs",
    {},
    el("clipPath", { id: clip }, el("path", { d: bodyD }), el("circle", { cx: hx * L, cy: hy * L, r: 0.13 * L })),
  );
  out += el("path", { d: bodyD, fill: body });
  out += el("circle", { cx: hx * L, cy: hy * L, r: 0.13 * L, fill: body });
  // Paler underside and a sheen on the back, then spots, all clipped to body and head.
  let marks = el("ellipse", { cx: 0.0, cy: 0.02 * L, rx: 0.4 * L, ry: 0.07 * L, fill: light });
  marks += el("ellipse", { cx: -0.1 * L, cy: -0.23 * L, rx: 0.22 * L, ry: 0.02 * L, fill: "#fff", opacity: "0.2" });
  if (spotted) {
    let spots = "";
    for (let k = g.i(10, 16); k > 0; k--) {
      const x = g.f(-0.45, 0.35);
      const backY = x > 0.2 ? -0.3 : -0.24 + Math.abs(x + 0.1) * 0.25;
      spots += el("ellipse", {
        cx: x * L,
        cy: g.f(backY + 0.02, -0.07) * L,
        rx: g.f(0.008, 0.016) * L,
        ry: g.f(0.006, 0.012) * L,
      });
    }
    marks += el("g", { fill: dark, opacity: "0.55" }, spots);
  }
  out += el("g", { "clip-path": `url(#${clip})` }, marks);
  // Front flipper against the side.
  out += el("ellipse", {
    cx: 0.12 * L,
    cy: -0.05 * L,
    rx: 0.09 * L,
    ry: 0.03 * L,
    fill: dark,
    transform: s`rotate(25 ${0.12 * L} ${-0.05 * L})`,
  });
  // Muzzle, nose, eye and whiskers.
  out += el("ellipse", { cx: (hx + 0.1) * L, cy: (hy + 0.04) * L, rx: 0.075 * L, ry: 0.055 * L, fill: light });
  out += el("ellipse", { cx: (hx + 0.165) * L, cy: (hy + 0.01) * L, rx: 0.02 * L, ry: 0.015 * L, fill: "#2a2424" });
  out += el("path", {
    d: scaled(L, `M ${hx + 0.12} ${hy + 0.075} Q ${hx + 0.1} ${hy + 0.09} ${hx + 0.07} ${hy + 0.075}`),
    stroke: "#2a2424",
    "stroke-width": L * 0.007,
    "stroke-linecap": "round",
    fill: "none",
  });
  const sleepy = g.chance(0.2);
  const ex = (hx + 0.04) * L;
  const ey = (hy - 0.03) * L;
  if (sleepy)
    out += el("path", {
      d: s`M ${ex - L * 0.025} ${ey} Q ${ex} ${ey + L * 0.02} ${ex + L * 0.025} ${ey}`,
      stroke: "#1a1414",
      "stroke-width": L * 0.009,
      "stroke-linecap": "round",
      fill: "none",
    });
  else {
    out += el("circle", { cx: ex, cy: ey, r: L * 0.032, fill: "#1a1414" });
    out += el("circle", { cx: ex + L * 0.01, cy: ey - L * 0.01, r: L * 0.01, fill: "#fff" });
  }
  let whiskers = "";
  for (const [dy, ty] of [
    [0.03, -0.01],
    [0.045, 0.035],
    [0.06, 0.08],
  ])
    whiskers += scaled(L, `M ${hx + 0.13} ${hy + dy} L ${hx + 0.25} ${hy + ty} `);
  out += el("path", {
    d: whiskers,
    stroke: light,
    "stroke-width": L * 0.005,
    "stroke-linecap": "round",
    opacity: "0.9",
  });
  out += "</g>";
  note.alt(
    `A ${spotted ? "spotted harbor " : ""}seal ${sleepy ? "dozing" : "lying"} on ${ice ? "an ice floe" : "a rock"} by the sea`,
  );
  const eye = at(hx + 0.04, hy - 0.03);
  note.focus(eye[0], eye[1]);
  note.frame(
    ...boxAround(
      (
        [
          [hx - 0.15, hy - 0.15],
          [hx + 0.27, hy - 0.15],
          [hx + 0.27, hy + 0.14],
          [hx - 0.15, hy + 0.14],
        ] as const
      ).map(p => at(p[0], p[1])),
    ),
  );
  return out;
});
