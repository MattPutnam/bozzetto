import { defineKind, el, facing, hsl, type Point, s } from "../../draw/core";
import { baseFor, shade, softContact, sweepStudio } from "./shared";

/**
 * An open laptop at three-quarters, a wallpaper on its screen.
 *
 * @category Products
 */
export const laptop = /* @__PURE__ */ defineKind("laptop", "Laptop", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.chance(0.5) ? 1 : -1;
  const yaw = (g.f(22, 36) * Math.PI) / 180;
  const elev = (g.f(20, 30) * Math.PI) / 180;
  const tilt = (g.f(8, 20) * Math.PI) / 180;
  const body = g.pick(["#d9dcdf", "#c9ccd1", "#8e9399", "#3a3d42", "#2b2d33", "#d8c7b4", "#34405a", "#e5d3cf"]);
  const keyColor = g.pick(["#26272b", "#26272b", shade(body, 0.25)]);
  // In laptop units: width 1, depth D, deck thickness T, screen height H.
  const D = 0.68;
  const T = 0.035;
  const H = 0.64;
  const ca = Math.cos(yaw);
  const sa = Math.sin(yaw);
  const ce = Math.cos(elev);
  const se = Math.sin(elev);
  const raw = (x: number, y: number, z: number): Point => [x * ca - z * sa, -y * ce + (z * ca + x * sa) * se];
  const hingeZ = -D / 2;
  const lidUp = H * Math.cos(tilt);
  const lidBack = H * Math.sin(tilt);
  const corners = [
    raw(-0.5, 0, D / 2),
    raw(0.5, 0, D / 2),
    raw(0.5, 0, -D / 2),
    raw(-0.5, T + lidUp, hingeZ - lidBack),
    raw(0.5, T + lidUp, hingeZ - lidBack),
    raw(-0.5, 0, -D / 2),
  ];
  const minX = Math.min(...corners.map(p => p[0]));
  const maxX = Math.max(...corners.map(p => p[0]));
  const minY = Math.min(...corners.map(p => p[1]));
  const maxY = Math.max(...corners.map(p => p[1]));
  const k = Math.min((unit * 0.74) / (maxX - minX), (unit * 0.62) / (maxY - minY));
  const itemH = (maxY - minY) * k;
  const cx = w / 2;
  const base = baseFor(h, unit, itemH);
  const midX = (minX + maxX) / 2;
  const P = (x: number, y: number, z: number): Point => {
    const [a, b] = raw(x, y, z);
    return [cx + (a - midX) * k, base + (b - maxY) * k];
  };
  // Points on the lid face (u across, v up from the hinge) and on the deck (v from back to front).
  const lid = (u: number, v: number, depth = 0): Point =>
    P(-0.5 + u, T + v * lidUp - depth * Math.sin(tilt), hingeZ - v * lidBack - depth * Math.cos(tilt));
  const deck = (u: number, v: number, y = T): Point => P(-0.5 + u, y, -D / 2 + v * D);
  const quad = (a: Point, b: Point, c: Point, d: Point) =>
    s`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]} L ${d[0]} ${d[1]} Z`;
  const lidQuad = (u0: number, v0: number, u1: number, v1: number, depth = 0) =>
    quad(lid(u0, v0, depth), lid(u1, v0, depth), lid(u1, v1, depth), lid(u0, v1, depth));
  const deckQuad = (u0: number, v0: number, u1: number, v1: number) =>
    quad(deck(u0, v0), deck(u1, v0), deck(u1, v1), deck(u0, v1));
  const screenCenter = lid(0.5, 0.55);
  let out = sweepStudio(g, w, h, base - itemH * 0.4, cx + dir * (screenCenter[0] - cx), screenCenter[1]);
  const footA = P(-0.5, 0, D / 2);
  const footB = P(0.5, 0, -D / 2);
  const footC = P(0.5, 0, D / 2);
  const footD = P(-0.5, 0, -D / 2);
  const fx = (Math.min(footA[0], footD[0]) + Math.max(footB[0], footC[0])) / 2;
  const fy = (Math.min(footB[1], footD[1]) + Math.max(footA[1], footC[1])) / 2;
  out += facing(cx, dir);
  const spanX = Math.max(footB[0], footC[0]) - Math.min(footA[0], footD[0]);
  const spanY = Math.max(footA[1], footC[1]) - Math.min(footB[1], footD[1]);
  out += softContact(fx, fy + k * 0.01, spanX * 0.42, spanY * 0.3);
  // The lid: its back edge for thickness, the face, the bezel and the display
  out += el("path", { d: lidQuad(0, 0, 1, 1, 0.018), fill: shade(body, 0.3) });
  out += el("path", { d: lidQuad(0, 0, 1, 1), fill: body });
  out += el("path", { d: lidQuad(0.015, 0.015, 0.985, 0.985), fill: "#18191c" });
  const clip = g.id("display");
  const paper = g.id("paper");
  const hue = g.f(0, 360);
  const hue2 = hue + g.pick([-1, 1]) * g.f(40, 100);
  const tl = lid(0.04, 0.96);
  const br = lid(0.96, 0.08);
  out += el(
    "defs",
    {},
    el("clipPath", { id: clip }, el("path", { d: lidQuad(0.04, 0.08, 0.96, 0.96) })),
    el(
      "linearGradient",
      { id: paper, gradientUnits: "userSpaceOnUse", x1: tl[0], y1: tl[1], x2: br[0], y2: br[1] },
      el("stop", { offset: 0, "stop-color": hsl(hue, 55, 65) }),
      el("stop", { offset: 1, "stop-color": hsl(hue2, 50, 36) }),
    ),
  );
  let display = el("path", { d: lidQuad(0.04, 0.08, 0.96, 0.96), fill: `url(#${paper})` });
  // Rolling hills of color in the wallpaper
  for (let b = 0; b < 2; b++) {
    const v = g.f(0.3, 0.55) - b * 0.18;
    const a = lid(0, v);
    const m = lid(g.f(0.3, 0.7), v + g.f(0.15, 0.3));
    const e = lid(1.05, v - g.f(-0.1, 0.15));
    const z1 = lid(1.05, 0);
    const z2 = lid(0, 0);
    display += el("path", {
      d: s`M ${a[0]} ${a[1]} Q ${m[0]} ${m[1]} ${e[0]} ${e[1]} L ${z1[0]} ${z1[1]} L ${z2[0]} ${z2[1]} Z`,
      fill: hsl(g.pick([hue, hue2]) + g.f(-20, 20), 50, b ? 32 : 50),
      opacity: "0.7",
    });
  }
  out += el("g", { "clip-path": `url(#${clip})` }, display);
  // The deck: its front and side edges, then the top
  out += el("path", {
    d: quad(P(-0.5, T, D / 2), P(0.5, T, D / 2), P(0.5, 0, D / 2), P(-0.5, 0, D / 2)),
    fill: shade(body, 0.22),
  });
  out += el("path", {
    d: quad(P(0.5, T, D / 2), P(0.5, T, -D / 2), P(0.5, 0, -D / 2), P(0.5, 0, D / 2)),
    fill: shade(body, 0.32),
  });
  out += el("path", { d: deckQuad(0, 0, 1, 1), fill: body });
  // Keys: four even rows, then a row with a long space bar
  let keys = "";
  const pitchU = 0.84 / 12;
  const pitchV = 0.085;
  const gap = 0.18;
  for (let r = 0; r < 5; r++) {
    const widths = r < 4 ? Array(12).fill(1) : [1, 1, 1, 6, 1, 1, 1];
    let u = 0.08;
    const v0 = 0.08 + r * pitchV;
    for (const span of widths) {
      keys +=
        deckQuad(
          u + pitchU * gap * 0.5,
          v0 + pitchV * gap * 0.5,
          u + pitchU * (span - gap * 0.5),
          v0 + pitchV * (1 - gap * 0.5),
        ) + " ";
      u += pitchU * span;
    }
  }
  out += el("path", { d: keys.trim(), fill: keyColor });
  out += el("path", { d: deckQuad(0.35, 0.58, 0.65, 0.92), fill: shade(body, 0.08) });
  // A glint along the front edge
  out += el("path", {
    d: quad(deck(0.02, 0.985), deck(0.98, 0.985), deck(0.98, 1), deck(0.02, 1)),
    fill: "#fff",
    opacity: "0.35",
  });
  out += "</g>";
  note.alt("An open laptop with an abstract wallpaper on its screen");
  note.focus(cx + dir * (screenCenter[0] - cx), screenCenter[1]);
  return out;
});
