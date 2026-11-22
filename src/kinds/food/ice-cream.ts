import { defineKind, el, fill, hsl, pts, s } from "../../draw/core";
import { numberWord } from "../../draw/words";

const SCOOPS = ["#f7c6d0", "#7b4a35", "#fff4dd", "#b8e0b0", "#f6d365", "#c9a7eb", "#f28b66"];

/**
 * One to three scoops on a waffle cone, maybe with a cherry.
 *
 * @category Food
 */
export const iceCream = /* @__PURE__ */ defineKind("ice-cream", "Ice cream", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2 + w * g.f(-0.04, 0.04);
  const scoops = g.i(1, 3);
  const scale = g.f(1.05, 1.2);
  const clip = g.id("cone");
  // Size the cone so the whole stack fits: cone 3 units tall, each scoop adds about 1.2 scoop radii.
  const units = 3 + scale * (1.85 + 1.25 * (scoops - 1));
  const coneW = Math.min(unit * 0.18, (h * 0.84) / units);
  const tipY = h * 0.93;
  const topY = tipY - coneW * 3;
  const scoopR = coneW * scale;
  const cone = pts([
    [cx - coneW, topY],
    [cx + coneW, topY],
    [cx, tipY],
  ]);
  let out = el("defs", {}, el("clipPath", { id: clip }, el("polygon", { points: cone })));
  out += fill(w, h, hsl(g.f(0, 360), g.f(40, 60), g.f(84, 90)));
  // Cone
  out += el("polygon", { points: cone, fill: "#e2a65c" });
  // Waffle hatch, clipped to the cone
  let hatch = "";
  for (let k = -6; k <= 6; k++) {
    const x = cx + k * coneW * 0.32;
    hatch += s`M ${x - coneW} ${topY - coneW * 0.2} L ${x + coneW} ${tipY} M ${x + coneW} ${topY - coneW * 0.2} L ${x - coneW} ${tipY} `;
  }
  out += el("path", {
    d: hatch.trim(),
    stroke: "#b97b36",
    "stroke-width": coneW * 0.05,
    "clip-path": `url(#${clip})`,
  });
  // Scoops, stacked upward
  let y = topY;
  for (let k = 0; k < scoops; k++) {
    const r = scoopR * (1 - k * 0.08);
    const color = g.pick(SCOOPS);
    const sy = y - r * (k === 0 ? 0.8 : 0.75);
    const sx = cx + g.f(-0.08, 0.08) * r;
    out += el("circle", { cx: sx, cy: sy, r, fill: color });
    // The top scoop.
    note.focus(sx, sy);
    if (k === 0) {
      // A scalloped skirt where the first scoop melts over the rim of the cone.
      let skirt = s`M ${cx - r * 1.05} ${y - r * 0.25}`;
      const bumps = g.i(4, 6);
      for (let b = 0; b < bumps; b++) {
        const x0 = cx - r * 1.05 + ((b + 1) * r * 2.1) / bumps;
        const dy = r * g.f(0.25, 0.55);
        skirt += s` Q ${x0 - (r * 1.05) / bumps} ${y + dy} ${x0} ${y}`;
      }
      out += el("path", {
        d: skirt + s` L ${cx + r * 1.05} ${y - r * 0.25} Z`,
        fill: color,
      });
    }
    y = sy - r * 0.5;
  }
  const cherry = g.chance(0.5);
  const stack = scoops === 1 ? "one scoop" : `${numberWord(scoops)} scoops`;
  note.alt(`An ice cream cone with ${stack}${cherry ? " and a cherry on top" : ""}`);
  if (cherry) {
    // Cherry and its stem
    out += el("path", {
      d: s`M ${cx} ${y + scoopR * 0.1}
           q ${scoopR * 0.1} ${-scoopR * 0.45} ${scoopR * 0.35} ${-scoopR * 0.55}`,
      stroke: "#4b7a2a",
      "stroke-width": scoopR * 0.06,
      fill: "none",
      "stroke-linecap": "round",
    });
    out += el("circle", { cx, cy: y + scoopR * 0.12, r: scoopR * 0.2, fill: "#d62839" });
  }
  return out;
});
