import { defineKind, el, hsl, mix, s } from "../../draw/core";
import {
  at,
  backdrop,
  disc,
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

// Rose colors: hue, saturation, lightness of the outer petals, and a name for the alt text.
const ROSES: readonly (readonly [number, number, number])[] = [
  [352, 75, 46],
  [354, 72, 42],
  [345, 62, 34],
  [338, 58, 72],
  [348, 50, 82],
  [48, 82, 64],
  [42, 40, 93],
  [16, 75, 68],
];

/** A rose in bloom, seen from above or at three-quarters, with leaves and sometimes a bud. */
export const rose = /* @__PURE__ */ defineKind("rose", "Rose", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "garden", "warm", "dusk"] as const);
  let out = backdrop(g, w, h, look);
  const [hue, sat, light] = g.pick(ROSES);
  const green = hexHsl(g.f(95, 130), g.f(35, 50), g.f(24, 34));
  const R = unit * g.f(0.3, 0.36);
  const above = g.chance(0.45);
  const v: View = {
    x: w / 2 + unit * g.f(-0.1, 0.1),
    y: above ? h / 2 + unit * g.f(-0.04, 0.04) : Math.max(h * 0.44, R * 0.95 + unit * 0.05),
    tilt: above ? g.f(1.25, 1.57) : g.f(0.55, 0.8),
    roll: g.f(-0.25, 0.25),
  };
  const budSide = g.chance(0.5) ? -1 : 1;
  const bud = g.chance(w > h * 1.5 ? 0.8 : 0.45);
  // A bud on its own stem, beside and behind the bloom.
  if (bud) {
    const br = R * g.f(0.32, 0.4);
    const bv: View = {
      x: Math.max(br * 2.2, Math.min(w - br * 2.2, v.x + budSide * (R + br * g.f(0.9, 1.3)))),
      y: v.y - R * g.f(0.1, 0.4),
      tilt: 0.25,
      roll: budSide * g.f(0.1, 0.35),
    };
    out += stem(bv.x, bv.y, v.x + budSide * R * 0.3, h + unit * 0.05, budSide * unit * 0.05, unit * 0.014, green);
    const parts: (Part & { paint: string })[] = [];
    for (let k = 0; k < 3; k++)
      parts.push({
        ...petal(bv, g.f(0, 1) + (k * Math.PI * 2) / 3, {
          len: br * 1.3,
          wid: br * 1.05,
          lift: 1.15,
          cup: 0.25,
          bend: 0.35,
          belly: 0.15,
          tip: 0.5,
        }),
        paint: hsl(hue, sat, light - 4 + k * 3),
      });
    // Sepals splaying out below the bud, then the bud's petals over them.
    let sepals = "";
    for (let k = 0; k < 5; k++)
      sepals += petal(bv, (k * Math.PI * 2) / 5 + 0.3, {
        len: br * 0.8,
        wid: br * 0.26,
        lift: 0.3,
        bend: -0.15,
        tip: 0,
      }).d;
    out += el("path", { d: sepals, fill: mix(green, "#ffffff", 0.1) });
    out += layered(parts, "", unit);
    out += disc(bv, -br * 0.05, br * 0.32, green);
  }
  // Leaves: from above they peek out around the bloom; from the side they grow from the stem.
  const leafLen = unit * g.f(0.17, 0.21);
  const leafWid = leafLen * 0.36;
  if (above) {
    const start = g.f(0, Math.PI * 2);
    for (let k = g.i(3, 4); k > 0; k--) {
      const angle = start + k * g.f(1.4, 1.9);
      const lx = v.x + Math.cos(angle) * R * 0.55;
      const ly = v.y + Math.sin(angle) * R * 0.55;
      out += leafEl(leaf(lx, ly, angle, leafLen * 1.15, leafWid, 0.3, g.f(-0.08, 0.08)), green, unit * 0.005);
    }
  } else {
    const [sx, sy] = at(v, 0, [0, -R * 0.1, 0]);
    out += stem(sx, sy, sx - budSide * unit * 0.05, h + unit * 0.05, unit * g.f(-0.05, 0.05), unit * 0.02, green);
    const ly = Math.min(h * 0.92, sy + R * 0.7);
    for (const side of [-1, 1]) {
      if (side === budSide && bud) continue;
      const angle = side > 0 ? g.f(-0.6, -0.1) : Math.PI + g.f(0.1, 0.6);
      out += leafEl(leaf(sx, ly, angle, leafLen, leafWid, 0.3, -0.05 * side), green, unit * 0.005);
      const [tx, ty] = [sx + Math.cos(angle) * leafLen * 1.1, ly + Math.sin(angle) * leafLen * 1.1];
      out += leafEl(leaf(tx, ty, angle - side * 0.2, leafLen * 0.8, leafWid * 0.9, 0.3), green, unit * 0.005);
    }
    // Sepals curling back under the bloom
    let sepals = "";
    for (let k = 0; k < 5; k++)
      sepals += petal(v, (k * Math.PI * 2) / 5 + 0.5, { len: R * 0.55, wid: R * 0.14, lift: -0.5, tip: 0 }).d;
    out += el("path", { d: sepals, fill: green });
  }
  // The bloom: rings of round petals, each ring smaller, more upright and deeper in shade.
  const rings = [
    { count: 5, len: 1, lift: 0.22, cup: 0.12, shade: 6 },
    { count: 5, len: 0.86, lift: 0.55, cup: 0.18, shade: 2 },
    { count: 5, len: 0.68, lift: 0.85, cup: 0.22, shade: -3 },
    { count: 4, len: 0.5, lift: 1.1, cup: 0.25, shade: -8 },
    { count: 3, len: 0.34, lift: 1.3, cup: 0.3, shade: -13 },
  ];
  const parts: (Part & { paint: string })[] = [];
  let turn = g.f(0, Math.PI * 2);
  rings.forEach((ring, index) => {
    turn += g.f(0.5, 0.8);
    for (let k = 0; k < ring.count; k++)
      parts.push({
        ...petal(v, turn + (k * Math.PI * 2) / ring.count + g.f(-0.1, 0.1), {
          from: R * 0.04 * (4 - index),
          len: R * ring.len * g.f(0.94, 1.04),
          wid: R * ring.len * 1.2,
          lift: ring.lift,
          cup: ring.cup,
          tip: 1,
        }),
        paint: hsl(hue, sat, light + ring.shade * (light > 80 ? 0.6 : 1) + (k % 2 ? 2 : -2)),
      });
  });
  // The tight heart: a curl of petal edge.
  const [hx, hy] = at(v, 0, [0, R * 0.3, 0]);
  const curl = R * 0.12;
  const heart =
    disc({ ...v, x: hx, y: hy }, 0, curl * 1.2, hsl(hue, sat, light - 18)) +
    el("path", {
      d: s`M${hx - curl} ${hy}A${curl} ${curl * 0.7} 0 1 1 ${hx + curl * 0.6} ${hy + curl * 0.4}A${curl * 0.5} ${curl * 0.35} 0 1 1 ${hx} ${hy - curl * 0.2}`,
      stroke: hsl(hue, sat, light + 8),
      "stroke-width": unit * 0.007,
      fill: "none",
      "stroke-linecap": "round",
    });
  out += layered(parts, heart, unit);
  note.alt(`A rose${bud ? " and a bud" : ""} ${above ? "seen from above" : "seen from the side"} ${SETTING[look]}`);
  note.focus(hx, hy);
  return out;
});
