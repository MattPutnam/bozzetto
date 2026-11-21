import { defineKind, el, fill, hex, hsl, lin, mix, s, type Point, type Rand } from "./core";
import { andList, numberWord } from "./words";

/**
 * Music: instruments, records, CDs and drum kits in simple settings, and scattered notes.
 */

/** A room corner seen straight on: a plain wall, a baseboard and a wooden floor from floorY down. */
function room(g: Rand, w: number, h: number, floorY: number): string {
  const unit = Math.min(w, h);
  const wall = hsl(g.f(0, 360), g.f(10, 30), g.f(78, 88));
  const floor = hsl(g.f(20, 38), g.f(25, 40), g.f(40, 58));
  let out = fill(w, h, wall);
  out += el("rect", { y: floorY, width: w, height: h - floorY, fill: floor });
  // Baseboard along the foot of the wall
  out += el("rect", {
    y: floorY - unit * 0.035,
    width: w,
    height: unit * 0.035,
    fill: g.pick(["#f4f1ea", "#ece6da", "#e2ddd3"]),
  });
  out += el("rect", { y: floorY, width: w, height: Math.max(1.5, unit * 0.006), fill: "#000", opacity: "0.12" });
  return out;
}

/** A cubic Bézier point. */
const cpt = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

/** Where fret k sits, as a fraction of the scale length from the nut. */
const fret = (k: number): number => 1 - 2 ** (-k / 12);

/** A guitar on a floor stand, acoustic or electric, seen from the front. */
export const guitar = defineKind("guitar", "Guitar", { type: ["acoustic", "electric"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const type = g.option("type", g.chance(0.5) ? "acoustic" : "electric");
  const acoustic = type === "acoustic";
  // On its stand or leaning against the wall, always with the floor in view
  const pose = g.pick(["stand", "lean"]);
  const floorY = h * g.f(0.9, 0.93);
  const start = room(g, w, h, floorY);
  let out = "";
  // Lengths are in scale lengths (nut to saddle): the headstock reaches 0.3 above the nut, and the
  // body's bottom sits a little above the floor on the stand's cradle.
  const bodyEnd = acoustic ? 1.34 : 1.2;
  const total = bodyEnd + 0.31 + (pose === "lean" ? 0.05 : 0.06);
  const amp = pose === "stand" && !acoustic && w / h > 1.05 && g.chance(0.6);
  const lean = pose === "lean" ? (g.chance(0.5) ? 1 : -1) * g.f(5, 9) : 0;
  // A stand's feet are against the wall; a leaning guitar's foot rests out on the floor, in front of it
  const groundY = lean ? floorY + (h - floorY) * 0.55 : floorY;
  let S = Math.min((groundY - h * 0.03) / total, w * (amp ? 0.7 : 1.2));
  S *= g.f(0.95, 1);
  const cx = (amp ? w / 2 - 0.31 * S : w / 2 - Math.sign(lean) * 0.1 * S) + w * g.f(-0.03, 0.03);
  const nutY = groundY - (pose === "lean" ? 0 : 0.06 * S) - bodyEnd * S;
  const X = (u: number) => cx + u * S;
  const Y = (v: number) => nutY + v * S;
  const P = (u: number, v: number) => s`${X(u)} ${Y(v)}`;
  const metal = g.pick(["#2b2b2b", "#2b2b2b", "#3a3a3a", "#5a5f66"]);
  const chrome = "#c9cdd2";
  // The stand's back leg, behind everything, and its neck yoke posts
  const hubY = floorY - 0.05 * S;
  out += el("ellipse", {
    cx: cx + Math.sign(lean) * 0.12 * S,
    cy: groundY,
    rx: S * (lean ? 0.3 : 0.42),
    ry: unit * 0.022,
    fill: "#000",
    opacity: "0.16",
  });
  if (!lean)
    out += el("rect", {
      x: cx - S * 0.012,
      y: hubY,
      width: S * 0.024,
      height: floorY - hubY,
      fill: mix(metal, "#000000", 0.3),
    });
  // The body
  let body: string;
  let joinV: number;
  let fbEnd: number;
  let frets: number;
  let nutW: number;
  let joinW: number;
  let bottomContact: Point;
  const wood = hsl(g.f(25, 42), g.f(45, 70), g.f(58, 76));
  if (acoustic) {
    joinV = fret(14);
    frets = 20;
    fbEnd = fret(20) + 0.012;
    nutW = 0.067;
    joinW = 0.087;
    const ub = g.f(0.2, 0.225);
    const wa = ub - g.f(0.02, 0.05);
    const lb = g.f(0.29, 0.31);
    const len = bodyEnd - joinV;
    const segs: [Point, Point, Point][] = [
      [
        [0.12, 0],
        [ub, 0.03],
        [ub, 0.13],
      ],
      [
        [ub, 0.22],
        [wa, 0.22],
        [wa, 0.31],
      ],
      [
        [wa, 0.38],
        [lb, 0.4],
        [lb, 0.56],
      ],
      [
        [lb, 0.72],
        [lb * 0.62, len],
        [0, len],
      ],
    ];
    // The cradle meets the bottom curve where it is 0.17 out from the middle
    let t = 0;
    while (t < 1 && cpt([lb, 0.56], [lb, 0.72], [lb * 0.62, len], [0, len], t)[0] > 0.17) t += 0.01;
    const c = cpt([lb, 0.56], [lb, 0.72], [lb * 0.62, len], [0, len], t);
    bottomContact = [c[0], c[1] + joinV];
    const at = (p: Point, side: number) => P(p[0] * side, p[1] + joinV);
    let d = s`M ${P(0, joinV)}`;
    for (const [c1, c2, p] of segs) d += ` C ${at(c1, 1)} ${at(c2, 1)} ${at(p, 1)}`;
    for (let k = segs.length - 1; k >= 0; k--) {
      const prev = k > 0 ? segs[k - 1][2] : ([0, 0] as Point);
      d += ` C ${at(segs[k][1], -1)} ${at(segs[k][0], -1)} ${at(prev, -1)}`;
    }
    d += " Z";
    const finish = g.pick(["natural", "natural", "burst", "dark"]);
    const top = finish === "dark" ? hsl(g.f(0, 360), g.f(0, 15), g.f(14, 22)) : wood;
    if (finish === "burst") {
      const id = g.id("burst");
      out += el(
        "defs",
        {},
        el(
          "radialGradient",
          { id, cx: 0.5, cy: 0.62, r: 0.62 },
          el("stop", { offset: 0.45, "stop-color": wood }),
          el("stop", { offset: 1, "stop-color": hsl(g.f(10, 25), g.f(50, 70), g.f(14, 22)) }),
        ),
      );
      body = el("path", { d, fill: `url(#${id})` });
    } else body = el("path", { d, fill: top });
    // Binding around the edge
    body += el("path", { d, fill: "none", stroke: "#efe6d2", "stroke-width": S * 0.008 });
    // Sound hole with a rosette, and a pickguard on the treble side
    const hole = 0.075;
    const holeV = fbEnd + hole * 0.9;
    body += el("circle", {
      cx: X(0),
      cy: Y(holeV),
      r: hole * 1.25 * S,
      fill: "none",
      stroke: g.pick(["#3b2a20", "#efe6d2", "#7a4a2a"]),
      "stroke-width": S * 0.014,
    });
    if (finish !== "dark" && g.chance(0.7)) {
      body += el("path", {
        d: s`M ${P(0.07, holeV + 0.06)} Q ${P(0.15, holeV + 0.08)} ${P(0.16, holeV - 0.01)}
             Q ${P(0.16, holeV - 0.1)} ${P(0.08, holeV - 0.09)} Q ${P(0.13, holeV)} ${P(0.07, holeV + 0.06)} Z`,
        fill: g.pick(["#2a1d17", "#5a2f1c", "#3b2a20"]),
        opacity: "0.9",
      });
    }
    body += el("circle", { cx: X(0), cy: Y(holeV), r: hole * S, fill: "#1a1310" });
    // Bridge with its saddle and six pins
    const bridge = g.pick(["#2a1d17", "#3b2416"]);
    body += el("rect", {
      x: X(-0.15),
      y: Y(0.975),
      width: 0.3 * S,
      height: 0.07 * S,
      rx: 0.02 * S,
      fill: bridge,
    });
    body += el("rect", { x: X(-0.05), y: Y(0.995), width: 0.1 * S, height: 0.008 * S, fill: "#efe6d2" });
    for (let k = 0; k < 6; k++)
      body += el("circle", { cx: X((k - 2.5) * 0.017), cy: Y(1.025), r: S * 0.006, fill: "#efe6d2" });
  } else {
    joinV = fret(16);
    frets = 22;
    fbEnd = fret(22) + 0.01;
    nutW = 0.065;
    joinW = 0.082;
    const ring: Point[] = [
      [0.05, 0.6],
      [0.09, 0.64],
      [0.11, 0.58],
      [0.14, 0.53],
      [0.2, 0.55],
      [0.24, 0.66],
      [0.2, 0.78],
      [0.28, 0.9],
      [0.27, 1.1],
      [0.13, 1.2],
      [0, 1.2],
      [-0.13, 1.2],
      [-0.27, 1.1],
      [-0.28, 0.9],
      [-0.2, 0.78],
      [-0.24, 0.62],
      [-0.2, 0.5],
      [-0.14, 0.49],
      [-0.11, 0.57],
      [-0.09, 0.64],
      [-0.05, 0.6],
    ];
    const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const start = mid(ring[ring.length - 1], ring[0]);
    let d = s`M ${P(start[0], start[1])}`;
    for (let k = 0; k < ring.length; k++) {
      const e = mid(ring[k], ring[(k + 1) % ring.length]);
      d += ` Q ${P(ring[k][0], ring[k][1])} ${P(e[0], e[1])}`;
    }
    d += " Z";
    bottomContact = [0.15, 1.165];
    const color = g.pick([
      hsl(g.f(0, 360), g.f(50, 75), g.f(38, 52)),
      hsl(g.f(0, 360), g.f(50, 75), g.f(38, 52)),
      "#1f1f22",
      "#eee8da",
      wood,
    ]);
    body = el("path", { d, fill: color });
    // A soft sheen across the top
    body += el("path", {
      d: s`M ${P(-0.2, 0.7)} Q ${P(-0.24, 0.95)} ${P(-0.12, 1.12)}`,
      stroke: "#fff",
      "stroke-opacity": "0.2",
      "stroke-width": S * 0.02,
      fill: "none",
      "stroke-linecap": "round",
    });
    const guard = g.pick([color === "#1f1f22" ? "#eee8da" : "#1f1f22", "#eee8da", "#2b2b2b"]);
    const humbuckers = g.chance(0.5);
    if (!humbuckers) {
      // Pickguard round the pickups
      body += el("path", {
        d: s`M ${P(-0.06, 0.62)} L ${P(0.06, 0.62)} Q ${P(0.16, 0.66)} ${P(0.2, 0.86)} Q ${P(0.22, 1.02)} ${P(0.12, 1.04)}
             L ${P(0.06, 0.98)} Q ${P(-0.02, 1.08)} ${P(-0.14, 1.06)} Q ${P(-0.2, 0.9)} ${P(-0.12, 0.72)} Z`,
        fill: guard,
      });
    }
    // Pickups, each with a pole piece under every string
    const pickups: number[] = humbuckers ? [0.79, 0.93] : [0.77, 0.855, 0.94];
    const ph = humbuckers ? 0.05 : 0.028;
    for (const v of pickups) {
      body += el("rect", {
        x: X(-0.06),
        y: Y(v - ph / 2),
        width: 0.12 * S,
        height: ph * S,
        rx: (humbuckers ? 0.006 : 0.012) * S,
        fill: humbuckers ? "#1d1d1d" : "#f2efe6",
      });
      let poles = "";
      const spread = 0.0125 + (v - 0.7) * 0.02;
      for (const row of humbuckers ? [-0.012, 0.012] : [0])
        for (let k = 0; k < 6; k++) poles += s`M ${X((k - 2.5) * spread)} ${Y(v + row)} h 0 `;
      body += el("path", { d: poles, stroke: chrome, "stroke-width": S * 0.008, "stroke-linecap": "round" });
    }
    // Bridge, and for humbuckers a stop tailpiece where the strings end
    body += el("rect", {
      x: X(-0.055),
      y: Y(humbuckers ? 0.99 : 0.985),
      width: 0.11 * S,
      height: (humbuckers ? 0.02 : 0.07) * S,
      rx: 0.006 * S,
      fill: chrome,
    });
    if (humbuckers)
      body += el("rect", {
        x: X(-0.06),
        y: Y(1.05),
        width: 0.12 * S,
        height: 0.022 * S,
        rx: 0.011 * S,
        fill: chrome,
      });
    // Knobs on the lower treble side, and a pickup switch
    const knob = g.pick(["#1d1d1d", "#f2efe6", chrome]);
    const knobs = g.i(2, humbuckers ? 4 : 3);
    for (let k = 0; k < knobs; k++) {
      const p: Point = [
        0.12 + (k % 2) * 0.055 + Math.floor(k / 2) * 0.01,
        1.0 + Math.floor(k / 2) * 0.06 - (k % 2) * 0.04,
      ];
      body += el("circle", { cx: X(p[0]), cy: Y(p[1]), r: S * 0.019, fill: knob });
      body += el("circle", { cx: X(p[0] - 0.006), cy: Y(p[1] - 0.006), r: S * 0.006, fill: "#fff", opacity: "0.35" });
    }
    if (humbuckers) {
      body += el("circle", { cx: X(-0.17), cy: Y(0.59), r: S * 0.014, fill: chrome });
      body += el("rect", {
        x: X(-0.175),
        y: Y(0.54),
        width: 0.01 * S,
        height: 0.05 * S,
        rx: 0.005 * S,
        fill: "#f2efe6",
      });
    } else
      body += el("rect", { x: X(0.13), y: Y(0.9), width: 0.012 * S, height: 0.05 * S, rx: 0.004 * S, fill: "#1d1d1d" });
  }
  out += body;
  // The fingerboard, from the nut out over the body
  const neckW = (v: number) => nutW + ((joinW - nutW) * v) / joinV;
  const board = g.pick(["#3b2416", "#2a1d17", "#1a1412", acoustic ? "#3b2416" : "#d9a86c"]);
  out += el("path", {
    d: s`M ${P(-nutW / 2, 0)} L ${P(nutW / 2, 0)} L ${P(neckW(fbEnd) / 2, fbEnd)} L ${P(-neckW(fbEnd) / 2, fbEnd)} Z`,
    fill: board,
  });
  // Frets, then the position dots between them
  let fd = "";
  for (let k = 1; k <= frets; k++) {
    const v = fret(k);
    fd += s`M ${P(-neckW(v) / 2, v)} L ${P(neckW(v) / 2, v)} `;
  }
  out += el("path", { d: fd.trim(), stroke: "#c9ccd0", "stroke-width": Math.max(1, S * 0.004) });
  const dot = board === "#d9a86c" ? "#1d1d1d" : "#efe6d2";
  let dots = "";
  for (const k of [3, 5, 7, 9, 12, 15, 17, 19, 21]) {
    if (k > frets) continue;
    const v = (fret(k - 1) + fret(k)) / 2;
    for (const u of k === 12 ? [-0.016, 0.016] : [0]) dots += s`M ${P(u, v)} h 0 `;
  }
  out += el("path", { d: dots, stroke: dot, "stroke-width": S * 0.013, "stroke-linecap": "round" });
  // Nut and headstock, with three tuners a side or six in a row on the bass side
  out += el("rect", { x: X(-nutW / 2), y: Y(-0.006), width: nutW * S, height: 0.008 * S, fill: "#efe6d2" });
  const inline = !acoustic && g.chance(0.5);
  const head = acoustic ? board : g.pick([board, "#d9a86c", "#1f1f22"]);
  let posts: Point[];
  let hd: string;
  if (inline) {
    hd = s`M ${P(-nutW / 2, -0.004)} L ${P(-0.05, -0.05)} L ${P(-0.052, -0.29)} Q ${P(-0.05, -0.32)} ${P(-0.02, -0.315)}
           Q ${P(0.035, -0.31)} ${P(0.04, -0.27)} Q ${P(0.02, -0.19)} ${P(0.03, -0.12)} Q ${P(0.06, -0.08)} ${P(0.05, -0.04)}
           L ${P(nutW / 2, -0.004)} Z`;
    posts = Array.from({ length: 6 }, (_, k): Point => [-0.03, -0.055 - k * 0.045]);
  } else {
    hd = s`M ${P(-nutW / 2, -0.004)} L ${P(-0.05, -0.04)} L ${P(-0.066, -0.27)} Q ${P(-0.04, -0.31)} ${P(0, -0.3)}
           Q ${P(0.04, -0.31)} ${P(0.066, -0.27)} L ${P(0.05, -0.04)} L ${P(nutW / 2, -0.004)} Z`;
    posts = [];
    // Bass side bottom to top (low E, A, D), then treble side top to bottom (G, B, high E)
    for (const v of [-0.07, -0.145, -0.22]) posts.push([-0.035 - (0.22 + v) * 0.05, v]);
    for (const v of [-0.22, -0.145, -0.07]) posts.push([0.035 + (0.22 + v) * 0.05, v]);
  }
  // Tuner buttons stick out past the headstock's edge
  let stems = "";
  let buttons = "";
  let heads = "";
  for (const [u, v] of posts) {
    const side = u < 0 ? -1 : 1;
    const edge = inline ? -0.051 : side * (0.052 + ((-v - 0.04) / 0.23) * 0.014);
    stems += s`M ${P(edge, v)} h ${side * 0.035 * S} `;
    buttons += el("ellipse", { cx: X(edge + side * 0.04), cy: Y(v), rx: 0.012 * S, ry: 0.018 * S });
    heads += s`M ${P(u, v)} h 0 `;
  }
  out += el("path", { d: stems, stroke: chrome, "stroke-width": S * 0.008 });
  out += el("g", { fill: chrome }, buttons) + el("path", { d: hd, fill: head });
  out += el("path", { d: heads, stroke: chrome, "stroke-width": S * 0.018, "stroke-linecap": "round" });
  // Strings: from the bridge over the saddle to the nut, then out to each post
  const endV = acoustic ? 1.025 : 1.06;
  for (let k = 0; k < 6; k++) {
    const atNut = (k - 2.5) * ((nutW * 0.8) / 5);
    const atEnd = (k - 2.5) * 0.017;
    const [pu, pv] = posts[k];
    const tu = inline ? pu + 0.009 : pu + (pu < 0 ? 0.009 : -0.009);
    out += el("path", {
      d: s`M ${P(atEnd, endV)} L ${P(atNut, 0)} L ${P(tu, pv)}`,
      stroke: acoustic && k < 4 ? "#e3cf9a" : "#e6e8ea",
      "stroke-width": Math.max(0.6, S * (0.0032 - k * 0.0003)),
      fill: "none",
    });
  }
  const [bu, bv] = bottomContact;
  if (lean) {
    // Rest the bottom on the floor at the edge it tips toward, and tilt the top against the wall
    const side = Math.sign(lean);
    const pivotY = Y(bv + 0.012);
    const drop = groundY - pivotY;
    out =
      out.slice(0, out.indexOf("/>") + 2) +
      el(
        "g",
        { transform: s`translate(0 ${drop}) rotate(${lean} ${X(side * bu)} ${pivotY})` },
        out.slice(out.indexOf("/>") + 2),
      );
  } else out += stand();
  out = start + out;
  // The stand: front legs, the cradle arms with their pads, and the yoke arms beside the neck
  function stand(): string {
    let parts = "";
    const legs = s`M ${X(-0.34)} ${floorY} L ${cx} ${hubY} L ${X(0.34)} ${floorY}`;
    parts += el("path", {
      d: legs,
      stroke: metal,
      "stroke-width": S * 0.022,
      fill: "none",
      "stroke-linejoin": "round",
    });
    parts += el("path", {
      d: s`M ${P(-bu, bv + 0.01)} Q ${X(-bu * 0.4)} ${hubY} ${cx} ${hubY} Q ${X(bu * 0.4)} ${hubY} ${P(bu, bv + 0.01)}`,
      stroke: metal,
      "stroke-width": S * 0.016,
      fill: "none",
    });
    for (const side of [-1, 1]) {
      parts += el("rect", {
        x: X(side * bu - 0.025),
        y: Y(bv - 0.01),
        width: 0.05 * S,
        height: 0.03 * S,
        rx: 0.012 * S,
        fill: "#1d1d1d",
      });
      parts += el("rect", {
        x: X(side * 0.34 - 0.025),
        y: floorY - 0.016 * S,
        width: 0.05 * S,
        height: 0.016 * S,
        rx: 0.006 * S,
        fill: "#1d1d1d",
      });
    }
    const yokeV = fret(3);
    for (const side of [-1, 1])
      parts += el("rect", {
        x: X(side * (neckW(yokeV) / 2 + 0.008) - 0.008),
        y: Y(yokeV - 0.025),
        width: 0.016 * S,
        height: 0.06 * S,
        rx: 0.008 * S,
        fill: "#1d1d1d",
      });
    return parts;
  }
  // An amplifier beside an electric guitar, with the cable lying across the floor between them
  if (amp) {
    const aw = 0.55 * S;
    const ah = 0.46 * S;
    const ax = X(0.4);
    const ay = floorY - ah;
    const tolex = g.pick(["#1f1f22", "#2b2b2b", "#e9e3d5", "#5b3a29"]);
    const grille = g.pick(["#3a3a3a", "#c9b98f", "#8a6b4a", "#2c2c2c"]);
    out += el("ellipse", {
      cx: ax + aw / 2,
      cy: floorY,
      rx: aw * 0.55,
      ry: unit * 0.018,
      fill: "#000",
      opacity: "0.18",
    });
    out += el("rect", { x: ax, y: ay, width: aw, height: ah, rx: S * 0.02, fill: tolex });
    out += el("rect", {
      x: ax + aw * 0.06,
      y: ay + ah * 0.26,
      width: aw * 0.88,
      height: ah * 0.66,
      rx: S * 0.01,
      fill: grille,
    });
    out += el("circle", { cx: ax + aw / 2, cy: ay + ah * 0.59, r: ah * 0.27, fill: "#000", opacity: "0.12" });
    out += el("rect", {
      x: ax + aw * 0.06,
      y: ay + ah * 0.06,
      width: aw * 0.88,
      height: ah * 0.14,
      rx: S * 0.006,
      fill: mix(chrome, "#000000", 0.1),
    });
    for (let k = 0; k < 5; k++)
      out += el("circle", { cx: ax + aw * (0.3 + k * 0.13), cy: ay + ah * 0.13, r: ah * 0.035, fill: "#1d1d1d" });
    const jack: Point = [ax + aw * 0.14, ay + ah * 0.13];
    const out1: Point = [X(0.24), Y(1.06)];
    out += el("circle", { cx: jack[0], cy: jack[1], r: ah * 0.025, fill: "#1d1d1d" });
    out += el("path", {
      d: s`M ${out1[0]} ${out1[1]} C ${out1[0] + S * 0.05} ${floorY + unit * 0.01} ${jack[0] - S * 0.15} ${floorY + unit * 0.03}
           ${jack[0] - S * 0.05} ${floorY + unit * 0.012} S ${jack[0] - S * 0.04} ${jack[1]} ${jack[0]} ${jack[1]}`,
      stroke: "#1d1d1d",
      "stroke-width": S * 0.008,
      fill: "none",
      "stroke-linecap": "round",
    });
  }
  note.alt(
    lean
      ? `An ${type} guitar leaning against a wall`
      : `An ${type} guitar on a stand${amp ? " beside an amplifier" : ""}`,
  );
  note.focus(cx, Y(acoustic ? 0.85 : 0.88));
  return out;
});

/** Whether a black key follows white key k, counting white keys from C. */
const blackAfter = (k: number): boolean => [0, 1, 3, 4, 5].includes(((k % 7) + 7) % 7);

/** An upright piano against a wall, or a close-up of its keys at an angle. */
export const piano = defineKind("piano", "Piano", { view: ["upright", "keys"] }, (g, w, h, note) => {
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

/** Simple sleeve art in a square: a sun over stripes, bold blocks, or rings. No lettering. */
function sleeveArt(g: Rand, x: number, y: number, q: number): string {
  const hue = g.f(0, 360);
  const base = hsl(hue, g.f(30, 60), g.f(55, 75));
  const a = hsl(hue + g.f(120, 240), g.f(45, 70), g.f(40, 60));
  const b = hsl(hue + g.f(30, 90), g.f(40, 70), g.f(25, 45));
  const id = g.id("art");
  const style = g.pick(["sun", "blocks", "rings"]);
  let art = el("rect", { x, y, width: q, height: q, fill: base });
  if (style === "sun") {
    art += el("circle", { cx: x + q * g.f(0.35, 0.65), cy: y + q * 0.55, r: q * g.f(0.2, 0.3), fill: a });
    for (let k = 0; k < 4; k++)
      art += el("rect", { x, y: y + q * (0.62 + k * 0.1), width: q, height: q * 0.05, fill: b });
  } else if (style === "blocks") {
    art += el("rect", {
      x: x + q * 0.12,
      y: y + q * 0.12,
      width: q * g.f(0.3, 0.5),
      height: q * g.f(0.4, 0.6),
      fill: a,
    });
    art += el("circle", { cx: x + q * 0.68, cy: y + q * 0.66, r: q * g.f(0.14, 0.22), fill: b });
    art += el("rect", { x: x + q * 0.12, y: y + q * 0.82, width: q * 0.4, height: q * 0.04, fill: b });
  } else {
    const cx = x + q * g.f(0.3, 0.7);
    const cy = y + q * g.f(0.3, 0.7);
    for (let k = 5; k > 0; k--) art += el("circle", { cx, cy, r: q * 0.14 * k, fill: k % 2 ? a : b });
  }
  return (
    el("defs", {}, el("clipPath", { id }, el("rect", { x, y, width: q, height: q }))) +
    el("g", { "clip-path": `url(#${id})` }, art)
  );
}

/** A vinyl record at (cx, cy) with radius r: grooves, a sheen and a center label. */
function vinyl(g: Rand, cx: number, cy: number, r: number): string {
  let out = el("circle", { cx, cy, r, fill: "#151416" });
  // Grooves, with a couple of brighter gaps between tracks
  let grooves = "";
  for (let k = 0; k < 9; k++)
    grooves += el("circle", {
      cx,
      cy,
      r: r * (0.42 + k * 0.065),
      fill: "none",
      stroke: "#fff",
      "stroke-opacity": "0.06",
      "stroke-width": r * 0.012,
    });
  out += grooves;
  for (const t of [g.f(0.55, 0.65), g.f(0.75, 0.85)])
    out += el("circle", {
      cx,
      cy,
      r: r * t,
      fill: "none",
      stroke: "#fff",
      "stroke-opacity": "0.14",
      "stroke-width": r * 0.008,
    });
  // Two wedges of reflected light
  const a = g.f(0, Math.PI);
  let sheen = "";
  for (const off of [0, Math.PI]) {
    const p = (t: number, rr: number) => s`${cx + Math.cos(a + off + t) * rr} ${cy + Math.sin(a + off + t) * rr}`;
    sheen += `M ${p(-0.25, r * 0.36)} L ${p(-0.25, r * 0.96)} A ${r * 0.96} ${r * 0.96} 0 0 1 ${p(0.25, r * 0.96)} L ${p(0.25, r * 0.36)} Z `;
  }
  out += el("path", { d: sheen, fill: "#fff", opacity: "0.07" });
  // The label: a color, a ring and a few lines where the print would be
  const label = hsl(g.f(0, 360), g.f(40, 75), g.f(45, 65));
  out += el("circle", { cx, cy, r: r * 0.34, fill: label });
  out += el("circle", {
    cx,
    cy,
    r: r * 0.28,
    fill: "none",
    stroke: "#fff",
    "stroke-opacity": "0.35",
    "stroke-width": r * 0.01,
  });
  out += el("path", {
    d: s`M ${cx - r * 0.14} ${cy - r * 0.15} h ${r * 0.28} M ${cx - r * 0.1} ${cy + r * 0.13} h ${r * 0.2} M ${cx - r * 0.07} ${cy + r * 0.19} h ${r * 0.14}`,
    stroke: "#fff",
    "stroke-opacity": "0.55",
    "stroke-width": r * 0.025,
    "stroke-linecap": "round",
  });
  out += el("circle", { cx, cy, r: r * 0.018, fill: "#d9dcdf" });
  return out;
}

/** A vinyl record playing on a turntable seen from above, or sliding out of its sleeve on a shelf. */
export const record = defineKind("record", "Vinyl record", { scene: ["turntable", "sleeve"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scene = g.option("scene", g.chance(0.6) ? "turntable" : "sleeve");
  if (scene === "sleeve") {
    const shelfY = h * g.f(0.78, 0.84);
    let out = room(g, w, h, shelfY);
    const q = Math.min(unit * 0.6, (w * 0.85) / 1.55, shelfY - h * 0.08) * g.f(0.92, 1);
    const pulled = q * g.f(0.3, 0.55);
    const r = q * 0.48;
    const sx = w / 2 - (q + pulled) / 2 + w * g.f(-0.04, 0.04);
    const sy = shelfY - q;
    const rcx = sx + q - r - q * 0.01 + pulled;
    const rcy = sy + q / 2;
    out += el("ellipse", {
      cx: sx + (q + pulled) / 2,
      cy: shelfY,
      rx: (q + pulled) * 0.55,
      ry: unit * 0.02,
      fill: "#000",
      opacity: "0.18",
    });
    // A second sleeve leaning behind, sometimes
    if (g.chance(0.5)) {
      const q2 = q * g.f(0.95, 1);
      const bx = sx - q * g.f(0.2, 0.3);
      out += `<g transform="${s`rotate(${g.f(4, 8)} ${bx + q2} ${shelfY})`}">${sleeveArt(g, bx, shelfY - q2, q2)}</g>`;
    }
    out += vinyl(g, rcx, rcy, r);
    out += sleeveArt(g, sx, sy, q);
    // The open edge of the sleeve casts a little shadow on the record
    out += el("rect", { x: sx + q, y: rcy - r, width: q * 0.015, height: r * 2, fill: "#000", opacity: "0.25" });
    out += el("rect", { x: sx, y: sy, width: q, height: q * 0.012, fill: "#fff", opacity: "0.3" });
    note.alt("A vinyl record sliding out of its sleeve on a shelf");
    note.focus(rcx, rcy);
    return out;
  }
  // A turntable from above, on a tabletop
  let out = fill(w, h, hsl(g.f(15, 40), g.f(20, 40), g.f(45, 65)));
  let grain = "";
  for (let k = 0; k < 7; k++) {
    const y = (h * (k + g.f(0, 1))) / 7;
    grain += s`M 0 ${y} C ${w * 0.3} ${y + unit * g.f(-0.03, 0.03)} ${w * 0.7} ${y + unit * g.f(-0.03, 0.03)} ${w} ${y} `;
  }
  out += el("path", { d: grain, stroke: "#000", "stroke-opacity": "0.06", "stroke-width": unit * 0.006, fill: "none" });
  const R = Math.min(h / 2.9, w / 3.1) * g.f(0.9, 1);
  const cx = w / 2 - R * 0.1 + w * g.f(-0.03, 0.03);
  const cy = h / 2;
  const plinth = g.pick(["#1f1f22", "#2b2b2b", hsl(g.f(20, 35), g.f(35, 50), g.f(30, 45)), "#d9dcdf", "#eee8da"]);
  const px = cx - R * 1.3;
  const py = cy - R * 1.3;
  // A second record's sleeve lying beside it on wide pictures
  if (w / h > 1.7) {
    const q = R * 2.2;
    const bx = px - q * 0.95;
    out += `<g transform="${s`rotate(${g.f(-12, 12)} ${bx + q / 2} ${cy})`}">${el("rect", { x: bx + R * 0.05, y: cy - q / 2 + R * 0.07, width: q, height: q, fill: "#000", opacity: "0.2" })}${sleeveArt(g, bx, cy - q / 2, q)}</g>`;
  }
  out += el("rect", {
    x: px + R * 0.05,
    y: py + R * 0.08,
    width: R * 2.8,
    height: R * 2.6,
    rx: R * 0.08,
    fill: "#000",
    opacity: "0.22",
  });
  out += el("rect", { x: px, y: py, width: R * 2.8, height: R * 2.6, rx: R * 0.08, fill: plinth });
  // Platter with a mat, then the record
  out += el("circle", { cx, cy, r: R * 1.06, fill: "#9a9ea4" });
  out += el("circle", { cx, cy, r: R * 1.03, fill: "#2a2a2d" });
  out += vinyl(g, cx, cy, R);
  // Start button and speed buttons in the near left corner
  out += el("rect", {
    x: px + R * 0.1,
    y: py + R * 2.28,
    width: R * 0.3,
    height: R * 0.2,
    rx: R * 0.03,
    fill: "#c9cdd2",
  });
  for (let k = 0; k < 2; k++)
    out += el("rect", {
      x: px + R * (0.5 + k * 0.2),
      y: py + R * 2.33,
      width: R * 0.14,
      height: R * 0.1,
      rx: R * 0.02,
      fill: "#8d9196",
    });
  // The tonearm: from its pivot in the far right corner to the stylus, either in the groove or on its rest
  const pivot: Point = [cx + R * 1.15, cy - R * 0.9];
  const armLen = R * 1.55;
  const playing = g.chance(0.75);
  let stylus: Point;
  if (playing) {
    // Where a circle of the arm's length round the pivot crosses the groove at radius rr
    const rr = R * g.f(0.5, 0.95);
    const dx = pivot[0] - cx;
    const dy = pivot[1] - cy;
    const d = Math.hypot(dx, dy);
    const along = (rr * rr - armLen * armLen + d * d) / (2 * d);
    const across = Math.sqrt(Math.max(0, rr * rr - along * along));
    const ux = dx / d;
    const uy = dy / d;
    // Take the crossing on the near side (below and left of the pivot line)
    const c1: Point = [cx + ux * along - uy * across, cy + uy * along + ux * across];
    const c2: Point = [cx + ux * along + uy * across, cy + uy * along - ux * across];
    stylus = c1[1] > c2[1] ? c1 : c2;
  } else stylus = [pivot[0], pivot[1] + armLen];
  const ang = Math.atan2(stylus[1] - pivot[1], stylus[0] - pivot[0]);
  const deg = (ang * 180) / Math.PI;
  const metal = "#c9cdd2";
  // Arm rest post
  out += el("circle", { cx: pivot[0], cy: pivot[1] + armLen * 0.72, r: R * 0.05, fill: "#8d9196" });
  // Pivot base and counterweight behind it
  out += el("circle", { cx: pivot[0], cy: pivot[1], r: R * 0.17, fill: "#8d9196" });
  out += el(
    "g",
    { transform: s`rotate(${deg} ${pivot[0]} ${pivot[1]})` },
    el("rect", {
      x: pivot[0] - R * 0.42,
      y: pivot[1] - R * 0.08,
      width: R * 0.2,
      height: R * 0.16,
      rx: R * 0.03,
      fill: "#3a3a3d",
    }),
    el("rect", {
      x: pivot[0] - R * 0.22,
      y: pivot[1] - R * 0.025,
      width: armLen * 0.86 + R * 0.22,
      height: R * 0.05,
      rx: R * 0.025,
      fill: metal,
    }),
    el("rect", {
      x: pivot[0] + armLen * 0.84,
      y: pivot[1] - R * 0.07,
      width: armLen * 0.18,
      height: R * 0.14,
      rx: R * 0.02,
      fill: "#2b2b2b",
    }),
    el("rect", {
      x: pivot[0] + armLen * 0.95,
      y: pivot[1] + R * 0.07,
      width: armLen * 0.06,
      height: R * 0.06,
      fill: metal,
    }),
  );
  out += el("circle", { cx: pivot[0], cy: pivot[1], r: R * 0.07, fill: metal });
  note.alt(playing ? "A vinyl record playing on a turntable" : "A vinyl record on a turntable with the arm at rest");
  note.focus(cx, cy);
  return out;
});

/**
 * Abstract cover art filling the box (x, y, bw, bh): bands, circles, one big shape, or a photo-like
 * scene. `base` paints the whole box; `id` names its gradient, if it has one.
 */
function coverArt(
  g: Rand,
  x: number,
  y: number,
  bw: number,
  bh: number,
  id: string,
  base: (paint: string) => string,
): string {
  const hue = g.f(0, 360);
  const ground = hex(hue, g.f(25, 65), g.f(45, 80));
  const a = hex(hue + g.f(100, 260), g.f(45, 75), g.f(35, 65));
  const b = hex(hue + g.f(20, 80), g.f(35, 70), g.f(20, 45));
  const style = g.pick(["bands", "circles", "shape", "photo"]);
  let cx = x + bw * g.f(0.35, 0.65);
  let cy = y + bh * g.f(0.35, 0.65);
  // Keeps a shape reaching e from its center inside the box, so the art needs no clipping
  const keepIn = (e: number) => {
    cx = Math.max(x + e, Math.min(x + bw - e, cx));
    cy = Math.max(y + e, Math.min(y + bh - e, cy));
  };
  if (style === "photo") {
    // A sky fading to a horizon, a low sun and a dark hill
    const sky = el(
      "defs",
      {},
      lin(id, [hex(hue, g.f(40, 70), g.f(30, 50)), hex(hue + g.f(20, 60), g.f(50, 80), g.f(65, 85))]),
    );
    const hy = y + bh * g.f(0.55, 0.75);
    return (
      sky +
      base(`url(#${id})`) +
      el("circle", { cx, cy: hy - bh * 0.08, r: bw * g.f(0.1, 0.18), fill: hex(hue + 40, 80, 88) }) +
      el("path", {
        d: s`M${x} ${hy}Q${x + bw * g.f(0.2, 0.8)} ${hy - bh * g.f(0.1, 0.25)} ${x + bw} ${hy + bh * 0.04}V${y + bh}H${x}Z`,
        fill: b,
      })
    );
  }
  let out = base(ground);
  if (style === "bands") {
    const count = g.i(3, 5);
    const across = g.chance(0.5);
    let d = "";
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count;
      const thick = (0.35 / count) * g.f(0.6, 1.4);
      d += across
        ? s`M${x} ${y + bh * (t - thick / 2)}h${bw}v${bh * thick}h${-bw}Z`
        : s`M${x + bw * (t - thick / 2)} ${y}v${bh}h${bw * thick}v${-bh}Z`;
    }
    out += el("path", { d, fill: a });
    out += el("circle", { cx, cy, r: bw * g.f(0.08, 0.14), fill: b });
  } else if (style === "circles") {
    const r = bw * g.f(0.28, 0.4);
    keepIn(r * 1.02);
    out += el("circle", { cx, cy, r, fill: a });
    out += el("circle", { cx, cy, r: r * g.f(0.4, 0.65), fill: b });
    out += el("circle", { cx: x + bw * g.f(0.15, 0.85), cy: y + bh * 0.8, r: bw * 0.06, fill: b });
  } else {
    const r = bw * g.f(0.3, 0.38);
    const shape = g.pick(["triangle", "square", "disc"]);
    keepIn(r * 1.05);
    if (shape === "triangle")
      out += el("path", { d: s`M${cx} ${cy - r}L${cx + r} ${cy + r * 0.8}H${cx - r}Z`, fill: a });
    else if (shape === "square")
      out += el("rect", {
        x: cx - r * 0.8,
        y: cy - r * 0.8,
        width: r * 1.6,
        height: r * 1.6,
        fill: a,
        transform: s`rotate(${g.f(-20, 20)} ${cx} ${cy})`,
      });
    else out += el("circle", { cx, cy, r, fill: a });
    out += el("rect", { x, y: y + bh * 0.86, width: bw, height: bh * 0.04, fill: b });
  }
  return out;
}

/** A compact disc at (cx, cy) with radius r, data side up unless it gets a printed face. */
function disc(g: Rand, cx: number, cy: number, r: number, hole: string, print?: string): string {
  let out = el("circle", { cx, cy, r, fill: print ?? "#cfd4da" });
  // Iridescent wedges of reflected light, in two tints
  const a0 = g.f(0, Math.PI);
  const wedges = (off: number, width: number) => {
    let d = "";
    for (const half of [0, Math.PI]) {
      const p = (t: number, rr: number) =>
        s`${cx + Math.cos(a0 + off + half + t) * rr} ${cy + Math.sin(a0 + off + half + t) * rr}`;
      d += `M${p(-width, r * 0.36)}L${p(-width, r * 0.97)}A${s`${r * 0.97} ${r * 0.97}`} 0 0 1 ${p(width, r * 0.97)}L${p(width, r * 0.36)}Z`;
    }
    return d;
  };
  const sheen = print ? 0.15 : 0.4;
  out += el("path", { d: wedges(0, 0.35), fill: hex(g.f(170, 220), 70, 75), opacity: sheen });
  out += el("path", { d: wedges(0.75, 0.25), fill: hex(g.f(280, 340), 60, 80), opacity: sheen });
  // Clear inner ring, stacking ring and the hole
  out += el("circle", { cx, cy, r: r * 0.33, fill: "#e9edf0" });
  out += el("circle", {
    cx,
    cy,
    r: r * 0.22,
    fill: "none",
    stroke: "#a9b0b8",
    "stroke-width": r * 0.025,
  });
  out += el("circle", { cx, cy, r: r * 0.1, fill: hole });
  return out;
}

/** A scattering of CD jewel cases seen from above on a desk, table or carpet, sometimes one open. */
export const cds = defineKind("cds", "CD cases", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const q = unit * (w / h > 2.5 ? 0.5 : 0.36) * g.f(0.95, 1.05);
  const surface = g.pick(["desk", "table", "carpet"]);
  const shadow = { dx: q * 0.035, dy: q * 0.06 };
  const defs: string[] = [];
  let out = "";

  // The surface
  const ground =
    surface === "desk"
      ? hex(g.f(18, 38), g.f(25, 45), g.f(38, 58))
      : surface === "table"
        ? hex(g.f(0, 360), g.f(8, 30), g.f(70, 84))
        : hex(g.f(0, 360), g.f(15, 35), g.f(35, 60));
  if (surface === "desk") {
    out += el("rect", { width: w, height: h, fill: ground });
    let grain = "";
    for (let k = 0; k < 6; k++) {
      const y = (h * (k + g.f(0, 1))) / 6;
      grain += s`M0 ${y}C${w * 0.3} ${y + unit * g.f(-0.04, 0.04)} ${w * 0.7} ${y + unit * g.f(-0.04, 0.04)} ${w} ${y}`;
    }
    out += el("path", {
      d: grain,
      stroke: "#000",
      "stroke-opacity": "0.07",
      "stroke-width": unit * 0.006,
      fill: "none",
    });
  } else if (surface === "table") {
    out += el("rect", { width: w, height: h, fill: ground });
    out += el("ellipse", { cx: w * 0.3, cy: h * 0.25, rx: w * 0.5, ry: h * 0.4, fill: "#fff", opacity: "0.12" });
  } else {
    const pat = g.id("pile");
    const p = Math.max(4, unit * 0.025);
    defs.push(
      el(
        "pattern",
        { id: pat, width: p, height: p, patternUnits: "userSpaceOnUse" },
        el("circle", { cx: p * 0.25, cy: p * 0.3, r: p * 0.18, fill: "#000", opacity: "0.1" }),
        el("circle", { cx: p * 0.75, cy: p * 0.8, r: p * 0.15, fill: "#fff", opacity: "0.1" }),
      ),
    );
    out += el("rect", { width: w, height: h, fill: ground });
    out += el("rect", { width: w, height: h, fill: `url(#${pat})` });
  }

  // Shared parts in a case's own coordinates, centered on the origin
  const half = q / 2;
  const spine = q * 0.075;
  const lidId = g.id("l");
  const shadowId = g.id("s");
  const squareId = g.id("q");
  defs.push(el("rect", { id: squareId, x: -half, y: -half, width: q, height: q }));
  const square = (paint: string) => el("use", { href: `#${squareId}`, fill: paint });
  const knuckles = (x: number) =>
    el("path", {
      d: s`M${x} ${-half + q * 0.02}h${spine}v${q * 0.08}h${-spine}ZM${x} ${half - q * 0.1}h${spine}v${q * 0.08}h${-spine}Z`,
      fill: "#fff",
      opacity: "0.45",
    });
  const rim = (x: number) =>
    el("rect", {
      x: x + q * 0.01,
      y: -half + q * 0.01,
      width: q * 0.98,
      height: q * 0.98,
      rx: q * 0.012,
      fill: "none",
      stroke: "#fff",
      "stroke-opacity": "0.4",
      "stroke-width": q * 0.02,
    });
  // The clear lid over the cover: the tray's spine (its color comes from the <use>), a frosted
  // strip over it, the hinge line, knuckles, the rim and a soft streak of light
  defs.push(
    el(
      "g",
      { id: lidId },
      el("rect", { x: -half, y: -half, width: spine, height: q }),
      el("rect", { x: -half, y: -half, width: spine, height: q, fill: "#eef2f5", opacity: "0.3" }),
      el("rect", { x: -half + spine, y: -half, width: q * 0.01, height: q, fill: "#000", opacity: "0.2" }),
      knuckles(-half),
      rim(-half),
      el("path", {
        d: s`M${-q * 0.1} ${-half}h${q * 0.22}L${-q * 0.12} ${half}h${-q * 0.22}Z`,
        fill: "#fff",
        opacity: "0.14",
      }),
    ),
  );
  // A soft shadow: a wider faint rect under a tighter one
  const shadowRects = (x: number, width: number) =>
    el("rect", { x, y: -half, width, height: q, rx: q * 0.03, fill: "#000", opacity: "0.12" }) +
    el("rect", {
      x: x + q * 0.015,
      y: -half + q * 0.015,
      width: width - q * 0.03,
      height: q * 0.97,
      fill: "#000",
      opacity: "0.12",
    });
  defs.push(el("g", { id: shadowId }, shadowRects(-half, q)));
  /** A shadow offset down and right in the picture, whatever way the case is turned. */
  const offset = (deg: number) => {
    const t = (-deg * Math.PI) / 180;
    return [
      shadow.dx * Math.cos(t) - shadow.dy * Math.sin(t),
      shadow.dx * Math.sin(t) + shadow.dy * Math.cos(t),
    ] as const;
  };
  const trays = ["#1d1d21", "#2c2f36", "#d8dde2"];

  // Where the cases go: a jittered grid, so they overlap a little and cover the surface evenly
  const count = Math.max(5, Math.min(8, Math.round(((w * h) / (q * q)) * 0.6)));
  const cols = Math.max(1, Math.round(Math.sqrt((count * w) / h)));
  const rows = Math.ceil(count / cols);
  const spots: { x: number; y: number }[] = [];
  for (let k = 0; k < count; k++) {
    const c = k % cols;
    const r = Math.floor(k / cols);
    const inRow = r === rows - 1 ? count - r * cols : cols;
    spots.push({
      x: (w * (c + 0.5 + g.f(-0.3, 0.3))) / inRow,
      y: (h * (r + 0.5 + g.f(-0.3, 0.3))) / rows,
    });
  }
  // Drawing order is shuffled; the open case, if any, goes on top near the middle
  for (let k = spots.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [spots[k], spots[j]] = [spots[j], spots[k]];
  }
  const open = g.chance(0.45);
  const loose = g.chance(0.35);
  if (open) {
    let best = 0;
    for (let k = 1; k < spots.length; k++)
      if (Math.hypot(spots[k].x - w / 2, spots[k].y - h / 2) < Math.hypot(spots[best].x - w / 2, spots[best].y - h / 2))
        best = k;
    spots.push(spots.splice(best, 1)[0]);
  }
  const fit = (v: number, e: number, size: number) => Math.max(e, Math.min(size - e, v));
  const placed: { x: number; y: number; deg: number }[] = spots.map((p, k) => {
    const wide = open && k === spots.length - 1;
    const deg = wide ? g.f(-10, 10) : g.f(-35, 35);
    const t = (Math.abs(deg) * Math.PI) / 180;
    const m = unit * 0.02;
    const ex = (wide ? q : half) * Math.cos(t) + half * Math.sin(t) + m;
    const ey = (wide ? q : half) * Math.sin(t) + half * Math.cos(t) + m;
    return { x: fit(p.x, ex, w), y: fit(p.y, ey, h), deg };
  });

  // A loose disc lying under one of the cases, partly showing
  if (loose) {
    const under = placed[g.i(0, placed.length - (open ? 2 : 1))];
    const r = q * 0.46;
    const a = g.f(0, Math.PI * 2);
    const dx = fit(under.x + Math.cos(a) * q * 0.6, r * 1.08, w);
    const dy = fit(under.y + Math.sin(a) * q * 0.6, r * 1.08, h);
    out += el("circle", { cx: dx + shadow.dx * 0.6, cy: dy + shadow.dy * 0.6, r, fill: "#000", opacity: "0.18" });
    out += disc(g, dx, dy, r, ground);
  }

  placed.forEach((p, k) => {
    const isOpen = open && k === placed.length - 1;
    const [ox, oy] = offset(p.deg);
    const tray = g.pick(trays);
    let c = "";
    if (!isOpen) {
      c += el("use", { href: `#${shadowId}`, x: ox, y: oy });
      c += coverArt(g, -half, -half, q, q, g.id(`g${k}`), square);
      c += el("use", { href: `#${lidId}`, fill: tray });
    } else {
      // Open flat: the lid with its booklet on the left, the tray with its disc on the right
      c += el("g", { transform: s`translate(${ox} ${oy})` }, shadowRects(-q, q * 2));
      c += el("rect", { x: -q, y: -half, width: q, height: q, rx: q * 0.012, fill: "#e3e8ec" });
      const bx = -q + q * 0.03;
      const bw = q - spine - q * 0.03;
      c += coverArt(g, bx, -half + q * 0.03, bw, q * 0.94, g.id(`g${k}`), paint =>
        el("rect", { x: bx, y: -half + q * 0.03, width: bw, height: q * 0.94, fill: paint }),
      );
      // Tabs at the lid's outer edge that hold the booklet in
      c += el("path", {
        d: s`M${-q} ${-q * 0.3}h${q * 0.05}v${q * 0.1}h${-q * 0.05}ZM${-q} ${q * 0.2}h${q * 0.05}v${q * 0.1}h${-q * 0.05}Z`,
        fill: "#f4f7f9",
        opacity: "0.7",
      });
      c += el("rect", { x: 0, y: -half, width: q, height: q, rx: q * 0.012, fill: tray });
      c += el("rect", {
        x: spine + q * 0.02,
        y: -half + q * 0.03,
        width: q - spine - q * 0.05,
        height: q * 0.94,
        fill: "#fff",
        opacity: "0.08",
      });
      const r = q * 0.44;
      const dcx = spine + (q - spine) / 2;
      c += el("circle", { cx: dcx + q * 0.01, cy: q * 0.015, r, fill: "#000", opacity: "0.2" });
      c += disc(g, dcx, 0, r, tray, g.chance(0.4) ? hex(g.f(0, 360), g.f(30, 60), g.f(55, 75)) : undefined);
      // The hub's teeth show through the hole
      c += el("circle", { cx: dcx, cy: 0, r: r * 0.06, fill: "none", stroke: "#888", "stroke-width": r * 0.025 });
      // The hinge where the halves meet, and the rims
      c += el("rect", { x: -spine, y: -half, width: spine * 2, height: q, fill: "#eef2f5", opacity: "0.25" });
      c += el("rect", { x: -q * 0.005, y: -half, width: q * 0.01, height: q, fill: "#000", opacity: "0.2" });
      c += knuckles(-spine);
      c += knuckles(0);
      c += rim(-q) + rim(0);
    }
    out += el("g", { transform: s`translate(${p.x} ${p.y}) rotate(${p.deg})` }, c);
  });

  const top = placed[placed.length - 1];
  const where = { desk: "a desk", table: "a table", carpet: "a carpet" }[surface];
  note.alt(`CD cases${loose ? " and a loose disc" : ""} scattered on ${where}${open ? ", one lying open" : ""}`);
  note.focus(top.x, top.y);
  // Whole pixels are plenty for everything but small values like opacities, and keep the picture small
  return (el("defs", {}, ...defs) + out).replace(/-?\d+\.\d+/g, v => (Math.abs(+v) >= 2 ? String(Math.round(+v)) : v));
});

/*
 * Glyphs are drawn in staff units: a staff space is 10, so a notehead is about 13 wide and 10 tall,
 * and a stem is about 3.5 noteheads (35) long. Every shape in a glyph winds clockwise, so heads,
 * stems, flags and beams can share one path, and the holes of hollow heads wind the other way.
 */

/** A tilted oval: rx along the axis turned `deg` from horizontal. Clockwise, or the other way for a hole. */
function oval(cx: number, cy: number, rx: number, ry: number, deg: number, hole = false): string {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a) * rx;
  const dy = Math.sin(a) * rx;
  const arc = (x: number, y: number) => s`A${rx} ${ry} ${deg} 1 ${hole ? 0 : 1} ${x} ${y}`;
  return s`M${cx + dx} ${cy + dy}` + arc(cx - dx, cy - dy) + arc(cx + dx, cy + dy) + "Z";
}

/** A clockwise rectangle. */
const box = (x: number, y: number, bw: number, bh: number): string => s`M${x} ${y}h${bw}v${bh}h${-bw}z`;

const HEAD_RX = 6.5;
const HEAD_RY = 4.8;
const TILT = -20;
const STEM = 1.4;
/** The right end of a tilted head is at (6.32, -0.98); its left end mirrors it. */
const EDGE = 6.32;

const head = (x: number, y: number) => oval(x, y, HEAD_RX, HEAD_RY, TILT);
const halfHead = (x: number, y: number) => head(x, y) + oval(x, y, 5.2, 2.6, -35, true);

/**
 * A flag hanging to the right of a stem whose outer edge is at x. On an up-stem it starts at the
 * top (y) and curves down; on a down-stem it starts at the bottom and curves up.
 */
function flag(x: number, y: number, up: boolean): string {
  const v = (d: number) => (up ? y + d : y - d);
  if (up)
    return s`M${x} ${v(0)}C${x} ${v(8)} ${x + 8.7} ${v(11)} ${x + 6.7} ${v(22)}C${x + 6.2} ${v(16)} ${x + 2.7} ${v(12)} ${x} ${v(11)}Z`;
  // Mirrored, so the points run backwards to keep it clockwise.
  return s`M${x} ${v(11)}C${x + 2.7} ${v(12)} ${x + 6.2} ${v(16)} ${x + 6.7} ${v(22)}C${x + 8.7} ${v(11)} ${x} ${v(8)} ${x} ${v(0)}Z`;
}

/** A single note's path, head at the origin: quarter, half, whole, eighth or sixteenth, stem up or down. */
function single(type: string, up: boolean): string {
  if (type === "whole") return oval(0, 0, 8, 5.2, -8) + oval(0, 0, 4, 2.5, 55, true);
  const long = type === "sixteenth" ? 39 : 36;
  let d = type === "half" ? halfHead(0, 0) : head(0, 0);
  if (up) {
    d += box(EDGE - STEM, -long, STEM, long - 0.5);
    if (type === "eighth" || type === "sixteenth") d += flag(EDGE, -long, true);
    if (type === "sixteenth") d += flag(EDGE, -long + 8, true);
  } else {
    d += box(-EDGE, 0.5, STEM, long - 0.5);
    if (type === "eighth" || type === "sixteenth") d += flag(-EDGE + STEM, long, false);
    if (type === "sixteenth") d += flag(-EDGE + STEM, long - 8, false);
  }
  return d;
}

/** A sharp: two upright strokes, the left one set lower, crossed by two thick bars rising to the right. */
const sharp = (): string =>
  box(-3.1, -12, 1.1, 27) +
  box(2, -15, 1.1, 27) +
  [-4.5, 4.5].map(c => s`M-6 ${c + 0.5}L6 ${c - 3.7}L6 ${c - 0.5}L-6 ${c + 3.7}Z`).join("");

/** A flat: an upright stroke with a hollow rounded belly at its foot. */
const flatSign = (): string =>
  box(-4, -20, 1.2, 27) +
  "M-2.8 -2C1 -6 7 -4 5 0C3.5 3 -.5 5 -2.8 7Z" +
  "M-2.8 4.6C0 2.8 3.4 .6 3 -1.2C2.4 -3.2 -.4 -2.2 -2.8 -.2Z";

/** A notehead's bounds, for centering a glyph: [left, top, right, bottom] in staff units. */
type Bounds = [number, number, number, number];

/**
 * Two beamed eighths or four beamed sixteenths, stems up, with heads at the given staff steps.
 * Returns the path and its bounds, after moving it by (dx, dy).
 */
function beamed(steps: readonly number[], beams: number, dx = 0, dy = 0): [string, Bounds] {
  const gap = steps.length > 2 ? 17 : 21;
  const heads = steps.map((step, k): [number, number] => [k * gap + dx, -step * 5 + dy]);
  const first = heads[0];
  const last = heads[heads.length - 1];
  const span = last[0] - first[0];
  // The beam follows the melody but leans no more than a little.
  const slope = Math.max(-0.2, Math.min(0.2, (last[1] - first[1]) / span));
  // Its height is set so the stem nearest the beam is still a full 3.5 heads long.
  const base = Math.min(...heads.map(([x, y]) => y - slope * x)) - 35;
  const at = (x: number) => base + slope * x;
  let d = "";
  for (const [x, y] of heads) {
    d += head(x, y);
    d += box(x + EDGE - STEM, at(x + EDGE), STEM, y - 0.5 - at(x + EDGE));
  }
  const x0 = first[0] + EDGE - STEM;
  const x1 = last[0] + EDGE;
  for (let k = 0; k < beams; k++) {
    const off = k * 7.5;
    d += s`M${x0} ${at(x0) + off}L${x1} ${at(x1) + off}L${x1} ${at(x1) + off + 5}L${x0} ${at(x0) + off + 5}Z`;
  }
  const top = Math.min(at(x0), at(x1));
  const bottom = Math.max(...heads.map(([, y]) => y)) + HEAD_RY;
  return [d, [first[0] - HEAD_RX, top, x1, bottom]];
}

/** Music notes of different kinds, sizes and colors scattered over a soft ground. */
export const notes = defineKind("notes", "Music notes", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dark = g.chance(0.3);
  const groundHue = g.f(0, 360);
  const ground = dark ? hsl(groundHue, g.f(20, 35), g.f(13, 19)) : hsl(groundHue, g.f(25, 45), g.f(92, 96));
  // A few hues stepped around the wheel from a seeded start, so the colors vary but agree.
  const start = g.f(0, 360);
  const step = g.f(45, 80) * g.pick([1, -1]);
  const inks = Array.from({ length: g.i(3, 5) }, (_, k) =>
    dark
      ? hex((start + k * step + 360) % 360, g.f(55, 75), g.f(64, 74))
      : hex((start + k * step + 360) % 360, g.f(50, 70), g.f(44, 56)),
  );
  let out = el("rect", { width: w, height: h, fill: ground });

  // Sometimes a faint staff drifts across the frame as a wavy ribbon.
  const staff = g.chance(0.45);
  if (staff) {
    const gapY = unit * g.f(0.03, 0.04);
    const y0 = h * g.f(0.35, 0.65) - gapY * 2;
    const rise = g.f(-0.15, 0.15) * h;
    const wave = unit * g.f(0.08, 0.16);
    let d = "";
    for (let k = 0; k < 5; k++) {
      const y = y0 + k * gapY;
      d += s`M${-10} ${y - rise}C${w * 0.35} ${y - wave - rise / 3} ${w * 0.65} ${y + wave + rise / 3} ${w + 10} ${y + rise}`;
    }
    out += el("path", {
      d,
      fill: "none",
      stroke: dark ? "#ffffff" : "#000000",
      "stroke-opacity": dark ? "0.16" : "0.12",
      "stroke-width": Math.max(1, unit * 0.005),
    });
  }

  // Glyphs, biggest first so the small ones fill the gaps between them. Long frames get more, though
  // not in full proportion, to keep the markup small.
  const count = Math.round(((w * h) / (unit * unit)) ** 0.75 * g.f(9, 12));
  const sizes = Array.from({ length: count }, () => unit * g.f(0.14, 0.3)).sort((a, b) => b - a);
  const placed: [number, number, number][] = [];
  // Single glyphs are drawn once, centered on the origin, and placed with `use`.
  const defs: Record<string, [string, Bounds]> = {};
  // Glyphs are grouped by color, to keep the markup short.
  const glyphs: string[] = inks.map(() => "");
  let beamedCount = 0;
  let focus: [number, number] | undefined;
  for (const size of sizes) {
    // Choose the glyph first, then find room for it. One scale for every note of a size, so a
    // whole note's head matches a quarter's.
    const roll = g.next();
    const turn = g.f(-20, 20);
    const color = g.i(0, inks.length - 1);
    let scale = size / 44;
    let shape: string;
    let bounds: Bounds;
    let tilt = turn;
    if (roll < 0.22 && beamedCount < 4) {
      // A beamed pair of eighths or a run of four sixteenths, the stems up or (turned over) down.
      // A few at most: they take the most markup.
      const four = g.chance(0.45);
      const steps = Array.from({ length: four ? 4 : 2 }, () => g.i(-3, 3));
      // Drawn once to measure, then again centered on the origin.
      const [, box] = beamed(steps, four ? 2 : 1);
      bounds = box;
      const [d] = beamed(steps, four ? 2 : 1, -(box[0] + box[2]) / 2, -(box[1] + box[3]) / 2);
      shape = el("path", { d });
      tilt = turn * 0.6 + (g.chance(0.4) ? 180 : 0);
      beamedCount++;
    } else {
      let key: string;
      if (roll < 0.9) {
        const type = g.pick(["quarter", "quarter", "eighth", "eighth", "half", "half", "sixteenth", "whole"]);
        const up = g.chance(0.6);
        // Flagged notes are drawn either way up; plain ones are just turned over, which keeps the
        // stem on the correct side of the head.
        const flagged = type === "eighth" || type === "sixteenth";
        key = type + (flagged && !up ? "-down" : "");
        if (!up && !flagged) tilt += 180;
        const long = type === "sixteenth" ? 39 : 36;
        bounds =
          type === "whole"
            ? [-8, -5.5, 8, 5.5]
            : flagged && !up
              ? [-HEAD_RX, -HEAD_RY, HEAD_RX, long]
              : [-HEAD_RX, -long, flagged ? EDGE + 8 : HEAD_RX, HEAD_RY];
        defs[key] ??= [single(type, flagged ? up : true), bounds];
      } else {
        // Now and then a sharp or a flat, a little smaller than the notes.
        key = g.chance(0.5) ? "sharp" : "flat";
        bounds = key === "sharp" ? [-6, -15, 6, 15] : [-4, -20, 5, 7];
        defs[key] ??= [key === "sharp" ? sharp() : flatSign(), bounds];
        scale *= 0.85;
        tilt = turn * 0.5;
      }
      shape = el("use", { href: `#${g.id(key)}` });
    }
    const r = (scale * Math.hypot(bounds[2] - bounds[0], bounds[3] - bounds[1])) / 2;
    let spot: [number, number] | undefined;
    for (let tries = 0; tries < 40 && !spot; tries++) {
      const x = g.f(r * 0.85, w - r * 0.85);
      const y = g.f(r * 0.9, h - r * 0.9);
      if (placed.every(([px, py, pr]) => Math.hypot(px - x, py - y) > (pr + r) * 0.9)) spot = [x, y];
    }
    if (!spot) continue;
    placed.push([spot[0], spot[1], r]);
    focus ??= spot;
    const transform =
      s`translate(${spot[0]} ${spot[1]})` + `rotate(${Math.round(tilt)})scale(${Math.round(scale * 100) / 100})`;
    glyphs[color] += shape.replace(/\/>$/, ` transform="${transform}"/>`);
  }
  const shapes = Object.entries(defs).map(([key, [d, b]]) =>
    el("path", { id: g.id(key), d, transform: s`translate(${-(b[0] + b[2]) / 2} ${-(b[1] + b[3]) / 2})` }),
  );
  out = el("defs", {}, ...shapes) + out;
  out += glyphs.map((group, k) => (group ? el("g", { fill: inks[k] }, group) : "")).join("");

  const [fx, fy] = focus ?? [w / 2, h / 2];
  note.focus(fx, fy);
  note.alt(
    staff
      ? "Music notes of many sizes drifting along a faint wavy staff"
      : beamedCount > 1 && g.chance(0.5)
        ? "Scattered music notes with beamed eighths and sixteenths"
        : "Music notes of many sizes scattered across the frame",
  );
  return out;
});

/** Shell finishes as hue, saturation and lightness. */
const FINISHES: readonly [number, number, number][] = [
  [356, 62, 42],
  [214, 52, 40],
  [162, 42, 32],
  [272, 32, 40],
  [192, 58, 40],
  [28, 72, 48],
  [220, 8, 13],
  [40, 18, 88],
];

/**
 * A drum kit seen from the audience: the bass drum at the front, rack toms on top of it, the snare
 * and hi-hat on our right, a floor tom on our left, and crash and ride cymbals on stands.
 */
export const drums = defineKind("drums", "Drum kit", (g, w, h, note) => {
  const racks = g.pick([1, 2, 2]);
  const crashes = g.pick([1, 1, 2]);
  const cowbell = g.chance(0.25);
  const splash = g.chance(0.25);
  const stage = g.chance(0.5);
  const rug = g.chance(stage ? 0.5 : 0.75);

  // The layout, in bass drum diameters: u runs right from the bass drum's middle, v up from the floor
  // under its front head. Pieces further back stand a little higher on the floor (z).
  const floorTom = { x: -0.93, r: 0.36, top: 0.92 + g.f(-0.03, 0.03) };
  const rideX = -1.12;
  const ride = { x: rideX + g.f(-0.05, 0.05), y: 1.72 + g.f(-0.06, 0.06), r: 0.46, stand: rideX - 0.3 };
  const crashList = [{ x: 0.74 + g.f(-0.06, 0.06), y: 2.0 + g.f(-0.06, 0.06), r: 0.4, stand: 1.06 }];
  if (crashes === 2) crashList.push({ x: -0.5 + g.f(-0.05, 0.05), y: 2.12 + g.f(-0.05, 0.05), r: 0.37, stand: -0.66 });
  const hat = { x: 1.38, y: 1.34 + g.f(-0.04, 0.04), r: 0.3 };
  const snare = { x: 0.8, top: 1.0, r: 0.31 };
  const rackSpots: Record<number, [number, number][]> = {
    1: [[-0.04, 0.27]],
    2: [
      [-0.27, 0.28],
      [0.25, 0.25],
    ],
  };
  const toms = rackSpots[racks];

  const left = Math.min(floorTom.x - floorTom.r - 0.12, ride.x - ride.r, ride.stand - 0.28);
  const right = Math.max(hat.x + hat.r, crashList[0].x + crashList[0].r, crashList[0].stand + 0.28);
  const top = Math.max(...crashList.map(c => c.y + 0.12));
  const K = Math.min((h * 0.84) / (top + 0.12), (w * 0.95) / (right - left));
  const base = Math.min(h * 0.95, h / 2 + ((top + 0.05) * K) / 2 + 0.1 * K);
  const cx = w / 2 - ((left + right) / 2) * K + w * g.f(-0.02, 0.02);
  const X = (u: number) => cx + u * K;
  const Y = (v: number) => base - v * K;

  // Colors
  const [fh, fs, fl] = g.pick(FINISHES);
  const wood = g.chance(0.22);
  const sparkle = !wood && g.chance(0.4);
  const hue = wood ? g.f(18, 34) : fh + g.f(-6, 6);
  const sat = wood ? g.f(45, 62) : fs;
  const light = wood ? g.f(36, 50) : fl + g.f(-3, 3);
  const shellAt = (dl: number) => hex(hue, sat, light + dl);
  const chrome = "#c6cbd1";
  const chromeDark = "#8f969e";
  const bronze = g.pick(["#d6a443", "#cf9a3e", "#ddb052", "#c99847"]);
  const coated = "#f1eee6";

  let out = "";
  // The room or stage
  const wallY = Y(0.42);
  if (stage) {
    const curtain = hex(g.pick([350, 220, 270, 200, 30]) + g.f(-8, 8), g.f(25, 45), g.f(14, 20));
    const fold = g.id("fold");
    const spot = g.id("spot");
    out += el(
      "defs",
      {},
      el(
        "linearGradient",
        { id: fold, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: K * 0.32, y2: 0, spreadMethod: "repeat" },
        el("stop", { offset: 0, "stop-color": "#000000", "stop-opacity": 0.35 }),
        el("stop", { offset: 0.5, "stop-color": "#ffffff", "stop-opacity": 0.06 }),
        el("stop", { offset: 1, "stop-color": "#000000", "stop-opacity": 0.35 }),
      ),
      el(
        "radialGradient",
        { id: spot },
        el("stop", { offset: 0, "stop-color": "#fff6e0", "stop-opacity": 0.4 }),
        el("stop", { offset: 1, "stop-color": "#fff6e0", "stop-opacity": 0 }),
      ),
    );
    out += fill(w, h, curtain);
    out += el("rect", { width: w, height: wallY, fill: `url(#${fold})` });
    const boards = hex(g.f(20, 32), g.f(20, 32), g.f(20, 28));
    out += el("rect", { y: wallY, width: w, height: h - wallY, fill: boards });
    // Board seams running toward us
    let seams = "";
    for (let k = -5; k <= 5; k++) {
      const u = k * 0.8;
      seams += s`M ${X(u)} ${wallY} L ${X(u * 1.25)} ${h} `;
    }
    out += el("path", { d: seams, stroke: "#000", "stroke-opacity": "0.18", "stroke-width": K * 0.008 });
    // The stage's front edge, when there is floor in front of the kit
    const edge = Y(-0.32);
    if (edge < h - K * 0.05) out += el("rect", { y: edge, width: w, height: h - edge, fill: "#000", opacity: "0.45" });
    out += el("ellipse", { cx: X(0), cy: Y(1.1), rx: K * 2.4, ry: K * 1.7, fill: `url(#${spot})` });
  } else out += room(g, w, h, wallY);
  if (rug) {
    const rugColor = hex(g.f(0, 360), g.f(20, 45), stage ? g.f(22, 32) : g.f(35, 55));
    const back = Y(0.36);
    const front = Y(-0.22);
    const rl = left - 0.12;
    const rr = right + 0.12;
    out += el("path", {
      d: s`M ${X(rl)} ${back} L ${X(rr)} ${back} L ${X(rr + 0.18)} ${front} L ${X(rl - 0.18)} ${front} Z`,
      fill: rugColor,
      stroke: mix(stage ? "#3a3a3a" : "#e8e0d0", "#000000", 0.1),
      "stroke-opacity": "0.5",
      "stroke-width": K * 0.02,
    });
  }
  // A soft shadow under the whole kit
  out += el("ellipse", {
    cx: X((left + right) / 2),
    cy: Y(0.06),
    rx: ((right - left) / 2) * K,
    ry: K * 0.13,
    fill: "#000",
    opacity: "0.2",
  });

  // Gradients and textures for the shells
  const grad = g.id("shell");
  const tex = g.id("tex");
  const brz = g.id("brz");
  const stops = [
    [0, -14],
    [0.2, 0],
    [0.33, 14],
    [0.5, 2],
    [0.82, -6],
    [1, -16],
  ];
  let defs = el(
    "linearGradient",
    { id: grad, x1: 0, y1: 0, x2: 1, y2: 0 },
    ...stops.map(([o, dl]) => el("stop", { offset: o, "stop-color": shellAt(dl) })),
  );
  defs += el(
    "linearGradient",
    { id: brz, x1: 0, y1: 0, x2: 1, y2: 0 },
    el("stop", { offset: 0, "stop-color": mix(bronze, "#000000", 0.25) }),
    el("stop", { offset: 0.35, "stop-color": mix(bronze, "#ffffff", 0.35) }),
    el("stop", { offset: 0.6, "stop-color": bronze }),
    el("stop", { offset: 1, "stop-color": mix(bronze, "#000000", 0.3) }),
  );
  if (sparkle) {
    const t = K * 0.06;
    let dots = "";
    for (const [a, b] of [
      [0.2, 0.3],
      [0.7, 0.15],
      [0.45, 0.7],
      [0.85, 0.8],
      [0.1, 0.85],
    ])
      dots += s`M ${a * t} ${b * t} h 0 `;
    dots = el("path", {
      d: dots,
      stroke: "#ffffff",
      "stroke-opacity": "0.55",
      "stroke-width": t * 0.14,
      "stroke-linecap": "round",
    });
    defs += el("pattern", { id: tex, width: t, height: t, patternUnits: "userSpaceOnUse" }, dots);
  } else if (wood) {
    const t = K * 0.1;
    defs += el(
      "pattern",
      { id: tex, width: t, height: K * 2, patternUnits: "userSpaceOnUse" },
      el("path", {
        d: s`M ${t * 0.2} 0 V ${K * 2} M ${t * 0.55} 0 V ${K * 2} M ${t * 0.8} 0 V ${K * 2}`,
        stroke: "#000",
        "stroke-opacity": "0.12",
        "stroke-width": t * 0.08,
      }),
    );
  }
  out += el("defs", {}, defs);
  const texture = (d: string) => (sparkle || wood ? el("path", { d, fill: `url(#${tex})` }) : "");

  // A drum seen from the front, a little above: its shell, hoops, lugs and top head.
  // ry is how open the top head looks; lugs are the lugs around the shell.
  const drum = (x: number, topV: number, r: number, depth: number, ry: number, lugs: number, shell: string) => {
    const l = X(x - r);
    const rr = X(x + r);
    const t = Y(topV);
    const b = t + depth * K;
    const Rx = r * K;
    const Ry = ry * K;
    const d = s`M ${l} ${t} L ${l} ${b} A ${Rx} ${Ry} 0 0 0 ${rr} ${b} L ${rr} ${t} Z`;
    let o = el("path", { d, fill: shell });
    if (shell === `url(#${grad})`) o += texture(d);
    // Lugs on the front half of the shell
    let lugPath = "";
    const tall = depth > 0.45;
    for (let k = 0; k < lugs; k++) {
      const a = ((k + 0.5) / lugs) * Math.PI * 2;
      if (Math.sin(a) < 0.15) continue;
      const lx = X(x + r * Math.cos(a));
      const dy = Ry * Math.sin(a);
      const lw = K * 0.03 * Math.sin(a);
      const lh = K * (tall ? 0.16 : Math.min(0.09, depth * 0.35));
      lugPath += s`M ${lx - lw / 2} ${t + dy + (depth * K - lh) / 2} h ${lw} v ${lh} h ${-lw} Z `;
    }
    o += el("path", { d: lugPath, fill: chrome });
    // The top head, then both hoops
    o += el("ellipse", { cx: X(x), cy: t, rx: Rx, ry: Ry, fill: coated, stroke: chrome, "stroke-width": K * 0.012 });
    o += el("path", {
      d: s`M ${l} ${b} A ${Rx} ${Ry} 0 0 0 ${rr} ${b} M ${l} ${t} A ${Rx} ${Ry} 0 0 0 ${rr} ${t}`,
      fill: "none",
      stroke: chrome,
      "stroke-width": K * 0.028,
    });
    return o;
  };

  // A cymbal seen nearly edge on, dome up (dir 1) or down (dir -1), tilted by deg
  const cymbal = (x: number, y: number, r: number, deg: number, dir = 1) => {
    const cx0 = X(x);
    const cy0 = Y(y);
    const R = r * K;
    let o = el("path", {
      d: s`M ${cx0 - R} ${cy0} Q ${cx0} ${cy0 - dir * R * 0.2} ${cx0 + R} ${cy0} Q ${cx0} ${cy0 + dir * R * 0.06} ${cx0 - R} ${cy0} Z`,
      fill: `url(#${brz})`,
    });
    o += el("ellipse", {
      cx: cx0,
      cy: cy0 - dir * R * 0.1,
      rx: R * 0.17,
      ry: R * 0.07,
      fill: mix(bronze, "#ffffff", 0.15),
    });
    return deg ? el("g", { transform: s`rotate(${deg} ${cx0} ${cy0})` }, o) : o;
  };

  // Stands and hardware, all behind the drums: tubes, then legs and rods
  let tubes = "";
  let legs = "";
  const tripod = (x: number, z: number, spread: number, hub: number) => {
    legs += s`M ${X(x - spread)} ${Y(z)} L ${X(x)} ${Y(z + hub)} L ${X(x + spread)} ${Y(z)} M ${X(x)} ${Y(z + hub)} L ${X(x + 0.01)} ${Y(z - 0.05)} `;
  };
  // A boom stand: tripod, upright tube, then a boom arm up to the cymbal
  const boom = (sx: number, z: number, cx1: number, cy1: number) => {
    const knee = Math.min(cy1 - 0.3, 1.55);
    tripod(sx, z, 0.26, 0.24);
    tubes += s`M ${X(sx)} ${Y(z + 0.24)} L ${X(sx)} ${Y(knee)} `;
    legs += s`M ${X(sx)} ${Y(knee)} L ${X(cx1)} ${Y(cy1 - 0.03)} `;
  };
  boom(ride.stand, 0.16, ride.x, ride.y);
  for (const c of crashList) boom(c.stand, 0.17, c.x, c.y);
  const splashAt = { x: 0.32, y: 1.84, r: 0.2 };
  if (splash) legs += s`M ${X(crashList[0].stand)} ${Y(1.45)} L ${X(splashAt.x)} ${Y(splashAt.y - 0.02)} `;
  // Hi-hat: tripod, tube to the bottom cymbal, and the pull rod through both
  tripod(hat.x, 0.12, 0.24, 0.22);
  tubes += s`M ${X(hat.x)} ${Y(0.34)} L ${X(hat.x)} ${Y(hat.y - 0.08)} `;
  legs += s`M ${X(hat.x)} ${Y(hat.y)} L ${X(hat.x)} ${Y(hat.y + 0.2)} `;
  // Snare stand: tripod, a short tube and the basket arms
  const snareBottom = snare.top - 0.22;
  tripod(snare.x, 0.13, 0.22, 0.2);
  tubes += s`M ${X(snare.x)} ${Y(0.33)} L ${X(snare.x)} ${Y(snareBottom - 0.14)} `;
  legs += s`M ${X(snare.x - 0.22)} ${Y(snareBottom - 0.02)} L ${X(snare.x)} ${Y(snareBottom - 0.14)} L ${X(snare.x + 0.22)} ${Y(snareBottom - 0.02)} `;
  // Floor tom legs from brackets on the shell
  const ft = floorTom;
  const bracket = ft.top - 0.2;
  legs += s`M ${X(ft.x - ft.r + 0.02)} ${Y(bracket)} L ${X(ft.x - ft.r - 0.1)} ${Y(0.1)} M ${X(ft.x + ft.r - 0.02)} ${Y(bracket)} L ${X(ft.x + ft.r + 0.1)} ${Y(0.1)} M ${X(ft.x + 0.04)} ${Y(bracket)} L ${X(ft.x + 0.06)} ${Y(0.16)} `;
  // Bass drum spurs, angled out and forward to the floor
  legs += s`M ${X(-0.45)} ${Y(0.4)} L ${X(-0.66)} ${Y(-0.03)} M ${X(0.45)} ${Y(0.4)} L ${X(0.66)} ${Y(-0.03)} `;
  // The tom holder: a post out of the bass drum, with an arm to each rack tom
  tubes += s`M ${X(-0.02)} ${Y(1.0)} L ${X(-0.02)} ${Y(1.17)} `;
  for (const [tx] of toms) legs += s`M ${X(-0.02)} ${Y(1.14)} L ${X(tx)} ${Y(1.2)} `;
  out += el("path", {
    d: legs,
    fill: "none",
    stroke: chrome,
    "stroke-width": K * 0.018,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  out += el("path", { d: tubes, stroke: chromeDark, "stroke-width": K * 0.03, "stroke-linecap": "round" });

  // Cymbals: ride, crashes and the splash, each tilted a little toward the drummer's seat
  out += cymbal(ride.x, ride.y, ride.r, g.f(4, 9));
  for (const c of crashList) out += cymbal(c.x, c.y, c.r, (c.x > 0 ? -1 : 1) * g.f(6, 14));
  if (splash) out += cymbal(splashAt.x, splashAt.y, splashAt.r, g.f(-10, -4));
  // Hi-hat: bottom cymbal dome down, top cymbal dome up, nearly closed
  out += cymbal(hat.x, hat.y - 0.02, hat.r, 0, -1);
  out += cymbal(hat.x, hat.y + 0.01, hat.r, 0, 1);
  out += el("rect", {
    x: X(hat.x) - K * 0.025,
    y: Y(hat.y + 0.1),
    width: K * 0.05,
    height: K * 0.04,
    fill: chromeDark,
  });

  // The floor tom
  out += drum(ft.x, ft.top, ft.r, ft.top - 0.3, 0.07, 8, `url(#${grad})`);
  // Snare: sometimes a metal shell, sometimes matching the kit
  const metal = g.chance(0.4);
  if (metal) {
    const sg = g.id("snare");
    out += el(
      "defs",
      {},
      el(
        "linearGradient",
        { id: sg, x1: 0, y1: 0, x2: 1, y2: 0 },
        el("stop", { offset: 0, "stop-color": "#7d848c" }),
        el("stop", { offset: 0.3, "stop-color": "#eef1f4" }),
        el("stop", { offset: 0.6, "stop-color": "#b4bac1" }),
        el("stop", { offset: 1, "stop-color": "#6f767e" }),
      ),
    );
    out += drum(snare.x, snare.top, snare.r, 0.22, 0.07, 10, `url(#${sg})`);
  } else out += drum(snare.x, snare.top, snare.r, 0.22, 0.07, 10, `url(#${grad})`);
  // Rack toms, tipped toward the drummer and a little in toward the middle
  for (const [tx, tr] of toms) {
    const depth = tr * 1.45;
    const topV = 1.12 + depth;
    const tilt = tx < -0.1 ? g.f(3, 7) : tx > 0.1 ? -g.f(3, 7) : 0;
    out += el(
      "g",
      { transform: s`rotate(${tilt} ${X(tx)} ${Y(1.12)})` },
      drum(tx, topV, tr, depth, 0.04, 6, `url(#${grad})`),
    );
  }

  // The bass drum: the top of its shell running back, then the hoop and front head
  const kx = X(0);
  const ky = Y(0.5);
  out += el("circle", { cx: kx, cy: Y(0.56), r: K * 0.485, fill: shellAt(-12) });
  out += el("circle", { cx: kx, cy: ky, r: K * 0.5, fill: `url(#${grad})` });
  out += texture(
    s`M ${kx - K * 0.5} ${ky} a ${K * 0.5} ${K * 0.5} 0 1 0 ${K} 0 a ${K * 0.5} ${K * 0.5} 0 1 0 ${-K} 0 Z`,
  );
  // Claws holding the front hoop, as dashes around it
  const gap = (Math.PI * 2 * 0.472 * K) / 8;
  out += el("circle", {
    cx: kx,
    cy: ky,
    r: K * 0.472,
    fill: "none",
    stroke: chrome,
    "stroke-width": K * 0.06,
    "stroke-dasharray": s`${K * 0.035} ${gap - K * 0.035}`,
    "stroke-dashoffset": s`${gap / 2}`,
  });
  out += el("circle", {
    cx: kx,
    cy: ky,
    r: K * 0.468,
    fill: "none",
    stroke: chromeDark,
    "stroke-width": K * 0.01,
  });
  const headStyle = g.pick(["dark", "coated", "coated", "match"]);
  const head = headStyle === "dark" ? "#1e1e22" : headStyle === "coated" ? coated : shellAt(-4);
  out += el("circle", { cx: kx, cy: ky, r: K * 0.452, fill: head });
  // A simple mark on the front head: a ring, a disc or nothing, and maybe a port hole
  const mark = g.pick(["ring", "disc", "none"]);
  const accent = headStyle === "coated" ? shellAt(0) : headStyle === "dark" ? shellAt(10) : coated;
  if (mark === "ring")
    out += el("circle", {
      cx: kx,
      cy: ky,
      r: K * g.f(0.26, 0.34),
      fill: "none",
      stroke: accent,
      "stroke-width": K * g.f(0.02, 0.04),
    });
  else if (mark === "disc") out += el("circle", { cx: kx, cy: ky, r: K * g.f(0.14, 0.22), fill: accent });
  if (g.chance(0.5)) {
    const pa = g.f(0.6, 1.2);
    out += el("circle", {
      cx: kx + Math.cos(pa) * K * 0.3,
      cy: ky + Math.sin(pa) * K * 0.3,
      r: K * 0.075,
      fill: "#141416",
      stroke: chromeDark,
      "stroke-width": K * 0.012,
    });
  }
  // A soft sheen across the head
  out += el("ellipse", {
    cx: kx - K * 0.16,
    cy: ky - K * 0.2,
    rx: K * 0.2,
    ry: K * 0.1,
    transform: s`rotate(-35 ${kx - K * 0.16} ${ky - K * 0.2})`,
    fill: "#ffffff",
    opacity: "0.12",
  });
  // A cowbell clamped to the bass drum hoop, mouth up and toward the drummer
  if (cowbell) {
    const bx = X(0.3);
    const by = Y(1.02);
    out += el("path", {
      d: s`M ${bx - K * 0.05} ${by} L ${bx + K * 0.05} ${by} L ${bx + K * 0.075} ${by - K * 0.16} L ${bx - K * 0.075} ${by - K * 0.16} Z`,
      fill: "#3a3b3f",
      transform: s`rotate(12 ${bx} ${by})`,
    });
    out += el("rect", { x: bx - K * 0.03, y: by - K * 0.01, width: K * 0.06, height: K * 0.05, fill: chromeDark });
  }

  const pieces = 3 + racks;
  const extras = andList([cowbell && "a cowbell", splash && "a splash cymbal"]);
  note.alt(
    `A ${numberWord(pieces)}-piece drum kit${extras ? ` with ${extras}` : ""} ${stage ? "on a stage" : "in a room"}`,
  );
  note.focus(kx, Y(1.0));
  // Path data without the spaces around commands, and in whole pixels when the kit is big, to keep
  // the data URI short
  const whole = (v: string) => String(Math.round(Number(v)));
  out = out.replace(/ d="([^"]*)"/g, (_, d: string) => {
    const short = d.replace(/\s*([A-Za-z])\s*/g, "$1");
    return ` d="${K > 50 ? short.replace(/-?\d+\.\d/g, whole) : short}"`;
  });
  return K > 50 ? out.replace(/="(\d{2,}\.\d)"/g, (_, v: string) => `="${whole(v)}"`) : out;
});
