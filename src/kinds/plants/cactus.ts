import { defineKind, el, hex, hsl, mix, pts, s } from "../../draw/core";
import { blob, table } from "../../draw/shapes";

/**
 * A cactus in a pot: a tall one with arms, a ribbed barrel, prickly pear paddles, or round balls.
 *
 * @category Plants
 */
export const cactus = /* @__PURE__ */ defineKind("cactus", "Potted cactus", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.78, 0.84);
  const cx = w / 2;
  const potW = unit * g.f(0.16, 0.2);
  const potH = unit * g.f(0.2, 0.25);
  const potY = top + unit * 0.02;
  const pot = g.pick(["#c4572f", "#d97b4f", "#e9e3d5", "#3e6d8e", "#2b2b2b", "#e8b04b"]);
  const green = hex(g.f(95, 150), g.f(30, 50), g.f(36, 48));
  const rib = mix(green, "#000000", 0.22);
  const bloom = hsl(g.pick([g.f(325, 360), g.f(0, 30), g.f(45, 55)]), 80, 66);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(50, 64)));
  const rimY = potY - potH;
  // Spines: little crosses at each areole, gathered into one path.
  const tick = unit * 0.0065;
  let spines = "";
  const areole = (x: number, y: number) => {
    spines += s`M${x - tick} ${y - tick}l${tick * 2} ${tick * 2}m0 ${-tick * 2}l${-tick * 2} ${tick * 2}`;
  };
  const spinePath = (d: string) =>
    el("path", { d, stroke: "#fbf5df", "stroke-width": Math.max(0.8, unit * 0.0045), "stroke-linecap": "round" });
  const ribLine = (d: string, width: number) =>
    el("path", { d, stroke: rib, "stroke-width": width, "stroke-linecap": "round", fill: "none" });
  const flower = (x: number, y: number, r: number) =>
    el("path", { d: blob(g, x, y, r, r * 0.8, 5, 0.3, 0.03), fill: bloom }) +
    el("circle", { cx: x, cy: y, r: r * 0.3, fill: "#f6d860" });
  const kind = g.pick(["column", "column", "barrel", "pear", "ball"] as const);
  let flowering = g.chance(0.5);
  if (kind === "column") {
    // One tall ribbed column with arms, or a clump of columns.
    const count = g.chance(0.3) ? g.i(2, 3) : 1;
    const cols = [];
    for (let k = 0; k < count; k++) {
      const off = count === 1 ? 0 : (k / (count - 1) - 0.5) * potW * (count === 2 ? 0.75 : 1.1);
      const stemW = potW * (count === 1 ? g.f(0.55, 0.7) : g.f(0.42, 0.5));
      const stemH = unit * (count === 1 ? g.f(0.3, 0.42) : k === 1 ? g.f(0.36, 0.42) : g.f(0.18, 0.32));
      cols.push({ x: cx + off, stemW, stemH });
    }
    // The tallest column is drawn last, in front.
    cols.sort((a, b) => a.stemH - b.stemH);
    let armCount = 0;
    if (count === 1) {
      const { stemW, stemH } = cols[0];
      const arms: string[] = [];
      for (const side of [-1, 1])
        if (g.chance(0.7)) {
          const armY = rimY - stemH * g.f(0.35, 0.6);
          const reach = stemW * g.f(1.1, 1.5);
          const rise = stemH * g.f(0.2, 0.4);
          const armX = cx + side * reach;
          arms.push(s`M ${cx} ${armY} H ${armX} V ${armY - rise}`);
          for (let y = armY - rise; y < armY - stemW * 0.2; y += unit * 0.035) areole(armX + side * stemW * 0.3, y);
        }
      armCount = arms.length;
      if (arms.length) {
        out += el("path", {
          d: arms.join(" "),
          stroke: green,
          "stroke-width": stemW * 0.75,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
        });
      }
    }
    let ribs = "";
    for (const [k, { x, stemW, stemH }] of cols.entries()) {
      const stemTop = rimY - stemH;
      out += el("rect", {
        x: x - stemW / 2,
        y: stemTop,
        width: stemW,
        height: stemH + unit * 0.02,
        rx: stemW / 2,
        fill: mix(green, "#ffffff", 0.06 * (count - 1 - k)),
      });
      for (const f of [-0.2, 0.2]) ribs += s`M ${x + stemW * f} ${stemTop + stemW * 0.3} V ${rimY}`;
      for (let y = stemTop + stemW * 0.35; y < rimY; y += unit * 0.04)
        for (const f of [-0.38, 0.38]) areole(x + stemW * f, y);
    }
    out += ribLine(ribs, cols[0].stemW * 0.06);
    const tall = cols[cols.length - 1];
    const stemTop = rimY - tall.stemH;
    const armsText = count > 1 ? "" : armCount === 0 ? "" : armCount === 1 ? " with one arm" : " with two arms";
    const flowerText = flowering ? (armsText ? " and a flower" : " with a flower") : "";
    note.alt(
      count > 1
        ? `A clump of ${count === 2 ? "two" : "three"} column cacti in a pot`
        : `A potted cactus${armsText}${flowerText}`,
    );
    if (count > 1) flowering = false;
    note.focus(tall.x, stemTop + tall.stemH * 0.35);
    out += spinePath(spines);
    if (flowering) out += flower(tall.x, stemTop + tall.stemW * 0.05, tall.stemW * 0.3);
  } else if (kind === "barrel") {
    // A squat ribbed barrel, often crowned with flowers.
    const rx = potW * g.f(0.85, 1);
    const ry = rx * g.f(0.85, 1.1);
    const by = rimY - unit * 0.045 - ry * 0.72;
    out += el("ellipse", { cx, cy: by, rx, ry, fill: green });
    out += el("ellipse", {
      cx: cx - rx * 0.35,
      cy: by - ry * 0.3,
      rx: rx * 0.35,
      ry: ry * 0.45,
      fill: "#ffffff",
      opacity: "0.08",
    });
    let ribs = s`M ${cx} ${by - ry} V ${by + ry}`;
    for (const t of [0.4, 0.75])
      ribs += s`M ${cx} ${by - ry} A ${rx * t} ${ry} 0 0 0 ${cx} ${by + ry} A ${rx * t} ${ry} 0 0 0 ${cx} ${by - ry}`;
    out += ribLine(ribs, unit * 0.006);
    for (const t of [-0.88, -0.58, -0.2, 0.2, 0.58, 0.88])
      for (let a = 0.5; a < 2.3; a += 0.42) areole(cx + rx * t * Math.sin(a), by - ry * Math.cos(a));
    out += spinePath(spines);
    const blooms = flowering ? g.i(1, 3) : 0;
    for (let k = 0; k < blooms; k++) {
      const fx = cx + (blooms === 1 ? 0 : (k / (blooms - 1) - 0.5) * rx * 0.6);
      out += flower(fx, by - ry + rx * 0.03 + Math.abs(fx - cx) * 0.25, rx * 0.2);
    }
    note.alt(`A round barrel cactus in a pot${blooms ? ` crowned with ${blooms === 1 ? "a flower" : "flowers"}` : ""}`);
    note.focus(cx, by - ry * 0.2);
  } else if (kind === "pear") {
    // Prickly pear: flat oval paddles growing from the edges of one another.
    const prx = potW * g.f(0.5, 0.58);
    const pry = prx * g.f(1.25, 1.4);
    type Pad = { x: number; y: number; a: number; k: number; depth: number };
    const base: Pad = { x: cx + g.f(-0.1, 0.1) * prx, y: rimY - pry * 0.92, a: g.f(-10, 10), k: 1, depth: 0 };
    const pads: Pad[] = [base];
    const grow = (parent: Pad, phi: number) => {
      const r = (parent.a * Math.PI) / 180;
      const lx = prx * parent.k * Math.sin(phi);
      const ly = -pry * parent.k * Math.cos(phi) * 0.92;
      const ax = parent.x + lx * Math.cos(r) - ly * Math.sin(r);
      const ay = parent.y + lx * Math.sin(r) + ly * Math.cos(r);
      const a = parent.a + ((phi * 180) / Math.PI) * 1.1;
      const k = parent.k * g.f(0.78, 0.9);
      const len = pry * k * 0.82;
      const ra = (a * Math.PI) / 180;
      const pad = { x: ax + len * Math.sin(ra), y: ay - len * Math.cos(ra), a, k, depth: parent.depth + 1 };
      // Keep every paddle inside the picture.
      const reach = pry * k;
      if (pad.y - reach > unit * 0.03 && pad.x - reach > unit * 0.03 && pad.x + reach < w - unit * 0.03) pads.push(pad);
    };
    const sides = g.chance(0.5) ? [-1, 1] : [g.pick([-1, 1])];
    for (const side of sides) grow(base, side * g.f(0.35, 0.7));
    if (g.chance(0.6)) grow(pads[pads.length - 1], g.f(-0.4, 0.4));
    const fruit = g.chance(0.45);
    // Children sit behind their parents, so draw the deepest first.
    for (const pad of [...pads].sort((p, q) => q.depth - p.depth)) {
      const rx = prx * pad.k;
      const ry = pry * pad.k;
      spines = "";
      for (const v of [-0.6, -0.2, 0.2, 0.6])
        for (const u of v === -0.6 || v === 0.6 ? [-0.25, 0.25] : [-0.5, 0, 0.5])
          areole(pad.x + u * rx, pad.y + v * ry);
      let inner = el("ellipse", { cx: pad.x, cy: pad.y, rx, ry, fill: mix(green, "#ffffff", pad.depth * 0.07) });
      inner += el("ellipse", {
        cx: pad.x,
        cy: pad.y,
        rx: rx * 0.95,
        ry: ry * 0.96,
        fill: "none",
        stroke: rib,
        "stroke-width": unit * 0.004,
        opacity: "0.6",
      });
      inner += spinePath(spines);
      if (fruit && pad.depth === Math.max(...pads.map(p => p.depth)))
        for (const u of [-0.45, 0.1, 0.5].slice(0, g.i(1, 3)))
          inner += el("ellipse", {
            cx: pad.x + u * rx,
            cy: pad.y - ry * Math.sqrt(1 - u * u) - rx * 0.16,
            rx: rx * 0.15,
            ry: rx * 0.22,
            fill: "#b23a63",
          });
      out += el("g", { transform: s`rotate(${pad.a} ${pad.x} ${pad.y})` }, inner);
    }
    note.alt(
      `A prickly pear cactus with ${["one", "two", "three", "four"][pads.length - 1]} paddles${fruit ? " and fruit" : ""} in a pot`,
    );
    note.focus(base.x, base.y - pry * 0.5);
  } else {
    // Ball cactus: one round globe, maybe with pups in front at its sides.
    const r = potW * g.f(0.62, 0.75);
    const by = rimY - unit * 0.045 - r * 0.78;
    const pups = g.pick([0, 0, 1, 2]);
    const balls: [number, number, number][] = [[cx, by, r]];
    const pupSide = g.pick([-1, 1]);
    for (let k = 0; k < pups; k++) {
      const side = pups === 1 ? pupSide : k === 0 ? -1 : 1;
      const pr = r * g.f(0.45, 0.58);
      balls.push([cx + side * (r * 0.82 + pr * 0.12), rimY - unit * 0.045 - pr * 0.55, pr]);
    }
    for (const [x, y, br] of balls) {
      out += el("circle", {
        cx: x,
        cy: y,
        r: br,
        fill: br === r ? green : mix(green, "#ffffff", 0.1),
        stroke: rib,
        "stroke-width": unit * 0.004,
      });
      spines = "";
      areole(x, y - br * 0.15);
      for (const [t, n] of [
        [0.45, 5],
        [0.8, br === r ? 9 : 6],
      ])
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + t * 3;
          areole(x + Math.cos(a) * br * t, y - br * 0.15 + Math.sin(a) * br * t * 0.95);
        }
      out += spinePath(spines);
    }
    if (flowering) {
      // A ring of little flowers around the crown.
      for (let a = -2.5; a < -0.6; a += 0.38)
        out += flower(cx + Math.cos(a) * r * 0.82, by + Math.sin(a) * r * 0.82, r * 0.16);
    }
    const count = pups + 1;
    note.alt(
      `${count === 1 ? "A ball cactus" : count === 2 ? "Two ball cacti" : "Three ball cacti"} in a pot${flowering ? " with a ring of flowers" : ""}`,
    );
    note.focus(cx, by);
  }
  // Pot: shadow, body, and rim
  out += el("ellipse", { cx, cy: potY, rx: potW * 1.1, ry: unit * 0.018, fill: "#000", opacity: "0.12" });
  out += el("polygon", {
    points: pts([
      [cx - potW, rimY],
      [cx + potW, rimY],
      [cx + potW * 0.75, potY],
      [cx - potW * 0.75, potY],
    ]),
    fill: pot,
  });
  out += el("rect", {
    x: cx - potW * 1.1,
    y: rimY - unit * 0.045,
    width: potW * 2.2,
    height: unit * 0.055,
    rx: unit * 0.008,
    fill: mix(pot, "#ffffff", 0.12),
  });
  return out;
});
