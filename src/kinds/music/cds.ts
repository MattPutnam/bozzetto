import { defineKind, el, hex, lin, type Rand, s } from "../../draw/core";

/**
 * Abstract cover art filling the box (x, y, bw, bh): bands, circles, one big shape, or a photo-like
 * scene. `base` paints the whole box; `id` names its gradient, if it has one.
 */
function coverArt(
  g: Rand,
  x: number,
  y: number,
  bw: number,
  bh: number,
  id: string,
  base: (paint: string) => string,
): string {
  const hue = g.f(0, 360);
  const ground = hex(hue, g.f(25, 65), g.f(45, 80));
  const a = hex(hue + g.f(100, 260), g.f(45, 75), g.f(35, 65));
  const b = hex(hue + g.f(20, 80), g.f(35, 70), g.f(20, 45));
  const style = g.pick(["bands", "circles", "shape", "photo"]);
  let cx = x + bw * g.f(0.35, 0.65);
  let cy = y + bh * g.f(0.35, 0.65);
  // Keeps a shape reaching e from its center inside the box, so the art needs no clipping
  const keepIn = (e: number) => {
    cx = Math.max(x + e, Math.min(x + bw - e, cx));
    cy = Math.max(y + e, Math.min(y + bh - e, cy));
  };
  if (style === "photo") {
    // A sky fading to a horizon, a low sun and a dark hill
    const sky = el(
      "defs",
      {},
      lin(id, [hex(hue, g.f(40, 70), g.f(30, 50)), hex(hue + g.f(20, 60), g.f(50, 80), g.f(65, 85))]),
    );
    const hy = y + bh * g.f(0.55, 0.75);
    return (
      sky +
      base(`url(#${id})`) +
      el("circle", { cx, cy: hy - bh * 0.08, r: bw * g.f(0.1, 0.18), fill: hex(hue + 40, 80, 88) }) +
      el("path", {
        d: s`M${x} ${hy}Q${x + bw * g.f(0.2, 0.8)} ${hy - bh * g.f(0.1, 0.25)} ${x + bw} ${hy + bh * 0.04}V${y + bh}H${x}Z`,
        fill: b,
      })
    );
  }
  let out = base(ground);
  if (style === "bands") {
    const count = g.i(3, 5);
    const across = g.chance(0.5);
    let d = "";
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count;
      const thick = (0.35 / count) * g.f(0.6, 1.4);
      d += across
        ? s`M${x} ${y + bh * (t - thick / 2)}h${bw}v${bh * thick}h${-bw}Z`
        : s`M${x + bw * (t - thick / 2)} ${y}v${bh}h${bw * thick}v${-bh}Z`;
    }
    out += el("path", { d, fill: a });
    out += el("circle", { cx, cy, r: bw * g.f(0.08, 0.14), fill: b });
  } else if (style === "circles") {
    const r = bw * g.f(0.28, 0.4);
    keepIn(r * 1.02);
    out += el("circle", { cx, cy, r, fill: a });
    out += el("circle", { cx, cy, r: r * g.f(0.4, 0.65), fill: b });
    out += el("circle", { cx: x + bw * g.f(0.15, 0.85), cy: y + bh * 0.8, r: bw * 0.06, fill: b });
  } else {
    const r = bw * g.f(0.3, 0.38);
    const shape = g.pick(["triangle", "square", "disc"]);
    keepIn(r * 1.05);
    if (shape === "triangle")
      out += el("path", { d: s`M${cx} ${cy - r}L${cx + r} ${cy + r * 0.8}H${cx - r}Z`, fill: a });
    else if (shape === "square")
      out += el("rect", {
        x: cx - r * 0.8,
        y: cy - r * 0.8,
        width: r * 1.6,
        height: r * 1.6,
        fill: a,
        transform: s`rotate(${g.f(-20, 20)} ${cx} ${cy})`,
      });
    else out += el("circle", { cx, cy, r, fill: a });
    out += el("rect", { x, y: y + bh * 0.86, width: bw, height: bh * 0.04, fill: b });
  }
  return out;
}

/** A compact disc at (cx, cy) with radius r, data side up unless it gets a printed face. */
function disc(g: Rand, cx: number, cy: number, r: number, hole: string, print?: string): string {
  let out = el("circle", { cx, cy, r, fill: print ?? "#cfd4da" });
  // Iridescent wedges of reflected light, in two tints
  const a0 = g.f(0, Math.PI);
  const wedges = (off: number, width: number) => {
    let d = "";
    for (const half of [0, Math.PI]) {
      const p = (t: number, rr: number) =>
        s`${cx + Math.cos(a0 + off + half + t) * rr} ${cy + Math.sin(a0 + off + half + t) * rr}`;
      d += `M${p(-width, r * 0.36)}L${p(-width, r * 0.97)}A${s`${r * 0.97} ${r * 0.97}`} 0 0 1 ${p(width, r * 0.97)}L${p(width, r * 0.36)}Z`;
    }
    return d;
  };
  const sheen = print ? 0.15 : 0.4;
  out += el("path", { d: wedges(0, 0.35), fill: hex(g.f(170, 220), 70, 75), opacity: sheen });
  out += el("path", { d: wedges(0.75, 0.25), fill: hex(g.f(280, 340), 60, 80), opacity: sheen });
  // Clear inner ring, stacking ring and the hole
  out += el("circle", { cx, cy, r: r * 0.33, fill: "#e9edf0" });
  out += el("circle", {
    cx,
    cy,
    r: r * 0.22,
    fill: "none",
    stroke: "#a9b0b8",
    "stroke-width": r * 0.025,
  });
  out += el("circle", { cx, cy, r: r * 0.1, fill: hole });
  return out;
}

/** A scattering of CD jewel cases seen from above on a desk, table or carpet, sometimes one open. */
export const cds = /* @__PURE__ */ defineKind("cds", "CD cases", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const q = unit * (w / h > 2.5 ? 0.5 : 0.36) * g.f(0.95, 1.05);
  const surface = g.pick(["desk", "table", "carpet"]);
  const shadow = { dx: q * 0.035, dy: q * 0.06 };
  const defs: string[] = [];
  let out = "";

  // The surface
  const ground =
    surface === "desk"
      ? hex(g.f(18, 38), g.f(25, 45), g.f(38, 58))
      : surface === "table"
        ? hex(g.f(0, 360), g.f(8, 30), g.f(70, 84))
        : hex(g.f(0, 360), g.f(15, 35), g.f(35, 60));
  if (surface === "desk") {
    out += el("rect", { width: w, height: h, fill: ground });
    let grain = "";
    for (let k = 0; k < 6; k++) {
      const y = (h * (k + g.f(0, 1))) / 6;
      grain += s`M0 ${y}C${w * 0.3} ${y + unit * g.f(-0.04, 0.04)} ${w * 0.7} ${y + unit * g.f(-0.04, 0.04)} ${w} ${y}`;
    }
    out += el("path", {
      d: grain,
      stroke: "#000",
      "stroke-opacity": "0.07",
      "stroke-width": unit * 0.006,
      fill: "none",
    });
  } else if (surface === "table") {
    out += el("rect", { width: w, height: h, fill: ground });
    out += el("ellipse", { cx: w * 0.3, cy: h * 0.25, rx: w * 0.5, ry: h * 0.4, fill: "#fff", opacity: "0.12" });
  } else {
    const pat = g.id("pile");
    const p = Math.max(4, unit * 0.025);
    defs.push(
      el(
        "pattern",
        { id: pat, width: p, height: p, patternUnits: "userSpaceOnUse" },
        el("circle", { cx: p * 0.25, cy: p * 0.3, r: p * 0.18, fill: "#000", opacity: "0.1" }),
        el("circle", { cx: p * 0.75, cy: p * 0.8, r: p * 0.15, fill: "#fff", opacity: "0.1" }),
      ),
    );
    out += el("rect", { width: w, height: h, fill: ground });
    out += el("rect", { width: w, height: h, fill: `url(#${pat})` });
  }

  // Shared parts in a case's own coordinates, centered on the origin
  const half = q / 2;
  const spine = q * 0.075;
  const lidId = g.id("l");
  const shadowId = g.id("s");
  const squareId = g.id("q");
  defs.push(el("rect", { id: squareId, x: -half, y: -half, width: q, height: q }));
  const square = (paint: string) => el("use", { href: `#${squareId}`, fill: paint });
  const knuckles = (x: number) =>
    el("path", {
      d: s`M${x} ${-half + q * 0.02}h${spine}v${q * 0.08}h${-spine}ZM${x} ${half - q * 0.1}h${spine}v${q * 0.08}h${-spine}Z`,
      fill: "#fff",
      opacity: "0.45",
    });
  const rim = (x: number) =>
    el("rect", {
      x: x + q * 0.01,
      y: -half + q * 0.01,
      width: q * 0.98,
      height: q * 0.98,
      rx: q * 0.012,
      fill: "none",
      stroke: "#fff",
      "stroke-opacity": "0.4",
      "stroke-width": q * 0.02,
    });
  // The clear lid over the cover: the tray's spine (its color comes from the <use>), a frosted
  // strip over it, the hinge line, knuckles, the rim and a soft streak of light
  defs.push(
    el(
      "g",
      { id: lidId },
      el("rect", { x: -half, y: -half, width: spine, height: q }),
      el("rect", { x: -half, y: -half, width: spine, height: q, fill: "#eef2f5", opacity: "0.3" }),
      el("rect", { x: -half + spine, y: -half, width: q * 0.01, height: q, fill: "#000", opacity: "0.2" }),
      knuckles(-half),
      rim(-half),
      el("path", {
        d: s`M${-q * 0.1} ${-half}h${q * 0.22}L${-q * 0.12} ${half}h${-q * 0.22}Z`,
        fill: "#fff",
        opacity: "0.14",
      }),
    ),
  );
  // A soft shadow: a wider faint rect under a tighter one
  const shadowRects = (x: number, width: number) =>
    el("rect", { x, y: -half, width, height: q, rx: q * 0.03, fill: "#000", opacity: "0.12" }) +
    el("rect", {
      x: x + q * 0.015,
      y: -half + q * 0.015,
      width: width - q * 0.03,
      height: q * 0.97,
      fill: "#000",
      opacity: "0.12",
    });
  defs.push(el("g", { id: shadowId }, shadowRects(-half, q)));
  /** A shadow offset down and right in the picture, whatever way the case is turned. */
  const offset = (deg: number) => {
    const t = (-deg * Math.PI) / 180;
    return [
      shadow.dx * Math.cos(t) - shadow.dy * Math.sin(t),
      shadow.dx * Math.sin(t) + shadow.dy * Math.cos(t),
    ] as const;
  };
  const trays = ["#1d1d21", "#2c2f36", "#d8dde2"];

  // Where the cases go: a jittered grid, so they overlap a little and cover the surface evenly
  const count = Math.max(5, Math.min(8, Math.round(((w * h) / (q * q)) * 0.6)));
  const cols = Math.max(1, Math.round(Math.sqrt((count * w) / h)));
  const rows = Math.ceil(count / cols);
  const spots: { x: number; y: number }[] = [];
  for (let k = 0; k < count; k++) {
    const c = k % cols;
    const r = Math.floor(k / cols);
    const inRow = r === rows - 1 ? count - r * cols : cols;
    spots.push({
      x: (w * (c + 0.5 + g.f(-0.3, 0.3))) / inRow,
      y: (h * (r + 0.5 + g.f(-0.3, 0.3))) / rows,
    });
  }
  // Drawing order is shuffled; the open case, if any, goes on top near the middle
  for (let k = spots.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [spots[k], spots[j]] = [spots[j], spots[k]];
  }
  const open = g.chance(0.45);
  const loose = g.chance(0.35);
  if (open) {
    let best = 0;
    for (let k = 1; k < spots.length; k++)
      if (Math.hypot(spots[k].x - w / 2, spots[k].y - h / 2) < Math.hypot(spots[best].x - w / 2, spots[best].y - h / 2))
        best = k;
    spots.push(spots.splice(best, 1)[0]);
  }
  const fit = (v: number, e: number, size: number) => Math.max(e, Math.min(size - e, v));
  const placed: { x: number; y: number; deg: number }[] = spots.map((p, k) => {
    const wide = open && k === spots.length - 1;
    const deg = wide ? g.f(-10, 10) : g.f(-35, 35);
    const t = (Math.abs(deg) * Math.PI) / 180;
    const m = unit * 0.02;
    const ex = (wide ? q : half) * Math.cos(t) + half * Math.sin(t) + m;
    const ey = (wide ? q : half) * Math.sin(t) + half * Math.cos(t) + m;
    return { x: fit(p.x, ex, w), y: fit(p.y, ey, h), deg };
  });

  // A loose disc lying under one of the cases, partly showing
  if (loose) {
    const under = placed[g.i(0, placed.length - (open ? 2 : 1))];
    const r = q * 0.46;
    const a = g.f(0, Math.PI * 2);
    const dx = fit(under.x + Math.cos(a) * q * 0.6, r * 1.08, w);
    const dy = fit(under.y + Math.sin(a) * q * 0.6, r * 1.08, h);
    out += el("circle", { cx: dx + shadow.dx * 0.6, cy: dy + shadow.dy * 0.6, r, fill: "#000", opacity: "0.18" });
    out += disc(g, dx, dy, r, ground);
  }

  placed.forEach((p, k) => {
    const isOpen = open && k === placed.length - 1;
    const [ox, oy] = offset(p.deg);
    const tray = g.pick(trays);
    let c = "";
    if (!isOpen) {
      c += el("use", { href: `#${shadowId}`, x: ox, y: oy });
      c += coverArt(g, -half, -half, q, q, g.id(`g${k}`), square);
      c += el("use", { href: `#${lidId}`, fill: tray });
    } else {
      // Open flat: the lid with its booklet on the left, the tray with its disc on the right
      c += el("g", { transform: s`translate(${ox} ${oy})` }, shadowRects(-q, q * 2));
      c += el("rect", { x: -q, y: -half, width: q, height: q, rx: q * 0.012, fill: "#e3e8ec" });
      const bx = -q + q * 0.03;
      const bw = q - spine - q * 0.03;
      c += coverArt(g, bx, -half + q * 0.03, bw, q * 0.94, g.id(`g${k}`), paint =>
        el("rect", { x: bx, y: -half + q * 0.03, width: bw, height: q * 0.94, fill: paint }),
      );
      // Tabs at the lid's outer edge that hold the booklet in
      c += el("path", {
        d: s`M${-q} ${-q * 0.3}h${q * 0.05}v${q * 0.1}h${-q * 0.05}ZM${-q} ${q * 0.2}h${q * 0.05}v${q * 0.1}h${-q * 0.05}Z`,
        fill: "#f4f7f9",
        opacity: "0.7",
      });
      c += el("rect", { x: 0, y: -half, width: q, height: q, rx: q * 0.012, fill: tray });
      c += el("rect", {
        x: spine + q * 0.02,
        y: -half + q * 0.03,
        width: q - spine - q * 0.05,
        height: q * 0.94,
        fill: "#fff",
        opacity: "0.08",
      });
      const r = q * 0.44;
      const dcx = spine + (q - spine) / 2;
      c += el("circle", { cx: dcx + q * 0.01, cy: q * 0.015, r, fill: "#000", opacity: "0.2" });
      c += disc(g, dcx, 0, r, tray, g.chance(0.4) ? hex(g.f(0, 360), g.f(30, 60), g.f(55, 75)) : undefined);
      // The hub's teeth show through the hole
      c += el("circle", { cx: dcx, cy: 0, r: r * 0.06, fill: "none", stroke: "#888", "stroke-width": r * 0.025 });
      // The hinge where the halves meet, and the rims
      c += el("rect", { x: -spine, y: -half, width: spine * 2, height: q, fill: "#eef2f5", opacity: "0.25" });
      c += el("rect", { x: -q * 0.005, y: -half, width: q * 0.01, height: q, fill: "#000", opacity: "0.2" });
      c += knuckles(-spine);
      c += knuckles(0);
      c += rim(-q) + rim(0);
    }
    out += el("g", { transform: s`translate(${p.x} ${p.y}) rotate(${p.deg})` }, c);
  });

  const top = placed[placed.length - 1];
  const where = { desk: "a desk", table: "a table", carpet: "a carpet" }[surface];
  note.alt(`CD cases${loose ? " and a loose disc" : ""} scattered on ${where}${open ? ", one lying open" : ""}`);
  note.focus(top.x, top.y);
  // Whole pixels are plenty for everything but small values like opacities, and keep the picture small
  return (el("defs", {}, ...defs) + out).replace(/-?\d+\.\d+/g, v => (Math.abs(+v) >= 2 ? String(Math.round(+v)) : v));
});
