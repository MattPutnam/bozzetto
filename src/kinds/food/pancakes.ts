import { defineKind, el, hsl, mix, type Point, pts, type Rand, s } from "../../draw/core";
import { blob, table } from "../../draw/shapes";
import { andList, numberWord } from "../../draw/words";
import { sidePlate, spread } from "./shared";

/** A blueberry or raspberry, seen from the side or above. */
function berry(g: Rand, x: number, y: number, r: number, kind: "blueberry" | "raspberry"): string {
  if (kind === "blueberry")
    return (
      el("circle", { cx: x, cy: y, r, fill: "#3b4a8c" }) +
      el("circle", { cx: x + r * 0.15, cy: y - r * 0.2, r: r * 0.28, fill: "#26305e" }) +
      el("circle", { cx: x - r * 0.4, cy: y - r * 0.35, r: r * 0.2, fill: "#fff", opacity: "0.35" })
    );
  let out = el("circle", { cx: x, cy: y, r, fill: "#d6336c" });
  let dots = "";
  for (const [dx, dy] of spread(g, 0, 0, r * 0.7, 6)) dots += s`M${x + dx} ${y + dy}h0.01`;
  out += el("path", { d: dots, stroke: "#f07a9e", "stroke-width": r * 0.3, "stroke-linecap": "round" });
  return out;
}

/** A stack of pancakes on a plate, with butter, syrup and berries. */
export const pancakes = /* @__PURE__ */ defineKind("pancakes", "Pancakes", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = table(g, w, h, h * 0.56, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  const cx = w / 2;
  const plateY = h * 0.85;
  const rx = unit * g.f(0.26, 0.3);
  const ry = rx * 0.26;
  const t = unit * 0.05;
  const plateRx = rx * 1.62;
  const plateRy = plateRx * 0.26;
  out += sidePlate(cx, plateY, plateRx, plateRy, g.pick(["#ffffff", "#ffffff", "#d8ebe4", "#f3e6d0"]));
  const count = g.i(3, 6);
  const edge = g.pick(["#efc27a", "#f3cf8e", "#e8b468"]);
  const face = g.pick(["#c98a3e", "#b9772f", "#d39a4c"]);
  let y = plateY;
  let px = cx;
  let prx = rx;
  for (let k = 0; k < count; k++) {
    // One pancake: its pale edge, then its browned top
    px = cx + rx * g.f(-0.04, 0.04);
    prx = rx * g.f(0.95, 1.02);
    out += el("ellipse", { cx: px, cy: y, rx: prx, ry, fill: mix(edge, "#000000", 0.08) });
    out += el("rect", { x: px - prx, y: y - t, width: prx * 2, height: t, fill: edge });
    out += el("ellipse", { cx: px, cy: y - t, rx: prx, ry, fill: face });
    y -= t;
  }
  const topY = y;
  const syrup = g.chance(0.75);
  const butter = g.chance(0.7);
  const kind = g.pick(["blueberry", "raspberry", "mixed"] as const);
  const pick = (): "blueberry" | "raspberry" => (kind === "mixed" ? g.pick(["blueberry", "raspberry"]) : kind);
  if (syrup) {
    // A pool of syrup on top, running down the front of the stack
    const color = "#a8561c";
    let drips = "";
    for (const u of [-0.55, -0.1, 0.35, 0.7]) {
      const x = px + prx * (u + g.f(-0.08, 0.08));
      const y0 = topY + ry * 0.5;
      const len = Math.min(plateY - topY - ry * 0.4, t * g.f(0.8, 2.4));
      drips += s`M${x} ${y0}V${y0 + len}`;
    }
    out += el("path", {
      d: drips,
      stroke: color,
      "stroke-width": unit * 0.03,
      "stroke-linecap": "round",
      opacity: "0.92",
    });
    out += el("path", {
      d: blob(g, px, topY + ry * 0.12, prx * 0.78, ry * 0.75, 5, 0.06, 0.04),
      fill: color,
      opacity: "0.92",
    });
  }
  // Berries around the top, behind the butter at the back and in front of it at the front
  const ring: Point[] = [];
  const n = g.i(4, 6);
  const a0 = g.f(0, Math.PI * 2);
  for (let k = 0; k < n; k++) {
    const a = a0 + (k * Math.PI * 2) / n + g.f(-0.2, 0.2);
    ring.push([px + Math.cos(a) * prx * 0.55, topY + Math.sin(a) * ry * 0.55]);
  }
  ring.sort((a, b) => a[1] - b[1]);
  const br = unit * 0.026;
  for (const [x, by] of ring.filter(p => p[1] < topY)) out += berry(g, x, by - br * 0.6, br, pick());
  if (butter) {
    // A pat of butter
    const b = rx * 0.17;
    const yb = topY - b * 0.1;
    out += el("rect", { x: px - b, y: yb - b * 0.45, width: b * 2, height: b * 0.45, fill: "#f2d36b" });
    out += el("polygon", {
      points: pts([
        [px - b, yb - b * 0.45],
        [px + b, yb - b * 0.45],
        [px + b * 0.75, yb - b * 0.85],
        [px - b * 0.75, yb - b * 0.85],
      ]),
      fill: "#fbe7a1",
    });
  }
  for (const [x, by] of ring.filter(p => p[1] >= topY)) out += berry(g, x, by - br * 0.6, br, pick());
  // A few berries on the plate beside the stack
  for (const side of [-1, 1]) {
    const m = g.i(1, 2);
    for (let k = 0; k < m; k++) {
      const x = cx + side * rx * (1.17 + k * 0.15 + g.f(-0.03, 0.03));
      out += berry(g, x, plateY + plateRy * (0.1 + k * 0.25) - br * 0.6, br, pick());
    }
  }
  const berries =
    kind === "mixed" ? "blueberries and raspberries" : `${kind === "blueberry" ? "blueberries" : "raspberries"}`;
  note.alt(
    `A stack of ${numberWord(count)} pancakes with ${andList([butter && "butter", syrup && "syrup", berries])} on a plate`,
  );
  note.focus(px, topY);
  return out;
});
