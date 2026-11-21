import { defineKind, el, fill, hsl, lin, mix, s } from "../../draw/core";

/** An owl on a branch at dusk, sometimes with the moon. Plumage, eyes and gaze vary. */
export const owl = /* @__PURE__ */ defineKind("owl", "Owl", (g, w, h, note) => {
  const hue = g.f(200, 290);
  const feather = g.pick(["#8a6a4f", "#6e6a66", "#b08a5e", "#d9d2c5", "#5a4636"]);
  const light = mix(feather, "#ffffff", 0.45);
  const dark = mix(feather, "#000000", 0.28);
  const sky = g.id("sky");
  const unit = Math.min(w, h);
  const branchY = h * 0.84;
  const cx = w / 2;
  const bodyW = unit * g.f(0.19, 0.24);
  const bodyH = unit * g.f(0.29, 0.34);
  const bodyY = branchY - bodyH * 0.85;
  let out = el("defs", {}, lin(sky, [hsl(hue, 40, 30), hsl(hue + 30, 45, 62)]));
  out += fill(w, h, `url(#${sky})`);
  const moon = g.chance(0.6);
  if (moon)
    // The moon, off to one side.
    out += el("circle", {
      cx: w * g.pick([g.f(0.12, 0.3), g.f(0.7, 0.88)]),
      cy: h * g.f(0.18, 0.32),
      r: unit * 0.08,
      fill: "hsl(50 60% 92%)",
    });
  // The branch.
  out += el("path", {
    d: s`M -10 ${branchY + 4}
         Q ${w / 2} ${branchY - h * 0.02} ${w + 10} ${branchY + h * 0.03}`,
    stroke: "#4b3426",
    "stroke-width": h * 0.04,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Ear tufts.
  for (const side of [-1, 1])
    out += el("polygon", {
      points: s`${cx + side * bodyW * 0.78},${bodyY - bodyH * 0.55} ${cx + side * bodyW * g.f(0.8, 0.95)},${bodyY - bodyH * 1.12} ${cx + side * bodyW * 0.25},${bodyY - bodyH * 0.78}`,
      fill: feather,
    });
  // Body and breast.
  out += el("ellipse", { cx, cy: bodyY, rx: bodyW, ry: bodyH, fill: feather });
  out += el("ellipse", { cx, cy: bodyY + bodyH * 0.32, rx: bodyW * 0.62, ry: bodyH * 0.58, fill: light });
  // Wings.
  for (const side of [-1, 1])
    out += el("ellipse", {
      cx: cx + side * bodyW * 0.86,
      cy: bodyY + bodyH * 0.15,
      rx: bodyW * 0.3,
      ry: bodyH * 0.6,
      fill: dark,
    });
  // Eyes: a pale disc, the iris, and a pupil shifted by the gaze.
  const iris = g.pick(["#f2c14e", "#f08a24", "#e9d758"]);
  const gazeX = g.f(-0.06, 0.06) * bodyW;
  const gazeY = g.f(-0.04, 0.05) * bodyW;
  for (const side of [-1, 1]) {
    const eyeX = cx + side * bodyW * 0.42;
    const eyeY = bodyY - bodyH * 0.4;
    out += el("circle", { cx: eyeX, cy: eyeY, r: bodyW * 0.4, fill: light });
    out += el("circle", { cx: eyeX, cy: eyeY, r: bodyW * 0.25, fill: iris });
    out += el("circle", { cx: eyeX + gazeX, cy: eyeY + gazeY, r: bodyW * 0.13, fill: "#111" });
  }
  // Beak.
  out += el("polygon", {
    points: s`${cx - bodyW * 0.1},${bodyY - bodyH * 0.25} ${cx + bodyW * 0.1},${bodyY - bodyH * 0.25} ${cx},${bodyY - bodyH * 0.06}`,
    fill: "#e0a43a",
  });
  // Talons gripping the branch.
  out += el("path", {
    d: s`M ${cx - bodyW * 0.3} ${branchY - 2} v 8
         M ${cx - bodyW * 0.18} ${branchY - 2} v 8
         M ${cx + bodyW * 0.18} ${branchY - 2} v 8
         M ${cx + bodyW * 0.3} ${branchY - 2} v 8`,
    stroke: "#e0a43a",
    "stroke-width": bodyW * 0.06,
    "stroke-linecap": "round",
  });
  note.alt(moon ? "An owl on a branch at dusk under the moon" : "An owl perched on a branch at dusk");
  note.focus(cx, bodyY - bodyH * 0.4);
  // Ear tufts, face disc and the top of the chest.
  note.frame(cx - bodyW, bodyY - bodyH * 1.15, bodyW * 2, bodyH * 1.4);
  return out;
});
