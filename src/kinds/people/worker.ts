import { defineKind, el, fill, hsl, type Rand, s } from "../../draw/core";
import { andList } from "../../draw/words";
import { arm, capital, describe, desk, figure, halfLength, headBox, person } from "./shared";

/** A mug on a surface at `bottom`, with a handle on one side and a wisp of steam. */
function mug(x: number, bottom: number, size: number, color: string, handle: number): string {
  const mw = size * 0.75;
  const mh = size * 0.85;
  let out = el("ellipse", {
    cx: x + (handle * mw) / 2,
    cy: bottom - mh * 0.5,
    rx: size * 0.2,
    ry: size * 0.22,
    fill: "none",
    stroke: color,
    "stroke-width": size * 0.09,
  });
  out += el("rect", { x: x - mw / 2, y: bottom - mh, width: mw, height: mh, rx: size * 0.1, fill: color });
  out += el("ellipse", { cx: x, cy: bottom - mh, rx: mw / 2, ry: size * 0.07, fill: "#000", opacity: "0.15" });
  out += el("path", {
    d: s`M ${x} ${bottom - mh - size * 0.15} q ${size * 0.12} ${-size * 0.18} 0 ${-size * 0.36} t 0 ${-size * 0.36}`,
    fill: "none",
    stroke: "#fff",
    "stroke-width": size * 0.06,
    "stroke-linecap": "round",
    opacity: "0.55",
  });
  return out;
}

/** A potted plant on a surface at `bottom`: a pot and a fan of leaves. */
function plant(g: Rand, x: number, bottom: number, size: number): string {
  const pot = hsl(g.f(0, 40), g.f(35, 55), g.f(45, 62));
  const leaf = hsl(g.f(95, 150), g.f(30, 50), g.f(32, 45));
  const potTop = bottom - size * 0.75;
  let out = "";
  const leaves = g.i(4, 6);
  for (let k = 0; k < leaves; k++) {
    const angle = -70 + (140 * k) / (leaves - 1) + g.f(-8, 8);
    const len = size * g.f(0.55, 0.8);
    out += el("ellipse", {
      cx: x,
      cy: potTop - len / 2,
      rx: size * 0.13,
      ry: len / 2,
      fill: leaf,
      transform: s`rotate(${angle} ${x} ${potTop})`,
    });
  }
  out += el("path", {
    d: s`M ${x - size * 0.42} ${potTop} H ${x + size * 0.42} L ${x + size * 0.32} ${bottom} H ${x - size * 0.32} Z`,
    fill: pot,
  });
  return out;
}

/**
 * A half-length figure working at a laptop on a desk, sometimes with a mug or a plant.
 *
 * @category People
 */
export const worker = /* @__PURE__ */ defineKind("worker", "At a laptop", (g, w, h, note) => {
  const p = person(g.fork("person"));
  const { rx, ry, cx, cy, sw, shoulderY } = halfLength(g, p, w, h);
  const hue = g.f(0, 360);
  const deskY = cy + ry * 3.05;
  let out = fill(w, h, hsl(hue, 25, 86));

  // Sometimes a framed picture on the wall behind.
  const side = g.chance(0.5) ? 1 : -1;
  if (g.chance(0.55)) {
    const fw = rx * 2.2;
    const fh = rx * 1.6;
    const fx = cx + side * (sw + rx * 1.8) - fw / 2;
    const fy = cy - ry * 0.8;
    out += el("rect", { x: fx, y: fy, width: fw, height: fh, fill: hsl(hue + 20, 20, 35) });
    out += el("rect", {
      x: fx + rx * 0.15,
      y: fy + rx * 0.15,
      width: fw - rx * 0.3,
      height: fh - rx * 0.3,
      fill: hsl(hue + 180, 35, 80),
    });
    out += el("path", {
      d: s`M ${fx + rx * 0.15} ${fy + fh - rx * 0.15} L ${fx + fw * 0.4} ${fy + fh * 0.45}
         L ${fx + fw * 0.6} ${fy + fh * 0.65} L ${fx + fw * 0.75} ${fy + fh * 0.5} L ${fx + fw - rx * 0.15} ${fy + fh - rx * 0.15} Z`,
      fill: hsl(hue + 150, 30, 55),
    });
  }

  out += figure(p, cx, cy, rx, sw, deskY + 2, g.f(-3, 3));
  // Arms reaching down to the keyboard, behind the screen.
  for (const k of [-1, 1])
    out += arm(
      p,
      rx,
      [cx + k * sw * 0.8, shoulderY + ry * 0.35],
      [cx + k * sw * 1.02, deskY - ry * 0.3],
      [cx + k * rx * 0.9, deskY],
    );
  out += desk(w, h, deskY, hsl(g.f(20, 45), g.f(20, 45), g.f(50, 72)));

  // The laptop, seen from behind its open screen.
  const lw = rx * 3.1;
  const lh = rx * 1.85;
  const lidBottom = deskY + Math.min((h - deskY) * 0.4, ry * 0.6);
  const lx = cx + rx * g.f(-0.3, 0.3);
  const lid = g.pick(["#c9ccd2", "#3a3d44", "#e4e1dc", hsl(g.f(0, 360), 25, 70)]);
  out += el("ellipse", { cx: lx, cy: lidBottom, rx: lw * 0.55, ry: rx * 0.12, fill: "#000", opacity: "0.12" });
  out += el("rect", { x: lx - lw / 2, y: lidBottom - lh, width: lw, height: lh, rx: rx * 0.12, fill: lid });
  out += el("circle", { cx: lx, cy: lidBottom - lh / 2, r: rx * 0.17, fill: "#fff", opacity: "0.35" });

  // Things on the desk either side.
  const things: string[] = [];
  const thingBottom = lidBottom + rx * 0.05;
  if (g.chance(0.7)) {
    out += mug(lx + side * (lw / 2 + rx * 1.0), thingBottom, rx, hsl(g.f(0, 360), g.f(30, 60), g.f(45, 70)), side);
    things.push("a mug");
  }
  if (g.chance(0.55)) {
    out += plant(g.fork("plant"), lx - side * (lw / 2 + rx * 1.1), thingBottom, rx * 1.3);
    things.push("a plant");
  }

  note.alt(`${capital(describe(p))} working at a laptop${things.length ? ` beside ${andList(things)}` : ""}`);
  note.focus(cx, cy + ry);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});
