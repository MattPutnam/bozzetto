import { defineKind, el, hsl, pts, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { numberWord } from "../../draw/words";

/**
 * A bunch of balloons on strings, tied to a weight on the floor.
 *
 * @category Objects
 */
export const balloons = /* @__PURE__ */ defineKind("balloons", "Balloons", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.84, 0.9);
  const count = g.i(3, 7);
  const r = unit * g.f(0.095, 0.115);
  const ry = r * 1.18;
  const knot = r * 0.16;
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(25, 45), g.f(84, 92)), hsl(g.f(20, 40), g.f(20, 35), g.f(50, 64)));
  // The weight: a small gift box, or a round weight
  const px = w / 2 + w * g.f(-0.08, 0.08);
  const floorY = top + unit * 0.04;
  const box = g.chance(0.6);
  const size = unit * 0.07;
  const pivotY = floorY - (box ? size * 1.15 : size * 0.7);
  const hue = g.f(0, 360);
  const multi = g.chance(0.7);
  // Balloons fan out from the weight, alternating between two string lengths.
  const reachTop = pivotY - h * 0.05 - ry * 2 - knot;
  const amax = Math.min(
    0.55,
    0.16 * count,
    Math.asin(Math.min(1, (w * 0.47 - Math.abs(px - w / 2) - r * 1.2) / (reachTop + knot + ry * 2))),
  );
  type Balloon = { x: number; y: number; a: number; color: string };
  const items: Balloon[] = [];
  let strings = "";
  for (let k = 0; k < count; k++) {
    const t = count === 1 ? 0.5 : k / (count - 1);
    const a = (t - 0.5) * 2 * amax + g.f(-0.05, 0.05);
    const len = reachTop * (count > 3 && k % 2 ? g.f(0.66, 0.76) : g.f(0.9, 1));
    const kx = px + Math.sin(a) * len;
    const ky = pivotY - Math.cos(a) * len;
    const sway = g.f(-1, 1) * unit * 0.03;
    strings += s`M ${kx} ${ky} Q ${(kx + px) / 2 + sway} ${(ky + pivotY) / 2} ${px} ${pivotY} `;
    const color = multi
      ? hsl(hue + k * g.f(50, 80), g.f(55, 72), g.f(58, 66))
      : hsl(hue + g.f(-15, 15), g.f(55, 72), g.f(52, 68));
    items.push({ x: kx, y: ky, a, color });
  }
  out += el("path", {
    d: strings.trim(),
    stroke: "#6b6b6b",
    "stroke-width": unit * 0.004,
    fill: "none",
    opacity: "0.8",
  });
  // The weight, over the gathered string ends
  out += el("ellipse", { cx: px, cy: floorY, rx: size * 0.9, ry: unit * 0.015, fill: "#000", opacity: "0.12" });
  const weightColor = hsl(hue + 180, g.f(45, 65), g.f(50, 62));
  if (box) {
    out += el("rect", {
      x: px - size * 0.6,
      y: floorY - size,
      width: size * 1.2,
      height: size,
      rx: unit * 0.004,
      fill: weightColor,
    });
    out += el("rect", {
      x: px - size * 0.1,
      y: floorY - size,
      width: size * 0.2,
      height: size,
      fill: "#fff",
      opacity: "0.7",
    });
    out += el("path", {
      d: s`M ${px} ${floorY - size} q ${-size * 0.35} ${-size * 0.3} ${-size * 0.3} 0 M ${px} ${floorY - size} q ${size * 0.35} ${-size * 0.3} ${size * 0.3} 0`,
      stroke: "#fff",
      "stroke-width": size * 0.12,
      fill: "none",
      opacity: "0.85",
    });
  } else {
    out += el("path", {
      d: s`M ${px - size * 0.45} ${floorY} A ${size * 0.45} ${size * 0.7} 0 0 1 ${px + size * 0.45} ${floorY} Z`,
      fill: weightColor,
    });
  }
  // Balloons, the farther (higher) ones first, each tilted along its string
  items.sort((p, q) => p.y - q.y);
  for (const b of items) {
    const deg = (b.a * 180) / Math.PI;
    out += el(
      "g",
      { transform: s`translate(${b.x} ${b.y}) rotate(${deg})` },
      el("polygon", {
        points: pts([
          [0, -knot - 1],
          [-r * 0.13, 0],
          [r * 0.13, 0],
        ]),
        fill: b.color,
      }),
      el("ellipse", { cy: -knot - ry, rx: r, ry, fill: b.color }),
      el("ellipse", {
        cx: -r * 0.4,
        cy: -knot - ry * 1.4,
        rx: r * 0.18,
        ry: r * 0.3,
        fill: "#fff",
        opacity: "0.35",
        transform: s`rotate(30 ${-r * 0.4} ${-knot - ry * 1.4})`,
      }),
    );
  }
  const to = box ? "a gift box" : "a weight";
  note.alt(`A bunch of ${numberWord(count)} balloons tied to ${to}`);
  note.focus(items.reduce((sum, b) => sum + b.x, 0) / count, items.reduce((sum, b) => sum + b.y, 0) / count - ry);
  return out;
});
