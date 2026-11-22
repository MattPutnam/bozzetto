import { defineKind, el, facing, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { along, daySky, seaAndSky } from "./shared";

/**
 * A striped lighthouse on a grassy cliff above the sea, by day, at dusk or with its beam lit at night.
 *
 * @category Landscapes
 */
export const lighthouse = /* @__PURE__ */ defineKind("lighthouse", "Lighthouse", (g, w, h, note) => {
  const time = g.pick(["day", "dusk", "night"] as const);
  const unit = Math.min(w, h);
  const horizon = h * g.f(0.5, 0.62);
  let out: string;
  let dim: number;
  if (time === "night") {
    const hue = g.f(215, 245);
    const skyId = g.id("sky");
    const water = g.id("water");
    dim = -26;
    out = el(
      "defs",
      {},
      lin(skyId, [hsl(hue, 50, 10), hsl(hue + 10, 40, 30)]),
      lin(water, [hsl(hue, 40, 22), hsl(hue, 45, 12)]),
    );
    out += fill(w, h, `url(#${skyId})`);
    for (let k = g.i(14, 24); k > 0; k--)
      out += el("circle", {
        cx: w * g.f(0, 1),
        cy: horizon * g.f(0, 0.9),
        r: g.f(0.5, 1.4),
        fill: "#fff",
        opacity: g.f(0.4, 1),
      });
    out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${water})` });
  } else {
    const sky = daySky(g, time);
    dim = sky.dim;
    out = seaAndSky(g, w, h, horizon, time, sky);
  }
  // A few wave crests on the open water.
  let waves = "";
  for (let k = g.i(4, 7); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = horizon + (h - horizon) * g.f(0.15, 0.9);
    const ww = unit * g.f(0.03, 0.06);
    waves += s`M${x} ${y}q${ww / 2} ${-ww * 0.3} ${ww} 0`;
  }
  out += el("path", { d: waves, fill: "none", stroke: "#fff", "stroke-width": unit * 0.005, opacity: "0.45" });

  // The point, drawn with the cliff on the left and mirrored half the time.
  const side = g.pick([-1, 1]);
  const edge = Math.min(w * g.f(0.42, 0.55), unit * g.f(1, 1.3));
  const ct = h * g.f(0.5, 0.62);
  const drop = h - ct;
  const top: Point[] = [
    [0, ct - unit * g.f(0, 0.05)],
    [edge * 0.5, ct + unit * g.f(-0.015, 0.015)],
    [edge - unit * 0.04, ct + unit * 0.005],
    [edge, ct + unit * 0.035],
  ];
  const face: Point[] = [
    [edge + unit * 0.02, ct + drop * 0.25],
    [edge - unit * 0.015, ct + drop * 0.5],
    [edge + unit * 0.05, ct + drop * 0.75],
    [edge + unit * 0.09, h],
  ];
  let land = facing(w / 2, side);
  // Rocks in the surf off the point, each with foam at its foot.
  for (let k = g.i(1, 3); k > 0; k--) {
    const rx = edge + unit * g.f(0.13, 0.35);
    const ry = h - (h - horizon) * g.f(0.08, 0.35);
    const rw = unit * g.f(0.04, 0.08);
    land += el("polygon", {
      points: pts([
        [rx - rw, ry],
        [rx - rw * 0.5, ry - rw * g.f(0.5, 0.8)],
        [rx + rw * 0.2, ry - rw * g.f(0.6, 0.9)],
        [rx + rw, ry],
      ]),
      fill: hsl(25, 10, 30 + dim),
    });
    land += el("ellipse", { cx: rx, cy: ry, rx: rw * 1.3, ry: rw * 0.18, fill: "#fff", opacity: "0.7" });
  }
  land += el("polygon", { points: pts([...top, ...face, [0, h]]), fill: hsl(g.f(20, 40), 14, 46 + dim) });
  // The shaded cliff face, and surf at its foot.
  land += el("polygon", {
    points: pts([
      top[3],
      ...face,
      [edge - unit * 0.06, h],
      [edge - unit * 0.07, ct + drop * 0.5],
      [edge - unit * 0.035, ct + unit * 0.05],
    ]),
    fill: "#000",
    opacity: "0.18",
  });
  land += el("ellipse", {
    cx: edge + unit * 0.08,
    cy: h,
    rx: unit * 0.1,
    ry: unit * 0.012,
    fill: "#fff",
    opacity: "0.6",
  });
  // Grass over the top, a little thicker inland.
  const grass = top.map(([x, y]): Point => [x, y + unit * (x < edge - 1 ? 0.04 : 0.02)]).reverse();
  land += el("polygon", { points: pts([...top, ...grass]), fill: hsl(g.f(85, 125), 40, 40 + dim) });

  // The tower, its gallery, lantern and roof.
  const lx = edge * g.f(0.55, 0.72);
  const by = along(top, lx) + unit * 0.012;
  const th = Math.min(unit * g.f(0.36, 0.46), (by - unit * 0.14) / 1.33);
  const bw = th * 0.24;
  const tw = th * 0.16;
  // A keeper's cottage beside it, inland.
  const hw = th * 0.38;
  const hx = lx - bw / 2 - hw * 0.45;
  const cottage = g.chance(0.55) && hx - hw / 2 > unit * 0.02;
  if (cottage) {
    const hy = along(top, hx) + unit * 0.012;
    const hh = hw * 0.5;
    land += el("rect", { x: hx - hw / 2, y: hy - hh, width: hw, height: hh, fill: "#f2eee4" });
    land += el("polygon", {
      points: pts([
        [hx - hw * 0.58, hy - hh],
        [hx - hw * 0.35, hy - hh - hw * 0.3],
        [hx + hw * 0.4, hy - hh - hw * 0.3],
        [hx + hw * 0.58, hy - hh],
      ]),
      fill: hsl(g.f(0, 20), 45, 35 + dim / 2),
    });
    land += el("rect", {
      x: hx - hw * 0.3,
      y: hy - hh * 0.7,
      width: hw * 0.16,
      height: hh * 0.3,
      fill: time === "day" ? hsl(210, 25, 40) : hsl(45, 95, 70),
    });
  }
  const at = (f: number) => (bw + (tw - bw) * f) / 2;
  const plain = "#f4f1ea";
  const paint = g.pick([hsl(g.f(-8, 8), 70, 48), hsl(g.f(205, 225), 50, 32), hsl(0, 0, 18)]);
  land += el("polygon", {
    points: pts([
      [lx - bw / 2, by],
      [lx - tw / 2, by - th],
      [lx + tw / 2, by - th],
      [lx + bw / 2, by],
    ]),
    fill: plain,
  });
  const bands = g.i(3, 5);
  const striped = g.chance(0.8);
  if (striped)
    for (let k = bands % 2 ? 1 : 0; k < bands; k += 2) {
      const f0 = k / bands;
      const f1 = (k + 1) / bands;
      land += el("polygon", {
        points: pts([
          [lx - at(f0), by - th * f0],
          [lx - at(f1), by - th * f1],
          [lx + at(f1), by - th * f1],
          [lx + at(f0), by - th * f0],
        ]),
        fill: paint,
      });
    }
  // The tower's shaded half.
  land += el("polygon", {
    points: pts([
      [lx + bw * 0.1, by],
      [lx + tw * 0.1, by - th],
      [lx + tw / 2, by - th],
      [lx + bw / 2, by],
    ]),
    fill: "#000",
    opacity: "0.12",
  });
  const dark = hsl(0, 0, 18);
  const gy = by - th;
  const lw = tw * 0.82;
  const lh = th * 0.13;
  const lit = time !== "day";
  const glass = lit ? hsl(50, 100, 78) : hsl(200, 30, 72);
  const lcy = gy - th * 0.04 - lh / 2;
  if (time === "night") {
    // The beam, sweeping out to sea, and a glow around the lantern.
    const reach = w + unit;
    land += el("polygon", {
      points: pts([
        [lx, lcy - lh * 0.25],
        [reach, lcy - unit * g.f(0.15, 0.3)],
        [reach, lcy + unit * g.f(0.08, 0.18)],
        [lx, lcy + lh * 0.25],
      ]),
      fill: hsl(50, 100, 80),
      opacity: "0.3",
    });
    land += el("circle", { cx: lx, cy: lcy, r: lh * 1.5, fill: hsl(50, 100, 80), opacity: "0.3" });
  }
  land += el("rect", { x: lx - lw / 2, y: lcy - lh / 2, width: lw, height: lh, fill: glass });
  land += el("rect", { x: lx - lw * 0.12, y: lcy - lh / 2, width: lw * 0.06, height: lh, fill: dark });
  land += el("rect", { x: lx + lw * 0.22, y: lcy - lh / 2, width: lw * 0.06, height: lh, fill: dark });
  land += el("rect", { x: lx - tw * 0.72, y: gy - th * 0.045, width: tw * 1.44, height: th * 0.05, fill: dark });
  const roof = lcy - lh / 2;
  land += el("path", {
    d: s`M${lx - lw * 0.68} ${roof} Q ${lx} ${roof - lw * 0.95} ${lx + lw * 0.68} ${roof}Z`,
    fill: striped && g.chance(0.5) ? paint : dark,
  });
  land += el("rect", { x: lx - unit * 0.003, y: roof - lw * 0.62, width: unit * 0.006, height: lw * 0.2, fill: dark });
  land += "</g>";
  out += land;

  const fx = side === 1 ? lx : w - lx;
  note.alt(
    time === "night"
      ? "A lighthouse on a rocky cliff at night, its beam sweeping out to sea"
      : `A ${striped ? "striped " : ""}lighthouse on a rocky cliff above the sea ${time === "dusk" ? "at dusk" : "on a clear day"}${cottage ? ", with a keeper's cottage" : ""}`,
  );
  note.focus(fx, by - th * 0.75);
  return out;
});
