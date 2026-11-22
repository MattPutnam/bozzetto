import { defineKind, el, hsl, lin, type Point, pts, qpt, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { numberWord } from "../../draw/words";
import { bowDef, bowKnot, byColor, compact, dots, giftBox, glow, paper } from "./shared";

/** A five-pointed star centered at (cx, cy). */
const star = (cx: number, cy: number, r: number, paint: string): string =>
  el("polygon", {
    points: pts(
      Array.from({ length: 10 }, (_, k): Point => {
        const a = (k * Math.PI) / 5 - Math.PI / 2;
        const rr = k % 2 ? r * 0.45 : r;
        return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
      }),
    ),
    fill: paint,
  });

/**
 * A decorated evergreen by a window in a cozy room: baubles, string lights, a topper and gifts underneath.
 *
 * @category Holidays
 */
export const holidayTree = /* @__PURE__ */ defineKind("holiday-tree", "Holiday tree", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wallHue = g.pick([g.f(-20, 45), g.f(-20, 45), g.f(190, 235), g.f(250, 285)]);
  const floorY = h * g.f(0.8, 0.84);
  const glowId = g.id("glow");
  const nightId = g.id("night");
  const nightHue = g.f(215, 240);
  const bowId = g.id("bow");
  let defs =
    bowDef(bowId) + glow(glowId, "#ffd98a", 0.45) + lin(nightId, [hsl(nightHue, 45, 16), hsl(nightHue + 10, 40, 34)]);
  let out = table(g, w, h, floorY, hsl(wallHue, g.f(15, 28), g.f(34, 46)), hsl(g.f(18, 35), g.f(30, 40), g.f(26, 36)));
  out += el("rect", { y: floorY - unit * 0.025, width: w, height: unit * 0.025, fill: "#000", opacity: "0.15" });
  // The tree's size and place, the window beside it.
  const side = g.pick([-1, 1]);
  const starR = unit * g.f(0.045, 0.055);
  const apex = h * 0.05 + starR * 1.5;
  const potH = unit * 0.08;
  const potBase = floorY + unit * 0.03;
  const bottom = potBase - potH - unit * 0.02;
  const th = bottom - apex;
  const tw = Math.min(th * g.f(0.62, 0.72), w * 0.75);
  const tx = w / 2 - side * Math.min(w * g.f(0.08, 0.16), (w - tw) / 2 - unit * 0.02);
  const ww = unit * g.f(0.28, 0.34);
  const wh = Math.min(ww * 1.3, floorY - h * 0.2);
  const wx = Math.max(ww * 0.6, Math.min(w - ww * 0.6, tx + side * (tw / 2 + ww * 0.6 + unit * 0.04)));
  const wy = h * 0.12;
  // The window: snow falling on a night garden, behind a frame and sill.
  const frame = g.chance(0.6) ? hsl(40, 25, 92) : hsl(g.f(20, 35), 35, 32);
  out += el("rect", {
    x: wx - ww / 2 - unit * 0.015,
    y: wy - unit * 0.015,
    width: ww + unit * 0.03,
    height: wh + unit * 0.03,
    fill: frame,
  });
  out += el("rect", { x: wx - ww / 2, y: wy, width: ww, height: wh, fill: `url(#${nightId})` });
  out += el("path", {
    d: s`M${wx - ww / 2} ${wy + wh * 0.82}Q${wx} ${wy + wh * 0.72} ${wx + ww / 2} ${wy + wh * 0.8}V${wy + wh}H${wx - ww / 2}Z`,
    fill: hsl(nightHue, 25, 82),
  });
  const flakes: Point[] = [];
  for (let k = 0; k < 9; k++) flakes.push([wx + ww * g.f(-0.45, 0.45), wy + wh * g.f(0.05, 0.75)]);
  out += dots(flakes, unit * 0.006, "#fff", "0.85");
  out += el("path", {
    d: s`M${wx} ${wy}v${wh}M${wx - ww / 2} ${wy + wh * 0.45}h${ww}`,
    stroke: frame,
    "stroke-width": unit * 0.014,
  });
  out += el("rect", {
    x: wx - ww / 2 - unit * 0.035,
    y: wy + wh,
    width: ww + unit * 0.07,
    height: unit * 0.025,
    fill: frame,
  });
  out += el("rect", {
    x: wx - ww / 2 - unit * 0.035,
    y: wy + wh + unit * 0.025,
    width: ww + unit * 0.07,
    height: unit * 0.01,
    fill: "#000",
    opacity: "0.15",
  });
  // A warm glow around the tree.
  out += el("ellipse", { cx: tx, cy: apex + th * 0.55, rx: tw * 1.1, ry: th * 0.75, fill: `url(#${glowId})` });
  // The trunk and its pot or crate.
  const bark = hsl(g.f(18, 30), 35, 26);
  out += el("rect", {
    x: tx - unit * 0.02,
    y: bottom - unit * 0.04,
    width: unit * 0.04,
    height: unit * 0.08,
    fill: bark,
  });
  const potW = unit * g.f(0.13, 0.17);
  out += el("ellipse", { cx: tx, cy: potBase, rx: potW * 0.75, ry: unit * 0.015, fill: "#000", opacity: "0.2" });
  const potPaint = g.chance(0.5) ? hsl(g.f(0, 360), 40, 45) : hsl(g.f(20, 35), 40, 40);
  out += el("polygon", {
    points: pts([
      [tx - potW / 2, potBase - potH],
      [tx + potW / 2, potBase - potH],
      [tx + potW * 0.4, potBase],
      [tx - potW * 0.4, potBase],
    ]),
    fill: potPaint,
  });
  out += el("rect", {
    x: tx - potW * 0.53,
    y: potBase - potH,
    width: potW * 1.06,
    height: potH * 0.2,
    fill: "#000",
    opacity: "0.15",
  });
  // Tiers of branches, lowest first so each tier above overlaps the one below.
  const tiers = g.i(3, 4);
  const green = g.f(130, 160);
  const half = (y: number) => ((y - apex) / th) * (tw / 2);
  for (let k = tiers - 1; k >= 0; k--) {
    const yb = apex + (th * (k + 1)) / tiers;
    const yt = k === 0 ? apex : apex + ((th * k) / tiers) * 0.55;
    const hw = (tw / 2) * (0.35 + (0.65 * (k + 1)) / tiers);
    const scallops = 2 + k;
    let d = s`M${tx} ${yt}L${tx + hw} ${yb}`;
    for (let j = 0; j < scallops; j++) {
      const x0 = tx + hw - (2 * hw * j) / scallops;
      const x1 = tx + hw - (2 * hw * (j + 1)) / scallops;
      d += s`Q${(x0 + x1) / 2} ${yb + th * 0.04} ${x1} ${yb}`;
    }
    out += el("path", { d: d + "Z", fill: hsl(green, 38, 24 + (tiers - k) * 3) });
  }
  // String lights draped across the tree.
  const strands = g.i(2, 4);
  const lightHue = g.f(0, 360);
  const warm = g.chance(0.35);
  let wire = "";
  const bulbs: [Point, string][] = [];
  for (let k = 0; k < strands; k++) {
    const y = apex + th * (0.22 + (0.68 * (k + g.f(0.3, 0.7))) / strands);
    const y2 = y + th * 0.08;
    const a: Point = [tx - half(y) * 0.92, y];
    const b: Point = [tx + half(y2) * 0.92, y2];
    const c: Point = [tx, (y + y2) / 2 + th * 0.07];
    wire += s`M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
    const count = Math.max(4, Math.round((b[0] - a[0]) / (unit * 0.05)));
    for (let j = 0; j < count; j++)
      bulbs.push([qpt(a, c, b, (j + 0.5) / count), warm ? "#ffe6a8" : hsl(lightHue + (bulbs.length % 4) * 90, 85, 68)]);
  }
  out += el("path", { d: wire, stroke: "#000", opacity: "0.25", "stroke-width": unit * 0.004, fill: "none" });
  // Baubles hung among the branches.
  const baubleHue = g.f(0, 360);
  const baubles: Point[] = [];
  const baubleR = unit * g.f(0.017, 0.022);
  const want = Math.round(g.f(8, 13) * (tw / (unit * 0.5)));
  for (let tries = 0; tries < want * 6 && baubles.length < want; tries++) {
    const y = apex + th * g.f(0.22, 0.95);
    const x = tx + half(y) * g.f(-0.8, 0.8);
    if (baubles.some(([bx, by]) => Math.hypot(bx - x, by - y) < baubleR * 3.2)) continue;
    baubles.push([x, y]);
  }
  const balls = byColor();
  for (const [x, y] of baubles) balls.add(hsl(baubleHue + g.pick([0, 0, 120, 200]), 65, 55), s`M${x} ${y}h0`);
  for (const [color, d] of balls.groups)
    out += el("path", { d, stroke: color, "stroke-width": baubleR * 2, "stroke-linecap": "round" });
  out += dots(
    baubles.map(([x, y]): Point => [x - baubleR * 0.35, y - baubleR * 0.35]),
    unit * 0.006,
    "#fff",
    "0.5",
  );
  out += dots(
    bulbs.map(([p]) => p),
    unit * 0.016,
    "#fff2c8",
    "0.3",
  );
  for (const color of new Set(bulbs.map(([, c]) => c)))
    out += dots(
      bulbs.filter(([, c]) => c === color).map(([p]) => p),
      unit * 0.008,
      color,
    );
  // The topper.
  const topper = g.chance(0.75) ? "star" : "bow";
  if (topper === "star") {
    out += el("circle", { cx: tx, cy: apex - starR * 0.2, r: starR * 2, fill: `url(#${glowId})` });
    out += star(tx, apex - starR * 0.2, starR, hsl(g.f(42, 50), 90, 62));
  } else {
    out += bowKnot(tx, apex + starR * 0.3, starR * 0.8, paper(g).ribbon);
  }
  // Presents on the floor under the branches.
  const presents = g.i(2, 3);
  const rows = ["", ""];
  let shadows = "";
  const span = Math.min(tw * 1.1, w * 0.9);
  const sizes = Array.from({ length: presents }, () => unit * g.f(0.09, 0.15));
  const sum = sizes.reduce((a, b) => a + b * 1.3, 0);
  let x = tx - Math.min(span, sum) / 2;
  for (let k = 0; k < presents; k++) {
    const bw = sizes[k];
    const b = potBase + unit * (k % 2 ? 0.05 : 0.02);
    const [def, shadow, box] = giftBox(
      g.id(`p${k}`),
      x,
      b,
      bw,
      bw * g.f(0.6, 1),
      bw * 0.28,
      paper(g),
      unit * 0.035,
      g.chance(0.75) && bowId,
    );
    defs += def;
    shadows += shadow;
    rows[k % 2] += box;
    x += (Math.min(span, sum) / sum) * bw * 1.3;
  }
  out += el("path", { d: shadows, fill: "#000", opacity: "0.15" }) + rows.join("");
  note.alt(
    `A decorated tree with ${topper === "star" ? "a star" : "a bow"} on top and string lights beside a snowy window, ${numberWord(presents)} presents underneath`,
  );
  note.focus(tx, apex + th * 0.4);
  return compact(el("defs", {}, defs) + out);
});
