import { defineKind, el, mix, type Point, pts, type Rand, s } from "../../draw/core";
import {
  arrange,
  dot,
  graphics,
  type Mount,
  MOUNT_PAINTS,
  type Pal,
  palette,
  rackArm,
  sharer,
  softShadow,
  unturn,
  wall,
  WALLS,
} from "./shared";

/** The area a graphic covers, in the board's own coordinates; its long side runs along y. */
interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SKATE_ART = [
  "stripes",
  "chevrons",
  "checker",
  "rings",
  "dots",
  "waves",
  "sunburst",
  "fade",
  "shapes",
  "face",
  "flames",
] as const;

type SkateArt = (typeof SKATE_ART)[number];

/** How alt text names each graphic, for one board and for several. */
const SKATE_WORDS: Record<SkateArt, [string, string]> = {
  stripes: ["stripes", "stripes"],
  chevrons: ["chevrons", "chevrons"],
  checker: ["a checkerboard", "checkerboards"],
  rings: ["rings", "rings"],
  dots: ["polka dots", "polka dots"],
  waves: ["waves", "waves"],
  sunburst: ["a sunburst", "sunbursts"],
  fade: ["a sunset fade", "sunset fades"],
  shapes: ["geometric shapes", "geometric shapes"],
  face: ["a smiling face", "smiling faces"],
  flames: ["flames", "flames"],
};

/** Graphics that can run across a whole set of decks as one picture, and what to call that picture. */

/** A bold graphic filling the area `b`. `id` names its gradient, if it has one. */
function skateArt(g: Rand, style: SkateArt, b: Area, p: Pal, id: string): string {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const small = Math.min(b.w, b.h);
  const reach = Math.hypot(b.w, b.h) / 2 + small * 0.1;
  let out = el("rect", { x: b.x - 2, y: b.y - 2, width: b.w + 4, height: b.h + 4, fill: p.base });
  if (style === "stripes") {
    const angle = g.pick([0, 0, 25, -25, 45, -45]);
    const step = Math.max(b.w, b.h) / g.i(7, 12);
    const thick = g.f(0.3, 0.6);
    let da = "";
    let db = "";
    for (let k = 0, y = cy - reach; y < cy + reach; k++, y += step) {
      const d = s`M${cx - reach} ${y}h${reach * 2}v${step * thick}h${-reach * 2}Z`;
      if (k % 2) db += d;
      else da += d;
    }
    out += el(
      "g",
      { transform: s`rotate(${angle} ${cx} ${cy})` },
      el("path", { d: da, fill: p.a }),
      el("path", { d: db, fill: p.b }),
    );
  } else if (style === "chevrons") {
    const sp = b.w * g.f(0.3, 0.42);
    const depth = b.w * g.f(0.25, 0.45) * g.pick([1, -1]);
    let da = "";
    let db = "";
    for (let k = 0, y = b.y - Math.abs(depth) - sp; y < b.y + b.h + sp; k++, y += sp) {
      const d = s`M${b.x - sp} ${y + depth}L${cx} ${y}L${b.x + b.w + sp} ${y + depth}`;
      if (k % 2) db += d;
      else da += d;
    }
    const stroke = { fill: "none", "stroke-width": sp * 0.45, "stroke-linejoin": "miter" };
    out += el("path", { d: da, stroke: p.a, ...stroke }) + el("path", { d: db, stroke: p.b, ...stroke });
  } else if (style === "checker") {
    const cols = g.pick([4, 5]);
    const cell = b.w / cols;
    const full = g.chance(0.5);
    const top = full ? b.y : cy - b.h * g.f(0.15, 0.25);
    const bottom = full ? b.y + b.h : 2 * cy - top;
    const [under, over] = g.pick([
      [p.light, p.ink],
      [p.a, p.ink],
      [p.light, p.a],
    ]);
    // Each row of squares is one dashed line.
    let d = "";
    for (let r = 0; top + r * cell < bottom - 1; r++)
      d += s`M${b.x + (r % 2) * cell} ${top + (r + 0.5) * cell}H${b.x + b.w}`;
    out += el("rect", { x: b.x, y: top, width: b.w, height: bottom - top, fill: under });
    out += el("path", { d, stroke: over, "stroke-width": cell, "stroke-dasharray": s`${cell} ${cell}` });
    if (!full)
      out += el("path", {
        d: s`M${b.x} ${top - cell * 0.4}H${b.x + b.w}M${b.x} ${bottom + cell * 0.4}H${b.x + b.w}`,
        stroke: p.b,
        "stroke-width": cell * 0.3,
      });
  } else if (style === "rings") {
    const ox = cx + g.f(-0.2, 0.2) * b.w;
    const oy = b.y + b.h * g.pick([0.3, 0.5, 0.7]);
    const step = small * g.f(0.15, 0.24);
    const colors = g.pick([
      [p.a, p.b],
      [p.a, p.light, p.b],
      [p.b, p.base, p.a, p.light],
    ]);
    const far = Math.hypot(Math.max(ox - b.x, b.x + b.w - ox), Math.max(oy - b.y, b.y + b.h - oy));
    for (let k = Math.ceil(far / step); k > 0; k--)
      out += el("circle", { cx: ox, cy: oy, r: k * step, fill: colors[k % colors.length] });
  } else if (style === "dots") {
    // Each row of dots is one round-capped dashed line.
    const cell = b.w / g.pick([3, 3.5, 4]);
    let d = "";
    for (let r = 0, y = b.y + cell * 0.3; y < b.y + b.h + cell; r++, y += cell * 0.75)
      d += s`M${b.x + (r % 2 ? cell / 2 : 0) - cell * 0.25} ${y}H${b.x + b.w + cell}`;
    out += el("path", {
      d,
      stroke: g.pick([p.a, p.b, p.light]),
      "stroke-width": cell * g.f(0.4, 0.6),
      "stroke-linecap": "round",
      "stroke-dasharray": s`0 ${cell}`,
    });
  } else if (style === "waves") {
    const wl = small * g.f(0.6, 0.95);
    const amp = wl * g.f(0.1, 0.18);
    const count = g.i(4, 7);
    const colors = [p.a, p.b, p.light, p.base];
    const shift = g.i(0, 3);
    // One wave, drawn again lower down for each band.
    let d = s`M${b.x - wl} ${b.y}`;
    for (let x = b.x - wl; x < b.x + b.w + wl; x += wl) d += s`q${wl / 4} ${-amp} ${wl / 2} 0t${wl / 2} 0`;
    d += s`v${b.h + 4}H${b.x - wl}Z`;
    out += el("defs", {}, el("path", { id, d }));
    for (let k = 1; k <= count; k++)
      out += el("use", { href: `#${id}`, y: (b.h * k) / (count + 1), fill: colors[(k + shift) % colors.length] });
  } else if (style === "sunburst") {
    const oy = b.y + b.h * g.pick([0.3, 0.5, 0.5, 0.7]);
    // The rays are the dashes of one very wide circle.
    const rays = g.i(8, 13) * 2;
    const ray = (Math.PI * reach * 2) / rays;
    out += el("circle", {
      cx,
      cy: oy,
      r: reach,
      fill: "none",
      stroke: p.a,
      "stroke-width": reach * 2,
      "stroke-dasharray": s`${ray} ${ray}`,
      transform: s`rotate(${g.f(0, 360)} ${cx} ${oy})`,
    });
    const r = small * g.f(0.28, 0.38);
    out += el("circle", { cx, cy: oy, r: r * 1.25, fill: p.b });
    out += el("circle", { cx, cy: oy, r, fill: p.light });
  } else if (style === "fade") {
    out += el(
      "defs",
      {},
      el(
        "linearGradient",
        { id, gradientUnits: "userSpaceOnUse", x1: 0, y1: b.y, x2: 0, y2: b.y + b.h },
        el("stop", { offset: 0, "stop-color": p.a }),
        el("stop", { offset: 0.55, "stop-color": p.b }),
        el("stop", { offset: 1, "stop-color": p.base }),
      ),
    );
    out += el("rect", { x: b.x - 2, y: b.y - 2, width: b.w + 4, height: b.h + 4, fill: `url(#${id})` });
    // A sun cut by bands of the fade showing through.
    const r = small * g.f(0.32, 0.42);
    const oy = b.y + b.h * g.f(0.35, 0.55);
    out += el("circle", { cx, cy: oy, r, fill: p.light });
    let slits = "";
    for (let k = 0; k < 4; k++) {
      const y = oy + r * (0.1 + k * 0.24);
      slits += s`M${cx - r} ${y}h${r * 2}v${r * (0.04 + k * 0.03)}h${-r * 2}Z`;
    }
    out += el("path", { d: slits, fill: `url(#${id})` });
  } else if (style === "shapes") {
    const colors = [p.a, p.b, p.light, p.ink].filter(c => c !== p.base);
    const count = g.i(5, 7);
    for (let k = 0; k < count; k++) {
      const x = cx + g.f(-0.28, 0.28) * b.w;
      const y = b.y + (b.h * (k + g.f(0.3, 0.7))) / count;
      const r = b.w * g.f(0.14, 0.24);
      const paint = g.pick(colors);
      const turn = g.f(0, 360);
      const shape = g.pick(["circle", "triangle", "square", "ring", "squiggle"] as const);
      if (shape === "circle") out += el("circle", { cx: x, cy: y, r, fill: paint });
      else if (shape === "ring")
        out += el("circle", { cx: x, cy: y, r: r * 0.8, fill: "none", stroke: paint, "stroke-width": r * 0.35 });
      else if (shape === "triangle")
        out += el("path", {
          d: `M${pts([0, 1, 2].map((j): Point => [x + Math.cos(turn + j * 2.09) * r, y + Math.sin(turn + j * 2.09) * r]))}Z`,
          fill: paint,
        });
      else if (shape === "square")
        out += el("rect", {
          x: x - r * 0.75,
          y: y - r * 0.75,
          width: r * 1.5,
          height: r * 1.5,
          fill: paint,
          transform: s`rotate(${turn} ${x} ${y})`,
        });
      else
        out += el("path", {
          d: s`M${x - r * 1.2} ${y}q${r * 0.3} ${-r * 0.6} ${r * 0.6} 0t${r * 0.6} 0t${r * 0.6} 0t${r * 0.6} 0`,
          fill: "none",
          stroke: paint,
          "stroke-width": r * 0.28,
          "stroke-linecap": "round",
          transform: s`rotate(${turn} ${x} ${y})`,
        });
    }
  } else if (style === "face") {
    // Bands across both ends, and a big round face in the middle.
    const band = b.h * 0.08;
    out += el("path", {
      d: s`M${b.x} ${b.y + b.h * 0.12}h${b.w}v${band}h${-b.w}Z M${b.x} ${b.y + b.h * 0.88 - band}h${b.w}v${band}h${-b.w}Z`,
      fill: p.b,
    });
    const r = b.w * 0.4;
    const ink = p.base === p.ink ? p.light : p.ink;
    const head = p.a === p.ink ? p.light : p.a;
    out += el("circle", { cx, cy, r, fill: head });
    const wink = g.chance(0.25);
    out += el("ellipse", { cx: cx - r * 0.36, cy: cy - r * 0.18, rx: r * 0.1, ry: r * 0.17, fill: ink });
    if (wink)
      out += el("path", {
        d: s`M${cx + r * 0.24} ${cy - r * 0.16}q${r * 0.12} ${-r * 0.12} ${r * 0.24} 0`,
        fill: "none",
        stroke: ink,
        "stroke-width": r * 0.08,
        "stroke-linecap": "round",
      });
    else out += el("ellipse", { cx: cx + r * 0.36, cy: cy - r * 0.18, rx: r * 0.1, ry: r * 0.17, fill: ink });
    const grin = g.f(0.45, 0.75);
    out += el("path", {
      d: s`M${cx - r * 0.46} ${cy + r * 0.2}Q${cx} ${cy + r * (0.2 + grin)} ${cx + r * 0.46} ${cy + r * 0.2}`,
      fill: "none",
      stroke: ink,
      "stroke-width": r * 0.09,
      "stroke-linecap": "round",
    });
    out += el("path", {
      d: s`M${cx - r * 0.62} ${cy + r * 0.12}h0M${cx + r * 0.62} ${cy + r * 0.12}h0`,
      stroke: p.b,
      "stroke-width": r * 0.2,
      "stroke-linecap": "round",
      opacity: 0.7,
    });
  } else {
    // Flames licking up from the tail.
    const by = b.y + b.h;
    const layers: [string, number][] = [
      [p.a, g.f(0.5, 0.68)],
      [p.b, g.f(0.3, 0.42)],
    ];
    for (const [paint, reachUp] of layers) {
      const tongues = g.i(3, 4);
      const tw = (b.w * 1.1) / tongues;
      const y0 = by - b.h * reachUp * 0.3;
      let x = b.x - b.w * 0.05;
      let d = s`M${x} ${by + 2}L${x} ${y0}`;
      for (let k = 0; k < tongues; k++) {
        const xr = x + tw;
        const tx = x + tw * g.f(0.4, 0.8);
        const ty = by - b.h * reachUp * g.f(0.75, 1);
        const th = y0 - ty;
        d += s`C${x} ${y0 - th * 0.55} ${tx - tw * 0.35} ${ty + th * 0.35} ${tx} ${ty}`;
        d += s`C${tx - tw * 0.05} ${ty + th * 0.4} ${xr + tw * 0.1} ${y0 - th * 0.3} ${xr} ${y0}`;
        x = xr;
      }
      d += s`L${x} ${by + 2}Z`;
      out += el("path", { d, fill: paint });
    }
  }
  return out;
}

/** A skateboard deck's outline, centered on (0, 0) and running along y: straight sides, round kicked ends. */
function deckPath(wid: number, len: number): string {
  const hw = wid / 2;
  const ry = wid * 0.55;
  const top = -len / 2 + ry;
  return s`M${-hw} ${top}A${hw} ${ry} 0 0 1 ${hw} ${top}V${-top}A${hw} ${ry} 0 0 1 ${-hw} ${-top}Z`;
}

const GRIPS = ["plain", "bands", "stripe", "logo", "rails"] as const;

type Grip = (typeof GRIPS)[number];

const GRIP_WORDS: Record<Grip, string> = {
  plain: "",
  bands: " with bands cut across its ends",
  stripe: " with a stripe down the middle",
  logo: " with a round logo cut out",
  rails: " with stripes along its edges",
};

/** One skateboard shown twice on a wall, as if from both sides: grip tape and bolts, then the graphic and trucks. */
export const skateboard = /* @__PURE__ */ defineKind("skateboard", "Skateboard", { wall: WALLS }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wallType = g.option("wall", g.pick(WALLS));
  const backdrop = wall(g.fork("wall"), wallType, w, h);
  let out = backdrop.out;
  const ratio = 0.26;
  // The two hang upright side by side, though on a tall picture they may lie one above another, and
  // on a very wide one end to end.
  const aspect = w / h;
  const kinds = aspect < 0.9 ? (["up", "stack"] as const) : aspect > 2 ? (["up", "row"] as const) : (["up"] as const);
  const plan = arrange(g, w, h, ratio, 0.32, 90, kinds, [2]);
  const len = plan.len;
  const wid = len * ratio;
  const gripAt = g.pick([0, 1]);
  const style = g.pick(SKATE_ART);
  const pal = palette(g, g.f(0, 360));
  const grip = g.pick(GRIPS);
  const gripPaint = g.pick(["#1f1f23", "#26262b", "#2d2b2a"]);
  const mountPaint = g.pick(MOUNT_PAINTS);
  const wheelPaint = g.pick(["#f3efe2", "#f2c94c", "#ef7f5a", "#6fb8dc", "#8fd1c0", "#e67fa8"]);
  // The deck's outline is written once and reused for both boards, their clip, shadows and edges.
  const deck = g.id("deck");
  const clip = g.id("deckclip");
  out += el(
    "defs",
    {},
    el("path", { id: deck, d: deckPath(wid, len) }),
    el("clipPath", { id: clip }, el("use", { href: `#${deck}` })),
  );
  const [sx, sy] = [unit * 0.012, unit * 0.022];
  const place = (spot: Point) => s`translate(${spot[0]} ${spot[1]}) rotate(${plan.rot})`;
  // Upright boards sit on hidden mounts; boards on their sides rest on two rack arms.
  const mounts: Mount[] =
    plan.rot === 0 ? [] : [-1, 1].map(e => rackArm(wid / 2, e * len * 0.15, 1, wid * 0.32, mountPaint));
  // The wheels, which stick out past the deck's sides.
  const ww = wid * 0.22;
  const wd = len * 0.075;
  let wheels = "";
  for (const e of [-1, 1])
    for (const side of [-1, 1])
      wheels += s`M${side * wid * 0.53 - ww / 2} ${e * len * 0.31 - wd / 2}h${ww}v${wd}h${-ww}Z`;
  const share = sharer(g, "deckpart");
  for (const spot of plan.spots) {
    const [dx, dy] = unturn(sx, sy, plan.rot);
    const shade = wheels + mounts.map(m => m.shade).join("");
    const shadow = softShadow(g, el("use", { href: `#${deck}` }) + el("path", { d: shade }), dx, dy);
    out += el("g", { transform: place(spot) }, share(shadow + mounts.map(m => m.back).join("")));
  }
  // The kicked ends sit a little in shade, and a soft gloss runs down one side.
  const kick = len / 2 - wid * 0.75;
  const finish =
    el("path", {
      d: s`M${-wid} ${kick}H${wid}V${len}H${-wid}ZM${-wid} ${-kick}H${wid}V${-len}H${-wid}Z`,
      fill: "#000",
      opacity: 0.1,
    }) +
    el("path", {
      d: s`M${-wid * 0.3} ${len * 0.3}V${-len * 0.3}`,
      stroke: "#fff",
      opacity: 0.14,
      "stroke-width": wid * 0.08,
      "stroke-linecap": "round",
    });
  const ply = el("use", {
    href: `#${deck}`,
    fill: "none",
    stroke: "#d9b98c",
    "stroke-width": Math.max(1, wid * 0.035),
  });
  for (const [k, spot] of plan.spots.entries()) {
    let board = "";
    if (k === gripAt) {
      // Grip tape: sandpaper grit, maybe a shape cut from it, and the bolts holding the trucks.
      const grit = g.id("grit");
      const t = wid * 0.09;
      let specks = "";
      for (let j = 0; j < 6; j++) specks += dot(g.f(0, t), g.f(0, t), t * 0.06);
      let cut = "";
      const a = pal.a;
      const band = wid * 0.1;
      if (grip === "bands")
        for (const e of [-1, 1]) cut += s`M${-wid} ${e * (len * 0.4) - band / 2}h${wid * 2}v${band}h${-wid * 2}Z`;
      if (grip === "stripe") cut = s`M${-wid * 0.08} ${-len}h${wid * 0.16}v${len * 2}h${-wid * 0.16}Z`;
      if (grip === "logo") {
        const r = wid * 0.24;
        cut = dot(0, 0, r) + dot(0, 0, r * 0.62);
      }
      if (grip === "rails")
        cut = s`M${-wid / 2} ${-len}h${wid * 0.09}v${len * 2}h${-wid * 0.09}ZM${wid / 2} ${-len}h${-wid * 0.09}v${len * 2}h${wid * 0.09}Z`;
      let bolts = "";
      for (const e of [-1, 1])
        for (const bx of [-1, 1])
          for (const by of [-1, 1]) bolts += dot(bx * wid * 0.1, e * len * 0.31 + by * len * 0.022, wid * 0.026);
      board += el("path", { d: wheels, fill: wheelPaint });
      board += el(
        "g",
        { "clip-path": `url(#${clip})` },
        el(
          "defs",
          {},
          el(
            "pattern",
            { id: grit, width: t, height: t, patternUnits: "userSpaceOnUse" },
            el("path", { d: specks, fill: "#ffffff", opacity: 0.22 }),
          ),
        ),
        el("rect", { x: -wid, y: -len, width: wid * 2, height: len * 2, fill: gripPaint }),
        cut ? el("path", { d: cut, fill: a, "fill-rule": "evenodd" }) : "",
        el("rect", { x: -wid, y: -len, width: wid * 2, height: len * 2, fill: `url(#${grit})` }),
        el("path", { d: bolts, fill: "#c3c8ce" }),
        finish,
      );
    } else {
      // The graphic side, with the trucks and wheels.
      const metal = "#b4bac1";
      const truck = g.id("truck");
      let ends = "";
      for (const side of [-1, 1]) ends += s`M${side * wid * 0.53 - ww / 2} ${-wd / 2}h${ww}v${wd}h${-ww}Z`;
      board += el(
        "g",
        { "clip-path": `url(#${clip})` },
        skateArt(g, style, { x: -wid / 2, y: -len / 2, w: wid, h: len }, pal, g.id("fade")),
        finish,
      );
      board += el(
        "defs",
        {},
        el(
          "g",
          { id: truck },
          el("rect", {
            x: -wid * 0.2,
            y: -len * 0.04,
            width: wid * 0.4,
            height: len * 0.08,
            rx: wid * 0.04,
            fill: mix(metal, "#000000", 0.25),
          }),
          el("rect", { x: -wid * 0.5, y: -len * 0.016, width: wid, height: len * 0.032, rx: len * 0.016, fill: metal }),
          el("circle", { r: wid * 0.06, fill: mix(metal, "#000000", 0.4) }),
          el("path", {
            d: ends,
            fill: wheelPaint,
            stroke: wheelPaint,
            "stroke-width": ww * 0.2,
            "stroke-linejoin": "round",
          }),
          el("path", {
            d: s`M${-wid * 0.53} ${-wd / 2}v${wd}M${wid * 0.53} ${-wd / 2}v${wd}`,
            stroke: "#000",
            opacity: 0.12,
            "stroke-width": ww * 0.16,
          }),
        ),
      );
      board += ply + el("use", { href: `#${truck}`, y: -len * 0.31 }) + el("use", { href: `#${truck}`, y: len * 0.31 });
    }
    if (k === gripAt) board += ply;
    out += el("g", { transform: place(spot) }, board + share(mounts.map(m => m.front).join("")));
  }
  const hung =
    plan.kind === "up"
      ? `hung on a ${backdrop.name}`
      : `resting on racks ${plan.kind === "stack" ? "one above the other" : "side by side"} on a ${backdrop.name}`;
  note.alt(
    `A skateboard shown from both sides, ${hung}: grip tape${GRIP_WORDS[grip]} on top, and ${graphics([style], SKATE_WORDS)} and trucks underneath`,
  );
  const [fx, fy] = plan.spots[1 - gripAt];
  note.focus(fx, fy);
  return out;
});
