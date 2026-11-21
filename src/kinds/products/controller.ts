import { defineKind, el, type Point, s } from "../../draw/core";
import { shade, sweepStudio, tint } from "./shared";

// The right half of a controller's outline, in units of its half-width, as cubic segments.
const CONTROLLER: readonly (readonly Point[])[] = [
  [
    [0.3, -0.44],
    [0.55, -0.5],
    [0.75, -0.44],
  ],
  [
    [0.92, -0.38],
    [0.98, -0.2],
    [1.0, 0.0],
  ],
  [
    [1.03, 0.25],
    [1.0, 0.55],
    [0.88, 0.68],
  ],
  [
    [0.78, 0.78],
    [0.62, 0.76],
    [0.56, 0.64],
  ],
  [
    [0.48, 0.45],
    [0.38, 0.28],
    [0.22, 0.26],
  ],
  [
    [0.12, 0.25],
    [0.05, 0.25],
    [0, 0.25],
  ],
];

/** A game controller lying flat on the studio floor, seen from above. */
export const controller = /* @__PURE__ */ defineKind("controller", "Game controller", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const body = g.pick([
    "#2b2b2d",
    "#2b2b2d",
    "#ece8e1",
    "#3e5a74",
    "#7a3b3b",
    "#d9dcdf",
    "#2f6b58",
    "#5b4b8a",
    "#e8b04b",
    "#c98a7a",
  ]);
  const black = body === "#2b2b2d";
  // On a black body the buttons are a lighter charcoal, so they still show.
  const dark = black ? "#4a4a50" : shade(body, 0.55);
  const layout = g.pick(["offset", "symmetric"] as const);
  const touchpad = g.chance(0.4);
  const colored = g.chance(0.5);
  const sx = unit * g.f(0.32, 0.35);
  const sy = sx * 0.85;
  const cx = w / 2;
  const cy = h / 2 + unit * 0.04;
  const turn = g.f(-8, 8);
  // Mostly floor: the horizon sits high behind it.
  let out = sweepStudio(g, w, h, Math.max(h * 0.12, cy - sy * 1.4), cx, cy);
  const at = (x: number, y: number): Point => [cx + x * sx, cy + y * sy];
  // The outline: the right half, then the left half traced back.
  const start = at(0, -0.42);
  let d = s`M ${start[0]} ${start[1]}`;
  for (const seg of CONTROLLER) {
    const [a, b, c] = seg.map(([x, y]) => at(x, y));
    d += s` C ${a[0]} ${a[1]} ${b[0]} ${b[1]} ${c[0]} ${c[1]}`;
  }
  const ends: Point[] = [[0, -0.42], ...CONTROLLER.map(seg => seg[2])];
  for (let k = CONTROLLER.length - 1; k >= 0; k--) {
    const [a, b] = CONTROLLER[k];
    const c = ends[k];
    const [p1, p2, p3] = [b, a, c].map(([x, y]) => at(-x, y));
    d += s` C ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`;
  }
  d += " Z";
  out += s`<g transform="rotate(${turn} ${cx} ${cy})">`;
  // Its shadow: the outline itself, a little lower and wider
  out += el("path", {
    d,
    fill: "#000",
    opacity: "0.07",
    transform: s`translate(${cx * -0.06} ${cy * -0.06 + sy * 0.16}) scale(1.06)`,
  });
  out += el("path", { d, fill: "#000", opacity: "0.12", transform: s`translate(0 ${sy * 0.11})` });
  // Shoulder bumpers peeking out at the top
  for (const side of [-1, 1]) {
    const [bx, by] = at(side < 0 ? -0.86 : 0.42, -0.56);
    out += el("rect", { x: bx, y: by, width: sx * 0.44, height: sy * 0.22, rx: sy * 0.09, fill: shade(body, 0.3) });
  }
  // The side wall shows below the top surface, then the top itself
  out += el("path", { d, fill: shade(body, 0.3), transform: s`translate(0 ${sy * 0.06})` });
  out += el("path", { d, fill: body });
  out += el("path", {
    d: s`M ${at(-0.7, -0.36)[0]} ${at(-0.7, -0.36)[1]} Q ${at(0, -0.48)[0]} ${at(0, -0.48)[1]} ${at(0.7, -0.36)[0]} ${at(0.7, -0.36)[1]}`,
    stroke: "#fff",
    "stroke-width": sy * 0.025,
    fill: "none",
    opacity: "0.3",
    "stroke-linecap": "round",
  });
  const leftTop = at(-0.55, -0.1);
  const rightTop = at(0.55, -0.1);
  const leftLow = at(-0.28, 0.13);
  const rightLow = at(0.28, 0.13);
  const dpadAt = layout === "offset" ? leftLow : leftTop;
  const stickL = layout === "offset" ? leftTop : leftLow;
  // D-pad on a shallow well
  out += el("circle", { cx: dpadAt[0], cy: dpadAt[1], r: sx * 0.17, fill: "#000", opacity: "0.08" });
  const arm = sx * 0.13;
  const th = sx * 0.045;
  out += el("path", {
    d: s`M ${dpadAt[0] - th} ${dpadAt[1] - arm} h ${th * 2} v ${arm - th} h ${arm - th} v ${th * 2} h ${-(arm - th)} v ${arm - th} h ${-th * 2} v ${-(arm - th)} h ${-(arm - th)} v ${-th * 2} h ${arm - th} Z`,
    fill: dark,
  });
  // Face buttons in a diamond
  out += el("circle", { cx: rightTop[0], cy: rightTop[1], r: sx * 0.2, fill: "#000", opacity: "0.08" });
  const tones = colored
    ? g.pick([
        ["#7fb3d5", "#e59a8c", "#9cc79a", "#ecc56f"],
        ["#c7c2d9", "#c7c2d9", "#c7c2d9", "#c7c2d9"],
      ])
    : [dark, dark, dark, dark];
  const offsets: Point[] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  offsets.forEach(([ox, oy], k) => {
    const bx = rightTop[0] + ox * sx * 0.11;
    const by = rightTop[1] + oy * sx * 0.11;
    out += el("circle", { cx: bx, cy: by + sx * 0.012, r: sx * 0.058, fill: "#000", opacity: "0.2" });
    out += el("circle", { cx: bx, cy: by, r: sx * 0.058, fill: tones[k] });
  });
  // Thumbsticks: a well, the cap and its grip ring
  for (const [tx, ty] of [stickL, rightLow]) {
    out += el("circle", { cx: tx, cy: ty, r: sx * 0.15, fill: black ? "#161618" : shade(body, 0.4) });
    out += el("circle", { cx: tx, cy: ty + sx * 0.015, r: sx * 0.115, fill: "#000", opacity: "0.25" });
    out += el("circle", { cx: tx, cy: ty, r: sx * 0.115, fill: dark });
    out += el("circle", { cx: tx, cy: ty, r: sx * 0.075, fill: tint(dark, 0.12) });
    out += el("circle", { cx: tx - sx * 0.04, cy: ty - sx * 0.04, r: sx * 0.022, fill: "#fff", opacity: "0.25" });
  }
  // Small center buttons, and a touchpad or a round home button
  const pillY = touchpad ? -0.3 : -0.2;
  const pillX = touchpad ? 0.3 : 0.16;
  for (const side of [-1, 1]) {
    const [px, py] = at(side * pillX, pillY);
    out += el("rect", {
      x: px - sx * 0.04,
      y: py - sx * 0.018,
      width: sx * 0.08,
      height: sx * 0.036,
      rx: sx * 0.018,
      fill: dark,
    });
  }
  if (touchpad) {
    const [tx, ty] = at(-0.22, -0.4);
    out += el("rect", { x: tx, y: ty, width: sx * 0.44, height: sy * 0.32, rx: sx * 0.05, fill: shade(body, 0.15) });
  } else {
    const [hx, hy] = at(0, -0.02);
    out += el("circle", { cx: hx, cy: hy, r: sx * 0.06, fill: dark });
    out += el("circle", { cx: hx, cy: hy, r: sx * 0.03, fill: "#fff", opacity: "0.25" });
  }
  out += "</g>";
  note.alt(
    touchpad
      ? "A game controller with a touchpad, lying flat and seen from above"
      : "A game controller lying flat, seen from above",
  );
  note.focus(cx, cy);
  return out;
});
