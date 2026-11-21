import { defineKind, el, facing, fill, hsl, mix, type Point, pts, s } from "../../draw/core";
import { sky, turn, turnBox } from "./shared";

const MICE = [
  { fur: "#9a9590", light: "#c9c4bf" },
  { fur: "#a5866a", light: "#d8c2a8" },
  { fur: "#efe9e1", light: "#ffffff" },
  { fur: "#7c6a5c", light: "#b8a594" },
] as const;

/** A mouse with big round ears, by a wedge of cheese indoors or among wheat in a field. */
export const mouse = /* @__PURE__ */ defineKind("mouse", "Mouse", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const coat = g.pick(MICE);
  const dir = g.pick([1, -1]);
  const indoors = g.chance(0.5);
  const gy = h * g.f(0.74, 0.8);
  const rx = unit * g.f(0.17, 0.2);
  const ry = rx * g.f(0.7, 0.8);
  const cx = w / 2 + dir * rx * (indoors ? 0.2 : 0.5);
  const bx = cx - rx * 0.2;
  const by = gy - ry;
  const pink = "#f2a0aa";
  let out = "";
  if (indoors) {
    // Wall, skirting board and floorboards.
    out += fill(w, h, hsl(g.f(20, 60), g.f(20, 40), g.f(80, 88)));
    const board = h * 0.06;
    out += el("rect", { y: gy - unit * 0.12 - board, width: w, height: board, fill: "#f4efe6" });
    out += el("rect", { y: gy - unit * 0.12, width: w, height: h, fill: hsl(g.f(25, 35), 40, g.f(48, 58)) });
    let seams = "";
    for (let k = 1; k < 4; k++) seams += s`M 0 ${gy - unit * 0.12 + ((h - gy + unit * 0.12) * k) / 4} H ${w} `;
    out += el("path", { d: seams, stroke: "#000", "stroke-width": "1", opacity: "0.08" });
  } else {
    out += sky(g, w, h, g.f(190, 215));
    out += el("rect", { y: gy - unit * 0.05, width: w, height: h, fill: hsl(g.f(75, 105), 40, g.f(46, 54)) });
    // Wheat stalks behind the mouse.
    for (let k = g.i(3, 5); k > 0; k--) {
      const x = w * g.f(0.03, 0.97);
      const top = gy - unit * g.f(0.45, 0.7);
      const lean = g.f(-1, 1) * unit * 0.05;
      out += el("path", {
        d: s`M ${x} ${gy} Q ${x} ${(gy + top) / 2} ${x + lean} ${top}`,
        stroke: "#c9a85c",
        "stroke-width": Math.max(1.5, unit * 0.01),
        fill: "none",
      });
      let grains = "";
      for (let j = 0; j < 4; j++) {
        const gx = x + lean * (1 - j * 0.05);
        const gyy = top + j * unit * 0.03;
        for (const sd of [-1, 1])
          grains += el("ellipse", {
            cx: gx + sd * unit * 0.012,
            cy: gyy,
            rx: unit * 0.01,
            ry: unit * 0.02,
            transform: s`rotate(${sd * 25} ${gx + sd * unit * 0.012} ${gyy})`,
          });
      }
      out += el("g", { fill: "#e2c06e" }, grains);
    }
  }
  // Shadow.
  out += el("ellipse", { cx: bx + rx * 0.2, cy: gy, rx: rx * 1.4, ry: ry * 0.12, fill: "#000", opacity: "0.15" });
  out += facing(cx, dir);
  // Tail, lying along the floor and curling up at the end.
  out += el("path", {
    d: s`M ${bx - rx * 0.9} ${by + ry * 0.55}
         C ${bx - rx * 1.4} ${gy + rx * 0.05} ${bx - rx * 1.9} ${gy} ${bx - rx * 2.1} ${gy - rx * g.f(0.25, 0.5)}`,
    stroke: pink,
    "stroke-width": rx * 0.08,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Far ear, body and feet.
  const hx = cx + rx * 0.7;
  const hy = gy - ry * 1.15;
  const hr = rx * 0.45;
  out += el("circle", { cx: hx - hr * 0.55, cy: hy - hr * 1.05, r: rx * 0.27, fill: mix(coat.fur, "#000000", 0.15) });
  for (const fx of [bx - rx * 0.45, bx + rx * 0.35, hx + hr * 0.2])
    out += el("ellipse", { cx: fx, cy: gy - rx * 0.03, rx: rx * 0.13, ry: rx * 0.06, fill: pink });
  out += el("ellipse", { cx: bx, cy: by, rx, ry, fill: coat.fur });
  out += el("ellipse", { cx: bx + rx * 0.25, cy: by + ry * 0.4, rx: rx * 0.55, ry: ry * 0.45, fill: coat.light });
  // Head with a pointed snout.
  const tip: Point = [hx + hr * 1.75, hy + hr * 0.35];
  out += el("path", {
    d: s`M ${hx - hr} ${hy}
         Q ${hx - hr} ${hy - hr} ${hx} ${hy - hr}
         Q ${hx + hr * 0.9} ${hy - hr * 0.8} ${tip[0]} ${tip[1]}
         Q ${hx + hr * 0.8} ${hy + hr * 1.05} ${hx} ${hy + hr * 0.95}
         Q ${hx - hr} ${hy + hr} ${hx - hr} ${hy} Z`,
    fill: coat.fur,
  });
  // Near ear.
  const earX = hx - hr * 0.1;
  const earY = hy - hr * 1.15;
  out += el("circle", { cx: earX, cy: earY, r: rx * 0.32, fill: coat.fur });
  out += el("circle", { cx: earX + rx * 0.03, cy: earY + rx * 0.02, r: rx * 0.2, fill: pink });
  // Nose, eye, cheek and whiskers.
  out += el("circle", { cx: tip[0], cy: tip[1], r: rx * 0.06, fill: "#e46f86" });
  const ex = hx + hr * 0.5;
  const ey = hy - hr * 0.2;
  out += el("circle", { cx: ex, cy: ey, r: rx * 0.07, fill: "#1a1412" });
  out += el("circle", { cx: ex + rx * 0.02, cy: ey - rx * 0.025, r: rx * 0.022, fill: "#fff" });
  out += el("circle", { cx: hx + hr * 0.35, cy: hy + hr * 0.4, r: rx * 0.09, fill: "#f28b9b", opacity: "0.35" });
  let whiskers = "";
  for (const k of [-1, 0, 1])
    whiskers += s`M ${tip[0] - rx * 0.12} ${tip[1] + rx * 0.02} l ${rx * 0.45} ${k * rx * 0.15 - rx * 0.02} `;
  out += el("path", {
    d: whiskers,
    stroke: coat.fur === "#efe9e1" ? "#8a8078" : "#4a403a",
    "stroke-width": rx * 0.018,
    opacity: "0.6",
  });
  if (indoors) {
    // A wedge of cheese in front of the nose, with holes.
    const cx0 = tip[0] + rx * 0.2;
    const cw = rx * 0.85;
    const ch = rx * 0.55;
    out += el("polygon", {
      points: pts([
        [cx0, gy],
        [cx0, gy - ch],
        [cx0 + cw, gy - ch * 0.45],
        [cx0 + cw, gy],
      ]),
      fill: "#f2c14e",
    });
    out += el("polygon", {
      points: pts([
        [cx0, gy - ch],
        [cx0 + cw, gy - ch * 0.45],
        [cx0 + cw * 0.85, gy - ch * 0.5],
      ]),
      fill: "#f7d77a",
    });
    for (const [dx, dy, r] of [
      [0.25, 0.4, 0.09],
      [0.6, 0.22, 0.07],
      [0.45, 0.7, 0.06],
    ])
      out += el("circle", { cx: cx0 + cw * dx, cy: gy - ch * dy, r: rx * r, fill: "#d9a43a" });
  }
  out += "</g>";
  note.alt(indoors ? "A mouse on a wooden floor beside a wedge of cheese" : "A mouse in a field among stalks of wheat");
  note.focus(turn(cx, dir, ex), ey);
  // Head and ears.
  const left = hx - hr * 1.6;
  const right = tip[0] + rx * 0.1;
  note.frame(turnBox(cx, dir, left, right - left), earY - rx * 0.4, right - left, hy + hr - earY + rx * 0.45);
  return out;
});
