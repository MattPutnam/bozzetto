import { defineKind, el, facing, fill, hsl, lin, pts, s } from "../../draw/core";

/** A penguin on the ice, sometimes with an emperor's golden neck. */
export const penguin = /* @__PURE__ */ defineKind("penguin", "Penguin", (g, w, h, note) => {
  const size = Math.min(w, h);
  const sky = g.id("sky");
  const skyHue = g.f(190, 215);
  const gy = h * g.f(0.72, 0.8);
  const cx = w * g.f(0.4, 0.6);
  const tall = g.f(1.55, 1.8);
  // Shrink a penguin that would leave too little headroom (its head top is at gy - 1.92 * bh).
  const bw = Math.min(size * g.f(0.16, 0.2), (gy - h * 0.08) / (1.92 * tall));
  const bh = bw * tall;
  const by = gy - bh * 0.92;
  const dir = g.pick([-1, 1]);
  const black = g.pick(["#1d2330", "#232a35", "#2b2d3a"]);
  const emperor = g.chance(0.45);
  const chest = g.id("chest");
  let out =
    el(
      "defs",
      {},
      lin(sky, [hsl(skyHue, 45, 74), hsl(skyHue - 10, 50, 93)]),
      emperor
        ? lin(chest, ["#f5be55", "#f8d48a", "#fae7bf", "#fbf4e4", "#fbfaf6", "#fbfaf6", "#fbfaf6", "#fbfaf6"])
        : "",
    ) + fill(w, h, `url(#${sky})`);
  // Icebergs on the horizon
  for (let k = g.i(1, 3); k > 0; k--) {
    const bergX = w * g.f(-0.1, 0.9);
    const bwid = w * g.f(0.15, 0.35);
    const bht = h * g.f(0.12, 0.3);
    out += el("polygon", {
      points: pts([
        [bergX, gy],
        [bergX + bwid * g.f(0.2, 0.4), gy - bht],
        [bergX + bwid * g.f(0.55, 0.8), gy - bht * g.f(0.6, 0.95)],
        [bergX + bwid, gy],
      ]),
      fill: hsl(skyHue, 35, g.f(84, 92)),
    });
  }
  // Ice and shadow
  out += el("rect", { y: gy, width: w, height: h - gy, fill: hsl(skyHue, 30, 96) });
  out += el("ellipse", { cx, cy: gy + bh * 0.08, rx: bw * 1.1, ry: bh * 0.07, fill: hsl(skyHue, 30, 80) });
  out += facing(cx, dir);
  // Feet
  for (const sd of [-1, 1])
    out += el("ellipse", { cx: cx + sd * bw * 0.3, cy: gy, rx: bw * 0.28, ry: bw * 0.1, fill: "#f08a24" });
  // Back flipper
  out += el("ellipse", {
    cx: cx - bw * 0.95,
    cy: by + bh * 0.05,
    rx: bw * 0.22,
    ry: bh * 0.42,
    fill: black,
    transform: s`rotate(18 ${cx - bw * 0.95} ${by - bh * 0.3})`,
  });
  // Body and white front
  out += el("ellipse", { cx, cy: by, rx: bw, ry: bh, fill: black });
  out += el("ellipse", {
    cx: cx + bw * 0.12,
    cy: by + bh * 0.22,
    rx: bw * 0.72,
    ry: bh * 0.72,
    fill: emperor ? `url(#${chest})` : "#fbfaf6",
  });
  // Emperor's ear patch: a teardrop on the side of the head behind the eye, its tail running down
  // and forward into the golden wash at the top of the chest.
  if (emperor) {
    const hx = cx - bw * 0.04;
    const hy = by - bh * 0.68;
    const r = bw * 0.17;
    const tx = cx + bw * 0.32;
    const ty = by - bh * 0.34;
    const len = Math.hypot(tx - hx, ty - hy);
    const ux = (tx - hx) / len;
    const uy = (ty - hy) / len;
    out += el("path", {
      d: s`M ${tx} ${ty}
           Q ${hx - uy * r * 1.35 + ux * len * 0.5} ${hy + ux * r * 1.35 + uy * len * 0.5} ${hx - uy * r} ${hy + ux * r}
           A ${r} ${r} 0 1 1 ${hx + uy * r} ${hy - ux * r}
           Q ${hx + uy * r * 1.35 + ux * len * 0.5} ${hy - ux * r * 1.35 + uy * len * 0.5} ${tx} ${ty} Z`,
      fill: "#f3a33a",
    });
  }
  // Front flipper
  out += el("ellipse", {
    cx: cx + bw * 0.95,
    cy: by + bh * 0.05,
    rx: bw * 0.2,
    ry: bh * 0.4,
    fill: black,
    transform: s`rotate(-14 ${cx + bw * 0.95} ${by - bh * 0.3})`,
  });
  // Eye
  out += el("circle", { cx: cx + bw * 0.42, cy: by - bh * 0.66, r: bw * 0.1, fill: "#fff" });
  out += el("circle", { cx: cx + bw * 0.45, cy: by - bh * 0.66, r: bw * 0.055, fill: "#111" });
  // Beak
  out += el("polygon", {
    points: pts([
      [cx + bw * 0.72, by - bh * 0.6],
      [cx + bw * 1.15, by - bh * 0.52],
      [cx + bw * 0.72, by - bh * 0.46],
    ]),
    fill: emperor ? "#e86f2d" : "#f08a24",
  });
  out += "</g>";
  const side = dir > 0 ? "right" : "left";
  note.alt(
    emperor
      ? `An emperor penguin with a neck patch on the ice, facing ${side}`
      : `A penguin on the ice near icebergs, facing ${side}`,
  );
  note.focus(cx + dir * bw * 0.42, by - bh * 0.66);
  // Head and beak, with the top of the belly.
  note.frame(cx - bw * 1.25, by - bh * 1.05, bw * 2.5, bh * 0.95);
  return out;
});
