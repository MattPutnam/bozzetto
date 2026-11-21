import { defineKind, el, fill, hsl, mix, type Point, s } from "../../draw/core";
import { blob, sprinkles } from "../../draw/shapes";
import { andList, capitalize, numberWord } from "../../draw/words";
import { spread, SPRINKLES, topPlate } from "./shared";

const COOKIES: Record<string, [string, string]> = {
  chip: ["#d9a15b", "chocolate chip"],
  chocolate: ["#5a3522", "fudge"],
  sugar: ["#f3d9a4", "sprinkle"],
  oat: ["#c89254", "oatmeal raisin"],
  jam: ["#e8c48a", "jam"],
  iced: ["#f0cf98", "iced"],
};

/** Cookies on a plate or a baking tray, seen from above. */
export const cookies = /* @__PURE__ */ defineKind("cookies", "Cookies", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(25, 45), g.f(80, 88)));
  const tray = g.chance(0.4);
  const spots: Point[] = [];
  let c: number;
  if (tray) {
    // Baking tray with parchment; the grid that gives the biggest cookies, among a few
    const tw = w * 0.86;
    const th = h * 0.78;
    const grids: [number, number, number][] = [];
    for (let rows = 1; rows <= 3; rows++)
      for (let cols = 2; cols <= 6; cols++)
        if (rows * cols >= 3 && rows * cols <= 10) grids.push([rows, cols, Math.min(tw / cols, th / rows) * 0.38]);
    const best = Math.max(...grids.map(q => q[2]));
    const [rows, cols, size] = g.pick(grids.filter(q => q[2] >= best * 0.85));
    c = size;
    out += el("rect", {
      x: cx - tw / 2 + unit * 0.01,
      y: cy - th / 2 + unit * 0.02,
      width: tw,
      height: th,
      rx: unit * 0.03,
      fill: "#000",
      opacity: "0.12",
    });
    out += el("rect", { x: cx - tw / 2, y: cy - th / 2, width: tw, height: th, rx: unit * 0.03, fill: "#aab1b8" });
    out += el("rect", {
      x: cx - tw / 2 + unit * 0.025,
      y: cy - th / 2 + unit * 0.025,
      width: tw - unit * 0.05,
      height: th - unit * 0.05,
      rx: unit * 0.015,
      fill: g.chance(0.6) ? "#f4ecd8" : "#bfc5cb",
    });
    for (let rr = 0; rr < rows; rr++)
      for (let cc = 0; cc < cols; cc++)
        spots.push([
          cx - tw / 2 + (tw * (cc + 0.5)) / cols + c * g.f(-0.08, 0.08),
          cy - th / 2 + (th * (rr + 0.5)) / rows + c * g.f(-0.08, 0.08),
        ]);
  } else {
    // Plate: a ring of cookies, with one in the middle when there are five or more
    const P = unit * 0.44;
    out += topPlate(cx, cy, P, g.pick(["#ffffff", "#ffffff", "#d8ebe4", "#f3e6d0", "#dfe7f5"]));
    const count = g.i(3, 7);
    const centered = count >= 5;
    const m = centered ? count - 1 : count;
    const ringK = Math.max(centered ? 2.1 : 0, 1.08 / Math.sin(Math.PI / m));
    c = (P * 0.86) / (ringK + 1);
    if (centered) spots.push([cx + c * g.f(-0.05, 0.05), cy + c * g.f(-0.05, 0.05)]);
    const a0 = g.f(0, Math.PI * 2);
    for (let k = 0; k < m; k++) {
      const a = a0 + (k * Math.PI * 2) / m;
      spots.push([cx + Math.cos(a) * c * ringK, cy + Math.sin(a) * c * ringK]);
    }
  }
  const mixed = g.chance(0.4);
  const one = g.pick(Object.keys(COOKIES));
  const kinds = new Set<string>();
  for (const [x, y] of spots) {
    const kind = mixed ? g.pick(Object.keys(COOKIES)) : one;
    kinds.add(kind);
    const base = COOKIES[kind][0];
    const r = c * g.f(0.92, 1);
    // Shadow, browned edge, and the cookie
    out += el("circle", { cx: x + r * 0.05, cy: y + r * 0.1, r, fill: "#000", opacity: "0.1" });
    out += el("circle", { cx: x, cy: y, r, fill: mix(base, "#000000", 0.15) });
    out += el("path", { d: blob(g, x, y, r * 0.87, r * 0.87, 2, 0.03, 0.04), fill: base });
    const tg = g.fork(`cookie${x}${y}`);
    if (kind === "chip" || kind === "chocolate") {
      let d = "";
      for (const [px, py] of spread(tg, x, y, r * 0.62, 7)) d += s`M${px} ${py}h0.01`;
      out += el("path", {
        d,
        stroke: kind === "chip" ? "#4a2c1d" : "#f5ecd7",
        "stroke-width": r * 0.2,
        "stroke-linecap": "round",
      });
    } else if (kind === "sugar") {
      out += sprinkles(tg, x, y, 0, r * 0.68, 12, r * 0.18, SPRINKLES.slice(0, 4), r * 0.07);
    } else if (kind === "oat") {
      // Oat flakes and raisins
      let flakes = "";
      let raisins = "";
      spread(tg, x, y, r * 0.65, 9).forEach(([px, py], k) => {
        if (k % 3 === 0) raisins += s`M${px} ${py}h0.01`;
        else flakes += s`M${px - r * 0.07} ${py}l${r * 0.14} ${r * 0.04}`;
      });
      out += el("path", { d: flakes, stroke: "#ecd09c", "stroke-width": r * 0.08, "stroke-linecap": "round" });
      out += el("path", { d: raisins, stroke: "#4a2a3a", "stroke-width": r * 0.17, "stroke-linecap": "round" });
    } else if (kind === "jam") {
      out += el("circle", { cx: x, cy: y, r: r * 0.36, fill: mix(base, "#000000", 0.12) });
      out += el("circle", { cx: x, cy: y, r: r * 0.3, fill: "#c1121f" });
      out += el("circle", { cx: x - r * 0.1, cy: y - r * 0.1, r: r * 0.08, fill: "#fff", opacity: "0.4" });
    } else {
      out += el("path", {
        d: blob(tg, x, y, r * 0.7, r * 0.7, 2, 0.04, 0.04),
        fill: tg.pick(["#f7c6d0", "#fbf4e8", "#c9a7eb", "#8fd3f4"]),
      });
    }
  }
  const order = Object.keys(COOKIES).filter(k => kinds.has(k));
  const where = tray ? "on a baking tray" : "on a plate";
  const count = capitalize(numberWord(spots.length));
  note.alt(
    order.length === 1
      ? `${count} ${COOKIES[order[0]][1]} cookies ${where}`
      : `${count} cookies ${where}: ${andList(order.map(k => COOKIES[k][1]))}`,
  );
  note.focus(cx, cy);
  return out;
});
