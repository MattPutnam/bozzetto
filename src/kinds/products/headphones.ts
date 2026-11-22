import { defineKind, el, facing, s } from "../../draw/core";
import { baseFor, shade, softContact, sweepStudio, tint } from "./shared";

/**
 * Over-ear headphones standing on their ear cups, from the front or at three-quarters.
 *
 * @category Products
 */
export const headphones = /* @__PURE__ */ defineKind("headphones", "Headphones", (g, w, h, note) => {
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
  let out = sweepStudio(g, w, h, base - itemH * 0.42, cx, base - itemH * 0.5);
  const back = view === "front" ? 0 : unit * 0.035;
  // Cup centers: the far cup stands a little further back, so higher and smaller.
  const nearX = cx - gap / 2;
  const farX = cx + gap / 2;
  const farScale = view === "front" ? 1 : 0.92;
  const nearY = base - ch / 2;
  const farY = base - back - (ch * farScale) / 2;
  out += softContact(nearX, base, ch * 0.42, unit * 0.022);
  out += softContact(farX, base - back, ch * 0.4 * farScale, unit * 0.02);
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
