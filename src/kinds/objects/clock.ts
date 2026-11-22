import { defineKind, el, fill, hsl, s } from "../../draw/core";
import { numberWord } from "../../draw/words";

const MINUTE_WORDS: Record<number, string> = { 5: "five", 10: "ten", 20: "twenty", 25: "twenty-five" };

/** A time on a clock face in words: "ten past four", "quarter to nine", "six o'clock". */
function timeWords(hour: number, minute: number): string {
  const next = (hour % 12) + 1;
  if (minute === 0) return `${numberWord(hour)} o'clock`;
  if (minute === 15) return `quarter past ${numberWord(hour)}`;
  if (minute === 30) return `half past ${numberWord(hour)}`;
  if (minute === 45) return `quarter to ${numberWord(next)}`;
  return minute < 30
    ? `${MINUTE_WORDS[minute]} past ${numberWord(hour)}`
    : `${MINUTE_WORDS[60 - minute]} to ${numberWord(next)}`;
}

/**
 * A wall clock with its hands at a seeded time.
 *
 * @category Objects
 */
export const clock = /* @__PURE__ */ defineKind("clock", "Wall clock", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2 + w * g.f(-0.06, 0.06);
  const cy = h * g.f(0.46, 0.52);
  const shape = g.pick(["round", "round", "square", "sunburst"]);
  const r = unit * (shape === "sunburst" ? g.f(0.24, 0.27) : g.f(0.3, 0.35));
  const hour = g.i(1, 12);
  const minute = g.i(0, 11) * 5;
  const second = g.i(0, 59);
  const frame = g.pick(["#3b3b3b", "#c4572f", "#3e6d8e", "#e8b04b", "#2f6b58", "#8a5a3b", "#f4f1ea", "#c9a24a"]);
  const darkFace = g.chance(0.2);
  const face = darkFace ? g.pick(["#263238", "#2f4f4f", "#3b2f2a"]) : g.pick(["#fbf8f1", "#f4f1ea", "#fffdf7"]);
  const ink = darkFace ? "#f4f1ea" : "#2b2b2b";
  // Wall, with a rail line sometimes
  let out = fill(w, h, hsl(g.f(0, 360), g.f(15, 35), g.f(80, 90)));
  if (g.chance(0.4)) out += el("rect", { y: h * 0.86, width: w, height: h * 0.14, fill: "#000", opacity: "0.06" });
  // Shadow on the wall, down and to the right
  const outer = shape === "sunburst" ? r * 1.45 : r;
  let faceR: number;
  if (shape === "square") {
    out += el("rect", {
      x: cx - r + r * 0.05,
      y: cy - r + r * 0.07,
      width: r * 2,
      height: r * 2,
      rx: r * 0.2,
      fill: "#000",
      opacity: "0.12",
    });
    out += el("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: r * 0.2, fill: frame });
    faceR = r * 0.8;
  } else if (shape === "sunburst") {
    // Rays of alternating length around a small rim
    let rays = "";
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const len = k % 2 ? outer * 0.8 : outer;
      rays += s`M ${cx + Math.cos(a) * r * 0.9} ${cy + Math.sin(a) * r * 0.9} L ${cx + Math.cos(a) * len} ${cy + Math.sin(a) * len} `;
    }
    const gold = g.pick(["#c9a24a", "#b08850", "#d9b44a"]);
    out += el("path", {
      d: rays.trim(),
      stroke: "#000",
      "stroke-opacity": "0.1",
      "stroke-width": unit * 0.02,
      "stroke-linecap": "round",
      transform: s`translate(${r * 0.05} ${r * 0.07})`,
    });
    out += el("path", { d: rays.trim(), stroke: gold, "stroke-width": unit * 0.02, "stroke-linecap": "round" });
    out += el("circle", { cx, cy, r, fill: gold });
    faceR = r * 0.84;
  } else {
    out += el("circle", { cx: cx + r * 0.05, cy: cy + r * 0.07, r, fill: "#000", opacity: "0.12" });
    out += el("circle", { cx, cy, r, fill: frame });
    faceR = r * 0.86;
  }
  out += el("circle", { cx, cy, r: faceR, fill: face });
  // Hour marks, longer at the quarters
  let major = "";
  let minor = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const inner = k % 3 ? faceR * 0.82 : faceR * 0.72;
    const seg = s`M ${cx + Math.sin(a) * inner} ${cy - Math.cos(a) * inner} L ${cx + Math.sin(a) * faceR * 0.9} ${cy - Math.cos(a) * faceR * 0.9} `;
    if (k % 3) minor += seg;
    else major += seg;
  }
  out += el("path", { d: major.trim(), stroke: ink, "stroke-width": faceR * 0.06 });
  out += el("path", { d: minor.trim(), stroke: ink, "stroke-width": faceR * 0.03 });
  // Hands
  const hand = (turns: number, len: number, width: number, color: string) => {
    const a = turns * Math.PI * 2;
    return el("path", {
      d: s`M ${cx - Math.sin(a) * len * 0.15} ${cy + Math.cos(a) * len * 0.15} L ${cx + Math.sin(a) * len} ${cy - Math.cos(a) * len}`,
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
    });
  };
  out += hand(((hour % 12) + minute / 60) / 12, faceR * 0.5, faceR * 0.07, ink);
  out += hand(minute / 60, faceR * 0.76, faceR * 0.045, ink);
  if (g.chance(0.6)) out += hand(second / 60, faceR * 0.82, faceR * 0.015, "#d63c2f");
  out += el("circle", { cx, cy, r: faceR * 0.05, fill: ink });
  const name =
    shape === "square" ? "A square wall clock" : shape === "sunburst" ? "A sunburst wall clock" : "A round wall clock";
  note.alt(`${name} reading ${timeWords(hour, minute)}`);
  note.focus(cx, cy);
  return out;
});
