import { defineKind, el, facing, mix, type Point, qpt, s } from "../../draw/core";
import { andList } from "../../draw/words";
import { flipFrame, flipX, savanna, tube } from "./shared";

/**
 * An elephant on the savanna, side on, with its trunk hanging or raised.
 *
 * @category Animals
 */
export const elephant = /* @__PURE__ */ defineKind("elephant", "Elephant", (g, w, h, note) => {
  const skin = g.pick(["#8e8f94", "#9a948e", "#7f838b", "#a29a95"]);
  const far = mix(skin, "#000000", 0.15);
  const dir = g.pick([-1, 1]);
  const s0 = Math.min(h * 0.64, w * 0.5) * g.f(0.88, 1);
  const hz = h * g.f(0.5, 0.6);
  const gy = h * g.f(0.86, 0.9);
  const cx = w / 2 - dir * s0 * 0.15 + w * g.f(-0.04, 0.04);
  const brx = s0 * 0.55;
  const bry = s0 * 0.36;
  const cy = gy - s0 * 0.36 - bry * 0.55;
  const lw = s0 * 0.18;
  const hrx = s0 * 0.26;
  const hry = s0 * 0.28;
  const hx = cx + brx * 0.85;
  const hy = cy - bry * 0.38;
  const african = g.chance(0.6);
  const raised = g.chance(0.4);
  const tusks = g.chance(african ? 0.75 : 0.4);
  const dusk = g.chance(0.35);
  let out = savanna(g.fork("scene"), w, h, hz, dusk);
  // Shadow
  out += el("ellipse", {
    cx: cx + dir * s0 * 0.1,
    cy: gy,
    rx: s0 * 0.75,
    ry: s0 * 0.06,
    fill: "#000",
    opacity: "0.15",
  });
  out += facing(cx, dir);
  const legs = [cx - brx * 0.55, cx + brx * 0.5];
  // Far legs, a step behind
  for (const x of legs)
    out += el("rect", {
      x: x + lw * 0.3 - lw / 2,
      y: cy,
      width: lw * 0.92,
      height: gy - s0 * 0.02 - cy,
      rx: lw * 0.3,
      fill: far,
    });
  // Tail with a tuft
  const tail: Point = [cx - brx * 1.04, cy + bry * 0.65];
  out += el("path", {
    d: s`M ${cx - brx * 0.96} ${cy - bry * 0.15} Q ${cx - brx * 1.08} ${cy + bry * 0.2} ${tail[0]} ${tail[1]}`,
    stroke: skin,
    "stroke-width": s0 * 0.025,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("ellipse", { cx: tail[0], cy: tail[1] + s0 * 0.03, rx: s0 * 0.018, ry: s0 * 0.04, fill: "#3a3532" });
  // Body
  out += el("ellipse", { cx, cy, rx: brx, ry: bry, fill: skin });
  // Near legs with toenails
  for (const x of legs) {
    out += el("rect", { x: x - lw / 2, y: cy, width: lw, height: gy - cy, rx: lw * 0.3, fill: skin });
    for (const k of [-1, 1])
      out += el("ellipse", {
        cx: x + k * lw * 0.22,
        cy: gy - lw * 0.08,
        rx: lw * 0.12,
        ry: lw * 0.07,
        fill: "#e8e2d6",
      });
  }
  // Trunk, hanging toward the grass or raised
  const t0: Point = [hx + hrx * 0.5, hy + hry * 0.25];
  const t1: Point = raised ? [hx + hrx * 1.7, hy + hry * 0.9] : [hx + hrx * 1.05, hy + hry * 1.4];
  const t2: Point = raised
    ? [hx + hrx * g.f(1.4, 1.6), hy - hry * g.f(0.5, 0.9)]
    : [hx + hrx * g.f(0.8, 1.1), gy - s0 * g.f(0.06, 0.16)];
  out += el("path", { d: tube(t0, t1, t2, s0 * 0.14, s0 * 0.06), fill: skin });
  // Wrinkles across the trunk
  let wrinkles = "";
  for (const t of [0.35, 0.5, 0.65]) {
    const [x, y] = qpt(t0, t1, t2, t);
    const [ax, ay] = qpt(t0, t1, t2, t + 0.02);
    const len = Math.hypot(ax - x, ay - y) || 1;
    const half = s0 * (0.14 - 0.08 * t) * 0.3;
    wrinkles += s`M ${x - ((ay - y) / len) * half} ${y + ((ax - x) / len) * half} L ${x + ((ay - y) / len) * half} ${y - ((ax - x) / len) * half} `;
  }
  out += el("path", {
    d: wrinkles,
    stroke: far,
    "stroke-width": s0 * 0.012,
    "stroke-linecap": "round",
    opacity: "0.6",
  });
  // Head
  out += el("ellipse", { cx: hx, cy: hy, rx: hrx, ry: hry, fill: skin });
  // Tusk
  if (tusks)
    out += el("path", {
      d: tube(
        [hx + hrx * 0.5, hy + hry * 0.55],
        [hx + hrx * 0.95, hy + hry * 0.95],
        [hx + hrx * 1.15, hy + hry * 0.55],
        s0 * 0.045,
        s0 * 0.015,
      ),
      fill: "#f5efe0",
    });
  // Ear: large for an African elephant, smaller for an Asian one
  const ex = hx - hrx * (african ? 0.45 : 0.3);
  const ey = hy + hry * (african ? 0.1 : 0.05);
  out += el("ellipse", {
    cx: ex,
    cy: ey,
    rx: hrx * (african ? 0.72 : 0.5),
    ry: hry * (african ? 1 : 0.72),
    fill: mix(skin, "#000000", 0.08),
    transform: s`rotate(10 ${ex} ${ey})`,
  });
  // Eye
  out += el("circle", { cx: hx + hrx * 0.4, cy: hy - hry * 0.12, r: s0 * 0.022, fill: "#2a2522" });
  out += "</g>";
  const features = andList([tusks && "tusks", raised && "its trunk raised"]);
  note.alt(
    `An elephant${features ? ` with ${features}` : ""} on the savanna${dusk ? " at dusk" : ""}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, hx + hrx * 0.4), hy - hry * 0.12);
  // Head, ear and the top of the trunk.
  flipFrame(note, cx, dir, hx - hrx * 1.25, hy - hry * 1.15, hrx * 2.6, hry * 2.4);
  return out;
});
