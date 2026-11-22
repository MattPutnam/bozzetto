import { defineKind, el, hsl, mix, s } from "../../draw/core";
import {
  at,
  backdrop,
  countWord,
  hexHsl,
  layered,
  leaf,
  leafEl,
  type Part,
  petal,
  SETTING,
  stem,
  type View,
} from "./shared";

// Tulip colors: hue, saturation, lightness.
const TULIPS: readonly (readonly [number, number, number])[] = [
  [356, 80, 50],
  [350, 75, 46],
  [50, 90, 60],
  [335, 62, 70],
  [285, 40, 42],
  [22, 90, 57],
  [48, 30, 93],
  [320, 55, 50],
];

/**
 * Tulips seen from the side: a cup of six tepals on a long stem, with long leaves.
 *
 * @category Plants
 */
export const tulip = /* @__PURE__ */ defineKind("tulip", "Tulip", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "sky", "warm", "garden"] as const);
  let out = backdrop(g, w, h, look);
  const mixed = g.chance(0.3);
  const base = g.pick(TULIPS);
  const green = hexHsl(g.f(100, 140), g.f(25, 40), g.f(38, 48));
  const count = Math.min(4, g.i(1, 2) + (g.chance(0.3) ? 1 : 0) + Math.floor(Math.max(0, w / h - 1.2) * 1.1));
  const H = unit * g.f(0.36, 0.42);
  // Spread the tulips across the picture, the middle ones nearest.
  const flowers: { v: View; size: number; color: readonly [number, number, number] }[] = [];
  for (let k = 0; k < count; k++) {
    const t = count === 1 ? 0.5 : k / (count - 1);
    const middle = 1 - Math.abs(t - 0.5) * 2;
    const size = H * (count === 1 ? 1 : 0.78 + 0.22 * middle) * g.f(0.92, 1.05);
    flowers.push({
      v: {
        x: w / 2 + (t - 0.5) * Math.min(w - unit * 0.4, size * 1.5 * (count - 1)) + unit * g.f(-0.03, 0.03),
        y: Math.max(size * 1.1 + unit * 0.05, h * g.f(0.42, 0.55) + (1 - middle) * unit * g.f(-0.08, 0.08)),
        tilt: g.f(0.15, 0.35),
        roll: (t - 0.5) * g.f(0, 0.35) + g.f(-0.1, 0.1),
      },
      size,
      color: mixed && k % 2 ? g.pick(TULIPS) : base,
    });
  }
  flowers.sort((a, b) => a.size - b.size);
  for (const { v, size, color } of flowers) {
    const [hue, sat, light] = color;
    // Stem, and two long leaves wrapping its foot.
    const foot = v.x - Math.sin(v.roll) * unit * 0.3;
    out += stem(v.x, v.y, foot, h + unit * 0.05, unit * g.f(-0.04, 0.04), unit * 0.022, green);
    for (const side of [-1, 1]) {
      const len = Math.max(unit * 0.38, (h - v.y) * g.f(0.7, 0.95));
      const angle = -Math.PI / 2 + side * g.f(0.15, 0.45);
      out += leafEl(
        leaf(
          foot + side * unit * 0.01,
          h + unit * 0.04,
          angle,
          len,
          unit * g.f(0.065, 0.085),
          0.3,
          side * g.f(0.04, 0.12),
        ),
        mix(green, "#ffffff", side > 0 ? 0.08 : 0),
        unit * 0.004,
      );
    }
    // Six tepals, three outer and three inner, the far ones showing their shaded insides.
    const parts: (Part & { paint: string })[] = [];
    const turn = Math.PI / 2 + g.f(-0.3, 0.3);
    for (let k = 0; k < 6; k++) {
      const outer = k % 2 === 0;
      const part = petal(v, turn + (k * Math.PI) / 3, {
        from: size * 0.08,
        len: size * (outer ? 1 : 0.96),
        wid: size * (outer ? 0.95 : 0.85),
        lift: outer ? 1.22 : 1.32,
        cup: 0.2,
        bend: 0.1,
        belly: 0.14,
        tip: 0.45,
      });
      parts.push({ ...part, paint: hsl(hue, sat, light + (part.lean > 0 ? 4 : -10) + (outer ? 0 : -3)) });
    }
    out += layered(parts, "", unit);
    // A soft shine down the front tepal
    const [ax, ay] = at(v, Math.PI / 2, [size * 0.3, size * 0.2, 0]);
    const [bx, by] = at(v, Math.PI / 2, [size * 0.34, size * 0.75, 0]);
    out += el("path", {
      d: s`M${ax} ${ay}Q${(ax + bx) / 2 - size * 0.05} ${(ay + by) / 2} ${bx} ${by}`,
      stroke: "#ffffff",
      "stroke-width": size * 0.05,
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.25",
    });
  }
  note.alt(
    `${countWord(count, "tulip", "tulips")} on long stems with ${count === 1 ? "two long leaves" : "long leaves"} ${SETTING[look]}`,
  );
  const lead = flowers[flowers.length - 1];
  note.focus(lead.v.x, lead.v.y - lead.size * 0.5);
  return out;
});
