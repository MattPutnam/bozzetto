import { defineKind, el, hsl, mix, type Point, s } from "../../draw/core";
import { room } from "./shared";

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
export const guitar = /* @__PURE__ */ defineKind(
  "guitar",
  "Guitar",
  { type: ["acoustic", "electric"] },
  (g, w, h, note) => {
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
        body += el("rect", {
          x: X(0.13),
          y: Y(0.9),
          width: 0.012 * S,
          height: 0.05 * S,
          rx: 0.004 * S,
          fill: "#1d1d1d",
        });
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
  },
);
