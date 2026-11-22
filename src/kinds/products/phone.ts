import { defineKind, el, hsl, type Point, pts } from "../../draw/core";
import { baseFor, shade, softContact, sweepStudio, tint } from "./shared";

/**
 * A smartphone on a small stand, showing its screen or its back and cameras.
 *
 * @category Products
 */
export const phone = /* @__PURE__ */ defineKind("phone", "Smartphone", (g, w, h, note) => {
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
  let out = sweepStudio(g, w, h, base - ph * 0.4, cx, top + ph * 0.5);
  out += softContact(cx, base, pw * 0.75, unit * 0.022);
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
