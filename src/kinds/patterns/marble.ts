import { defineKind, el, fill, type Point, s } from "../../draw/core";
import { curve } from "./shared";

/** Soft, branching veins wandering across pale polished stone. */
export const marble = /* @__PURE__ */ defineKind("marble", "Marble", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scheme = g.pick([
    { ground: "#f3f1ec", cloud: "#e2ded6", vein: "#8c8a86" },
    { ground: "#f2eee8", cloud: "#e7ddd0", vein: "#a98c6e" },
    { ground: "#eef1f0", cloud: "#dbe2e0", vein: "#6f8682" },
    { ground: "#f4efed", cloud: "#eadcd8", vein: "#a07c78" },
    { ground: "#e9e8ea", cloud: "#d9d7dc", vein: "#5e5c68" },
    { ground: "#f5f2ea", cloud: "#ebe3cf", vein: "#b39258" },
  ]);
  const blur = g.id("soft");
  const cloudBlur = g.id("cloud");
  let out = el(
    "defs",
    {},
    el(
      "filter",
      { id: blur, x: "-20%", y: "-20%", width: "140%", height: "140%" },
      el("feGaussianBlur", { stdDeviation: unit * 0.012 }),
    ),
    el(
      "filter",
      { id: cloudBlur, x: "-50%", y: "-50%", width: "200%", height: "200%" },
      el("feGaussianBlur", { stdDeviation: unit * 0.09 }),
    ),
  );
  out += fill(w, h, scheme.ground);
  // Faint clouding in the stone, spread along the frame.
  const clouds = Math.round(w / unit) * 2 + 2;
  let cloudD = "";
  for (let k = 0; k < clouds; k++) {
    const x = ((k + g.f(0.1, 0.9)) / clouds) * w;
    const y = g.f(0.1, 0.9) * h;
    const r = unit * g.f(0.15, 0.3);
    cloudD += s`M${x - r} ${y}a${r} ${r * 0.6} 0 1 0 ${r * 2} 0a${r} ${r * 0.6} 0 1 0 ${-r * 2} 0`;
  }
  out += el("path", { d: cloudD, fill: scheme.cloud, opacity: "0.7", filter: `url(#${cloudBlur})` });
  // Veins share a general direction, each wandering from beyond one edge to beyond the other.
  const base = g.f(-0.6, 0.6) + (h > w * 1.2 ? Math.PI / 2 : 0);
  const diag = Math.hypot(w, h);
  const nx = -Math.sin(base);
  const ny = Math.cos(base);
  // How far the frame reaches across the flow: veins are spaced along it at much the same distance
  // whatever the frame's shape, so a wide or tall picture stays as calm as a 4:3 one.
  const across = Math.abs(nx) * w + Math.abs(ny) * h;
  const spread = Math.max(2, Math.round((across / unit) * 1.6) + g.i(0, 1));
  const veins: string[] = [];
  const twigs: string[] = [];
  for (let k = 0; k < spread; k++) {
    // Start points spaced across the frame, perpendicular to the flow.
    const off = ((k + g.f(0.2, 0.8)) / spread - 0.5) * across;
    const cx = w / 2 + nx * off;
    const cy = h / 2 + ny * off;
    let a = base + g.f(-0.25, 0.25);
    let x = cx - Math.cos(a) * diag * 0.6;
    let y = cy - Math.sin(a) * diag * 0.6;
    const step = unit * g.f(0.09, 0.14);
    const points: Point[] = [[x, y]];
    for (let j = 0; j < Math.ceil((diag * 1.2) / step); j++) {
      a += g.f(-0.45, 0.45);
      // Pulled back toward the shared direction so veins don't loop.
      a += (base - a) * 0.3;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      points.push([x, y]);
      // Now and then a thinner twig splits off and fades out.
      if (j > 1 && g.chance(0.12) && x > 0 && x < w && y > 0 && y < h) {
        let ta = a + g.pick([-1, 1]) * g.f(0.5, 0.9);
        let tx = x;
        let ty = y;
        const twig: Point[] = [[tx, ty]];
        for (let t = g.i(3, 5); t > 0; t--) {
          ta += g.f(-0.4, 0.4);
          tx += Math.cos(ta) * step * 0.7;
          ty += Math.sin(ta) * step * 0.7;
          twig.push([tx, ty]);
        }
        twigs.push(curve(twig));
      }
    }
    // Only the part over the frame is kept.
    const inside = ([px, py]: Point) => px > -step && px < w + step && py > -step && py < h + step;
    const from = points.findIndex(inside);
    let to = points.length;
    while (to > from + 1 && !inside(points[to - 1])) to--;
    if (from >= 0 && to - from > 1)
      veins.push(curve(points.slice(Math.max(0, from - 1), Math.min(points.length, to + 1))));
  }
  // Each set of paths is written once and drawn again with <use>: a wide soft haze, a medium line,
  // and a fine crisp thread.
  const veinId = g.id("veins");
  const twigId = g.id("twigs");
  out += el(
    "defs",
    {},
    el("path", { id: veinId, d: veins.join("") }),
    el("path", { id: twigId, d: twigs.join("") || "M0 0" }),
  );
  const line = (id: string, width: number, opacity: number, soft = false) =>
    el("use", {
      href: `#${id}`,
      fill: "none",
      stroke: scheme.vein,
      "stroke-width": width,
      "stroke-linecap": "round",
      opacity: String(opacity),
      filter: soft ? `url(#${blur})` : undefined,
    });
  out += line(veinId, unit * 0.035, 0.16, true);
  out += line(veinId, unit * 0.008, 0.28, true);
  out += line(twigId, unit * 0.008, 0.2, true);
  out += line(veinId, unit * 0.0035, 0.45);
  out += line(twigId, unit * 0.002, 0.35);
  note.focus(w / 2, h / 2);
  note.alt("Pale polished marble with soft branching veins running across it");
  return out;
});
