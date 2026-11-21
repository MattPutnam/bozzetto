import { defineKind, el, hsl, mix, type Point, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { CITRUS, fruitWheel, spread, vessel } from "./shared";

/** A strawberry `r` across its shoulders, centered on (x, y) and turned `rot` degrees from tip-down. */
function strawberry(x: number, y: number, r: number, rot: number): string {
  let seeds = "";
  for (const [u, v] of [
    [-0.45, -0.3],
    [0, -0.35],
    [0.45, -0.3],
    [-0.25, 0.15],
    [0.25, 0.15],
    [0, 0.6],
  ])
    seeds += s`M${u * r} ${v * r}h0.01`;
  return el(
    "g",
    { transform: s`translate(${x} ${y}) rotate(${rot})` },
    el("path", {
      d: s`M 0 ${r * 1.1} C ${-r * 1.15} ${r * 0.3} ${-r * 1.1} ${-r * 0.85} 0 ${-r * 0.7}
           C ${r * 1.1} ${-r * 0.85} ${r * 1.15} ${r * 0.3} 0 ${r * 1.1} Z`,
      fill: "#e0384f",
    }),
    el("path", { d: seeds, stroke: "#f7e08a", "stroke-width": r * 0.1, "stroke-linecap": "round" }),
    el("path", {
      d: s`M ${-r * 0.65} ${-r * 0.62} L ${-r * 0.2} ${-r * 0.55} L 0 ${-r * 0.4} L ${r * 0.2} ${-r * 0.55}
           L ${r * 0.65} ${-r * 0.62} L ${r * 0.25} ${-r * 0.8} L 0 ${-r * 1.05} L ${-r * 0.25} ${-r * 0.8} Z`,
      fill: "#5aa547",
    }),
  );
}

const SMOOTHIES = ["#f28aa0", "#c2416b", "#8e5aa8", "#f6b941", "#9cc95a", "#f3e6cf", "#f39a6b", "#e8d27a"];

/** A smoothie in a tall glass or a jar with a straw, layered or swirled, fruit on the rim and beside it. */
export const smoothie = /* @__PURE__ */ defineKind("smoothie", "Smoothie", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const jar = g.chance(0.4);
  const layered = g.chance(0.5);
  const pool = [...SMOOTHIES];
  const colors: string[] = [];
  for (let k = 0; k < 3; k++) colors.push(pool.splice(g.i(0, pool.length - 1), 1)[0]);
  const rim = g.pick(["strawberry", "citrus", "kiwi"] as const);
  const side = g.pick(["strawberries", "banana", "blueberries", "kiwi"] as const);
  const r0 = jar ? 0.15 : 0.13;
  const h0 = jar ? 0.46 : 0.5;
  const fw0 = { strawberries: 0.3, banana: 0.36, blueberries: 0.2, kiwi: 0.26 }[side];
  const gap0 = 0.06;
  // The row: fruit on the rim hanging past the glass, the glass, a gap and the fruit beside it
  const row0 = 0.07 + r0 * 2 + gap0 + fw0;
  const S = Math.min(unit * Math.min(1.4, 0.84 / (h0 + 0.16)), (w * 0.9) / row0);
  const R = r0 * S;
  const H = h0 * S;
  const cx = w / 2 - (row0 * S) / 2 + 0.07 * S + R;
  const baseY = Math.min(h * 0.92, h / 2 + (H + S * 0.14) / 2 + S * 0.02);
  const rimY = baseY - H;
  const tilt = 0.2;
  let out = table(g, w, h, Math.max(h * 0.08, baseY - unit * 0.14), hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  out += el("ellipse", { cx, cy: baseY, rx: R * 1.08, ry: R * 0.22, fill: "#000", opacity: "0.15" });
  const half = jar
    ? (t: number) => R * (t < 0.06 ? 0.88 : t < 0.12 ? 0.88 + ((t - 0.06) / 0.06) * 0.12 : 1)
    : (t: number) => R * (1 - 0.12 * t);
  const wallW = S * 0.012;
  const outer = vessel(cx, rimY, baseY - half(1) * tilt, half, tilt);
  const innerBot = baseY - S * 0.03 - half(1) * tilt;
  const inner = vessel(cx, rimY, innerBot, t => half(t) - wallW, tilt);
  const level = jar ? 0.13 : 0.07;
  const levelY = rimY + (innerBot - rimY) * level;
  out += el("path", { d: outer, fill: "#ffffff", opacity: "0.45" });
  const clip = g.id("smoothie");
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: inner })));
  let body = el("rect", { x: cx - R * 1.2, y: levelY, width: R * 2.4, height: baseY - levelY, fill: colors[0] });
  const sg = g.fork("swirl");
  const layers = sg.i(2, 3);
  if (layered) {
    for (let k = 1; k < layers; k++) {
      const y = innerBot - ((innerBot - levelY) * k) / layers;
      const amp = S * 0.014;
      let d = s`M ${cx - R * 1.2} ${levelY - S * 0.05} L ${cx - R * 1.2} ${y}`;
      for (let j = 0; j < 4; j++) {
        const x0 = cx - R * 1.2 + j * R * 0.6;
        d += s` Q ${x0 + R * 0.3} ${y + (j % 2 ? amp : -amp) * sg.f(0.6, 1.4)} ${x0 + R * 0.6} ${y}`;
      }
      d += s` L ${cx + R * 1.2} ${levelY - S * 0.05} Z`;
      body += el("path", { d, fill: colors[k] });
    }
  } else {
    // Ribbons of a second flavor swirled through the first
    let d = "";
    for (let k = 0; k < 3; k++) {
      const y = levelY + (innerBot - levelY) * (0.2 + k * 0.3);
      d += s`M ${cx - R * 1.1} ${y + S * 0.05} C ${cx - R * 0.3} ${y - S * 0.08} ${cx + R * 0.3} ${y + S * 0.1} ${cx + R * 1.1} ${y - S * 0.04}`;
    }
    body += el("path", { d, stroke: colors[1], "stroke-width": R * 0.32, fill: "none", opacity: "0.9" });
  }
  const sr = half(level) - wallW;
  const top = mix(layered ? colors[layers - 1] : colors[0], "#ffffff", 0.2);
  body += el("ellipse", { cx, cy: levelY, rx: sr, ry: sr * tilt, fill: top });
  if (g.chance(0.5)) {
    // Seeds or granola sprinkled on top
    let d = "";
    for (const [x, y] of spread(sg, cx, levelY, sr * 0.8, 9, tilt)) d += s`M${x} ${y}h0.01`;
    body += el("path", {
      d,
      stroke: sg.pick(["#2b2b2b", "#c8955c"]),
      "stroke-width": S * 0.014,
      "stroke-linecap": "round",
    });
  }
  out += el("g", { "clip-path": `url(#${clip})` }, body);
  // A thick straw, coming up out of the smoothie
  const strawColor = g.pick(["#f25c78", "#4fb4e6", "#7bd389", "#fbfaf4", "#2b2b2b"]);
  const strawD = s`M ${cx + sr * 0.2} ${levelY} L ${cx + R * 0.65} ${rimY - S * 0.14}`;
  out += el("path", { d: strawD, stroke: strawColor, "stroke-width": S * 0.028, "stroke-linecap": "round" });
  if (g.chance(0.5))
    out += el("path", {
      d: strawD,
      stroke: strawColor === "#fbfaf4" ? "#f25c78" : "#ffffff",
      "stroke-width": S * 0.028,
      "stroke-dasharray": `${Math.max(1, Math.round(S * 0.02))} ${Math.max(1, Math.round(S * 0.02))}`,
      opacity: "0.8",
    });
  // Fruit on the rim, on the side away from the straw
  const gr = S * 0.055;
  const rx = cx - R * 0.88;
  if (rim === "strawberry") out += strawberry(cx - R * 0.95, rimY + gr * 0.05, gr, -15);
  else if (rim === "kiwi") out += fruitWheel(rx, rimY - gr * 0.4, gr * 1.2, "#8b6a3e", "#8cc152", true);
  else {
    const [rind, flesh] = g.pick(CITRUS);
    out += fruitWheel(rx, rimY - gr * 0.4, gr * 1.2, rind, flesh);
  }
  // The glass in front
  out += el("path", { d: outer, fill: "none", stroke: "#ffffff", "stroke-width": unit * 0.007, opacity: "0.85" });
  if (jar) {
    let d = "";
    for (const t of [0.015, 0.035, 0.055]) {
      const y = rimY + H * t;
      d += s`M ${cx - half(0) * 0.98} ${y + R * 0.05} Q ${cx} ${y + R * tilt * 1.2} ${cx + half(0) * 0.98} ${y}`;
    }
    out += el("path", { d, stroke: "#ffffff", "stroke-width": S * 0.01, fill: "none", opacity: "0.8" });
  }
  out += el("path", {
    d: s`M ${cx - R * 0.68} ${rimY + H * 0.2} L ${cx - R * 0.68} ${rimY + H * 0.65}`,
    stroke: "#ffffff",
    "stroke-width": S * 0.016,
    "stroke-linecap": "round",
    opacity: "0.5",
  });
  // Fruit on the table beside the glass, resting on it
  const fg = g.fork("fruit");
  const fx = cx + R + gap0 * S;
  const ground = baseY + S * 0.02;
  const fwid = fw0 * S;
  if (side === "strawberries") {
    const n = fg.i(2, 3);
    const r = S * 0.055;
    for (let k = 0; k < n; k++)
      out += strawberry(
        fx + r + ((fwid - r * 2) * k) / (n - 1) + fg.f(-1, 1),
        ground - r * 0.95,
        r,
        fg.pick([-90, 90]) + fg.f(-10, 10),
      );
  } else if (side === "banana") {
    const bl = fwid;
    const bt = S * 0.075;
    const x0 = fx;
    const x1 = fx + bl;
    const xm = (x0 + x1) / 2;
    const yt = ground - bt * 0.9;
    out += el("ellipse", { cx: xm, cy: ground, rx: bl * 0.4, ry: bt * 0.18, fill: "#000", opacity: "0.12" });
    out += el("path", {
      d: s`M ${x0} ${yt} Q ${xm} ${2 * ground - yt} ${x1} ${yt} Q ${xm} ${2 * (ground - bt) - yt} ${x0} ${yt} Z`,
      fill: "#f6d365",
      stroke: "#f6d365",
      "stroke-width": bt * 0.25,
      "stroke-linejoin": "round",
    });
    out += el("path", {
      d: s`M ${x0 + bl * 0.12} ${yt + bt * 0.05} Q ${xm} ${ground - bt * 0.2} ${x1 - bl * 0.12} ${yt + bt * 0.05}`,
      stroke: "#e3b43f",
      "stroke-width": bt * 0.15,
      fill: "none",
    });
    out += el("path", {
      d: s`M ${x1 - bt * 0.1} ${yt + bt * 0.05} L ${x1 + bt * 0.35} ${yt - bt * 0.35}`,
      stroke: "#8a6a3a",
      "stroke-width": bt * 0.3,
      "stroke-linecap": "round",
    });
    out += el("circle", { cx: x0 + bt * 0.05, cy: yt, r: bt * 0.16, fill: "#5a3a1a" });
  } else if (side === "blueberries") {
    const r = S * 0.027;
    const spots: Point[] = [];
    for (let k = 0; k < 4; k++) spots.push([fx + r + k * r * 2.05, ground - r]);
    for (let k = 0; k < 2; k++) spots.push([fx + r * 2.05 + k * r * 2.05, ground - r * 2.75]);
    for (const [x, y] of spots) {
      const bx = x + fg.f(-0.1, 0.1) * r;
      out += el("circle", { cx: bx, cy: y, r, fill: "#3b4a8a" });
      out += el("circle", { cx: bx - r * 0.3, cy: y - r * 0.3, r: r * 0.25, fill: "#fff", opacity: "0.3" });
      out += el("circle", { cx: bx + r * 0.15, cy: y - r * 0.1, r: r * 0.22, fill: "#232d5a" });
    }
  } else {
    const n = fg.i(1, 2);
    const r = S * 0.065;
    for (let k = 0; k < n; k++) {
      const x = fx + r + k * r * 2.1;
      const y = ground - r;
      out += el("ellipse", { cx: x + r * 0.15, cy: y, rx: r * 0.95, ry: r, fill: "#8b6a3e" });
      out += el("ellipse", { cx: x, cy: y, rx: r * 0.85, ry: r * 0.95, fill: "#8cc152" });
      let d = "";
      for (let j = 0; j < 10; j++) {
        const a = (j * Math.PI) / 5;
        d += s`M${x + Math.cos(a) * r * 0.38} ${y + Math.sin(a) * r * 0.45}h0.01`;
      }
      out += el("ellipse", { cx: x, cy: y, rx: r * 0.25, ry: r * 0.3, fill: "#eef2c8" });
      out += el("path", { d, stroke: "#2b2b2b", "stroke-width": r * 0.09, "stroke-linecap": "round" });
    }
  }
  const rimText = { strawberry: "a strawberry", citrus: "a citrus wheel", kiwi: "a kiwi slice" }[rim];
  const sideText = { strawberries: "strawberries", banana: "a banana", blueberries: "blueberries", kiwi: "kiwi" }[side];
  note.alt(
    `A ${layered ? "layered" : "swirled"} smoothie in a ${jar ? "jar" : "tall glass"} with a straw and ${rimText} on the rim, ${sideText} beside it`,
  );
  note.focus(cx, (rimY + baseY) / 2);
  return out;
});
