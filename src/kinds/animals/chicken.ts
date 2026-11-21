import { defineKind, el, facing, hsl, mix, pts, s } from "../../draw/core";
import { numberWord } from "../../draw/words";
import { eye, skyFade, turn, turnBox } from "./shared";

interface Hen {
  body: string;
  wing: string;
  tail: string;
  neck?: string;
}

const HENS: readonly Hen[] = [
  { body: "#b5562a", wing: "#8e3f1c", tail: "#6e2f16" },
  { body: "#f4efe4", wing: "#e2dacb", tail: "#d8cfbd" },
  { body: "#34303a", wing: "#25222a", tail: "#1d1b22" },
  { body: "#d9a25e", wing: "#c08544", tail: "#9c6a34" },
  { body: "#8a6a52", wing: "#6e523e", tail: "#4e3a2c" },
];

const ROOSTERS: readonly Hen[] = [
  { body: "#b8462a", wing: "#7a2e1a", tail: "#1f3a34", neck: "#e8a33c" },
  { body: "#f4efe4", wing: "#e2dacb", tail: "#e9e3d6", neck: "#fbf7ee" },
  { body: "#2e2b33", wing: "#7a3a22", tail: "#1b2e2a", neck: "#d98c3a" },
];

const COMB = "#d93a2b";

const SHANK = "#e8b04a";

/** A hen or rooster standing on the ground at gy, facing right, its body half as long as S. */
function chickenFigure(x: number, gy: number, S: number, c: Hen, rooster: boolean): string {
  const by = gy - S * 1.05;
  const hx = x + S * 0.75;
  const hy = by - S * 0.88;
  // Legs and toes.
  let legs = "";
  for (const lx of [x - S * 0.2, x + S * 0.18])
    legs += s`M ${lx} ${by + S * 0.5} L ${lx + S * 0.02} ${gy}
              M ${lx - S * 0.12} ${gy} L ${lx + S * 0.22} ${gy}`;
  let out = el("path", {
    d: legs,
    stroke: SHANK,
    "stroke-width": S * 0.08,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Tail: a rooster's long sickle feathers, or a hen's rounded tuft.
  if (rooster) {
    let sickles = "";
    for (let k = 0; k < 5; k++)
      sickles += s`M ${x - S * 0.55} ${by - S * 0.3}
                   Q ${x - S * (0.9 + k * 0.12)} ${by - S * (1.85 - k * 0.3)}
                     ${x - S * (1.45 + k * 0.1)} ${by - S * (0.55 - k * 0.25)}`;
    out += el("path", {
      d: sickles,
      stroke: c.tail,
      "stroke-width": S * 0.13,
      "stroke-linecap": "round",
      fill: "none",
    });
  } else
    out += el("path", {
      d: s`M ${x - S * 0.45} ${by - S * 0.3}
           Q ${x - S * 0.85} ${by - S * 1.35} ${x - S * 1.2} ${by - S * 1.05}
           Q ${x - S * 1.3} ${by - S * 0.25} ${x - S * 0.65} ${by + S * 0.35} Z`,
      fill: c.tail,
    });
  // Body, plump in front.
  out += el("ellipse", {
    cx: x,
    cy: by,
    rx: S,
    ry: S * 0.68,
    fill: c.body,
    transform: s`rotate(-10 ${x} ${by})`,
  });
  // Neck, with a rooster's hackles hanging over the shoulders.
  out += el("ellipse", {
    cx: hx - S * 0.12,
    cy: by - S * 0.45,
    rx: S * (rooster ? 0.38 : 0.3),
    ry: S * 0.55,
    fill: c.neck ?? c.body,
    transform: s`rotate(25 ${hx - S * 0.12} ${by - S * 0.45})`,
  });
  // Wing.
  out += el("ellipse", {
    cx: x - S * 0.12,
    cy: by + S * 0.02,
    rx: S * 0.62,
    ry: S * 0.36,
    fill: c.wing,
    transform: s`rotate(-12 ${x - S * 0.12} ${by + S * 0.02})`,
  });
  // Comb, behind the head, then the head.
  const lobes = rooster ? 4 : 3;
  const lobeR = S * (rooster ? 0.13 : 0.09);
  let comb = "";
  for (let k = 0; k < lobes; k++) {
    const a = Math.PI * (1.2 + (k / (lobes - 1)) * 0.55);
    comb += el("circle", {
      cx: hx + Math.cos(a) * S * 0.25,
      cy: hy + Math.sin(a) * S * 0.25 - lobeR * 0.4,
      r: lobeR,
    });
  }
  out += el("g", { fill: COMB }, comb);
  out += el("circle", { cx: hx, cy: hy, r: S * 0.27, fill: c.neck ?? c.body });
  // Beak, wattle and eye.
  out += el("polygon", {
    points: pts([
      [hx + S * 0.2, hy - S * 0.08],
      [hx + S * 0.48, hy + S * 0.03],
      [hx + S * 0.2, hy + S * 0.11],
    ]),
    fill: SHANK,
  });
  out += el("ellipse", {
    cx: hx + S * 0.2,
    cy: hy + S * (rooster ? 0.3 : 0.25),
    rx: S * (rooster ? 0.09 : 0.07),
    ry: S * (rooster ? 0.17 : 0.12),
    fill: COMB,
  });
  out += eye(hx + S * 0.08, hy - S * 0.06, S * 0.055);
  return out;
}

/** A fluffy chick standing at gy, facing right, r across its body. */
function chick(x: number, gy: number, r: number, pecking: boolean): string {
  const hx = x + r * (pecking ? 0.95 : 0.6);
  const hy = gy - r * (pecking ? 0.75 : 1.85);
  let out = el("path", {
    d: s`M ${x - r * 0.25} ${gy - r * 0.4} V ${gy} M ${x + r * 0.2} ${gy - r * 0.4} V ${gy}`,
    stroke: SHANK,
    "stroke-width": r * 0.14,
    "stroke-linecap": "round",
  });
  out += el("ellipse", { cx: x, cy: gy - r * 1.05, rx: r, ry: r * 0.85, fill: "#f7d154" });
  out += el("circle", { cx: hx, cy: hy, r: r * 0.6, fill: "#f7d154" });
  out += el("ellipse", { cx: x - r * 0.15, cy: gy - r, rx: r * 0.5, ry: r * 0.3, fill: "#e8b93a" });
  out += el("polygon", {
    points: pts([
      [hx + r * 0.5, hy - r * 0.12],
      [hx + r * 0.85, hy + r * 0.05],
      [hx + r * 0.5, hy + r * 0.18],
    ]),
    fill: "#f08a24",
  });
  out += el("circle", { cx: hx + r * 0.2, cy: hy - r * 0.12, r: r * 0.11, fill: "#1a1a1e" });
  return out;
}

/** A hen or a rooster in a farmyard by a fence, sometimes with chicks and a barn. */
export const chicken = /* @__PURE__ */ defineKind("chicken", "Chicken", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const rooster = g.chance(0.35);
  const c = g.pick(rooster ? ROOSTERS : HENS);
  const dir = g.pick([1, -1]);
  const S = unit * g.f(0.16, 0.19);
  const gy = h * g.f(0.78, 0.85);
  const hz = gy - unit * g.f(0.16, 0.22);
  const back = rooster ? 1.75 : 1.35;
  // Chicks in front of and behind the parent, as many as fit.
  const wanted = rooster ? 0 : g.chance(0.6) ? g.i(1, 4) : 0;
  let chicks = wanted;
  const ahead = (n: number): number => (n > 0 ? 1.55 + Math.min(n, 2) * 0.7 : 1.05) * S;
  const behind = (n: number): number => (n > 2 ? 1.9 + (n - 2) * 0.7 : back) * S;
  while (chicks > 0 && ahead(chicks) + behind(chicks) > w * 0.94) chicks--;
  const cx = w / 2 - (dir * (ahead(chicks) - behind(chicks))) / 2;
  const skyHue = g.f(190, 215);
  let out = skyFade(g, w, h, hsl(skyHue, 50, 74), hsl(skyHue - 15, 50, 92));
  // Rolling fields on the horizon, and the yard.
  out += el("path", {
    d: s`M -5 ${hz} Q ${w * g.f(0.2, 0.8)} ${hz - unit * g.f(0.06, 0.14)} ${w + 5} ${hz} V ${h} H -5 Z`,
    fill: hsl(g.f(85, 115), 35, g.f(52, 60)),
  });
  const yard = g.pick(["#c9a877", "#b99a6a", "#9cb86a", "#8fae5e"]);
  out += el("path", {
    d: s`M -5 ${hz + (gy - hz) * 0.5} Q ${w / 2} ${hz + (gy - hz) * 0.35} ${w + 5} ${hz + (gy - hz) * 0.5} V ${h} H -5 Z`,
    fill: yard,
  });
  const fenceY = hz + (gy - hz) * 0.42;
  const barn = g.chance(0.5);
  if (barn) {
    // A barn off to the side the chicken faces away from.
    const bw = unit * g.f(0.32, 0.4);
    const bh = bw * 0.62;
    const bx = dir > 0 ? w * g.f(0.03, 0.12) : w * g.f(0.88, 0.97) - bw;
    const red = g.pick(["#a8432f", "#b5503a", "#8e3b2c", "#c2683e"]);
    out += el("polygon", {
      points: pts([
        [bx, fenceY],
        [bx, fenceY - bh],
        [bx + bw * 0.2, fenceY - bh - bw * 0.28],
        [bx + bw * 0.8, fenceY - bh - bw * 0.28],
        [bx + bw, fenceY - bh],
        [bx + bw, fenceY],
      ]),
      fill: red,
    });
    out += el("path", {
      d: s`M ${bx - bw * 0.03} ${fenceY - bh + bw * 0.02} L ${bx + bw * 0.2} ${fenceY - bh - bw * 0.28}
           H ${bx + bw * 0.8} L ${bx + bw * 1.03} ${fenceY - bh + bw * 0.02}`,
      stroke: "#5a4a44",
      "stroke-width": bw * 0.05,
      "stroke-linejoin": "round",
      fill: "none",
    });
    // The door, with its cross brace.
    const dx = bx + bw * 0.32;
    const dh = bh * 0.62;
    out += el("rect", { x: dx, y: fenceY - dh, width: bw * 0.36, height: dh, fill: mix(red, "#000000", 0.25) });
    out += el("path", {
      d: s`M ${dx} ${fenceY - dh} L ${dx + bw * 0.36} ${fenceY} M ${dx + bw * 0.36} ${fenceY - dh} L ${dx} ${fenceY}
           M ${dx} ${fenceY - dh} H ${dx + bw * 0.36} V ${fenceY} H ${dx} Z`,
      stroke: "#f4efe4",
      "stroke-width": bw * 0.025,
      fill: "none",
    });
  }
  // A wooden fence along the back of the yard.
  const wood = g.pick(["#a07850", "#8b6a4a", "#c9b79a", "#e9e3d6"]);
  const fh = unit * g.f(0.11, 0.14);
  const gap = unit * g.f(0.16, 0.22);
  let posts = "";
  for (let px = g.f(0, gap); px < w + gap; px += gap) posts += s`M ${px} ${fenceY + unit * 0.01} V ${fenceY - fh}`;
  out += el("path", { d: posts, stroke: wood, "stroke-width": unit * 0.022, fill: "none" });
  out += el("path", {
    d: s`M 0 ${fenceY - fh * 0.8} H ${w} M 0 ${fenceY - fh * 0.38} H ${w}`,
    stroke: wood,
    "stroke-width": unit * 0.016,
  });
  // Shadow and scattered grain on the ground.
  out += el("ellipse", { cx, cy: gy, rx: S * 1.2, ry: S * 0.12, fill: "#000", opacity: "0.12" });
  let grain = "";
  for (let k = g.i(6, 12); k > 0; k--) {
    const gx = cx + dir * S * g.f(0.6, 2.4);
    const gyy = gy + (h - gy) * g.f(0.05, 0.7);
    grain += s`M ${gx} ${gyy} h ${unit * 0.008}`;
  }
  out += el("path", {
    d: grain,
    stroke: "#e8c66a",
    "stroke-width": unit * 0.012,
    "stroke-linecap": "round",
  });
  out += facing(cx, dir);
  out += chickenFigure(cx, gy, S, c, rooster);
  // The chicks: up to two ahead, the rest behind.
  for (let k = 0; k < chicks; k++) {
    const front = k < 2;
    const x = front ? cx + S * (1.45 + k * 0.7) : cx - S * (1.75 + (k - 2) * 0.7);
    const cy = gy + S * g.f(0.08, 0.2);
    const r = S * 0.24;
    const away = front && g.chance(0.3);
    out += el("ellipse", { cx: x, cy, rx: r * 1.1, ry: r * 0.15, fill: "#000", opacity: "0.12" });
    out += away ? facing(x, -1) + chick(x, cy, r, g.chance(0.5)) + "</g>" : chick(x, cy, r, g.chance(0.4));
  }
  out += "</g>";
  const bird = rooster ? "rooster" : "hen";
  const brood = chicks ? ` with ${numberWord(chicks)} chick${chicks > 1 ? "s" : ""}` : "";
  note.alt(
    `A ${bird}${brood} in a farmyard by a ${barn ? "barn" : "wooden fence"}, facing ${dir > 0 ? "right" : "left"}`,
  );
  const by = gy - S * 1.05;
  const hx = cx + S * 0.75;
  const hy = by - S * 0.88;
  note.focus(turn(cx, dir, hx + S * 0.08), hy);
  // Comb, head, beak and wattle.
  note.frame(turnBox(cx, dir, hx - S * 0.45, S * 1.0), hy - S * 0.6, S * 1.0, S * 1.1);
  return out;
});
