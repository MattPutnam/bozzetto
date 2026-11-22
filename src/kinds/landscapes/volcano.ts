import { defineKind, el, fill, hsl, lin, type Point, pts, qpt, s } from "../../draw/core";
import { lerp } from "./shared";

/**
 * A volcano trailing smoke by day, or glowing with lava at dusk or night.
 *
 * @category Landscapes
 */
export const volcano = /* @__PURE__ */ defineKind("volcano", "Volcano", (g, w, h, note) => {
  const time = g.pick(["day", "dusk", "night"] as const);
  const glowing = time !== "day";
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const stops =
    time === "day"
      ? [hsl(g.f(195, 215), 50, 64), hsl(g.f(185, 205), 45, 88)]
      : time === "dusk"
        ? [hsl(g.f(250, 275), 30, 30), hsl(g.f(5, 20), 70, 52), hsl(g.f(30, 42), 90, 70)]
        : [hsl(g.f(240, 275), 40, 9), hsl(g.f(255, 285), 35, 18), hsl(g.f(0, 15), 55, 30)];
  const glow = g.id("glow");
  let out = el(
    "defs",
    {},
    lin(skyId, stops),
    el(
      "radialGradient",
      { id: glow },
      el("stop", { offset: 0, "stop-color": hsl(30, 100, 62), "stop-opacity": 0.6 }),
      el("stop", { offset: 1, "stop-color": hsl(20, 100, 55), "stop-opacity": 0 }),
    ),
  );
  out += fill(w, h, `url(#${skyId})`);
  const dim = time === "day" ? 0 : time === "dusk" ? -14 : -24;
  if (time === "night")
    for (let k = g.i(10, 18); k > 0; k--)
      out += el("circle", {
        cx: w * g.f(0, 1),
        cy: h * g.f(0, 0.45),
        r: g.f(0.5, 1.3),
        fill: "#fff",
        opacity: g.f(0.3, 0.9),
      });

  const ground = h * g.f(0.8, 0.88);
  const cx = w * g.f(0.35, 0.65);
  const top = h * g.f(0.24, 0.34);
  const cw = unit * g.f(0.06, 0.09);
  const foot = Math.min(w * 0.62, unit * g.f(0.75, 0.95));
  const rock = hsl(g.f(10, 35), g.f(10, 22), (time === "day" ? g.f(32, 42) : 30) + dim);
  // Lower hills on either side.
  out += el("path", {
    d: s`M0 ${ground - h * g.f(0.1, 0.2)} Q ${w * 0.3} ${ground - h * g.f(0.15, 0.3)} ${w * 0.55} ${ground}
         Q ${w * 0.75} ${ground - h * g.f(0.15, 0.25)} ${w} ${ground - h * g.f(0.05, 0.15)} V${h}H0Z`,
    fill: hsl(g.f(90, 140), 18, 50 + dim * 1.3),
    opacity: "0.8",
  });
  // The cone: concave slopes from the crater rim down to the plain, with the crater's dip on top.
  const rim = (dir: number): [Point, Point, Point] => [
    [cx + dir * cw, top],
    [cx + dir * (cw + (foot - cw) * 0.28), top + (ground - top) * 0.8],
    [cx + dir * foot, ground],
  ];
  const left = rim(-1);
  const right = rim(1);
  const slope = (t: number, dir: number) => qpt(...(dir < 0 ? left : right), t);
  // A point inside the cone: t from the rim (0) to the foot (1), u from the left slope (-1) to the right (1).
  const on = (t: number, u: number) => lerp(slope(t, -1), slope(t, 1), (u + 1) / 2);
  const dip = s`Q ${cx} ${top + cw * 0.4} ${left[0][0]} ${top}`;
  out += el("path", {
    d:
      s`M${left[0][0]} ${top} Q ${left[1][0]} ${left[1][1]} ${left[2][0]} ${ground} L${right[2][0]} ${ground}
         Q ${right[1][0]} ${right[1][1]} ${right[0][0]} ${top}` +
      dip +
      "Z",
    fill: rock,
  });
  const snowy = time === "day" && g.chance(0.5);
  if (snowy) {
    // A snowcap with a ragged lower edge.
    const ts = g.f(0.18, 0.28);
    const edge = [-0.6, -0.2, 0.2, 0.6].map((u, j) => on(ts * (j % 2 ? 0.65 : 1.15), u));
    const sides = [0.06, 0.12, ts].map(t => slope(t, -1));
    const back = [ts, 0.12, 0.06].map(t => slope(t, 1));
    out += el("path", {
      d: `M${pts([left[0], ...sides, ...edge, ...back, right[0]])}` + dip + "Z",
      fill: hsl(210, 30, 96),
    });
  }
  // The shaded side.
  out += el("path", {
    d: s`M${cx + cw * 0.15} ${top + cw * 0.3} L${right[0][0]} ${top} Q ${right[1][0]} ${right[1][1]} ${right[2][0]} ${ground}
         L${cx + foot * 0.15} ${ground}Z`,
    fill: "#000",
    opacity: "0.14",
  });
  if (glowing) {
    // Lava running down from the crater, with a soft glow around each flow.
    const flows = g.i(2, 4);
    let lava = "";
    for (let k = 0; k < flows; k++) {
      const u0 = -0.7 + (1.4 * (k + g.f(0.2, 0.8))) / flows;
      const end = g.f(0.4, 0.85);
      const drift = g.f(-0.2, 0.2);
      const phase = g.f(0, 6);
      const path = Array.from({ length: 7 }, (_, j) => {
        const t = (end * j) / 6;
        return on(t, Math.max(-0.92, Math.min(0.92, u0 + drift * t + 0.06 * Math.sin(phase + j * 1.7))));
      });
      lava += `M${pts(path).replace(/ /g, "L")}`;
    }
    const line = { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
    out += el("path", { d: lava, ...line, stroke: hsl(15, 100, 50), "stroke-width": unit * 0.035, opacity: "0.35" });
    out += el("path", { d: lava, ...line, stroke: hsl(32, 100, 60), "stroke-width": unit * 0.013 });
    // The glowing crater.
    out += el("circle", { cx, cy: top, r: cw * 3.2, fill: `url(#${glow})` });
    out += el("ellipse", { cx, cy: top + cw * 0.12, rx: cw * 0.95, ry: cw * 0.22, fill: hsl(40, 100, 70) });
  }
  // The plume, rising and drifting with the wind.
  const wind = g.f(-1, 1);
  const puffs = g.i(6, 9);
  const rise = top + unit * 0.15;
  for (let k = 0; k < puffs; k++) {
    const t = (k + 0.5) / puffs;
    const px = cx + wind * unit * 0.55 * t ** 1.4 + g.f(-0.02, 0.02) * unit;
    const py = top - unit * 0.01 - rise * t;
    const shade = glowing ? (k < 2 ? hsl(18, 55, 38) : hsl(15, 12, g.f(20, 30) + dim / 3)) : hsl(220, 8, g.f(74, 90));
    out += el("circle", { cx: px, cy: py, r: unit * (0.035 + 0.1 * t) * g.f(0.85, 1.15), fill: shade, opacity: "0.9" });
  }
  // The plain in front.
  out += el("path", {
    d: s`M0 ${ground + h * g.f(-0.01, 0.03)} Q ${w / 2} ${ground - h * g.f(0, 0.03)} ${w} ${ground + h * g.f(-0.01, 0.03)} V${h}H0Z`,
    fill: hsl(g.f(30, 100), 18, 30 + dim),
  });
  note.alt(
    glowing
      ? `A volcano glowing ${time === "dusk" ? "at dusk" : "at night"}, lava running down its slopes`
      : `A ${snowy ? "snow-capped " : ""}volcano trailing a plume of smoke`,
  );
  note.focus(cx, top);
  return out;
});
