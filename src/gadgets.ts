/** Tech gadgets as product shots: one item, centered and large, on a seamless studio backdrop. */
import { defineKind, el, facing, fill, hsl, mix, pts, s, type Point, type Rand } from "./core";

const shade = (color: string, t: number): string => mix(color, "#000000", t);
const tint = (color: string, t: number): string => mix(color, "#ffffff", t);

/**
 * A seamless studio sweep: the wall fades softly into a slightly lighter or darker floor at
 * `horizon`. Sometimes it's one flat color instead, and often there's a spotlight glow at (cx, cy).
 */
function studio(g: Rand, w: number, h: number, horizon: number, cx: number, cy: number): string {
  const unit = Math.min(w, h);
  const hue = g.f(0, 360);
  const sat = g.f(10, 32);
  const light = g.f(80, 89);
  const floorLight = light + (g.chance(0.5) ? g.f(3, 6) : -g.f(3, 7));
  const flat = g.chance(0.3);
  const spot = flat || g.chance(0.35);
  const sweep = g.id("sweep");
  const glow = g.id("spot");
  const stop = (offset: number, color: string, opacity?: string) =>
    el("stop", {
      offset: Math.max(0, Math.min(1, offset)),
      "stop-color": color,
      "stop-opacity": opacity,
    });
  const t = horizon / h;
  let defs = el("radialGradient", { id: glow }, stop(0, "#ffffff", flat ? "0.5" : "0.35"), stop(1, "#ffffff", "0"));
  if (!flat) {
    defs += el(
      "linearGradient",
      { id: sweep, x1: 0, y1: 0, x2: 0, y2: 1 },
      stop(0, hsl(hue, sat, light - 5)),
      stop(t - 0.1, hsl(hue, sat, light)),
      stop(t + 0.12, hsl(hue, sat, floorLight)),
      stop(1, hsl(hue, sat, floorLight + (floorLight > light ? 2 : -2))),
    );
  }
  let out = el("defs", {}, defs);
  out += fill(w, h, flat ? hsl(hue, sat, light) : `url(#${sweep})`);
  if (spot) out += el("circle", { cx, cy, r: unit * 0.55, fill: `url(#${glow})` });
  return out;
}

/** A soft contact shadow: a faint wide ellipse and a darker tight one. */
const contact = (cx: number, cy: number, rx: number, ry: number): string =>
  el("ellipse", { cx, cy, rx: rx * 1.3, ry: ry * 1.7, fill: "#000", opacity: "0.07" }) +
  el("ellipse", { cx, cy, rx, ry, fill: "#000", opacity: "0.16" });

/** Where an item of height `itemH` stands: centered, but never too low. */
const baseFor = (h: number, unit: number, itemH: number): number => Math.min(h * 0.86, h / 2 + itemH / 2 + unit * 0.05);

/** Over-ear headphones standing on their ear cups, from the front or at three-quarters. */
export const headphones = defineKind("headphones", "Headphones", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const view = g.pick(["three-quarter", "three-quarter", "front"] as const);
  const dir = g.chance(0.5) ? 1 : -1;
  const shell = g.pick([
    "#2b2b2d",
    "#2b2b2d",
    "#ece8e1",
    "#3e5a74",
    "#c9b8a6",
    "#2f4f4f",
    "#d9dcdf",
    "#7a3b3b",
    "#5a6b52",
  ]);
  const cushion = g.pick([shade(shell, 0.35), "#2f2f31", tint(shell, 0.25)]);
  const metal = g.pick(["#c9ccd1", "#a9adb3", "#d9c7a8", shade(shell, 0.2)]);
  const ch = unit * g.f(0.25, 0.29);
  const gap = unit * g.f(0.34, 0.39);
  const itemH = unit * g.f(0.58, 0.64);
  const cx = w / 2;
  const base = baseFor(h, unit, itemH);
  const peak = base - itemH;
  let out = studio(g, w, h, base - itemH * 0.42, cx, base - itemH * 0.5);
  const back = view === "front" ? 0 : unit * 0.035;
  // Cup centers: the far cup stands a little further back, so higher and smaller.
  const nearX = cx - gap / 2;
  const farX = cx + gap / 2;
  const farScale = view === "front" ? 1 : 0.92;
  const nearY = base - ch / 2;
  const farY = base - back - (ch * farScale) / 2;
  out += contact(nearX, base, ch * 0.42, unit * 0.022);
  out += contact(farX, base - back, ch * 0.4 * farScale, unit * 0.02);
  out += facing(cx, dir);
  // The headband: a padded underside, the band, and a glint along its top.
  const endY = (cy: number, scale: number) => cy - (ch * scale) / 2 - unit * 0.035;
  const y1 = endY(nearY, 1);
  const y2 = endY(farY, farScale);
  const c = (peak + unit * 0.02 - 0.125 * (y1 + y2)) / 0.75;
  const band = s`M ${nearX} ${y1} C ${nearX - gap * 0.14} ${c} ${farX + gap * 0.14} ${c} ${farX} ${y2}`;
  const bw = unit * 0.042;
  out += el("path", {
    d: band,
    stroke: cushion,
    "stroke-width": bw * 0.8,
    fill: "none",
    "stroke-linecap": "round",
    transform: s`translate(0 ${bw * 0.45})`,
  });
  out += el("path", { d: band, stroke: shell, "stroke-width": bw, fill: "none", "stroke-linecap": "round" });
  out += el("path", {
    d: band,
    stroke: "#fff",
    "stroke-width": bw * 0.18,
    fill: "none",
    opacity: "0.25",
    transform: s`translate(0 ${-bw * 0.25})`,
  });
  // Sliders from the band down into each cup
  const slider = (x: number, top: number, bottom: number) =>
    el("rect", {
      x: x - unit * 0.012,
      y: top,
      width: unit * 0.024,
      height: bottom - top,
      rx: unit * 0.008,
      fill: metal,
    });
  out += slider(nearX, y1 - unit * 0.01, nearY - ch * 0.4);
  out += slider(farX, y2 - unit * 0.01, farY - ch * farScale * 0.4);
  let cups = "";
  if (view === "front") {
    // Both cups edge-on: the shell outside, the cushion inside.
    for (const side of [-1, 1]) {
      const x = side < 0 ? nearX : farX;
      const sw = ch * 0.3;
      cups += el("rect", {
        x: x - sw * 0.2 - (side > 0 ? sw * 0.55 : 0),
        y: nearY - ch * 0.47,
        width: sw * 0.75,
        height: ch * 0.94,
        rx: sw * 0.35,
        fill: cushion,
      });
      cups += el("rect", {
        x: x - sw / 2 + side * sw * 0.25,
        y: nearY - ch / 2,
        width: sw,
        height: ch,
        rx: sw * 0.45,
        fill: shell,
      });
      cups += el("rect", {
        x: x - sw * 0.2 + side * sw * 0.3,
        y: nearY - ch * 0.38,
        width: sw * 0.16,
        height: ch * 0.6,
        rx: sw * 0.08,
        fill: "#fff",
        opacity: "0.18",
      });
    }
  } else {
    // The far cup shows its cushion, with the shell's rim behind it.
    const fr = ch * farScale * 0.37;
    const fry = (ch * farScale) / 2;
    cups += el("ellipse", { cx: farX + fr * 0.3, cy: farY, rx: fr, ry: fry, fill: shell });
    cups += el("ellipse", { cx: farX, cy: farY, rx: fr, ry: fry * 0.97, fill: cushion });
    cups += el("ellipse", { cx: farX, cy: farY, rx: fr * 0.52, ry: fry * 0.62, fill: shade(cushion, 0.4) });
    cups += el("ellipse", {
      cx: farX - fr * 0.5,
      cy: farY - fry * 0.3,
      rx: fr * 0.12,
      ry: fry * 0.3,
      fill: "#fff",
      opacity: "0.12",
    });
    // The near cup shows its outer shell, with the cushion peeking out on the inside.
    const nr = ch * 0.36;
    const nry = ch / 2;
    cups += el("ellipse", { cx: nearX + nr * 0.35, cy: nearY, rx: nr * 0.9, ry: nry * 0.96, fill: cushion });
    cups += el("ellipse", { cx: nearX, cy: nearY, rx: nr, ry: nry, fill: shell });
    cups += el("ellipse", {
      cx: nearX - nr * 0.08,
      cy: nearY,
      rx: nr * 0.7,
      ry: nry * 0.72,
      fill: g.chance(0.5) ? shade(shell, 0.12) : tint(shell, 0.12),
    });
    cups += el("ellipse", {
      cx: nearX - nr * 0.45,
      cy: nearY - nry * 0.35,
      rx: nr * 0.14,
      ry: nry * 0.28,
      fill: "#fff",
      opacity: "0.22",
    });
  }
  out += cups + "</g>";
  note.alt(
    view === "front"
      ? "Over-ear headphones standing upright, seen from the front"
      : "Over-ear headphones standing upright on their ear cups",
  );
  note.focus(cx, base - itemH * 0.45);
  return out;
});

/** A smartphone on a small stand, showing its screen or its back and cameras. */
export const phone = defineKind("phone", "Smartphone", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const side = g.pick(["screen", "screen", "back"] as const);
  const body = g.pick([
    "#2b2b2d",
    "#1f2a36",
    "#e9e6df",
    "#d9dcdf",
    "#c9b8a6",
    "#3e5a4a",
    "#a7c4d9",
    "#e8c4b8",
    "#5b4b8a",
    "#7a3b3b",
  ]);
  const standColor = g.pick(["#d9dcdf", "#2b2b2d", "#c9b8a6", "#ece8e1"]);
  const ph = unit * g.f(0.58, 0.64);
  const pw = ph * g.f(0.47, 0.5);
  const sh = unit * 0.05;
  const cx = w / 2 + w * g.f(-0.02, 0.02);
  const base = baseFor(h, unit, ph + sh * 0.6);
  const bottom = base - sh * 0.4;
  const top = bottom - ph;
  const x0 = cx - pw / 2;
  const rx = pw * 0.15;
  let out = studio(g, w, h, base - ph * 0.4, cx, top + ph * 0.5);
  out += contact(cx, base, pw * 0.75, unit * 0.022);
  // Side buttons, then the body
  out += el("rect", {
    x: x0 + pw - unit * 0.004,
    y: top + ph * 0.22,
    width: unit * 0.01,
    height: ph * 0.12,
    rx: unit * 0.004,
    fill: shade(body, 0.2),
  });
  out += el("rect", {
    x: x0 - unit * 0.006,
    y: top + ph * 0.18,
    width: unit * 0.01,
    height: ph * 0.08,
    rx: unit * 0.004,
    fill: shade(body, 0.2),
  });
  out += el("rect", { x: x0, y: top, width: pw, height: ph, rx, fill: body });
  let alt: string;
  if (side === "screen") {
    const m = pw * 0.045;
    const sx = x0 + m;
    const sy = top + m;
    const sw = pw - m * 2;
    const sH = ph - m * 2;
    const clip = g.id("screen");
    const paper = g.id("paper");
    const hue = g.f(0, 360);
    const hue2 = hue + g.pick([-1, 1]) * g.f(40, 90);
    const grid = g.chance(0.55);
    out += el(
      "defs",
      {},
      el("clipPath", { id: clip }, el("rect", { x: sx, y: sy, width: sw, height: sH, rx: rx * 0.8 })),
      el(
        "linearGradient",
        { id: paper, x1: 0, y1: 0, x2: 1, y2: 1 },
        el("stop", { offset: 0, "stop-color": hsl(hue, 55, 62) }),
        el("stop", { offset: 1, "stop-color": hsl(hue2, 50, 38) }),
      ),
    );
    let screen = el("rect", { x: sx, y: sy, width: sw, height: sH, fill: `url(#${paper})` });
    // Soft shapes in the wallpaper
    for (let k = 0; k < 3; k++) {
      screen += el("circle", {
        cx: sx + sw * g.f(0, 1),
        cy: sy + sH * g.f(0.1, 0.9),
        r: sw * g.f(0.3, 0.6),
        fill: hsl(g.pick([hue, hue2]) + g.f(-20, 20), 55, g.f(45, 75)),
        opacity: "0.55",
      });
    }
    if (grid) {
      // A grid of app icons and a dock
      const cols = 4;
      const icon = sw * 0.16;
      const pitch = sw / cols;
      const hues = [hue, hue2, hue + 180, hue2 + 150, hue + 60];
      const rows = g.i(4, 5);
      for (let r = 0; r < rows; r++) {
        for (let c2 = 0; c2 < cols; c2++) {
          if (r === rows - 1 && c2 >= g.i(2, 4)) continue;
          screen += el("rect", {
            x: sx + pitch * (c2 + 0.5) - icon / 2,
            y: sy + sH * 0.1 + r * pitch * 1.1,
            width: icon,
            height: icon,
            rx: icon * 0.26,
            fill: hsl(g.pick(hues) + g.f(-15, 15), g.f(35, 60), g.f(55, 80)),
          });
        }
      }
      screen += el("rect", {
        x: sx + sw * 0.05,
        y: sy + sH - pitch * 1.25,
        width: sw * 0.9,
        height: pitch,
        rx: icon * 0.4,
        fill: "#fff",
        opacity: "0.25",
      });
      for (let c2 = 0; c2 < cols; c2++) {
        screen += el("rect", {
          x: sx + pitch * (c2 + 0.5) - icon / 2,
          y: sy + sH - pitch * 0.75 - icon / 2,
          width: icon,
          height: icon,
          rx: icon * 0.26,
          fill: hsl(g.pick(hues) + g.f(-15, 15), g.f(35, 60), g.f(60, 85)),
        });
      }
      alt = "A smartphone on a small stand, its home screen full of app icons";
    } else {
      alt = "A smartphone on a small stand with an abstract wallpaper on its screen";
    }
    // Glare across the glass
    screen += el("polygon", {
      points: pts([
        [sx + sw * 0.55, sy],
        [sx + sw, sy],
        [sx + sw, sy + sH * 0.3],
      ]),
      fill: "#fff",
      opacity: "0.1",
    });
    out += el("g", { "clip-path": `url(#${clip})` }, screen);
    // Front camera and home bar
    out += el("circle", { cx, cy: sy + sw * 0.07, r: sw * 0.028, fill: "#111114" });
    out += el("rect", {
      x: cx - sw * 0.17,
      y: sy + sH - sw * 0.05,
      width: sw * 0.34,
      height: sw * 0.018,
      rx: sw * 0.009,
      fill: "#fff",
      opacity: "0.7",
    });
  } else {
    // The back: a sheen, a camera bump with lenses and a flash
    out += el("polygon", {
      points: pts([
        [x0 + pw * 0.15, top + ph],
        [x0 + pw * 0.55, top + ph],
        [x0 + pw, top + ph * 0.45],
        [x0 + pw, top + ph * 0.2],
      ]),
      fill: "#fff",
      opacity: "0.07",
    });
    out += el("rect", {
      x: x0 + pw * 0.06,
      y: top + pw * 0.06,
      width: pw - pw * 0.12,
      height: ph - pw * 0.12,
      rx: rx * 0.7,
      fill: "#000",
      opacity: "0.04",
    });
    const lenses = g.pick([2, 3, 3]);
    const bs = pw * (lenses === 2 ? 0.34 : 0.44);
    const bx = x0 + pw * 0.08;
    const by = top + pw * 0.08;
    out += el("rect", {
      x: bx + unit * 0.004,
      y: by + unit * 0.006,
      width: bs,
      height: bs * (lenses === 2 ? 1.6 : 1),
      rx: bs * 0.28,
      fill: "#000",
      opacity: "0.15",
    });
    out += el("rect", {
      x: bx,
      y: by,
      width: bs,
      height: bs * (lenses === 2 ? 1.6 : 1),
      rx: bs * 0.28,
      fill: tint(body, 0.12),
    });
    const spots: Point[] =
      lenses === 2
        ? [
            [bx + bs * 0.5, by + bs * 0.45],
            [bx + bs * 0.5, by + bs * 1.15],
          ]
        : [
            [bx + bs * 0.3, by + bs * 0.3],
            [bx + bs * 0.3, by + bs * 0.72],
            [bx + bs * 0.72, by + bs * 0.51],
          ];
    const lr = bs * (lenses === 2 ? 0.3 : 0.18);
    for (const [lx, ly] of spots) {
      out += el("circle", { cx: lx, cy: ly, r: lr, fill: shade(body, 0.3) });
      out += el("circle", { cx: lx, cy: ly, r: lr * 0.72, fill: "#16161a" });
      out += el("circle", { cx: lx, cy: ly, r: lr * 0.38, fill: "#2c3a4f" });
      out += el("circle", { cx: lx - lr * 0.25, cy: ly - lr * 0.25, r: lr * 0.13, fill: "#fff", opacity: "0.6" });
    }
    const flash: Point = lenses === 2 ? [bx + bs * 1.25, by + bs * 0.35] : [bx + bs * 0.74, by + bs * 0.2];
    out += el("circle", { cx: flash[0], cy: flash[1], r: bs * 0.07, fill: "#f4ead2" });
    alt = "The back of a smartphone with its camera bump, on a small stand";
  }
  // Highlight down the edge
  out += el("rect", {
    x: x0 + pw * 0.015,
    y: top + rx,
    width: unit * 0.005,
    height: ph - rx * 2,
    fill: "#fff",
    opacity: "0.3",
  });
  // The stand holds the phone's lower edge
  out += el("rect", { x: cx - pw * 0.62, y: base - sh, width: pw * 1.24, height: sh, rx: sh * 0.35, fill: standColor });
  out += el("rect", {
    x: cx - pw * 0.62,
    y: base - sh,
    width: pw * 1.24,
    height: sh * 0.25,
    rx: sh * 0.12,
    fill: "#fff",
    opacity: "0.25",
  });
  out += el("rect", {
    x: cx - pw * 0.62,
    y: base - sh * 0.35,
    width: pw * 1.24,
    height: sh * 0.35,
    rx: sh * 0.17,
    fill: "#000",
    opacity: "0.12",
  });
  note.alt(alt);
  note.focus(cx, top + ph * 0.45);
  return out;
});

/** An open laptop at three-quarters, a wallpaper on its screen. */
export const laptop = defineKind("laptop", "Laptop", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.chance(0.5) ? 1 : -1;
  const yaw = (g.f(22, 36) * Math.PI) / 180;
  const elev = (g.f(20, 30) * Math.PI) / 180;
  const tilt = (g.f(8, 20) * Math.PI) / 180;
  const body = g.pick(["#d9dcdf", "#c9ccd1", "#8e9399", "#3a3d42", "#2b2d33", "#d8c7b4", "#34405a", "#e5d3cf"]);
  const keyColor = g.pick(["#26272b", "#26272b", shade(body, 0.25)]);
  // In laptop units: width 1, depth D, deck thickness T, screen height H.
  const D = 0.68;
  const T = 0.035;
  const H = 0.64;
  const ca = Math.cos(yaw);
  const sa = Math.sin(yaw);
  const ce = Math.cos(elev);
  const se = Math.sin(elev);
  const raw = (x: number, y: number, z: number): Point => [x * ca - z * sa, -y * ce + (z * ca + x * sa) * se];
  const hingeZ = -D / 2;
  const lidUp = H * Math.cos(tilt);
  const lidBack = H * Math.sin(tilt);
  const corners = [
    raw(-0.5, 0, D / 2),
    raw(0.5, 0, D / 2),
    raw(0.5, 0, -D / 2),
    raw(-0.5, T + lidUp, hingeZ - lidBack),
    raw(0.5, T + lidUp, hingeZ - lidBack),
    raw(-0.5, 0, -D / 2),
  ];
  const minX = Math.min(...corners.map(p => p[0]));
  const maxX = Math.max(...corners.map(p => p[0]));
  const minY = Math.min(...corners.map(p => p[1]));
  const maxY = Math.max(...corners.map(p => p[1]));
  const k = Math.min((unit * 0.74) / (maxX - minX), (unit * 0.62) / (maxY - minY));
  const itemH = (maxY - minY) * k;
  const cx = w / 2;
  const base = baseFor(h, unit, itemH);
  const midX = (minX + maxX) / 2;
  const P = (x: number, y: number, z: number): Point => {
    const [a, b] = raw(x, y, z);
    return [cx + (a - midX) * k, base + (b - maxY) * k];
  };
  // Points on the lid face (u across, v up from the hinge) and on the deck (v from back to front).
  const lid = (u: number, v: number, depth = 0): Point =>
    P(-0.5 + u, T + v * lidUp - depth * Math.sin(tilt), hingeZ - v * lidBack - depth * Math.cos(tilt));
  const deck = (u: number, v: number, y = T): Point => P(-0.5 + u, y, -D / 2 + v * D);
  const quad = (a: Point, b: Point, c: Point, d: Point) =>
    s`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]} L ${d[0]} ${d[1]} Z`;
  const lidQuad = (u0: number, v0: number, u1: number, v1: number, depth = 0) =>
    quad(lid(u0, v0, depth), lid(u1, v0, depth), lid(u1, v1, depth), lid(u0, v1, depth));
  const deckQuad = (u0: number, v0: number, u1: number, v1: number) =>
    quad(deck(u0, v0), deck(u1, v0), deck(u1, v1), deck(u0, v1));
  const screenCenter = lid(0.5, 0.55);
  let out = studio(g, w, h, base - itemH * 0.4, cx + dir * (screenCenter[0] - cx), screenCenter[1]);
  const footA = P(-0.5, 0, D / 2);
  const footB = P(0.5, 0, -D / 2);
  const footC = P(0.5, 0, D / 2);
  const footD = P(-0.5, 0, -D / 2);
  const fx = (Math.min(footA[0], footD[0]) + Math.max(footB[0], footC[0])) / 2;
  const fy = (Math.min(footB[1], footD[1]) + Math.max(footA[1], footC[1])) / 2;
  out += facing(cx, dir);
  const spanX = Math.max(footB[0], footC[0]) - Math.min(footA[0], footD[0]);
  const spanY = Math.max(footA[1], footC[1]) - Math.min(footB[1], footD[1]);
  out += contact(fx, fy + k * 0.01, spanX * 0.42, spanY * 0.3);
  // The lid: its back edge for thickness, the face, the bezel and the display
  out += el("path", { d: lidQuad(0, 0, 1, 1, 0.018), fill: shade(body, 0.3) });
  out += el("path", { d: lidQuad(0, 0, 1, 1), fill: body });
  out += el("path", { d: lidQuad(0.015, 0.015, 0.985, 0.985), fill: "#18191c" });
  const clip = g.id("display");
  const paper = g.id("paper");
  const hue = g.f(0, 360);
  const hue2 = hue + g.pick([-1, 1]) * g.f(40, 100);
  const tl = lid(0.04, 0.96);
  const br = lid(0.96, 0.08);
  out += el(
    "defs",
    {},
    el("clipPath", { id: clip }, el("path", { d: lidQuad(0.04, 0.08, 0.96, 0.96) })),
    el(
      "linearGradient",
      { id: paper, gradientUnits: "userSpaceOnUse", x1: tl[0], y1: tl[1], x2: br[0], y2: br[1] },
      el("stop", { offset: 0, "stop-color": hsl(hue, 55, 65) }),
      el("stop", { offset: 1, "stop-color": hsl(hue2, 50, 36) }),
    ),
  );
  let display = el("path", { d: lidQuad(0.04, 0.08, 0.96, 0.96), fill: `url(#${paper})` });
  // Rolling hills of color in the wallpaper
  for (let b = 0; b < 2; b++) {
    const v = g.f(0.3, 0.55) - b * 0.18;
    const a = lid(0, v);
    const m = lid(g.f(0.3, 0.7), v + g.f(0.15, 0.3));
    const e = lid(1.05, v - g.f(-0.1, 0.15));
    const z1 = lid(1.05, 0);
    const z2 = lid(0, 0);
    display += el("path", {
      d: s`M ${a[0]} ${a[1]} Q ${m[0]} ${m[1]} ${e[0]} ${e[1]} L ${z1[0]} ${z1[1]} L ${z2[0]} ${z2[1]} Z`,
      fill: hsl(g.pick([hue, hue2]) + g.f(-20, 20), 50, b ? 32 : 50),
      opacity: "0.7",
    });
  }
  out += el("g", { "clip-path": `url(#${clip})` }, display);
  // The deck: its front and side edges, then the top
  out += el("path", {
    d: quad(P(-0.5, T, D / 2), P(0.5, T, D / 2), P(0.5, 0, D / 2), P(-0.5, 0, D / 2)),
    fill: shade(body, 0.22),
  });
  out += el("path", {
    d: quad(P(0.5, T, D / 2), P(0.5, T, -D / 2), P(0.5, 0, -D / 2), P(0.5, 0, D / 2)),
    fill: shade(body, 0.32),
  });
  out += el("path", { d: deckQuad(0, 0, 1, 1), fill: body });
  // Keys: four even rows, then a row with a long space bar
  let keys = "";
  const pitchU = 0.84 / 12;
  const pitchV = 0.085;
  const gap = 0.18;
  for (let r = 0; r < 5; r++) {
    const widths = r < 4 ? Array(12).fill(1) : [1, 1, 1, 6, 1, 1, 1];
    let u = 0.08;
    const v0 = 0.08 + r * pitchV;
    for (const span of widths) {
      keys +=
        deckQuad(
          u + pitchU * gap * 0.5,
          v0 + pitchV * gap * 0.5,
          u + pitchU * (span - gap * 0.5),
          v0 + pitchV * (1 - gap * 0.5),
        ) + " ";
      u += pitchU * span;
    }
  }
  out += el("path", { d: keys.trim(), fill: keyColor });
  out += el("path", { d: deckQuad(0.35, 0.58, 0.65, 0.92), fill: shade(body, 0.08) });
  // A glint along the front edge
  out += el("path", {
    d: quad(deck(0.02, 0.985), deck(0.98, 0.985), deck(0.98, 1), deck(0.02, 1)),
    fill: "#fff",
    opacity: "0.35",
  });
  out += "</g>";
  note.alt("An open laptop with an abstract wallpaper on its screen");
  note.focus(cx + dir * (screenCenter[0] - cx), screenCenter[1]);
  return out;
});

/** A fabric-covered speaker: a portable cylinder, a smart speaker or a wide portable box. */
export const speaker = defineKind("speaker", "Speaker", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const shape = g.pick(["cylinder", "smart", "box"] as const);
  const fabric = g.pick([
    "#3a3a3c",
    "#d8d2c6",
    "#5a6b7a",
    "#8a6f5a",
    "#b9c3b0",
    "#c98a7a",
    "#2f3e4f",
    "#e2ddd3",
    "#6b5b7a",
    "#a8b8c8",
  ]);
  const trim = g.pick([shade(fabric, 0.35), "#2b2b2d", tint(fabric, 0.3), "#d9dcdf"]);
  const weave = g.id("weave");
  const sheen = g.id("sheen");
  const cx = w / 2;
  const p = unit * 0.011;
  const defs = el(
    "defs",
    {},
    el(
      "pattern",
      { id: weave, width: p, height: p, patternUnits: "userSpaceOnUse" },
      el("circle", { cx: p / 2, cy: p / 2, r: p * 0.26, fill: "#000", opacity: "0.22" }),
    ),
    el(
      "linearGradient",
      { id: sheen, x1: 0, y1: 0, x2: 1, y2: 0 },
      el("stop", { offset: 0, "stop-color": "#000", "stop-opacity": "0.22" }),
      el("stop", { offset: 0.35, "stop-color": "#fff", "stop-opacity": "0.12" }),
      el("stop", { offset: 0.6, "stop-color": "#000", "stop-opacity": "0" }),
      el("stop", { offset: 1, "stop-color": "#000", "stop-opacity": "0.28" }),
    ),
  );
  let out: string;
  let alt: string;
  let focusY: number;
  if (shape === "box") {
    const bw = unit * g.f(0.62, 0.72);
    const bh = unit * g.f(0.28, 0.33);
    const base = baseFor(h, unit, bh);
    const y0 = base - bh;
    const x0 = cx - bw / 2;
    const r = bh / 2;
    const clip = g.id("pill");
    out = studio(g, w, h, base - bh * 0.6, cx, y0 + bh * 0.5) + defs;
    out += contact(cx, base, bw * 0.45, unit * 0.022);
    // A strap looped on one end
    const end = g.chance(0.5) ? 1 : -1;
    const strap = g.chance(0.6);
    if (strap) {
      const ex = cx + end * (bw / 2);
      out += el("path", {
        d: s`M ${ex - end * r * 0.4} ${y0 + bh * 0.3} C ${ex + end * r * 0.9} ${y0 + bh * 0.1} ${ex + end * r * 0.9} ${y0 + bh * 0.8} ${ex - end * r * 0.4} ${y0 + bh * 0.62}`,
        stroke: g.pick(["#2b2b2d", shade(fabric, 0.4), "#8a5a3b"]),
        "stroke-width": unit * 0.016,
        fill: "none",
        "stroke-linecap": "round",
      });
    }
    // Buttons along the top edge
    for (let b = 0; b < 3; b++) {
      out += el("rect", {
        x: cx - bw * 0.11 + b * bw * 0.08,
        y: y0 - unit * 0.008,
        width: bw * 0.055,
        height: unit * 0.02,
        rx: unit * 0.006,
        fill: shade(trim, 0.2),
      });
    }
    // A fabric pill with rubber end caps, shaded below and lit along the top
    const pill = { x: x0, y: y0, width: bw, height: bh, rx: r };
    let inside = el("rect", { ...pill, fill: fabric });
    inside += el("rect", { ...pill, fill: `url(#${weave})` });
    const cap = bh * 0.32;
    inside += el("rect", { x: x0, y: y0, width: cap, height: bh, fill: trim });
    inside += el("rect", { x: x0 + bw - cap, y: y0, width: cap, height: bh, fill: trim });
    inside += el("rect", { x: x0, y: y0 + bh * 0.72, width: bw, height: bh * 0.28, fill: "#000", opacity: "0.12" });
    inside += el("rect", { x: x0, y: y0 + bh * 0.1, width: bw, height: bh * 0.06, fill: "#fff", opacity: "0.15" });
    out += el("defs", {}, el("clipPath", { id: clip }, el("rect", pill)));
    out += el("g", { "clip-path": `url(#${clip})` }, inside);
    // A rubber foot along the bottom
    out += el("rect", {
      x: cx - bw * 0.3,
      y: base - unit * 0.006,
      width: bw * 0.6,
      height: unit * 0.012,
      rx: unit * 0.006,
      fill: "#222",
    });
    alt = strap
      ? "A portable fabric speaker with a strap looped on one end"
      : "A portable fabric speaker with rubber end caps";
    focusY = y0 + bh * 0.5;
  } else {
    const smart = shape === "smart";
    const r = unit * (smart ? g.f(0.22, 0.26) : g.f(0.15, 0.18));
    const ch = unit * (smart ? g.f(0.36, 0.44) : g.f(0.5, 0.6));
    const ry = r * 0.24;
    const base = baseFor(h, unit, ch + ry * 2);
    const bot = base - ry;
    const topY = bot - ch;
    out = studio(g, w, h, base - ch * 0.5, cx, topY + ch * 0.5) + defs;
    out += contact(cx, base - ry * 0.3, r * 1.1, ry * 0.9);
    const side = (y1: number, y2: number) =>
      s`M ${cx - r} ${y1} L ${cx - r} ${y2} A ${r} ${ry} 0 0 0 ${cx + r} ${y2} L ${cx + r} ${y1} A ${r} ${ry} 0 0 1 ${cx - r} ${y1} Z`;
    const body = side(topY, bot);
    // A carrying loop at the back of a portable one
    const loop = !smart && g.chance(0.6);
    if (loop) {
      out += el("path", {
        d: s`M ${cx - r * 0.25} ${topY - ry * 0.6} Q ${cx} ${topY - ry * 3.2} ${cx + r * 0.25} ${topY - ry * 0.6}`,
        stroke: g.pick(["#2b2b2d", shade(fabric, 0.4)]),
        "stroke-width": unit * 0.014,
        fill: "none",
      });
    }
    out += el("path", { d: body, fill: fabric });
    out += el("path", { d: body, fill: `url(#${weave})` });
    // Rubber bands at the base, and at the top of a portable one
    const band = ch * 0.07;
    out += el("path", { d: side(bot - band, bot), fill: trim });
    if (!smart) out += el("path", { d: side(topY, topY + band), fill: trim });
    out += el("path", { d: body, fill: `url(#${sheen})` });
    // The top: a cap with a light ring, or buttons
    out += el("ellipse", { cx, cy: topY, rx: r, ry, fill: smart ? tint(trim, 0.15) : shade(trim, 0.08) });
    if (smart) {
      out += el("ellipse", {
        cx,
        cy: topY,
        rx: r * 0.8,
        ry: ry * 0.8,
        fill: "none",
        stroke: hsl(g.f(0, 360), 70, 72),
        "stroke-width": ry * 0.16,
        opacity: "0.9",
      });
      for (const dx of [-0.35, 0, 0.35]) {
        out += el("ellipse", {
          cx: cx + r * dx,
          cy: topY + ry * (dx ? 0.05 : 0.25),
          rx: r * 0.06,
          ry: ry * 0.09,
          fill: shade(trim, 0.3),
        });
      }
      alt = "A round smart speaker in fabric, a light ring glowing on top";
    } else {
      out += el("ellipse", { cx, cy: topY, rx: r * 0.55, ry: ry * 0.55, fill: shade(trim, 0.2) });
      out += el("ellipse", { cx, cy: topY - ry * 0.05, rx: r * 0.2, ry: ry * 0.22, fill: tint(trim, 0.2) });
      alt = loop
        ? "A cylindrical portable speaker in fabric, with a carrying loop"
        : "A cylindrical portable speaker wrapped in fabric";
    }
    out += el("rect", {
      x: cx - r * 0.62,
      y: topY + ch * 0.15,
      width: r * 0.06,
      height: ch * 0.6,
      rx: r * 0.03,
      fill: "#fff",
      opacity: "0.15",
    });
    focusY = topY + ch * 0.4;
  }
  note.alt(alt);
  note.focus(cx, focusY);
  return out;
});

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
export const controller = defineKind("controller", "Game controller", (g, w, h, note) => {
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
  let out = studio(g, w, h, Math.max(h * 0.12, cy - sy * 1.4), cx, cy);
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
