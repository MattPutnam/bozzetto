import { defineKind, el, facing, fill, hsl, lin, type Point, pts, type Rand, s } from "../../draw/core";
import { curve } from "./shared";

/** A tiny animal silhouette standing at (x, y), `ht` tall, facing right. */
function beast(kind: "giraffe" | "elephant" | "antelope", x: number, y: number, ht: number, paint: string) {
  const line = { fill: "none", stroke: paint, "stroke-linecap": "round" };
  let out = "";
  if (kind === "giraffe") {
    const by = y - ht * 0.55;
    const bw = ht * 0.4;
    out += el("path", {
      d: s`M${x - bw * 0.38} ${by}L${x - bw * 0.42} ${y}M${x - bw * 0.2} ${by}L${x - bw * 0.16} ${y}
           M${x + bw * 0.24} ${by}L${x + bw * 0.22} ${y}M${x + bw * 0.4} ${by}L${x + bw * 0.46} ${y}`,
      ...line,
      "stroke-width": ht * 0.045,
    });
    out += el("path", {
      d: s`M${x + bw * 0.3} ${by - ht * 0.04}L${x + bw * 0.62} ${y - ht * 0.93}`,
      ...line,
      "stroke-width": ht * 0.08,
    });
    out += el("ellipse", {
      cx: x,
      cy: by - ht * 0.02,
      rx: bw * 0.55,
      ry: ht * 0.1,
      fill: paint,
      transform: s`rotate(-12 ${x} ${by})`,
    });
    out += el("ellipse", { cx: x + bw * 0.74, cy: y - ht * 0.92, rx: ht * 0.07, ry: ht * 0.035, fill: paint });
  } else if (kind === "elephant") {
    const legs = [-0.36, -0.16, 0.14, 0.32]
      .map(f => s`M${x + ht * f - ht * 0.065} ${y}h${ht * 0.13}v${-ht * 0.45}h${-ht * 0.13}Z`)
      .join("");
    out += el("path", { d: legs, fill: paint });
    out += el("ellipse", { cx: x, cy: y - ht * 0.55, rx: ht * 0.5, ry: ht * 0.3, fill: paint });
    out += el("circle", { cx: x + ht * 0.5, cy: y - ht * 0.62, r: ht * 0.2, fill: paint });
    out += el("path", {
      d: s`M${x + ht * 0.62} ${y - ht * 0.55}Q${x + ht * 0.74} ${y - ht * 0.3} ${x + ht * 0.7} ${y - ht * 0.08}`,
      ...line,
      "stroke-width": ht * 0.08,
    });
  } else {
    const by = y - ht * 0.5;
    out += el("path", {
      d: s`M${x - ht * 0.22} ${by}L${x - ht * 0.24} ${y}M${x - ht * 0.12} ${by}L${x - ht * 0.08} ${y}
           M${x + ht * 0.14} ${by}L${x + ht * 0.12} ${y}M${x + ht * 0.24} ${by}L${x + ht * 0.28} ${y}
           M${x + ht * 0.25} ${by - ht * 0.05}L${x + ht * 0.36} ${by - ht * 0.32}L${x + ht * 0.3} ${by - ht * 0.52}`,
      ...line,
      "stroke-width": ht * 0.05,
    });
    out += el("ellipse", { cx: x, cy: by - ht * 0.04, rx: ht * 0.3, ry: ht * 0.12, fill: paint });
    out += el("ellipse", { cx: x + ht * 0.38, cy: by - ht * 0.3, rx: ht * 0.08, ry: ht * 0.05, fill: paint });
  }
  return out;
}

/** A flat-topped crown `cw` wide: a gently curved underside at `cy` with a row of low puffs on top. */
function crown(g: Rand, cx: number, cy: number, cw: number, ch: number): string {
  const n = g.i(3, 5);
  const r = cw / n / 2;
  let d = s`M${cx - cw / 2} ${cy}Q${cx} ${cy + ch * 0.3} ${cx + cw / 2} ${cy}`;
  for (let k = 0; k < n; k++) d += s`a${r} ${ch * g.f(0.7, 1)} 0 0 0 ${-2 * r} 0`;
  return d + "Z";
}

/** A flat-topped acacia whose trunk base sits at (x, y), `ht` tall; `leaf` colors the crown: its top, middle and underside. */
function acacia(g: Rand, x: number, y: number, ht: number, bark: string, leaf: readonly string[], far = false): string {
  const fork: Point = [x + ht * g.f(-0.08, 0.08), y - ht * g.f(0.38, 0.5)];
  const cy = y - ht * g.f(0.78, 0.86);
  const cw = ht * g.f(1.3, 1.7);
  const ch = ht * g.f(0.16, 0.22);
  const tw = ht * 0.035;
  let out = el("polygon", {
    points: pts([
      [x - tw, y],
      [fork[0] - tw * 0.6, fork[1]],
      [fork[0] + tw * 0.6, fork[1]],
      [x + tw, y],
    ]),
    fill: bark,
  });
  // Branches spreading up from the fork to the crown.
  let d = "";
  for (const f of [-0.32, 0, 0.3]) {
    const end: Point = [x + cw * f * g.f(0.8, 1.1), cy];
    d += s`M${fork[0]} ${fork[1]}Q${(fork[0] + end[0]) / 2 + f * ht * 0.1} ${(fork[1] + cy) / 2} ${end[0]} ${end[1]}`;
  }
  out += el("path", { d, fill: "none", stroke: bark, "stroke-width": tw * 1.1, "stroke-linecap": "round" });
  // The crown: a darker underside, the canopy, and light on its top. A far tree is too small to show them.
  const ccx = x + cw * g.f(-0.08, 0.08);
  if (far) return out + el("path", { d: crown(g, ccx, cy, cw, ch), fill: leaf[1] });
  out += el("path", { d: crown(g, ccx, cy + ch * 0.2, cw * 0.96, ch * 0.8), fill: leaf[2] });
  out += el("path", { d: crown(g, ccx, cy, cw, ch), fill: leaf[1] });
  out += el("path", { d: crown(g, ccx - cw * 0.04, cy - ch * 0.4, cw * 0.7, ch * 0.6), fill: leaf[0] });
  return out;
}

/**
 * Open grassland with flat-topped acacias under a big sky, animals small on the horizon.
 *
 * @category Landscapes
 */
export const savanna = /* @__PURE__ */ defineKind("savanna", "Savanna", (g, w, h, note) => {
  const time = g.pick(["day", "golden", "sunset"] as const);
  const unit = Math.min(w, h);
  const hue = g.f(195, 215);
  const skyId = g.id("sky");
  const grassId = g.id("grass");
  const horizon = h * g.f(0.6, 0.68);
  const stops =
    time === "day"
      ? [hsl(hue, 55, 62), hsl(hue - 5, 50, 88)]
      : time === "golden"
        ? [hsl(hue + 10, 40, 64), hsl(g.f(36, 46), 80, 84)]
        : [hsl(g.f(260, 285), 30, 36), hsl(g.f(8, 22), 75, 62), hsl(g.f(36, 46), 95, 76)];
  const sunset = time === "sunset";
  const grassHue = g.f(36, 52);
  const grass = sunset
    ? [hsl(grassHue - 15, 40, 34), hsl(grassHue - 20, 35, 24)]
    : [hsl(grassHue, 50, time === "day" ? 66 : 60), hsl(grassHue - 6, 55, time === "day" ? 52 : 46)];
  let out = el("defs", {}, lin(skyId, stops), lin(grassId, grass));
  out += fill(w, h, `url(#${skyId})`);
  const sunR = unit * (sunset ? g.f(0.1, 0.14) : g.f(0.05, 0.07));
  const sunX = w * g.f(0.2, 0.8);
  out += el("circle", {
    cx: sunX,
    cy: time === "day" ? horizon * g.f(0.2, 0.4) : horizon - sunR * (sunset ? g.f(0.2, 0.8) : g.f(1.5, 3)),
    r: sunR,
    fill: sunset ? hsl(g.f(25, 40), 95, 80) : hsl(48, 100, 92),
  });
  // Low hills far off, and the plain.
  const hills = curve(w, horizon - h * g.f(0, 0.04), horizon - h * g.f(0, 0.04), -h * g.f(0.01, 0.04));
  out += el("path", {
    d: hills.d() + s`V${h}H0Z`,
    fill: sunset ? hsl(g.f(270, 300), 20, 38) : hsl(hue + 10, 18, 66),
  });
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${grassId})` });
  // Lighter streaks of grass across the plain.
  for (let k = g.i(2, 4); k > 0; k--) {
    const y = horizon + (h - horizon) * g.f(0.1, 0.7);
    out += el("ellipse", {
      cx: w * g.f(0, 1),
      cy: y,
      rx: w * g.f(0.2, 0.45),
      ry: unit * 0.012,
      fill: "#fff",
      opacity: "0.08",
    });
  }
  const dark = hsl(20, 25, 12);
  const bark = sunset ? dark : hsl(25, 25, 28);
  const leafHue = g.f(75, 110);
  const leaf = sunset
    ? [dark, dark, hsl(20, 25, 8)]
    : [hsl(leafHue, 35, 42), hsl(leafHue, 32, 33), hsl(leafHue, 30, 24)];
  // Small acacias on the horizon.
  for (let k = g.i(1, 3); k > 0; k--) {
    const ht = unit * g.f(0.06, 0.1);
    out += acacia(g, w * g.f(0.05, 0.95), horizon + unit * 0.01, ht, bark, leaf, true);
  }
  // The animals, small in the distance.
  const herd = g.pick(["giraffe", "elephant", "antelope"] as const);
  const herdX = w * g.f(0.2, 0.8);
  const dir = g.pick([-1, 1]);
  const count = herd === "antelope" ? g.i(3, 4) : g.i(2, 3);
  const size = unit * (herd === "giraffe" ? 0.09 : herd === "elephant" ? 0.06 : 0.035);
  const paint = sunset ? dark : hsl(25, 25, 22);
  // The whole herd faces one way.
  out += facing(herdX, dir);
  for (let k = 0; k < count; k++) {
    const scale = herd === "elephant" && k === count - 1 ? 0.6 : g.f(0.85, 1.05);
    const x = herdX + (k - count / 2) * size * g.f(0.8, 1.4);
    out += beast(herd, x, horizon + (h - horizon) * g.f(0.08, 0.14), size * scale, paint);
  }
  out += "</g>";
  // The main acacia in the foreground, sometimes with a second further back.
  const side = g.pick([-1, 1]);
  const tx = w / 2 + side * w * g.f(0.15, 0.3);
  const ty = h * g.f(0.84, 0.92);
  const tht = Math.min(unit * g.f(0.42, 0.55), ty * 0.82);
  const second = g.chance(0.5);
  if (second) {
    const sx = w / 2 - side * w * g.f(0.18, 0.35);
    const sy = horizon + (h - horizon) * g.f(0.35, 0.5);
    out += el("ellipse", { cx: sx, cy: sy, rx: tht * 0.4, ry: tht * 0.04, fill: "#000", opacity: "0.12" });
    out += acacia(g, sx, sy, tht * g.f(0.45, 0.6), bark, leaf);
  }
  out += el("ellipse", { cx: tx, cy: ty, rx: tht * 0.7, ry: tht * 0.06, fill: "#000", opacity: "0.15" });
  out += acacia(g, tx, ty, tht, bark, leaf);
  // Tufts of tall grass in the foreground.
  let tufts = "";
  for (let k = g.i(3, 6); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = horizon + (h - horizon) * g.f(0.55, 1);
    const th = unit * g.f(0.03, 0.05);
    tufts += s`M${x - th * 0.3} ${y - th * 0.8}L${x} ${y}L${x + th * 0.05} ${y - th}M${x} ${y}L${x + th * 0.35} ${y - th * 0.75}`;
  }
  out += el("path", {
    d: tufts,
    fill: "none",
    stroke: sunset ? hsl(grassHue - 20, 35, 16) : hsl(grassHue - 4, 50, 38),
    "stroke-width": unit * 0.005,
    "stroke-linecap": "round",
  });
  const animals = { giraffe: "giraffes", elephant: "elephants", antelope: "antelope" }[herd];
  const when = time === "day" ? "under a big sky" : time === "golden" ? "in low evening light" : "at sunset";
  note.alt(`Flat-topped acacia trees on open grassland ${when}, ${animals} in the distance`);
  note.focus(tx, ty - tht * 0.8);
  return out;
});
