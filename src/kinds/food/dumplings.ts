import { defineKind, el, fill, mix, type Point, pts, s } from "../../draw/core";
import { sprinkles } from "../../draw/shapes";
import { andList } from "../../draw/words";
import { spread, topPlate } from "./shared";

/** A pleated round dumpling `r` across, seen from above. */
function roundDumpling(x: number, y: number, r: number, color: string, twist: number): string {
  let out = el("circle", { cx: x + r * 0.06, cy: y + r * 0.12, r, fill: "#000", opacity: "0.15" });
  out += el("circle", { cx: x, cy: y, r, fill: color });
  // Pleats gathered and twisted into a knot on top
  let d = "";
  for (let k = 0; k < 8; k++) {
    const a = twist + (k * Math.PI * 2) / 8;
    const b = a + 0.9;
    d += s`M ${x + Math.cos(a) * r * 0.88} ${y + Math.sin(a) * r * 0.88}
           Q ${x + Math.cos(a + 0.5) * r * 0.55} ${y + Math.sin(a + 0.5) * r * 0.55} ${x + Math.cos(b) * r * 0.14} ${y + Math.sin(b) * r * 0.14}`;
  }
  out += el("path", {
    d,
    stroke: mix(color, "#000000", 0.14),
    "stroke-width": r * 0.05,
    fill: "none",
    "stroke-linecap": "round",
  });
  return out + el("circle", { cx: x, cy: y, r: r * 0.13, fill: mix(color, "#000000", 0.08) });
}

/** A half-moon dumpling `len` long, lying at (x, y) with its pleated edge turned `rot` degrees from up. */
function crescentDumpling(x: number, y: number, len: number, color: string, rot: number, browned: boolean): string {
  const l = len / 2;
  const hgt = len * 0.6;
  const shape = s`M ${-l} ${hgt * 0.2} Q 0 ${-hgt * 0.05} ${l} ${hgt * 0.2} C ${l * 0.9} ${-hgt * 0.9} ${-l * 0.9} ${-hgt * 0.9} ${-l} ${hgt * 0.2} Z`;
  // Pleats just inside the curved edge
  let pleats = "";
  for (let k = 0; k < 5; k++) {
    const u = -0.6 + k * 0.3;
    const edge = -hgt * 0.62 * (1 - u * u);
    pleats += s`M ${u * l} ${edge * 0.65} L ${u * l * 1.08} ${edge * 0.95}`;
  }
  return el(
    "g",
    { transform: s`translate(${x} ${y}) rotate(${rot})` },
    el("path", { d: shape, fill: "#000", opacity: "0.15", transform: s`translate(${len * 0.03} ${len * 0.06})` }),
    el("path", { d: shape, fill: color, stroke: mix(color, "#000000", 0.25), "stroke-width": len * 0.025 }),
    browned
      ? el("ellipse", { cx: 0, cy: -hgt * 0.12, rx: l * 0.68, ry: hgt * 0.26, fill: "#c98a4a", opacity: "0.75" })
      : "",
    el("path", {
      d: pleats,
      stroke: mix(color, "#000000", 0.28),
      "stroke-width": len * 0.03,
      "stroke-linecap": "round",
    }),
  );
}

/** Dumplings from above: in a bamboo steamer, or in rows on a plate, with dipping sauce and chopsticks. */
export const dumplings = /* @__PURE__ */ defineKind("dumplings", "Dumplings", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wide = w >= h;
  const main = wide ? w : h;
  const cross = wide ? h : w;
  let out = fill(w, h, g.pick(["#c89a64", "#a87444", "#2f3a3a", "#e9dccb", "#d9cbb5", "#dfe7e2"]));
  const steamer = g.chance(0.55);
  const dish = g.chance(steamer ? 0.7 : 0.85);
  const sticks = g.chance(0.65);
  // What lies beside, in a row along the long side of the picture
  const items: ["dish" | "sticks", number][] = [];
  if (dish) items.push(["dish", unit * 0.26]);
  if (sticks && (items.length === 0 || main >= cross * 1.4)) items.push(["sticks", unit * 0.1]);
  const gap = unit * 0.06;
  const beside = items.reduce((sum, [, size]) => sum + gap + size, 0);
  const R = Math.min(unit * (items.length ? 0.41 : 0.44), (main * 0.94 - beside) / 2);
  let along = main / 2 - beside / 2;
  const cx = wide ? along : w / 2;
  const cy = wide ? h / 2 : along;
  along += R;
  const sauce = (x: number, y: number, r: number) => {
    const bowl = g.pick(["#fbfaf4", "#2b5d8a", "#1f2328", "#d8ebe4"]);
    let d = el("circle", { cx: x + r * 0.05, cy: y + r * 0.1, r, fill: "#000", opacity: "0.15" });
    d += el("circle", { cx: x, cy: y, r, fill: bowl });
    d += el("circle", { cx: x, cy: y, r: r * 0.78, fill: "#4a2414" });
    const sg = g.fork("sauce");
    let oil = "";
    for (const [px, py] of spread(sg, x, y, r * 0.6, 5)) oil += s`M${px} ${py}h0.01`;
    if (sg.chance(0.6))
      d += el("path", {
        d: oil,
        stroke: "#c8501e",
        "stroke-width": r * 0.18,
        "stroke-linecap": "round",
        opacity: "0.75",
      });
    d += sprinkles(sg, x, y, 0, r * 0.62, 7, r * 0.07, ["#f3e6c0"], r * 0.05);
    if (sg.chance(0.6)) {
      let rings = "";
      for (const [px, py] of spread(sg, x, y, r * 0.55, 4))
        rings += s`M${px - r * 0.06} ${py}a${r * 0.06} ${r * 0.06} 0 1 0 ${r * 0.12} 0a${r * 0.06} ${r * 0.06} 0 1 0 ${-r * 0.12} 0`;
      d += el("path", { d: rings, stroke: "#7bc043", "stroke-width": r * 0.04, fill: "none" });
    }
    return (
      d + el("ellipse", { cx: x - r * 0.3, cy: y - r * 0.35, rx: r * 0.2, ry: r * 0.1, fill: "#fff", opacity: "0.3" })
    );
  };
  const dough = g.pick(["#f6efe1", "#fbf6ec", "#f3ead8", "#e8efd6"]);
  let style: string;
  if (steamer) {
    // The steamer: a bamboo ring, then a liner of paper or a cabbage leaf
    out += el("circle", { cx: cx + R * 0.03, cy: cy + R * 0.06, r: R, fill: "#000", opacity: "0.18" });
    out += el("circle", { cx, cy, r: R, fill: "#d9b07a" });
    out += el("circle", { cx, cy, r: R * 0.95, fill: "none", stroke: "#b98250", "stroke-width": R * 0.015 });
    out += el("circle", { cx, cy, r: R * 0.89, fill: "#c8955c" });
    const leaf = g.chance(0.4);
    out += el("circle", { cx, cy, r: R * 0.84, fill: leaf ? "#c5dd9a" : "#f4ecd8" });
    if (!leaf) {
      let holes = "";
      for (const [px, py] of spread(g, cx, cy, R * 0.78, 22)) holes += s`M${px} ${py}h0.01`;
      out += el("path", {
        d: holes,
        stroke: "#000",
        "stroke-width": R * 0.025,
        "stroke-linecap": "round",
        opacity: "0.12",
      });
    } else {
      let veins = "";
      for (let k = 0; k < 7; k++) {
        const a = (k * Math.PI * 2) / 7;
        veins += s`M${cx} ${cy}l${Math.cos(a) * R * 0.8} ${Math.sin(a) * R * 0.8}`;
      }
      out += el("path", { d: veins, stroke: "#eef5d8", "stroke-width": R * 0.025, opacity: "0.8" });
    }
    // A ring of dumplings, with one in the middle when there are six or more
    const count = g.i(4, 8);
    const centered = count >= 6;
    const m = centered ? count - 1 : count;
    const ringK = Math.max(centered ? 2.1 : 0, 1.1 / Math.sin(Math.PI / m));
    const c = (R * 0.8) / (ringK + 1);
    const a0 = g.f(0, Math.PI * 2);
    const dg = g.fork("dumplings");
    if (centered) out += roundDumpling(cx, cy, c, dough, dg.f(0, 6));
    for (let k = 0; k < m; k++) {
      const a = a0 + (k * Math.PI * 2) / m;
      out += roundDumpling(
        cx + Math.cos(a) * c * ringK,
        cy + Math.sin(a) * c * ringK,
        c * dg.f(0.94, 1),
        dough,
        dg.f(0, 6),
      );
    }
    style = "Pleated dumplings in a bamboo steamer";
  } else {
    out += topPlate(cx, cy, R, g.pick(["#ffffff", "#ffffff", "#1f2328", "#d8ebe4", "#2b5d8a"]));
    const browned = g.chance(0.5);
    // Two or three overlapping rows, the back row first, turned a little as a whole
    const rows = g.i(2, 3);
    const per = rows === 3 ? 3 : g.i(3, 4);
    const step = 0.62;
    const rise = 0.5;
    const bw = 1 + step * (per - 1);
    const bh = 0.5 + rise * (rows - 1);
    const len = Math.min((R * 1.55) / bw, (R * 1.2) / bh);
    const turn = g.f(-15, 15);
    const ca = Math.cos((turn * Math.PI) / 180);
    const sa = Math.sin((turn * Math.PI) / 180);
    const dg = g.fork("dumplings");
    for (let row = 0; row < rows; row++)
      for (let k = 0; k < per; k++) {
        const u = (k * step - (bw - 1) / 2) * len + dg.f(-0.03, 0.03) * len;
        const v = (row * rise - (bh - 0.5) / 2 + 0.1) * len;
        out += crescentDumpling(cx + u * ca - v * sa, cy + u * sa + v * ca, len, dough, turn + dg.f(-6, 6), browned);
      }
    style = `${browned ? "Pan-fried" : "Steamed"} dumplings in rows on a plate`;
  }
  // What lies beside
  for (const [item, size] of items) {
    along += gap + size / 2;
    const [x, y]: Point = wide ? [along, h / 2] : [w / 2, along];
    along += size / 2;
    if (item === "dish") out += sauce(x, y, size / 2);
    else {
      // A pair of chopsticks lying lengthwise across the row
      const len = Math.min(cross * 0.84, R * 2.1);
      const color = g.pick(["#8b5a3c", "#c23b22", "#2b2b2b", "#e8d5b0"]);
      let d = "";
      for (const side of [-1, 1]) {
        const u = side * size * 0.22;
        const tip = side * size * 0.08;
        const poly: Point[] = [
          [u - unit * 0.014, -len / 2],
          [u + unit * 0.014, -len / 2],
          [tip + unit * 0.007, len / 2],
          [tip - unit * 0.007, len / 2],
        ];
        d += `M${pts(poly.map(([p, q]): Point => (wide ? [x + p, y + q] : [x + q, y + p]))).replace(/ /g, "L")}Z`;
      }
      out += el("path", { d, fill: "#000", opacity: "0.15", transform: s`translate(${unit * 0.01} ${unit * 0.018})` });
      out += el("path", { d, fill: color, stroke: color, "stroke-width": unit * 0.004, "stroke-linejoin": "round" });
    }
  }
  const side = items.map(([item]) => (item === "dish" ? "a dish of dipping sauce" : "chopsticks"));
  note.alt(`${style}${side.length ? `, ${andList(side)} beside it` : ""}`);
  note.focus(cx, cy);
  return out;
});
