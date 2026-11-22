import { defineKind, el, fill, hsl, lin, mix, type Point, pts, s } from "../../draw/core";

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

const OCTOPI = [
  { skin: "#e8735a", name: "red" },
  { skin: "#f08a9a", name: "pink" },
  { skin: "#9b6fd8", name: "purple" },
  { skin: "#f2a54a", name: "orange" },
  { skin: "#5aa0d8", name: "blue" },
] as const;

/**
 * An octopus sitting on the seabed, its arms curling over the sand.
 *
 * @category Animals
 */
export const octopus = /* @__PURE__ */ defineKind("octopus", "Octopus", (g, w, h, note) => {
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
  note.alt(`${sleepy ? "A sleepy" : "An"} octopus sitting on the sandy seabed`);
  note.focus(cx, my + ry * 0.15);
  // Head.
  note.frame(cx - rx * 1.1, my - ry * 1.08, rx * 2.2, ry * 1.85);
  return out;
});
