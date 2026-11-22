import { defineKind, el, fill, mix, type Point, pts, s } from "../../draw/core";
import { andList } from "../../draw/words";
import { BOARDS, spread } from "./shared";

const CHEESES: [string, string][] = [
  // Paste and rind
  ["#f6d365", "#e0b04a"],
  ["#f2b84b", "#d9962e"],
  ["#fbeec1", "#e8d39a"],
  ["#f7e3a1", "#c0392b"],
];

/**
 * A cheese board from above: cheeses, crackers, grapes and more on a wooden or slate board.
 *
 * @category Food
 */
export const cheeseBoard = /* @__PURE__ */ defineKind("cheese-board", "Cheese board", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = fill(w, h, g.pick(["#e9dccb", "#d9cbb5", "#dfe7e2", "#f1e6d2", "#c89a64", "#a87444", "#e3e6ea"]));
  const slate = g.chance(0.2);
  const board = slate ? "#3f454c" : g.pick(BOARDS);
  const bw = w * 0.9;
  const bh = h * 0.84;
  const bx = (w - bw) / 2;
  const by = (h - bh) / 2;
  const corner = unit * 0.05;
  out += el("rect", {
    x: bx + unit * 0.012,
    y: by + unit * 0.025,
    width: bw,
    height: bh,
    rx: corner,
    fill: "#000",
    opacity: "0.15",
  });
  out += el("rect", { x: bx, y: by, width: bw, height: bh, rx: corner, fill: board });
  if (!slate) {
    // Grain along the board
    let d = "";
    const along = bw >= bh;
    for (let k = 0; k < 7; k++) {
      const off = g.f(0.05, 0.95);
      const from = g.f(0.02, 0.4);
      const len = g.f(0.3, 0.55);
      d += along
        ? s`M${bx + bw * from} ${by + bh * off}h${bw * len}`
        : s`M${bx + bw * off} ${by + bh * from}v${bh * len}`;
    }
    out += el("path", { d, stroke: "#000", "stroke-width": unit * 0.005, opacity: "0.08", "stroke-linecap": "round" });
  }
  // Six spots on a grid shaped like the board, each holding one thing
  const aspect = bw / bh;
  const rows = Math.max(1, Math.round(Math.sqrt(6 / aspect)));
  const cols = Math.round(6 / rows);
  const cw = bw / cols;
  const ch = bh / rows;
  const rr = Math.min(cw, ch) * 0.48;
  const extras = ["brie", "slices", "nuts", "blue", "figs"];
  for (let k = extras.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [extras[k], extras[j]] = [extras[j], extras[k]];
  }
  const honey = g.chance(0.8);
  const items = ["wedge", "crackers", "grapes", ...(honey ? ["honey"] : []), ...extras].slice(0, rows * cols);
  for (let k = items.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [items[k], items[j]] = [items[j], items[k]];
  }
  const ig = g.fork("items");
  const shadow = (d: string, dx = rr * 0.03, dy = rr * 0.06) =>
    el("path", { d, fill: "#000", opacity: "0.15", transform: s`translate(${dx} ${dy})` });
  const sector = (x: number, y: number, a: number, len: number, span: number) =>
    s`M ${x} ${y} L ${x + Math.cos(a - span) * len} ${y + Math.sin(a - span) * len}
      A ${len} ${len} 0 0 1 ${x + Math.cos(a + span) * len} ${y + Math.sin(a + span) * len} Z`;
  items.forEach((item, k) => {
    const x = bx + cw * ((k % cols) + 0.5) + cw * ig.f(-0.06, 0.06);
    const y = by + ch * (Math.floor(k / cols) + 0.5) + ch * ig.f(-0.06, 0.06);
    const a = ig.f(0, Math.PI * 2);
    if (item === "wedge" || item === "blue") {
      // A wedge lying on its side: rind along the curved back, holes or veins in the paste
      const [paste, rind] = item === "blue" ? ["#f1ecd9", "#ddd3b6"] : ig.pick(CHEESES);
      const len = rr * 1.65;
      const tx = x - Math.cos(a) * len * 0.58;
      const ty = y - Math.sin(a) * len * 0.58;
      out += shadow(sector(tx, ty, a, len, 0.42));
      out += el("path", { d: sector(tx, ty, a, len, 0.42), fill: rind });
      out += el("path", { d: sector(tx, ty, a, len * 0.9, 0.4), fill: paste });
      let d = "";
      for (const [px, py] of spread(
        ig,
        x - Math.cos(a) * len * 0.05,
        y - Math.sin(a) * len * 0.05,
        rr * 0.3,
        item === "blue" ? 8 : 3,
      ))
        d += s`M${px} ${py}h0.01`;
      if (item === "blue" || ig.chance(0.5))
        out += el("path", {
          d,
          stroke: item === "blue" ? "#6f88a6" : mix(paste, "#000000", 0.12),
          "stroke-width": rr * (item === "blue" ? 0.08 : 0.16),
          "stroke-linecap": "round",
        });
    } else if (item === "slices") {
      // Slices fanned out, each overlapping the last
      const [paste] = ig.pick(CHEESES.slice(0, 3));
      const side = rr * 0.85;
      const squares: Point[][] = [];
      for (let j = 0; j < 4; j++) {
        const sx = x + Math.cos(a) * rr * (j - 1.5) * 0.32;
        const sy = y + Math.sin(a) * rr * (j - 1.5) * 0.32;
        const b = a + j * 0.14;
        const [ux, uy] = [(Math.cos(b) * side) / 2, (Math.sin(b) * side) / 2];
        squares.push([
          [sx - ux + uy, sy - uy - ux],
          [sx + ux + uy, sy + uy - ux],
          [sx + ux - uy, sy + uy + ux],
          [sx - ux - uy, sy - uy + ux],
        ]);
      }
      out += el("path", {
        d: squares.map(q => `M${pts(q).replace(/ /g, "L")}Z`).join(""),
        fill: "#000",
        opacity: "0.12",
        transform: s`translate(${rr * 0.03} ${rr * 0.06})`,
      });
      for (const q of squares)
        out += el("polygon", {
          points: pts(q),
          fill: paste,
          stroke: mix(paste, "#000000", 0.1),
          "stroke-width": side * 0.03,
          "stroke-linejoin": "round",
        });
    } else if (item === "brie") {
      // A wheel with a wedge cut and pulled out a little
      const r = rr * 0.8;
      const span = 0.38;
      const cut = s`M ${x} ${y} L ${x + Math.cos(a + span) * r} ${y + Math.sin(a + span) * r}
                    A ${r} ${r} 0 1 1 ${x + Math.cos(a - span) * r} ${y + Math.sin(a - span) * r} Z`;
      out += shadow(cut);
      out += el("path", {
        d: cut,
        fill: "#f6f1e4",
        stroke: "#efd99a",
        "stroke-width": rr * 0.05,
        "stroke-linejoin": "round",
      });
      out += el("circle", { cx: x, cy: y, r: r * 0.75, fill: "#000", opacity: "0.03" });
      const ox = x + Math.cos(a) * rr * 0.15;
      const oy = y + Math.sin(a) * rr * 0.15;
      out += shadow(sector(ox, oy, a, r, span * 0.9));
      out += el("path", {
        d: sector(ox, oy, a, r, span * 0.9),
        fill: "#f6f1e4",
        stroke: "#efd99a",
        "stroke-width": rr * 0.05,
        "stroke-linejoin": "round",
      });
    } else if (item === "crackers") {
      const round = ig.chance(0.6);
      const color = ig.pick(["#e3b06a", "#d9a15b", "#ecc88a"]);
      const cr = rr * 0.38;
      const b = a + Math.PI / 4;
      const [ux, uy] = [Math.cos(b) * cr, Math.sin(b) * cr];
      let dots = "";
      for (let j = 0; j < 5; j++) {
        const px = x + Math.cos(a) * rr * (j - 2) * 0.28;
        const py = y + Math.sin(a) * rr * (j - 2) * 0.28;
        const square: Point[] = [
          [px - ux + uy, py - uy - ux],
          [px + ux + uy, py + uy - ux],
          [px + ux - uy, py + uy + ux],
          [px - ux - uy, py - uy + ux],
        ];
        const shape = (fillColor: string, dx: number, dy: number, op?: string) =>
          round
            ? el("circle", { cx: px + dx, cy: py + dy, r: cr, fill: fillColor, opacity: op })
            : el("polygon", {
                points: pts(square.map(([qx, qy]): Point => [qx + dx, qy + dy])),
                fill: fillColor,
                opacity: op,
              });
        out += shape("#000", rr * 0.03, rr * 0.05, "0.12");
        out += shape(color, 0, 0);
        // Docking holes, on the one on top
        if (j === 4)
          for (const [u, v] of [
            [-0.4, -0.4],
            [0.4, -0.4],
            [-0.4, 0.4],
            [0.4, 0.4],
            [0, 0],
          ])
            dots += s`M${px + (u * ux - v * uy) * 1.1} ${py + (u * uy + v * ux) * 1.1}h0.01`;
      }
      out += el("path", {
        d: dots,
        stroke: mix(color, "#000000", 0.25),
        "stroke-width": cr * 0.12,
        "stroke-linecap": "round",
      });
    } else if (item === "grapes") {
      // A bunch, widest at the stem, with each grape lit from the top left
      const grape = ig.pick(["#7a3b69", "#a8c66c", "#9b2d4a"]);
      const gr = rr * 0.19;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      const spots: Point[] = [];
      [4, 4, 3, 2, 1].forEach((count, row) => {
        for (let j = 0; j < count; j++) {
          const along = -rr * 0.68 + row * gr * 1.55;
          const across = (j - (count - 1) / 2) * gr * 1.75 + ig.f(-0.1, 0.1) * gr;
          spots.push([x + ux * along - uy * across, y + uy * along + ux * across]);
        }
      });
      out += el("path", {
        d: s`M ${x - ux * rr * 0.95} ${y - uy * rr * 0.95} L ${x - ux * rr * 0.4} ${y - uy * rr * 0.4}`,
        stroke: "#7a5a3a",
        "stroke-width": rr * 0.06,
        "stroke-linecap": "round",
      });
      let shadows = "";
      for (const [px, py] of spots) shadows += s`M${px + gr * 0.15} ${py + gr * 0.3}h0.01`;
      out += el("path", {
        d: shadows,
        stroke: "#000",
        "stroke-width": gr * 2,
        "stroke-linecap": "round",
        opacity: "0.12",
      });
      let dots = "";
      let shine = "";
      for (const [px, py] of spots) {
        dots += s`M${px} ${py}h0.01`;
        shine += s`M${px - gr * 0.35} ${py - gr * 0.35}h0.01`;
      }
      out += el("path", { d: dots, stroke: grape, "stroke-width": gr * 2, "stroke-linecap": "round" });
      out += el("path", {
        d: shine,
        stroke: "#fff",
        "stroke-width": gr * 0.5,
        "stroke-linecap": "round",
        opacity: "0.35",
      });
    } else if (item === "nuts") {
      // Almonds in a little bowl
      const r = rr * 0.82;
      const bowl = ig.pick(["#fbfaf4", "#2b5d8a", "#d8ebe4", "#c96f4a"]);
      out += el("circle", { cx: x + rr * 0.03, cy: y + rr * 0.06, r, fill: "#000", opacity: "0.15" });
      out += el("circle", { cx: x, cy: y, r, fill: bowl });
      out += el("circle", { cx: x, cy: y, r: r * 0.86, fill: mix(bowl, "#000000", 0.15) });
      let d = "";
      for (const [px, py] of spread(ig, x, y, r * 0.6, 10)) {
        const b = ig.f(0, Math.PI);
        d += s`M${px - Math.cos(b) * r * 0.08} ${py - Math.sin(b) * r * 0.08}l${Math.cos(b) * r * 0.16} ${Math.sin(b) * r * 0.16}`;
      }
      out += el("path", { d, stroke: "#b9824f", "stroke-width": r * 0.2, "stroke-linecap": "round" });
    } else if (item === "honey") {
      // A pot of honey, its dipper resting on the rim
      const r = rr * 0.62;
      const pot = ig.pick(["#f3e6d0", "#fbfaf4", "#d8ebe4"]);
      out += el("circle", { cx: x + rr * 0.03, cy: y + rr * 0.06, r, fill: "#000", opacity: "0.15" });
      out += el("circle", { cx: x, cy: y, r, fill: pot });
      out += el("circle", { cx: x, cy: y, r: r * 0.8, fill: "#e8a628" });
      out += el("ellipse", {
        cx: x - r * 0.3,
        cy: y - r * 0.3,
        rx: r * 0.22,
        ry: r * 0.12,
        fill: "#fff",
        opacity: "0.35",
      });
      const ex = x + Math.cos(a) * rr * 1.05;
      const ey = y + Math.sin(a) * rr * 1.05;
      out += el("path", {
        d: s`M ${x + Math.cos(a) * r * 0.2} ${y + Math.sin(a) * r * 0.2} L ${ex} ${ey}`,
        stroke: "#000",
        "stroke-width": rr * 0.1,
        "stroke-linecap": "round",
        opacity: "0.15",
        transform: s`translate(${rr * 0.03} ${rr * 0.06})`,
      });
      out += el("path", {
        d: s`M ${x + Math.cos(a) * r * 0.2} ${y + Math.sin(a) * r * 0.2} L ${ex} ${ey}`,
        stroke: "#c8955c",
        "stroke-width": rr * 0.1,
        "stroke-linecap": "round",
      });
    } else {
      // Figs cut in half
      const n = 3;
      for (let j = 0; j < n; j++) {
        const b = a + (j * Math.PI * 2) / n;
        const px = x + Math.cos(b) * rr * 0.45;
        const py = y + Math.sin(b) * rr * 0.45;
        const fr = rr * 0.36;
        const turn = ig.f(0, 360);
        const rot = s`rotate(${turn} ${px} ${py})`;
        const fig = s`M ${px} ${py - fr * 1.25} C ${px + fr * 0.5} ${py - fr * 1.1} ${px + fr} ${py - fr * 0.3} ${px + fr} ${py + fr * 0.15}
          A ${fr} ${fr * 0.95} 0 0 1 ${px - fr} ${py + fr * 0.15}
          C ${px - fr} ${py - fr * 0.3} ${px - fr * 0.5} ${py - fr * 1.1} ${px} ${py - fr * 1.25} Z`;
        out += el("path", {
          d: fig,
          fill: "#000",
          opacity: "0.15",
          transform: s`translate(${fr * 0.08} ${fr * 0.16}) ${rot}`,
        });
        out += el("path", { d: fig, fill: "#6b3a5e", transform: rot });
        // The flesh, a little below the middle (turned with the fig)
        const fx = px - Math.sin((turn * Math.PI) / 180) * fr * 0.12;
        const fy = py + Math.cos((turn * Math.PI) / 180) * fr * 0.12;
        out += el("circle", { cx: fx, cy: fy, r: fr * 0.8, fill: "#e8b0a0" });
        out += el("circle", { cx: fx, cy: fy, r: fr * 0.55, fill: "#c44d6b" });
      }
    }
  });
  // Sprigs of rosemary or a few loose almonds where four spots meet
  const fg = g.fork("filler");
  const sprig = fg.chance(0.5);
  for (let i = 1; i < cols; i++)
    for (let j = 1; j < rows; j++) {
      const x = bx + cw * i;
      const y = by + ch * j;
      const a = fg.f(0, Math.PI);
      const len = Math.min(cw, ch) * 0.3;
      if (sprig) {
        const ux = Math.cos(a) * len;
        const uy = Math.sin(a) * len;
        let d = s`M${x - ux} ${y - uy}L${x + ux} ${y + uy}`;
        for (let k = 1; k < 8; k++) {
          const f = -1 + (k * 2) / 8;
          const px = x + ux * f;
          const py = y + uy * f;
          for (const side of [-1, 1])
            d += s`M${px} ${py}l${(-uy * side + ux * 0.6) * 0.22} ${(ux * side + uy * 0.6) * 0.22}`;
        }
        out += el("path", { d, stroke: "#4f7a3a", "stroke-width": len * 0.06, "stroke-linecap": "round" });
      } else {
        let d = "";
        for (let k = 0; k < 3; k++) {
          const px = x + fg.f(-0.5, 0.5) * len;
          const py = y + fg.f(-0.5, 0.5) * len;
          const b = fg.f(0, Math.PI);
          d += s`M${px - Math.cos(b) * len * 0.1} ${py - Math.sin(b) * len * 0.1}l${Math.cos(b) * len * 0.2} ${Math.sin(b) * len * 0.2}`;
        }
        out += el("path", { d, stroke: "#b9824f", "stroke-width": len * 0.26, "stroke-linecap": "round" });
      }
    }
  const names: Record<string, string> = {
    wedge: "a wedge of cheese",
    blue: "a veined cheese",
    slices: "sliced cheese",
    brie: "a cut wheel of brie",
    crackers: "crackers",
    grapes: "grapes",
    nuts: "a bowl of almonds",
    honey: "a pot of honey",
    figs: "figs",
  };
  const order = ["wedge", "blue", "brie", "slices", "crackers", "grapes", "figs", "nuts", "honey"].filter(i =>
    items.includes(i),
  );
  note.alt(`A cheese board with ${andList(order.map(i => names[i]))}`);
  note.focus(w / 2, h / 2);
  return out;
});
