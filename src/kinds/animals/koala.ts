import { defineKind, el, fill, hsl, lin, mix, type Point, qpt, s } from "../../draw/core";
import { fluff, leafShape, limb, tube } from "./shared";

/** A koala hugging the trunk of a gum tree, sometimes with a joey on its back. */
export const koala = /* @__PURE__ */ defineKind("koala", "Koala", (g, w, h, note) => {
  const fur = g.pick(["#9a9ca3", "#8c8f96", "#a8a7a8", "#958f8a"]);
  const light = mix(fur, "#ffffff", 0.65);
  const shade = mix(fur, "#000000", 0.14);
  const size = Math.min(w, h);
  const cx = w * g.f(0.4, 0.6);
  const bw = size * g.f(0.15, 0.17);
  const bh = bw * 1.25;
  const tw = bw * g.f(1.6, 1.8);
  const by = h * g.f(0.58, 0.64);
  const rx = bw * 0.8;
  const ry = rx * 0.82;
  const hy = by - bh * 0.9;
  const fx = cx + rx * g.f(-0.12, 0.12);
  const joey = g.chance(0.3) ? g.pick([-1, 1]) : 0;
  const bark = hsl(g.f(25, 40), g.f(12, 22), g.f(62, 72));
  const leaf = hsl(g.f(120, 150), g.f(15, 25), g.f(42, 52));
  const sky = g.id("sky");
  const skyHue = g.f(190, 215);
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 50, 74), hsl(skyHue - 15, 50, 92)])) + fill(w, h, `url(#${sky})`);
  // Far treetops along the bottom
  const scene = g.fork("scene");
  for (let k = scene.i(3, 5); k > 0; k--) {
    const r = size * scene.f(0.15, 0.3);
    out += el("ellipse", { cx: w * scene.f(0, 1), cy: h + r * 0.3, rx: r * 1.4, ry: r, fill: leaf, opacity: "0.45" });
  }
  // Branches, behind the trunk: one high on one side, sometimes one low on the other
  const branchSide = g.pick([-1, 1]);
  const branches: [number, number][] = [[branchSide, by - bh * g.f(1.6, 2.2)]];
  if (g.chance(0.6)) branches.push([-branchSide, by + bh * g.f(0.6, 1.1)]);
  for (const [sd, y0] of branches) {
    const p0: Point = [cx + sd * tw * 0.3, y0];
    const p2: Point = [cx + sd * Math.max(w * 0.45, tw * 2.5), y0 - size * g.f(0.06, 0.16)];
    const p1: Point = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2 + size * 0.03];
    out += el("path", { d: tube(p0, p1, p2, tw * 0.32, tw * 0.1), fill: bark });
    // Narrow gum leaves hanging from the outer half of the branch
    let d = "";
    for (let k = g.i(5, 8); k > 0; k--) {
      const [ax, ay] = qpt(p0, p1, p2, g.f(0.45, 1));
      d += leafShape(ax, ay, 90 + g.f(-55, 55), size * g.f(0.07, 0.1), 0.28);
    }
    out += el("path", { d, fill: leaf });
  }
  // Trunk with smooth, streaky bark
  out += el("rect", { x: cx - tw / 2, y: -2, width: tw, height: h + 4, fill: bark });
  let streaks = "";
  for (let k = g.i(3, 5); k > 0; k--) {
    const x = cx + tw * g.f(-0.4, 0.4);
    const y = h * g.f(0, 0.8);
    streaks += s`M ${x} ${y} v ${h * g.f(0.1, 0.3)} `;
  }
  out += el("path", {
    d: streaks,
    stroke: "#ffffff",
    "stroke-opacity": "0.25",
    "stroke-width": tw * 0.06,
    "stroke-linecap": "round",
  });
  out += el("rect", { x: cx - tw / 2, y: -2, width: tw * 0.15, height: h + 4, fill: "#000", opacity: "0.08" });
  if (joey) {
    // A joey on its back, peeking over its mother's head
    const jx = cx + joey * rx * 0.42;
    const jy = hy - ry * 1.2;
    const jr = rx * 0.5;
    const m = g.fork("joey");
    for (const sd of [-1, 1]) {
      out += el("path", { d: fluff(jx + sd * jr * 0.95, jy - jr * 0.5, jr * 0.4, jr * 0.4, 7, m.f(0, 1)), fill: fur });
      out += el("circle", { cx: jx + sd * jr * 0.88, cy: jy - jr * 0.45, r: jr * 0.25, fill: light });
    }
    out += el("ellipse", { cx: jx, cy: jy, rx: jr, ry: jr * 0.85, fill: fur });
    out += el("ellipse", { cx: jx, cy: jy + jr * 0.15, rx: jr * 0.22, ry: jr * 0.3, fill: "#2c2a2e" });
    for (const sd of [-1, 1])
      out += el("circle", { cx: jx + sd * jr * 0.42, cy: jy - jr * 0.1, r: jr * 0.09, fill: "#1a1818" });
  }
  // Hind legs gripping the trunk, then the body and belly
  for (const sd of [-1, 1]) {
    out += limb(cx + sd * bw * 0.45, by + bh * 0.45, cx + sd * tw * 0.48, by + bh * 0.92, bw * 0.42, shade);
    out += el("ellipse", { cx: cx + sd * tw * 0.5, cy: by + bh * 0.98, rx: bw * 0.17, ry: bw * 0.12, fill: "#4e4a4c" });
  }
  out += el("ellipse", { cx, cy: by, rx: bw, ry: bh, fill: fur });
  out += el("ellipse", { cx, cy: by + bh * 0.2, rx: bw * 0.55, ry: bh * 0.6, fill: light });
  // Arms reaching out to grip the edges of the trunk
  for (const sd of [-1, 1]) {
    out += limb(cx + sd * bw * 0.5, by - bh * 0.35, cx + sd * tw * 0.5, by - bh * 0.62, bw * 0.38, shade);
    out += el("ellipse", {
      cx: cx + sd * tw * 0.52,
      cy: by - bh * 0.62,
      rx: bw * 0.15,
      ry: bw * 0.18,
      fill: "#4e4a4c",
    });
  }
  // Fluffy ears with pale insides
  const m = g.fork("ears");
  for (const sd of [-1, 1]) {
    out += el("path", { d: fluff(cx + sd * rx * 0.92, hy - ry * 0.5, rx * 0.4, rx * 0.38, 9, m.f(0, 1)), fill: fur });
    out += el("circle", { cx: cx + sd * rx * 0.88, cy: hy - ry * 0.45, r: rx * 0.24, fill: light });
  }
  // Head, eyes and the big nose
  out += el("ellipse", { cx, cy: hy, rx, ry, fill: fur });
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: fx + sd * rx * 0.4, cy: hy - ry * 0.08, r: rx * 0.08, fill: "#1a1818" });
    out += el("circle", { cx: fx + sd * rx * 0.4 + rx * 0.025, cy: hy - ry * 0.11, r: rx * 0.025, fill: "#ffffff" });
  }
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.2, rx: rx * 0.22, ry: ry * 0.34, fill: "#2c2a2e" });
  out += el("ellipse", {
    cx: fx - rx * 0.06,
    cy: hy + ry * 0.05,
    rx: rx * 0.06,
    ry: ry * 0.1,
    fill: "#ffffff",
    opacity: "0.25",
  });
  out += el("path", {
    d: s`M ${fx - rx * 0.12} ${hy + ry * 0.62} Q ${fx} ${hy + ry * 0.7} ${fx + rx * 0.12} ${hy + ry * 0.62}`,
    stroke: "#2c2a2e",
    "stroke-width": rx * 0.035,
    fill: "none",
    "stroke-linecap": "round",
  });
  note.alt(`A koala hugging the trunk of a gum tree${joey ? " with a joey on its back" : ""}`);
  note.focus(fx, hy);
  // Head and its big ears.
  note.frame(cx - rx * 1.45, hy - ry * 1.2, rx * 2.9, ry * 2.4);
  return out;
});
