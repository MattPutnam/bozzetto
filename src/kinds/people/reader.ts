import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";
import { arm, capital, describe, figure, halfLength, hand, headBox, paint, person, type Tone } from "./shared";

/** A half-length figure reading a book, in an armchair or by a window. */
export const reader = /* @__PURE__ */ defineKind("reader", "Reading", (g, w, h, note) => {
  const p = person(g.fork("person"));
  // The side the window or lamp is on; the reader sits a little off to the other side.
  const side = g.chance(0.5) ? 1 : -1;
  const unit = Math.min(w, h);
  const { rx, ry, cx, cy, sw, shoulderY } = halfLength(g, p, w, h, -side * Math.min(w * 0.1, unit * 0.12));
  const hue = g.f(0, 360);
  const inChair = g.chance(0.5);
  const chair: Tone = [g.f(0, 360), g.f(25, 45), g.f(38, 55)];
  let out = fill(w, h, hsl(hue, 28, 84));

  if (inChair) {
    // A floor lamp beside the chair, its shade glowing.
    const lampX = cx + side * (sw * 1.5 + rx * 1.4);
    const lampTop = cy - ry * 0.6;
    out += el("rect", { x: lampX - rx * 0.05, y: lampTop, width: rx * 0.1, height: h - lampTop, fill: "#5a5048" });
    out += el("circle", { cx: lampX, cy: lampTop + rx * 0.5, r: rx * 1.3, fill: "#fff6d8", opacity: "0.5" });
    out += el("path", {
      d: s`M ${lampX - rx * 0.45} ${lampTop - rx * 0.7} H ${lampX + rx * 0.45}
         L ${lampX + rx * 0.75} ${lampTop + rx * 0.2} H ${lampX - rx * 0.75} Z`,
      fill: hsl(hue + 30, 45, 78),
    });
    // The chair's high back behind the reader.
    out += el("rect", {
      x: cx - sw * 1.45,
      y: cy + ry * 0.25,
      width: sw * 2.9,
      height: h,
      rx: rx * 0.9,
      fill: paint(chair),
    });
  } else {
    // A window with a cross of glazing bars and a sill.
    const winW = unit * 0.44;
    const winH = unit * 0.52;
    const winX = side > 0 ? cx + sw + rx * 1.1 : cx - sw - rx * 1.1 - winW;
    const winY = cy - ry * 1.1;
    const sky = g.id("sky");
    const frame = hsl(hue, 18, 95);
    out += el("defs", {}, lin(sky, [hsl(g.f(195, 220), 55, 78), hsl(g.f(30, 60), 70, 90)]));
    out += el("rect", { x: winX, y: winY, width: winW, height: winH, fill: frame });
    const pane = rx * 0.18;
    out += el("rect", {
      x: winX + pane,
      y: winY + pane,
      width: winW - pane * 2,
      height: winH - pane * 2,
      fill: `url(#${sky})`,
    });
    out += el("path", {
      d: s`M ${winX + winW / 2} ${winY} V ${winY + winH} M ${winX} ${winY + winH * 0.45} H ${winX + winW}`,
      stroke: frame,
      "stroke-width": pane,
    });
    out += el("rect", {
      x: winX - rx * 0.25,
      y: winY + winH,
      width: winW + rx * 0.5,
      height: rx * 0.22,
      fill: hsl(hue, 15, 90),
    });
    out += el("rect", {
      x: winX - rx * 0.25,
      y: winY + winH + rx * 0.22,
      width: winW + rx * 0.5,
      height: rx * 0.08,
      fill: "#000",
      opacity: "0.08",
    });
  }

  out += figure(p, cx, cy, rx, sw, h + 2, side * g.f(-3, -7), "down");

  // The book, held open at the chest with its cover toward us.
  const bx = cx;
  const by = shoulderY + ry * 1.35;
  const bw = rx * 2.2;
  const bh = rx * 1.45;
  const sag = bh * 0.08;
  const handY = by + bh * 0.22;
  for (const k of [-1, 1])
    out += arm(
      p,
      rx,
      [cx + k * sw * 0.78, shoulderY + ry * 0.35],
      [cx + k * sw * 0.98, by + bh * 0.55],
      [bx + k * bw * 0.42, handY],
    );
  // Pages, just showing over the cover.
  out += el("path", {
    d: s`M ${bx - bw * 0.47} ${by - bh / 2 - sag * 0.6}
       Q ${bx - bw * 0.25} ${by - bh / 2 - sag * 1.6} ${bx} ${by - bh / 2 + sag * 0.6}
       Q ${bx + bw * 0.25} ${by - bh / 2 - sag * 1.6} ${bx + bw * 0.47} ${by - bh / 2 - sag * 0.6}
       V ${by} H ${bx - bw * 0.47} Z`,
    fill: "#f5f0e4",
  });
  const cover: Tone = [g.f(0, 360), g.f(35, 60), g.f(35, 52)];
  for (const k of [-1, 1])
    out += el("path", {
      d: s`M ${bx} ${by - bh / 2 + sag} L ${bx + (k * bw) / 2} ${by - bh / 2}
         V ${by + bh / 2} L ${bx} ${by + bh / 2 + sag} Z`,
      fill: paint(cover, k > 0 ? 6 : 0),
    });
  for (const k of [-1, 1]) out += hand(p, bx + k * bw * 0.42, handY, rx);

  if (inChair)
    // The chair's arms, in front of the reader's elbows.
    for (const k of [-1, 1]) {
      const armTop = by + bh * 0.75;
      out += el("rect", {
        x: k < 0 ? cx - sw * 1.6 : cx + sw * 1.6 - sw * 0.6,
        y: armTop,
        width: sw * 0.6,
        height: h,
        rx: rx * 0.35,
        fill: paint(chair, 7),
      });
    }

  note.alt(`${capital(describe(p))} reading a book ${inChair ? "in an armchair" : "by a window"}`);
  note.focus(cx, cy + ry);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});
