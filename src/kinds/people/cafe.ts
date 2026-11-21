import { defineKind, el, fill, hsl, s } from "../../draw/core";
import { arm, capital, describe, desk, figure, halfLength, hand, headBox, person } from "./shared";

/** A half-length figure at a café table, holding a cup in both hands. */
export const cafe = /* @__PURE__ */ defineKind("cafe", "Café", (g, w, h, note) => {
  const p = person(g.fork("person"));
  const { rx, ry, cx, cy, sw, shoulderY } = halfLength(g, p, w, h);
  const hue = g.f(10, 50);
  const tableY = cy + ry * 3.15;
  const side = g.chance(0.5) ? 1 : -1;
  // A warm wall with a darker panel along the bottom.
  let out = fill(w, h, hsl(hue, 35, 82));
  out += el("rect", { y: cy + ry * 2.2, width: w, height: h, fill: hsl(hue + g.f(-20, 160), 25, 62) });
  out += el("rect", { y: cy + ry * 2.2, width: w, height: rx * 0.12, fill: "#000", opacity: "0.1" });
  // A pendant lamp hanging to one side.
  const lampX = cx + side * (sw + rx * g.f(1.3, 2.2));
  const lampY = cy - ry * g.f(0.2, 0.8);
  out += el("path", { d: s`M ${lampX} 0 V ${lampY}`, stroke: "#3b332e", "stroke-width": rx * 0.05 });
  out += el("circle", { cx: lampX, cy: lampY + rx * 0.5, r: rx * 0.9, fill: "#fff6d8", opacity: "0.45" });
  out += el("path", {
    d: s`M ${lampX - rx * 0.65} ${lampY + rx * 0.5} Q ${lampX - rx * 0.6} ${lampY - rx * 0.05} ${lampX} ${lampY - rx * 0.05}
       Q ${lampX + rx * 0.6} ${lampY - rx * 0.05} ${lampX + rx * 0.65} ${lampY + rx * 0.5} Z`,
    fill: hsl(hue + 180, 35, 40),
  });
  out += el("circle", { cx: lampX, cy: lampY + rx * 0.5, r: rx * 0.16, fill: "#fff3c4" });

  out += figure(p, cx, cy, rx, sw, tableY + 2, g.f(-4, 4));
  out += desk(w, h, tableY, hsl(g.f(15, 40), g.f(25, 45), g.f(38, 60)));

  // The cup, held up from the table in both hands, elbows resting on the table.
  const takeaway = g.chance(0.35);
  const size = rx * 1.05;
  const cupBottom = tableY - ry * 0.2;
  const cupH = takeaway ? size * 1.25 : size * 0.85;
  const cupTop = cupBottom - cupH;
  const handY = cupBottom - cupH * 0.42;
  const cup = takeaway ? hsl(g.f(0, 360), 15, 92) : hsl(g.f(0, 360), g.f(20, 55), g.f(55, 85));
  const elbowY = tableY + Math.min((h - tableY) * 0.3, ry * 0.4);
  for (const k of [-1, 1])
    out += arm(
      p,
      rx,
      [cx + k * sw * 0.8, shoulderY + ry * 0.35],
      [cx + k * sw * 1.0, elbowY],
      [cx + k * size * 0.5, handY],
    );
  if (takeaway) {
    // A paper cup with a sleeve and a lid.
    out += el("path", {
      d: s`M ${cx - size * 0.45} ${cupTop} H ${cx + size * 0.45} L ${cx + size * 0.36} ${cupBottom} H ${cx - size * 0.36} Z`,
      fill: cup,
    });
    out += el("path", {
      d: s`M ${cx - size * 0.42} ${cupTop + cupH * 0.3} H ${cx + size * 0.42} L ${cx + size * 0.4} ${cupTop + cupH * 0.65} H ${cx - size * 0.4} Z`,
      fill: hsl(g.f(20, 40), 40, 55),
    });
    out += el("rect", {
      x: cx - size * 0.5,
      y: cupTop - size * 0.14,
      width: size,
      height: size * 0.16,
      rx: size * 0.06,
      fill: hsl(g.f(0, 360), 10, 30),
    });
  } else {
    // A wide cup with a darker rim of coffee.
    out += el("path", {
      d: s`M ${cx - size * 0.5} ${cupTop} H ${cx + size * 0.5}
         Q ${cx + size * 0.48} ${cupBottom} ${cx} ${cupBottom} Q ${cx - size * 0.48} ${cupBottom} ${cx - size * 0.5} ${cupTop} Z`,
      fill: cup,
    });
    out += el("ellipse", { cx, cy: cupTop, rx: size * 0.5, ry: size * 0.1, fill: "#6b4430" });
  }
  // Steam, squashed so that it fades out below the chin rather than rising over the face.
  const rise = Math.max(0.3, Math.min(1, (cupTop - size * 0.22 - (cy + ry * 1.3)) / (size * 0.6))) * size;
  out += el("path", {
    d: s`M ${cx - size * 0.12} ${cupTop - size * 0.22} q ${size * 0.12} ${-rise * 0.15} 0 ${-rise * 0.3} t 0 ${-rise * 0.3}
       M ${cx + size * 0.18} ${cupTop - size * 0.25} q ${size * 0.12} ${-rise * 0.14} 0 ${-rise * 0.28}`,
    fill: "none",
    stroke: "#fff",
    "stroke-width": size * 0.06,
    "stroke-linecap": "round",
    opacity: "0.6",
  });
  for (const k of [-1, 1]) out += hand(p, cx + k * size * 0.5, handY, rx);

  // Sometimes a pastry on a plate beside the cup.
  let extra = "";
  if (g.chance(0.5)) {
    const px = cx - side * (sw * 1.35 + rx * 0.4);
    const py = tableY + Math.min((h - tableY) * 0.35, ry * 0.5);
    out += el("ellipse", { cx: px, cy: py, rx: rx * 1.0, ry: rx * 0.26, fill: "#f4f1ec" });
    out += el("ellipse", { cx: px, cy: py - rx * 0.03, rx: rx * 0.75, ry: rx * 0.17, fill: "#000", opacity: "0.06" });
    // A croissant: a fat crescent with a few creases.
    out += el("path", {
      d: s`M ${px - rx * 0.75} ${py - rx * 0.05}
         Q ${px} ${py - rx * 0.85} ${px + rx * 0.75} ${py - rx * 0.05}
         Q ${px} ${py - rx * 0.25} ${px - rx * 0.75} ${py - rx * 0.05} Z`,
      fill: "#d9a050",
    });
    out += el("path", {
      d: s`M ${px - rx * 0.3} ${py - rx * 0.5} L ${px - rx * 0.22} ${py - rx * 0.22}
         M ${px} ${py - rx * 0.6} V ${py - rx * 0.26} M ${px + rx * 0.3} ${py - rx * 0.5} L ${px + rx * 0.22} ${py - rx * 0.22}`,
      stroke: "#b47a34",
      "stroke-width": rx * 0.05,
      "stroke-linecap": "round",
    });
    extra = " beside a croissant";
  }

  note.alt(`${capital(describe(p))} holding a ${takeaway ? "takeaway cup" : "cup of coffee"} at a café table${extra}`);
  note.focus(cx, cy + ry);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});
