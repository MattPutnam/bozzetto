import { defineKind, el, hsl, type Point, s } from "../../draw/core";
import { blossoms, dots, FLOWERS, hill, LIT, local, shade, skyAt, timeOfDay, tone, veil, when } from "./shared";

/** A glass greenhouse full of plants, in a garden with beds and a path. */
export const greenhouse = /* @__PURE__ */ defineKind(
  "greenhouse",
  "Greenhouse",
  { roof: ["gable", "arched"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const time = timeOfDay(g);
    const dark = shade(time);
    const lit = time !== "day";
    const roof = g.option("roof", g.pick(["gable", "arched"] as const));
    const ground = h * g.f(0.66, 0.72);
    const size = Math.min(unit * 0.7, w * 0.5, (ground - h * 0.07) / 0.88);
    const cx = w * g.f(0.42, 0.58);
    const grass = g.f(85, 125);
    let out = skyAt(g, w, h, time, ground);
    out += hill(g, w, h, ground - h * g.f(0.05, 0.12), h * g.f(0.02, 0.06), tone(grass + 12, 26, 60, dark));
    // A hedge behind, then the lawn.
    const hedge = tone(grass + 10, 36, 30, dark);
    const bumps: Point[] = [];
    for (let x = -unit * 0.02; x < w + unit * 0.05; x += unit * g.f(0.05, 0.08))
      bumps.push([x, ground - unit * g.f(0.045, 0.055)]);
    out += dots(bumps, unit * 0.05, hedge);
    out += el("rect", { y: ground - unit * 0.05, width: w, height: unit * 0.05 + 1, fill: hedge });
    out += el("rect", { y: ground, width: w, height: h - ground, fill: tone(grass, 40, 46, dark) });
    out += veil(w, h, time);
    const u = local(cx, ground, size);
    const shape =
      roof === "gable"
        ? "M -0.5 0 V -0.5 L 0 -0.84 L 0.5 -0.5 V 0 Z"
        : "M -0.5 0 V -0.45 A 0.5 0.4 0 0 1 0.5 -0.45 V 0 Z";
    const roofAt = (x: number) =>
      roof === "gable"
        ? -0.5 - 0.34 * (1 - Math.abs(x) / 0.5)
        : -0.45 - 0.4 * Math.sqrt(Math.max(0, 1 - (x / 0.5) ** 2));
    const clip = g.id("glass");
    out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: u.d(shape) })));
    out += u.ellipse(0, 0, 0.62, 0.04, { fill: "#000", opacity: 0.15 });
    // Inside: the far glass, tall plants, a bench of potted plants.
    const shadeIn = lit ? 0.6 : dark;
    let inside = el("path", { d: u.d(shape), fill: lit ? hsl(44, 80, 78) : tone(185, 30, 86, dark) });
    const leafHue = grass + g.f(-10, 20);
    // A pointed leaf from base (bx, by) to tip (tx, ty), `wd` wide, arched sideways by `bend`.
    const leaf = (bx: number, by: number, tx: number, ty: number, wd: number, bend = 0) => {
      const len = Math.hypot(tx - bx, ty - by);
      const nx = -(ty - by) / len;
      const ny = (tx - bx) / len;
      const mx = (bx + tx) / 2;
      const my = (by + ty) / 2;
      return u.d(
        `M ${bx} ${by} Q ${mx + nx * (bend + wd)} ${my + ny * (bend + wd)} ${tx} ${ty} Q ${mx + nx * (bend - wd)} ${my + ny * (bend - wd)} ${bx} ${by} Z`,
      );
    };
    // Two or three tall plants growing up behind the bench: tomatoes on canes, fronds or broad leaves.
    const count = g.i(2, 3);
    const kinds: string[] = [];
    const fruits: Point[] = [];
    let canes = "";
    for (let k = 0; k < count; k++) {
      const x = (count === 2 ? -0.25 + k * 0.5 : -0.33 + k * 0.33) + g.f(-0.04, 0.04);
      const kind = g.pick(["tomato", "fronds", "broad"] as const);
      kinds.push(kind);
      let d = "";
      if (kind === "tomato") {
        const top = -g.f(0.55, 0.68);
        canes += `M ${x} -0.14 V ${top} `;
        for (let j = 0; j < 6; j++) {
          const y = -0.2 + ((top + 0.06 + 0.2) * j) / 5;
          const side = j % 2 ? 1 : -1;
          d += leaf(x, y, x + side * 0.11, y - 0.05, 0.03, side * 0.01);
          if (j % 2 === 0 && j < 5) fruits.push([u.x(x - side * 0.03), u.y(y + 0.03)]);
        }
      } else if (kind === "fronds") {
        const fronds = g.i(5, 7);
        const reach = g.f(0.28, 0.38);
        for (let j = 0; j < fronds; j++) {
          const angle = Math.PI * (1.1 + (0.8 * (j + 0.5)) / fronds);
          const tx = x + Math.cos(angle) * reach;
          const ty = -0.2 + Math.sin(angle) * reach;
          d += leaf(x, -0.2, tx, ty, 0.03, (Math.cos(angle) < 0 ? 1 : -1) * 0.05);
        }
      } else {
        const leaves = g.i(4, 5);
        for (let j = 0; j < leaves; j++) {
          const angle = Math.PI * (1.15 + (0.7 * (j + 0.5)) / leaves);
          const sx = x + Math.cos(angle) * 0.1;
          const sy = -0.22 + Math.sin(angle) * 0.14;
          canes += `M ${x} -0.18 L ${sx} ${sy} `;
          d += leaf(sx, sy, sx + Math.cos(angle) * 0.2, sy + Math.sin(angle) * 0.2, 0.065);
        }
      }
      inside += el("path", { d, fill: tone(leafHue + k * 10, 40, 32 + (k % 2) * 8, shadeIn) });
    }
    if (canes) inside += u.path(canes, { stroke: tone(30, 30, 40, shadeIn), "stroke-width": u.k(0.012) });
    if (fruits.length) inside += dots(fruits, size * 0.02, tone(g.pick([4, 12]), 75, 52, shadeIn / dark));
    // The bench and its pots, each with a few small leaves.
    inside += u.rect(-0.5, -0.24, 1, 0.025, { fill: tone(28, 35, 34, shadeIn) });
    let pots = "";
    let sprigs = "";
    for (let x = -0.42; x < 0.42; x += g.f(0.13, 0.17)) {
      if (Math.abs(x) < 0.14) continue;
      pots += u.d(`M ${x - 0.035} -0.31 H ${x + 0.035} L ${x + 0.027} -0.24 H ${x - 0.027} Z`);
      sprigs += leaf(x, -0.31, x - 0.06, -0.37, 0.018) + leaf(x, -0.31, x + 0.06, -0.37, 0.018);
      sprigs += leaf(x, -0.31, x + g.f(-0.01, 0.01), -0.4, 0.02);
    }
    inside += el("path", { d: sprigs, fill: tone(leafHue + 20, 42, 42, shadeIn) });
    inside += el("path", { d: pots, fill: tone(16, 50, 48, shadeIn) });
    out += el("g", { "clip-path": `url(#${clip})` }, inside);
    // The glass over it, with a highlight.
    out += el("path", { d: u.d(shape), fill: hsl(190, 40, 92), opacity: lit ? 0.12 : 0.25 });
    out += el(
      "g",
      { "clip-path": `url(#${clip})` },
      u.path("M -0.42 0 L -0.02 -0.9 L 0.08 -0.9 L -0.32 0 Z M -0.22 0 L 0.18 -0.9 L 0.22 -0.9 L -0.18 0 Z", {
        fill: "#ffffff",
        opacity: 0.18,
      }),
    );
    // The low brick wall, split by the door.
    const brick = tone(g.f(5, 22), 40, 46, dark);
    out += u.rect(-0.52, -0.14, 0.41, 0.14, { fill: brick });
    out += u.rect(0.11, -0.14, 0.41, 0.14, { fill: brick });
    out += u.path("M -0.52 -0.07 H -0.11 M 0.11 -0.07 H 0.52", {
      stroke: "#000",
      opacity: 0.15,
      "stroke-width": u.k(0.006),
    });
    // The frame: outline, glazing bars, the door.
    const metal = g.chance(0.6) ? tone(40, 15, 95, dark) : tone(150, 20, 24, dark);
    const bays = g.i(3, 4) * 2;
    let bars = "M -0.5 -0.14 H 0.5 ";
    bars += roof === "gable" ? "M -0.5 -0.5 H 0.5 " : "M -0.5 -0.45 H 0.5 ";
    for (let k = 1; k < bays; k++) {
      const x = -0.5 + k / bays;
      bars += `M ${x} -0.14 V ${roofAt(x)} `;
    }
    bars += "M -0.11 0 V -0.4 H 0.11 V 0 M -0.11 -0.2 H 0.11 ";
    out += u.path(bars, { fill: "none", stroke: metal, "stroke-width": u.k(0.014) });
    out += u.path(shape, { fill: "none", stroke: metal, "stroke-width": u.k(0.024), "stroke-linejoin": "round" });
    out += u.circle(0.08, -0.2, 0.012, { fill: hsl(45, 60, 60) });
    if (roof === "gable") out += u.rect(-0.015, -0.9, 0.03, 0.07, { fill: metal });
    // Glow spilling from the open door at dusk.
    if (lit) out += u.path("M -0.11 0 H 0.11 L 0.2 0.2 H -0.2 Z", { fill: LIT, opacity: 0.2 });
    // The path to the door, and beds either side of it.
    const top = u.x(0);
    const foot = top + size * g.f(-0.2, 0.2);
    const wide = size * 0.22;
    out += el("path", {
      d: s`M${top - size * 0.1} ${ground}L${foot - wide} ${h}H${foot + wide}L${top + size * 0.1} ${ground}Z`,
      fill: g.chance(0.5) ? tone(18, 35, 55, dark) : tone(35, 20, 74, dark),
    });
    const veg = g.chance(0.5);
    let beds = "";
    const rows: Point[][] = [[], []];
    const flowerSpots: Point[] = [];
    for (const dir of [-1, 1]) {
      const y0 = ground + (h - ground) * 0.3;
      const y1 = ground + (h - ground) * g.f(0.7, 0.85);
      const near = (y: number) =>
        top +
        (foot - top) * ((y - ground) / (h - ground)) +
        dir * (size * 0.1 + (wide - size * 0.1) * ((y - ground) / (h - ground)) + size * 0.06);
      const bw = size * g.f(0.45, 0.6);
      const a0 = near(y0);
      const a1 = near(y1);
      beds += s`M${a0} ${y0}L${a0 + dir * bw} ${y0}L${a1 + dir * bw * 1.15} ${y1}L${a1} ${y1}Z`;
      for (let k = 0; k < 3; k++) {
        const t = (k + 0.5) / 3;
        const y = y0 + (y1 - y0) * t;
        const x0 = a0 + (a1 - a0) * t;
        const span = bw * (1 + 0.15 * t);
        for (let j = 0; j < 6; j++) {
          const xx = x0 + dir * span * ((j + 0.5) / 6);
          rows[k < 1 ? 0 : 1].push([xx, y]);
          if (!veg) flowerSpots.push([xx + g.f(-1, 1), y - size * 0.02]);
        }
      }
    }
    out += el("path", { d: beds, fill: tone(25, 35, 28, dark) });
    const leafy = tone(grass + 15, 45, 38, dark);
    out += dots(rows[0], size * 0.024, leafy) + dots(rows[1], size * 0.03, leafy);
    if (flowerSpots.length) out += blossoms(g, flowerSpots, size * 0.02, FLOWERS);
    note.alt(
      `A ${roof === "arched" ? "round-roofed " : ""}glass greenhouse full of ${kinds.includes("tomato") ? "tomato vines and potted plants" : "leafy plants"}, with ${veg ? "vegetable" : "flower"} beds by the path${when(time)}${lit ? ", lit from inside" : ""}`,
    );
    note.focus(cx, ground - size * 0.4);
    return out;
  },
);
