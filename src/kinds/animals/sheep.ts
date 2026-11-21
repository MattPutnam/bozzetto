import { defineKind, el, facing, mix, s } from "../../draw/core";
import { fence, field, flipFrame, flipX, fluff, limb, tube } from "./shared";

const SHEEP = [
  { wool: "#f4f0e6", face: "#2b2624", legs: "#2b2624" },
  { wool: "#f1ebdd", face: "#efe2d0", legs: "#d8c8b4" },
  { wool: "#ece4d4", face: "#3a302a", legs: "#3a302a" },
  { wool: "#6b5a50", face: "#2a2320", legs: "#2a2320" },
  { wool: "#e6dccb", face: "#8a6a52", legs: "#6e5442" },
] as const;

/** A woolly sheep in a field, grazing or looking up. */
export const sheep = /* @__PURE__ */ defineKind("sheep", "Sheep", (g, w, h, note) => {
  const coat = g.pick(SHEEP);
  const dir = g.pick([-1, 1]);
  const size = Math.min(w, h);
  const bw = size * g.f(0.22, 0.26);
  const bh = bw * 0.62;
  const hz = h * g.f(0.5, 0.6);
  const gy = h * g.f(0.82, 0.88);
  const cx = w / 2 - dir * bw * 0.2 + w * g.f(-0.04, 0.04);
  const cy = gy - bw * 0.42 - bh * 0.8;
  const grazing = g.chance(0.4);
  const hr = bw * 0.33;
  const hx = cx + bw * (grazing ? 1.12 : 1.1);
  const hy = grazing ? gy - hr * 0.95 : cy - bh * g.f(0.75, 1);
  const angle = grazing ? g.f(65, 78) : g.f(15, 35);
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(190, 215), [scene.f(85, 120), 42, scene.f(50, 58)]);
  const fenced = scene.chance(0.5);
  if (fenced) out += fence(w, hz + (gy - hz) * 0.2, size * 0.12, "#a07a54");
  // Flowers in the grass
  for (let k = scene.i(4, 9); k > 0; k--)
    out += el("circle", {
      cx: w * scene.f(0, 1),
      cy: hz + (h - hz) * scene.f(0.3, 1),
      r: size * 0.008,
      fill: scene.pick(["#ffffff", "#f6d25c", "#f4a3c0"]),
    });
  // Shadow
  out += el("ellipse", { cx: cx + dir * bw * 0.1, cy: gy, rx: bw * 1.2, ry: bw * 0.1, fill: "#000", opacity: "0.15" });
  out += facing(cx, dir);
  const legTop = cy + bh * 0.4;
  // Far legs, then near legs
  for (const x of [cx - bw * 0.5, cx + bw * 0.5])
    out += limb(x, legTop, x, gy - bw * 0.03, bw * 0.1, mix(coat.legs, "#000000", 0.2));
  for (const x of [cx - bw * 0.62, cx + bw * 0.38]) out += limb(x, legTop, x, gy, bw * 0.11, coat.legs);
  // Wool
  out += el("path", { d: fluff(cx, cy, bw, bh, 13, g.f(0, 1)), fill: coat.wool });
  out += el("path", {
    d: fluff(cx - bw * 0.1, cy + bh * 0.05, bw * 0.7, bh * 0.55, 9, g.f(0, 1)),
    fill: "#000",
    opacity: "0.05",
  });
  // Woolly neck, reaching down when it grazes
  out += el("path", {
    d: grazing
      ? tube([cx + bw * 0.6, cy - bh * 0.1], [hx - hr * 0.2, cy], [hx - hr * 0.3, hy - hr * 0.2], bh * 0.8, bh * 0.5)
      : tube([cx + bw * 0.6, cy], [hx - hr * 0.6, cy - bh * 0.4], [hx - hr * 0.4, hy], bh * 0.9, bh * 0.6),
    fill: coat.wool,
  });
  // Head, snout forward, rotated down
  out += s`<g transform="rotate(${angle} ${hx} ${hy})">`;
  out += el("ellipse", { cx: hx, cy: hy, rx: hr, ry: hr * 0.66, fill: coat.face });
  // Ear, sticking out back and down from behind the eye
  out += el("ellipse", {
    cx: hx - hr * 0.62,
    cy: hy + hr * 0.05,
    rx: hr * 0.42,
    ry: hr * 0.16,
    fill: mix(coat.face, "#000000", 0.1),
    transform: s`rotate(-30 ${hx - hr * 0.3} ${hy - hr * 0.1})`,
  });
  out += el("path", { d: fluff(hx - hr * 0.5, hy - hr * 0.35, hr * 0.42, hr * 0.36, 7, 0.3), fill: coat.wool });
  out += el("circle", {
    cx: hx + hr * 0.12,
    cy: hy - hr * 0.2,
    r: hr * 0.1,
    fill: coat.face === "#efe2d0" ? "#2a2320" : "#f4efe6",
  });
  out += el("circle", { cx: hx + hr * 0.14, cy: hy - hr * 0.2, r: hr * 0.055, fill: "#111111" });
  out += el("ellipse", {
    cx: hx + hr * 0.86,
    cy: hy + hr * 0.05,
    rx: hr * 0.05,
    ry: hr * 0.08,
    fill: "#000",
    opacity: "0.35",
  });
  out += "</g></g>";
  note.alt(
    `A woolly sheep ${grazing ? "grazing" : "standing"} in a field${fenced ? " by a fence" : ""}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, hx), hy);
  // The head, which is round enough to frame the same whatever its tilt.
  flipFrame(note, cx, dir, hx - hr * 1.35, hy - hr * 1.35, hr * 2.7, hr * 2.7);
  return out;
});
