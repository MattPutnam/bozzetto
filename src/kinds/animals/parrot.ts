import { defineKind, el, facing, hsl, type Point, pts, qpt, s } from "../../draw/core";
import { eye, skyFade, turn, turnBox } from "./shared";

interface Parrot {
  name: string;
  body: string;
  head: string;
  wing: string;
  flight: string;
  tail: string;
  beak: string;
  jaw: string;
  belly?: string;
  crown?: string;
  /** Bare skin around the eye: a macaw's face patch or a smaller ring. */
  face?: string;
  macaw?: boolean;
}

const PARROTS: readonly Parrot[] = [
  {
    name: "macaw",
    macaw: true,
    body: "#d8352a",
    head: "#d8352a",
    wing: "#f2c14e",
    flight: "#2f64b5",
    tail: "#c8302a",
    beak: "#efe6d6",
    jaw: "#2b2b30",
    face: "#f6f1e8",
  },
  {
    name: "macaw",
    macaw: true,
    body: "#2f7fc1",
    head: "#2f7fc1",
    belly: "#f2bf3a",
    crown: "#4f9e4a",
    wing: "#2f7fc1",
    flight: "#24589a",
    tail: "#2a6fb0",
    beak: "#2b2b30",
    jaw: "#2b2b30",
    face: "#f6f1e8",
  },
  {
    name: "macaw",
    macaw: true,
    body: "#5f9e3a",
    head: "#5f9e3a",
    crown: "#d8352a",
    wing: "#5f9e3a",
    flight: "#2f64b5",
    tail: "#b5462a",
    beak: "#3a3a40",
    jaw: "#2b2b30",
    face: "#f6f1e8",
  },
  {
    name: "macaw",
    macaw: true,
    body: "#2e4fa3",
    head: "#2e4fa3",
    wing: "#2a4693",
    flight: "#223b80",
    tail: "#2a4693",
    beak: "#26262c",
    jaw: "#26262c",
    face: "#f2c14e",
  },
  {
    name: "parrot",
    body: "#4f9e3c",
    head: "#4f9e3c",
    crown: "#f0cf4a",
    wing: "#3e8030",
    flight: "#2f64b5",
    tail: "#7bb84a",
    beak: "#b9aa98",
    jaw: "#8f8274",
  },
  {
    name: "lovebird",
    body: "#5fae4a",
    head: "#f08a5d",
    wing: "#3f8a32",
    flight: "#3f7f34",
    tail: "#4f86c6",
    beak: "#e0483a",
    jaw: "#c23a2e",
    face: "#f6f1e8",
  },
  {
    name: "budgie",
    body: "#8cc63e",
    head: "#f3e04f",
    wing: "#6f9a32",
    flight: "#3c4a2a",
    tail: "#2f5f8a",
    beak: "#e8c88a",
    jaw: "#c8a86a",
  },
  {
    name: "parrot",
    body: "#9a9ca3",
    head: "#a6a8ae",
    wing: "#82848c",
    flight: "#5e6068",
    tail: "#d8352a",
    beak: "#2b2b30",
    jaw: "#2b2b30",
    face: "#e9e7e2",
  },
];

/** A long pointed leaf from (x, y), reaching `len` at angle `a` (degrees), with a midrib. */
function bigLeaf(x: number, y: number, a: number, len: number, wide: number, paint: string): string {
  return el(
    "g",
    { transform: s`translate(${x} ${y}) rotate(${a})` },
    el("path", {
      d: s`M 0 0 Q ${len * 0.35} ${-wide} ${len} 0 Q ${len * 0.35} ${wide} 0 0 Z`,
      fill: paint,
    }),
    el("path", {
      d: s`M 0 0 L ${len * 0.92} 0`,
      stroke: "#000",
      "stroke-width": Math.max(1, wide * 0.06),
      opacity: "0.15",
    }),
  );
}

/**
 * A macaw or a smaller parrot perched on a branch among big tropical leaves.
 *
 * @category Animals
 */
export const parrot = /* @__PURE__ */ defineKind("parrot", "Parrot", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const p = g.pick(PARROTS);
  const macaw = !!p.macaw;
  const dir = g.pick([1, -1]);
  // Head to tail tip runs about 7.4 body widths for a macaw, 5 for the others.
  const span = macaw ? 7.6 : 5.2;
  const S = Math.min(unit * (macaw ? g.f(0.1, 0.115) : g.f(0.1, 0.12)), (h * 0.9) / span);
  const tailLen = macaw ? S * 3.4 : S * 1.5;
  const cx = w * g.f(0.44, 0.56);
  const skyHue = g.f(165, 205);
  let out = skyFade(g, w, h, hsl(skyHue, 50, g.f(68, 76)), hsl(skyHue + 20, 55, 90));
  // Big leaves from the edges, darker ones first.
  const leaves = g.i(4, 7);
  for (let k = 0; k < leaves; k++) {
    const side = k % 2 ? 1 : -1;
    const lx = side < 0 ? -unit * 0.05 : w + unit * 0.05;
    const ly = h * g.f(-0.05, 1.05);
    const a = (side < 0 ? 0 : 180) + side * -1 * g.f(-40, 40);
    out += bigLeaf(lx, ly, a, unit * g.f(0.35, 0.6), unit * g.f(0.08, 0.13), hsl(g.f(95, 150), 45, 28 + k * 4));
  }
  // The branch, its top at py where the bird sits.
  const headTop = S * 3.85;
  const bY = Math.min(h * g.f(0.55, 0.62), h - tailLen - S * 0.4);
  const by = Math.max(bY, headTop + h * 0.04);
  const ends: [Point, Point, Point] = [
    [-10, by + h * g.f(-0.03, 0.05)],
    [w / 2, by - h * g.f(0, 0.05)],
    [w + 10, by + h * g.f(-0.03, 0.05)],
  ];
  const thick = unit * 0.045;
  out += el("path", {
    d: s`M ${ends[0][0]} ${ends[0][1]} Q ${ends[1][0]} ${ends[1][1]} ${ends[2][0]} ${ends[2][1]}`,
    stroke: "#6b4a32",
    "stroke-width": thick,
    "stroke-linecap": "round",
    fill: "none",
  });
  const py = qpt(ends[0], ends[1], ends[2], (cx + 10) / (w + 20))[1] - thick * 0.45;
  // A few small leaves along the branch.
  for (let k = g.i(2, 4); k > 0; k--) {
    const t = g.chance(0.5) ? g.f(0.02, 0.3) : g.f(0.7, 0.98);
    const [lx, ly] = qpt(ends[0], ends[1], ends[2], t);
    out += bigLeaf(lx, ly, g.f(25, 155), unit * 0.13, unit * 0.035, hsl(g.f(95, 135), 45, g.f(34, 44)));
  }
  const hx = cx + S * 0.45;
  const hy = py - S * 2.95;
  out += facing(cx, dir);
  // Tail, hanging past the branch.
  out += el("polygon", {
    points: pts([
      [cx - S * 0.75, py - S * 0.9],
      [cx + S * 0.15, py - S * 0.5],
      [cx - S * 0.5 + tailLen * 0.08, py + tailLen],
      [cx - S * 0.75 + tailLen * 0.06, py + tailLen - S * 0.15],
    ]),
    fill: p.tail,
  });
  if (macaw)
    out += el("polygon", {
      points: pts([
        [cx - S * 0.45, py - S * 0.6],
        [cx - S * 0.15, py - S * 0.5],
        [cx - S * 0.55 + tailLen * 0.08, py + tailLen * 0.97],
      ]),
      fill: p.flight,
    });
  // Flight feathers peeking below the wing, then the body.
  out += el("ellipse", {
    cx: cx - S * 0.5,
    cy: py - S * 0.55,
    rx: S * 0.42,
    ry: S * 0.85,
    fill: p.flight,
    transform: s`rotate(22 ${cx - S * 0.5} ${py - S * 0.55})`,
  });
  out += el("ellipse", {
    cx,
    cy: py - S * 1.35,
    rx: S,
    ry: S * 1.5,
    fill: p.body,
    transform: s`rotate(14 ${cx} ${py - S * 1.35})`,
  });
  if (p.belly)
    out += el("ellipse", {
      cx: cx + S * 0.35,
      cy: py - S * 1.05,
      rx: S * 0.6,
      ry: S * 1.15,
      fill: p.belly,
      transform: s`rotate(14 ${cx + S * 0.35} ${py - S * 1.05})`,
    });
  // Wing folded along the back.
  out += el("ellipse", {
    cx: cx - S * 0.3,
    cy: py - S * 1.35,
    rx: S * 0.6,
    ry: S * 1.2,
    fill: p.wing,
    transform: s`rotate(18 ${cx - S * 0.3} ${py - S * 1.35})`,
  });
  // Head, crown and face.
  out += el("circle", { cx: hx, cy: hy, r: S * 0.8, fill: p.head });
  if (p.crown)
    out += el("ellipse", {
      cx: hx + S * 0.2,
      cy: hy - S * 0.42,
      rx: S * 0.48,
      ry: S * 0.3,
      fill: p.crown,
      transform: s`rotate(15 ${hx + S * 0.2} ${hy - S * 0.42})`,
    });
  const ex = hx + S * 0.3;
  const ey = hy - S * 0.1;
  if (p.face)
    out += macaw
      ? el("ellipse", { cx: ex + S * 0.05, cy: ey + S * 0.12, rx: S * 0.4, ry: S * 0.34, fill: p.face })
      : el("circle", { cx: ex, cy: ey, r: S * 0.2, fill: p.face });
  // Hooked beak: the lower half, then the curved upper half over it.
  out += el("path", {
    d: s`M ${hx + S * 0.6} ${hy + S * 0.2} Q ${hx + S * 1.0} ${hy + S * 0.15} ${hx + S * 0.95} ${hy + S * 0.4}
         Q ${hx + S * 0.8} ${hy + S * 0.55} ${hx + S * 0.55} ${hy + S * 0.45} Z`,
    fill: p.jaw,
  });
  const big = macaw ? 1.15 : 0.9;
  out += el("path", {
    d: s`M ${hx + S * 0.5} ${hy - S * 0.4}
         Q ${hx + S * (0.5 + 0.7 * big)} ${hy - S * 0.45} ${hx + S * (0.55 + 0.6 * big)} ${hy + S * 0.55 * big}
         Q ${hx + S * (0.5 + 0.35 * big)} ${hy + S * 0.15} ${hx + S * 0.6} ${hy + S * 0.25}
         Q ${hx + S * 0.45} ${hy - S * 0.05} ${hx + S * 0.5} ${hy - S * 0.4} Z`,
    fill: p.beak,
  });
  out += eye(ex, ey, S * 0.1);
  // Toes curled over the front of the branch.
  for (const tx of [cx - S * 0.25, cx + S * 0.25])
    out += el("ellipse", { cx: tx, cy: py + thick * 0.15, rx: S * 0.2, ry: S * 0.13, fill: "#6f6a68" });
  out += "</g>";
  const who = p.name === "macaw" ? "A long-tailed macaw" : `A ${p.name}`;
  note.alt(`${who} perched on a branch among tropical leaves, facing ${dir > 0 ? "right" : "left"}`);
  note.focus(turn(cx, dir, ex), ey);
  // Head and beak.
  note.frame(turnBox(cx, dir, hx - S * 0.9, S * 2.2), hy - S * 0.95, S * 2.2, S * 1.85);
  return out;
});
