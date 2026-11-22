import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";

const FROGS = [
  { skin: "#6fbf4a", belly: "#d9f0b0" },
  { skin: "#3f9b5a", belly: "#cde8b5" },
  { skin: "#2f7fd6", belly: "#9fd0ff", spots: "#111" },
  { skin: "#f08a24", belly: "#ffd8a8", spots: "#111" },
  { skin: "#9acd32", belly: "#f1f8d0" },
] as const;

/** An elliptical lily pad with a wedge cut from the rim to the center at angle `notch`. */
function lilyPad(x: number, y: number, rx: number, ry: number, notch: number, paint: string): string {
  const a1 = notch + 0.22;
  const a2 = notch - 0.22;
  return el("path", {
    d: s`M ${x} ${y}
         L ${x + Math.cos(a1) * rx} ${y + Math.sin(a1) * ry}
         A ${rx} ${ry} 0 1 1 ${x + Math.cos(a2) * rx} ${y + Math.sin(a2) * ry}
         Z`,
    fill: paint,
  });
}

/**
 * A frog on a lily pad, with bulging eyes and a wide smile.
 *
 * @category Animals
 */
export const frog = /* @__PURE__ */ defineKind("frog", "Frog", (g, w, h, note) => {
  const colors = g.pick(FROGS);
  const size = Math.min(w, h);
  const water = g.id("water");
  const wh = g.f(170, 200);
  const cx = w * g.f(0.42, 0.58);
  const py = h * g.f(0.7, 0.78);
  let out = el("defs", {}, lin(water, [hsl(wh, 45, 58), hsl(wh + 10, 50, 36)])) + fill(w, h, `url(#${water})`);
  // Background pads near the left and right edges
  for (let k = g.i(1, 2); k > 0; k--) {
    const radius = size * g.f(0.08, 0.13);
    out += lilyPad(
      w * g.pick([g.f(0.05, 0.2), g.f(0.8, 0.95)]),
      h * g.f(0.2, 0.9),
      radius,
      radius * 0.35,
      g.f(0, Math.PI * 2),
      hsl(g.f(95, 130), 40, 38),
    );
  }
  // The frog's pad is wide and seen at a low angle; its notch points toward the viewer, off to one side.
  const pr = size * g.f(0.38, 0.44);
  const pad = hsl(g.f(95, 125), 45, 42);
  out += lilyPad(cx, py, pr, pr * 0.3, Math.PI / 2 + g.pick([-1, 1]) * g.f(0.35, 0.7), pad);
  // The frog's shadow on the pad
  out += el("ellipse", { cx, cy: py + pr * 0.04, rx: pr * 0.62, ry: pr * 0.13, fill: "#000", opacity: "0.15" });
  // Flower on the pad
  const flower = g.chance(0.45);
  if (flower) {
    const fx = cx + pr * g.pick([-0.78, 0.74]);
    const fy = py - pr * 0.02;
    out += el("circle", { cx: fx, cy: fy - size * 0.035, r: size * 0.045, fill: "#f6a6c1" });
    out += el("circle", { cx: fx, cy: fy - size * 0.035, r: size * 0.015, fill: "#f2c14e" });
  }
  const bw = size * g.f(0.2, 0.24);
  const bh = bw * 0.78;
  const by = py - bh * 0.62;
  // Back legs
  for (const sd of [-1, 1])
    out += el("ellipse", {
      cx: cx + sd * bw * 0.8,
      cy: py - bh * 0.05,
      rx: bw * 0.32,
      ry: bh * 0.2,
      fill: colors.skin,
    });
  // Body and belly
  out += el("ellipse", { cx, cy: by, rx: bw, ry: bh, fill: colors.skin });
  out += el("ellipse", { cx, cy: by + bh * 0.35, rx: bw * 0.6, ry: bh * 0.5, fill: colors.belly });
  // Spots: sampled on the back and flanks, each kept wholly inside the body and clear of the eyes,
  // cheeks and smile (rejected candidates are simply skipped).
  if ("spots" in colors) {
    const placed: [number, number, number][] = [];
    for (let want = g.i(3, 5), tries = 0; placed.length < want && tries < 40; tries++) {
      const r = bw * g.f(0.045, 0.08);
      const dx = bw * g.f(-0.9, 0.9);
      const dy = bh * g.f(-0.95, 0.1);
      const inBody = (dx / (bw - r * 1.4)) ** 2 + (dy / (bh - r * 1.4)) ** 2 <= 1;
      const nearEye = [-1, 1].some(sd => Math.hypot(dx - sd * bw * 0.5, dy + bh * 0.78) < bw * 0.32 + r);
      const nearFace = dy + r > -bh * 0.24 && Math.abs(dx) - r < bw * 0.76;
      const nearSpot = placed.some(([x, y, q]) => Math.hypot(dx - x, dy - y) < r + q + bw * 0.04);
      if (inBody && !nearEye && !nearFace && !nearSpot) placed.push([dx, dy, r]);
    }
    for (const [dx, dy, r] of placed) out += el("circle", { cx: cx + dx, cy: by + dy, r, fill: colors.spots });
  }
  // Bulging eyes
  for (const sd of [-1, 1]) {
    const ex = cx + sd * bw * 0.5;
    const ey = by - bh * 0.78;
    out += el("circle", { cx: ex, cy: ey, r: bw * 0.27, fill: colors.skin });
    out += el("circle", { cx: ex, cy: ey, r: bw * 0.18, fill: "#fff" });
    out += el("circle", { cx: ex + sd * bw * 0.02, cy: ey + bw * 0.02, r: bw * 0.1, fill: "#111" });
  }
  // Smile
  out += el("path", {
    d: s`M ${cx - bw * 0.55} ${by - bh * 0.15}
         Q ${cx} ${by + bh * g.f(0.15, 0.35)} ${cx + bw * 0.55} ${by - bh * 0.15}`,
    stroke: "#1d2b14",
    "stroke-width": bw * 0.05,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Cheeks
  for (const sd of [-1, 1])
    out += el("circle", {
      cx: cx + sd * bw * 0.62,
      cy: by - bh * 0.05,
      r: bw * 0.1,
      fill: "#ff7a8a",
      opacity: "0.4",
    });
  note.alt(`A ${"spots" in colors ? "spotted " : ""}frog smiling on a lily pad${flower ? " beside a flower" : ""}`);
  note.focus(cx, by - bh * 0.6);
  // Bulging eyes down to the front feet.
  note.frame(cx - bw * 1.15, by - bh * 0.78 - bw * 0.3, bw * 2.3, bh * 1.78 + bw * 0.3);
  return out;
});
