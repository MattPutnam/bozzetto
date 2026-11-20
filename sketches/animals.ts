import { el, facing, fill, hsl, lin, mix, pts, s, type Point } from "../src/core";
import { sketch } from "./shared";

const DOG_COATS = [
  { fur: "#c8945c", ear: "#8a5a32", muzzle: "#f1dcc0" },
  { fur: "#e9d7b8", ear: "#b8875a", muzzle: "#fbf3e6" },
  { fur: "#2e2a2b", ear: "#1d1a1b", muzzle: "#b9895c" },
  { fur: "#d9a441", ear: "#b07a26", muzzle: "#f3dfae" },
  { fur: "#8b5a3c", ear: "#5f3a24", muzzle: "#d7b79a" },
  { fur: "#f4f1ea", ear: "#2b2b2b", muzzle: "#ffffff", spots: true },
] as const;

/** A dog's face: floppy or pointed ears, a muzzle, sometimes an eye patch, a tongue and a collar. */
export const dog = sketch("dog", "Dog", "animal", (g, w, h) => {
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
  if (g.chance(0.5)) out += el("ellipse", { cx, cy: cy + ry * 0.62, rx: rx * 0.12, ry: ry * 0.16, fill: "#e46f7b" });
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
  return out;
});

const FOXES = [
  { fur: "#d9692b", dark: "#2a1a14", light: "#fbf3e8", bg: [95, 30, 80] },
  { fur: "#c25a24", dark: "#2a1a14", light: "#f6ead9", bg: [30, 35, 82] },
  { fur: "#e9e6e1", dark: "#5b5f68", light: "#ffffff", bg: [205, 35, 82] },
  { fur: "#dcb07a", dark: "#5a3a22", light: "#fbf3e3", bg: [40, 45, 84] },
] as const;

/** An angular fox face with pale cheeks and dark-tipped ears. */
export const fox = sketch("fox", "Fox", "animal", (g, w, h) => {
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
  return out;
});

/** A penguin on the ice, sometimes with an emperor's golden neck. */
export const penguin = sketch("penguin", "Penguin", "animal", (g, w, h) => {
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
  return out;
});

/** A whale at the surface, half under the water, blowing a spout. */
export const whale = sketch("whale", "Whale", "animal", (g, w, h) => {
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
  if (g.chance(0.6))
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
export const frog = sketch("frog", "Frog", "animal", (g, w, h) => {
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
  if (g.chance(0.45)) {
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
export const rabbit = sketch("rabbit", "Rabbit", "animal", (g, w, h) => {
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
  return out;
});

/** A snail with a spiral shell on a leaf. */
export const snail = sketch("snail", "Snail", "animal", (g, w, h) => {
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
  return out;
});

export const animals = [dog, fox, penguin, whale, frog, rabbit, snail];
