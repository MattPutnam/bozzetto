import { defineKind, el, facing, fill, hsl, lin, mix, pts, s, type Point } from "./core";
import { andList } from "./words";

const COATS = [
  ["#e89a4b", "#f7d3a6"],
  ["#8c8c94", "#d9d9de"],
  ["#2b2b30", "#4a4a52"],
  ["#efe9df", "#ffffff"],
  ["#b4865e", "#ead7c0"],
  ["#5b4636", "#9c8067"],
] as const;

/** A cat's face and shoulders. Coat, eyes, tabby stripes and muzzle vary. */
export const cat = defineKind(
  "cat",
  "Cat",
  { tabby: [true, false], muzzle: [true, false], pupils: ["slit", "round"] },
  (g, w, h, note) => {
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
    const tabby = g.option("tabby", g.chance(0.35));
    if (tabby)
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
    const muzzle = g.option("muzzle", g.chance(0.5));
    if (muzzle)
      // A pale muzzle.
      out += el("ellipse", { cx, cy: cy + ry * 0.42, rx: rx * 0.42, ry: ry * 0.3, fill: light });
    // Eyes, with slit or round pupils.
    const eye = g.pick(["#9bc53d", "#f2c14e", "#6fb7e0", "#d98c2b"]);
    const slit = g.option("pupils", g.chance(0.6) ? "slit" : "round") === "slit";
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
    const features = [muzzle && "a pale muzzle", slit ? "slit pupils" : "round pupils"];
    note.alt(`A ${tabby ? "tabby " : ""}cat's face with ${andList(features)}`);
    note.focus(cx, cy - ry * 0.05);
    // Head and ears.
    note.frame(cx - rx * 1.05, cy - ry * 1.5, rx * 2.1, ry * 2.55);
    return out;
  },
);

/** A round songbird on a leafy branch, facing either way. */
export const bird = defineKind("bird", "Bird on a branch", (g, w, h, note) => {
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
  const crest = g.chance(0.35);
  if (crest)
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
  note.alt(`A ${crest ? "crested " : ""}songbird on a leafy branch, facing ${dir > 0 ? "right" : "left"}`);
  note.focus(cx + dir * (headX + size * 0.2 - cx), headY - size * 0.08);
  return out + "</g>";
});

/** A fish among weeds and bubbles. Color, stripes and direction vary. */
export const fish = defineKind("fish", "Fish", (g, w, h, note) => {
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
  const striped = g.chance(0.65);
  if (striped) {
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
  // The body is drawn facing left, so it faces right when mirrored.
  note.alt(`A ${striped ? "striped " : ""}fish among weeds and bubbles, facing ${dir > 0 ? "left" : "right"}`);
  note.focus(cx - dir * length * 0.62, cy - height * 0.1);
  return out;
});

/** An owl on a branch at dusk, sometimes with the moon. Plumage, eyes and gaze vary. */
export const owl = defineKind("owl", "Owl", (g, w, h, note) => {
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

const DOG_COATS = [
  { fur: "#c8945c", ear: "#8a5a32", muzzle: "#f1dcc0" },
  { fur: "#e9d7b8", ear: "#b8875a", muzzle: "#fbf3e6" },
  { fur: "#2e2a2b", ear: "#1d1a1b", muzzle: "#b9895c" },
  { fur: "#d9a441", ear: "#b07a26", muzzle: "#f3dfae" },
  { fur: "#8b5a3c", ear: "#5f3a24", muzzle: "#d7b79a" },
  { fur: "#f4f1ea", ear: "#2b2b2b", muzzle: "#ffffff", spots: true },
] as const;

/** A dog's face: floppy or pointed ears, a muzzle, sometimes an eye patch, a tongue and a collar. */
export const dog = defineKind("dog", "Dog", (g, w, h, note) => {
  const coat = g.pick(DOG_COATS);
  const size = Math.min(w, h);
  const cx = w / 2;
  const cy = h * 0.47;
  const rx = size * g.f(0.22, 0.26);
  const ry = rx * g.f(0.88, 1);
  let out = fill(w, h, hsl(g.f(0, 360), 32, 84));
  // Body
  out += el("ellipse", { cx, cy: cy + ry * 1.75, rx: rx * 1.35, ry: ry * 1.1, fill: coat.fur });
  // Collar and tag
  const collar = hsl(g.f(0, 360), 65, 48);
  out += el("path", {
    d: s`M ${cx - rx * 0.75} ${cy + ry * 0.92}
         Q ${cx} ${cy + ry * 1.18} ${cx + rx * 0.75} ${cy + ry * 0.92}`,
    stroke: collar,
    "stroke-width": ry * 0.14,
    fill: "none",
  });
  out += el("circle", { cx, cy: cy + ry * 1.2, r: rx * 0.1, fill: "#f2c14e" });
  const floppy = g.chance(0.65);
  // Pointed ears, behind the head
  if (!floppy)
    for (const sd of [-1, 1])
      out += el("polygon", {
        points: pts([
          [cx + sd * rx * 0.85, cy - ry * 0.25],
          [cx + sd * rx * g.f(0.75, 0.95), cy - ry * 1.35],
          [cx + sd * rx * 0.25, cy - ry * 0.8],
        ]),
        fill: coat.ear,
      });
  // Head
  out += el("ellipse", { cx, cy, rx, ry, fill: coat.fur });
  // Spots
  if ("spots" in coat)
    for (let k = g.i(3, 5); k > 0; k--)
      out += el("circle", {
        cx: cx + rx * g.f(-0.8, 0.8),
        cy: cy + ry * g.f(-0.8, 0.1),
        r: rx * g.f(0.06, 0.12),
        fill: "#2b2b2b",
      });
  // Eye patch
  const patchSide = g.chance(0.4) ? g.pick([-1, 1]) : 0;
  if (patchSide)
    out += el("ellipse", {
      cx: cx + patchSide * rx * 0.38,
      cy: cy - ry * 0.12,
      rx: rx * 0.3,
      ry: ry * 0.28,
      fill: coat.ear,
    });
  if (floppy) {
    // Ears hang from the top corners of the head, nearly straight down, splaying out a little.
    const len = ry * g.f(0.55, 0.7);
    const splay = g.f(0, 10);
    for (const sd of [-1, 1]) {
      const px = cx + sd * rx * 0.8;
      const py = cy - ry * 0.6;
      out += el("ellipse", {
        cx: px,
        cy: py + len,
        rx: rx * 0.27,
        ry: len,
        fill: coat.ear,
        transform: s`rotate(${-sd * splay} ${px} ${py})`,
      });
    }
  }
  // Muzzle
  out += el("ellipse", { cx, cy: cy + ry * 0.4, rx: rx * 0.5, ry: ry * 0.38, fill: coat.muzzle });
  // Eyes with highlights
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: cx + sd * rx * 0.38, cy: cy - ry * 0.12, r: rx * 0.1, fill: "#1c1512" });
    out += el("circle", { cx: cx + sd * rx * 0.38 + rx * 0.03, cy: cy - ry * 0.15, r: rx * 0.03, fill: "#fff" });
  }
  // Nose
  out += el("ellipse", { cx, cy: cy + ry * 0.2, rx: rx * 0.16, ry: ry * 0.11, fill: "#1c1512" });
  // Tongue
  const tongue = g.chance(0.5);
  if (tongue) out += el("ellipse", { cx, cy: cy + ry * 0.62, rx: rx * 0.12, ry: ry * 0.16, fill: "#e46f7b" });
  // Mouth: a line down from the nose, then two curves
  out += el("path", {
    d: s`M ${cx} ${cy + ry * 0.3}
         v ${ry * 0.16}
         M ${cx - rx * 0.2} ${cy + ry * 0.5}
         Q ${cx - rx * 0.1} ${cy + ry * 0.58} ${cx} ${cy + ry * 0.46}
         Q ${cx + rx * 0.1} ${cy + ry * 0.58} ${cx + rx * 0.2} ${cy + ry * 0.5}`,
    stroke: "#1c1512",
    "stroke-width": rx * 0.04,
    fill: "none",
    "stroke-linecap": "round",
  });
  const features = [
    floppy ? "floppy ears" : "pointed ears",
    patchSide && "an eye patch",
    tongue && "its tongue out",
    "a collar",
  ];
  note.alt(`A ${"spots" in coat ? "spotted " : ""}dog's face with ${andList(features)}`);
  note.focus(cx, cy - ry * 0.12);
  // Head, ears and collar.
  note.frame(cx - rx * 1.2, cy - ry * 1.4, rx * 2.4, ry * 2.6);
  return out;
});

const FOXES = [
  { fur: "#d9692b", dark: "#2a1a14", light: "#fbf3e8", bg: [95, 30, 80] },
  { fur: "#c25a24", dark: "#2a1a14", light: "#f6ead9", bg: [30, 35, 82] },
  { fur: "#e9e6e1", dark: "#5b5f68", light: "#ffffff", bg: [205, 35, 82] },
  { fur: "#dcb07a", dark: "#5a3a22", light: "#fbf3e3", bg: [40, 45, 84] },
] as const;

/** An angular fox face with pale cheeks and dark-tipped ears. */
export const fox = defineKind("fox", "Fox", (g, w, h, note) => {
  const palette = g.pick(FOXES);
  const size = Math.min(w, h);
  const cx = w / 2;
  const cy = h * 0.45;
  const rx = size * g.f(0.25, 0.29);
  const ry = rx * g.f(0.85, 1);
  let out = fill(w, h, hsl(palette.bg[0] + g.f(-20, 20), palette.bg[1], palette.bg[2]));
  // Body and pale chest
  out += el("ellipse", { cx, cy: cy + ry * 1.95, rx: rx * 1.1, ry: ry * 1.15, fill: palette.fur });
  out += el("polygon", {
    points: pts([
      [cx - rx * 0.45, cy + ry * 1.05],
      [cx + rx * 0.45, cy + ry * 1.05],
      [cx, cy + ry * 1.75],
    ]),
    fill: palette.light,
  });
  // Ears: fur, a dark tip and a pale inside
  const tip = g.f(1.2, 1.45);
  const spread = g.f(0.75, 0.95);
  for (const sd of [-1, 1]) {
    const ear: Point[] = [
      [cx + sd * rx * 0.95, cy - ry * 0.2],
      [cx + sd * rx * spread, cy - ry * tip],
      [cx + sd * rx * 0.28, cy - ry * 0.6],
    ];
    const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    out += el("polygon", { points: pts(ear), fill: palette.fur });
    out += el("polygon", {
      points: pts([lerp(ear[0], ear[1], 0.62), ear[1], lerp(ear[2], ear[1], 0.62)]),
      fill: palette.dark,
    });
    out += el("polygon", {
      points: pts([
        lerp(ear[0], ear[2], 0.25),
        lerp(ear[0], ear[1], 0.55),
        lerp(ear[2], ear[1], 0.55),
        lerp(ear[0], ear[2], 0.8),
      ]),
      fill: palette.light,
      opacity: "0.8",
    });
  }
  // Head
  out += el("polygon", {
    points: pts([
      [cx - rx, cy - ry * 0.2],
      [cx - rx * 0.55, cy - ry * 0.62],
      [cx + rx * 0.55, cy - ry * 0.62],
      [cx + rx, cy - ry * 0.2],
      [cx, cy + ry],
    ]),
    fill: palette.fur,
  });
  // Pale cheeks and muzzle
  out += el("polygon", {
    points: pts([
      [cx - rx, cy - ry * 0.2],
      [cx - rx * 0.25, cy + ry * 0.18],
      [cx, cy + ry * 0.08],
      [cx + rx * 0.25, cy + ry * 0.18],
      [cx + rx, cy - ry * 0.2],
      [cx, cy + ry],
    ]),
    fill: palette.light,
  });
  // Slanted eyes
  for (const sd of [-1, 1])
    out += el("ellipse", {
      cx: cx + sd * rx * 0.36,
      cy: cy - ry * 0.12,
      rx: rx * 0.1,
      ry: ry * 0.065,
      fill: palette.dark,
      transform: s`rotate(${sd * 18} ${cx + sd * rx * 0.36} ${cy - ry * 0.12})`,
    });
  // Nose
  out += el("circle", { cx, cy: cy + ry * 0.9, r: rx * 0.09, fill: palette.dark });
  note.alt("A fox's face with pale cheeks and dark-tipped ears");
  note.focus(cx, cy - ry * 0.12);
  // Head and ears, down to the chin.
  note.frame(cx - rx, cy - ry * 1.45, rx * 2, ry * 2.5);
  return out;
});

/** A penguin on the ice, sometimes with an emperor's golden neck. */
export const penguin = defineKind("penguin", "Penguin", (g, w, h, note) => {
  const size = Math.min(w, h);
  const sky = g.id("sky");
  const skyHue = g.f(190, 215);
  const gy = h * g.f(0.72, 0.8);
  const cx = w * g.f(0.4, 0.6);
  const bw = size * g.f(0.16, 0.2);
  const bh = bw * g.f(1.55, 1.8);
  const by = gy - bh * 0.92;
  const dir = g.pick([-1, 1]);
  const black = g.pick(["#1d2330", "#232a35", "#2b2d3a"]);
  const emperor = g.chance(0.45);
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 45, 74), hsl(skyHue - 10, 50, 93)])) + fill(w, h, `url(#${sky})`);
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
  out += el("ellipse", { cx: cx + bw * 0.12, cy: by + bh * 0.22, rx: bw * 0.72, ry: bh * 0.72, fill: "#fbfaf6" });
  // Emperor's golden neck patch
  if (emperor)
    out += el("ellipse", {
      cx: cx + bw * 0.45,
      cy: by - bh * 0.42,
      rx: bw * 0.22,
      ry: bh * 0.16,
      fill: "#f2b632",
      opacity: "0.9",
    });
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

/** A whale at the surface, half under the water, blowing a spout. */
export const whale = defineKind("whale", "Whale", (g, w, h, note) => {
  const skyHue = g.f(185, 225);
  const sky = g.id("sky");
  const sea = g.id("sea");
  const hz = h * g.f(0.5, 0.6);
  const dir = g.pick([-1, 1]);
  const body = g.pick(["#3e5a78", "#2c3e55", "#5b7a8c", "#46506b"]);
  const belly = mix(body, "#ffffff", 0.55);
  const cx = w * g.f(0.42, 0.58);
  const length = Math.min(w, h * 1.6) * g.f(0.3, 0.38);
  const height = length * g.f(0.32, 0.42);
  const wy = hz + height * 0.35;
  let out =
    el(
      "defs",
      {},
      lin(sky, [hsl(skyHue, 50, 78), hsl(skyHue - 20, 55, 94)]),
      lin(sea, [hsl(skyHue + 5, 55, 48), hsl(skyHue + 15, 60, 25)]),
    ) + fill(w, h, `url(#${sky})`);
  // Clouds
  const clouds = g.chance(0.6);
  if (clouds)
    for (let k = g.i(1, 3); k > 0; k--) {
      const x = w * g.f(0, 1);
      const y = h * g.f(0.1, 0.3);
      const radius = h * g.f(0.04, 0.07);
      out += el("path", {
        d: s`M ${x - radius * 2} ${y}
             a ${radius} ${radius} 0 0 1 ${radius * 1.3} ${-radius * 0.8}
             a ${radius * 1.1} ${radius * 1.1} 0 0 1 ${radius * 1.9} ${radius * 0.1}
             a ${radius * 0.8} ${radius * 0.8} 0 0 1 ${radius * 0.9} ${radius * 0.7}
             Z`,
        fill: "#fff",
        opacity: "0.85",
      });
    }
  out += facing(cx, dir);
  const hx = cx + length * 0.5;
  const tx = cx - length * 0.55;
  // Spout: three jets from the blowhole
  out += el("path", {
    d: s`M ${hx - length * 0.12} ${wy - height * 0.95}
         q ${-length * 0.02} ${-height * 0.6} ${-length * 0.12} ${-height * 0.85}
         M ${hx - length * 0.12} ${wy - height * 0.95}
         q 0 ${-height * 0.7} ${length * 0.03} ${-height * 1}
         M ${hx - length * 0.12} ${wy - height * 0.95}
         q ${length * 0.03} ${-height * 0.55} ${length * 0.14} ${-height * 0.78}`,
    stroke: "#fff",
    "stroke-width": height * 0.09,
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.9",
  });
  // Tail flukes
  out += el("path", {
    d: s`M ${tx + length * 0.1} ${wy - height * 0.2}
         Q ${tx - length * 0.05} ${wy - height * 0.55} ${tx - length * 0.12} ${wy - height * 1.05}
         Q ${tx - length * 0.02} ${wy - height * 0.85} ${tx + length * 0.02} ${wy - height * 0.95}
         Q ${tx + length * 0.05} ${wy - height * 0.82} ${tx + length * 0.16} ${wy - height * 0.98}
         Q ${tx + length * 0.12} ${wy - height * 0.55} ${tx + length * 0.24} ${wy - height * 0.2}
         Z`,
    fill: body,
  });
  // Body
  out += el("path", {
    d: s`M ${tx + length * 0.1} ${wy}
         Q ${cx - length * 0.1} ${wy - height * 0.9} ${hx - length * 0.15} ${wy - height}
         Q ${hx + length * 0.08} ${wy - height * 0.95} ${hx} ${wy - height * 0.2}
         Q ${hx - length * 0.05} ${wy + height * 0.55} ${cx} ${wy + height * 0.5}
         Q ${tx + length * 0.2} ${wy + height * 0.4} ${tx + length * 0.1} ${wy}
         Z`,
    fill: body,
  });
  // Belly line
  out += el("path", {
    d: s`M ${hx - length * 0.02} ${wy - height * 0.25}
         Q ${cx + length * 0.1} ${wy - height * 0.1} ${cx - length * 0.1} ${wy - height * 0.12}`,
    stroke: belly,
    "stroke-width": height * 0.05,
    fill: "none",
    "stroke-linecap": "round",
    opacity: "0.7",
  });
  // Eye
  out += el("circle", { cx: hx - length * 0.14, cy: wy - height * 0.42, r: height * 0.06, fill: "#111" });
  out += "</g>";
  // Sea, over the lower half of the whale
  out += el("rect", { y: hz, width: w, height: h - hz, fill: `url(#${sea})`, opacity: "0.88" });
  // Ripples either side of the whale
  out += el("path", {
    d: s`M ${cx - length * 0.75} ${hz + 2}
         Q ${cx - length * 0.6} ${hz - 4} ${cx - length * 0.45} ${hz + 2}
         M ${cx + length * 0.45} ${hz + 2}
         Q ${cx + length * 0.6} ${hz - 4} ${cx + length * 0.75} ${hz + 2}`,
    stroke: "#fff",
    "stroke-width": "2.5",
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.8",
  });
  note.alt(
    `A whale blowing a spout at the surface${clouds ? " under clouds" : ""}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(cx + dir * length * 0.36, wy - height * 0.42);
  return out;
});

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

/** A frog on a lily pad, with bulging eyes and a wide smile. */
export const frog = defineKind("frog", "Frog", (g, w, h, note) => {
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
  // Spots
  if ("spots" in colors)
    for (let k = g.i(3, 5); k > 0; k--)
      out += el("circle", {
        cx: cx + bw * g.f(-0.85, 0.85),
        cy: by + bh * g.f(-0.6, -0.1),
        r: bw * g.f(0.04, 0.08),
        fill: colors.spots,
      });
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

const RABBITS = [
  { fur: "#f4f1ea", inner: "#f4b6c2" },
  { fur: "#c9b39a", inner: "#f0b6b6" },
  { fur: "#8d7b6a", inner: "#e9a8a8" },
  { fur: "#5a5049", inner: "#d99a9a" },
  { fur: "#e3d3bd", inner: "#f4b6c2" },
] as const;

/** A rabbit in a meadow: tall or lop ears, pink nose, whiskers. */
export const rabbit = defineKind("rabbit", "Rabbit", (g, w, h, note) => {
  const coat = g.pick(RABBITS);
  const size = Math.min(w, h);
  const cx = w / 2;
  const cy = h * 0.58;
  const rx = size * g.f(0.17, 0.2);
  const ry = rx * g.f(0.88, 0.98);
  const lop = g.chance(0.3);
  const gy = h * g.f(0.78, 0.86);
  const sky = g.id("sky");
  const skyHue = g.f(160, 210);
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 45, 80), hsl(skyHue - 20, 50, 94)])) + fill(w, h, `url(#${sky})`);
  // Meadow
  out += el("rect", { y: gy, width: w, height: h - gy, fill: hsl(g.f(85, 120), 40, 52) });
  // Body
  out += el("ellipse", { cx, cy: cy + ry * 1.45, rx: rx * 1.25, ry: ry * 0.95, fill: coat.fur });
  if (!lop) {
    // Tall ears, behind the head, each tilted about its base
    const tilt = g.f(4, 16);
    const len = g.f(1.2, 1.5);
    for (const sd of [-1, 1]) {
      const ex = cx + sd * rx * 0.42;
      const ey = cy - ry * (0.55 + len * 0.6);
      const rot = sd * tilt * (sd < 0 ? 1 : g.f(0.4, 1.6));
      out += el(
        "g",
        { transform: s`rotate(${rot} ${ex} ${cy - ry * 0.6})` },
        el("ellipse", { cx: ex, cy: ey, rx: rx * 0.26, ry: ry * len * 0.62, fill: coat.fur }),
        el("ellipse", { cx: ex, cy: ey + ry * 0.05, rx: rx * 0.13, ry: ry * len * 0.48, fill: coat.inner }),
      );
    }
  }
  // Head
  out += el("ellipse", { cx, cy, rx, ry, fill: coat.fur });
  if (lop) {
    // Lop ears start on top of the head and drape down past the cheeks, angled outward.
    const len = ry * g.f(0.75, 0.9);
    const splay = g.f(18, 30);
    const ear = mix(coat.fur, "#000000", 0.1);
    for (const sd of [-1, 1]) {
      const px = cx + sd * rx * 0.45;
      const py = cy - ry * 0.82;
      out += el("ellipse", {
        cx: px,
        cy: py + len,
        rx: rx * 0.3,
        ry: len,
        fill: ear,
        transform: s`rotate(${-sd * splay} ${px} ${py})`,
      });
    }
    out += el("ellipse", { cx, cy: cy - ry * 0.8, rx: rx * 0.55, ry: ry * 0.2, fill: ear });
  }
  // Eyes and blushing cheeks
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: cx + sd * rx * 0.4, cy: cy - ry * 0.08, r: rx * 0.1, fill: "#1c1512" });
    out += el("circle", {
      cx: cx + sd * rx * 0.55,
      cy: cy + ry * 0.35,
      r: rx * 0.16,
      fill: "#f28b9b",
      opacity: "0.3",
    });
  }
  // Nose
  out += el("polygon", {
    points: pts([
      [cx - rx * 0.09, cy + ry * 0.2],
      [cx + rx * 0.09, cy + ry * 0.2],
      [cx, cy + ry * 0.3],
    ]),
    fill: "#e46f86",
  });
  // Mouth
  out += el("path", {
    d: s`M ${cx} ${cy + ry * 0.3}
         v ${ry * 0.1}
         M ${cx - rx * 0.12} ${cy + ry * 0.46}
         Q ${cx - rx * 0.06} ${cy + ry * 0.5} ${cx} ${cy + ry * 0.4}
         Q ${cx + rx * 0.06} ${cy + ry * 0.5} ${cx + rx * 0.12} ${cy + ry * 0.46}`,
    stroke: "#3a2a2a",
    "stroke-width": rx * 0.035,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Whiskers: two on each side
  let whiskers = "";
  for (const sd of [-1, 1])
    for (const k of [-1, 1])
      whiskers += s`M ${cx + sd * rx * 0.2} ${cy + ry * 0.33 + k * ry * 0.04} L ${cx + sd * rx * 0.95} ${cy + ry * 0.28 + k * ry * 0.14} `;
  out += el("path", { d: whiskers, stroke: "#6b5d55", "stroke-width": rx * 0.02, opacity: "0.6" });
  note.alt(lop ? "A lop-eared rabbit in a meadow" : "A rabbit with tall ears in a meadow");
  note.focus(cx, cy - ry * 0.08);
  // Head and ears: lop ears hang beside the face, tall ones stand above it.
  if (lop) note.frame(cx - rx * 1.3, cy - ry * 1.05, rx * 2.6, ry * 2.1);
  else note.frame(cx - rx * 1.05, cy - ry * 2, rx * 2.1, ry * 3.05);
  return out;
});

/** A snail with a spiral shell on a leaf. */
export const snail = defineKind("snail", "Snail", (g, w, h, note) => {
  const size = Math.min(w, h);
  const gy = h * g.f(0.72, 0.8);
  const dir = g.pick([-1, 1]);
  const cx = w * g.f(0.42, 0.58);
  const shellHue = g.f(10, 45);
  const body = g.pick(["#c9b49a", "#b9a58e", "#d6c3a5", "#9fb39a"]);
  const sr = size * g.f(0.17, 0.21);
  let out = fill(w, h, hsl(g.f(70, 160), 30, g.f(80, 88)));
  // The leaf and its vein
  out += el("path", {
    d: s`M -10 ${gy + h * 0.05}
         Q ${w * 0.3} ${gy - h * 0.06} ${w * 0.55} ${gy}
         T ${w + 10} ${gy - h * 0.02}
         V ${h} H -10 Z`,
    fill: hsl(g.f(90, 125), 42, 42),
  });
  out += el("path", {
    d: s`M -10 ${gy + h * 0.12}
         Q ${w * 0.5} ${gy + h * 0.02} ${w + 10} ${gy + h * 0.1}`,
    stroke: hsl(g.f(90, 125), 40, 30),
    "stroke-width": "2",
    fill: "none",
    opacity: "0.5",
  });
  out += facing(cx, dir);
  const by = gy - size * 0.02;
  const bl = sr * 2.4;
  // Body, rising into the head at the front
  out += el("path", {
    d: s`M ${cx - bl * 0.6} ${by}
         Q ${cx} ${by - sr * 0.1} ${cx + bl * 0.45} ${by - sr * 0.12}
         Q ${cx + bl * 0.58} ${by - sr * 0.25} ${cx + bl * 0.6} ${by - sr * 0.9}
         Q ${cx + bl * 0.7} ${by - sr * 1.05} ${cx + bl * 0.78} ${by - sr * 0.85}
         Q ${cx + bl * 0.8} ${by - sr * 0.2} ${cx + bl * 0.65} ${by + sr * 0.02}
         Q ${cx} ${by + sr * 0.2} ${cx - bl * 0.6} ${by}
         Z`,
    fill: body,
  });
  // Eye stalks and eyes
  const ex = cx + bl * 0.66;
  const ey = by - sr * 0.85;
  out += el("path", {
    d: s`M ${ex} ${ey} L ${ex - sr * 0.08} ${ey - sr * 0.55}
         M ${ex + sr * 0.08} ${ey} L ${ex + sr * 0.22} ${ey - sr * 0.5}`,
    stroke: body,
    "stroke-width": sr * 0.07,
    "stroke-linecap": "round",
  });
  out += el("circle", { cx: ex - sr * 0.08, cy: ey - sr * 0.58, r: sr * 0.07, fill: "#2a2320" });
  out += el("circle", { cx: ex + sr * 0.22, cy: ey - sr * 0.53, r: sr * 0.07, fill: "#2a2320" });
  // Shell with a spiral and a highlight
  const sx = cx - sr * 0.1;
  const sy = by - sr * 0.95;
  out += el("circle", { cx: sx, cy: sy, r: sr, fill: hsl(shellHue, 55, 52) });
  let angle = 0;
  let radius = sr * 0.85;
  const ring: Point[] = [];
  for (let k = 0; k < 28; k++) {
    ring.push([sx + Math.cos(angle) * radius, sy + Math.sin(angle) * radius]);
    angle += 0.42;
    radius *= 0.93;
  }
  const spiral =
    s`M ${ring[0][0]} ${ring[0][1]}` +
    ring
      .slice(1)
      .map(p => s` L ${p[0]} ${p[1]}`)
      .join("");
  out += el("path", {
    d: spiral,
    stroke: hsl(shellHue + 10, 50, 32),
    "stroke-width": sr * 0.09,
    fill: "none",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  out += el("circle", { cx: sx - sr * 0.35, cy: sy - sr * 0.4, r: sr * 0.18, fill: "#fff", opacity: "0.25" });
  out += "</g>";
  note.alt(`A snail with a spiral shell on a leaf, facing ${dir > 0 ? "right" : "left"}`);
  note.focus(cx + dir * (ex + sr * 0.07 - cx), ey - sr * 0.4);
  return out;
});

export const animals = [dog, fox, penguin, whale, frog, rabbit, snail];
