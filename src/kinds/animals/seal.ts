import { defineKind, el, hsl, lin, mix, pts, s } from "../../draw/core";
import { boxAround, pose, scaled, sky } from "./shared";

const SEALS = ["#8a8f96", "#7d746c", "#9aa3ab", "#666d76", "#a39a8e"] as const;

/** A seal lying on a rock or an ice floe by the sea, head raised, whiskers out. */
export const seal = /* @__PURE__ */ defineKind("seal", "Seal", { perch: ["rock", "ice"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const perch = g.option("perch", g.pick(["rock", "ice"] as const));
  const ice = perch === "ice";
  const dir = g.pick([-1, 1]);
  const body = g.pick(SEALS);
  const dark = mix(body, "#000000", 0.25);
  const light = mix(body, "#ffffff", 0.35);
  const spotted = g.chance(0.5);
  const hz = h * g.f(0.4, 0.5);
  let out = sky(g, w, h, ice ? g.f(195, 215) : g.f(185, 215));
  if (ice && g.chance(0.6)) {
    // Far-off icebergs on the horizon.
    for (let k = g.i(1, 2); k > 0; k--) {
      const x = w * g.f(0.05, 0.95);
      const r = unit * g.f(0.06, 0.12);
      out += el("polygon", {
        points: pts([
          [x - r, hz + 1],
          [x - r * 0.4, hz - r * 0.5],
          [x, hz - r * 0.35],
          [x + r * 0.35, hz - r * 0.7],
          [x + r, hz + 1],
        ]),
        fill: "#eef6fb",
      });
    }
  }
  const sea = g.id("sea");
  const seaHue = g.f(190, 210);
  out +=
    el("defs", {}, lin(sea, [hsl(seaHue, 50, ice ? 45 : 50), hsl(seaHue + 10, 55, 30)])) +
    el("rect", { y: hz, width: w, height: h - hz, fill: `url(#${sea})` });
  const L = Math.min(w * 0.56, h * 1.1) * g.f(0.85, 1);
  const cx = w * g.f(0.46, 0.54);
  const top = h * g.f(0.7, 0.75);
  const half = L * 0.62;
  // The perch: the seal lies on its flat top.
  if (ice) {
    const depth = (h - top) * 0.35;
    const rim = L * 0.07;
    out += el("polygon", {
      points: pts([
        [cx - half - rim, top + rim * 0.4],
        [cx + half + rim * 1.2, top + rim * 0.6],
        [cx + half + rim, top + rim * 0.6 + depth],
        [cx - half - rim * 0.8, top + rim * 0.4 + depth],
      ]),
      fill: "#a9d4e6",
    });
    out += el("polygon", {
      points: pts([
        [cx - half - rim * 0.2, top - rim],
        [cx + half * 0.6, top - rim * 1.2],
        [cx + half + rim * 1.4, top - rim * 0.3],
        [cx + half + rim * 1.2, top + rim * 0.6],
        [cx - half - rim, top + rim * 0.4],
        [cx - half - rim * 1.3, top - rim * 0.2],
      ]),
      fill: "#f4fafd",
    });
  } else {
    const rock = hsl(g.f(200, 230), g.f(6, 12), g.f(38, 46));
    const r = L * 0.12;
    const base = top + Math.min((h - top) * 0.75, L * 0.32);
    // A boulder with a flat top, a smaller one leaning on it, and a lit upper edge.
    out += el("path", {
      d: s`M ${cx - half - r * 1.8} ${base}
           C ${cx - half - r * 1.9} ${top + r * 0.9} ${cx - half - r * 0.8} ${top} ${cx - half + r * 0.4} ${top}
           L ${cx + half - r * 0.3} ${top}
           C ${cx + half + r * 0.6} ${top - r * 0.1} ${cx + half + r * 1.5} ${top + r * 0.4} ${cx + half + r * 1.6} ${top + r}
           C ${cx + half + r * 2.3} ${top + r * 1.1} ${cx + half + r * 2.4} ${base - r} ${cx + half + r * 2.5} ${base} Z`,
      fill: rock,
    });
    const side = g.pick([-1, 1]);
    const bx = cx + side * (half + r * 1.2);
    out += el("ellipse", {
      cx: bx,
      cy: base - r * 0.3,
      rx: r * 1.5,
      ry: r * 1.1,
      fill: mix("#5a6470", "#000000", 0.15),
    });
    out += el("path", {
      d: s`M ${cx - half - r * 0.9} ${top + r * 0.35} Q ${cx - half - r * 0.6} ${top + r * 0.05} ${cx - half + r * 0.4} ${top + r * 0.05}
           L ${cx + half - r * 0.3} ${top + r * 0.05}`,
      stroke: "#fff",
      "stroke-width": r * 0.22,
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.15",
    });
    out += el("path", {
      d: s`M ${cx - half * 0.5} ${base - r * 0.2} q ${r * 0.3} ${-r * 0.7} ${r * 0.1} ${-r * 1.3}
           M ${cx + half * 0.45} ${base - r * 0.2} q ${-r * 0.2} ${-r * 0.5} ${r * 0.2} ${-r * 1}`,
      stroke: "#000",
      "stroke-width": r * 0.12,
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.15",
    });
    // Water lapping at the foot of the rock.
    out += el("rect", { y: base - r * 0.3, width: w, height: h, fill: hsl(seaHue + 5, 55, 36) });
    out += el("path", {
      d: s`M ${cx - half - r * 2.2} ${base - r * 0.3} Q ${cx - half - r} ${base - r * 0.7} ${cx - half} ${base - r * 0.3}
           M ${cx + half} ${base - r * 0.3} Q ${cx + half + r} ${base - r * 0.7} ${cx + half + r * 2.4} ${base - r * 0.3}`,
      stroke: "#fff",
      "stroke-width": "2.5",
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.7",
    });
  }
  // Shadow under the seal.
  out += el("ellipse", {
    cx: cx - dir * L * 0.08,
    cy: top,
    rx: L * 0.45,
    ry: L * 0.025,
    fill: "#000",
    opacity: "0.18",
  });
  // How high the head is held.
  const lift = Math.round(g.f(0, 0.08) * 1000) / 1000;
  const hx = 0.33;
  const hy = -0.36 - lift;
  const [open, at] = pose(cx - dir * L * 0.05, top, L, dir, 0);
  const clip = g.id("seal");
  const bodyD = scaled(
    L,
    `M 0.28 ${-0.22 - lift * 0.5} C 0.3 -0.05 0.2 0 0.05 0 L -0.3 0 C -0.42 0 -0.48 -0.03 -0.52 -0.06
     C -0.46 -0.12 -0.3 -0.2 -0.1 -0.24 C 0.05 -0.27 0.18 ${-0.33 - lift} 0.25 ${-0.4 - lift} Z`,
  );
  out += open;
  // Hind flippers, fanned at the tail.
  out += el("path", {
    d: scaled(
      L,
      "M -0.48 -0.05 Q -0.58 -0.14 -0.66 -0.16 Q -0.62 -0.1 -0.65 -0.06 Q -0.6 -0.06 -0.63 0.0 Q -0.56 -0.01 -0.47 -0.03 Z",
    ),
    fill: dark,
  });
  out += el(
    "defs",
    {},
    el("clipPath", { id: clip }, el("path", { d: bodyD }), el("circle", { cx: hx * L, cy: hy * L, r: 0.13 * L })),
  );
  out += el("path", { d: bodyD, fill: body });
  out += el("circle", { cx: hx * L, cy: hy * L, r: 0.13 * L, fill: body });
  // Paler underside and a sheen on the back, then spots, all clipped to body and head.
  let marks = el("ellipse", { cx: 0.0, cy: 0.02 * L, rx: 0.4 * L, ry: 0.07 * L, fill: light });
  marks += el("ellipse", { cx: -0.1 * L, cy: -0.23 * L, rx: 0.22 * L, ry: 0.02 * L, fill: "#fff", opacity: "0.2" });
  if (spotted) {
    let spots = "";
    for (let k = g.i(10, 16); k > 0; k--) {
      const x = g.f(-0.45, 0.35);
      const backY = x > 0.2 ? -0.3 : -0.24 + Math.abs(x + 0.1) * 0.25;
      spots += el("ellipse", {
        cx: x * L,
        cy: g.f(backY + 0.02, -0.07) * L,
        rx: g.f(0.008, 0.016) * L,
        ry: g.f(0.006, 0.012) * L,
      });
    }
    marks += el("g", { fill: dark, opacity: "0.55" }, spots);
  }
  out += el("g", { "clip-path": `url(#${clip})` }, marks);
  // Front flipper against the side.
  out += el("ellipse", {
    cx: 0.12 * L,
    cy: -0.05 * L,
    rx: 0.09 * L,
    ry: 0.03 * L,
    fill: dark,
    transform: s`rotate(25 ${0.12 * L} ${-0.05 * L})`,
  });
  // Muzzle, nose, eye and whiskers.
  out += el("ellipse", { cx: (hx + 0.1) * L, cy: (hy + 0.04) * L, rx: 0.075 * L, ry: 0.055 * L, fill: light });
  out += el("ellipse", { cx: (hx + 0.165) * L, cy: (hy + 0.01) * L, rx: 0.02 * L, ry: 0.015 * L, fill: "#2a2424" });
  out += el("path", {
    d: scaled(L, `M ${hx + 0.12} ${hy + 0.075} Q ${hx + 0.1} ${hy + 0.09} ${hx + 0.07} ${hy + 0.075}`),
    stroke: "#2a2424",
    "stroke-width": L * 0.007,
    "stroke-linecap": "round",
    fill: "none",
  });
  const sleepy = g.chance(0.2);
  const ex = (hx + 0.04) * L;
  const ey = (hy - 0.03) * L;
  if (sleepy)
    out += el("path", {
      d: s`M ${ex - L * 0.025} ${ey} Q ${ex} ${ey + L * 0.02} ${ex + L * 0.025} ${ey}`,
      stroke: "#1a1414",
      "stroke-width": L * 0.009,
      "stroke-linecap": "round",
      fill: "none",
    });
  else {
    out += el("circle", { cx: ex, cy: ey, r: L * 0.032, fill: "#1a1414" });
    out += el("circle", { cx: ex + L * 0.01, cy: ey - L * 0.01, r: L * 0.01, fill: "#fff" });
  }
  let whiskers = "";
  for (const [dy, ty] of [
    [0.03, -0.01],
    [0.045, 0.035],
    [0.06, 0.08],
  ])
    whiskers += scaled(L, `M ${hx + 0.13} ${hy + dy} L ${hx + 0.25} ${hy + ty} `);
  out += el("path", {
    d: whiskers,
    stroke: light,
    "stroke-width": L * 0.005,
    "stroke-linecap": "round",
    opacity: "0.9",
  });
  out += "</g>";
  note.alt(
    `A ${spotted ? "spotted harbor " : ""}seal ${sleepy ? "dozing" : "lying"} on ${ice ? "an ice floe" : "a rock"} by the sea`,
  );
  const eye = at(hx + 0.04, hy - 0.03);
  note.focus(eye[0], eye[1]);
  note.frame(
    ...boxAround(
      (
        [
          [hx - 0.15, hy - 0.15],
          [hx + 0.27, hy - 0.15],
          [hx + 0.27, hy + 0.14],
          [hx - 0.15, hy + 0.14],
        ] as const
      ).map(p => at(p[0], p[1])),
    ),
  );
  return out;
});
