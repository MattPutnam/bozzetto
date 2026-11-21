import { defineKind, el, fill, hsl, s } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";
import { topPlate } from "./shared";

/** Wedges of watermelon on a plate, seen from above. */
export const watermelon = /* @__PURE__ */ defineKind("watermelon", "Watermelon", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const plate = unit * 0.44;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(30, 50), g.f(80, 88)));
  out += topPlate(cx, cy, plate, g.pick(["#ffffff", "#ffffff", "#d8ebe4", "#f3e6d0", "#dfe7f5"]));
  const count = g.i(3, 5);
  const yellow = g.chance(0.2);
  const seeded = g.chance(0.8);
  const flesh = yellow ? "#f6d365" : g.pick(["#f25c5c", "#ef4f63", "#f26b6b"]);
  const R = plate * 0.8;
  const half = (Math.PI / count) * 0.72;
  const a0 = g.f(0, Math.PI * 2);
  for (let k = 0; k < count; k++) {
    const phi = a0 + (k * Math.PI * 2) / count + g.f(-0.06, 0.06);
    const tx = cx + Math.cos(phi) * plate * 0.08;
    const ty = cy + Math.sin(phi) * plate * 0.08;
    const wedge = (r: number, dx = 0, dy = 0) =>
      s`M ${tx + dx} ${ty + dy}
        L ${tx + dx + Math.cos(phi - half) * r} ${ty + dy + Math.sin(phi - half) * r}
        A ${r} ${r} 0 0 1 ${tx + dx + Math.cos(phi + half) * r} ${ty + dy + Math.sin(phi + half) * r} Z`;
    // Shadow, then rind, pale rind and flesh
    out += el("path", { d: wedge(R, plate * 0.015, plate * 0.03), fill: "#000", opacity: "0.1" });
    out += el("path", { d: wedge(R), fill: "#2f6b2f" });
    out += el("path", { d: wedge(R * 0.95), fill: "#8cc46b" });
    out += el("path", { d: wedge(R * 0.92), fill: "#f4f1d0" });
    out += el("path", { d: wedge(R * 0.89), fill: flesh });
    if (seeded) {
      // Seeds in two rows, pointing to the tip
      let seeds = "";
      for (const [row, n] of [
        [0.45, 2],
        [0.7, 3],
      ] as const)
        for (let p = 0; p < n; p++) {
          const a = phi + half * 0.62 * (-1 + (2 * p) / (n - 1)) + g.f(-0.05, 0.05);
          const dist = R * (row + g.f(-0.04, 0.04));
          seeds += el("ellipse", {
            cx: tx + Math.cos(a) * dist,
            cy: ty + Math.sin(a) * dist,
            rx: R * 0.03,
            ry: R * 0.017,
            transform: s`rotate(${(a * 180) / Math.PI} ${tx + Math.cos(a) * dist} ${ty + Math.sin(a) * dist})`,
          });
        }
      out += el("g", { fill: yellow ? "#3a2a1a" : "#2b2b2b" }, seeds);
    }
  }
  note.alt(`${capitalize(numberWord(count))} wedges of ${seeded ? "" : "seedless "}watermelon on a plate`);
  note.focus(cx, cy);
  return out;
});
