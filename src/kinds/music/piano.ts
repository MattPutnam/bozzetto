import { defineKind, el, fill, hsl, mix, type Point, s } from "../../draw/core";
import { room } from "./shared";

/** Whether a black key follows white key k, counting white keys from C. */
const blackAfter = (k: number): boolean => [0, 1, 3, 4, 5].includes(((k % 7) + 7) % 7);

/**
 * An upright piano against a wall, or a close-up of its keys at an angle.
 *
 * @category Music
 */
export const piano = /* @__PURE__ */ defineKind("piano", "Piano", { view: ["upright", "keys"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const view = g.option("view", g.chance(0.55) ? "upright" : "keys");
  const finish = g.pick([
    "#1c1a1d",
    "#1c1a1d",
    g.pick(["#4a2c1c", "#5a3522", "#3d2418"]),
    g.pick(["#8a5a3b", "#7a5236", "#94643f"]),
    "#ece8df",
  ]);
  const light = finish === "#ece8df";
  const ivory = g.pick(["#fbfaf6", "#f6f1e4"]);
  const ebony = "#1a181b";
  const edge = light ? mix(finish, "#000000", 0.15) : mix(finish, "#ffffff", 0.12);
  if (view === "keys") {
    // Keys laid out along u (white keys) and v (0 at the front edge, 1 at the back), sheared
    // into an oblique view from above and in front.
    const depth = h * g.f(0.42, 0.55);
    const kw = Math.max(unit * 0.09, depth / 4, w / 22);
    const tilt = g.f(-1, 1) * Math.min(0.3, (0.3 * h) / w);
    const ax = kw * Math.cos(tilt);
    const ay = kw * Math.sin(tilt);
    const bx = depth * g.f(0.1, 0.4) * (g.chance(0.5) ? 1 : -1);
    const by = -depth;
    const ox = w / 2;
    const oy = h * g.f(0.66, 0.72) + depth * 0.05;
    const P = (u: number, v: number, up = 0): Point => [ox + u * ax + v * bx, oy + u * ay + v * by - up];
    const poly = (ps: Point[]) => ps.map(p => s`${p[0]} ${p[1]}`).join(" L ");
    const thick = kw * 0.45;
    const rise = kw * 0.22;
    const reach = (w + Math.abs(bx) + kw * 4) / ax / 2;
    const u0 = Math.floor(-reach);
    const u1 = Math.ceil(reach);
    const shift = g.i(0, 6);
    let out = fill(w, h, finish);
    // A lacquer glint along the fallboard, and the felt strip along the back of the keys
    out += el("path", {
      d: `M ${poly([P(u0, 1, kw * 1.2), P(u1, 1, kw * 1.2), P(u1, 1, kw * 1.35), P(u0, 1, kw * 1.35)])} Z`,
      fill: "#fff",
      opacity: light ? "0.4" : "0.12",
    });
    out += el("path", {
      d: `M ${poly([P(u0, 1, 0), P(u1, 1, 0), P(u1, 1.06, kw * 0.25), P(u0, 1.06, kw * 0.25)])} Z`,
      fill: g.pick(["#7a1f2a", "#2f4f3a", "#6b1d1d"]),
    });
    // The white keys' tops and front edges, then the gaps between them
    out += el("path", { d: `M ${poly([P(u0, 0), P(u1, 0), P(u1, 1), P(u0, 1)])} Z`, fill: ivory });
    out += el("path", {
      d: `M ${poly([P(u0, 0), P(u1, 0), P(u1, 0, -thick), P(u0, 0, -thick)])} Z`,
      fill: mix(ivory, "#000000", 0.18),
    });
    let gaps = "";
    for (let k = u0; k < u1; k++) {
      const [fx, fy] = P(k, 0, -thick);
      gaps += s`M ${fx} ${fy} l 0 ${-thick} ${bx} ${by} `;
    }
    out += el("path", { d: gaps, stroke: "#4a4547", "stroke-width": kw * 0.045, fill: "none" });
    // Black keys at the back of the keys, each about 0.58 of a white key long, with a front face below its top
    const v0 = 0.42;
    const kx = 0.54 * ax;
    const ky = 0.54 * ay;
    const lx = (1 - v0) * bx;
    const ly = (1 - v0) * by;
    let faces = "";
    let blackTops = "";
    for (let k = u0; k < u1; k++) {
      if (!blackAfter(k + shift)) continue;
      const [x, y] = P(k + 1 - 0.27, v0);
      faces += s`M ${x} ${y} l ${kx} ${ky} 0 ${-rise} ${-kx} ${-ky} z `;
      blackTops += s`M ${x} ${y - rise} l ${kx} ${ky} ${lx} ${ly} ${-kx} ${-ky} z `;
    }
    out += el("path", { d: faces, fill: "#000" });
    out += el("path", { d: blackTops, fill: ebony });
    // Glints on the black keys' front edges
    out += el("path", {
      d: blackTops,
      fill: "none",
      stroke: "#fff",
      "stroke-opacity": "0.12",
      "stroke-width": kw * 0.03,
    });
    // The key slip below the keys, with its own glint
    out += el("path", {
      d: `M ${poly([P(u0, -0.05, -thick - kw * 0.15), P(u1, -0.05, -thick - kw * 0.15), P(u1, -0.05, -thick - kw * 0.2), P(u0, -0.05, -thick - kw * 0.2)])} Z`,
      fill: "#fff",
      opacity: light ? "0.4" : "0.1",
    });
    note.alt("A close-up of piano keys seen at an angle");
    note.focus(...P(0, 0.5));
    return out;
  }
  // An upright piano standing on the floor against the wall
  const floorY = h * g.f(0.86, 0.9);
  let out = room(g, w, h, floorY);
  const PW = Math.min(w * 0.92, (floorY - h * 0.22) / 0.8) * g.f(0.94, 1);
  const PH = PW * 0.8;
  const cx = w / 2 + (w - PW) * g.f(-0.25, 0.25);
  const left = cx - PW / 2;
  const Y = (v: number) => floorY - v * PH;
  const shade = mix(finish, "#000000", 0.25);
  out += el("ellipse", { cx, cy: floorY, rx: PW * 0.55, ry: unit * 0.02, fill: "#000", opacity: "0.18" });
  // Cabinet, lid and the panel above the keys
  out += el("rect", { x: left, y: Y(0.95), width: PW, height: PH * 0.95, fill: finish });
  out += el("rect", {
    x: left - PW * 0.015,
    y: Y(1),
    width: PW * 1.03,
    height: PH * 0.055,
    rx: PH * 0.01,
    fill: finish,
  });
  out += el("rect", {
    x: left - PW * 0.015,
    y: Y(0.95),
    width: PW * 1.03,
    height: PH * 0.008,
    fill: "#000",
    opacity: "0.2",
  });
  out += el("rect", {
    x: left + PW * 0.08,
    y: Y(0.9),
    width: PW * 0.84,
    height: PH * 0.2,
    rx: PH * 0.01,
    fill: edge,
    opacity: "0.35",
  });
  // Lower panel
  out += el("rect", {
    x: left + PW * 0.1,
    y: Y(0.44),
    width: PW * 0.8,
    height: PH * 0.34,
    rx: PH * 0.01,
    fill: edge,
    opacity: "0.3",
  });
  // Toe rail along the floor
  out += el("rect", { x: left, y: Y(0.05), width: PW, height: PH * 0.05, fill: shade });
  // Pedals
  const pedals = g.pick([2, 3]);
  for (let k = 0; k < pedals; k++) {
    const px = cx + (k - (pedals - 1) / 2) * PW * 0.07;
    out += el("rect", {
      x: px - PW * 0.018,
      y: Y(0.07),
      width: PW * 0.036,
      height: PH * 0.035,
      rx: PH * 0.012,
      fill: "#c9a24a",
    });
  }
  // Music desk with sheet music standing on it
  out += el("rect", { x: left + PW * 0.12, y: Y(0.665), width: PW * 0.76, height: PH * 0.03, fill: shade });
  const pages = g.chance(0.6) ? 2 : 1;
  const pw = PW * 0.16;
  for (let p = 0; p < pages; p++) {
    const px = cx - (pages * pw) / 2 + p * pw;
    out += el("rect", { x: px, y: Y(0.89), width: pw, height: PH * 0.225, fill: "#f7f4ec" });
    let staves = "";
    for (let k = 0; k < 5; k++) {
      const sy = Y(0.86) + k * PH * 0.04;
      for (let l = 0; l < 3; l++) staves += s`M ${px + pw * 0.1} ${sy + l * PH * 0.006} H ${px + pw * 0.9} `;
    }
    out += el("path", { d: staves.trim(), stroke: "#8a8a8a", "stroke-width": Math.max(0.5, PH * 0.002) });
  }
  if (pages === 2)
    out += el("rect", {
      x: cx - PW * 0.002,
      y: Y(0.89),
      width: PW * 0.004,
      height: PH * 0.225,
      fill: "#000",
      opacity: "0.15",
    });
  // The rolled-back fallboard, the cheeks at each end, and the key slip below the keys
  out += el("rect", { x: left, y: Y(0.635), width: PW, height: PH * 0.035, fill: shade });
  out += el("rect", { x: left, y: Y(0.53), width: PW, height: PH * 0.045, fill: finish });
  out += el("rect", {
    x: left,
    y: Y(0.53),
    width: PW,
    height: PH * 0.006,
    fill: "#fff",
    opacity: light ? "0.5" : "0.15",
  });
  // Legs under the cheeks
  for (const side of [-1, 1]) {
    const lx = cx + side * PW * 0.455 - PW * 0.025;
    out += el("rect", { x: lx, y: Y(0.485), width: PW * 0.05, height: PH * 0.435, fill: finish });
    out += el("rect", { x: lx, y: Y(0.485), width: PW * 0.05, height: PH * 0.435, fill: "#000", opacity: "0.12" });
  }
  // Keys: all 88, from A0 to C8, with the black keys in their twos and threes
  const kx = left + PW * 0.08;
  const KW = PW * 0.84;
  const wk = KW / 52;
  const keyTop = Y(0.6);
  const keyBottom = Y(0.53);
  out += el("rect", { x: kx, y: keyTop, width: KW, height: keyBottom - keyTop, fill: ivory });
  let lines = "";
  for (let k = 1; k < 52; k++) lines += s`M ${kx + k * wk} ${keyTop} V ${keyBottom} `;
  out += el("path", {
    d: lines.trim(),
    stroke: "#000",
    "stroke-opacity": "0.35",
    "stroke-width": Math.max(0.4, wk * 0.12),
  });
  let blacks = "";
  const bh = (keyBottom - keyTop) * 0.6;
  for (let k = 0; k < 51; k++) {
    // A0 is white key 0, so counting from C it is key 5
    if (!blackAfter(k + 5)) continue;
    blacks += s`M ${kx + (k + 1) * wk - wk * 0.3} ${keyTop} h ${wk * 0.6} v ${bh} h ${-wk * 0.6} Z `;
  }
  out += el("path", { d: blacks.trim(), fill: ebony });
  for (const side of [-1, 1]) {
    const chx = side < 0 ? left : left + PW * 0.92;
    out += el("rect", { x: chx, y: Y(0.64), width: PW * 0.08, height: PH * 0.11, rx: PH * 0.008, fill: finish });
    out += el("rect", {
      x: chx,
      y: Y(0.64),
      width: PW * 0.08,
      height: PH * 0.006,
      fill: "#fff",
      opacity: light ? "0.5" : "0.15",
    });
  }
  // Something on the lid: a metronome or a potted plant
  const topper = g.pick(["metronome", "plant", "none"]);
  if (topper === "metronome") {
    const mx = left + PW * g.f(0.12, 0.3);
    const mh = PH * 0.16;
    const wood = hsl(g.f(15, 35), g.f(35, 50), g.f(28, 42));
    out += el("path", {
      d: s`M ${mx - mh * 0.32} ${Y(1)} L ${mx + mh * 0.32} ${Y(1)} L ${mx + mh * 0.1} ${Y(1) - mh} L ${mx - mh * 0.1} ${Y(1) - mh} Z`,
      fill: wood,
    });
    out += el("path", {
      d: s`M ${mx} ${Y(1) - mh * 0.15} L ${mx + mh * 0.18} ${Y(1) - mh * 0.95}`,
      stroke: "#d9dcdf",
      "stroke-width": Math.max(1, mh * 0.04),
      "stroke-linecap": "round",
    });
    out += el("rect", { x: mx + mh * 0.07, y: Y(1) - mh * 0.72, width: mh * 0.1, height: mh * 0.08, fill: "#d9dcdf" });
  } else if (topper === "plant") {
    const mx = left + PW * g.f(0.7, 0.88);
    const ph = PH * 0.1;
    const pot = g.pick(["#c4572f", "#e9e3d5", "#3e6d8e", "#a8b5a2"]);
    const leaf = hsl(g.f(95, 140), g.f(35, 55), g.f(32, 44));
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.45;
      out += el("ellipse", {
        cx: mx + Math.cos(a) * ph * 0.7,
        cy: Y(1) - ph + Math.sin(a) * ph * 0.7,
        rx: ph * 0.5,
        ry: ph * 0.2,
        fill: leaf,
        transform: s`rotate(${(a * 180) / Math.PI} ${mx + Math.cos(a) * ph * 0.7} ${Y(1) - ph + Math.sin(a) * ph * 0.7})`,
      });
    }
    out += el("path", {
      d: s`M ${mx - ph * 0.5} ${Y(1) - ph} L ${mx + ph * 0.5} ${Y(1) - ph} L ${mx + ph * 0.38} ${Y(1)} L ${mx - ph * 0.38} ${Y(1)} Z`,
      fill: pot,
    });
  }
  // A bench in front, sometimes
  const bench = g.chance(0.45);
  if (bench) {
    const bw = PW * 0.5;
    const bt = floorY - PH * 0.4;
    out += el("rect", { x: cx - bw / 2, y: bt, width: bw, height: PH * 0.07, rx: PH * 0.01, fill: finish });
    out += el("rect", {
      x: cx - bw / 2,
      y: bt,
      width: bw,
      height: PH * 0.07,
      rx: PH * 0.01,
      fill: "#000",
      opacity: light ? "0.08" : "0.15",
    });
    for (const side of [-1, 1])
      out += el("rect", {
        x: cx + side * bw * 0.44 - PW * 0.015,
        y: bt + PH * 0.07,
        width: PW * 0.03,
        height: floorY - bt - PH * 0.07,
        fill: shade,
      });
  }
  const extra = topper === "metronome" ? " with a metronome on top" : topper === "plant" ? " with a plant on top" : "";
  note.alt(`An upright piano${extra}${bench ? " and a bench" : ""} against a wall`);
  note.focus(cx, keyTop);
  return out;
});
