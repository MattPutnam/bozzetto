import { defineKind, el, facing, fill, hsl, lin, mix, pts, qpt, s, type Notes, type Point, type Rand } from "./core";
import { blob } from "./shapes";
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
    for (let k = g.i(3, 5); k > 0; k--) {
      // A spot somewhere on the upper face, pulled in if it would hang over the edge of the head.
      let dx = rx * g.f(-0.8, 0.8);
      let dy = ry * g.f(-0.8, 0.1);
      const r = rx * g.f(0.06, 0.12);
      const reach = (dx / (rx - r * 1.3)) ** 2 + (dy / (ry - r * 1.3)) ** 2;
      if (reach > 1) {
        dx /= Math.sqrt(reach);
        dy /= Math.sqrt(reach);
      }
      out += el("circle", { cx: cx + dx, cy: cy + dy, r, fill: "#2b2b2b" });
    }
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

// Scenery and shapes shared by the larger mammals below.

/** Where an x drawn inside `facing(cx, dir)` ends up. */
const flipX = (cx: number, dir: number, x: number): number => cx + dir * (x - cx);

/** Reports a head frame measured inside `facing(cx, dir)`, flipped the same way. */
function flipFrame(note: Notes, cx: number, dir: number, x: number, y: number, fw: number, fh: number): void {
  note.frame(dir > 0 ? x : 2 * cx - x - fw, y, fw, fh);
}

/** A straight limb: a thick line with round ends. */
const limb = (x1: number, y1: number, x2: number, y2: number, width: number, paint: string): string =>
  el("path", { d: s`M ${x1} ${y1} L ${x2} ${y2}`, stroke: paint, "stroke-width": width, "stroke-linecap": "round" });

/** A bent limb from (x1, y1) through control (qx, qy) to (x2, y2), with a round paw at the end. */
function arm(
  x1: number,
  y1: number,
  qx: number,
  qy: number,
  x2: number,
  y2: number,
  width: number,
  paint: string,
): string {
  return (
    el("path", {
      d: s`M ${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`,
      stroke: paint,
      "stroke-width": width,
      "stroke-linecap": "round",
      fill: "none",
    }) + el("ellipse", { cx: x2, cy: y2, rx: width * 0.62, ry: width * 0.55, fill: paint })
  );
}

/** Path data for a tube along a quadratic curve, `w0` wide at p0 and `w1` at p2, with round ends. */
function tube(p0: Point, p1: Point, p2: Point, w0: number, w1: number): string {
  const steps = 8;
  const left: Point[] = [];
  const right: Point[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const [x, y] = qpt(p0, p1, p2, t);
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy) || 1;
    const half = (w0 + (w1 - w0) * t) / 2;
    left.push([x - (dy / len) * half, y + (dx / len) * half]);
    right.push([x + (dy / len) * half, y - (dx / len) * half]);
  }
  const line = (ps: Point[]) => ps.map(p => s`L ${p[0]} ${p[1]}`).join(" ");
  const end = right[steps];
  return (
    s`M ${left[0][0]} ${left[0][1]} ${line(left.slice(1))}` +
    s` A ${w1 / 2} ${w1 / 2} 0 0 0 ${end[0]} ${end[1]} ${line(right.reverse().slice(1))}` +
    s` A ${w0 / 2} ${w0 / 2} 0 0 0 ${left[0][0]} ${left[0][1]} Z`
  );
}

/** Path data for a narrow leaf from its stem at (x, y), pointing `angle` degrees, `len` long. */
function leafShape(x: number, y: number, angle: number, len: number, thin: number): string {
  const ux = Math.cos((angle * Math.PI) / 180);
  const uy = Math.sin((angle * Math.PI) / 180);
  const mx = x + ux * len * 0.5;
  const my = y + uy * len * 0.5;
  const nx = -uy * len * thin;
  const ny = ux * len * thin;
  return s`M ${x} ${y} Q ${mx + nx} ${my + ny} ${x + ux * len} ${y + uy * len} Q ${mx - nx} ${my - ny} ${x} ${y} Z `;
}

/** Path data for a woolly outline: arcs bulging out between points around an ellipse. */
function fluff(cx: number, cy: number, rx: number, ry: number, bumps: number, phase: number): string {
  const ring: Point[] = [];
  for (let k = 0; k < bumps; k++) {
    const angle = phase + (k / bumps) * Math.PI * 2;
    ring.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }
  let d = s`M ${ring[0][0]} ${ring[0][1]}`;
  for (let k = 0; k < bumps; k++) {
    const [x0, y0] = ring[k];
    const [x1, y1] = ring[(k + 1) % bumps];
    const r = Math.hypot(x1 - x0, y1 - y0) * 0.6;
    d += s` A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  }
  return d + " Z";
}

/** A sky over a far hill, and level ground from the horizon down. `ground` is [hue, saturation, lightness]. */
function field(
  g: Rand,
  w: number,
  h: number,
  hz: number,
  skyHue: number,
  ground: readonly number[],
  behind = "",
): string {
  const sky = g.id("sky");
  const [gh, gs, gl] = ground;
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 45, 76), hsl(skyHue - 15, 50, 93)])) + fill(w, h, `url(#${sky})`);
  out += behind;
  // A far hill on the horizon
  out += el("ellipse", {
    cx: w * g.f(0.1, 0.9),
    cy: hz,
    rx: w * g.f(0.4, 0.7),
    ry: hz * g.f(0.12, 0.25),
    fill: hsl(gh, gs - 8, gl + (gl > 80 ? -5 : 9)),
  });
  // Ground
  out += el("rect", { y: hz, width: w, height: h - hz, fill: hsl(gh, gs, gl) });
  return out;
}

/** A pine tree standing at (x, base). */
function pine(x: number, base: number, tall: number, paint: string): string {
  const half = tall * 0.24;
  const top = base - tall;
  const right: Point[] = [
    [x, top],
    [x + half * 0.5, top + tall * 0.3],
    [x + half * 0.25, top + tall * 0.3],
    [x + half * 0.8, top + tall * 0.58],
    [x + half * 0.4, top + tall * 0.58],
    [x + half, top + tall * 0.86],
  ];
  const left = right
    .slice(1)
    .reverse()
    .map(([px, py]): Point => [2 * x - px, py]);
  return (
    el("rect", { x: x - half * 0.1, y: top + tall * 0.8, width: half * 0.2, height: tall * 0.2, fill: "#5a4030" }) +
    el("polygon", { points: pts([...right, ...left]), fill: paint })
  );
}

/** A flat-topped acacia tree standing at (x, base). */
function acacia(x: number, base: number, tall: number, leaves: string): string {
  return (
    el("path", {
      d: s`M ${x} ${base} L ${x} ${base - tall * 0.55} L ${x - tall * 0.28} ${base - tall * 0.86}
           M ${x} ${base - tall * 0.55} L ${x + tall * 0.3} ${base - tall * 0.88}`,
      stroke: "#5a4632",
      "stroke-width": tall * 0.05,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      fill: "none",
    }) +
    el("ellipse", { cx: x, cy: base - tall * 0.9, rx: tall * 0.55, ry: tall * 0.12, fill: leaves }) +
    el("ellipse", { cx: x + tall * 0.08, cy: base - tall * 0.98, rx: tall * 0.34, ry: tall * 0.08, fill: leaves })
  );
}

/** Golden grassland under a sun, with a far acacia tree. */
function savanna(g: Rand, w: number, h: number, hz: number, dusk: boolean): string {
  const size = Math.min(w, h);
  const sun = el("circle", {
    cx: w * g.f(0.1, 0.9),
    cy: hz * g.f(0.3, 0.7),
    r: size * g.f(0.06, 0.09),
    fill: dusk ? "#f6a04e" : "#fff4c8",
    opacity: "0.9",
  });
  let out = field(g, w, h, hz, dusk ? g.f(25, 40) : g.f(190, 210), [g.f(38, 50), 45, g.f(58, 66)], sun);
  // A far acacia
  out += acacia(w * g.f(0.05, 0.95), hz + (h - hz) * 0.06, size * g.f(0.22, 0.3), hsl(g.f(80, 110), 30, 38));
  return out;
}

/** A rail fence across the picture, its posts standing on y. */
function fence(w: number, y: number, tall: number, paint: string): string {
  let d = "";
  for (let x = tall * 0.4; x < w; x += tall * 1.6) d += s`M ${x} ${y} v ${-tall} h ${tall * 0.14} v ${tall} Z `;
  d += s`M 0 ${y - tall * 0.8} h ${w} v ${tall * 0.1} h ${-w} Z M 0 ${y - tall * 0.45} h ${w} v ${tall * 0.1} h ${-w} Z`;
  return el("path", { d, fill: paint });
}

/** A bamboo stalk from (x0, y0) to (x1, y1), with joints and `leaves` leaves on its upper part. */
function bamboo(
  g: Rand,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  paint: string,
  leaf: string,
  leaves: number,
): string {
  const gap = width * 5;
  let out = limb(x0, y0, x1, y1, width, paint);
  // Joints
  out += el("path", {
    d: s`M ${x0} ${y0} L ${x1} ${y1}`,
    stroke: "#000",
    "stroke-opacity": "0.22",
    "stroke-width": width,
    "stroke-dasharray": s`${width * 0.3} ${gap}`,
  });
  let d = "";
  for (let k = 0; k < leaves; k++) {
    const t = g.f(0.55, 1);
    const angle = g.pick([-1, 1]) * g.f(15, 70) + g.pick([0, 180]);
    d += leafShape(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, angle, width * g.f(4.4, 6.4), 0.25);
  }
  return out + el("path", { d, fill: leaf });
}

const BEARS = {
  brown: [
    { fur: "#8a5a36", muzzle: "#c49a72", pad: "#4a3020" },
    { fur: "#a26c3e", muzzle: "#d6b088", pad: "#553722" },
  ],
  black: [{ fur: "#2b2725", muzzle: "#b48a62", pad: "#4d4440" }],
  polar: [{ fur: "#f1ede2", muzzle: "#f8f6ef", pad: "#3a3634" }],
} as const;

/** A bear sitting up: brown or black in a pine wood, or a polar bear on the snow. */
export const bear = defineKind("bear", "Bear", { coat: ["brown", "black", "polar"] }, (g, w, h, note) => {
  const species = g.option("coat", g.pick(["brown", "brown", "black", "polar"] as const));
  const coats: readonly { fur: string; muzzle: string; pad: string }[] = BEARS[species];
  const coat = g.pick(coats);
  const polar = species === "polar";
  const size = Math.min(w, h);
  const cx = w * g.f(0.42, 0.58);
  const hz = h * g.f(0.55, 0.65);
  const gy = h * g.f(0.85, 0.9);
  const bw = size * g.f(0.2, 0.23);
  const bh = bw * g.f(1, 1.1);
  const by = gy - bh * 0.92;
  const rx = bw * 0.62;
  const ry = rx * 0.9;
  const hy = by - bh * 0.88;
  const fx = cx + rx * g.f(-0.14, 0.14);
  const tilt = g.f(-8, 8);
  // A shade for arms and feet; on a black coat it is a little lighter instead.
  const shade = species === "black" ? mix(coat.fur, "#ffffff", 0.1) : mix(coat.fur, "#000000", polar ? 0.07 : 0.12);
  const wave = g.chance(0.25) ? g.pick([-1, 1]) : 0;
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(190, 215), polar ? [205, 35, 95] : [scene.f(85, 115), 35, 48]);
  if (polar)
    // Ice ridges on the horizon
    for (let k = scene.i(1, 3); k > 0; k--) {
      const x = w * scene.f(-0.1, 0.9);
      const wide = w * scene.f(0.15, 0.35);
      const tall = h * scene.f(0.08, 0.2);
      out += el("polygon", {
        points: pts([
          [x, hz],
          [x + wide * scene.f(0.2, 0.4), hz - tall],
          [x + wide * scene.f(0.55, 0.8), hz - tall * scene.f(0.6, 0.95)],
          [x + wide, hz],
        ]),
        fill: hsl(205, 30, scene.f(84, 91)),
      });
    }
  else
    // Pines along the edge of the wood
    for (let k = scene.i(3, 6); k > 0; k--)
      out += pine(
        w * scene.f(0, 1),
        hz + (gy - hz) * scene.f(0, 0.12),
        size * scene.f(0.25, 0.45),
        hsl(scene.f(130, 160), 30, scene.f(26, 36)),
      );
  // Shadow
  out += el("ellipse", { cx, cy: gy, rx: bw * 1.35, ry: bw * 0.13, fill: "#000", opacity: "0.15" });
  // Body
  out += el("ellipse", { cx, cy: by, rx: bw, ry: bh, fill: coat.fur });
  // Hind feet, soles toward us
  for (const sd of [-1, 1]) {
    out += el("ellipse", { cx: cx + sd * bw * 0.62, cy: gy - bw * 0.16, rx: bw * 0.3, ry: bw * 0.21, fill: shade });
    out += el("ellipse", { cx: cx + sd * bw * 0.62, cy: gy - bw * 0.13, rx: bw * 0.17, ry: bw * 0.11, fill: coat.pad });
  }
  // Arms: resting on the belly, or one raised in a wave
  for (const sd of [-1, 1]) {
    out +=
      sd === wave
        ? arm(
            cx + sd * bw * 0.62,
            by - bh * 0.45,
            cx + sd * bw * 1.15,
            by - bh * 0.5,
            cx + sd * bw * 1.05,
            by - bh * 1.05,
            bw * 0.32,
            shade,
          )
        : arm(
            cx + sd * bw * 0.66,
            by - bh * 0.5,
            cx + sd * bw * 0.85,
            by + bh * 0.15,
            cx + sd * bw * 0.36,
            by + bh * 0.42,
            bw * 0.32,
            shade,
          );
  }
  // Head, tilted a little, with the face turned a little
  out += s`<g transform="rotate(${tilt} ${cx} ${hy + ry})">`;
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: cx + sd * rx * 0.72, cy: hy - ry * 0.72, r: rx * 0.3, fill: coat.fur });
    out += el("circle", { cx: cx + sd * rx * 0.72, cy: hy - ry * 0.7, r: rx * 0.15, fill: shade });
  }
  out += el("ellipse", { cx, cy: hy, rx, ry, fill: coat.fur });
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.38, rx: rx * 0.42, ry: ry * 0.32, fill: coat.muzzle });
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.24, rx: rx * 0.15, ry: ry * 0.1, fill: "#1f1714" });
  out += el("path", {
    d: s`M ${fx} ${hy + ry * 0.32} v ${ry * 0.14}
         M ${fx - rx * 0.12} ${hy + ry * 0.5} Q ${fx} ${hy + ry * 0.6} ${fx + rx * 0.12} ${hy + ry * 0.5}`,
    stroke: "#1f1714",
    "stroke-width": rx * 0.04,
    fill: "none",
    "stroke-linecap": "round",
  });
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: fx + sd * rx * 0.36, cy: hy - ry * 0.1, r: rx * 0.08, fill: "#1a1310" });
    out += el("circle", { cx: fx + sd * rx * 0.36 + rx * 0.03, cy: hy - ry * 0.13, r: rx * 0.025, fill: "#ffffff" });
  }
  out += "</g>";
  note.alt(
    `${polar ? "A polar bear sitting on the snow" : "A bear sitting at the edge of a pine wood"}${wave ? ", waving a paw" : ""}`,
  );
  note.focus(fx, hy);
  // Head and ears.
  note.frame(cx - rx * 1.2, hy - ry * 1.25, rx * 2.4, ry * 2.4);
  return out;
});

/** A giant panda sitting in a bamboo grove, holding a stalk of bamboo. */
export const panda = defineKind("panda", "Panda", (g, w, h, note) => {
  const white = g.pick(["#f6f4ee", "#f1eee5", "#faf8f2"]);
  const black = g.pick(["#1f1d1f", "#2a2628", "#2b2622"]);
  const size = Math.min(w, h);
  const cx = w * g.f(0.42, 0.58);
  const hz = h * g.f(0.58, 0.68);
  const gy = h * g.f(0.85, 0.9);
  const bw = size * g.f(0.2, 0.23);
  const bh = bw * g.f(1, 1.08);
  const by = gy - bh * 0.92;
  const rx = bw * 0.66;
  const ry = rx * 0.88;
  const hy = by - bh * 0.86;
  const fx = cx + rx * g.f(-0.12, 0.12);
  const leafHue = g.f(85, 120);
  const leaf = hsl(leafHue, 45, g.f(32, 42));
  const side = g.pick([-1, 1]);
  const chewing = g.chance(0.35);
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(150, 200), [leafHue - 5, 35, 46]);
  // Bamboo grove behind
  for (let k = scene.i(5, 9); k > 0; k--) {
    const x = w * scene.f(0, 1);
    out += bamboo(
      scene,
      x,
      hz + (gy - hz) * scene.f(0, 0.3),
      x + h * scene.f(-0.06, 0.06),
      -size * 0.05,
      size * scene.f(0.022, 0.034),
      hsl(leafHue + scene.f(-10, 10), 35, scene.f(46, 60)),
      leaf,
      2,
    );
  }
  // Shadow
  out += el("ellipse", { cx, cy: gy, rx: bw * 1.35, ry: bw * 0.13, fill: "#000", opacity: "0.15" });
  // Body and the black band over the shoulders
  out += el("ellipse", { cx, cy: by, rx: bw, ry: bh, fill: white });
  out += el("ellipse", { cx, cy: by - bh * 0.52, rx: bw * 0.8, ry: bh * 0.34, fill: black });
  // Hind legs, soles toward us
  for (const sd of [-1, 1]) {
    out += el("ellipse", { cx: cx + sd * bw * 0.6, cy: gy - bw * 0.2, rx: bw * 0.36, ry: bw * 0.26, fill: black });
    out += el("ellipse", {
      cx: cx + sd * bw * 0.62,
      cy: gy - bw * 0.17,
      rx: bw * 0.17,
      ry: bw * 0.11,
      fill: "#4a4446",
    });
  }
  // The stalk it holds, resting in its lap
  const paw: Point = [cx + side * bw * 0.4, by + bh * 0.08];
  out += bamboo(
    g,
    paw[0] - side * bw * 0.2,
    by + bh * 0.62,
    cx + side * bw * 1.25,
    hy - ry * g.f(1.2, 1.6),
    size * 0.032,
    hsl(leafHue, 40, 55),
    leaf,
    3,
  );
  // Arms: one holds the stalk, the other rests on the belly
  for (const sd of [-1, 1]) {
    const [px, py] = sd === side ? paw : [cx + sd * bw * 0.3, by + bh * 0.38];
    out += arm(cx + sd * bw * 0.66, by - bh * 0.48, cx + sd * bw * 0.88, by + bh * 0.1, px, py, bw * 0.34, black);
  }
  // Ears and head
  for (const sd of [-1, 1])
    out += el("circle", { cx: cx + sd * rx * 0.76, cy: hy - ry * 0.72, r: rx * 0.3, fill: black });
  out += el("ellipse", { cx, cy: hy, rx, ry, fill: white });
  // Eye patches, drooping outward, with small eyes
  for (const sd of [-1, 1]) {
    const ex = fx + sd * rx * 0.38;
    const ey = hy - ry * 0.02;
    out += el("ellipse", {
      cx: ex,
      cy: ey,
      rx: rx * 0.18,
      ry: rx * 0.27,
      fill: black,
      transform: s`rotate(${-sd * 35} ${ex} ${ey})`,
    });
    out += el("circle", { cx: ex - sd * rx * 0.02, cy: ey - ry * 0.06, r: rx * 0.065, fill: "#ffffff" });
    out += el("circle", { cx: ex - sd * rx * 0.02, cy: ey - ry * 0.06, r: rx * 0.035, fill: "#111111" });
  }
  // Muzzle, nose and mouth
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.45, rx: rx * 0.34, ry: ry * 0.25, fill: mix(white, "#000000", 0.04) });
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.32, rx: rx * 0.13, ry: ry * 0.09, fill: black });
  out += el("path", {
    d: s`M ${fx} ${hy + ry * 0.38} v ${ry * 0.12}
         M ${fx - rx * 0.11} ${hy + ry * 0.55} Q ${fx} ${hy + ry * 0.63} ${fx + rx * 0.11} ${hy + ry * 0.55}`,
    stroke: black,
    "stroke-width": rx * 0.04,
    fill: "none",
    "stroke-linecap": "round",
  });
  if (chewing) {
    // A bamboo leaf poking out of the corner of its mouth
    const lx = fx + side * rx * 0.28;
    const ly = hy + ry * 0.58;
    out += el("ellipse", {
      cx: lx,
      cy: ly,
      rx: rx * 0.26,
      ry: rx * 0.06,
      fill: leaf,
      transform: s`rotate(${side * 20} ${lx - side * rx * 0.2} ${ly})`,
    });
  }
  note.alt(`A panda sitting in a bamboo grove, holding a stalk of bamboo${chewing ? " and chewing a leaf" : ""}`);
  note.focus(fx, hy);
  // Head and ears.
  note.frame(cx - rx * 1.2, hy - ry * 1.2, rx * 2.4, ry * 2.35);
  return out;
});

/** An elephant on the savanna, side on, with its trunk hanging or raised. */
export const elephant = defineKind("elephant", "Elephant", (g, w, h, note) => {
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

const LIONS = [
  { fur: "#d9a55b", mane: "#94562a", light: "#f3dcae" },
  { fur: "#c8955a", mane: "#6b3c22", light: "#ecd4a6" },
  { fur: "#e2b670", mane: "#b2682f", light: "#f7e4bd" },
  { fur: "#cf9f6c", mane: "#4d2e1f", light: "#efdabb" },
] as const;

/** A lion with a shaggy mane, or a lioness, sitting up on the savanna. */
export const lion = defineKind("lion", "Lion", { mane: [true, false] }, (g, w, h, note) => {
  const coat = g.pick(LIONS);
  const mane = g.option("mane", g.chance(0.65));
  const size = Math.min(w, h);
  const cx = w * g.f(0.42, 0.58);
  const hz = h * g.f(0.55, 0.65);
  const gy = h * g.f(0.86, 0.9);
  const bw = size * g.f(0.17, 0.19);
  const bh = bw * 1.3;
  const rx = bw * (mane ? 0.6 : 0.56);
  const ry = rx * 1.02;
  const hy = gy - bh * 1.85;
  const fx = cx + rx * g.f(-0.12, 0.12);
  const tailSide = g.pick([-1, 1]);
  const dusk = g.chance(0.35);
  const shade = mix(coat.fur, "#000000", 0.12);
  let out = savanna(g.fork("scene"), w, h, hz, dusk);
  // Shadow
  out += el("ellipse", { cx, cy: gy, rx: bw * 1.5, ry: bw * 0.14, fill: "#000", opacity: "0.15" });
  // Tail along the ground, flicking up at the tuft
  const tip: Point = [cx + tailSide * bw * 1.6, gy - bw * 0.32];
  out += el("path", {
    d: s`M ${cx + tailSide * bw * 0.95} ${gy - bw * 0.2} Q ${cx + tailSide * bw * 1.5} ${gy + bw * 0.04} ${tip[0]} ${tip[1]}`,
    stroke: coat.fur,
    "stroke-width": bw * 0.1,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("ellipse", { cx: tip[0], cy: tip[1] - bw * 0.06, rx: bw * 0.07, ry: bw * 0.11, fill: coat.mane });
  // Haunches and hind paws
  for (const sd of [-1, 1]) {
    out += el("ellipse", { cx: cx + sd * bw * 0.62, cy: gy - bw * 0.48, rx: bw * 0.52, ry: bw * 0.48, fill: shade });
    out += el("ellipse", { cx: cx + sd * bw * 0.85, cy: gy - bw * 0.08, rx: bw * 0.22, ry: bw * 0.1, fill: shade });
  }
  // Chest
  out += el("ellipse", { cx, cy: gy - bh * 0.9, rx: bw * 0.8, ry: bh * 0.92, fill: coat.fur });
  out += el("ellipse", { cx, cy: gy - bh * 1.25, rx: bw * 0.4, ry: bh * 0.42, fill: coat.light });
  // Front legs, edged in shadow, and paws
  for (const sd of [-1, 1]) {
    const lx = cx + sd * bw * 0.3;
    out += limb(lx, gy - bh * 0.9, lx, gy - bw * 0.15, bw * 0.36, shade);
    out += limb(lx, gy - bh * 0.9, lx, gy - bw * 0.15, bw * 0.28, coat.fur);
    out += el("ellipse", { cx: lx + sd * bw * 0.03, cy: gy - bw * 0.1, rx: bw * 0.21, ry: bw * 0.12, fill: coat.fur });
  }
  if (mane) {
    // The mane, with a lighter ring around the face
    const m = g.fork("mane");
    out += el("path", { d: blob(m, cx, hy + ry * 0.2, rx * 1.7, ry * 1.75, 10, 0.07), fill: coat.mane });
    out += el("path", {
      d: blob(m, cx, hy + ry * 0.12, rx * 1.38, ry * 1.42, 9, 0.06),
      fill: mix(coat.mane, coat.fur, 0.45),
    });
  }
  // Ears and head
  for (const sd of [-1, 1]) {
    out += el("circle", { cx: cx + sd * rx * 0.72, cy: hy - ry * 0.72, r: rx * 0.24, fill: coat.fur });
    out += el("circle", { cx: cx + sd * rx * 0.72, cy: hy - ry * 0.7, r: rx * 0.12, fill: shade });
  }
  out += el("ellipse", { cx, cy: hy, rx, ry, fill: coat.fur });
  // Nose bridge, whisker pads and chin
  out += el("ellipse", {
    cx: fx,
    cy: hy + ry * 0.08,
    rx: rx * 0.2,
    ry: ry * 0.42,
    fill: mix(coat.fur, coat.light, 0.5),
  });
  for (const sd of [-1, 1])
    out += el("ellipse", { cx: fx + sd * rx * 0.2, cy: hy + ry * 0.5, rx: rx * 0.26, ry: ry * 0.2, fill: coat.light });
  out += el("ellipse", { cx: fx, cy: hy + ry * 0.74, rx: rx * 0.2, ry: ry * 0.13, fill: coat.light });
  // Nose and mouth
  out += el("path", {
    d: s`M ${fx - rx * 0.15} ${hy + ry * 0.28} L ${fx + rx * 0.15} ${hy + ry * 0.28}
         Q ${fx + rx * 0.08} ${hy + ry * 0.42} ${fx} ${hy + ry * 0.44}
         Q ${fx - rx * 0.08} ${hy + ry * 0.42} ${fx - rx * 0.15} ${hy + ry * 0.28} Z`,
    fill: "#8a4a3e",
  });
  out += el("path", {
    d: s`M ${fx} ${hy + ry * 0.44} v ${ry * 0.12}
         M ${fx - rx * 0.16} ${hy + ry * 0.6} Q ${fx - rx * 0.08} ${hy + ry * 0.66} ${fx} ${hy + ry * 0.56}
         Q ${fx + rx * 0.08} ${hy + ry * 0.66} ${fx + rx * 0.16} ${hy + ry * 0.6}`,
    stroke: "#3a2418",
    "stroke-width": rx * 0.035,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Amber eyes
  for (const sd of [-1, 1]) {
    out += el("ellipse", {
      cx: fx + sd * rx * 0.34,
      cy: hy - ry * 0.12,
      rx: rx * 0.11,
      ry: ry * 0.075,
      fill: "#d79a2e",
    });
    out += el("circle", { cx: fx + sd * rx * 0.34, cy: hy - ry * 0.12, r: rx * 0.05, fill: "#1a1008" });
  }
  note.alt(`${mane ? "A lion with a shaggy mane" : "A lioness"} sitting on the savanna${dusk ? " at dusk" : ""}`);
  note.focus(fx, hy);
  // Head and ears, with the mane around them.
  if (mane) note.frame(cx - rx * 1.8, hy - ry * 1.6, rx * 3.6, ry * 3.4);
  else note.frame(cx - rx * 1.15, hy - ry * 1.15, rx * 2.3, ry * 2.1);
  return out;
});

const GIRAFFES = [
  { base: "#f0d39a", spot: "#a0592a" },
  { base: "#ecc98a", spot: "#7a4424" },
  { base: "#f4dcae", spot: "#b8722f" },
  { base: "#e8c690", spot: "#8a4f2e" },
] as const;

/** A giraffe on the savanna, side on, sometimes browsing an acacia. */
export const giraffe = defineKind("giraffe", "Giraffe", (g, w, h, note) => {
  const coat = g.pick(GIRAFFES);
  const far = mix(coat.base, "#000000", 0.15);
  const dir = g.pick([-1, 1]);
  const tall = Math.min(h * 0.84, w * 1.15) * g.f(0.9, 1);
  const hz = h * g.f(0.6, 0.7);
  const gy = h * g.f(0.92, 0.95);
  const cx = w / 2 - dir * tall * 0.1 + w * g.f(-0.03, 0.03);
  const lean = (g.f(8, 30) * Math.PI) / 180;
  const legLen = tall * 0.4;
  const lw = tall * 0.045;
  const cy = gy - legLen - tall * 0.05;
  const n0: Point = [cx + tall * 0.15, cy - tall * 0.05];
  const nl = tall * 0.4;
  const n2: Point = [n0[0] + nl * Math.sin(lean), n0[1] - nl * Math.cos(lean)];
  const n1: Point = [(n0[0] + n2[0]) / 2 - nl * 0.04, (n0[1] + n2[1]) / 2];
  const browsing = g.chance(0.4);
  const stride = g.chance(0.5) ? tall * g.f(0.03, 0.05) : 0;
  const dusk = g.chance(0.3);
  let out = savanna(g.fork("scene"), w, h, hz, dusk);
  // Shadow
  out += el("ellipse", {
    cx: cx + dir * tall * 0.02,
    cy: gy,
    rx: tall * 0.3,
    ry: tall * 0.025,
    fill: "#000",
    opacity: "0.15",
  });
  out += facing(cx, dir);
  // An acacia it browses from, its crown at the height of the giraffe's head
  if (browsing) {
    const crownY = n2[1] + tall * 0.03;
    const treeBase = gy - tall * 0.04;
    out += acacia(n2[0] + tall * 0.22, treeBase, (treeBase - crownY) / 0.9, hsl(g.f(80, 110), 32, 40));
  }
  // Legs: far ones first and darker, all under the body
  const back = cx - tall * 0.14;
  const front = cx + tall * 0.13;
  const hoof = (x: number, foot: number, paint: string) => limb(x, foot - tall * 0.03, x, foot, lw, paint);
  out +=
    limb(back + lw, cy, back + lw - stride, gy - tall * 0.01, lw * 0.95, far) +
    hoof(back + lw - stride, gy - tall * 0.01, "#3a2a22");
  out +=
    limb(front + lw, cy, front + lw + stride, gy - tall * 0.01, lw * 0.95, far) +
    hoof(front + lw + stride, gy - tall * 0.01, "#3a2a22");
  out += limb(back, cy, back + stride, gy, lw, coat.base) + hoof(back + stride, gy, "#3a2a22");
  out += limb(front, cy, front - stride, gy, lw, coat.base) + hoof(front - stride, gy, "#3a2a22");
  // Tail with a tuft
  const tailEnd: Point = [cx - tall * 0.235, cy + tall * 0.17];
  out += el("path", {
    d: s`M ${cx - tall * 0.21} ${cy - tall * 0.03} Q ${cx - tall * 0.24} ${cy + tall * 0.05} ${tailEnd[0]} ${tailEnd[1]}`,
    stroke: coat.base,
    "stroke-width": tall * 0.012,
    fill: "none",
  });
  out += el("ellipse", {
    cx: tailEnd[0],
    cy: tailEnd[1] + tall * 0.02,
    rx: tall * 0.01,
    ry: tall * 0.025,
    fill: "#3a2a22",
  });
  // Mane, showing along the back of the neck
  out += el("path", {
    d: tube(
      [n0[0] - tall * 0.03, n0[1]],
      [n1[0] - tall * 0.022, n1[1]],
      [n2[0] - tall * 0.018, n2[1] + tall * 0.01],
      tall * 0.1,
      tall * 0.05,
    ),
    fill: coat.spot,
  });
  // Body and neck, with patches clipped to them
  const body = el("ellipse", { cx, cy, rx: tall * 0.22, ry: tall * 0.1, transform: s`rotate(-10 ${cx} ${cy})` });
  const neck = el("path", { d: tube(n0, n1, n2, tall * 0.11, tall * 0.05) });
  const clip = g.id("hide");
  out += el("defs", {}, el("clipPath", { id: clip }, body, neck));
  out += el("rect", {
    x: cx - tall * 0.25,
    y: n2[1] - tall * 0.05,
    width: tall * 0.6,
    height: cy - n2[1] + tall * 0.2,
    fill: coat.base,
    "clip-path": `url(#${clip})`,
  });
  // Patches on a jittered grid, kept to the body and neck
  const step = tall * g.f(0.05, 0.065);
  const centre: Point[] = [];
  for (let k = 0; k <= 10; k++) centre.push(qpt(n0, n1, n2, k / 10));
  let patches = "";
  for (let y = n2[1] - step; y < cy + tall * 0.12; y += step * 0.95)
    for (let x = cx - tall * 0.24; x < n2[0] + step; x += step) {
      const px = x + step * g.f(-0.2, 0.2) + (Math.round(y / step) % 2) * step * 0.5;
      const py = y + step * g.f(-0.2, 0.2);
      const inBody = ((px - cx) / (tall * 0.24)) ** 2 + ((py - cy) / (tall * 0.12)) ** 2 < 1;
      const nearNeck = centre.some(([nx, ny]) => Math.hypot(px - nx, py - ny) < tall * 0.07);
      if (!inBody && !nearNeck) continue;
      const r = step * 0.42 * g.f(0.85, 1.1);
      const ring: Point[] = [];
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI * 2 + g.f(-0.3, 0.3);
        ring.push([px + Math.cos(a) * r * g.f(0.75, 1.15), py + Math.sin(a) * r * g.f(0.75, 1.15)]);
      }
      patches += `M${pts(ring).replace(/ /g, "L")}Z`;
    }
  out += el("path", {
    d: patches,
    fill: coat.spot,
    stroke: coat.spot,
    "stroke-width": step * 0.12,
    "stroke-linejoin": "round",
    "clip-path": `url(#${clip})`,
  });
  // Head, pointing down and forward
  const hc: Point = [n2[0] + tall * 0.05, n2[1] + tall * 0.02];
  // Horns with dark knobs
  for (const k of [-1, 1]) {
    const bx = n2[0] - tall * 0.008 + k * tall * 0.012;
    out += limb(bx, n2[1] - tall * 0.01, bx - tall * 0.01, n2[1] - tall * 0.06, tall * 0.012, coat.base);
    out += el("circle", { cx: bx - tall * 0.01, cy: n2[1] - tall * 0.062, r: tall * 0.011, fill: coat.spot });
  }
  // Ear
  out += el("ellipse", {
    cx: n2[0] - tall * 0.03,
    cy: n2[1] - tall * 0.01,
    rx: tall * 0.03,
    ry: tall * 0.011,
    fill: coat.base,
    transform: s`rotate(-25 ${n2[0] - tall * 0.01} ${n2[1]})`,
  });
  out += el("ellipse", {
    cx: hc[0],
    cy: hc[1],
    rx: tall * 0.075,
    ry: tall * 0.034,
    fill: coat.base,
    transform: s`rotate(30 ${hc[0]} ${hc[1]})`,
  });
  // Darker muzzle, nostril and eye
  const snout: Point = [hc[0] + tall * 0.05, hc[1] + tall * 0.03];
  out += el("circle", { cx: snout[0], cy: snout[1], r: tall * 0.026, fill: mix(coat.base, coat.spot, 0.35) });
  out += el("circle", { cx: snout[0] + tall * 0.006, cy: snout[1] - tall * 0.004, r: tall * 0.005, fill: "#3a2a22" });
  out += el("circle", { cx: n2[0] + tall * 0.035, cy: n2[1] + tall * 0.002, r: tall * 0.008, fill: "#2a1e18" });
  out += "</g>";
  note.alt(
    `A giraffe ${browsing ? "browsing the top of an acacia" : "on the savanna"}${dusk ? " at dusk" : ""}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, n2[0] + tall * 0.035), n2[1]);
  // Head and horns.
  flipFrame(note, cx, dir, n2[0] - tall * 0.08, n2[1] - tall * 0.105, tall * 0.23, tall * 0.22);
  return out;
});

const SHEEP = [
  { wool: "#f4f0e6", face: "#2b2624", legs: "#2b2624" },
  { wool: "#f1ebdd", face: "#efe2d0", legs: "#d8c8b4" },
  { wool: "#ece4d4", face: "#3a302a", legs: "#3a302a" },
  { wool: "#6b5a50", face: "#2a2320", legs: "#2a2320" },
  { wool: "#e6dccb", face: "#8a6a52", legs: "#6e5442" },
] as const;

/** A woolly sheep in a field, grazing or looking up. */
export const sheep = defineKind("sheep", "Sheep", (g, w, h, note) => {
  const coat = g.pick(SHEEP);
  const dir = g.pick([-1, 1]);
  const size = Math.min(w, h);
  const bw = size * g.f(0.22, 0.26);
  const bh = bw * 0.62;
  const hz = h * g.f(0.5, 0.6);
  const gy = h * g.f(0.82, 0.88);
  const cx = w / 2 - dir * bw * 0.2 + w * g.f(-0.04, 0.04);
  const cy = gy - bw * 0.42 - bh * 0.8;
  const grazing = g.chance(0.4);
  const hr = bw * 0.33;
  const hx = cx + bw * (grazing ? 1.12 : 1.1);
  const hy = grazing ? gy - hr * 0.95 : cy - bh * g.f(0.75, 1);
  const angle = grazing ? g.f(65, 78) : g.f(15, 35);
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(190, 215), [scene.f(85, 120), 42, scene.f(50, 58)]);
  const fenced = scene.chance(0.5);
  if (fenced) out += fence(w, hz + (gy - hz) * 0.2, size * 0.12, "#a07a54");
  // Flowers in the grass
  for (let k = scene.i(4, 9); k > 0; k--)
    out += el("circle", {
      cx: w * scene.f(0, 1),
      cy: hz + (h - hz) * scene.f(0.3, 1),
      r: size * 0.008,
      fill: scene.pick(["#ffffff", "#f6d25c", "#f4a3c0"]),
    });
  // Shadow
  out += el("ellipse", { cx: cx + dir * bw * 0.1, cy: gy, rx: bw * 1.2, ry: bw * 0.1, fill: "#000", opacity: "0.15" });
  out += facing(cx, dir);
  const legTop = cy + bh * 0.4;
  // Far legs, then near legs
  for (const x of [cx - bw * 0.5, cx + bw * 0.5])
    out += limb(x, legTop, x, gy - bw * 0.03, bw * 0.1, mix(coat.legs, "#000000", 0.2));
  for (const x of [cx - bw * 0.62, cx + bw * 0.38]) out += limb(x, legTop, x, gy, bw * 0.11, coat.legs);
  // Wool
  out += el("path", { d: fluff(cx, cy, bw, bh, 13, g.f(0, 1)), fill: coat.wool });
  out += el("path", {
    d: fluff(cx - bw * 0.1, cy + bh * 0.05, bw * 0.7, bh * 0.55, 9, g.f(0, 1)),
    fill: "#000",
    opacity: "0.05",
  });
  // Woolly neck, reaching down when it grazes
  out += el("path", {
    d: grazing
      ? tube([cx + bw * 0.6, cy - bh * 0.1], [hx - hr * 0.2, cy], [hx - hr * 0.3, hy - hr * 0.2], bh * 0.8, bh * 0.5)
      : tube([cx + bw * 0.6, cy], [hx - hr * 0.6, cy - bh * 0.4], [hx - hr * 0.4, hy], bh * 0.9, bh * 0.6),
    fill: coat.wool,
  });
  // Head, snout forward, rotated down
  out += s`<g transform="rotate(${angle} ${hx} ${hy})">`;
  out += el("ellipse", { cx: hx, cy: hy, rx: hr, ry: hr * 0.66, fill: coat.face });
  // Ear, sticking out back and down from behind the eye
  out += el("ellipse", {
    cx: hx - hr * 0.62,
    cy: hy + hr * 0.05,
    rx: hr * 0.42,
    ry: hr * 0.16,
    fill: mix(coat.face, "#000000", 0.1),
    transform: s`rotate(-30 ${hx - hr * 0.3} ${hy - hr * 0.1})`,
  });
  out += el("path", { d: fluff(hx - hr * 0.5, hy - hr * 0.35, hr * 0.42, hr * 0.36, 7, 0.3), fill: coat.wool });
  out += el("circle", {
    cx: hx + hr * 0.12,
    cy: hy - hr * 0.2,
    r: hr * 0.1,
    fill: coat.face === "#efe2d0" ? "#2a2320" : "#f4efe6",
  });
  out += el("circle", { cx: hx + hr * 0.14, cy: hy - hr * 0.2, r: hr * 0.055, fill: "#111111" });
  out += el("ellipse", {
    cx: hx + hr * 0.86,
    cy: hy + hr * 0.05,
    rx: hr * 0.05,
    ry: hr * 0.08,
    fill: "#000",
    opacity: "0.35",
  });
  out += "</g></g>";
  note.alt(
    `A woolly sheep ${grazing ? "grazing" : "standing"} in a field${fenced ? " by a fence" : ""}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, hx), hy);
  // The head, which is round enough to frame the same whatever its tilt.
  flipFrame(note, cx, dir, hx - hr * 1.35, hy - hr * 1.35, hr * 2.7, hr * 2.7);
  return out;
});

const PIGS = [
  { skin: "#f4b4b0", snout: "#f9cdc9", ear: "#e89590", name: "pig" },
  { skin: "#f0a6a6", snout: "#f7c3c2", ear: "#e08888", name: "pig" },
  { skin: "#f5c3b6", snout: "#f9d8cf", ear: "#e3a090", name: "spotted pig", spots: "#3b3133" },
  { skin: "#2f2a2c", snout: "#5c4c50", ear: "#221e20", name: "saddleback pig", belt: "#f2ebe4" },
  { skin: "#d8854c", snout: "#eaa678", ear: "#bc6c38", name: "pig" },
] as const;

/** A pig in a farmyard, side on with a curly tail, sometimes standing in a mud puddle. */
export const pig = defineKind("pig", "Pig", (g, w, h, note) => {
  const coat = g.pick(PIGS);
  const dir = g.pick([-1, 1]);
  const size = Math.min(w, h);
  const bw = size * g.f(0.22, 0.26);
  const bh = bw * g.f(0.6, 0.66);
  const hz = h * g.f(0.5, 0.6);
  const gy = h * g.f(0.82, 0.88);
  const cx = w / 2 - dir * bw * 0.2 + w * g.f(-0.04, 0.04);
  const cy = gy - bw * 0.42 - bh * 0.8;
  const hr = bw * 0.4;
  const hx = cx + bw * 0.8;
  const hy = cy - bh * g.f(0.05, 0.3);
  const floppy = g.chance(0.4);
  const mud = g.chance(0.45);
  const far = mix(coat.skin, "#000000", 0.15);
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(190, 215), [scene.f(70, 110), 38, scene.f(52, 60)]);
  if (scene.chance(0.5)) out += fence(w, hz + (gy - hz) * 0.2, size * 0.12, "#9a7650");
  if (mud) {
    // Mud puddle under its feet
    out += el("ellipse", { cx, cy: gy - bw * 0.02, rx: bw * 1.5, ry: bw * 0.2, fill: "#7a5a3c" });
    out += el("ellipse", {
      cx: cx - bw * 0.6,
      cy: gy + bw * 0.04,
      rx: bw * 0.3,
      ry: bw * 0.04,
      fill: "#ffffff",
      opacity: "0.2",
    });
  } else
    out += el("ellipse", {
      cx: cx + dir * bw * 0.15,
      cy: gy,
      rx: bw * 1.2,
      ry: bw * 0.1,
      fill: "#000",
      opacity: "0.15",
    });
  out += facing(cx, dir);
  const lw = bw * 0.17;
  const leg = (x: number, foot: number, paint: string) =>
    el("rect", { x: x - lw / 2, y: cy, width: lw, height: foot - cy, rx: lw * 0.35, fill: paint }) +
    el("rect", {
      x: x - lw / 2,
      y: foot - (mud ? bw * 0.12 : lw * 0.4),
      width: lw,
      height: mud ? bw * 0.12 : lw * 0.4,
      rx: lw * 0.3,
      fill: mud ? "#6a4a30" : "#3a2c2a",
      opacity: mud ? "0.9" : "0.6",
    });
  const front = "belt" in coat ? coat.belt : coat.skin;
  // Far legs
  out += leg(cx - bw * 0.5, gy - bw * 0.03, far) + leg(cx + bw * 0.5, gy - bw * 0.03, mix(front, "#000000", 0.15));
  // Near legs
  out += leg(cx - bw * 0.62, gy, coat.skin) + leg(cx + bw * 0.38, gy, front);
  // Curly tail
  const tx = cx - bw * 0.97;
  const ty = cy - bh * 0.25;
  const t = bw * 0.13;
  out += el("path", {
    d: s`M ${tx + t * 0.3} ${ty} C ${tx - t * 1.2} ${ty - t * 0.6} ${tx - t * 1.2} ${ty + t * 0.6} ${tx - t * 0.5} ${ty + t * 0.1}
         C ${tx - t * 0.1} ${ty - t * 0.3} ${tx - t * 0.8} ${ty - t * 0.9} ${tx - t * 1.3} ${ty - t * 0.3}`,
    stroke: coat.skin,
    "stroke-width": bw * 0.04,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Far ear, behind the head
  const earTip: Point = floppy ? [hx + hr * 0.85, hy - hr * 0.35] : [hx + hr * 0.55, hy - hr * 1.55];
  out += el("polygon", {
    points: pts([
      [hx - hr * 0.7, hy - hr * 0.7],
      [earTip[0] - hr * 0.3, earTip[1] - hr * 0.05],
      [hx - hr * 0.05, hy - hr * 0.98],
    ]),
    fill: mix(coat.ear, "#000000", 0.15),
  });
  // Body and head
  const body = el("ellipse", { cx, cy, rx: bw, ry: bh });
  const head = el("circle", { cx: hx, cy: hy, r: hr });
  out += el("g", { fill: coat.skin }, body, head);
  // Spots or a pale belt, clipped to the body
  if ("spots" in coat || "belt" in coat) {
    const clip = g.id("hide");
    const m = g.fork("marks");
    let marks = "";
    if ("belt" in coat)
      marks = el("rect", { x: cx + bw * 0.15, y: cy - bh, width: bw * 0.36, height: bh * 2, fill: coat.belt });
    else
      for (let k = m.i(3, 5); k > 0; k--) {
        const r = bw * m.f(0.12, 0.22);
        marks += el("ellipse", {
          cx: cx + bw * m.f(-0.85, 0.5),
          cy: cy + bh * m.f(-0.7, 0.6),
          rx: r,
          ry: r * 0.75,
          fill: coat.spots,
        });
      }
    out += el("defs", {}, el("clipPath", { id: clip }, body, head));
    out += el("g", { "clip-path": `url(#${clip})` }, marks);
  }
  // A soft crease behind the cheek
  out += el("path", {
    d: s`M ${hx - hr * 0.3} ${hy - hr * 0.8} Q ${hx - hr * 0.75} ${hy} ${hx - hr * 0.25} ${hy + hr * 0.85}`,
    stroke: "#000",
    "stroke-opacity": "0.1",
    "stroke-width": hr * 0.08,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Snout and nostrils
  out += el("ellipse", { cx: hx + hr * 0.92, cy: hy + hr * 0.12, rx: hr * 0.2, ry: hr * 0.3, fill: coat.snout });
  for (const k of [0, 1])
    out += el("ellipse", {
      cx: hx + hr * 0.98,
      cy: hy + hr * (0.02 + k * 0.2),
      rx: hr * 0.045,
      ry: hr * 0.065,
      fill: "#000",
      opacity: "0.45",
    });
  // Eye, cheek and smile
  out += el("circle", { cx: hx + hr * 0.42, cy: hy - hr * 0.22, r: hr * 0.075, fill: "#1c1414" });
  out += el("circle", { cx: hx + hr * 0.44, cy: hy - hr * 0.24, r: hr * 0.025, fill: "#ffffff" });
  out += el("circle", { cx: hx + hr * 0.3, cy: hy + hr * 0.25, r: hr * 0.16, fill: "#ff7a8a", opacity: "0.25" });
  out += el("path", {
    d: s`M ${hx + hr * 0.5} ${hy + hr * 0.5} Q ${hx + hr * 0.62} ${hy + hr * 0.62} ${hx + hr * 0.76} ${hy + hr * 0.48}`,
    stroke: "#000",
    "stroke-opacity": "0.4",
    "stroke-width": hr * 0.05,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Near ear: pricked up, or flopping forward over the eye
  out += el("polygon", {
    points: pts([[hx - hr * 0.45, hy - hr * 0.85], earTip, [hx + hr * 0.3, hy - hr * 0.92]]),
    fill: coat.ear,
  });
  out += "</g>";
  note.alt(
    `A ${coat.name} with a curly tail ${mud ? "standing in a mud puddle" : "in a farmyard"}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, hx + hr * 0.42), hy - hr * 0.22);
  // Head, ears and snout.
  flipFrame(note, cx, dir, hx - hr * 1.1, hy - hr * 1.4, hr * 2.4, hr * 2.5);
  return out;
});

/** A koala hugging the trunk of a gum tree, sometimes with a joey on its back. */
export const koala = defineKind("koala", "Koala", (g, w, h, note) => {
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
