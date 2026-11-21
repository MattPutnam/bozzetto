import { defineKind, el, hex, hsl, lin, type Point, pts, type Rand, s } from "../../draw/core";
import { darker, dot, place } from "./shared";

/**
 * A football helmet in profile facing +x, about 120 units long with its mask. Returns the markup
 * and the lowest point of the chin cup and the back rim, for resting it on the ground.
 */
function helmet(g: Rand): string {
  const hue = g.f(0, 360);
  const shell = g.pick([
    hex(hue, g.f(55, 75), g.f(38, 50)),
    hex(hue, g.f(55, 75), g.f(38, 50)),
    hex(hue, 10, g.f(16, 24)),
    hex(hue, 8, g.f(86, 92)),
    hex(g.f(40, 48), 65, 52),
  ]);
  const stripe = g.pick(["#f4f1e8", hex(hue + 180, 60, 55), hex(hue, 15, 18), hex(45, 80, 58)]);
  const mask = g.pick(["#f1efe9", "#a7adb4", hex(hue, 10, 20), hex(hue + g.f(150, 210), 55, 50)]);
  const id = g.id("shell");
  const outline = `M-46 0C-58 -30-44 -76-4 -80C30 -82 52 -62 54 -42Q55 -36 49 -35L30 -35Q22 -34 22 -24
    L24 -2Q25 6 16 6L-8 5Q-20 1-32 1Q-42 1-46 0Z`;
  let out = el("defs", {}, el("clipPath", { id }, el("path", { d: outline })));
  // The inside of the helmet, seen through the mask.
  out += el("path", { d: "M22 -34L50 -35Q66 -30 66 -8Q64 6 50 10L22 4Z", fill: "#26272b", opacity: 0.6 });
  out += el("path", { d: outline, fill: shell });
  let paint = "";
  // The stripe down the middle of the crown, which shows along the top in profile.
  paint += el("path", {
    d: "M58 -44C52 -70 30 -86-4 -84C-44 -82-62 -36-50 -2",
    fill: "none",
    stroke: stripe,
    "stroke-width": g.pick([9, 12]),
  });
  if (g.chance(0.5))
    paint += el("path", {
      d: "M58 -44C52 -70 30 -86-4 -84C-44 -82-62 -36-50 -2",
      fill: "none",
      stroke: shell,
      "stroke-width": 3,
    });
  // A simple decal on the side.
  const decal = g.i(0, 3);
  const accent = g.pick([stripe, "#f4f1e8", hex(hue + 180, 60, 55)]);
  if (decal === 1) paint += el("circle", { cx: -14, cy: -44, r: 14, fill: accent });
  if (decal === 2) {
    const star: Point[] = [];
    for (let k = 0; k < 10; k++) {
      const a = (k * Math.PI) / 5 - Math.PI / 2;
      const rr = k % 2 ? 6.5 : 16;
      star.push([-14 + Math.cos(a) * rr, -44 + Math.sin(a) * rr]);
    }
    paint += el("path", { d: `M${pts(star)}Z`, fill: accent });
  }
  if (decal === 3) paint += el("path", { d: "M-6 -62L-24 -42L-14 -42L-22 -24L0 -48L-10 -48Z", fill: accent });
  // Shade along the bottom and a gloss highlight on top.
  paint += el("ellipse", { cx: 0, cy: 6, rx: 70, ry: 24, fill: "#000", opacity: 0.16 });
  paint += el("ellipse", {
    cx: -8,
    cy: -64,
    rx: 24,
    ry: 8,
    transform: "rotate(-18 -8 -64)",
    fill: "#ffffff",
    opacity: 0.3,
  });
  out += el("g", { "clip-path": `url(#${id})` }, paint);
  // The ear hole and the edge padding.
  out += el("circle", { cx: 4, cy: -22, r: 4.5, fill: "#1f2024" });
  out += el("circle", { cx: 4, cy: -22, r: 6.5, fill: "none", stroke: "#000", opacity: 0.2, "stroke-width": 1.5 });
  out += el("path", { d: "M-44 -2Q-30 -2-10 2", stroke: "#26272b", "stroke-width": 3, fill: "none" });
  // The chin strap and cup.
  out += el("path", { d: "M14 -8Q30 6 50 12", stroke: darker(mask, 0.25), "stroke-width": 2.5, fill: "none" });
  out += el("ellipse", {
    cx: 52,
    cy: 12,
    rx: 8,
    ry: 5,
    transform: "rotate(-20 52 12)",
    fill: g.pick(["#f1efe9", "#26272b"]),
  });
  // The face mask: a cage of bars clipped on at the brow and the jaw.
  out += el("path", {
    d: `M49 -36Q70 -32 68 -8Q66 8 50 10M24 -22Q46 -25 68 -20M24 -6Q44 -4 64 2M44 -34Q49 -14 42 9`,
    fill: "none",
    stroke: mask,
    "stroke-width": 3.6,
    "stroke-linecap": "round",
  });
  out += el("path", {
    d: "M22 -25v5M22 -9v5",
    stroke: darker(shell, 0.3),
    "stroke-width": 4,
    "stroke-linecap": "round",
  });
  return out;
}

/** An American football in profile, centered at (0, 0), half-length L, laces toward the viewer. */
function footballBall(g: Rand, L: number, R: number): string {
  const leather = hex(g.f(14, 24), g.f(45, 60), g.f(30, 38));
  const id = g.id("ball");
  const shape = s`M${-L} 0C${-L * 0.55} ${-R * 1.36} ${L * 0.55} ${-R * 1.36} ${L} 0C${L * 0.55} ${R * 1.36} ${-L * 0.55} ${R * 1.36} ${-L} 0Z`;
  let out = el("defs", {}, el("clipPath", { id }, el("path", { d: shape })));
  out += el("path", { d: shape, fill: leather });
  let inner = "";
  // Stripes near the ends, sometimes.
  if (g.chance(0.5))
    inner += el("path", {
      d: s`M${-L * 0.6} ${-R}Q${-L * 0.52} 0 ${-L * 0.6} ${R}M${L * 0.6} ${-R}Q${L * 0.52} 0 ${L * 0.6} ${R}`,
      fill: "none",
      stroke: "#f4f1e6",
      "stroke-width": R * 0.16,
    });
  // Panel seams running end to end.
  inner += el("path", {
    d: s`M${-L} 0Q0 ${-R * 0.75} ${L} 0M${-L} 0Q0 ${R * 0.9} ${L} 0`,
    fill: "none",
    stroke: "#000",
    opacity: 0.25,
    "stroke-width": R * 0.04,
  });
  inner += el("ellipse", { cx: 0, cy: R * 0.75, rx: L, ry: R * 0.5, fill: "#000", opacity: 0.18 });
  inner += el("ellipse", { cx: -L * 0.35, cy: -R * 0.3, rx: L * 0.3, ry: R * 0.14, fill: "#ffffff", opacity: 0.14 });
  out += el("g", { "clip-path": `url(#${id})` }, inner);
  // The laces: one long strip with short cross laces over it.
  const ly = -R * 0.55;
  let cross = "";
  for (let k = 0; k < 8; k++) {
    const x = -L * 0.26 + (k * L * 0.52) / 7;
    cross += s`M${x} ${ly - R * 0.12}V${ly + R * 0.12}`;
  }
  out += el("path", {
    d: s`M${-L * 0.3} ${ly + R * 0.03}Q0 ${ly - R * 0.06} ${L * 0.3} ${ly + R * 0.03}`,
    fill: "none",
    stroke: "#f4f1e6",
    "stroke-width": R * 0.07,
  });
  out += el("path", { d: cross, stroke: "#f4f1e6", "stroke-width": R * 0.075, "stroke-linecap": "round" });
  return out;
}

/** A football helmet and a ball resting on the grass of a field or on a locker-room bench. */
export const football = /* @__PURE__ */ defineKind("football", "Football", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const where = g.pick(["grass", "grass", "bench"] as const);
  const gy = h * g.f(0.76, 0.82);
  let out = "";
  if (where === "grass") {
    // A low view across the field: blurred distance above, grass below.
    const hy = h * g.f(0.3, 0.42);
    const hue = g.f(95, 120);
    const back = g.id("back");
    const turf = g.id("turf");
    out += el(
      "defs",
      {},
      lin(back, [hsl(g.f(200, 215), 35, g.f(70, 80)), hsl(hue, 22, 60)]),
      lin(turf, [hsl(hue, 30, 52), hsl(hue, 45, 34)]),
    );
    out += el("rect", { width: w, height: hy + 1, fill: `url(#${back})` });
    let bokeh = "";
    for (let k = g.i(4, 8); k > 0; k--) bokeh += dot(g.f(0, w), hy * g.f(0.2, 0.8), unit * g.f(0.03, 0.07));
    out += el("path", { d: bokeh, fill: "#ffffff", opacity: 0.18 });
    out += el("rect", { y: hy, width: w, height: h - hy, fill: `url(#${turf})` });
    // A yard line across the field behind the gear.
    const ly = hy + (gy - hy) * g.f(0.25, 0.55);
    out += el("rect", {
      y: ly,
      width: w,
      height: unit * 0.018 * (1 + (ly - hy) / (h - hy)),
      fill: "#f4f4ee",
      opacity: 0.75,
    });
    // Blades of grass in front.
    let blades = "";
    for (let x = g.f(0, 4); x < w; x += Math.max(unit * g.f(0.015, 0.035), w / 110)) {
      const y = gy + g.f(0, h - gy);
      blades += s`M${x} ${y + unit * 0.02}l${g.f(-1, 1) * unit * 0.01} ${-unit * g.f(0.02, 0.05)}`;
    }
    out += el("path", { d: blades, stroke: hsl(hue, 45, 26), opacity: 0.5, "stroke-width": Math.max(1, unit * 0.005) });
  } else {
    // A row of lockers behind a wooden bench.
    const tone = hex(g.f(0, 360), g.f(15, 35), g.f(45, 60));
    out += el("rect", { width: w, height: h, fill: tone });
    const lw = unit * g.f(0.2, 0.26);
    let lines = "";
    let vents = "";
    for (let x = g.f(-lw, 0); x < w; x += lw) {
      lines += s`M${x} 0V${gy}`;
      for (let k = 0; k < 4; k++) vents += s`M${x + lw * 0.25} ${h * 0.08 + k * unit * 0.025}h${lw * 0.5}`;
      vents += s`M${x + lw * 0.8} ${gy * 0.5}v${unit * 0.06}`;
    }
    out += el("path", { d: lines, stroke: "#000", opacity: 0.3, "stroke-width": Math.max(1.5, unit * 0.008) });
    out += el("path", {
      d: vents,
      stroke: "#000",
      opacity: 0.25,
      "stroke-width": Math.max(1.5, unit * 0.01),
      "stroke-linecap": "round",
    });
    const wood = hex(g.f(24, 36), 40, g.f(50, 62));
    out += el("rect", { y: gy - unit * 0.05, width: w, height: unit * 0.1, fill: wood });
    out += el("rect", { y: gy + unit * 0.05, width: w, height: unit * 0.07, fill: darker(wood, 0.25) });
    out += el("rect", { y: gy + unit * 0.12, width: w, height: h, fill: "#000", opacity: 0.45 });
  }
  // The helmet and ball side by side, sometimes with the ball in front.
  const flip = g.chance(0.5);
  const ballFirst = g.chance(0.5);
  const front = g.chance(0.35);
  const L = 36;
  const R = 22;
  const tilt = g.f(-8, 8);
  const helmetW = 125;
  const gap = front ? -24 : g.f(6, 18);
  const span = helmetW + gap + L * 2;
  const k = Math.min((w * 0.86) / span, (gy - h * 0.06) / 100);
  const left = w / 2 - (span * k) / 2;
  const helmetX = ballFirst ? left + (L * 2 + gap) * k + 60 * k : left + 60 * k;
  const ballX = ballFirst ? left + L * k : left + (helmetW + gap + L) * k;
  // Rest the helmet on its chin cup and back rim: turn it about the chin until the rim comes down.
  const lean = (Math.atan2(17, 98) * 180) / Math.PI;
  const helmetPart =
    el("ellipse", { cx: helmetX, cy: gy, rx: 66 * k, ry: 6 * k, fill: "#000", opacity: 0.25 }) +
    el(
      "g",
      {
        transform: `translate(${helmetX.toFixed(1)} ${(gy - 17 * k).toFixed(1)}) scale(${(flip ? -k : k).toFixed(4)} ${k.toFixed(4)}) rotate(${(-lean).toFixed(1)} 52 17)`,
      },
      helmet(g),
    );
  const lowest = Math.sqrt((L * Math.sin((tilt * Math.PI) / 180)) ** 2 + (R * Math.cos((tilt * Math.PI) / 180)) ** 2);
  const by = gy + (front ? unit * 0.03 : 0);
  const ballPart =
    el("ellipse", { cx: ballX, cy: by, rx: L * 1.1 * k, ry: 5 * k, fill: "#000", opacity: 0.25 }) +
    el("g", { transform: place(ballX, by - lowest * k, k, tilt, g.chance(0.5)) }, footballBall(g, L, R));
  out += front ? helmetPart + ballPart : ballPart + helmetPart;
  note.alt(
    `A football helmet and a ball ${where === "grass" ? "on the grass of a field" : "on a bench in a locker room"}`,
  );
  note.focus(helmetX, gy - 45 * k);
  return out;
});
