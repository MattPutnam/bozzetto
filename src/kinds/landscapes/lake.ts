import { defineKind, el, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { AT, curve, daySky, lerp, TIMES } from "./shared";

/** A still mountain lake that mirrors the peaks and sky above it. */
export const lake = /* @__PURE__ */ defineKind("lake", "Mountain lake", (g, w, h, note) => {
  const time = g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const shore = h * g.f(0.56, 0.66);
  const skyId = g.id("sky");
  // Everything above the water, drawn once here and again upside down as the reflection.
  let scene = el("rect", { width: w, height: shore, fill: `url(#${skyId})` });
  if (g.chance(0.65))
    scene += el("circle", {
      cx: w * g.f(0.15, 0.85),
      cy: shore * g.f(0.25, 0.5),
      r: unit * g.f(0.05, 0.08),
      fill: sky.sun,
    });
  const snow = time === "day" ? hsl(sky.hue, 30, 97) : time === "dawn" ? hsl(20, 70, 93) : hsl(330, 35, 82);
  // The highest peak draws the eye.
  let peak: Point = [w / 2, shore];
  // The far range, tall and snowcapped.
  const amp = shore * g.f(0.5, 0.68);
  const steps = g.i(3, 5);
  const ridge: Point[] = [[0, shore - amp * g.f(0.1, 0.5)]];
  for (let step = 1; step < steps * 2; step++) {
    const x = (w * step) / (steps * 2) + g.f(-0.25, 0.25) * (w / (steps * 2));
    ridge.push([x, shore - amp * (step % 2 ? g.f(0.6, 1) : g.f(0.15, 0.4))]);
  }
  ridge.push([w, shore - amp * g.f(0.1, 0.5)]);
  scene += el("polygon", {
    points: pts([...ridge, [w, shore], [0, shore]]),
    fill: hsl(sky.hue + 10, 18, 56 + sky.dim),
  });
  // Snow on each peak, with a ragged lower edge.
  let caps = "";
  for (let k = 1; k < ridge.length - 1; k += 2) {
    const top = ridge[k];
    if (top[1] < peak[1]) peak = top;
    const t = g.f(0.26, 0.42);
    const left = lerp(top, ridge[k - 1], t);
    const right = lerp(top, ridge[k + 1], t);
    const ragged = [0.25, 0.5, 0.75].map((f, j) => lerp(lerp(right, left, f), top, j % 2 ? 0 : g.f(0.2, 0.4)));
    caps += `M${pts([top, right, ...ragged, left])}Z`;
  }
  scene += el("path", { d: caps, fill: snow });
  // The shaded side of each peak.
  let shade = "";
  for (let k = 1; k < ridge.length - 1; k += 2) shade += `M${pts([ridge[k], ridge[k + 1], [ridge[k][0], shore]])}Z`;
  scene += el("path", { d: shade, fill: "#000", opacity: "0.1" });
  // Low wooded hills along the far shore.
  const hill = curve(w, shore - shore * g.f(0.04, 0.14), shore - shore * g.f(0.04, 0.14), -shore * g.f(-0.04, 0.06));
  const green = g.f(110, 160);
  scene += el("path", { d: hill.d() + s`V${shore}H0Z`, fill: hsl(green, 25, 32 + sky.dim) });
  // A treeline of small pines on those hills.
  let trees = "";
  const gap = unit * g.f(0.025, 0.04);
  for (let x = g.f(0, gap); x < w; x += gap * g.f(0.6, 1.4)) {
    const base = hill.at(x) + unit * 0.01;
    const th = unit * g.f(0.03, 0.065);
    trees += s`M${x - th * 0.25} ${base}L${x} ${base - th}L${x + th * 0.25} ${base}Z`;
  }
  scene += el("path", { d: trees, fill: hsl(green, 30, 22 + sky.dim) });

  // The scene is drawn once in the defs and used twice: upright, and flipped below the shore as the reflection.
  const view = g.id("view");
  let out = el("defs", {}, lin(skyId, sky.stops), el("g", { id: view }, scene));
  out += fill(w, h, `url(#${skyId})`);
  out += el("use", { href: `#${view}` });
  out += el("use", { href: `#${view}`, transform: s`matrix(1 0 0 -1 0 ${2 * shore})` });
  // A tint of water over the reflection, and a few ripples.
  out += el("rect", {
    y: shore,
    width: w,
    height: h - shore,
    fill: hsl(sky.hue + 5, 45, 28 + sky.dim),
    opacity: "0.35",
  });
  out += el("rect", { y: shore - 0.5, width: w, height: Math.max(1, unit * 0.004), fill: "#000", opacity: "0.15" });
  const ripples = g.i(3, 6);
  for (let k = 0; k < ripples; k++) {
    const rw = w * g.f(0.08, 0.3);
    out += el("rect", {
      x: g.f(-0.1, 1) * w,
      y: shore + (h - shore) * g.f(0.1, 0.92),
      width: rw,
      height: Math.max(1, unit * 0.005),
      rx: unit * 0.003,
      fill: "#fff",
      opacity: g.f(0.15, 0.35),
    });
  }
  note.alt(`A still mountain lake ${AT[time]}, mirroring snowy peaks`);
  note.focus(...peak);
  return out;
});
