import { defineKind, el, facing, hsl, lin, type Point, s } from "../../draw/core";
import { numberWord } from "../../draw/words";
import { sky, turn, turnBox } from "./shared";

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

/**
 * A duck on a pond, sometimes leading a line of ducklings.
 *
 * @category Animals
 */
export const duck = /* @__PURE__ */ defineKind("duck", "Duck", (g, w, h, note) => {
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
