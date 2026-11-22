import { defineKind, el, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { glowDef, pine, starDots } from "./shared";

/**
 * A tent beside a campfire under mountains or tall pines, at dusk or on a starry night.
 *
 * @category Landscapes
 */
export const campsite = /* @__PURE__ */ defineKind("campsite", "Campsite", (g, w, h, note) => {
  const night = g.chance(0.55);
  const backdrop = g.pick(["mountains", "pines"] as const);
  const unit = Math.min(w, h);
  const hue = g.f(220, 250);
  const skyId = g.id("sky");
  const fireGlow = g.id("glow");
  const lantern = g.id("lantern");
  const stops = night
    ? [hsl(hue, 50, 8), hsl(hue + 10, 40, 20)]
    : [hsl(g.f(235, 260), 35, 28), hsl(g.f(300, 330), 30, 46), hsl(g.f(18, 32), 75, 66)];
  let out = el(
    "defs",
    {},
    lin(skyId, stops),
    glowDef(fireGlow, hsl(30, 100, 60), 0.45),
    glowDef(lantern, hsl(42, 100, 70), 0.5),
  );
  out += fill(w, h, `url(#${skyId})`);
  const groundY = h * g.f(0.62, 0.7);
  out += starDots(g, w, groundY * (night ? 0.8 : 0.4), night ? g.i(30, 45) : g.i(4, 8), unit);
  if (night && g.chance(0.6)) {
    // A crescent moon.
    const mx = w * g.f(0.1, 0.9);
    const my = groundY * g.f(0.15, 0.3);
    const mr = unit * g.f(0.035, 0.05);
    out += el("path", {
      d: s`M${mx} ${my - mr}A${mr} ${mr} 0 1 0 ${mx} ${my + mr}A${mr * 0.75} ${mr} 0 1 1 ${mx} ${my - mr}Z`,
      fill: hsl(50, 60, 90),
    });
  }
  const shade = (k: number) => (night ? hsl(hue, 25, 18 - 5 * k) : hsl(hue + 20, 20, 34 - 7 * k));
  if (backdrop === "mountains") {
    // Two dark ranges behind the camp.
    for (let range = 0; range < 2; range++) {
      const amp = groundY * (0.5 - 0.15 * range);
      const steps = g.i(3, 5);
      const ridge: Point[] = [[0, groundY - amp * g.f(0.2, 0.5)]];
      for (let step = 1; step < steps * 2; step++) {
        const x = (w * step) / (steps * 2) + g.f(-0.25, 0.25) * (w / (steps * 2));
        ridge.push([x, groundY - amp * (step % 2 ? g.f(0.6, 1) : g.f(0.15, 0.4))]);
      }
      ridge.push([w, groundY - amp * g.f(0.2, 0.5)], [w, groundY + 1], [0, groundY + 1]);
      out += el("polygon", { points: pts(ridge), fill: shade(range) });
    }
  } else {
    // Two rows of pines along the edge of the clearing.
    for (let row = 0; row < 2; row++) {
      let trees = "";
      for (
        let x = g.f(-0.02, 0.02) * w;
        x < w * 1.02;
        x += unit * g.f(0.05, 0.09) * Math.sqrt(Math.max(1, w / h / 1.4))
      ) {
        const ht = groundY * (row ? g.f(0.3, 0.45) : g.f(0.45, 0.6));
        // Two tiers, drawn relative to keep the path short.
        const a = ht * 0.22;
        trees += s`M${x - a} ${groundY + 1}l${a * 0.62} ${-ht * 0.5}h${-a * 0.24}l${a * 0.62} ${-ht * 0.5}
                   l${a * 0.62} ${ht * 0.5}h${-a * 0.24}l${a * 0.62} ${ht * 0.5}Z`;
      }
      out += el("path", { d: trees, fill: shade(row) });
    }
  }
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: hsl(g.f(90, 140), 25, night ? 15 : 24) });
  // Where the tent and fire stand.
  const tw = unit * g.f(0.3, 0.38);
  const th = tw * g.f(0.6, 0.72);
  const side = g.pick([-1, 1]);
  const pc = w * g.f(0.42, 0.58);
  // The tent's far side runs back away from the fire, so keep it and the fire inside the picture.
  const margin = unit * 0.04;
  const reach = tw / 2 + tw * 0.45;
  const tx = Math.max(
    side > 0 ? reach + margin : tw / 2 + margin,
    Math.min(side > 0 ? w - tw * 1.2 - margin : w - reach - margin, pc - side * tw * 0.4),
  );
  const ty = groundY + (h - groundY) * g.f(0.3, 0.45);
  const fx = tx + side * tw * 1.05;
  const fy = Math.min(ty + unit * g.f(0.03, 0.06), h - unit * 0.06);
  out += el("circle", { cx: fx, cy: fy - unit * 0.05, r: unit * 0.5, fill: `url(#${fireGlow})` });
  // The tent: its side running back away from the fire, then the front with its door.
  const away = -side;
  const ex = tx + (away * tw) / 2;
  const dd = tw * 0.45;
  const dz = tw * 0.12;
  const canvas = hsl(g.f(0, 360), g.f(45, 65), night ? 36 : 42);
  out += el("ellipse", {
    cx: tx + away * dd * 0.5,
    cy: ty,
    rx: tw * 0.8,
    ry: tw * 0.07,
    fill: "#000",
    opacity: "0.25",
  });
  out += el("polygon", {
    points: pts([
      [ex, ty],
      [tx, ty - th],
      [tx + away * dd, ty - th - dz],
      [ex + away * dd, ty - dz],
    ]),
    fill: canvas,
  });
  out += el("polygon", {
    points: pts([
      [ex, ty],
      [tx, ty - th],
      [tx + away * dd, ty - th - dz],
      [ex + away * dd, ty - dz],
    ]),
    fill: "#000",
    opacity: "0.3",
  });
  const front = pts([
    [tx - tw / 2, ty],
    [tx, ty - th],
    [tx + tw / 2, ty],
  ]);
  out += el("polygon", { points: front, fill: canvas });
  out += el("polygon", { points: front, fill: hsl(35, 100, 60), opacity: "0.15" });
  const lit = g.chance(0.5);
  if (lit) out += el("circle", { cx: tx, cy: ty - th * 0.3, r: tw * 0.5, fill: `url(#${lantern})` });
  out += el("polygon", {
    points: pts([
      [tx - tw * 0.17, ty],
      [tx, ty - th * 0.72],
      [tx + tw * 0.17, ty],
    ]),
    fill: lit ? hsl(42, 90, 66) : hsl(hue, 30, 10),
  });
  // Guy lines out to pegs.
  out += el("path", {
    d: s`M${tx} ${ty - th}L${tx - tw * 0.75} ${ty + unit * 0.005}M${tx} ${ty - th}L${tx + tw * 0.75} ${ty + unit * 0.005}`,
    stroke: "#fff",
    "stroke-width": unit * 0.003,
    opacity: "0.35",
  });
  // A log to sit on, beyond the fire.
  const seat = g.chance(0.5) && fx + side * unit * 0.2 > unit * 0.05 && fx + side * unit * 0.2 < w - unit * 0.05;
  if (seat) {
    const sx = fx + side * unit * 0.14;
    out += el("rect", {
      x: sx - unit * 0.06,
      y: fy - unit * 0.035,
      width: unit * 0.12,
      height: unit * 0.03,
      rx: unit * 0.015,
      fill: hsl(25, 35, 24),
    });
  }
  // The fire: a ring of stones, crossed logs, flames and sparks.
  const fr = unit * g.f(0.05, 0.065);
  out += el("ellipse", { cx: fx, cy: fy, rx: fr * 1.3, ry: fr * 0.3, fill: "#000", opacity: "0.3" });
  out += el("path", {
    d: s`M${fx - fr} ${fy - fr * 0.05}L${fx + fr * 0.8} ${fy - fr * 0.4}M${fx + fr} ${fy - fr * 0.05}L${fx - fr * 0.8} ${fy - fr * 0.4}`,
    stroke: hsl(25, 40, 22),
    "stroke-width": fr * 0.25,
    "stroke-linecap": "round",
  });
  const flame = (lean: number, ht: number, r: number) =>
    s`M${fx - r} ${fy - fr * 0.2}Q${fx - r} ${fy - ht * 0.5} ${fx + lean} ${fy - ht}Q${fx + r} ${fy - ht * 0.5} ${fx + r} ${fy - fr * 0.2}Z`;
  const fh = fr * g.f(2, 2.6);
  out += el("path", { d: flame(g.f(-0.2, 0.2) * fr, fh, fr * 0.7), fill: hsl(18, 100, 55) });
  out += el("path", { d: flame(g.f(-0.2, 0.2) * fr, fh * 0.7, fr * 0.48), fill: hsl(35, 100, 60) });
  out += el("path", { d: flame(0, fh * 0.4, fr * 0.26), fill: hsl(50, 100, 78) });
  let stones = "";
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * (k / 6);
    const x = fx - Math.cos(a) * fr * 1.1;
    const y = fy - fr * 0.05 + Math.sin(a) * fr * 0.25;
    const r = fr * 0.22;
    stones += s`M${x - r} ${y}a${r} ${r * 0.7} 0 1 0 ${2 * r} 0a${r} ${r * 0.7} 0 1 0 ${-2 * r} 0`;
  }
  out += el("path", { d: stones, fill: hsl(hue, 8, night ? 32 : 40) });
  let sparks = "";
  for (let k = g.i(3, 6); k > 0; k--) {
    const r = unit * 0.004;
    const x = fx + fr * g.f(-0.8, 0.8);
    const y = fy - fh * g.f(1.1, 2);
    sparks += s`M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  out += el("path", { d: sparks, fill: hsl(45, 100, 75) });
  // Tall pines framing the camp at the edges, left out where one would hide the tent or the fire.
  const campLeft = Math.min(tx - tw / 2 - (away < 0 ? dd : 0), fx - fr * 1.5);
  const campRight = Math.max(tx + tw / 2 + (away > 0 ? dd : 0), fx + fr * 1.5);
  for (const edge of [-1, 1]) {
    if (g.chance(0.45)) continue;
    const x = edge < 0 ? w * g.f(0, 0.08) : w * g.f(0.92, 1);
    const ht = Math.min(h * 0.85, unit * g.f(0.55, 0.75));
    if (x + ht * 0.21 > campLeft && x - ht * 0.21 < campRight) continue;
    out += pine(x, groundY + (h - groundY) * g.f(0.2, 0.4), ht, ht * 0.42, hsl(hue, 25, night ? 6 : 12));
  }
  note.alt(
    `A tent beside a campfire ${backdrop === "mountains" ? "below mountains" : "among tall pines"} ${night ? "on a starry night" : "at dusk"}`,
  );
  note.focus(fx, fy - fh * 0.5);
  return out;
});
