import { defineKind, el, hsl, mix, type Point, pts, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { andList, numberWord } from "../../draw/words";
import { BOARDS } from "./shared";

const CRUSTS = ["#c98a4a", "#b8743a", "#d39552", "#a8652f"];

const CRUMBS = ["#f3e2bf", "#f1dcb0", "#f6e8c8"];

/** The face of a sandwich loaf's slice, `fw` wide and `fh` tall, standing on (x, y): a square base under a dome. */
function sliceFace(x: number, y: number, fw: number, fh: number): string {
  const hw = fw / 2;
  const r = fw * 0.12;
  return s`M ${x - hw} ${y - r} L ${x - hw} ${y - fh * 0.62}
    C ${x - hw * 1.15} ${y - fh * 1.08} ${x + hw * 1.15} ${y - fh * 1.08} ${x + hw} ${y - fh * 0.62}
    L ${x + hw} ${y - r} Q ${x + hw} ${y} ${x + hw - r} ${y} L ${x - hw + r} ${y} Q ${x - hw} ${y} ${x - hw} ${y - r} Z`;
}

/** A knife lying flat on a surface, squashed by `sq`: its handle starts at x0 and the blade points along `dir`. */
function flatKnife(x0: number, y: number, len: number, width: number, dir: number, sq: number, handle: string): string {
  const hw = (width / 2) * sq;
  const x1 = x0 + dir * len * 0.34;
  const x2 = x0 + dir * len;
  const grip: Point[] = [
    [x0, y - hw * 0.75],
    [x1, y - hw * 0.75],
    [x1, y + hw * 0.75],
    [x0, y + hw * 0.75],
  ];
  const blade: Point[] = [
    [x1, y - hw],
    [x2, y - hw],
    [x2 - dir * len * 0.12, y + hw],
    [x1, y + hw],
  ];
  const shift = (p: Point[]) => p.map(([x, py]): Point => [x + width * 0.08, py + width * 0.12]);
  return (
    el("polygon", { points: pts(shift(blade)), fill: "#000", opacity: "0.12" }) +
    el("polygon", { points: pts(shift(grip)), fill: "#000", opacity: "0.12" }) +
    el("polygon", { points: pts(blade), fill: "#cfd3d8" }) +
    el("polygon", {
      points: pts(grip),
      fill: handle,
      stroke: handle,
      "stroke-width": hw * 0.5,
      "stroke-linejoin": "round",
    })
  );
}

/**
 * A loaf on a board: a scored round loaf, a baguette or a sandwich loaf, sometimes with slices and a knife.
 *
 * @category Food
 */
export const bread = /* @__PURE__ */ defineKind("bread", "Bread", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const loaf = g.pick(["boule", "boule", "baguette", "sliced"] as const);
  const crust = g.pick(CRUSTS);
  const crumb = g.pick(CRUMBS);
  const count = g.chance(loaf === "sliced" ? 0.85 : 0.45) ? g.i(2, 3) : 0;
  const knife = g.chance(count ? 0.65 : 0.3);
  const slate = g.chance(0.15);
  const board = slate ? "#454b52" : g.pick(BOARDS);
  const boardW = Math.min(w * 0.9, unit * 1.45);
  const depth = unit * 0.22;
  const thick = unit * 0.04;
  // The loaf's length and height and a slice's width, before they are fitted to the board
  let ll = loaf === "baguette" ? boardW * (count ? 0.6 : 0.82) : loaf === "boule" ? unit * 0.6 : unit * 0.58;
  let lh = loaf === "baguette" ? unit * 0.15 : loaf === "boule" ? unit * 0.4 : unit * 0.36;
  let sw = loaf === "baguette" ? lh * 1.3 : loaf === "boule" ? ll * 0.62 : lh * 0.9;
  const span = () => sw * (1 + (count - 1) * 0.62);
  const extent = () => ll / 2 + (count ? ll * 0.2 + span() : ll / 2);
  const f = Math.min(1, (boardW * 0.9) / extent());
  ll *= f;
  lh *= f;
  sw *= f;
  const cx = w / 2;
  const lx = cx - extent() / 2 + ll / 2;
  // The board's front edge, so that the loaf and board sit in the middle of the picture
  const front = Math.min(h * 0.95 - thick, (h * 1.04 + depth * 0.58 + lh - thick) / 2);
  const back = front - depth;
  let out = table(g, w, h, Math.max(h * 0.1, back - unit * 0.07), hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  // The board: shadow, front edge, top and a little grain
  const bx = cx - boardW / 2;
  const corner = unit * 0.03;
  out += el("rect", {
    x: bx + unit * 0.01,
    y: back + depth * 0.4,
    width: boardW,
    height: depth * 0.6 + thick + unit * 0.02,
    rx: corner,
    fill: "#000",
    opacity: "0.12",
  });
  out += el("rect", {
    x: bx,
    y: back + depth * 0.5,
    width: boardW,
    height: depth * 0.5 + thick,
    rx: corner,
    fill: mix(board, "#000000", 0.22),
  });
  out += el("rect", { x: bx, y: back, width: boardW, height: depth, rx: corner, ry: corner * 0.6, fill: board });
  if (!slate) {
    let grain = "";
    for (let k = 0; k < 3; k++) {
      const gy = back + depth * (0.25 + k * 0.25 + g.f(-0.05, 0.05));
      const gx = bx + boardW * g.f(0.05, 0.3);
      grain += s`M${gx} ${gy}h${boardW * g.f(0.3, 0.6)}`;
    }
    out += el("path", { d: grain, stroke: "#000", "stroke-width": unit * 0.005, opacity: "0.1" });
  }
  const yb = back + depth * 0.42;
  const shade = mix(crust, "#000000", 0.2);
  const light = mix(crust, crumb, 0.55);
  // A soft shadow under the loaf
  out += el("ellipse", { cx: lx, cy: yb, rx: ll * 0.52, ry: depth * 0.1, fill: "#000", opacity: "0.15" });
  let what: string;
  if (loaf === "boule") {
    const hw = ll / 2;
    const dome = s`M ${lx - hw * 0.88} ${yb} Q ${lx - hw} ${yb} ${lx - hw} ${yb - lh * 0.3}
      C ${lx - hw} ${yb - lh * 1.25} ${lx + hw} ${yb - lh * 1.25} ${lx + hw} ${yb - lh * 0.3}
      Q ${lx + hw} ${yb} ${lx + hw * 0.88} ${yb} Z`;
    const clip = g.id("boule");
    out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: dome })));
    let inside = el("path", { d: dome, fill: crust });
    inside += el("ellipse", { cx: lx, cy: yb, rx: hw * 1.1, ry: lh * 0.3, fill: "#000", opacity: "0.12" });
    const floured = g.chance(0.5);
    if (floured)
      inside += el("ellipse", {
        cx: lx - hw * 0.1,
        cy: yb - lh * 0.9,
        rx: hw * 0.7,
        ry: lh * 0.3,
        fill: "#fff",
        opacity: "0.3",
      });
    out += el("g", { "clip-path": `url(#${clip})` }, inside);
    // The scoring: cuts opened up in the oven, each a dark groove with a pale edge
    const score = g.pick(["cross", "slash", "wheat", "lines"] as const);
    let d = "";
    if (score === "cross")
      d = s`M ${lx - hw * 0.55} ${yb - lh * 0.7} Q ${lx} ${yb - lh * 0.56} ${lx + hw * 0.55} ${yb - lh * 0.7}
            M ${lx + hw * 0.04} ${yb - lh * 0.95} Q ${lx - hw * 0.04} ${yb - lh * 0.66} ${lx} ${yb - lh * 0.36}`;
    else if (score === "slash")
      d = s`M ${lx - hw * 0.62} ${yb - lh * 0.5} Q ${lx - hw * 0.1} ${yb - lh * 1.02} ${lx + hw * 0.58} ${yb - lh * 0.78}`;
    else if (score === "lines")
      for (let k = 0; k < 3; k++) {
        const ly = yb - lh * (0.85 - k * 0.2);
        const lw = hw * (0.5 + k * 0.12);
        d += s`M ${lx - lw} ${ly} Q ${lx} ${ly + lh * 0.12} ${lx + lw} ${ly}`;
      }
    else {
      d = s`M ${lx} ${yb - lh * 0.95} Q ${lx - hw * 0.03} ${yb - lh * 0.65} ${lx} ${yb - lh * 0.35}`;
      for (let k = 0; k < 3; k++) {
        const ly = yb - lh * (0.85 - k * 0.18);
        for (const side of [-1, 1]) d += s`M ${lx + side * hw * 0.06} ${ly} l ${side * hw * 0.28} ${lh * 0.1}`;
      }
    }
    out += el("path", { d, stroke: shade, "stroke-width": lh * 0.075, fill: "none", "stroke-linecap": "round" });
    out += el("path", {
      d,
      stroke: light,
      "stroke-width": lh * 0.04,
      fill: "none",
      "stroke-linecap": "round",
      transform: s`translate(0 ${-lh * 0.018})`,
    });
    what = `A round sourdough loaf${floured ? ", dusted with flour," : ""} with ${
      {
        cross: "a scored cross",
        slash: "a single curved score",
        wheat: "a scored wheat pattern",
        lines: "scored lines",
      }[score]
    }`;
  } else if (loaf === "baguette") {
    const xL = lx - ll / 2;
    const xR = lx + ll / 2;
    const cut = count > 0;
    const right = cut
      ? s`L ${xR} ${yb} L ${xR} ${yb - lh * 0.8} Q ${xR} ${yb - lh} ${xR - lh * 0.3} ${yb - lh}`
      : s`L ${xR - lh * 0.7} ${yb} Q ${xR - lh * 0.15} ${yb} ${xR} ${yb - lh * 0.3}
          Q ${xR - lh * 0.25} ${yb - lh * 0.95} ${xR - lh * 1.1} ${yb - lh}`;
    out += el("path", {
      d: s`M ${xL} ${yb - lh * 0.3} Q ${xL + lh * 0.15} ${yb} ${xL + lh * 0.7} ${yb} ${right}
           L ${xL + lh * 1.1} ${yb - lh} Q ${xL + lh * 0.25} ${yb - lh * 0.95} ${xL} ${yb - lh * 0.3} Z`,
      fill: crust,
    });
    out += el("rect", {
      x: xL + lh * 0.5,
      y: yb - lh * 0.28,
      width: ll - lh,
      height: lh * 0.2,
      fill: "#000",
      opacity: "0.08",
    });
    // Diagonal scores along the top
    const n = Math.max(3, Math.round((ll - lh * 2) / (lh * 1.25)));
    const seg = (ll - lh * 2) / n;
    for (let k = 0; k < n; k++) {
      const sx = xL + lh + seg * (k + 0.5);
      const rot = s`rotate(-14 ${sx} ${yb - lh * 0.75})`;
      out += el("ellipse", { cx: sx, cy: yb - lh * 0.72, rx: seg * 0.42, ry: lh * 0.1, fill: shade, transform: rot });
      out += el("ellipse", { cx: sx, cy: yb - lh * 0.77, rx: seg * 0.38, ry: lh * 0.07, fill: light, transform: rot });
    }
    if (cut) {
      out += el("ellipse", { cx: xR, cy: yb - lh * 0.5, rx: lh * 0.2, ry: lh * 0.5, fill: shade });
      out += el("ellipse", { cx: xR, cy: yb - lh * 0.5, rx: lh * 0.15, ry: lh * 0.42, fill: crumb });
    }
    what = cut ? "A baguette, cut" : "A baguette";
  } else {
    // The loaf's side, then its cut end facing the slices: the same cross-section as a slice
    const fw = lh * 0.9;
    const xL = lx - ll / 2;
    const xF = lx + ll / 2 - fw / 2;
    const r = lh * 0.1;
    out += el("path", {
      d: s`M ${xL + r} ${yb} L ${xF} ${yb} L ${xF} ${yb - lh * 0.96} L ${xL + lh * 0.3} ${yb - lh * 0.96}
           Q ${xL} ${yb - lh * 0.96} ${xL} ${yb - lh * 0.62} L ${xL} ${yb - r} Q ${xL} ${yb} ${xL + r} ${yb} Z`,
      fill: crust,
    });
    out += el("path", {
      d: s`M ${xL + lh * 0.2} ${yb - lh * 0.84} Q ${xL + lh * 0.3} ${yb - lh * 0.9} ${xF - lh * 0.2} ${yb - lh * 0.9}`,
      stroke: "#fff",
      "stroke-width": lh * 0.05,
      fill: "none",
      "stroke-linecap": "round",
      opacity: "0.25",
    });
    out += el("path", { d: sliceFace(xF, yb, fw, lh), fill: shade });
    out += el("path", { d: sliceFace(xF, yb - lh * 0.045, fw * 0.88, lh * 0.89), fill: crumb });
    what = "A sandwich loaf, cut";
  }
  // Slices lying flat in front of the loaf, each overlapping the one before
  const sq = 0.38;
  const sy = back + depth * 0.68;
  let sx = lx + ll * 0.2 + sw / 2;
  for (let k = 0; k < count; k++) {
    const x = sx + sw * g.f(-0.04, 0.04);
    const y = sy + depth * g.f(-0.04, 0.04);
    if (loaf === "sliced") {
      // The loaf's cross-section, as on its cut end
      const fh = sw / 0.9;
      const flat = (d: string, fillColor: string, op?: string) =>
        el("path", {
          d,
          fill: fillColor,
          opacity: op,
          transform: s`translate(0 ${y}) scale(1 ${sq}) translate(0 ${-y})`,
        });
      out += flat(sliceFace(x + sw * 0.05, y + fh / 2 + sw * 0.12, sw, fh), "#000", "0.12");
      out += flat(sliceFace(x, y + fh / 2, sw, fh), crust);
      out += flat(sliceFace(x, y + fh / 2 - fh * 0.045, sw * 0.88, fh * 0.89), crumb);
    } else {
      const rx = sw / 2;
      const ry = Math.min(rx * (loaf === "boule" ? 0.5 : 0.55), depth * 0.2);
      out += el("ellipse", { cx: x + rx * 0.05, cy: y + ry * 0.25, rx, ry, fill: "#000", opacity: "0.12" });
      out += el("ellipse", { cx: x, cy: y, rx, ry, fill: crust });
      out += el("ellipse", { cx: x, cy: y - ry * 0.04, rx: rx * 0.86, ry: ry * 0.8, fill: crumb });
    }
    sx += sw * 0.62;
  }
  if (knife) {
    const dir = g.chance(0.5) ? 1 : -1;
    const kl = Math.min(boardW * 0.48, unit * 0.62);
    const kx = dir > 0 ? bx + boardW * 0.06 : bx + boardW * 0.06 + kl;
    out += flatKnife(kx, back + depth * 0.87, kl, unit * 0.09, dir, 0.45, g.pick(["#2b2b2b", "#6b4a2e", "#8b5a3c"]));
  }
  const extras = andList([count > 0 && `${numberWord(count)} slices`, knife && "a knife"]);
  note.alt(`${what} on a ${slate ? "slate" : "wooden"} board${extras ? `, with ${extras}` : ""}`);
  note.focus(lx, yb - lh * 0.55);
  return out;
});
