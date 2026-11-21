import { defineKind, el, facing, fill, hsl, mix, pts, s, type Point, type Rand } from "./core";
import { numberWord } from "./words";

/**
 * Product shots: one item, centered and large, on a seamless studio backdrop.
 */

/**
 * The studio backdrop: a soft sweep from wall to floor in one muted hue, or a flat wall with a
 * round spotlight glow behind the item at (cx, cy).
 */
function studio(g: Rand, w: number, h: number, floorY: number, cx: number, cy: number): string {
  const hue = g.f(0, 360);
  const sat = g.f(12, 32);
  const light = g.f(80, 88);
  const wall = hsl(hue, sat, light);
  if (g.chance(0.35)) {
    const id = g.id("spot");
    const r = Math.max(w, h) * g.f(0.4, 0.55);
    return (
      el(
        "defs",
        {},
        el(
          "radialGradient",
          { id },
          el("stop", { offset: 0, "stop-color": "#ffffff", "stop-opacity": g.f(0.35, 0.55) }),
          el("stop", { offset: 1, "stop-color": "#ffffff", "stop-opacity": 0 }),
        ),
      ) +
      fill(w, h, wall) +
      el("ellipse", { cx, cy, rx: r, ry: r * 0.9, fill: `url(#${id})` })
    );
  }
  const id = g.id("sweep");
  const floor = hsl(hue, sat, light + g.pick([-7, -5, 5, 7]));
  const bend = floorY / h;
  return (
    el(
      "defs",
      {},
      el(
        "linearGradient",
        { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        el("stop", { offset: 0, "stop-color": hsl(hue, sat, light + 3) }),
        el("stop", { offset: Math.max(0.1, bend - 0.3), "stop-color": wall }),
        el("stop", { offset: Math.min(0.98, bend + 0.06), "stop-color": floor }),
        el("stop", { offset: 1, "stop-color": floor }),
      ),
    ) + fill(w, h, `url(#${id})`)
  );
}

/** The soft contact shadow under an item. */
const contact = (cx: number, y: number, rx: number, ry: number, opacity = 0.18): string =>
  el("ellipse", { cx, cy: y, rx, ry, fill: "#000", opacity: String(opacity) });

const MINUTES = ["", "five", "ten", "quarter", "twenty", "twenty-five"];

/** A time in words, such as "ten past four" or "quarter to nine". */
function timeWords(hour: number, minute: number): string {
  if (minute === 0) return `${numberWord(hour)} o'clock`;
  if (minute === 30) return `half past ${numberWord(hour)}`;
  return minute < 30
    ? `${MINUTES[minute / 5]} past ${numberWord(hour)}`
    : `${MINUTES[(60 - minute) / 5]} to ${numberWord((hour % 12) + 1)}`;
}

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
export const sneakers = defineKind("sneakers", "Sneakers", (g, w, h, note) => {
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

/** An analog wristwatch standing face-on, its strap looping back behind it. */
export const watch = defineKind("watch", "Wristwatch", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const total = unit * g.f(0.62, 0.68);
  const cx = w / 2;
  const floorY = h / 2 + total / 2;
  const cy = floorY - total / 2;
  const topY = floorY - total;
  const square = g.chance(0.25);
  const r = unit * (square ? g.f(0.13, 0.145) : g.f(0.15, 0.17));
  let out = studio(g, w, h, floorY, cx, cy);
  const metal = g.pick(["#d9dcdf", "#d9dcdf", "#d4b06a", "#d9a38a", "#3a3a3a"]);
  const metalShade = mix(metal, "#000000", 0.22);
  const dial = g.pick(["#f7f5ef", "#f7f5ef", "#efe6d2", "#23262b", "#24324f", "#2f5a48", "#e9b9a0", "#cfd6dc"]);
  const darkDial = dial === "#23262b" || dial === "#24324f" || dial === "#2f5a48";
  const ink = darkDial ? "#f4f1ea" : "#2b2b2b";
  const bracelet = g.chance(0.25);
  const strap = bracelet
    ? metal
    : g.pick(["#5b3a29", "#8a5a3b", "#b07a4f", "#2b2b2b", "#2f3e5c", "#5e6b4a", "#a8433a", "#d8c7a8"]);
  const strapShade = mix(strap, "#000000", 0.22);
  const sw = r * (square ? 1.25 : 1.1);
  const tip = sw * 0.86;
  // Strap: upper and lower bands, narrowing toward where they curl back
  const band = (y1: number, y2: number) =>
    el("polygon", {
      points: pts([
        [cx - sw / 2, y1],
        [cx + sw / 2, y1],
        [cx + tip / 2, y2],
        [cx - tip / 2, y2],
      ]),
      fill: strap,
    });
  out += contact(cx, floorY, sw * 1.2, unit * 0.022);
  out += band(cy, topY + sw * 0.08);
  out += band(cy, floorY - sw * 0.08);
  // Where each band curls away, its underside shows as a darker lip
  out += el("ellipse", { cx, cy: topY + sw * 0.08, rx: tip / 2, ry: sw * 0.1, fill: strapShade });
  out += el("ellipse", { cx, cy: floorY - sw * 0.08, rx: tip / 2, ry: sw * 0.08, fill: strap });
  // Shade down the right edge of the strap
  out += el("polygon", {
    points: pts([
      [cx + sw * 0.36, cy],
      [cx + sw / 2, cy],
      [cx + tip / 2, floorY - sw * 0.08],
      [cx + tip * 0.36, floorY - sw * 0.08],
    ]),
    fill: "#000",
    opacity: "0.1",
  });
  out += el("polygon", {
    points: pts([
      [cx + sw * 0.36, cy],
      [cx + sw / 2, cy],
      [cx + tip / 2, topY + sw * 0.08],
      [cx + tip * 0.36, topY + sw * 0.08],
    ]),
    fill: "#000",
    opacity: "0.1",
  });
  if (bracelet) {
    // Links across both bands
    let links = "";
    for (let y = topY + sw * 0.3; y < floorY - sw * 0.2; y += sw * 0.3) {
      if (Math.abs(y - cy) < r * 1.05) continue;
      links += s`M ${cx - sw * 0.46} ${y} L ${cx + sw * 0.46} ${y} `;
    }
    out += el("path", { d: links.trim(), stroke: metalShade, "stroke-width": unit * 0.006 });
    out += el("path", {
      d: s`M ${cx - sw * 0.17} ${topY + sw * 0.12} L ${cx - sw * 0.17} ${floorY - sw * 0.12} M ${cx + sw * 0.17} ${topY + sw * 0.12} L ${cx + sw * 0.17} ${floorY - sw * 0.12}`,
      stroke: metalShade,
      "stroke-width": unit * 0.005,
    });
  } else {
    // Stitching along the edges, and the holes in the lower band
    const st = sw * 0.38;
    out += el("path", {
      d: s`M ${cx - st} ${topY + sw * 0.25} L ${cx - st} ${floorY - sw * 0.25} M ${cx + st} ${topY + sw * 0.25} L ${cx + st} ${floorY - sw * 0.25}`,
      stroke: mix(strap, "#ffffff", 0.35),
      "stroke-width": unit * 0.004,
      "stroke-dasharray": s`${unit * 0.012} ${unit * 0.008}`,
    });
    for (let k = 0; k < 3; k++) {
      const hy = cy + r * 1.35 + k * sw * 0.32;
      if (hy < floorY - sw * 0.3) out += el("circle", { cx, cy: hy, r: sw * 0.055, fill: strapShade });
    }
  }
  // Lugs and crown, then the case
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      out += el("rect", {
        x: cx + sx * sw * 0.42 - sw * 0.08,
        y: cy + sy * r * 0.95 - (sy < 0 ? r * 0.25 : 0),
        width: sw * 0.16,
        height: r * 0.25,
        rx: sw * 0.04,
        fill: metal,
      });
  out += el("rect", {
    x: cx + r * 0.92,
    y: cy - r * 0.11,
    width: r * 0.17,
    height: r * 0.22,
    rx: r * 0.04,
    fill: metalShade,
  });
  let faceR: number;
  if (square) {
    out += el("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: r * 0.3, fill: metalShade });
    out += el("rect", { x: cx - r, y: cy - r, width: r * 1.94, height: r * 1.94, rx: r * 0.3, fill: metal });
    out += el("rect", { x: cx - r * 0.8, y: cy - r * 0.8, width: r * 1.6, height: r * 1.6, rx: r * 0.18, fill: dial });
    faceR = r * 0.8;
  } else {
    out += el("circle", { cx, cy, r, fill: metalShade });
    out += el("circle", { cx: cx - r * 0.03, cy: cy - r * 0.03, r: r * 0.96, fill: metal });
    out += el("circle", { cx, cy, r: r * 0.84, fill: dial });
    faceR = r * 0.84;
  }
  // Hour markers, bolder at twelve, three, six and nine
  let major = "";
  let minor = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const inner = k % 3 ? faceR * 0.8 : faceR * 0.68;
    const seg = s`M ${cx + Math.sin(a) * inner} ${cy - Math.cos(a) * inner} L ${cx + Math.sin(a) * faceR * 0.9} ${cy - Math.cos(a) * faceR * 0.9} `;
    if (k % 3) minor += seg;
    else major += seg;
  }
  out += el("path", { d: major.trim(), stroke: ink, "stroke-width": faceR * 0.07 });
  out += el("path", { d: minor.trim(), stroke: ink, "stroke-width": faceR * 0.035 });
  const hour = g.i(1, 12);
  const minute = g.i(0, 11) * 5;
  const hand = (turns: number, len: number, width: number, color: string) => {
    const a = turns * Math.PI * 2;
    return el("path", {
      d: s`M ${cx - Math.sin(a) * len * 0.15} ${cy + Math.cos(a) * len * 0.15} L ${cx + Math.sin(a) * len} ${cy - Math.cos(a) * len}`,
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
    });
  };
  const handColor = darkDial ? "#f4f1ea" : metal === "#d9dcdf" || metal === "#3a3a3a" ? "#2b2b2b" : metalShade;
  out += hand(((hour % 12) + minute / 60) / 12, faceR * 0.5, faceR * 0.08, handColor);
  out += hand(minute / 60, faceR * 0.76, faceR * 0.055, handColor);
  if (g.chance(0.65)) out += hand(g.i(0, 59) / 60, faceR * 0.82, faceR * 0.02, g.pick(["#d63c2f", "#e08a2e", ink]));
  out += el("circle", { cx, cy, r: faceR * 0.06, fill: handColor });
  // A soft glint across the crystal
  out += el("path", {
    d: s`M ${cx - faceR * 0.75} ${cy - faceR * 0.1} Q ${cx - faceR * 0.7} ${cy - faceR * 0.7} ${cx - faceR * 0.1} ${cy - faceR * 0.78}`,
    stroke: "#fff",
    "stroke-opacity": "0.3",
    "stroke-width": faceR * 0.07,
    fill: "none",
    "stroke-linecap": "round",
  });
  const caseWord = square ? "A square-cased" : "A round";
  note.alt(
    `${caseWord} analog wristwatch with a ${bracelet ? "metal bracelet" : "leather strap"} reading ${timeWords(hour, minute)}`,
  );
  note.focus(cx, cy);
  return out;
});

/** A backpack seen from the front, with a zip pocket and its straps showing at the sides. */
export const backpack = defineKind("backpack", "Backpack", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const style = g.pick(["daypack", "daypack", "rucksack"]);
  const BW = unit * g.f(0.42, 0.47);
  const BH = unit * g.f(0.56, 0.62);
  const cx = w / 2;
  const floorY = h / 2 + BH / 2 + unit * 0.03;
  const top = floorY - BH;
  const x0 = cx - BW / 2;
  let out = studio(g, w, h, floorY, cx, floorY - BH / 2);
  const body = g.pick([
    "#2f4a6d",
    "#2b2b2b",
    "#b8433a",
    "#6b7044",
    "#d9a441",
    "#8a8f96",
    "#2f7c7a",
    "#e8a7a8",
    "#c9b48e",
    "#3c5e48",
    "#5a4a7a",
  ]);
  const shade = mix(body, "#000000", 0.25);
  const trim = g.pick([shade, shade, "#2b2b2b", "#a8754a", mix(body, "#ffffff", 0.3)]);
  const zip = mix(body, "#000000", 0.45);
  const metal = g.pick(["#cfd3d6", "#2b2b2b"]);
  const clip = g.id("pack");
  // Shoulder straps peeking out behind the sides, and the grab handle on top
  out += contact(cx, floorY, BW * 0.62, unit * 0.03);
  out += el("path", {
    d: s`M ${cx - BW * 0.4} ${top + BH * 0.2} C ${cx - BW * 0.56} ${top + BH * 0.4} ${cx - BW * 0.56} ${floorY - BH * 0.3} ${cx - BW * 0.46} ${floorY - BH * 0.1}
         M ${cx + BW * 0.4} ${top + BH * 0.2} C ${cx + BW * 0.56} ${top + BH * 0.4} ${cx + BW * 0.56} ${floorY - BH * 0.3} ${cx + BW * 0.46} ${floorY - BH * 0.1}`,
    stroke: mix(trim === shade ? body : trim, "#000000", 0.35),
    "stroke-width": BW * 0.07,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("path", {
    d: s`M ${cx - BW * 0.1} ${top + BH * 0.03} Q ${cx} ${top - BH * 0.12} ${cx + BW * 0.1} ${top + BH * 0.03}`,
    stroke: trim,
    "stroke-width": BW * 0.035,
    fill: "none",
    "stroke-linecap": "round",
  });
  // The body, rounded on top
  const R = style === "daypack" ? BW * 0.42 : BW * 0.2;
  const c = BW * 0.08;
  const bodyD = s`M ${x0} ${floorY - c} L ${x0} ${top + R} Q ${x0} ${top} ${x0 + R} ${top} L ${x0 + BW - R} ${top}
                  Q ${x0 + BW} ${top} ${x0 + BW} ${top + R} L ${x0 + BW} ${floorY - c}
                  Q ${x0 + BW} ${floorY} ${x0 + BW - c} ${floorY} L ${x0 + c} ${floorY} Q ${x0} ${floorY} ${x0} ${floorY - c} Z`;
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: bodyD })));
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    el("rect", { x: x0, y: top, width: BW, height: BH, fill: body }),
    // A sturdier base panel, the shade down the right side and a highlight on the left
    el("rect", { x: x0, y: floorY - BH * 0.09, width: BW, height: BH * 0.09, fill: trim }),
    el("rect", { x: x0 + BW * 0.84, y: top, width: BW * 0.16, height: BH, fill: "#000", opacity: "0.12" }),
    el("rect", { x: x0 + BW * 0.05, y: top, width: BW * 0.06, height: BH, fill: "#fff", opacity: "0.12" }),
  );
  const pull = (x: number, y: number) =>
    el("rect", { x: x - BW * 0.018, y, width: BW * 0.036, height: BH * 0.07, rx: BW * 0.015, fill: metal });
  if (style === "daypack") {
    // Main zip round the top
    const i = BW * 0.09;
    const Ri = R - i * 0.6;
    out += el("path", {
      d: s`M ${x0 + i} ${top + BH * 0.5} L ${x0 + i} ${top + i + Ri} Q ${x0 + i} ${top + i} ${x0 + i + Ri} ${top + i}
           L ${x0 + BW - i - Ri} ${top + i} Q ${x0 + BW - i} ${top + i} ${x0 + BW - i} ${top + i + Ri} L ${x0 + BW - i} ${top + BH * 0.5}`,
      stroke: zip,
      "stroke-width": unit * 0.009,
      fill: "none",
    });
    out += pull(x0 + BW - i - Ri * 0.6, top + i + unit * 0.004);
  } else {
    // A flap over the top, buckled down with two straps
    const fb = top + BH * 0.4;
    out += el("path", {
      d: s`M ${x0 - BW * 0.01} ${top + R} Q ${x0 - BW * 0.01} ${top - BH * 0.01} ${x0 + R} ${top - BH * 0.01}
           L ${x0 + BW - R} ${top - BH * 0.01} Q ${x0 + BW + BW * 0.01} ${top - BH * 0.01} ${x0 + BW + BW * 0.01} ${top + R}
           L ${x0 + BW + BW * 0.01} ${fb - BW * 0.1} Q ${x0 + BW + BW * 0.01} ${fb} ${x0 + BW * 0.9} ${fb}
           L ${x0 + BW * 0.1} ${fb} Q ${x0 - BW * 0.01} ${fb} ${x0 - BW * 0.01} ${fb - BW * 0.1} Z`,
      fill: trim === shade ? mix(body, "#000000", 0.12) : trim,
    });
    for (const sx of [-1, 1]) {
      const bx = cx + sx * BW * 0.24;
      out += el("rect", {
        x: bx - BW * 0.04,
        y: fb - BH * 0.14,
        width: BW * 0.08,
        height: BH * 0.26,
        rx: BW * 0.015,
        fill: shade,
      });
      out += el("rect", {
        x: bx - BW * 0.055,
        y: fb - BH * 0.02,
        width: BW * 0.11,
        height: BH * 0.06,
        rx: BW * 0.012,
        fill: metal,
      });
    }
  }
  // Front zip pocket
  const pw = BW * (style === "daypack" ? 0.72 : 0.66);
  const ph = BH * (style === "daypack" ? 0.36 : 0.26);
  const py = floorY - BH * 0.13 - ph;
  const pocket = g.pick([mix(body, "#000000", 0.1), mix(body, "#ffffff", 0.15), trim]);
  out += el("rect", { x: cx - pw / 2, y: py, width: pw, height: ph, rx: BW * 0.08, fill: pocket });
  out += el("rect", {
    x: cx - pw / 2,
    y: py + ph * 0.7,
    width: pw,
    height: ph * 0.3,
    rx: BW * 0.06,
    fill: "#000",
    opacity: "0.08",
  });
  out += el("path", {
    d: s`M ${cx - pw * 0.4} ${py + ph * 0.18} L ${cx + pw * 0.4} ${py + ph * 0.18}`,
    stroke: zip,
    "stroke-width": unit * 0.009,
    "stroke-linecap": "round",
  });
  out += pull(cx + pw * 0.28, py + ph * 0.18);
  note.alt(
    style === "daypack"
      ? "A backpack with a zip front pocket, standing on a studio floor"
      : "A rucksack with a buckled flap and a zip pocket, standing on a studio floor",
  );
  note.focus(cx, top + BH * 0.45);
  return out;
});

/** A pair of folded sunglasses standing face-on, in aviator, round or wayfarer style. */
export const sunglasses = defineKind("sunglasses", "Sunglasses", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const style = g.pick(["aviator", "round", "wayfarer"]);
  const W = unit * g.f(0.66, 0.72);
  const cx = w / 2;
  const gap = W * (style === "round" ? 0.11 : 0.09);
  const a = (W - gap) / 4; // half-width of one lens
  const b = style === "round" ? a : style === "aviator" ? a * 0.84 : a * 0.7;
  const floorY = h / 2 + b + unit * 0.06;
  const ly = floorY - b * (style === "aviator" ? 1.08 : 1.04);
  const lx = cx - gap / 2 - a; // the left lens center
  let out = studio(g, w, h, floorY, cx, ly);
  const metalFrame = style !== "wayfarer";
  const frame = metalFrame
    ? g.pick(["#d4b06a", "#cfd3d6", "#2b2b2b", "#b98a72"])
    : g.pick(["#2b2b2b", "#2b2b2b", "#5a3a2a", "#8a5a3b", "#2f3e5c", "#7a2e3a", "#c9b9a0", "#3c5e48"]);
  const tint = g.pick([
    ["#2b2f33", "#5a6066"],
    ["#3d2b22", "#8a6a4a"],
    ["#2f4033", "#5f7a5a"],
    ["#22385a", "#6fa3c8"],
    ["#5a3040", "#d08a9a"],
    ["#4a3a1e", "#c9a050"],
  ]);
  const lensId = g.id("lens");
  // One lens outline, centered on (x, y), the outer side to the left
  const lens = (x: number, y: number): string => {
    if (style === "round") return s`M ${x - a} ${y} A ${a} ${a} 0 1 1 ${x + a} ${y} A ${a} ${a} 0 1 1 ${x - a} ${y} Z`;
    if (style === "aviator")
      return s`M ${x - a * 0.95} ${y - b * 0.7}
               C ${x - a * 0.6} ${y - b * 1.02} ${x + a * 0.55} ${y - b * 1.02} ${x + a * 0.95} ${y - b * 0.78}
               C ${x + a * 1.08} ${y - b * 0.35} ${x + a * 0.75} ${y + b * 0.75} ${x + a * 0.05} ${y + b}
               C ${x - a * 0.55} ${y + b * 1.12} ${x - a * 1.08} ${y + b * 0.4} ${x - a * 0.95} ${y - b * 0.7} Z`;
    return s`M ${x - a * 1.02} ${y - b * 1.02}
             Q ${x} ${y - b * 0.9} ${x + a * 0.98} ${y - b * 0.88}
             C ${x + a * 1.02} ${y + b * 0.1} ${x + a * 0.8} ${y + b * 0.95} ${x + a * 0.2} ${y + b}
             C ${x - a * 0.4} ${y + b * 1.02} ${x - a * 0.9} ${y + b * 0.8} ${x - a * 0.95} ${y + b * 0.1}
             Z`;
  };
  const lensD = lens(lx, ly);
  out += el(
    "defs",
    {},
    el(
      "linearGradient",
      { id: lensId, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": tint[0] }),
      el("stop", { offset: 1, "stop-color": tint[1] }),
    ),
  );
  out += contact(cx, floorY, W * 0.5, unit * 0.022);
  // The folded temples, crossing behind the lenses
  const hingeY = ly - b * (style === "wayfarer" ? 0.7 : 0.55);
  out += el("path", {
    d: s`M ${cx - W / 2 + a * 0.05} ${hingeY} L ${cx + W * 0.3} ${hingeY + b * 0.22} M ${cx + W / 2 - a * 0.05} ${hingeY} L ${cx - W * 0.3} ${hingeY + b * 0.3}`,
    stroke: mix(frame, "#000000", 0.15),
    "stroke-width": metalFrame ? unit * 0.012 : unit * 0.022,
    "stroke-linecap": "round",
  });
  const fw = metalFrame ? unit * 0.012 : unit * 0.05;
  const one = (d: string) =>
    el("path", { d, fill: "none", stroke: frame, "stroke-width": fw, "stroke-linejoin": "round" }) +
    el("path", { d, fill: `url(#${lensId})`, "fill-opacity": "0.9" }) +
    // A streak of light across the lens
    el("path", {
      d: s`M ${lx - a * 0.55} ${ly + b * 0.15} L ${lx - a * 0.05} ${ly - b * 0.55}`,
      stroke: "#fff",
      "stroke-opacity": "0.3",
      "stroke-width": a * 0.16,
      "stroke-linecap": "round",
    });
  // Bridge between the lenses
  if (style === "aviator") {
    out += el("path", {
      d: s`M ${cx - gap / 2 - a * 0.1} ${ly - b * 0.9} L ${cx + gap / 2 + a * 0.1} ${ly - b * 0.9}
           M ${cx - gap / 2 - a * 0.02} ${ly - b * 0.55} Q ${cx} ${ly - b * 0.75} ${cx + gap / 2 + a * 0.02} ${ly - b * 0.55}`,
      stroke: frame,
      "stroke-width": unit * 0.011,
      fill: "none",
    });
  } else if (style === "round") {
    out += el("path", {
      d: s`M ${cx - gap / 2 - a * 0.02} ${ly - b * 0.35} Q ${cx} ${ly - b * 0.62} ${cx + gap / 2 + a * 0.02} ${ly - b * 0.35}`,
      stroke: frame,
      "stroke-width": unit * 0.013,
      fill: "none",
    });
  } else {
    out += el("path", {
      d: s`M ${cx - gap / 2 - a * 0.1} ${ly - b * 0.72} Q ${cx} ${ly - b * 0.95} ${cx + gap / 2 + a * 0.1} ${ly - b * 0.72}`,
      stroke: frame,
      "stroke-width": unit * 0.045,
      fill: "none",
    });
  }
  out += one(lensD);
  out += facing(cx, -1) + one(lensD) + "</g>";
  if (metalFrame) {
    // Nose pads and hinge studs
    for (const sx of [-1, 1]) {
      out += el("ellipse", {
        cx: cx + sx * gap * 0.62,
        cy: ly - b * 0.05,
        rx: unit * 0.008,
        ry: unit * 0.016,
        fill: "#e8ecee",
        opacity: "0.8",
      });
      out += el("circle", { cx: cx + sx * (W / 2 - a * 0.05), cy: hingeY, r: unit * 0.011, fill: frame });
    }
  } else {
    // Two little rivets at the corners, and a highlight along the top of the frame
    for (const sx of [-1, 1]) {
      out += el("circle", { cx: cx + sx * (W / 2 - a * 0.2), cy: ly - b * 0.78, r: unit * 0.008, fill: "#d9dcdf" });
    }
    out += el("path", {
      d: s`M ${lx - a * 0.8} ${ly - b * 1.08} Q ${lx} ${ly - b * 1.0} ${lx + a * 0.7} ${ly - b * 0.98}`,
      stroke: "#fff",
      "stroke-opacity": "0.25",
      "stroke-width": unit * 0.008,
      fill: "none",
      "stroke-linecap": "round",
    });
  }
  const name =
    style === "aviator"
      ? "Aviator sunglasses"
      : style === "round"
        ? "Round sunglasses"
        : "Thick-framed wayfarer-style sunglasses";
  note.alt(`${name}, folded and standing on a studio floor`);
  note.focus(cx, ly);
  return out;
});

/** A leather handbag: a tote with long handles, or a structured top-handle bag with a flap. */
export const handbag = defineKind("handbag", "Handbag", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const style = g.pick(["tote", "top-handle"]);
  const tote = style === "tote";
  const bh = unit * (tote ? g.f(0.36, 0.4) : g.f(0.32, 0.36));
  const top = tote ? unit * g.f(0.5, 0.56) : unit * g.f(0.38, 0.42);
  const bottom = tote ? top * g.f(0.78, 0.84) : unit * g.f(0.5, 0.55);
  const handleH = unit * (tote ? g.f(0.2, 0.24) : g.f(0.15, 0.18));
  const cx = w / 2;
  const floorY = h / 2 + (bh + handleH) / 2;
  const y0 = floorY - bh;
  let out = studio(g, w, h, floorY, cx, floorY - (bh + handleH) / 2);
  const leather = g.pick([
    "#2b2b2b",
    "#8a4b2a",
    "#b5835a",
    "#6d2433",
    "#e9dcc5",
    "#5e6b4a",
    "#e2b4b0",
    "#2f3e5c",
    "#c74b3b",
    "#d9a441",
  ]);
  const shade = mix(leather, "#000000", 0.2);
  const hardware = g.pick(["#d4b06a", "#cfd3d6"]);
  const stitch =
    leather === "#e9dcc5" || leather === "#e2b4b0" ? mix(leather, "#000000", 0.25) : mix(leather, "#ffffff", 0.35);
  const corner = unit * 0.03;
  const bodyD = s`M ${cx - top / 2} ${y0} L ${cx + top / 2} ${y0} L ${cx + bottom / 2} ${floorY - corner}
                  Q ${cx + bottom / 2} ${floorY} ${cx + bottom / 2 - corner} ${floorY} L ${cx - bottom / 2 + corner} ${floorY}
                  Q ${cx - bottom / 2} ${floorY} ${cx - bottom / 2} ${floorY - corner} Z`;
  out += contact(cx, floorY, Math.max(top, bottom) * 0.58, unit * 0.028);
  const arch = (half: number, lift: number, sw: number, color: string, y: number) =>
    el("path", {
      d: s`M ${cx - half} ${y} C ${cx - half} ${y - lift * 1.33} ${cx + half} ${y - lift * 1.33} ${cx + half} ${y}`,
      stroke: color,
      "stroke-width": sw,
      fill: "none",
      "stroke-linecap": "round",
    });
  if (tote) {
    const half = top * 0.24;
    const sw = unit * 0.032;
    // The back handle, then the body, then the front handle stitched onto it
    out += arch(half * 1.05, handleH * 0.95, sw, shade, y0 + unit * 0.01);
    out += el("path", { d: bodyD, fill: leather });
    out += el("polygon", {
      points: pts([
        [cx + top * 0.36, y0],
        [cx + top / 2, y0],
        [cx + bottom / 2, floorY - corner],
        [cx + bottom * 0.36, floorY],
      ]),
      fill: "#000",
      opacity: "0.1",
    });
    out += el("rect", { x: cx - top / 2, y: y0, width: top, height: bh * 0.08, fill: shade });
    out += arch(half, handleH, sw, leather, y0 + bh * 0.18);
    for (const sx of [-1, 1]) {
      out += el("rect", {
        x: cx + sx * half - sw * 0.75,
        y: y0 + bh * 0.04,
        width: sw * 1.5,
        height: bh * 0.18,
        rx: sw * 0.2,
        fill: leather,
      });
      out += el("circle", { cx: cx + sx * half, cy: y0 + bh * 0.15, r: sw * 0.22, fill: hardware });
    }
    out += el("path", {
      d: s`M ${cx - top * 0.46} ${y0 + bh * 0.12} L ${cx + top * 0.46} ${y0 + bh * 0.12}`,
      stroke: stitch,
      "stroke-width": unit * 0.004,
      "stroke-dasharray": s`${unit * 0.012} ${unit * 0.008}`,
    });
  } else {
    // A rigid handle on rings, the body, then the flap and its clasp
    const half = top * 0.27;
    const sw = unit * 0.04;
    const ringY = y0 - unit * 0.012;
    out += arch(half, handleH, sw, leather, ringY - unit * 0.01);
    out += arch(half, handleH, sw * 0.3, shade, ringY - unit * 0.01 + sw * 0.15);
    out += el("path", { d: bodyD, fill: leather });
    out += el("polygon", {
      points: pts([
        [cx + top * 0.36, y0],
        [cx + top / 2, y0],
        [cx + bottom / 2, floorY - corner],
        [cx + bottom * 0.38, floorY],
      ]),
      fill: "#000",
      opacity: "0.1",
    });
    for (const sx of [-1, 1])
      out += el("ellipse", {
        cx: cx + sx * half,
        cy: ringY,
        rx: unit * 0.018,
        ry: unit * 0.022,
        fill: "none",
        stroke: hardware,
        "stroke-width": unit * 0.009,
      });
    const fy = y0 + bh * g.f(0.5, 0.58);
    const fx = top / 2 + (bottom - top) * ((fy - y0) / bh) * 0.5;
    const pointed = g.chance(0.4);
    out += el("path", {
      d: pointed
        ? s`M ${cx - top / 2 - unit * 0.004} ${y0} L ${cx + top / 2 + unit * 0.004} ${y0} L ${cx + fx} ${fy - bh * 0.2} L ${cx} ${fy} L ${cx - fx} ${fy - bh * 0.2} Z`
        : s`M ${cx - top / 2 - unit * 0.004} ${y0} L ${cx + top / 2 + unit * 0.004} ${y0} L ${cx + fx} ${fy - bh * 0.08}
           Q ${cx + fx} ${fy} ${cx + fx - unit * 0.04} ${fy} L ${cx - fx + unit * 0.04} ${fy} Q ${cx - fx} ${fy} ${cx - fx} ${fy - bh * 0.08} Z`,
      fill: shade,
    });
    out += el("rect", {
      x: cx - top * 0.44,
      y: y0 + bh * 0.05,
      width: top * 0.88,
      height: unit * 0.006,
      rx: unit * 0.003,
      fill: "#fff",
      opacity: "0.25",
    });
    out += el("rect", {
      x: cx - unit * 0.035,
      y: fy - unit * 0.035,
      width: unit * 0.07,
      height: unit * 0.045,
      rx: unit * 0.012,
      fill: hardware,
    });
    out += el("rect", {
      x: cx - unit * 0.012,
      y: fy - unit * 0.025,
      width: unit * 0.024,
      height: unit * 0.025,
      rx: unit * 0.005,
      fill: mix(hardware, "#000000", 0.25),
    });
    // Metal feet at the bottom corners
    for (const sx of [-1, 1])
      out += el("ellipse", {
        cx: cx + sx * (bottom / 2 - unit * 0.05),
        cy: floorY,
        rx: unit * 0.014,
        ry: unit * 0.008,
        fill: hardware,
      });
  }
  note.alt(
    tote
      ? "A leather tote bag with long handles on a studio floor"
      : "A structured top-handle bag with a flap and clasp on a studio floor",
  );
  note.focus(cx, floorY - bh * 0.5);
  return out;
});

/** A faceted glass perfume bottle with its cap, sometimes standing in front of its box. */
export const perfume = defineKind("perfume", "Perfume", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const shape = g.pick(["octagon", "square", "tall", "hexagon"]);
  const boxed = g.chance(0.4);
  const bh = unit * (shape === "tall" ? g.f(0.47, 0.51) : g.f(0.41, 0.45));
  const bw = shape === "tall" ? bh * g.f(0.5, 0.6) : shape === "hexagon" ? bh * g.f(0.95, 1.05) : bh * g.f(0.78, 0.92);
  const neckH = unit * 0.035;
  const cap = g.pick(["cube", "cylinder", "sphere", "crystal"]);
  const capH = cap === "sphere" ? bw * 0.36 : cap === "cylinder" ? unit * g.f(0.11, 0.14) : unit * g.f(0.08, 0.1);
  const totalH = bh + neckH + capH;
  const floorY = h / 2 + totalH / 2 + unit * 0.01;
  const boxW = bw * 0.95;
  const span = boxed ? bw * 0.5 + boxW * 1.05 : bw;
  const cx = w / 2 - (boxed ? span / 2 - bw / 2 : 0);
  const y0 = floorY - bh;
  let out = studio(g, w, h, floorY, w / 2, floorY - totalH / 2);
  const liquid = g.pick(["#e3a857", "#f0a6b5", "#c7a6e0", "#b8d98a", "#8fd0e0", "#f2d16b", "#c8505f", "#f3c6a0"]);
  const glass = mix(liquid, "#ffffff", 0.55);
  const capColor = g.pick(["#d4b06a", "#cfd3d6", "#2b2b2b", "#8a5a3b", "#f4f1ea", mix(liquid, "#000000", 0.2)]);
  const capShade = mix(capColor, "#000000", 0.2);
  if (boxed) {
    // The box, standing just behind and to the right
    const bx = cx + bw * 0.2;
    const boxH = bh * g.f(1.15, 1.3);
    const paper = g.pick(["#f4f1ea", "#2b2b2b", "#e9d3c4", "#d6dfe6", "#e8d9a8", mix(liquid, "#ffffff", 0.3)]);
    const by = floorY - unit * 0.02;
    out += contact(bx + boxW / 2, by, boxW * 0.6, unit * 0.02, 0.14);
    out += el("rect", { x: bx, y: by - boxH, width: boxW, height: boxH, fill: paper });
    out += el("rect", {
      x: bx + boxW * 0.86,
      y: by - boxH,
      width: boxW * 0.14,
      height: boxH,
      fill: "#000",
      opacity: "0.1",
    });
    out += el("rect", {
      x: bx,
      y: by - boxH + boxH * 0.14,
      width: boxW,
      height: unit * 0.004,
      fill: "#000",
      opacity: "0.15",
    });
    out += el("rect", {
      x: bx + boxW * 0.45,
      y: by - boxH * 0.62,
      width: boxW * 0.42,
      height: boxH * 0.2,
      fill: "none",
      stroke: paper === "#2b2b2b" ? "#d4b06a" : mix(paper, "#000000", 0.3),
      "stroke-width": unit * 0.004,
    });
  }
  out += contact(cx, floorY, bw * 0.62, unit * 0.025);
  // Bottle outline: the outer edge, then the front face set in from it
  const c = shape === "square" ? bw * 0.08 : shape === "tall" ? bw * 0.12 : bw * 0.2;
  const outline = (inset: number, bottomInset: number): Point[] => {
    const l = cx - bw / 2 + inset;
    const r = cx + bw / 2 - inset;
    const t = y0 + inset;
    const b = floorY - bottomInset;
    const k = Math.max(0, c - inset * 0.4);
    if (shape === "hexagon") {
      const m = (t + b) / 2;
      return [
        [l + k, t],
        [r - k, t],
        [r, m],
        [r - k, b],
        [l + k, b],
        [l, m],
      ];
    }
    return [
      [l + k, t],
      [r - k, t],
      [r, t + k],
      [r, b - k],
      [r - k, b],
      [l + k, b],
      [l, b - k],
      [l, t + k],
    ];
  };
  const outer = outline(0, 0);
  const m = bw * 0.1;
  const inner = outline(m, m * 1.6);
  out += el("polygon", { points: pts(outer), fill: glass, "fill-opacity": "0.92" });
  // Light on the upper-left facets, shade on the lower-right ones
  const facet = (k: number, color: string, opacity: string) => {
    const j = (k + 1) % outer.length;
    return el("polygon", { points: pts([outer[k], outer[j], inner[j], inner[k]]), fill: color, opacity });
  };
  const n = outer.length;
  for (let k = 0; k < n; k++) {
    const mid = [(outer[k][0] + outer[(k + 1) % n][0]) / 2, (outer[k][1] + outer[(k + 1) % n][1]) / 2];
    const lean = (mid[0] - cx) / bw + (mid[1] - (y0 + floorY) / 2) / bh;
    if (lean > 0.15) out += facet(k, "#000", "0.12");
    else if (lean < -0.15) out += facet(k, "#fff", "0.3");
  }
  // The perfume inside, filled to a seeded level
  const clip = g.id("juice");
  const innerTop = inner[0][1];
  const innerBottom = floorY - m * 1.6;
  const level = innerTop + (innerBottom - innerTop) * g.f(0.1, 0.35);
  out += el("defs", {}, el("clipPath", { id: clip }, el("polygon", { points: pts(inner) })));
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    el("rect", {
      x: cx - bw / 2,
      y: innerTop,
      width: bw,
      height: innerBottom - innerTop,
      fill: mix(liquid, "#ffffff", 0.35),
    }),
    el("rect", { x: cx - bw / 2, y: level, width: bw, height: innerBottom - level, fill: liquid }),
    el("rect", { x: cx + bw * 0.12, y: level, width: bw, height: innerBottom - level, fill: "#000", opacity: "0.08" }),
    el("rect", { x: cx - bw / 2, y: level, width: bw, height: unit * 0.006, fill: "#fff", opacity: "0.4" }),
  );
  // A tall glint on the left of the face
  out += el("rect", {
    x: cx - bw / 2 + m * 1.6,
    y: innerTop + (innerBottom - innerTop) * 0.12,
    width: bw * 0.06,
    height: (innerBottom - innerTop) * 0.6,
    rx: bw * 0.03,
    fill: "#fff",
    opacity: "0.45",
  });
  // Collar and cap
  const neckW = bw * (shape === "tall" ? 0.4 : 0.26);
  const neckY = y0 - neckH;
  out += el("rect", { x: cx - neckW / 2, y: neckY, width: neckW, height: neckH + unit * 0.004, fill: "#cfd3d6" });
  out += el("rect", { x: cx - neckW / 2, y: neckY, width: neckW * 0.3, height: neckH, fill: "#fff", opacity: "0.4" });
  const capTop = neckY - capH;
  if (cap === "sphere") {
    const r = capH / 2;
    out += el("circle", { cx, cy: capTop + r, r, fill: capShade });
    out += el("circle", { cx: cx - r * 0.06, cy: capTop + r * 0.94, r: r * 0.92, fill: capColor });
    out += el("circle", { cx: cx - r * 0.4, cy: capTop + r * 0.55, r: r * 0.18, fill: "#fff", opacity: "0.45" });
  } else if (cap === "crystal") {
    const cw = bw * 0.42;
    const crystal = mix(liquid, "#ffffff", 0.4);
    out += el("polygon", {
      points: pts([
        [cx - cw * 0.3, neckY],
        [cx + cw * 0.3, neckY],
        [cx + cw / 2, capTop + capH * 0.45],
        [cx + cw * 0.25, capTop],
        [cx - cw * 0.25, capTop],
        [cx - cw / 2, capTop + capH * 0.45],
      ]),
      fill: crystal,
    });
    out += el("polygon", {
      points: pts([
        [cx, neckY],
        [cx + cw * 0.3, neckY],
        [cx + cw / 2, capTop + capH * 0.45],
        [cx + cw * 0.25, capTop],
        [cx, capTop],
      ]),
      fill: "#000",
      opacity: "0.1",
    });
    out += el("polygon", {
      points: pts([
        [cx - cw * 0.25, capTop],
        [cx - cw * 0.08, capTop],
        [cx - cw * 0.3, capTop + capH * 0.45],
        [cx - cw / 2, capTop + capH * 0.45],
      ]),
      fill: "#fff",
      opacity: "0.4",
    });
  } else {
    const cw = cap === "cube" ? bw * (shape === "tall" ? 0.7 : 0.44) : bw * (shape === "tall" ? 0.46 : 0.3);
    out += el("rect", { x: cx - cw / 2, y: capTop, width: cw, height: capH, rx: cw * 0.06, fill: capColor });
    out += el("rect", { x: cx + cw * 0.2, y: capTop, width: cw * 0.3, height: capH, rx: cw * 0.06, fill: capShade });
    out += el("rect", {
      x: cx - cw * 0.36,
      y: capTop + capH * 0.12,
      width: cw * 0.08,
      height: capH * 0.76,
      rx: cw * 0.04,
      fill: "#fff",
      opacity: "0.35",
    });
  }
  const bottle =
    shape === "tall"
      ? "A tall faceted perfume bottle"
      : shape === "hexagon"
        ? "A hexagonal perfume bottle"
        : "A faceted glass perfume bottle";
  note.alt(`${bottle} with its cap${boxed ? ", in front of its box" : ""}, on a studio backdrop`);
  note.focus(cx, y0 + bh * 0.4);
  return out;
});
