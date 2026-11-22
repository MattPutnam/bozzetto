import { defineKind, el, hex, hsl, lin, type Point, type Rand, s } from "../../draw/core";
import { dot, fit, place, type Spot } from "./shared";

/** The top of a wooden bench seen from above: planks running across with gaps between. */
function bench(g: Rand, w: number, h: number): string {
  const unit = Math.min(w, h);
  const hue = g.f(24, 38);
  const light = g.f(48, 66);
  let out = el("rect", { width: w, height: h, fill: hex(hue, 30, 18) });
  const count = Math.max(3, Math.round(h / (unit * g.f(0.2, 0.28))));
  const ph = h / count;
  const gap = Math.max(1.5, unit * 0.012);
  const off = g.f(0, ph);
  let grain = "";
  for (let k = -1; k <= count; k++) {
    const y = k * ph + off - ph / 2;
    out += el("rect", {
      y: y + gap / 2,
      width: w,
      height: ph - gap,
      fill: hex(hue + g.f(-3, 3), 38, light + g.f(-4, 4)),
    });
    for (let j = 0; j < 3; j++) {
      const gy = y + ph * g.f(0.2, 0.8);
      grain += s`M0 ${gy}C${w * 0.3} ${gy + g.f(-1, 1) * ph * 0.2} ${w * 0.7} ${gy + g.f(-1, 1) * ph * 0.2} ${w} ${gy}`;
    }
  }
  out += el("path", {
    d: grain,
    stroke: "#000",
    opacity: 0.08,
    fill: "none",
    "stroke-width": Math.max(1, unit * 0.004),
  });
  return out;
}

/** Ice seen from above, scratched by skates, with a painted line under it sometimes. */
function ice(g: Rand, w: number, h: number): string {
  const unit = Math.min(w, h);
  const id = g.id("ice");
  let out = el("defs", {}, lin(id, [hsl(g.f(195, 205), 45, 95), hsl(g.f(198, 210), 38, 87)]));
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  if (g.chance(0.4)) {
    const x = w * g.f(0.1, 0.9);
    out += el("path", {
      d: s`M${x} ${-h * 0.1}L${x + g.f(-0.3, 0.3) * w} ${h * 1.1}`,
      stroke: g.pick([hsl(355, 65, 58), hsl(220, 60, 52)]),
      opacity: 0.35,
      "stroke-width": unit * 0.09,
    });
  }
  // Skate scratches: long shallow arcs, and a little snow.
  let cut = "";
  let shade = "";
  for (let k = g.i(12, 18); k > 0; k--) {
    const x = g.f(-0.1, 1.1) * w;
    const y = g.f(0, 1) * h;
    const len = unit * g.f(0.3, 0.9);
    const a = g.f(0, Math.PI);
    const dx = Math.cos(a) * len;
    const dy = Math.sin(a) * len;
    const bend = g.f(-0.25, 0.25) * len;
    const arc = s`M${x} ${y}q${dx / 2 - (dy / len) * bend} ${dy / 2 + (dx / len) * bend} ${dx} ${dy}`;
    if (k % 3) cut += arc;
    else shade += arc;
  }
  out += el("path", {
    d: cut,
    stroke: "#ffffff",
    opacity: 0.8,
    fill: "none",
    "stroke-width": Math.max(0.8, unit * 0.004),
  });
  out += el("path", {
    d: shade,
    stroke: hsl(205, 25, 62),
    opacity: 0.3,
    fill: "none",
    "stroke-width": Math.max(0.6, unit * 0.003),
  });
  let snow = "";
  for (let k = g.i(2, 4); k > 0; k--) {
    const x = g.f(0, w);
    const y = g.f(0, h);
    const r = unit * g.f(0.03, 0.07);
    snow += s`M${x - r} ${y}a${r} ${r * 0.4} 0 1 0 ${r * 2} 0a${r} ${r * 0.4} 0 1 0 ${-r * 2} 0`;
  }
  out += el("path", { d: snow, fill: "#ffffff", opacity: 0.55 });
  return out;
}

/** A ribbed rubber floor mat, as in a locker room, seen from above. */
function mat(g: Rand, w: number, h: number): string {
  const unit = Math.min(w, h);
  const base = hex(g.pick([210, 220, 30, 0, 150]), g.f(4, 14), g.f(20, 28));
  let out = el("rect", { width: w, height: h, fill: base });
  const t = unit * 0.045;
  const id = g.id("rib");
  out += el(
    "defs",
    {},
    el(
      "pattern",
      { id, width: t, height: t, patternUnits: "userSpaceOnUse", patternTransform: s`rotate(${g.pick([0, 45])})` },
      el("rect", {
        x: t * 0.15,
        y: t * 0.4,
        width: t * 0.7,
        height: t * 0.2,
        rx: t * 0.1,
        fill: "#ffffff",
        opacity: 0.08,
      }),
      el("rect", { x: t * 0.15, y: t * 0.62, width: t * 0.7, height: t * 0.08, fill: "#000", opacity: 0.25 }),
    ),
  );
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  // Seams between tiles.
  const tile = unit * g.f(0.55, 0.8);
  let d = "";
  for (let x = g.f(0, tile); x < w; x += tile) d += s`M${x} 0V${h}`;
  for (let y = g.f(0, tile); y < h; y += tile) d += s`M0 ${y}H${w}`;
  out += el("path", { d, stroke: "#000", opacity: 0.35, "stroke-width": Math.max(1, unit * 0.006) });
  return out;
}

/** A hockey stick lying flat, butt at (0, 0) and shaft along +x, blade turning toward -y. */
function stick(g: Rand, len: number): string {
  const wood = g.chance(0.4);
  const shaftPaint = wood ? hex(g.f(30, 38), 45, g.f(58, 68)) : hex(g.f(0, 360), g.f(10, 50), g.f(18, 40));
  const accent = hex(g.f(0, 360), 65, 55);
  const tape = g.pick(["#1f2024", "#f2f1ec", hex(220, 40, 28), "#e3e1d8"]);
  const knobTape = g.pick(["#f2f1ec", "#1f2024", tape]);
  const sw = len * 0.032;
  const bl = len * 0.21;
  const bh = len * 0.055;
  let out = "";
  // The blade, turned 45 degrees at the heel with its bottom edge on the outside of the bend, its toe
  // rounded and curving a little. It is drawn upside down, then flipped into place.
  const blade = s`M${-sw * 0.6} ${-sw / 2}L${bl * 0.8} ${-sw / 2 - bh * 0.12}Q${bl} ${-sw / 2 - bh * 0.15} ${bl * 1.02} ${bh * 0.4}
    Q${bl} ${bh - sw / 2} ${bl * 0.8} ${bh - sw / 2}L${sw * 0.4} ${bh - sw / 2}Q${-sw * 0.8} ${bh - sw / 2} ${-sw * 0.6} ${-sw / 2}Z`;
  const id = g.id("blade");
  let tapeMarks = "";
  for (let k = 0; k < 9; k++) {
    const x = bl * (0.18 + k * 0.095);
    tapeMarks += s`M${x} ${-bh * 0.3}l${bh * 0.25} ${bh * 1.6}`;
  }
  const bladeGroup =
    el("defs", {}, el("clipPath", { id }, el("path", { d: blade }))) +
    el("path", { d: blade, fill: shaftPaint }) +
    el(
      "g",
      { "clip-path": `url(#${id})` },
      el("rect", { x: bl * 0.16, y: -bh, width: bl, height: bh * 2, fill: tape }),
      el("path", { d: tapeMarks, stroke: "#000", opacity: 0.2, "stroke-width": len * 0.003 }),
    );
  // The shadow, then the shaft and blade.
  const shade = `translate(${(len * 0.012).toFixed(1)} ${(len * 0.016).toFixed(1)})`;
  out += el(
    "g",
    { transform: shade, fill: "#000", opacity: 0.2 },
    el("rect", { x: 0, y: -sw / 2, width: len, height: sw, rx: sw * 0.3 }),
    el("path", { d: blade, transform: s`translate(${len} 0) rotate(-45) scale(1 -1)` }),
  );
  out += el("g", { transform: s`translate(${len} 0) rotate(-45) scale(1 -1)` }, bladeGroup);
  out += el("rect", { x: 0, y: -sw / 2, width: len, height: sw, rx: sw * 0.3, fill: shaftPaint });
  // A graphic band on a composite shaft, or grain on a wooden one.
  if (wood)
    out += el("path", {
      d: s`M${len * 0.15} ${-sw * 0.15}H${len * 0.6}M${len * 0.4} ${sw * 0.2}H${len * 0.9}`,
      stroke: "#000",
      opacity: 0.12,
      "stroke-width": len * 0.003,
    });
  else out += el("rect", { x: len * 0.55, y: -sw / 2, width: len * 0.18, height: sw, fill: accent });
  out += el("rect", { x: 0, y: -sw * 0.42, width: len, height: sw * 0.22, fill: "#ffffff", opacity: 0.18 });
  // Tape wound around the top of the shaft, building a knob at the end.
  let wraps = "";
  for (let k = 0; k < 7; k++) wraps += s`M${len * (0.012 + k * 0.012)} ${-sw * 0.56}l${len * 0.01} ${sw * 1.12}`;
  out += el("rect", {
    x: -len * 0.006,
    y: -sw * 0.56,
    width: len * 0.1,
    height: sw * 1.12,
    rx: sw * 0.3,
    fill: knobTape,
  });
  out += el("ellipse", { cx: 0, cy: 0, rx: sw * 0.45, ry: sw * 0.68, fill: knobTape });
  out += el("ellipse", { cx: 0, cy: 0, rx: sw * 0.45, ry: sw * 0.68, fill: "#000", opacity: 0.12 });
  out += el("path", { d: wraps, stroke: "#000", opacity: 0.2, "stroke-width": len * 0.003 });
  return out;
}

/** A hockey puck at (0, 0), seen at an angle: its top face and the band of its side. */
function puck(r: number): string {
  const ry = r * 0.6;
  const t = r * 0.5;
  return (
    el("ellipse", { cx: r * 0.15, cy: t + ry * 0.2, rx: r * 1.15, ry: ry * 1.1, fill: "#000", opacity: 0.25 }) +
    el("path", { d: s`M${-r} 0V${t}A${r} ${ry} 0 0 0 ${r} ${t}V0Z`, fill: "#141518" }) +
    el("path", {
      d: s`M${-r} ${t * 0.35}A${r} ${ry} 0 0 0 ${r} ${t * 0.35}`,
      fill: "none",
      stroke: "#ffffff",
      opacity: 0.08,
      "stroke-width": r * 0.06,
    }) +
    el("ellipse", { cx: 0, cy: 0, rx: r, ry, fill: "#26282c" }) +
    el("ellipse", { cx: 0, cy: 0, rx: r * 0.45, ry: ry * 0.45, fill: "#ffffff", opacity: 0.12 })
  );
}

/** A hockey player's helmet lying face up, seen from the front, about 48 units tall. */
function playerHelmet(g: Rand, visor: boolean): string {
  const shell = g.pick([hex(g.f(0, 360), g.f(50, 70), g.f(35, 50)), hex(220, 10, 18), "#eeece6"]);
  const metal = g.pick(["#c9cdd2", "#26272b", "#e9e7e1"]);
  const outline =
    "M-20 6C-22 -14-13 -27 0 -27C13 -27 22 -14 20 6L18 16Q16 19 13 17L13 0Q0 -5-13 0L-13 17Q-16 19-18 16Z";
  let out = el("path", { d: outline, transform: "translate(2.5 3)", fill: "#000", opacity: 0.25 });
  if (!visor)
    out += el("path", {
      d: "M-14 -2L-14 12Q-12 22 0 25Q12 22 14 12L14 -2Z",
      transform: "translate(2.5 3)",
      fill: "#000",
      opacity: 0.2,
    });
  // The padded inside, seen through the face opening.
  out += el("path", { d: "M-14 -2Q0 -6 14 -2L14 16Q0 24-14 16Z", fill: "#2a2b30" });
  out += el("path", { d: "M-9 3Q0 0 9 3", stroke: "#000", opacity: 0.4, "stroke-width": 1.2, fill: "none" });
  out += el("path", { d: outline, fill: shell });
  // Vents and ridges on the dome, ear holes, and the shading.
  out += el("path", {
    d: "M-10 -16v-4M0 -19v-5M10 -16v-4",
    stroke: "#000",
    opacity: 0.4,
    "stroke-width": 3,
    "stroke-linecap": "round",
  });
  out += el("path", {
    d: "M-6 -6Q-7 -16-5 -25M6 -6Q7 -16 5 -25",
    stroke: "#000",
    opacity: 0.12,
    "stroke-width": 1.2,
    fill: "none",
  });
  out += el("path", { d: dot(-16, 8, 1.6) + dot(16, 8, 1.6), fill: "#1f2024" });
  out += el("ellipse", {
    cx: -8,
    cy: -19,
    rx: 7,
    ry: 4,
    transform: "rotate(-25 -8 -19)",
    fill: "#ffffff",
    opacity: 0.28,
  });
  // The chin strap.
  out += el("path", { d: "M-15 15Q-8 26 0 27Q8 26 15 15", stroke: "#1f2024", "stroke-width": 1.4, fill: "none" });
  if (visor) {
    out += el("path", { d: "M-15 -3Q0 -7 15 -3L14 8Q0 12-14 8Z", fill: hsl(200, 35, 85), opacity: 0.45 });
    out += el("path", { d: "M-12 -1Q-6 -3-2 -3", stroke: "#ffffff", opacity: 0.8, "stroke-width": 1.2, fill: "none" });
    out += el("path", { d: dot(-14, 2, 1.1) + dot(14, 2, 1.1), fill: metal });
  } else {
    // A wire cage over the face, with a chin cup.
    out += el("path", {
      d: "M-14 -2L-14 12Q-12 22 0 25Q12 22 14 12L14 -2M-9 -2V19M-4.5 -2V22M0 -2V24M4.5 -2V22M9 -2V19M-14 6H14M-13.5 13H13.5",
      stroke: metal,
      fill: "none",
      "stroke-width": 1.1,
      "stroke-linecap": "round",
    });
    out += el("ellipse", { cx: 0, cy: 25, rx: 6, ry: 2.8, fill: "#1f2024" });
  }
  return out;
}

/** A goalie mask lying face up, seen from the front: an egg-shaped shell, a cage and painted art. */
function goalieMask(g: Rand): string {
  const hue = g.f(0, 360);
  const base = g.pick([hex(hue, g.f(50, 70), g.f(40, 55)), "#eeece6", hex(hue, 10, 18)]);
  const art = g.pick([hex(hue + 180, 65, 55), hex(g.f(30, 55), 85, 58), "#f4f1e8", hex(hue + 30, 70, 45)]);
  const metal = g.pick(["#e9e7e1", "#26272b", hex(45, 60, 55)]);
  const outline = "M0 -28C15 -28 21 -16 20 -4C19 10 12 22 0 26C-12 22-19 10-20 -4C-21 -16-15 -28 0 -28Z";
  const id = g.id("mask");
  let out = el("defs", {}, el("clipPath", { id }, el("path", { d: outline })));
  out += el("path", { d: outline, transform: "translate(2.5 3)", fill: "#000", opacity: 0.25 });
  out += el("path", { d: outline, fill: base });
  // The painted art, kept on the shell.
  const style = g.i(0, 3);
  let paint: string;
  if (style === 0)
    paint = el("path", {
      d: "M-24 -10Q-8 -30 24 -22M-24 -2Q-6 -24 24 -14M-24 6Q-4 -18 24 -6",
      stroke: art,
      "stroke-width": 3.5,
      fill: "none",
    });
  else if (style === 1)
    paint = el("path", {
      d: "M-22 30L-20 4L-15 14L-12 -6L-7 10L-4 -14L0 6L4 -14L7 10L12 -6L15 14L20 4L22 30Z",
      fill: art,
    });
  else if (style === 2) {
    paint = el("rect", { x: -5, y: -30, width: 10, height: 26, fill: art });
    paint += el("path", { d: dot(-12, -14, 2.4) + dot(12, -14, 2.4), fill: art });
  } else
    paint = el("path", {
      d: "M-22 -12Q-12 -16-6 -8Q-12 -4-22 -2ZM22 -12Q12 -16 6 -8Q12 -4 22 -2Z",
      fill: art,
    });
  paint += el("ellipse", {
    cx: -7,
    cy: -18,
    rx: 7,
    ry: 4.5,
    transform: "rotate(-25 -7 -18)",
    fill: "#ffffff",
    opacity: 0.3,
  });
  paint += el("path", { d: "M-20 10Q0 34 20 10L20 30H-20Z", fill: "#000", opacity: 0.12 });
  out += el("g", { "clip-path": `url(#${id})` }, paint);
  // Strap clips at the sides.
  out += el("path", { d: "M-20 -8v6M20 -8v6", stroke: "#1f2024", "stroke-width": 2.4, "stroke-linecap": "round" });
  // The cat-eye cage over the face.
  const cage = "M-15 -6Q0 -10 15 -6Q15 6 8 16Q0 21-8 16Q-15 6-15 -6Z";
  const cid = g.id("cage");
  out += el("defs", {}, el("clipPath", { id: cid }, el("path", { d: cage })));
  out += el("path", { d: cage, fill: "#1f2024", opacity: 0.75 });
  out += el(
    "g",
    { "clip-path": `url(#${cid})` },
    el("path", {
      d: "M-10 -12V24M-5 -12V24M0 -12V24M5 -12V24M10 -12V24M-16 4H16M-16 11H16",
      stroke: metal,
      "stroke-width": 1.1,
    }),
  );
  out += el("path", { d: cage, fill: "none", stroke: metal, "stroke-width": 1.5 });
  return out;
}

/**
 * A hockey stick, a puck and a helmet or goalie mask on the ice, a rubber mat or a bench.
 *
 * @category Sports
 */
export const hockey = /* @__PURE__ */ defineKind(
  "hockey",
  "Hockey",
  { headgear: ["helmet", "goalie"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const headgear = g.option("headgear", g.chance(0.6) ? "helmet" : "goalie");
    const where = g.pick(["ice", "ice", "ice", "mat", "bench"] as const);
    let out = where === "ice" ? ice(g, w, h) : where === "mat" ? mat(g, w, h) : bench(g, w, h);
    // The stick runs from upper left to lower right at about the picture's diagonal; mirrored
    // pictures show a stick for the other hand.
    const flip = g.chance(0.5);
    const len = 200;
    const phi = ((Math.atan2(h, w) * 180) / Math.PI) * (w < h ? g.f(0.95, 1.1) : g.f(0.6, 0.85));
    const p = (phi * Math.PI) / 180;
    const ux = Math.cos(p);
    const uy = Math.sin(p);
    const toe = ((phi - 45) * Math.PI) / 180;
    const heel: Point = [ux * len, uy * len];
    const tip: Point = [heel[0] + Math.cos(toe) * 44, heel[1] + Math.sin(toe) * 44];
    // Close up, the butt end of the stick runs out of the picture; wide pictures show all of it.
    const from = w / h > 2.2 ? 0 : g.f(0.35, 0.55);
    // The helmet lies below the shaft, partly over it; the puck sits in front of the blade.
    const t = from + (1 - from) * g.f(0.2, 0.45);
    const off = g.f(18, 30);
    const head: Spot = { x: ux * len * t - uy * off * -1, y: uy * len * t + ux * off, r: 30 };
    const pk: Spot = {
      x: heel[0] + Math.cos(toe) * 26 + Math.cos(toe + Math.PI / 2) * g.f(16, 26),
      y: heel[1] + Math.sin(toe) * 26 + Math.sin(toe + Math.PI / 2) * g.f(16, 26),
      r: 9,
    };
    const spots: Spot[] = [
      { x: ux * len * from, y: uy * len * from, r: 6 },
      { x: heel[0], y: heel[1], r: 10 },
      { x: tip[0], y: tip[1], r: 8 },
      head,
      pk,
    ];
    const { k, at } = fit(spots, w, h, unit * 0.05);
    out += s`<g transform="translate(${w / 2} 0) scale(${flip ? -1 : 1} 1) translate(${-w / 2} 0)">`;
    const [sx, sy] = at(0, 0);
    out += el("g", { transform: place(sx, sy, k, phi) }, stick(g, len));
    const [px, py] = at(pk.x, pk.y);
    out += el("g", { transform: place(px, py, k) }, puck(7));
    const [hx, hy] = at(head.x, head.y);
    const visor = g.chance(0.5);
    out += el(
      "g",
      { transform: place(hx, hy, k * 1.05, g.f(-25, 25)) },
      headgear === "helmet" ? playerHelmet(g, visor) : goalieMask(g),
    );
    out += "</g>";
    const gear = headgear === "helmet" ? `a helmet with a ${visor ? "visor" : "cage"}` : "a goalie mask";
    const ground = where === "ice" ? "on the ice" : where === "mat" ? "on a rubber mat" : "on a bench";
    note.alt(`A hockey stick, a puck and ${gear} ${ground}`);
    note.focus(flip ? w - hx : hx, hy);
    return out;
  },
);
