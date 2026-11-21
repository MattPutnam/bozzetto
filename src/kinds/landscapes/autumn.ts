import { defineKind, el, fill, hsl, lin, pts, s } from "../../draw/core";
import { blob } from "../../draw/shapes";
import { curve } from "./shared";

const AUTUMN: readonly (readonly [number, number, number])[] = [
  [24, 85, 52],
  [8, 70, 45],
  [42, 90, 55],
  [15, 80, 50],
  [34, 85, 48],
  [0, 60, 40],
];

/** A grove of trees in autumn colors, with leaves falling and gathered under them. */
export const autumn = /* @__PURE__ */ defineKind("autumn", "Autumn trees", (g, w, h, note) => {
  const time = g.pick(["day", "golden", "overcast"] as const);
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const hue = g.f(195, 220);
  const stops =
    time === "day"
      ? [hsl(hue, 55, 64), hsl(hue - 5, 55, 90)]
      : time === "golden"
        ? [hsl(hue + 10, 35, 66), hsl(g.f(30, 45), 80, 84)]
        : [hsl(hue, 12, 72), hsl(hue, 14, 88)];
  const dim = time === "overcast" ? -5 : 0;
  let out = el("defs", {}, lin(skyId, stops));
  out += fill(w, h, `url(#${skyId})`);
  if (time !== "overcast")
    out += el("circle", {
      cx: w * g.f(0.15, 0.85),
      cy: h * g.f(0.15, 0.3),
      r: unit * g.f(0.05, 0.07),
      fill: time === "day" ? hsl(52, 100, 94) : hsl(40, 100, 86),
    });
  const groundY = h * g.f(0.6, 0.68);
  // A distant hill.
  const hill = curve(w, groundY - h * g.f(0, 0.06), groundY - h * g.f(0, 0.06), -h * g.f(0.02, 0.08));
  out += el("path", { d: hill.d() + s`V${h}H0Z`, fill: hsl(g.f(60, 100), 18, 66 + dim) });
  const leaf = (k: number, light = 0, sat = 0) => hsl(AUTUMN[k][0], AUTUMN[k][1] + sat, AUTUMN[k][2] + light + dim);
  // A back row of small, hazy trees on the horizon.
  let backs = "";
  for (let x = g.f(0, 0.05) * w; x < w; x += Math.max(unit * g.f(0.07, 0.11), w / 30)) {
    const r = unit * g.f(0.035, 0.055);
    backs += s`M${x - r} ${groundY + 1}a${r} ${r * 1.1} 0 1 1 ${2 * r} 0Z`;
  }
  out += el("path", { d: backs, fill: hsl(AUTUMN[g.i(0, AUTUMN.length - 1)][0] + 10, 26, 60 + dim) });
  // The meadow.
  const meadow = hsl(g.f(38, 70), 45, 54 + dim);
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: meadow });
  // A footpath winding away, sometimes.
  const path = g.chance(0.4);
  const px = w * g.f(0.3, 0.7);
  const bx = w * g.f(0.35, 0.65);
  const pw = unit * g.f(0.1, 0.14);
  /** The path's left and right edges at height y, from its two curves. */
  const pathAt = (y: number): [number, number] => {
    const t = (y - groundY) / (h - groundY);
    const at = (a: number, c: number, b: number) => (1 - t) ** 2 * a + 2 * t * (1 - t) * c + t ** 2 * b;
    return [at(px, bx + pw, bx - pw * 0.4), at(px, bx + pw * 1.6, bx + pw * 1.4)];
  };
  if (path) {
    out += el("path", {
      d: s`M${px - unit * 0.008} ${groundY} Q ${bx + pw} ${(groundY + h) / 2} ${bx - pw * 0.4} ${h}
           H ${bx + pw * 1.4} Q ${bx + pw * 1.6} ${(groundY + h) / 2} ${px + unit * 0.008} ${groundY}Z`,
      fill: hsl(32, 35, 70 + dim),
    });
  }
  // The front row, spaced across the picture.
  const count = Math.min(7, Math.max(2, Math.round(w / (unit * g.f(0.3, 0.4)))));
  const trees = Array.from({ length: count }, (_, k) => {
    const r = unit * g.f(0.12, 0.17);
    return {
      x: (w * (k + g.f(0.3, 0.7))) / count,
      y: groundY + (h - groundY) * g.f(0.3, 0.6),
      r,
      trunk: r * g.f(1, 1.35),
      color: g.i(0, AUTUMN.length - 1),
    };
  }).sort((a, b) => a.y - b.y);
  // No tree stands on the path: one whose trunk would is moved to the nearer verge, or the
  // other one if the nearer would push it out of the picture.
  if (path)
    for (const t of trees) {
      const [left, right] = pathAt(t.y);
      const clear = t.r * 0.3;
      if (t.x < left - clear || t.x > right + clear) continue;
      const toLeft = left - clear;
      const toRight = right + clear;
      const leftFits = toLeft > t.r * 0.5;
      const rightFits = toRight < w - t.r * 0.5;
      t.x = leftFits && (!rightFits || t.x - toLeft < toRight - t.x) ? toLeft : toRight;
    }
  // Fallen leaves gathered in a ring under each tree.
  for (const t of trees)
    out += el("ellipse", { cx: t.x, cy: t.y, rx: t.r * 1.05, ry: t.r * 0.2, fill: leaf(t.color, 4), opacity: "0.7" });
  const bark = hsl(g.f(15, 30), 30, 24 + dim);
  for (const t of trees) {
    const cy = t.y - t.trunk - t.r * 0.55;
    const tw = t.r * 0.11;
    out += el("polygon", {
      points: pts([
        [t.x - tw, t.y],
        [t.x - tw * 0.45, cy],
        [t.x + tw * 0.45, cy],
        [t.x + tw, t.y],
      ]),
      fill: bark,
    });
    out += el("path", { d: blob(g, t.x, cy, t.r, t.r * 0.88, 4, 0.08, 0.06), fill: leaf(t.color) });
    out += el("path", {
      d: blob(g, t.x - t.r * 0.22, cy - t.r * 0.25, t.r * 0.55, t.r * 0.45, 3, 0.1, 0.06),
      fill: leaf(t.color, 9, 5),
    });
  }
  // Leaves drifting down from the crowns and lying on the grass.
  for (const t of trees) {
    let d = "";
    for (let k = g.i(1, 2); k > 0; k--) {
      // Each leaf is a tilted ellipse, drawn as two arcs.
      const x = t.x + t.r * g.f(-1.3, 1.3);
      const y = t.y - t.trunk * g.f(0.15, 0.85);
      const turn = g.f(0, Math.PI);
      const dx = Math.cos(turn) * unit * 0.013;
      const dy = Math.sin(turn) * unit * 0.013;
      const deg = (turn * 180) / Math.PI;
      const r = unit * 0.013;
      d += s`M${x - dx} ${y - dy}A${r} ${r * 0.45} ${deg} 0 1 ${x + dx} ${y + dy}A${r} ${r * 0.45} ${deg} 0 1 ${x - dx} ${y - dy}`;
    }
    out += el("path", { d, fill: leaf(t.color, -3) });
  }
  let ground = "";
  for (let k = g.i(8, 13); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = groundY + (h - groundY) * g.f(0.1, 0.98);
    const r = unit * 0.01;
    ground += s`M${x - r} ${y}a${r} ${r * 0.5} 0 1 0 ${2 * r} 0a${r} ${r * 0.5} 0 1 0 ${-2 * r} 0`;
  }
  out += el("path", { d: ground, fill: leaf(g.i(0, AUTUMN.length - 1)), opacity: "0.8" });
  const when = time === "day" ? "on a clear day" : time === "golden" ? "in low evening light" : "on an overcast day";
  note.alt(`A row of trees in autumn colors, leaves falling${path ? " beside a winding path" : ""}, ${when}`);
  const middle = trees.reduce((a, b) => (Math.abs(b.x - w / 2) < Math.abs(a.x - w / 2) ? b : a));
  note.focus(middle.x, middle.y - middle.trunk - middle.r * 0.4);
  return out;
});
