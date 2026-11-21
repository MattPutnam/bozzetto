import { defineKind, el, facing, mix, type Point, s } from "../../draw/core";
import { contact, studio } from "./shared";

/** Rough lightness of a `#rrggbb` color, 0 to 1. */
const luma = (hex: string): number =>
  (0.3 * parseInt(hex.slice(1, 3), 16) + 0.59 * parseInt(hex.slice(3, 5), 16) + 0.11 * parseInt(hex.slice(5, 7), 16)) /
  255;

interface ShoeColors {
  upper: string;
  shade: string;
  accent: string;
  sole: string;
  outsole: string;
  lace: string;
}

/** One sneaker in side view, heel at x0, toe pointing right, resting on y = base. */
function sneaker(x0: number, base: number, L: number, c: ShoeColors, high: boolean, clip: string): string {
  // Coordinates in shoe lengths: u forward from the heel, v up from the floor
  const X = (u: number) => x0 + L * u;
  const Y = (v: number) => base - L * v;
  const P = (u: number, v: number) => s`${X(u)} ${Y(v)}`;
  // The collar's back top, the ankle dip, the tongue top and the vamp where the lacing ends
  const back = high ? 0.54 : 0.34;
  const dip = high ? 0.5 : 0.28;
  const tongue: Point = high ? [0.4, 0.56] : [0.43, 0.37];
  const vamp: Point = high ? [0.68, 0.23] : [0.7, 0.2];
  const upperD = s`M ${P(0.02, 0.04)}
    C ${P(-0.01, 0.16)} ${P(-0.01, back - 0.08)} ${P(0.03, back - 0.02)}
    Q ${P(0.06, back + 0.01)} ${P(0.11, back)}
    Q ${P(0.22, dip - (high ? 0 : 0.03))} ${P(tongue[0] - 0.08, dip)}
    Q ${P(tongue[0] - 0.05, tongue[1] + 0.04)} ${P(tongue[0], tongue[1])}
    L ${P(vamp[0], vamp[1])}
    C ${P(0.83, 0.19)} ${P(0.96, 0.18)} ${P(0.995, 0.11)}
    C ${P(1.01, 0.07)} ${P(1, 0.04)} ${P(0.97, 0.04)} Z`;
  // A pull tab peeking up behind the heel
  let out = el("rect", {
    x: X(0.035),
    y: Y(back + 0.05),
    width: L * 0.05,
    height: L * 0.1,
    rx: L * 0.02,
    fill: c.accent,
  });
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: upperD })));
  let parts = el("path", { d: upperD, fill: c.upper });
  // The lining showing through the ankle opening, with a padded edge
  parts += el("path", {
    d: s`M ${P(0.07, back - 0.01)} Q ${P(0.22, dip - (high ? 0.01 : 0.04))} ${P(tongue[0] - 0.08, dip - 0.005)}
         Q ${P(0.22, dip - (high ? 0.05 : 0.06))} ${P(0.07, back - 0.01)} Z`,
    fill: mix(c.upper, "#000000", 0.45),
  });
  // Heel counter and a mudguard band along the bottom
  const hc = high ? 0.28 : 0.2;
  parts += el("path", {
    d: s`M ${P(-0.02, 0)} L ${P(-0.02, hc)} Q ${P(0.16, hc)} ${P(0.25, 0)} Z`,
    fill: c.accent,
  });
  parts += el("path", {
    d: s`M ${P(-0.02, 0.12)} Q ${P(0.5, 0.07)} ${P(1.03, 0.11)} L ${P(1.03, 0)} L ${P(-0.02, 0)} Z`,
    fill: c.shade,
  });
  if (high) parts += el("circle", { cx: X(0.2), cy: Y(0.38), r: L * 0.04, fill: c.accent });
  // Eyestay set just inside the instep edge, with the laces across it
  const du = vamp[0] - tongue[0];
  const dv = vamp[1] - tongue[1];
  const len = Math.hypot(du, dv);
  const nu = -Math.abs(dv) / len; // pointing down and back, into the shoe
  const nv = -Math.abs(du) / len;
  const at = (f: number, inset: number): Point => [tongue[0] + du * f + nu * inset, tongue[1] + dv * f + nv * inset];
  const e1 = at(0.06, 0.05);
  const e2 = at(0.9, 0.05);
  parts += el("path", {
    d: s`M ${P(e1[0], e1[1])} L ${P(e2[0], e2[1])}`,
    stroke: c.accent,
    "stroke-width": L * 0.06,
    "stroke-linecap": "round",
  });
  const count = high ? 6 : 4;
  let laces = "";
  for (let k = 0; k < count; k++) {
    const f = 0.12 + (0.72 * k) / (count - 1);
    const q1 = at(f - 0.03, 0.025);
    const q2 = at(f + 0.03, 0.075);
    laces += s`M ${P(q1[0], q1[1])} L ${P(q2[0], q2[1])} `;
  }
  parts += el("path", { d: laces.trim(), stroke: c.lace, "stroke-width": L * 0.016, "stroke-linecap": "round" });
  // A glint along the toe box
  parts += el("path", {
    d: s`M ${P(0.76, 0.18)} Q ${P(0.9, 0.175)} ${P(0.96, 0.13)}`,
    stroke: "#fff",
    "stroke-opacity": "0.35",
    "stroke-width": L * 0.014,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("g", { "clip-path": `url(#${clip})` }, parts);
  // Midsole and outsole
  const t = L * 0.08;
  out += el("rect", { x: X(0), y: base - t, width: L, height: t, rx: t * 0.45, fill: c.sole });
  out += el("rect", {
    x: X(0.01),
    y: base - t * 0.32,
    width: L * 0.98,
    height: t * 0.32,
    rx: t * 0.15,
    fill: c.outsole,
  });
  return out;
}

/** A sneaker in side view, or a pair of them, one just behind the other. */
export const sneakers = /* @__PURE__ */ defineKind("sneakers", "Sneakers", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const pair = g.chance(0.45);
  const high = g.chance(0.3);
  const dir = g.pick([1, -1]);
  const L = unit * (pair ? g.f(0.54, 0.58) : g.f(0.64, 0.7));
  const H = L * (high ? 0.6 : 0.42);
  const span = pair ? L * 1.2 : L;
  const lift = pair ? unit * 0.06 : 0;
  const floorY = h / 2 + (H + lift) / 2 + unit * 0.03;
  const cx = w / 2;
  let out = studio(g, w, h, floorY, cx, floorY - H / 2);
  const upper = g.pick([
    "#f4f3ef",
    "#f4f3ef",
    "#2b2b2b",
    "#8a9099",
    "#2f4a6d",
    "#b8433a",
    "#3c5e48",
    "#c9a27a",
    "#e8b4b8",
    "#d9a441",
    "#6b88b8",
  ]);
  const light = upper === "#f4f3ef" || upper === "#e8b4b8" || upper === "#c9a27a" || upper === "#d9a441";
  const accent = g.pick(
    light
      ? ["#2f4a6d", "#b8433a", "#2b2b2b", "#3c8a7a", "#d9dcdf", mix(upper, "#000000", 0.15)]
      : ["#f4f3ef", "#d9a441", "#e05a47", mix(upper, "#ffffff", 0.25), mix(upper, "#000000", 0.25)],
  );
  const sole = g.pick(["#f6f5f1", "#f6f5f1", "#f6f5f1", "#ece3cf", upper === "#2b2b2b" ? "#2b2b2b" : "#f6f5f1"]);
  const colors: ShoeColors = {
    upper,
    shade: mix(upper, "#000000", 0.12),
    accent,
    sole,
    outsole: g.pick([mix(sole, "#000000", 0.25), "#b07a45", "#3a3a3a"]),
    // Laces that stand out against the eyestay they cross
    lace: luma(accent) > 0.55 ? (light ? "#2b2b2b" : mix(upper, "#000000", 0.35)) : "#f6f5f1",
  };
  const x0 = cx - span / 2;
  out += facing(cx, dir);
  if (pair) {
    // The far shoe sits a little back and up, a touch darker
    const back: ShoeColors = {
      upper: mix(colors.upper, "#000000", 0.1),
      shade: mix(colors.shade, "#000000", 0.1),
      accent: mix(colors.accent, "#000000", 0.1),
      sole: mix(colors.sole, "#000000", 0.08),
      outsole: mix(colors.outsole, "#000000", 0.1),
      lace: mix(colors.lace, "#000000", 0.1),
    };
    out += contact(x0 + L * 0.2 + L / 2, floorY - lift, L * 0.52, unit * 0.022, 0.14);
    out += sneaker(x0 + L * 0.2, floorY - lift, L, back, high, g.id("far-shoe"));
  }
  out += contact(x0 + L / 2, floorY, L * 0.55, unit * 0.028);
  out += sneaker(x0, floorY, L, colors, high, g.id("shoe"));
  out += "</g>";
  const what = high ? "high-top sneaker" : "low-top sneaker";
  note.alt(pair ? `A pair of ${what}s on a studio backdrop` : `A single ${what} in side view on a studio backdrop`);
  note.focus(cx, floorY - H * 0.55);
  return out;
});
