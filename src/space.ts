import { defineKind, el, fill, hsl, lin, qpt, s, type Point, type Rand } from "./core";
import { blob } from "./shapes";

/** Stars as round dots on two paths, small and faint or larger and bright. */
function starDots(g: Rand, w: number, h: number, count: number, unit: number): string {
  const d = ["", ""];
  for (let k = 0; k < count; k++) d[g.chance(0.75) ? 0 : 1] += s`M${w * g.f(0, 1)} ${h * g.f(0, 1)}h0`;
  return d
    .map((dots, k) =>
      el("path", {
        d: dots,
        stroke: "#fff",
        "stroke-width": unit * (0.005 + 0.004 * k),
        "stroke-linecap": "round",
        opacity: 0.6 + 0.3 * k,
      }),
    )
    .join("");
}

/** A star count that grows with the picture's area but stays cheap. */
const starCount = (g: Rand, w: number, h: number) =>
  Math.round(g.i(26, 40) * Math.min(1.8, Math.sqrt((w * h) / 120000)));

/**
 * A radial shadow that darkens a sphere away from its light. One gradient serves every sphere,
 * since it works in each shape's own bounding box. `lx` is -1 for light from the left, 1 from the right.
 */
const shadeDef = (id: string, lx: number, strength: number) =>
  el(
    "radialGradient",
    { id, cx: 0.5 + lx * 0.22, cy: 0.32, r: 0.78 },
    el("stop", { offset: 0.35, "stop-color": "#000", "stop-opacity": 0 }),
    el("stop", { offset: 1, "stop-color": "#000", "stop-opacity": strength }),
  );

const clipCircle = (id: string, cx: number, cy: number, r: number) =>
  el("clipPath", { id }, el("circle", { cx, cy, r }));

/** A gas giant's stripes: each band covers everything below its wavy top edge. */
function bands(g: Rand, cx: number, cy: number, r: number, hue: number, clip: string): string {
  const count = g.i(4, 7);
  const tones = [g.f(70, 82), g.f(52, 64), g.f(62, 74), g.f(44, 56)];
  let out = el("circle", { cx, cy, r, fill: hsl(hue, g.f(35, 55), tones[0]) });
  for (let k = 1; k <= count; k++) {
    const top = cy - r + (2 * r * (k + g.f(-0.3, 0.3))) / (count + 1);
    const amp = r * g.f(0.01, 0.05);
    let d = s`M${cx - r} ${top}`;
    for (let q = 0; q < 4; q++) {
      const x0 = cx - r + (q * r) / 2;
      d += s`Q${x0 + r / 4} ${top + (q % 2 ? amp : -amp)} ${x0 + r / 2} ${top}`;
    }
    d += s`V${cy + r}H${cx - r}Z`;
    out += el("path", {
      d,
      fill: hsl(hue + g.f(-18, 18), g.f(30, 55), tones[k % 4] + g.f(-4, 4)),
      "clip-path": `url(#${clip})`,
    });
  }
  // Sometimes a great storm, an oval on one band.
  if (g.chance(0.5)) {
    const sy = cy + r * g.f(-0.1, 0.45);
    const sx = cx + r * g.f(-0.45, 0.35);
    out += el("ellipse", { cx: sx, cy: sy, rx: r * 0.16, ry: r * 0.08, fill: hsl(hue + 20, 55, 40), opacity: 0.85 });
    out += el("ellipse", { cx: sx, cy: sy, rx: r * 0.09, ry: r * 0.04, fill: hsl(hue + 25, 60, 65) });
  }
  return out;
}

/** A rocky body with craters, each a dark bowl with a lit rim on the side toward the light. */
function craters(
  g: Rand,
  cx: number,
  cy: number,
  r: number,
  paint: string,
  lx: number,
  clip: string,
  count: number,
): string {
  let out = el("circle", { cx, cy, r, fill: paint });
  let dark = "";
  let lit = "";
  for (let k = 0; k < count; k++) {
    const a = g.f(0, Math.PI * 2);
    const dist = r * Math.sqrt(g.f(0, 0.8));
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    const cr = r * g.f(0.06, 0.18);
    const off = cr * 0.18;
    lit += s`M${x - cr - off * lx} ${y + off}a${cr} ${cr} 0 1 0 ${cr * 2} 0a${cr} ${cr} 0 1 0 ${-cr * 2} 0`;
    dark += s`M${x - cr} ${y}a${cr} ${cr} 0 1 0 ${cr * 2} 0a${cr} ${cr} 0 1 0 ${-cr * 2} 0`;
  }
  out += el("path", { d: lit, fill: "#fff", opacity: 0.18, "clip-path": `url(#${clip})` });
  out += el("path", { d: dark, fill: "#000", opacity: 0.16, "clip-path": `url(#${clip})` });
  return out;
}

/** The Earth seen from space: ocean, a few continents, wisps of cloud, and a thin glowing air. */
function earth(g: Rand, cx: number, cy: number, r: number, clip: string, shade: string, unit: number): string {
  const ocean = hsl(g.f(200, 215), g.f(55, 70), g.f(42, 50));
  let out = el("circle", { cx, cy, r: r * 1.04, fill: hsl(200, 80, 75), opacity: 0.25 });
  out += el("circle", { cx, cy, r, fill: ocean });
  let land = "";
  for (let k = g.i(3, 4); k > 0; k--) {
    const a = g.f(0, Math.PI * 2);
    const dist = r * g.f(0.1, 0.75);
    const lr = r * g.f(0.18, 0.34);
    land += blob(g, cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, lr, lr * g.f(0.6, 1), 2, 0.25, 0.25);
  }
  out += el("path", { d: land, fill: hsl(g.f(90, 125), g.f(30, 45), g.f(40, 48)), "clip-path": `url(#${clip})` });
  let cloud = "";
  for (let k = g.i(3, 5); k > 0; k--) {
    const y = cy + r * g.f(-0.85, 0.85);
    const x = cx + r * g.f(-0.8, 0.3);
    const len = r * g.f(0.4, 0.9);
    cloud += s`M${x} ${y}q${len / 2} ${-r * g.f(0.04, 0.12)} ${len} 0`;
  }
  out += el("path", {
    d: cloud,
    stroke: "#fff",
    "stroke-width": Math.max(1, r * 0.06),
    "stroke-linecap": "round",
    fill: "none",
    opacity: 0.7,
    "clip-path": `url(#${clip})`,
  });
  out += el("circle", { cx, cy, r, fill: `url(#${shade})` });
  out += el("circle", {
    cx,
    cy,
    r,
    fill: "none",
    stroke: hsl(195, 90, 82),
    "stroke-width": Math.max(1, unit * 0.006),
    opacity: 0.6,
  });
  return out;
}

/** Is (x, y) outside the ellipse around (cx, cy) with half-axes rx, ry? */
const outside = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1;

/** A planet system up close: a big banded or cratered planet, perhaps ringed, with moons and far planets. */
export const planets = defineKind("planets", "Planets", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(220, 280);
  const lx = g.pick([-1, 1]);
  const shade = g.id("shade");
  const sky = g.id("sky");
  const clip = g.id("planet");
  const gas = g.chance(0.65);
  const ringed = g.chance(gas ? 0.6 : 0.3);
  const hue = g.f(0, 360);
  let r = unit * g.f(0.28, 0.36);
  const ringScale = g.f(1.7, 2);
  const tilt = g.f(-24, 24);
  // Keep the rings inside the picture, shrinking the planet if needed.
  const reach = ringed ? ringScale : 1.05;
  r = Math.min(r, (w * 0.46) / reach, h * 0.4);
  const halfW = r * reach;
  const cx = halfW + w * 0.03 + (w - 2 * (halfW + w * 0.03)) * g.f(0.1, 0.9);
  const cy = h * g.f(0.45, 0.56);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 45, 5), hsl(skyHue + 15, 40, 14)]),
    shadeDef(shade, lx, 0.7),
    clipCircle(clip, cx, cy, r),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, h, starCount(g, w, h), unit);
  // Moons and far planets, kept clear of the big planet and its rings.
  const bodies: [number, number, number][] = [];
  const place = (br: number) => {
    for (let t = 0; t < 30; t++) {
      const x = br * 1.5 + (w - br * 3) * g.f(0, 1);
      const y = br * 1.5 + (h - br * 3) * g.f(0, 1);
      if (!outside(x, y, cx, cy, halfW + br * 1.6, r * (ringed ? 1.15 : 1) + br * 1.6)) continue;
      if (bodies.some(([bx, by, bb]) => Math.hypot(x - bx, y - by) < bb + br + unit * 0.05)) continue;
      bodies.push([x, y, br]);
      return true;
    }
    return false;
  };
  const moons = g.i(1, 2);
  for (let k = 0; k < moons; k++) place(r * g.f(0.11, 0.2));
  const moonCount = bodies.length;
  for (let k = g.i(1, 3); k > 0; k--) place(unit * g.f(0.012, 0.03));
  bodies.forEach(([x, y, br], k) => {
    const id = g.id(`body${k}`);
    const paint = hsl(g.f(0, 360), g.f(15, 45), g.f(55, 75));
    out += el("defs", {}, clipCircle(id, x, y, br));
    out += k < moonCount ? craters(g, x, y, br, paint, lx, id, 4) : el("circle", { cx: x, cy: y, r: br, fill: paint });
    out += el("circle", { cx: x, cy: y, r: br, fill: `url(#${shade})` });
  });
  // The big planet, with the far half of its rings behind it and the near half in front.
  const ringRx = r * ringScale;
  const ringRy = ringRx * g.f(0.16, 0.26);
  const ringPaint = [hsl(hue + g.f(20, 50), 35, 78), hsl(hue + g.f(-20, 20), 30, 62)];
  const ring = (sweep: number) =>
    ringPaint
      .map((paint, k) => {
        const rx = ringRx * (1 - k * 0.17);
        const ry = ringRy * (1 - k * 0.17);
        return el("path", {
          d: s`M${cx - rx} ${cy}A${rx} ${ry} 0 0 ${sweep} ${cx + rx} ${cy}`,
          fill: "none",
          stroke: paint,
          "stroke-width": r * (k ? 0.14 : 0.2),
          opacity: k ? 0.75 : 0.85,
        });
      })
      .join("");
  let planet = ringed ? ring(1) : "";
  planet += gas
    ? bands(g, cx, cy, r, hue, clip)
    : craters(g, cx, cy, r, hsl(hue, g.f(15, 40), g.f(55, 68)), lx, clip, g.i(9, 14));
  planet += el("circle", { cx, cy, r, fill: `url(#${shade})` });
  if (ringed) planet += ring(0);
  out += el("g", { transform: s`rotate(${tilt} ${cx} ${cy})` }, planet);
  const what = gas
    ? ringed
      ? "A ringed, banded planet"
      : "A banded gas giant"
    : ringed
      ? "A ringed, cratered planet"
      : "A cratered planet";
  const moonWords = moonCount === 2 ? "two moons" : moonCount === 1 ? "a moon" : "";
  note.alt(`${what} up close${moonWords ? ` with ${moonWords}` : ""} and distant planets among the stars`);
  note.focus(cx, cy);
  return out;
});

/** A four-pointed glint for a bright star. */
const glint = (x: number, y: number, len: number) => {
  const t = len * 0.12;
  const p: Point[] = [
    [0, -len],
    [t, -t],
    [len, 0],
    [t, t],
    [0, len],
    [-t, t],
    [-len, 0],
    [-t, -t],
  ];
  return "M" + p.map(([px, py]) => s`${x + px} ${y + py}`).join("L") + "Z";
};

/** A glowing nebula: soft blurred clouds of two or three hues over stars, with a few bright glinting stars. */
export const nebula = defineKind("nebula", "Nebula", (g, w, h, note) => {
  const unit = Math.min(w, h);
  // Two or three hues from the ones real nebulae glow in, never two alike.
  const pool = [g.f(320, 345), g.f(270, 290), g.f(205, 230), g.f(175, 192), g.f(8, 28)];
  const first = g.i(0, 4);
  const second = (first + g.i(1, 4)) % 5;
  const hues = [pool[first], pool[second]];
  if (g.chance(0.5)) hues.push(pool[(second + 1) % 5 === first ? (second + 2) % 5 : (second + 1) % 5]);
  const base = g.f(225, 275);
  const sky = g.id("sky");
  const soft = g.id("soft");
  const bg = hsl(base, 40, 5);
  let out = el(
    "defs",
    {},
    lin(sky, [bg, hsl(base + 20, 35, 11)]),
    el(
      "filter",
      { id: soft, x: "-50%", y: "-50%", width: "200%", height: "200%" },
      el("feGaussianBlur", { stdDeviation: unit * 0.065 }),
    ),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, h, starCount(g, w, h), unit);
  // The clouds gather along a gently curving band across the picture.
  const y0 = h * g.f(0.25, 0.75);
  const y1 = h * g.f(0.25, 0.75);
  const wave = h * g.f(0.05, 0.15);
  const phase = g.f(0, 6);
  const along = (t: number): Point => [w * t, y0 + (y1 - y0) * t + wave * Math.sin(phase + t * 5)];
  const count = Math.round(4 + 2.5 * Math.min(3, w / h));
  // A faint wide glow under the whole band.
  let clouds = el("ellipse", {
    cx: w / 2,
    cy: (y0 + y1) / 2,
    rx: w * 0.55,
    ry: unit * 0.28,
    fill: hsl(hues[0], 55, 40),
    opacity: 0.3,
    transform: s`rotate(${(Math.atan2(y1 - y0, w) * 180) / Math.PI} ${w / 2} ${(y0 + y1) / 2})`,
  });
  for (let k = 0; k < count; k++) {
    const t = (k + g.f(0, 1)) / count;
    const [x, y] = along(t * 1.1 - 0.05);
    const rx = unit * g.f(0.18, 0.32);
    const hue = hues[k % hues.length];
    clouds += el("path", {
      d: blob(g, x, y + unit * g.f(-0.15, 0.15), rx, rx * g.f(0.5, 0.9), 2, 0.25, 0.2),
      fill: hsl(hue, g.f(60, 75), g.f(50, 62)),
      opacity: g.f(0.3, 0.55),
    });
  }
  // Brighter cores, then a lane or two of dark dust.
  let focus: Point = along(0.5);
  for (let k = g.i(2, 3); k > 0; k--) {
    const t = g.f(0.15, 0.85);
    const [x, y] = along(t);
    const rx = unit * g.f(0.07, 0.13);
    if (k === 1) focus = [x, y];
    clouds += el("path", {
      d: blob(g, x, y, rx, rx * 0.7, 2, 0.2),
      fill: hsl(hues[k % hues.length] + 15, 80, 80),
      opacity: 0.6,
    });
  }
  const dusty = g.chance(0.6);
  if (dusty) {
    const [x, y] = along(g.f(0.25, 0.75));
    clouds += el("path", {
      d: blob(g, x, y + unit * g.f(-0.05, 0.05), unit * g.f(0.18, 0.28), unit * g.f(0.04, 0.07), 2, 0.3),
      fill: bg,
      opacity: 0.6,
    });
  }
  out += el("g", { filter: `url(#${soft})` }, clouds);
  // A few faint stars shine through in front, and some bright ones glint.
  out += starDots(g, w, h, Math.round(starCount(g, w, h) / 3), unit);
  const bright = g.i(3, 5);
  let glints = "";
  let halos = "";
  for (let k = 0; k < bright; k++) {
    const x = w * g.f(0.05, 0.95);
    const y = h * g.f(0.05, 0.95);
    const len = unit * g.f(0.025, 0.055);
    glints += glint(x, y, len);
    halos += s`M${x - len * 0.35} ${y}a${len * 0.35} ${len * 0.35} 0 1 0 ${len * 0.7} 0a${len * 0.35} ${len * 0.35} 0 1 0 ${-len * 0.7} 0`;
  }
  out += el("path", { d: halos, fill: "#fff", opacity: 0.3 });
  out += el("path", { d: glints, fill: "#fff" });
  note.alt(
    `A glowing nebula of soft ${hues.length === 3 ? "many-hued" : "two-toned"} clouds${dusty ? " crossed by a lane of dark dust" : ""}, bright stars glinting around it`,
  );
  note.focus(focus[0], focus[1]);
  return out;
});

/** An astronaut floating in space, sometimes tethered to a station, with Earth or a moon behind. */
export const astronaut = defineKind("astronaut", "Astronaut", { tether: [true, false] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(220, 270);
  const lx = g.pick([-1, 1]);
  const tethered = g.option("tether", g.chance(0.6));
  const side = g.pick([-1, 1]);
  const sky = g.id("sky");
  const shade = g.id("shade");
  const globeClip = g.id("globe");
  const visorPaint = g.id("visor");
  const gold = g.chance(0.4);
  // The globe in a lower corner, opposite the station.
  const isEarth = g.chance(0.7);
  const gr = unit * g.f(0.45, 0.6);
  const gx = side > 0 ? gr * g.f(0.1, 0.5) : w - gr * g.f(0.1, 0.5);
  const gy = h + gr * g.f(0.15, 0.35);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 45, 5), hsl(skyHue + 15, 40, 13)]),
    shadeDef(shade, lx, 0.6),
    clipCircle(globeClip, gx, gy, gr),
    lin(visorPaint, gold ? [hsl(42, 75, 58), hsl(30, 65, 28)] : [hsl(215, 45, 18), hsl(200, 55, 42)]),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, h, starCount(g, w, h), unit);
  out += isEarth
    ? earth(g, gx, gy, gr, globeClip, shade, unit)
    : craters(g, gx, gy, gr, hsl(g.f(30, 220), 8, 66), lx, globeClip, 10) +
      el("circle", { cx: gx, cy: gy, r: gr, fill: `url(#${shade})` });

  // The astronaut, drawn in a local frame 100 units tall, centered on the torso.
  const size = unit * g.f(0.5, 0.58);
  const k = size / 100;
  const cx = Math.max(64 * k, Math.min(w - 64 * k, w / 2 - side * w * g.f(0, 0.12)));
  const cy = Math.max(64 * k, Math.min(h - 62 * k, h * g.f(0.46, 0.54)));
  const angle = g.f(-28, 28);
  const toWorld = (x: number, y: number): Point => {
    const a = (angle * Math.PI) / 180;
    return [cx + k * (x * Math.cos(a) - y * Math.sin(a)), cy + k * (x * Math.sin(a) + y * Math.cos(a))];
  };
  const suit = g.pick(["#f2f2ee", "#eef1f5", "#f4efe4"]);
  const trim = g.pick(["#c7ccd4", "#cfcac0", "#c2c8cf"]);
  const pack = g.pick(["#a9b0ba", "#b5ada0", "#9fa8b3"]);
  const accent = g.pick(["#e0693e", "#3f7fc4", "#e3b23c", "#5aa36b", "#c4544f"]);
  // A limb as a thick round-capped stroke through a joint: angles in degrees, lengths in local units.
  const limb = (x: number, y: number, a1: number, a2: number, len: number) => {
    const r1 = (a1 * Math.PI) / 180;
    const r2 = (a2 * Math.PI) / 180;
    const jx = x + Math.cos(r1) * len;
    const jy = y + Math.sin(r1) * len;
    return [jx, jy, jx + Math.cos(r2) * len, jy + Math.sin(r2) * len];
  };
  let body = "";
  body += el("rect", { x: -29, y: -33, width: 58, height: 54, rx: 8, fill: pack });
  body += el("rect", { x: -29, y: -33, width: 9, height: 54, rx: 4, fill: "#000", opacity: 0.12 });
  // Legs, then arms, both tucked under the torso where they join.
  let limbs = "";
  let boots = "";
  let hands = "";
  for (const dir of [-1, 1]) {
    const a1 = 90 - dir * g.f(6, 26);
    const [kx, ky, fx, fy] = limb(dir * 10, 14, a1, a1 + dir * g.f(-15, 20), 21);
    limbs += s`M${dir * 10} 14L${kx} ${ky}L${fx} ${fy}`;
    boots += s`M${fx + (kx - fx) * 0.3} ${fy + (ky - fy) * 0.3}L${fx} ${fy}`;
  }
  body += el("path", {
    d: limbs,
    stroke: suit,
    "stroke-width": 16,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  });
  body += el("path", { d: boots, stroke: trim, "stroke-width": 17, "stroke-linecap": "round", fill: "none" });
  limbs = "";
  let cuffs = "";
  for (const dir of [-1, 1]) {
    const up = g.f(-60, 40);
    const a1 = dir > 0 ? up : 180 - up;
    const a2 = a1 + dir * g.f(-55, 15);
    const [ex, ey, hx, hy] = limb(dir * 17, -17, a1, a2, 20);
    limbs += s`M${dir * 17} -17L${ex} ${ey}L${hx} ${hy}`;
    const wx = ex + (hx - ex) * 0.82;
    const wy = ey + (hy - ey) * 0.82;
    cuffs += s`M${wx - 7} ${wy}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`;
    hands += s`M${hx - 7.5} ${hy}a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0`;
  }
  body += el("path", {
    d: limbs,
    stroke: suit,
    "stroke-width": 14,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  });
  body += el("path", { d: cuffs, fill: accent });
  body += el("path", { d: hands, fill: trim });
  // Torso, belt and chest panel.
  body += el("rect", { x: -22, y: -27, width: 44, height: 47, rx: 10, fill: suit });
  body += el("rect", { x: -22, y: 9, width: 44, height: 7, fill: trim });
  body += el("rect", { x: -11, y: -14, width: 22, height: 16, rx: 3, fill: trim });
  body += el("rect", { x: -7, y: -10, width: 8, height: 4, rx: 1, fill: accent });
  body += el("circle", { cx: 5, cy: -8, r: 2.2, fill: hsl(140, 60, 55) });
  body += el("circle", { cx: -3, cy: -1.5, r: 2.2, fill: hsl(200, 70, 60) });
  body += el("circle", { cx: 5, cy: -1.5, r: 2.2, fill: hsl(5, 70, 60) });
  body += el("rect", { x: 10, y: -27, width: 12, height: 6, rx: 2, fill: accent, opacity: 0.9 });
  // The helmet: shell, neck ring, and a mirrored visor with glare.
  body += el("ellipse", { cx: 0, cy: -27, rx: 15, ry: 5, fill: trim });
  body += el("circle", { cx: 0, cy: -44, r: 20, fill: suit });
  body += el("ellipse", { cx: 0, cy: -43, rx: 15, ry: 12.5, fill: `url(#${visorPaint})` });
  body += el("path", {
    d: "M-11 -46Q-9 -53 -1 -54.5",
    stroke: "#fff",
    "stroke-width": 2.6,
    "stroke-linecap": "round",
    fill: "none",
    opacity: 0.75,
  });
  body += el("circle", { cx: 7, cy: -37, r: 1.8, fill: "#fff", opacity: 0.6 });
  body += el("rect", { x: -22, y: -49, width: 5, height: 9, rx: 2, fill: trim });
  body += el("rect", { x: 17, y: -49, width: 5, height: 9, rx: 2, fill: trim });

  // The tether runs from the belt to a handrail on a station hull in an upper corner.
  if (tethered) {
    const hw = unit * g.f(0.32, 0.45);
    const hh = unit * g.f(0.16, 0.24);
    const hx = side > 0 ? w - hw : -unit;
    const hull = "#d9dde2";
    out += el("rect", { x: hx, y: -unit, width: hw + unit, height: hh + unit, rx: unit * 0.03, fill: hull });
    out += el("rect", {
      x: hx,
      y: hh - unit * 0.035,
      width: hw + unit,
      height: unit * 0.035,
      fill: "#000",
      opacity: 0.15,
    });
    let seams = "";
    const step = unit * 0.09;
    for (let x = side > 0 ? hx + step : hw - step; side > 0 ? x < w : x > 0; x += side * step)
      seams += s`M${x} 0V${hh - unit * 0.035}`;
    out += el("path", { d: seams, stroke: "#000", "stroke-width": Math.max(1, unit * 0.004), opacity: 0.12 });
    out += el("rect", {
      x: side > 0 ? hx + hw * 0.2 : hw * 0.55,
      y: hh * 0.25,
      width: hw * 0.25,
      height: hh * 0.4,
      rx: unit * 0.01,
      fill: hsl(215, 40, 30),
    });
    const rail = side > 0 ? hx + hw * 0.12 : hw * 0.88;
    const ry = hh + unit * 0.025;
    out += el("path", {
      d: s`M${rail - unit * 0.035} ${hh}V${ry}H${rail + unit * 0.035}V${hh}`,
      stroke: accent,
      "stroke-width": Math.max(1.5, unit * 0.01),
      fill: "none",
    });
    const [bx, by] = toWorld(side * 22, 13);
    const sag = unit * g.f(0.1, 0.2);
    out += el("path", {
      d: s`M${bx} ${by}C${bx + side * unit * 0.12} ${by + sag} ${rail} ${ry + sag * 1.5} ${rail} ${ry}`,
      stroke: "#e8e4da",
      "stroke-width": Math.max(1.2, unit * 0.007),
      fill: "none",
    });
  }
  out += el("g", { transform: s`translate(${cx} ${cy})rotate(${angle})scale(${k})` }, body);
  const [fx, fy] = toWorld(0, -44);
  note.frame(fx - 26 * k, fy - 26 * k, 52 * k, 52 * k);
  note.focus(fx, fy);
  const behind = isEarth ? "the Earth" : "a cratered moon";
  note.alt(
    tethered
      ? `An astronaut floating on a tether beside a space station, ${behind} below`
      : `An astronaut floating free among the stars, ${behind} below`,
  );
  return out;
});

/** A moon landscape: cratered ground, the Earth or a planet rising, sometimes a lander and footprints. */
export const moon = defineKind("moon", "Moon surface", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(220, 270);
  const lx = g.pick([-1, 1]);
  const ground = g.f(20, 240);
  const gray = (light: number) => hsl(ground, 7, light);
  const sky = g.id("sky");
  const shade = g.id("shade");
  const soil = g.id("soil");
  const globeClip = g.id("globe");
  const horizon = h * g.f(0.58, 0.68);
  // The rising world sits just behind the horizon.
  const isEarth = g.chance(0.6);
  const pr = unit * g.f(0.12, 0.19);
  const px = w * g.f(0.2, 0.8);
  const py = horizon - pr * g.f(0.15, 0.75);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 35, 4), hsl(skyHue + 10, 30, 11)]),
    lin(soil, [gray(g.f(60, 68)), gray(g.f(40, 48))]),
    shadeDef(shade, lx, 0.75),
    clipCircle(globeClip, px, py, pr),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, horizon, starCount(g, w, h), unit);
  if (isEarth) out += earth(g, px, py, pr, globeClip, shade, unit);
  else {
    out += bands(g, px, py, pr, g.f(0, 360), globeClip);
    out += el("circle", { cx: px, cy: py, r: pr, fill: `url(#${shade})` });
  }
  // A far ridge of crater rims, then the ground sweeping toward us.
  let ridge = s`M0 ${horizon}`;
  const humps = Math.max(3, Math.round((w / unit) * 3));
  for (let q = 0; q < humps; q++) {
    const x0 = (q * w) / humps;
    ridge += s`Q${x0 + w / humps / 2} ${horizon - unit * g.f(0, 0.07)} ${x0 + w / humps} ${horizon + unit * g.f(-0.01, 0.01)}`;
  }
  out += el("path", { d: ridge + s`V${h}H0Z`, fill: gray(g.f(34, 40)) });
  const near = horizon + unit * g.f(0.02, 0.05);
  out += el("path", {
    d: s`M0 ${near + unit * g.f(-0.02, 0.02)}Q${w * g.f(0.3, 0.7)} ${near - unit * g.f(0.02, 0.05)} ${w} ${near + unit * g.f(-0.02, 0.02)}V${h}H0Z`,
    fill: `url(#${soil})`,
  });
  // The lander, standing on the near ground to one side of the rising world.
  const hasLander = g.chance(0.65);
  const ls = unit * g.f(0.16, 0.22);
  const lxPos = px < w / 2 ? w * g.f(0.6, 0.82) : w * g.f(0.18, 0.4);
  const lyPos = near + (h - near) * g.f(0.35, 0.5);
  // Footprints: pairs of small prints winding toward us, larger as they come near.
  const footprints = !hasLander || g.chance(0.7);
  const trail: [number, number, number][] = [];
  if (footprints) {
    const start: Point = hasLander ? [lxPos + ls * 0.3, lyPos] : [w * g.f(0.3, 0.7), near + (h - near) * 0.12];
    const end: Point = [w * g.f(0.25, 0.75), h + unit * 0.02];
    const bend: Point = [(start[0] + end[0]) / 2 + w * g.f(-0.2, 0.2), (start[1] + end[1]) / 2];
    for (let k = 1; k <= 12; k++) {
      const [x, y] = qpt(start, bend, end, k / 12);
      const size = unit * 0.012 * (0.5 + 1.4 * ((y - near) / (h - near)));
      trail.push([x + (k % 2 ? -1 : 1) * size * 1.4, y, size]);
    }
  }
  // Craters, smaller and flatter toward the horizon, kept clear of the lander, the trail and each other.
  const holes: [number, number, number, number][] = [];
  for (let c = g.i(6, 9), tries = 0; c > 0 && tries < 60; tries++) {
    const t = g.f(0.08, 1);
    const y = near + (h - near) * t;
    const rx = unit * g.f(0.06, 0.15) * (0.35 + t);
    const ry = rx * (0.22 + 0.2 * t);
    const x = w * g.f(-0.05, 1.05);
    if (hasLander && !outside(x, y, lxPos, lyPos, rx + ls * 0.7, ry + ls * 0.3)) continue;
    if (trail.some(([px, py, size]) => !outside(px, py, x, y, rx * 1.15 + size * 2, ry * 1.3 + size))) continue;
    if (holes.some(([hx, hy, hrx, hry]) => !outside(x, y, hx, hy, (rx + hrx) * 1.15, (ry + hry) * 1.3))) continue;
    c--;
    holes.push([x, y, rx, ry]);
  }
  const ellipse = (ex: number, ey: number, erx: number, ery: number) =>
    s`M${ex - erx} ${ey}a${erx} ${ery} 0 1 0 ${erx * 2} 0a${erx} ${ery} 0 1 0 ${-erx * 2} 0`;
  const crater = (part: (x: number, y: number, rx: number, ry: number) => string) =>
    holes.map(([x, y, rx, ry]) => part(x, y, rx, ry)).join("");
  out += el("path", {
    d: crater((x, y, rx, ry) => ellipse(x, y - ry * 0.1, rx * 1.12, ry * 1.22)),
    fill: "#fff",
    opacity: 0.16,
  });
  out += el("path", { d: crater((x, y, rx, ry) => ellipse(x, y, rx, ry)), fill: gray(30) });
  out += el("path", {
    d: crater((x, y, rx, ry) => ellipse(x + lx * rx * 0.08, y + ry * 0.3, rx * 0.8, ry * 0.62)),
    fill: gray(46),
  });
  if (footprints)
    out += el("path", {
      d: trail.map(([x, y, size]) => ellipse(x, y, size, size * 0.5)).join(""),
      fill: "#000",
      opacity: 0.25,
    });
  if (hasLander) {
    const u = ls / 100;
    const x = (v: number) => lxPos + v * u;
    const y = (v: number) => lyPos + v * u;
    const foil = hsl(g.f(36, 46), 75, 55);
    const cabin = gray(80);
    out += el("ellipse", { cx: x(lx * -12), cy: y(0), rx: ls * 0.7, ry: ls * 0.1, fill: "#000", opacity: 0.25 });
    // Legs and pads.
    out += el("path", {
      d: s`M${x(-25)} ${y(-40)}L${x(-48)} ${y(-2)}M${x(25)} ${y(-40)}L${x(48)} ${y(-2)}M${x(-20)} ${y(-28)}L${x(-38)} ${y(-18)}M${x(20)} ${y(-28)}L${x(38)} ${y(-18)}`,
      stroke: gray(70),
      "stroke-width": ls * 0.04,
      "stroke-linecap": "round",
    });
    out += el("path", {
      d: s`M${x(-56)} ${y(0)}h${ls * 0.16}M${x(40)} ${y(0)}h${ls * 0.16}`,
      stroke: gray(78),
      "stroke-width": ls * 0.04,
      "stroke-linecap": "round",
    });
    // The foil-wrapped descent stage, then the cabin with its window and dish.
    out += el("path", {
      d: s`M${x(-30)} ${y(-60)}H${x(30)}L${x(34)} ${y(-50)}V${y(-30)}L${x(30)} ${y(-24)}H${x(-30)}L${x(-34)} ${y(-30)}V${y(-50)}Z`,
      fill: foil,
    });
    out += el("rect", {
      x: x(lx > 0 ? -34 : 12),
      y: y(-60),
      width: ls * 0.22,
      height: ls * 0.36,
      fill: "#000",
      opacity: 0.18,
    });
    out += el("path", {
      d: s`M${x(-24)} ${y(-60)}L${x(-20)} ${y(-82)}L${x(-6)} ${y(-90)}H${x(14)}L${x(24)} ${y(-80)}V${y(-60)}Z`,
      fill: cabin,
    });
    out += el("path", { d: s`M${x(-15)} ${y(-80)}L${x(-6)} ${y(-86)}V${y(-74)}H${x(-15)}Z`, fill: hsl(215, 30, 22) });
    out += el("path", {
      d: s`M${x(18)} ${y(-90)}V${y(-100)}M${x(12)} ${y(-104)}Q${x(18)} ${y(-96)} ${x(26)} ${y(-102)}`,
      stroke: gray(75),
      "stroke-width": ls * 0.03,
      fill: "none",
    });
    out += el("circle", { cx: x(0), cy: y(-30), r: ls * 0.04, fill: gray(30) });
  }
  const world = isEarth ? "The Earth" : "A banded planet";
  note.alt(
    `${world} rising over a cratered moon surface${hasLander ? `, a lander resting nearby${footprints ? " with footprints leading away" : ""}` : ", footprints crossing the dust"}`,
  );
  note.focus(px, py);
  return out;
});

/** Path data through points, whole pixels and no spaces before minus signs, to keep data URIs small. */
function pathOf(cmd: string, points: readonly Point[]): string {
  let out = cmd;
  for (const [x, y] of points) {
    const xs = String(Math.round(x));
    const ys = String(Math.round(y));
    out += (out.length > 1 && !xs.startsWith("-") ? " " : "") + xs + (ys.startsWith("-") ? "" : " ") + ys;
  }
  return out;
}

/** A smooth open curve through the midpoints of points, as quadratic pieces. */
function smoothOpen(p: readonly Point[]): string {
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = pathOf("M", [p[0]]) + pathOf("L", [mid(p[0], p[1])]);
  for (let k = 1; k < p.length - 1; k++) d += pathOf("Q", [p[k], k === p.length - 2 ? p[k + 1] : mid(p[k], p[k + 1])]);
  return d;
}

/** A smooth closed shape through the midpoints of a ring of points. */
function smoothRing(ring: readonly Point[]): string {
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const count = ring.length;
  let d = pathOf("M", [mid(ring[count - 1], ring[0])]);
  for (let k = 0; k < count; k++) d += pathOf("Q", [ring[k], mid(ring[k], ring[(k + 1) % count])]);
  return d + "Z";
}

/** A radial gradient in the shape's own box, from `stops` as [offset, color, opacity]. */
const radial = (id: string, stops: readonly [number, string, number][], attrs: Record<string, number | string> = {}) =>
  el(
    "radialGradient",
    { id, ...attrs },
    ...stops.map(([offset, color, alpha]) =>
      el("stop", { offset, "stop-color": color, "stop-opacity": alpha === 1 ? undefined : alpha }),
    ),
  );

/** The half-extents of an ellipse with half-axes rx, ry turned by `deg` degrees. */
function extents(rx: number, ry: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [Math.hypot(rx * Math.cos(a), ry * Math.sin(a)), Math.hypot(rx * Math.sin(a), ry * Math.cos(a))];
}

/** A spiral galaxy: a glowing core and soft arms with dust lanes and star-forming knots, at a tilt. */
export const galaxy = defineKind("galaxy", "Galaxy", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(225, 275);
  const sky = g.id("sky");
  const core = g.id("core");
  const armPaint = g.id("arm");
  const halo = g.id("halo");
  const soft = g.id("soft");
  const fine = g.id("fine");
  const lanes = g.id("lanes");
  const far = g.id("far");
  // Palette: a warm core, with arms that are classic blue, teal or violet.
  const coreHue = g.f(28, 48);
  const armHue = g.pick([g.f(205, 222), g.f(180, 194), g.f(250, 272)]);
  const knotHue = g.f(322, 348);
  // The view: face-on (round) to steeply inclined (a narrow ellipse), turned any way.
  const tilt = g.chance(0.3) ? g.f(0.82, 1) : g.f(0.3, 0.8);
  // Laid along a wide or tall picture's long side, and any way in a squarer one.
  const swing = g.f(-1, 1);
  const turn = w > h * 1.5 ? swing * 25 : h > w * 1.15 ? 90 + swing * 35 : swing * 90;
  const barred = g.chance(0.35);
  const arms = barred ? 2 : g.pick([2, 2, 2, 3, 4]);
  const wind = g.pick([-1, 1]);
  // As large as fits, the turned disc kept inside the picture.
  const [ex, ey] = extents(1, tilt, turn);
  const R = Math.min((w * 0.47) / ex, (h * 0.45) / ey, unit * 0.72);
  const cx = w / 2 + (w / 2 - ex * R) * g.f(-0.6, 0.6);
  const cy = h / 2 + (h / 2 - ey * R) * g.f(-0.6, 0.6);
  const bar = R * g.f(0.26, 0.34);
  const r0 = barred ? bar : R * g.f(0.07, 0.13);
  const turns = g.f(1.05, 1.6) * Math.PI * (arms > 2 ? 0.85 : 1);
  const b = Math.log((R * 0.97) / r0) / (turns * 1.2);
  const skew = g.f(0, Math.PI * 2);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 45, 4), hsl(skyHue + 15, 40, 12)]),
    radial(core, [
      [0, hsl(coreHue + 10, 90, 96), 1],
      [0.25, hsl(coreHue, 90, 78), 0.9],
      [0.6, hsl(coreHue - 5, 80, 60), 0.35],
      [1, hsl(coreHue - 10, 70, 50), 0],
    ]),
    radial(
      armPaint,
      [
        [0, hsl(coreHue, 85, 80), 1],
        [0.4, hsl(armHue, 70, 72), 1],
        [1, hsl(armHue + 10, 60, 60), 1],
      ],
      { gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: Math.round(R) },
    ),
    radial(halo, [
      [0, hsl(armHue, 60, 60), 0.35],
      [1, hsl(armHue, 60, 40), 0],
    ]),
    radial(far, [
      [0, hsl(coreHue, 70, 88), 0.9],
      [1, hsl(armHue, 50, 60), 0],
    ]),
    el(
      "filter",
      { id: soft, x: "-25%", y: "-25%", width: "150%", height: "150%" },
      el("feGaussianBlur", { stdDeviation: R * 0.045 }),
    ),
    el(
      "filter",
      { id: lanes, x: "-25%", y: "-25%", width: "150%", height: "150%" },
      el("feGaussianBlur", { stdDeviation: R * 0.018 }),
    ),
    el(
      "filter",
      { id: fine, x: "-25%", y: "-25%", width: "150%", height: "150%" },
      el("feGaussianBlur", { stdDeviation: Math.max(0.6, R * 0.012) }),
    ),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, h, starCount(g, w, h), unit);
  // One or two tiny far galaxies, kept clear of the big one.
  let farCount = 0;
  for (let k = g.i(1, 2), tries = 0; k > 0 && tries < 30; tries++) {
    const rx = unit * g.f(0.025, 0.045);
    const x = rx * 2 + (w - rx * 4) * g.f(0, 1);
    const y = rx * 2 + (h - rx * 4) * g.f(0, 1);
    const angle = g.f(0, 180);
    const ry = rx * g.f(0.3, 0.8);
    if (Math.hypot((x - cx) / (ex * R + rx * 2), (y - cy) / (ey * R + rx * 2)) < 1) continue;
    k--;
    farCount++;
    out += el("ellipse", {
      cx: x,
      cy: y,
      rx,
      ry,
      fill: `url(#${far})`,
      transform: s`rotate(${angle} ${x} ${y})`,
    });
  }

  // A point on arm `k` at fraction t of its length, in the disc's own (face-on) frame.
  const spiral = (k: number, t: number): Point => {
    const theta = t * turns;
    const r = r0 * Math.exp(b * theta);
    const a = wind * theta + skew + (k * Math.PI * 2) / arms;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const normal = (k: number, t: number): Point => {
    const [x0, y0] = spiral(k, t - 0.01);
    const [x1, y1] = spiral(k, t + 0.01);
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    return [-(y1 - y0) / len, (x1 - x0) / len];
  };
  // An arm as a band out to `end` that widens outward then tapers to its tip.
  const band = (k: number, end: number, width: (t: number) => number, steps = 9) => {
    const left: Point[] = [];
    const right: Point[] = [];
    for (let q = 0; q <= steps; q++) {
      const t = (q / steps) * end;
      const [x, y] = spiral(k, t);
      const [nx, ny] = normal(k, t);
      const half = (width(t) / 2) * Math.min(1, ((end - t) / end) * 3.5, 0.5 + t * 2);
      left.push([x + nx * half, y + ny * half]);
      right.unshift([x - nx * half, y - ny * half]);
    }
    return smoothRing([...left, ...right]);
  };
  let glow = "";
  let bright = "";
  let dust = "";
  // Young stars and knots scattered along each arm, one path per color.
  const dots = ["", "", ""];
  for (let k = 0; k < arms; k++) {
    glow += band(k, 1.2, t => R * (0.15 + 0.2 * t));
    bright += band(k, 1, t => R * (0.05 + 0.07 * t));
    // The dust lane runs along the inside edge of the arm.
    const lane: Point[] = [];
    for (let q = 0; q <= 7; q++) {
      const t = 0.08 + q * 0.11;
      const [x, y] = spiral(k, t);
      const [nx, ny] = normal(k, t);
      const off = wind * R * (0.02 + 0.03 * t);
      lane.push([x + nx * off, y + ny * off]);
    }
    dust += smoothOpen(lane);
    for (let q = Math.round(30 / Math.sqrt(arms)); q > 0; q--) {
      const t = g.f(0.12, 1.05);
      const [x, y] = spiral(k, t);
      const [nx, ny] = normal(k, t);
      const off = R * (0.03 + 0.08 * t) * g.f(-1, 1);
      const kind = g.chance(0.22) ? 1 : g.chance(0.25) ? 2 : 0;
      dots[kind] += pathOf("M", [[x + nx * off, y + ny * off]]) + "h0";
    }
  }
  let disc = el("circle", { r: Math.round(R), fill: `url(#${halo})` });
  disc += el(
    "g",
    { filter: `url(#${soft})` },
    el("path", { d: glow, fill: `url(#${armPaint})`, opacity: 0.45 }),
    el("path", { d: bright, fill: `url(#${armPaint})`, opacity: 0.7 }),
  );
  const dotWidths = [R * 0.028, R * 0.05, R * 0.018];
  const dotColors = [hsl(armHue - 5, 80, 82), hsl(knotHue, 80, 72), "#ffffff"];
  disc += el(
    "g",
    { filter: `url(#${lanes})` },
    el("path", {
      d: dust,
      fill: "none",
      stroke: hsl(skyHue, 40, 6),
      "stroke-width": R * 0.04,
      "stroke-linecap": "round",
      opacity: 0.42,
    }),
  );
  disc += el(
    "g",
    { filter: `url(#${fine})` },
    ...dots.map((d, k) =>
      el("path", {
        d,
        stroke: dotColors[k],
        "stroke-width": dotWidths[k],
        "stroke-linecap": "round",
        opacity: k === 1 ? 0.85 : 0.75,
      }),
    ),
  );
  if (barred)
    disc += el("ellipse", {
      rx: Math.round(bar * 1.1),
      ry: Math.round(bar * 0.3),
      fill: `url(#${core})`,
      transform: s`rotate(${(skew * 180) / Math.PI})`,
    });
  out += el(
    "g",
    {
      transform: `translate(${Math.round(cx)} ${Math.round(cy)})rotate(${Math.round(turn)})scale(1 ${tilt.toFixed(2)})`,
    },
    disc,
  );
  // The core's bulge stands out of the disc, so it is squashed less than the disc.
  const bulge = R * (barred ? g.f(0.15, 0.19) : g.f(0.24, 0.32));
  out += el("ellipse", {
    cx,
    cy,
    rx: bulge,
    ry: bulge * (0.55 + 0.45 * tilt),
    fill: `url(#${core})`,
    transform: s`rotate(${turn} ${cx} ${cy})`,
  });
  out += el("circle", { cx, cy, r: R * 0.035, fill: hsl(coreHue + 10, 90, 97) });
  // A few crisp foreground stars.
  out += starDots(g, w, h, Math.round(starCount(g, w, h) / 4), unit);
  const view = tilt > 0.82 ? "seen face-on" : tilt > 0.55 ? "seen at a tilt" : "seen at a steep slant";
  note.alt(
    `A ${barred ? "barred " : ""}spiral galaxy ${view} among distant stars${farCount ? `, with ${farCount === 2 ? "two tiny far galaxies" : "a tiny far galaxy"} beyond` : ""}`,
  );
  note.focus(cx, cy);
  return out;
});

/** A black hole: a dark shadow in a thin bright ring, its glowing disc passing in front and bent up over the top. */
export const blackHole = defineKind("black-hole", "Black hole", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(225, 275);
  const sky = g.id("sky");
  const heat = g.id("heat");
  const lens = g.id("lens");
  const beam = g.id("beam");
  const lit = g.id("lit");
  const aura = g.id("aura");
  const jet = g.id("jet");
  // The disc: classic hot gold, blue-white, or magenta.
  const hue = g.pick([g.f(26, 42), g.f(205, 222), g.f(300, 325)]);
  const open = g.chance(0.3) ? g.f(0.2, 0.3) : g.f(0.07, 0.16);
  const turn = g.f(-1, 1) * (w > h * 1.5 ? 10 : 24);
  const width = g.f(2.4, 3.4);
  const arch = g.f(1.5, 1.85);
  const toward = g.pick([-1, 1]);
  const jets = g.chance(0.35);
  // The shadow's radius, as large as lets the disc and the bent light above it fit.
  const [ex, ey] = extents(width, width * open, turn);
  const rs = Math.min((w * 0.45) / Math.max(ex, arch), (h * 0.42) / Math.max(ey, arch), unit * 0.24);
  const cx = w / 2;
  const cy = h / 2 + rs * 0.1;
  const D = rs * width;
  const inner = rs * 1.12;
  const edge = inner / D;
  const hot = hsl(hue + 12, 95, 95);
  const warm = hsl(hue, 95, 66);
  const deep = hsl(hue - 14, 90, 42);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 45, 4), hsl(skyHue + 15, 40, 10)]),
    radial(
      heat,
      [
        [edge, warm, 0.5],
        [edge + 0.06, hot, 1],
        [edge + (1 - edge) * 0.35, warm, 1],
        [edge + (1 - edge) * 0.7, deep, 0.75],
        [1, deep, 0],
      ],
      { gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: Math.round(D) },
    ),
    radial(
      lens,
      [
        [1 / arch, hot, 1],
        [(1 / arch + 1) / 2, warm, 0.95],
        [1, deep, 0],
      ],
      { gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: Math.round(rs * arch) },
    ),
    // The side of the disc turning toward us shines brighter: a mask that lets light through on that side.
    el(
      "linearGradient",
      {
        id: lit,
        gradientUnits: "userSpaceOnUse",
        x1: Math.round(-D * toward),
        x2: Math.round(D * toward),
        y1: 0,
        y2: 0,
      },
      el("stop", { offset: 0.1, "stop-color": "#ffffff" }),
      el("stop", { offset: 0.75, "stop-color": "#000000" }),
    ),
    el(
      "mask",
      {
        id: beam,
        maskUnits: "userSpaceOnUse",
        x: Math.round(-D),
        y: Math.round(-D),
        width: Math.round(D * 2),
        height: Math.round(D * 2),
      },
      el("rect", {
        x: Math.round(-D),
        y: Math.round(-D),
        width: Math.round(D * 2),
        height: Math.round(D * 2),
        fill: `url(#${lit})`,
      }),
    ),
    radial(aura, [
      [0.25, warm, 0.4],
      [1, deep, 0],
    ]),
    el(
      "linearGradient",
      { id: jet, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": hsl(215, 80, 88), "stop-opacity": 0 }),
      el("stop", { offset: 0.5, "stop-color": hsl(215, 80, 88), "stop-opacity": 0.4 }),
      el("stop", { offset: 1, "stop-color": hsl(215, 80, 88), "stop-opacity": 0 }),
    ),
  );
  out += fill(w, h, `url(#${sky})`);
  // Stars, those near the hole drawn out a little along circles around it.
  const reach = rs * 2.6;
  let dots = "";
  let arcs = "";
  for (let k = starCount(g, w, h); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = h * g.f(0, 1);
    const d = Math.hypot(x - cx, y - cy);
    if (d > reach || d < rs * 1.2) {
      dots += s`M${x} ${y}h0`;
      continue;
    }
    const a = Math.atan2(y - cy, x - cx);
    const span = Math.min(0.16, 0.035 * (reach / d) ** 2);
    arcs += s`M${cx + Math.cos(a - span) * d} ${cy + Math.sin(a - span) * d}A${d} ${d} 0 0 1 ${cx + Math.cos(a + span) * d} ${cy + Math.sin(a + span) * d}`;
  }
  const star = unit * 0.007;
  out += el("path", { d: dots, stroke: "#fff", "stroke-width": star, "stroke-linecap": "round", opacity: 0.75 });
  out += el("path", {
    d: arcs,
    stroke: "#fff",
    "stroke-width": star * 0.8,
    "stroke-linecap": "round",
    fill: "none",
    opacity: 0.6,
  });

  // Everything else is drawn turned with the disc, centered on the hole.
  let hole = el("ellipse", { rx: Math.round(D * 1.2), ry: Math.round(rs * 2.6), fill: `url(#${aura})` });
  if (jets) {
    const len = rs * g.f(2.6, 3.4);
    const base = rs * 0.035;
    hole += el("path", {
      d: s`M${-base} 0L${-base * 4} ${-len}H${base * 4}L${base} 0L${base * 4} ${len}H${-base * 4}Z`,
      fill: `url(#${jet})`,
    });
  }
  // Half of the disc, squashed by the tilt: the far half (side -1) or the near half (side 1).
  const half = (side: number) => {
    const sweep = side > 0 ? 0 : 1;
    return s`M${-D} 0A${D} ${D} 0 0 ${sweep} ${D} 0H${inner}A${inner} ${inner} 0 0 ${1 - sweep} ${-inner} 0Z`;
  };
  // Swirling streaks on a half of the disc, light and dark.
  const streaks = (side: number) => {
    let light = "";
    let dark = "";
    for (let k = 0; k < 6; k++) {
      const r = inner + (D - inner) * g.f(0.08, 0.6);
      const a0 = g.f(0.05, 0.6) * Math.PI;
      const a1 = a0 + g.f(0.2, 0.4) * Math.PI;
      const arc = s`M${Math.cos(a0) * r} ${Math.sin(a0) * r * side}A${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${Math.cos(a1) * r} ${Math.sin(a1) * r * side}`;
      if (k % 2) dark += arc;
      else light += arc;
    }
    return (
      el("path", { d: light, fill: "none", stroke: hot, "stroke-width": rs * 0.08, opacity: 0.22 }) +
      el("path", { d: dark, fill: "none", stroke: deep, "stroke-width": rs * 0.1, opacity: 0.3 })
    );
  };
  const squash = `scale(1 ${open.toFixed(3)})`;
  // A shape in the disc's glow: dimmer, plus a brighter copy masked to the side turning toward us.
  const glowing = (d: string, paint: string, alpha = 1) =>
    el("path", { d, fill: `url(#${paint})`, opacity: 0.75 * alpha }) +
    el("path", { d, fill: `url(#${paint})`, mask: `url(#${beam})`, opacity: alpha === 1 ? undefined : alpha });
  const disc = (side: number) => el("g", { transform: squash }, glowing(half(side), heat), streaks(side));
  hole += disc(-1);
  // The far side of the disc, its light bent up over the top of the hole and, fainter, under it.
  const top = rs * arch;
  const under = rs * 1.16;
  const ring = rs * 1.03;
  hole += glowing(s`M${-top} 0A${top} ${top} 0 0 1 ${top} 0H${ring}A${ring} ${ring} 0 0 0 ${-ring} 0Z`, lens);
  hole += glowing(
    s`M${-under} 0A${under} ${under} 0 0 0 ${under} 0H${ring}A${ring} ${ring} 0 0 1 ${-ring} 0Z`,
    lens,
    0.6,
  );
  let bands = "";
  for (let k = 0; k < 3; k++) {
    const r = rs * (1.12 + ((arch - 1.12) * (k + g.f(0.2, 0.8))) / 3);
    const a = g.f(0, 0.25) * Math.PI;
    bands += s`M${-Math.cos(a) * r} ${-Math.sin(a) * r}A${r} ${r} 0 0 1 ${Math.cos(a + 0.3) * r} ${-Math.sin(a + 0.3) * r}`;
  }
  hole += el("path", { d: bands, fill: "none", stroke: deep, "stroke-width": rs * 0.05, opacity: 0.3 });
  // The shadow and its thin photon ring.
  hole += el("circle", { r: rs, fill: "#000" });
  hole += el("circle", { r: ring, fill: "none", stroke: warm, "stroke-width": rs * 0.12, opacity: 0.45 });
  hole += el("circle", { r: ring, fill: "none", stroke: hot, "stroke-width": rs * 0.035 });
  hole += disc(1);
  out += el("g", { transform: s`translate(${cx} ${cy})rotate(${turn})` }, hole);
  note.alt(
    `A black hole ringed by a glowing accretion disc${open > 0.2 ? " seen from a little above" : ""}${jets ? ", faint jets streaming from its poles" : ""}, among stars`,
  );
  note.focus(cx, cy);
  return out;
});
