import { defineKind, el, fill, hsl, mix, type Point, s } from "../../draw/core";
import { smoothClosed } from "../../draw/shapes";

/**
 * An avocado cut in half on a board, one half still holding the pit.
 *
 * @category Food
 */
export const avocado = /* @__PURE__ */ defineKind("avocado", "Avocado", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(25, 45), g.f(82, 90)));
  const count = g.chance(0.75) ? 2 : 1;
  const ry = Math.min(unit * 0.3, (w * 0.8) / (count * 2.2 * 0.74 + 0.5));
  const rx = ry * 0.74;
  // Board, with a little grain
  const bw = Math.min(w * 0.94, count * rx * 2.5 + rx * 1.1);
  const bh = Math.min(h * 0.92, ry * 2.6);
  const wood = g.pick(["#d8ad78", "#c89a64", "#e3c08f", "#b9875a"]);
  out += el("rect", {
    x: cx - bw / 2 + unit * 0.01,
    y: cy - bh / 2 + unit * 0.02,
    width: bw,
    height: bh,
    rx: unit * 0.05,
    fill: "#000",
    opacity: "0.1",
  });
  out += el("rect", { x: cx - bw / 2, y: cy - bh / 2, width: bw, height: bh, rx: unit * 0.05, fill: wood });
  let grain = "";
  for (let k = 1; k < 5; k++) {
    const gy = cy - bh / 2 + (bh * (k + g.f(-0.2, 0.2))) / 5;
    grain += s`M${cx - bw * 0.42} ${gy}q${bw * 0.2} ${-bh * 0.02} ${bw * 0.42} 0t${bw * 0.42} 0`;
  }
  out += el("path", {
    d: grain,
    stroke: mix(wood, "#000000", 0.12),
    "stroke-width": unit * 0.006,
    fill: "none",
    opacity: "0.6",
  });
  // The outline of half an avocado, narrow end up, scaled about its middle
  const shape = (scale: number) => {
    const ring: Point[] = [];
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      ring.push([rx * scale * Math.sin(a) * (1 - 0.22 * Math.cos(a)) * 1.08, -ry * scale * Math.cos(a)]);
    }
    return smoothClosed(ring);
  };
  const pitAt = count === 1 ? 0 : g.i(0, 1);
  for (let k = 0; k < count; k++) {
    const x = cx + (k - (count - 1) / 2) * rx * 2.5;
    const turn = count === 1 ? g.f(-20, 20) : (k === 0 ? -1 : 1) * g.f(6, 20);
    let half = el("path", {
      d: shape(1),
      fill: "#000",
      opacity: "0.12",
      transform: s`translate(${unit * 0.01} ${unit * 0.02})`,
    });
    half += el("path", { d: shape(1), fill: "#33501f" });
    half += el("path", { d: shape(0.93), fill: "#9cc24a" });
    half += el("path", { d: shape(0.8), fill: "#d6e28a" });
    const pr = rx * 0.46;
    const py = ry * 0.22;
    if (k === pitAt) {
      // The pit, with a shine
      half += el("circle", { cx: 0, cy: py + pr * 0.08, r: pr, fill: "#000", opacity: "0.15" });
      half += el("circle", { cx: 0, cy: py, r: pr, fill: "#7a4a2a" });
      half += el("circle", { cx: -pr * 0.35, cy: py - pr * 0.35, r: pr * 0.28, fill: "#fff", opacity: "0.25" });
    } else {
      // The hollow the pit left
      half += el("circle", { cx: 0, cy: py, r: pr, fill: "#b9c45a" });
      half += el("circle", { cx: 0, cy: py + pr * 0.12, r: pr * 0.88, fill: "#cfd87a" });
    }
    out += el("g", { transform: s`translate(${x} ${cy}) rotate(${turn})` }, half);
  }
  note.alt(
    count === 2
      ? "Two halves of an avocado on a cutting board, one with the pit"
      : "Half an avocado with its pit on a cutting board",
  );
  note.focus(cx, cy);
  return out;
});
