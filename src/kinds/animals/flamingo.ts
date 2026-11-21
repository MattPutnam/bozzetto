import { defineKind, el, facing, hsl, lin, type Point, pts, s } from "../../draw/core";
import { atLeast } from "../../draw/shapes";
import { skyFade, turn, turnBox } from "./shared";

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

/** A filled neck along a cubic curve, tapering from width w0 to w1. */
function neck(p: readonly Point[], w0: number, w1: number, paint: string): string {
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
  return el("polygon", { points: pts([...left, ...right.reverse()]), fill: paint });
}

/** A flamingo standing in water at sy, facing right, its body B long from middle to end. */
function flamingoFigure(x: number, sy: number, B: number, pink: number, oneLeg: boolean, reach: number): string {
  const body = hsl(pink, 72, 74);
  const deep = hsl(pink - 4, 68, 66);
  const leg = hsl(pink, 50, 64);
  const legTop = sy - B * 2.4;
  const by = legTop - B * 0.3;
  // Legs, bending backward at the ankle, or one folded up under the body.
  let legs = s`M ${x + B * 0.08} ${legTop} L ${x + B * 0.14} ${sy - B * 1.15} L ${x + B * 0.08} ${sy}`;
  legs += oneLeg
    ? s`M ${x - B * 0.08} ${legTop} L ${x - B * 0.02} ${legTop + B * 0.95} L ${x - B * 0.55} ${legTop + B * 0.5}`
    : s`M ${x - B * 0.12} ${legTop} L ${x - B * 0.04} ${sy - B * 1.12} L ${x - B * 0.16} ${sy + B * 0.02}`;
  let out = el("path", {
    d: legs,
    stroke: leg,
    "stroke-width": B * 0.075,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  });
  // Dark flight feathers at the tail end, then the body and wing.
  out += el("ellipse", {
    cx: x - B * 0.82,
    cy: by + B * 0.1,
    rx: B * 0.38,
    ry: B * 0.17,
    fill: "#2b2730",
    transform: s`rotate(14 ${x - B * 0.82} ${by + B * 0.1})`,
  });
  out += el("ellipse", { cx: x, cy: by, rx: B, ry: B * 0.56, fill: body, transform: s`rotate(-6 ${x} ${by})` });
  out += el("ellipse", {
    cx: x - B * 0.2,
    cy: by - B * 0.06,
    rx: B * 0.72,
    ry: B * 0.36,
    fill: deep,
    transform: s`rotate(-4 ${x - B * 0.2} ${by - B * 0.06})`,
  });
  // The S-shaped neck and the head.
  const top: Point = [x + B * 0.6, by - B * 2.45 * reach];
  out += neck(
    [[x + B * 0.62, by - B * 0.2], [x + B * 1.4, by - B * 0.8 * reach], [x - B * 0.1, by - B * 1.55 * reach], top],
    B * 0.28,
    B * 0.17,
    body,
  );
  const [hx, hy] = [top[0] + B * 0.05, top[1]];
  out += el("ellipse", { cx: hx, cy: hy, rx: B * 0.25, ry: B * 0.2, fill: body });
  // Beak, bent down, black at the tip.
  out += el("path", {
    d: s`M ${hx + B * 0.12} ${hy - B * 0.15} Q ${hx + B * 0.5} ${hy - B * 0.17} ${hx + B * 0.6} ${hy + B * 0.05}
         L ${hx + B * 0.6} ${hy + B * 0.4} Q ${hx + B * 0.47} ${hy + B * 0.12} ${hx + B * 0.12} ${hy + B * 0.08} Z`,
    fill: "#2b2730",
  });
  out += el("path", {
    d: s`M ${hx + B * 0.12} ${hy - B * 0.15} Q ${hx + B * 0.4} ${hy - B * 0.17} ${hx + B * 0.49} ${hy - B * 0.08}
         L ${hx + B * 0.47} ${hy + B * 0.1} Q ${hx + B * 0.33} ${hy + B * 0.08} ${hx + B * 0.12} ${hy + B * 0.08} Z`,
    fill: "#f3e2dc",
  });
  out += el("circle", { cx: hx + B * 0.02, cy: hy - B * 0.05, r: B * 0.05, fill: "#f2d34e" });
  out += el("circle", { cx: hx + B * 0.02, cy: hy - B * 0.05, r: B * 0.028, fill: "#1a1a1e" });
  return out;
}

/** Where a flamingo's head is, for the figure above. */
const flamingoHead = (x: number, sy: number, B: number, reach: number): Point => [
  x + B * 0.65,
  sy - B * 2.7 - B * 2.45 * reach,
];

/** A flamingo wading in a shallow lagoon, sometimes on one leg, sometimes with others behind. */
export const flamingo = /* @__PURE__ */ defineKind(
  "flamingo",
  "Flamingo",
  { oneLeg: [true, false] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const dir = g.pick([1, -1]);
    const reach = g.f(0.88, 1.05);
    const sy = h * g.f(0.8, 0.86);
    // Feet to the top of the head is about 5.4 body lengths.
    const B = Math.min(unit * g.f(0.11, 0.13), (sy - h * 0.06) / (2.95 + 2.45 * reach + 0.2), w * 0.16);
    const cx = w * g.f(0.42, 0.55);
    const pink = g.f(345, 365);
    const oneLeg = g.option("oneLeg", g.chance(0.45));
    const hz = h * g.f(0.42, 0.5);
    const dawn = g.chance(0.45);
    const skyHue = dawn ? g.f(15, 35) : g.f(190, 210);
    let out = skyFade(
      g,
      w,
      h,
      hsl(skyHue + (dawn ? 200 : 0), dawn ? 35 : 50, dawn ? 72 : 72),
      hsl(skyHue, dawn ? 70 : 50, 88),
    );
    if (dawn)
      // A low sun.
      out += el("circle", {
        cx: w * g.pick([g.f(0.12, 0.3), g.f(0.7, 0.88)]),
        cy: hz - unit * g.f(0.04, 0.12),
        r: unit * 0.07,
        fill: hsl(40, 85, 90),
      });
    // A far shore with low trees, then the water.
    out += el("path", {
      d: s`M -5 ${hz} Q ${w * g.f(0.2, 0.8)} ${hz - unit * g.f(0.04, 0.1)} ${w + 5} ${hz} Z`,
      fill: hsl(g.f(95, 140), 25, 50),
    });
    const water = g.id("water");
    const waterHue = g.f(180, 200);
    out += el("defs", {}, lin(water, [hsl(waterHue, 40, 70), hsl(waterHue + 10, 45, 52)]));
    out += el("rect", { y: hz, width: w, height: h - hz, fill: `url(#${water})` });
    // Flamingos farther off, smaller and higher up the water.
    const others = g.chance(0.5) ? g.i(1, 3) : 0;
    let flock = 0;
    for (let k = 0; k < others; k++) {
      const fb = B * g.f(0.32, 0.45);
      const fsy = hz + (sy - hz) * g.f(0.2, 0.4);
      const fx = w * g.f(0.05, 0.95);
      if (Math.abs(fx - cx) < B * 2 || fsy - fb * 5.4 < h * 0.03) continue;
      flock++;
      const fd = g.pick([1, -1]);
      out += el("ellipse", { cx: fx, cy: fsy, rx: fb * 0.6, ry: fb * 0.08, fill: "#fff", opacity: "0.35" });
      out += facing(fx, fd) + flamingoFigure(fx, fsy, fb, pink + g.f(-6, 6), g.chance(0.4), g.f(0.85, 1.05)) + "</g>";
    }
    // The main bird drawn once and used twice: upright, and flipped as its reflection.
    const bird = g.id("bird");
    out += el(
      "defs",
      {},
      el("g", { id: bird }, facing(cx, dir) + flamingoFigure(cx, sy, B, pink, oneLeg, reach) + "</g>"),
    );
    out += el("use", { href: `#${bird}`, transform: s`matrix(1 0 0 -1 0 ${2 * sy})`, opacity: "0.25" });
    // Ripples where its feet stand, then the bird.
    out += el("path", {
      d: s`M ${cx - B * 0.75} ${sy + B * 0.02} q ${B * 0.75} ${B * 0.14} ${B * 1.5} 0
         M ${cx - B * 1.2} ${sy + B * 0.25} q ${B * 0.4} ${B * 0.08} ${B * 0.8} 0
         M ${cx + B * 0.5} ${sy + B * 0.32} q ${B * 0.4} ${B * 0.08} ${B * 0.8} 0`,
      stroke: "#fff",
      "stroke-width": Math.max(1, B * 0.05),
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.55",
    });
    out += el("use", { href: `#${bird}` });
    const pose = oneLeg ? "standing on one leg" : "wading";
    const crowd = flock ? ` with ${flock > 1 ? "others" : "another"} behind` : "";
    note.alt(`A flamingo ${pose} in a shallow lagoon${crowd}${dawn ? " at dawn" : ""}`);
    const [hx, hy] = flamingoHead(cx, sy, B, reach);
    note.focus(turn(cx, dir, hx), hy);
    // Head and the bent beak.
    // The head is small in the scene, so the frame grows about its center to a size an avatar can crop.
    const [fx, fy, fw, fh] = atLeast([hx - B * 0.45, hy - B * 0.4, B * 1.15, B * 0.95], Math.min(w, h) * 0.26);
    note.frame(turnBox(cx, dir, fx, fw), fy, fw, fh);
    return out;
  },
);
