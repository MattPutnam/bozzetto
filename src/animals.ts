import { defineKind, el, facing, fill, hsl, lin, mix, pts, s, type Point } from "./core";

const COATS = [
  ["#e89a4b", "#f7d3a6"],
  ["#8c8c94", "#d9d9de"],
  ["#2b2b30", "#4a4a52"],
  ["#efe9df", "#ffffff"],
  ["#b4865e", "#ead7c0"],
  ["#5b4636", "#9c8067"],
] as const;

/** A cat's face and shoulders. Coat, eyes, tabby stripes and muzzle vary. */
export const cat = defineKind("cat", "Cat", "animal", (g, w, h) => {
  const [fur, light] = g.pick(COATS);
  const whisker = fur === "#efe9df" ? "#555" : "#f4f1ea";
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h * 0.5;
  const rx = unit * g.f(0.24, 0.29);
  const ry = rx * g.f(0.8, 0.92);
  let out = fill(w, h, hsl(g.f(0, 360), 30, 84));
  // Shoulders.
  out += el("ellipse", { cx, cy: cy + ry * 1.7, rx: rx * 1.3, ry: ry * 1.1, fill: fur });
  // Ears, each with a pink inner ear shrunk toward its center.
  const tip = g.f(0.62, 0.8);
  const up = g.f(1.25, 1.5);
  for (const side of [-1, 1]) {
    const ear: Point[] = [
      [cx + side * rx * 0.88, cy - ry * 0.3],
      [cx + side * rx * tip, cy - ry * up],
      [cx + side * rx * 0.18, cy - ry * 0.85],
    ];
    const midX = (ear[0][0] + ear[1][0] + ear[2][0]) / 3;
    const midY = (ear[0][1] + ear[1][1] + ear[2][1]) / 3;
    const inner = ear.map(([x, y]): Point => [midX + (x - midX) * 0.55, midY + (y - midY) * 0.55 - ry * 0.03]);
    out += el("polygon", { points: pts(ear), fill: fur });
    out += el("polygon", { points: pts(inner), fill: "#f2a8a8", opacity: "0.85" });
  }
  // Head.
  out += el("ellipse", { cx, cy, rx, ry, fill: fur });
  if (g.chance(0.35))
    // Tabby stripes on the forehead.
    out += el("path", {
      d: s`M ${cx} ${cy - ry * 0.98} v ${ry * 0.3}
           M ${cx - rx * 0.22} ${cy - ry * 0.94} v ${ry * 0.22}
           M ${cx + rx * 0.22} ${cy - ry * 0.94} v ${ry * 0.22}`,
      stroke: "#000",
      "stroke-opacity": "0.18",
      "stroke-width": rx * 0.08,
      "stroke-linecap": "round",
    });
  if (g.chance(0.5))
    // A pale muzzle.
    out += el("ellipse", { cx, cy: cy + ry * 0.42, rx: rx * 0.42, ry: ry * 0.3, fill: light });
  // Eyes, with slit or round pupils.
  const eye = g.pick(["#9bc53d", "#f2c14e", "#6fb7e0", "#d98c2b"]);
  const slit = g.chance(0.6);
  for (const side of [-1, 1]) {
    out += el("ellipse", { cx: cx + side * rx * 0.4, cy: cy - ry * 0.05, rx: rx * 0.17, ry: ry * 0.2, fill: eye });
    out += el("ellipse", {
      cx: cx + side * rx * 0.4,
      cy: cy - ry * 0.05,
      rx: rx * (slit ? 0.045 : 0.1),
      ry: ry * (slit ? 0.17 : 0.12),
      fill: "#111",
    });
  }
  // Nose.
  out += el("polygon", {
    points: s`${cx - rx * 0.08},${cy + ry * 0.24} ${cx + rx * 0.08},${cy + ry * 0.24} ${cx},${cy + ry * 0.35}`,
    fill: "#e07a7a",
  });
  // Mouth: a short line down from the nose, then two curves.
  out += el("path", {
    d: s`M ${cx} ${cy + ry * 0.35}
         v ${ry * 0.1}
         M ${cx - rx * 0.14} ${cy + ry * 0.5}
         Q ${cx - rx * 0.07} ${cy + ry * 0.56} ${cx} ${cy + ry * 0.45}
         Q ${cx + rx * 0.07} ${cy + ry * 0.56} ${cx + rx * 0.14} ${cy + ry * 0.5}`,
    stroke: "#3a2a2a",
    "stroke-width": rx * 0.035,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Whiskers: three on each side.
  let whiskers = "";
  for (const side of [-1, 1])
    for (const k of [-1, 0, 1])
      whiskers += s`M ${cx + side * rx * 0.25} ${cy + ry * 0.38 + k * ry * 0.06} L ${cx + side * rx * 1.05} ${cy + ry * 0.3 + k * ry * 0.16} `;
  out += el("path", { d: whiskers.trim(), stroke: whisker, "stroke-width": rx * 0.02, opacity: "0.8" });
  return out;
});

/** A round songbird on a leafy branch, facing either way. */
export const bird = defineKind("bird", "Bird on a branch", "animal", (g, w, h) => {
  const hue = g.f(0, 360);
  const body = hsl(hue, g.f(45, 70), g.f(40, 58));
  const belly = hsl(hue + g.f(20, 50), g.f(50, 80), g.f(70, 82));
  const wing = hsl(hue, 45, 28);
  const branchY = h * g.f(0.68, 0.76);
  const dir = g.pick([1, -1]);
  const cx = w * g.f(0.4, 0.6);
  const size = Math.min(w, h) * g.f(0.14, 0.19);
  let out = fill(w, h, hsl(g.f(160, 220), 40, 86));
  // The branch.
  out += el("path", {
    d: s`M -10 ${branchY + h * 0.04}
         Q ${w * 0.5} ${branchY - h * 0.03} ${w + 10} ${branchY + h * g.f(-0.02, 0.06)}`,
    stroke: "#6b4a32",
    "stroke-width": h * 0.035,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Leaves along the branch.
  for (let k = g.i(2, 4); k > 0; k--) {
    const leafX = w * g.f(0.05, 0.95);
    const leafY = branchY + g.f(-4, 4);
    out += el("ellipse", {
      cx: leafX,
      cy: leafY - h * 0.03,
      rx: h * 0.05,
      ry: h * 0.022,
      fill: hsl(g.f(90, 140), 40, g.f(35, 50)),
      transform: s`rotate(${g.f(-60, 60)} ${leafX} ${leafY})`,
    });
  }
  const bodyX = cx;
  const bodyY = branchY - size * 0.95;
  const headX = bodyX + size * 0.7;
  const headY = bodyY - size * 0.6;
  out += facing(cx, dir);
  // Tail.
  out += el("polygon", {
    points: s`${bodyX - size * 0.7},${bodyY + size * 0.1} ${bodyX - size * 1.8},${bodyY + size * 0.5} ${bodyX - size * 1.6},${bodyY + size * 0.85}`,
    fill: wing,
  });
  // Legs.
  out += el("path", {
    d: s`M ${bodyX - size * 0.15} ${bodyY + size * 0.75} l ${-size * 0.05} ${size * 0.3}
         M ${bodyX + size * 0.18} ${bodyY + size * 0.75} l ${size * 0.02} ${size * 0.3}`,
    stroke: "#5a3d2b",
    "stroke-width": size * 0.07,
    "stroke-linecap": "round",
  });
  // Body and belly.
  out += el("ellipse", { cx: bodyX, cy: bodyY, rx: size * 1.05, ry: size * 0.85, fill: body });
  out += el("ellipse", {
    cx: bodyX + size * 0.25,
    cy: bodyY + size * 0.25,
    rx: size * 0.62,
    ry: size * 0.5,
    fill: belly,
  });
  // Wing.
  out += el("ellipse", {
    cx: bodyX - size * 0.25,
    cy: bodyY,
    rx: size * 0.75,
    ry: size * 0.42,
    fill: wing,
    transform: s`rotate(-14 ${bodyX - size * 0.25} ${bodyY})`,
  });
  if (g.chance(0.35))
    // A crest.
    out += el("polygon", {
      points: s`${headX - size * 0.25},${headY - size * 0.4} ${headX - size * 0.45},${headY - size * 0.95} ${headX + size * 0.1},${headY - size * 0.5}`,
      fill: body,
    });
  // Head.
  out += el("circle", { cx: headX, cy: headY, r: size * 0.55, fill: body });
  // Beak.
  out += el("polygon", {
    points: s`${headX + size * 0.48},${headY - size * 0.1} ${headX + size * g.f(0.8, 0.95)},${headY + size * 0.03} ${headX + size * 0.48},${headY + size * 0.15}`,
    fill: "#f0a23a",
  });
  // Eye and its highlight.
  out += el("circle", { cx: headX + size * 0.2, cy: headY - size * 0.08, r: size * 0.085, fill: "#111" });
  out += el("circle", { cx: headX + size * 0.23, cy: headY - size * 0.11, r: size * 0.025, fill: "#fff" });
  return out + "</g>";
});

/** A fish among weeds and bubbles. Color, stripes and direction vary. */
export const fish = defineKind("fish", "Fish", "animal", (g, w, h) => {
  const waterHue = g.f(180, 215);
  const hue = g.f(0, 360);
  const dir = g.pick([1, -1]);
  const water = g.id("water");
  const clip = g.id("body");
  const cx = w * g.f(0.42, 0.55);
  const cy = h * g.f(0.4, 0.55);
  const length = Math.min(w, (h * 4) / 3) * g.f(0.2, 0.28);
  const height = length * g.f(0.45, 0.7);
  // The body outline: two curves meeting at nose and tail. Also clips the stripes.
  const bodyD = s`M ${cx - length} ${cy} Q ${cx - length * 0.2} ${cy - height * 1.1} ${cx + length * 0.8} ${cy} Q ${cx - length * 0.2} ${cy + height * 1.1} ${cx - length} ${cy} Z`;
  const fin = hsl(hue + 20, 70, 42);
  let out = el(
    "defs",
    {},
    lin(water, [hsl(waterHue, 55, 64), hsl(waterHue + 15, 60, 30)]),
    el("clipPath", { id: clip }, el("path", { d: bodyD })),
  );
  out += fill(w, h, `url(#${water})`);
  // Weeds rising from the bottom.
  for (let k = g.i(2, 3); k > 0; k--) {
    const x = w * g.f(0.05, 0.95);
    out += el("path", {
      d: s`M ${x} ${h + 5}
           C ${x + g.f(-25, 25)} ${h * 0.78} ${x + g.f(-25, 25)} ${h * 0.6} ${x + g.f(-15, 15)} ${h * g.f(0.38, 0.62)}`,
      stroke: hsl(g.f(100, 150), 40, g.f(25, 40)),
      "stroke-width": g.f(5, 10),
      "stroke-linecap": "round",
      fill: "none",
    });
  }
  out += facing(cx, dir);
  // Tail fin.
  out += el("polygon", {
    points: s`${cx + length * 0.7},${cy} ${cx + length * 1.15},${cy - height * 0.62} ${cx + length * 1.02},${cy} ${cx + length * 1.15},${cy + height * 0.62}`,
    fill: fin,
  });
  // Dorsal fin.
  out += el("path", {
    d: s`M ${cx - length * 0.35} ${cy - height * 0.45}
         Q ${cx - length * 0.05} ${cy - height * 1.05} ${cx + length * 0.35} ${cy - height * 0.32}
         Z`,
    fill: fin,
  });
  // Body.
  out += el("path", { d: bodyD, fill: hsl(hue, 72, 56) });
  if (g.chance(0.65)) {
    // Stripes, clipped to the body.
    const stripe = g.chance(0.5) ? "#fff" : hsl(hue + 20, 60, 28);
    const count = g.i(2, 3);
    out += el(
      "g",
      { "clip-path": `url(#${clip})`, fill: stripe, opacity: "0.85" },
      ...Array.from({ length: count }, (_, k) =>
        el("rect", {
          x: cx - length * 0.45 + k * length * 0.42,
          y: cy - height,
          width: length * 0.12,
          height: height * 2,
        }),
      ),
    );
  }
  // Eye and pupil.
  out += el("circle", { cx: cx - length * 0.62, cy: cy - height * 0.1, r: height * 0.14, fill: "#fff" });
  out += el("circle", { cx: cx - length * 0.65, cy: cy - height * 0.1, r: height * 0.07, fill: "#111" });
  out += "</g>";
  // Bubbles rising from the mouth.
  const mouthX = cx - dir * length * 1.1;
  const count = g.i(2, 4);
  for (let k = 0; k < count; k++) {
    out += el("circle", {
      cx: mouthX - dir * g.f(0, 10),
      cy: cy - height * 0.3 - k * h * 0.09,
      r: g.f(3, 7),
      fill: "none",
      stroke: "#fff",
      "stroke-width": "1.5",
      opacity: "0.7",
    });
  }
  return out;
});

/** An owl on a branch at dusk, sometimes with the moon. Plumage, eyes and gaze vary. */
export const owl = defineKind("owl", "Owl", "animal", (g, w, h) => {
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
  if (g.chance(0.6))
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
  return out;
});
