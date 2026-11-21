import { defineKind, el, mix, pts, s } from "../../draw/core";
import { numberWord } from "../../draw/words";
import { contact, studio } from "./shared";

const MINUTES = ["", "five", "ten", "quarter", "twenty", "twenty-five"];

/** A time in words, such as "ten past four" or "quarter to nine". */
function timeWords(hour: number, minute: number): string {
  if (minute === 0) return `${numberWord(hour)} o'clock`;
  if (minute === 30) return `half past ${numberWord(hour)}`;
  return minute < 30
    ? `${MINUTES[minute / 5]} past ${numberWord(hour)}`
    : `${MINUTES[(60 - minute) / 5]} to ${numberWord((hour % 12) + 1)}`;
}

/** An analog wristwatch standing face-on, its strap looping back behind it. */
export const watch = /* @__PURE__ */ defineKind("watch", "Wristwatch", (g, w, h, note) => {
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
