import { defineKind, el, facing, hsl, mix, type Point, pts, s } from "../../draw/core";
import { atLeast } from "../../draw/shapes";
import { eye, skyFade, turn, turnBox } from "./shared";

/** A tubular flower with its mouth at (x, y), its tube running `len` back at angle `a` (degrees). */
function trumpet(x: number, y: number, a: number, len: number, r: number, petal: string, throat: string): string {
  return el(
    "g",
    { transform: s`translate(${x} ${y}) rotate(${a})` },
    el("path", {
      d: s`M ${len} ${-r * 0.2} Q ${len * 0.5} ${-r * 0.25} ${r * 0.35} ${-r * 0.45} Q ${r * 0.1} ${-r * 0.6} 0 ${-r}
           L 0 ${r} Q ${r * 0.1} ${r * 0.6} ${r * 0.35} ${r * 0.45} Q ${len * 0.5} ${r * 0.25} ${len} ${r * 0.2} Z`,
      fill: petal,
    }),
    el("ellipse", { cx: r * 0.04, cy: 0, rx: r * 0.14, ry: r * 0.75, fill: throat, opacity: "0.45" }),
    el("ellipse", { cx: len, cy: 0, rx: r * 0.35, ry: r * 0.3, fill: "#5a9a40" }),
  );
}

/** A hummingbird hovering to sip from a tubular flower, its wings a blur. */
export const hummingbird = /* @__PURE__ */ defineKind("hummingbird", "Hummingbird", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([1, -1]);
  const S = Math.min(unit * g.f(0.12, 0.135), (h * 0.86) / 4.2);
  const a = g.f(-14, 10);
  const len = S * g.f(1.4, 1.8);
  // The flower's mouth, where the bill tip goes.
  const mx = w / 2 + S * g.f(0.6, 1.0);
  const my = Math.min(Math.max(h * g.f(0.4, 0.5), S * 1.95 + h * 0.04), h - S * 2.1);
  const rad = (a * Math.PI) / 180;
  const at = (lx: number, ly: number): Point => [
    mx + lx * Math.cos(rad) - ly * Math.sin(rad),
    my + lx * Math.sin(rad) + ly * Math.cos(rad),
  ];
  const hue = g.f(0, 360);
  let out = skyFade(g, w, h, hsl(hue, 30, 86), hsl(hue + 40, 35, 78));
  // Soft blurred foliage behind.
  let bokeh = "";
  for (let k = g.i(6, 10); k > 0; k--)
    bokeh += el("circle", { cx: w * g.f(0, 1), cy: h * g.f(0, 1), r: unit * g.f(0.05, 0.16) });
  out += el("g", { fill: hsl(g.f(90, 150), 35, 55), opacity: "0.25" }, bokeh);
  const rufous = g.chance(0.25);
  const back = rufous ? "#c8743a" : hsl(g.f(110, 170), 50, g.f(36, 44));
  const gorget = g.pick(["#d6304a", "#c2388f", "#7a4fc9", "#e8683a", "#2f9fb5"]);
  const belly = rufous ? "#f2dcc4" : "#eef0e6";
  const blur = mix(rufous ? "#c8743a" : "#9aa8a0", "#ffffff", 0.35);
  const petal = hsl(g.pick([352, 8, 22, 300, 325, 270]), g.f(65, 80), g.f(52, 60));
  out += facing(w / 2, dir);
  // The bird, drawn with its bill tip at the flower's mouth.
  let bird = "";
  // Tail fanned down and back.
  bird += el("polygon", {
    points: pts([
      [-S * 2.2, S * 1.05],
      [-S * 2.95, S * 1.75],
      [-S * 2.55, S * 1.95],
      [-S * 2.0, S * 1.2],
    ]),
    fill: rufous ? "#b0602a" : "#2e3a36",
  });
  // The far wing's blur.
  bird += el("ellipse", {
    cx: -S * 2.65,
    cy: -S * 0.25,
    rx: S * 0.25,
    ry: S * 0.95,
    fill: blur,
    opacity: "0.45",
    transform: s`rotate(-60 ${-S * 2.65} ${-S * 0.25})`,
  });
  // Body, slanting down to the tail, with its pale belly.
  bird += el("ellipse", {
    cx: -S * 1.95,
    cy: S * 0.6,
    rx: S * 0.92,
    ry: S * 0.43,
    fill: back,
    transform: s`rotate(-50 ${-S * 1.95} ${S * 0.6})`,
  });
  bird += el("ellipse", {
    cx: -S * 1.85,
    cy: S * 0.78,
    rx: S * 0.62,
    ry: S * 0.22,
    fill: belly,
    transform: s`rotate(-50 ${-S * 1.85} ${S * 0.78})`,
  });
  // Head, throat, bill and eye.
  bird += el("circle", { cx: -S * 1.45, cy: 0, r: S * 0.36, fill: back });
  bird += el("ellipse", {
    cx: -S * 1.38,
    cy: S * 0.26,
    rx: S * 0.28,
    ry: S * 0.17,
    fill: gorget,
    transform: s`rotate(-25 ${-S * 1.38} ${S * 0.26})`,
  });
  bird += el("polygon", {
    points: pts([
      [-S * 1.14, -S * 0.07],
      [S * 0.08, 0],
      [-S * 1.14, S * 0.05],
    ]),
    fill: "#26262c",
  });
  bird += eye(-S * 1.4, -S * 0.08, S * 0.07);
  // The near wing: a blur of two strokes and a fan between them.
  bird += el("path", {
    d: s`M ${-S * 1.9} ${S * 0.2} L ${-S * 2.0} ${-S * 1.55} Q ${-S * 2.8} ${-S * 1.4} ${-S * 3.0} ${-S * 0.6} Z`,
    fill: blur,
    opacity: "0.3",
  });
  bird += el("ellipse", {
    cx: -S * 2.05,
    cy: -S * 0.75,
    rx: S * 0.18,
    ry: S * 0.85,
    fill: blur,
    opacity: "0.65",
    transform: s`rotate(-12 ${-S * 2.05} ${-S * 0.75})`,
  });
  out += el("g", { transform: s`translate(${mx} ${my}) rotate(${a})` }, bird);
  // The flower stalk: it rises from below, through the feeding flower's base, and on up.
  const base = at(len, 0);
  const sway = S * g.f(-0.6, 0.6);
  const tip: Point = [base[0] + S * g.f(-0.3, 0.5), Math.max(h * 0.04, base[1] - S * g.f(2.2, 3))];
  const green = hsl(g.f(95, 130), 40, g.f(32, 40));
  out += el("path", {
    d: s`M ${base[0] + sway} ${h + 5} Q ${base[0] + sway * 1.5} ${(h + base[1]) / 2} ${base[0]} ${base[1]}
         T ${tip[0]} ${tip[1]}`,
    stroke: green,
    "stroke-width": Math.max(1.5, S * 0.12),
    fill: "none",
  });
  // Leaves low on the stalk.
  for (let k = g.i(1, 3); k > 0; k--) {
    const ly = base[1] + (h - base[1]) * g.f(0.25, 0.8);
    const side = g.pick([-1, 1]);
    out += el("ellipse", {
      cx: base[0] + sway + side * S * 0.45,
      cy: ly,
      rx: S * 0.5,
      ry: S * 0.18,
      fill: green,
      transform: s`rotate(${side * -30} ${base[0] + sway + side * S * 0.45} ${ly})`,
    });
  }
  // Other flowers hanging from the upper stalk, then the one the bird drinks from.
  const r = S * 0.48;
  const blooms = g.i(2, 4);
  const first = g.pick([1, -1]);
  for (let k = 0; k < blooms; k++) {
    // Spread up the stalk, alternately hanging away from the bird and reaching up the other way.
    const t = 0.35 + (0.65 * (k + g.f(0.2, 0.8))) / blooms;
    const ax = base[0] + (tip[0] - base[0]) * t;
    const ay = base[1] + (tip[1] - base[1]) * t;
    const down = g.f(15, 60);
    const up = g.f(-150, -115);
    const fl = len * g.f(0.7, 0.9);
    // Reaching up only where there's room below the top edge.
    const p = (k % 2 ? -first : first) > 0 || ay - fl * 0.8 - r < h * 0.03 ? down : up;
    const pr = (p * Math.PI) / 180;
    out += trumpet(ax + Math.cos(pr) * fl, ay + Math.sin(pr) * fl, p + 180, fl, r, petal, "#000");
  }
  out += trumpet(mx, my, a, len, r, petal, "#000");
  out += "</g>";
  const [hx, hy] = at(-S * 1.45, 0);
  note.alt(`A hummingbird hovering to sip from a tubular flower, facing ${dir > 0 ? "right" : "left"}`);
  note.focus(turn(w / 2, dir, hx), hy);
  // The head, with the start of the bill.
  // The head is small in the scene, so the frame grows about its center to a size an avatar can crop.
  const [fx, fy, fw, fh] = atLeast([hx - S * 0.55, hy - S * 0.6, S * 1.3, S * 1.2], Math.min(w, h) * 0.26);
  note.frame(turnBox(w / 2, dir, fx, fw), fy, fw, fh);
  return out;
});
