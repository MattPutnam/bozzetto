import { defineKind, el, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { smoothClosed } from "../../draw/shapes";
import { cabin, curve, pine, PINE, PINE_SNOW, snowyPine, starDots, tight } from "./shared";

/** The northern lights rippling over a still lake or snowy hills on a starry night. */
export const aurora = /* @__PURE__ */ defineKind("aurora", "Northern lights", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.f(215, 240);
  const glow = g.f(120, 165);
  const tip = g.chance(0.5) ? g.f(275, 320) : glow + g.f(25, 45);
  const lake = g.chance(0.5);
  const shore = h * g.f(0.62, 0.72);
  // Repeated details are spaced wider on wide pictures, to keep the markup small.
  const spread = Math.sqrt(Math.max(1, w / h / 1.4));
  const skyId = g.id("sky");
  const veil = g.id("veil");
  const defs = [
    lin(skyId, [hsl(hue, 55, 6), hsl(hue + 10, 45, 14), hsl(hue + 15, 40, 24)]),
    el(
      "linearGradient",
      { id: veil, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": hsl(tip, 70, 60), "stop-opacity": 0 }),
      el("stop", { offset: 0.45, "stop-color": hsl(tip, 70, 62), "stop-opacity": 0.3 }),
      el("stop", { offset: 0.78, "stop-color": hsl(glow, 85, 60), "stop-opacity": 0.7 }),
      el("stop", { offset: 1, "stop-color": hsl(glow, 90, 70), "stop-opacity": 0.9 }),
    ),
  ];
  // The sky: stars, then curtains of light with rays rising from their lower edges.
  let sky = el("rect", { width: w, height: shore, fill: `url(#${skyId})` });
  sky += starDots(g, w, shore * 0.9, g.i(24, 38), unit);
  const ribbons = g.i(1, 3);
  let focusY = shore * 0.4;
  for (let r = 0; r < ribbons; r++) {
    const base = shore * g.f(0.45, 0.72) - r * shore * 0.12;
    const amp = shore * g.f(0.04, 0.09);
    const freq = g.f(0.8, 1.8);
    const tilt = shore * g.f(-0.25, 0.25);
    const tall = shore * g.f(0.25, 0.42);
    const p1 = g.f(0, 6);
    const p2 = g.f(0, 6);
    const bottom = (x: number) => base + amp * Math.sin(p1 + (freq * 2 * Math.PI * x) / w) + tilt * (x / w - 0.5);
    const topAt = (x: number) => bottom(x) - tall * (0.65 + 0.35 * Math.sin(p2 + (2.3 * Math.PI * x) / w));
    const lower: Point[] = [];
    const upper: Point[] = [];
    for (let k = 0; k <= 9; k++) {
      const x = -0.1 * w + (1.2 * w * k) / 9;
      lower.push([x, bottom(x)]);
      upper.unshift([x, topAt(x)]);
    }
    const d = tight(smoothClosed([...lower, ...upper]));
    sky += el("path", { d, fill: `url(#${veil})`, opacity: r ? g.f(0.5, 0.75) : 0.95 });
    let rays = "";
    for (let k = g.i(6, 10); k > 0; k--) {
      const x = w * g.f(0, 1);
      rays += s`M${x} ${bottom(x) - unit * 0.01}V${topAt(x) + tall * 0.2}`;
    }
    sky += el("path", { d: rays, stroke: hsl(glow, 80, 78), "stroke-width": unit * g.f(0.005, 0.01), opacity: "0.18" });
    if (!r) focusY = base - tall * 0.35;
  }
  let out = "";
  let alt: string;
  if (lake) {
    // A far shore of dark hills and pines, then everything above it mirrored in the water.
    const hill = curve(w, shore - h * g.f(0.02, 0.07), shore - h * g.f(0.02, 0.07), -h * g.f(0, 0.05));
    sky += el("path", { d: hill.d() + s`V${shore}H0Z`, fill: hsl(hue, 30, 10) });
    let trees = "";
    for (let x = g.f(0, 0.02) * w; x < w; x += unit * g.f(0.03, 0.06) * spread * 1.3) {
      const th = unit * g.f(0.03, 0.07);
      const by = hill.at(x) + unit * 0.01;
      trees += s`M${x - th * 0.25} ${by}l${th * 0.25} ${-th}l${th * 0.25} ${th}Z`;
    }
    sky += el("path", { d: trees, fill: hsl(hue, 30, 6) });
    const view = g.id("view");
    defs.push(el("g", { id: view }, sky));
    out += fill(w, h, hsl(hue, 40, 8));
    out += el("use", { href: `#${view}` });
    out += el("use", { href: `#${view}`, transform: s`matrix(1 0 0 -1 0 ${2 * shore})`, opacity: "0.75" });
    out += el("rect", { y: shore, width: w, height: h - shore, fill: hsl(hue, 40, 10), opacity: "0.3" });
    for (let k = g.i(3, 5); k > 0; k--)
      out += el("rect", {
        x: w * g.f(-0.1, 0.9),
        y: shore + (h - shore) * g.f(0.1, 0.9),
        width: w * g.f(0.1, 0.3),
        height: Math.max(1, unit * 0.004),
        fill: "#fff",
        opacity: "0.12",
      });
    // A snowy bank in one corner with a pine or two.
    const side = g.pick([-1, 1]);
    const bank = curve(w, h * (side < 0 ? 0.86 : 1.05), h * (side < 0 ? 1.05 : 0.86), -h * 0.03);
    out += el("path", { d: bank.d() + s`V${h + 1}H0Z`, fill: hsl(hue, 22, 34) });
    for (let k = g.i(1, 2); k > 0; k--) {
      const x = side < 0 ? w * g.f(0.02, 0.18) : w * g.f(0.82, 0.98);
      const ht = unit * g.f(0.28, 0.38);
      out += pine(x, bank.at(x) + ht * 0.04, ht, ht * 0.5, hsl(hue, 30, 7));
    }
    alt = "The northern lights rippling over a still lake on a starry night, mirrored in the water";
  } else {
    out += sky;
    // Snowy hills under the glow, with snow-laden pines and sometimes a cabin.
    const tree = g.id("pine");
    const snow = (light: number) => hsl(hue, 22, light);
    defs.push(
      el(
        "g",
        { id: tree },
        el("path", { d: `M${pts(PINE.map(([x, y]): Point => [x * 100, y * 100]))}Z` }),
        el("path", { d: PINE_SNOW, fill: snow(62) }),
      ),
    );
    const far = curve(w, shore - h * g.f(0, 0.05), shore - h * g.f(0, 0.05), -h * g.f(0.02, 0.06));
    const near = curve(w, h * g.f(0.8, 0.86), h * g.f(0.8, 0.86), -h * g.f(0, 0.05));
    out += el("path", { d: far.d() + s`V${h}H0Z`, fill: hsl(glow, 14, 38) });
    for (let x = g.f(0, 0.05) * w; x < w; x += unit * g.f(0.05, 0.12) * spread) {
      const ht = unit * g.f(0.06, 0.11);
      out += snowyPine(tree, x, far.at(x) + ht * 0.1, ht, ht * 0.55, hsl(hue, 25, 12));
    }
    out += el("path", { d: near.d() + s`V${h}H0Z`, fill: snow(52) });
    const cabinX = w * g.f(0.25, 0.75);
    const cw = unit * g.f(0.18, 0.24);
    const lit = g.chance(0.5);
    for (const dir of [-1, 1]) {
      const x = cabinX + dir * cw * g.f(1, 1.6);
      const ht = unit * g.f(0.24, 0.32);
      out += snowyPine(tree, x, near.at(x) + ht * 0.04, ht, ht * 0.55, hsl(hue, 25, 10));
    }
    if (lit) out += cabin(g, cabinX, near.at(cabinX) + cw * 0.05, cw, snow(66), true);
    // A soft glow of the lights on the snow.
    out += el("rect", { y: shore, width: w, height: h - shore, fill: hsl(glow, 70, 60), opacity: "0.06" });
    alt = `The northern lights rippling over snowy hills and pines on a starry night${lit ? ", a cabin window lit below" : ""}`;
  }
  note.alt(alt);
  note.focus(w / 2, focusY);
  return el("defs", {}, ...defs) + out;
});
