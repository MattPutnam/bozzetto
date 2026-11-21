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
