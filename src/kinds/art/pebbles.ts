import { defineKind, el, fill, s } from "../../draw/core";
import { blob as softBlob } from "../../draw/shapes";
import { capitalize, numberWord } from "../../draw/words";

/** Smooth rounded stones laid out on a plain ground, after the biomorphic sculptors. */
export const pebbles = /* @__PURE__ */ defineKind("pebbles", "Pebbles", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scheme = g.pick([
    { ground: "#ece6da", stones: ["#3f4447", "#8a8d8f", "#b9b2a6", "#c98a62", "#d9d2c3"] },
    { ground: "#e3ddd0", stones: ["#2e3a3f", "#6f7d6b", "#a3a58b", "#d8cfc0", "#b5714f"] },
    { ground: "#2f3437", stones: ["#d9d2c3", "#a89f91", "#c47a53", "#7b8a7e", "#ece6da"] },
    { ground: "#efe4d2", stones: ["#d36b3f", "#e9b35f", "#3b5b6d", "#a9b7a0", "#1f2326"] },
    { ground: "#d8e0dc", stones: ["#3a4a4f", "#f1ece2", "#c58b6b", "#8fa39a", "#d7b56d"] },
  ]);
  let out = fill(w, h, scheme.ground);
  // Place stones largest first, keeping a gap between their rough bounding circles.
  const placed: { x: number; y: number; r: number }[] = [];
  const target = Math.min(18, Math.round(((w * h) / (unit * unit)) * g.f(5, 8)));
  const gap = unit * g.f(0.02, 0.035);
  for (let tries = 0; tries < 600 && placed.length < target; tries++) {
    const r = unit * g.f(0.1, 0.24) * (1 - (0.6 * tries) / 600);
    const x = g.f(r + gap, w - r - gap);
    const y = g.f(r + gap, h - r - gap);
    if (placed.every(p => Math.hypot(p.x - x, p.y - y) > p.r + r + gap)) placed.push({ x, y, r });
  }
  const drop = unit * 0.018;
  let holed = g.chance(0.4);
  let biggest = placed[0];
  for (const { x, y, r } of placed) {
    if (r > biggest.r) biggest = { x, y, r };
    // An oval a little smaller than the bounding circle, with gentle lobes.
    const rx = r * 0.92;
    const ry = rx * g.f(0.6, 0.9);
    const d = softBlob(g, x, y, rx, ry, 2, g.f(0.04, 0.1), 0.05);
    const angle = g.f(-50, 50);
    const turn = s`rotate(${angle} ${x} ${y})`;
    // A soft shadow below (a plain oval is close enough), then the stone.
    out += el("ellipse", {
      cx: x + drop * 0.5,
      cy: y + drop,
      rx,
      ry,
      fill: "#000",
      opacity: "0.16",
      transform: s`rotate(${angle} ${x + drop * 0.5} ${y + drop})`,
    });
    out += el("path", { d, fill: g.pick(scheme.stones), transform: turn });
    // One large stone may be pierced, after Hepworth.
    if (holed && r > unit * 0.13) {
      holed = false;
      out += el("ellipse", {
        cx: x + r * g.f(-0.15, 0.15),
        cy: y,
        rx: r * 0.26,
        ry: ry * 0.32,
        fill: scheme.ground,
        transform: turn,
      });
    }
  }
  if (biggest) note.focus(biggest.x, biggest.y);
  note.alt(
    `${placed.length > 12 ? "Many" : capitalize(numberWord(placed.length))} smooth rounded stones laid out on a plain ground`,
  );
  return out;
});
