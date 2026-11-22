import { defineKind, el, facing, fill, hsl, lin, type Point, pts, qpt, type Rand, s } from "../../draw/core";
import { daySky, TIMES } from "./shared";

/** A small boat on the water with its waterline at (x, y), `len` long and facing `dir`. */
function boat(g: Rand, x: number, y: number, len: number, dir: number, hull: string): string {
  const ht = len * 0.13;
  let body = el("path", {
    d: s`M${x - len * 0.5} ${y - ht * 1.35}Q${x - len * 0.42} ${y} ${x - len * 0.2} ${y}L${x + len * 0.38} ${y}
         Q${x + len * 0.48} ${y - ht * 0.3} ${x + len * 0.5} ${y - ht}Z`,
    fill: hull,
  });
  body += el("path", {
    d: s`M${x - len * 0.5} ${y - ht * 1.35}L${x + len * 0.5} ${y - ht}`,
    stroke: "#fff",
    "stroke-width": ht * 0.25,
    opacity: "0.5",
  });
  const kind = g.i(0, 2);
  if (kind === 0) {
    // A canopy over the middle.
    const cy = y - ht * 1.15;
    body += el("path", {
      d: s`M${x - len * 0.2} ${cy}V${cy - ht * 1.5}M${x + len * 0.2} ${cy}V${cy - ht * 1.5}`,
      stroke: hsl(0, 0, 20),
      "stroke-width": ht * 0.15,
    });
    body += el("rect", {
      x: x - len * 0.26,
      y: cy - ht * 1.8,
      width: len * 0.52,
      height: ht * 0.4,
      rx: ht * 0.15,
      fill: hsl(g.f(0, 360), 40, 85),
    });
  } else if (kind === 1) {
    // Someone sitting at the stern.
    const px = x + len * 0.22;
    const py = y - ht * 1.1;
    body += el("rect", {
      x: px - ht * 0.4,
      y: py - ht * 1.3,
      width: ht * 0.8,
      height: ht * 1.4,
      rx: ht * 0.3,
      fill: hsl(g.f(0, 360), 35, 35),
    });
    body += el("circle", { cx: px, cy: py - ht * 1.7, r: ht * 0.4, fill: hsl(25, 35, 55) });
  }
  const out = el("g", { transform: s`matrix(1 0 0 -1 0 ${2 * y})`, opacity: "0.25" }, body) + body;
  return facing(x, dir) + out + "</g>";
}

/**
 * Narrow gabled houses along a city canal, a little arched bridge, boats and reflections.
 *
 * @category Landscapes
 */
export const canal = /* @__PURE__ */ defineKind("canal", "Canal houses", (g, w, h, note) => {
  const time = g.chance(0.6) ? "day" : g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const dim = sky.dim;
  const skyId = g.id("sky");
  const view = g.id("view");
  const stretch = Math.max(1, w / (unit * 0.15 * 11));
  const base = h * g.f(0.5, 0.56);
  const waterY = base + unit * g.f(0.045, 0.06);
  let scene = el("rect", { width: w, height: waterY, fill: `url(#${skyId})` });
  if (time !== "day" || g.chance(0.6))
    scene += el("circle", {
      cx: w * g.f(0.1, 0.9),
      cy: base * (time === "day" ? g.f(0.15, 0.3) : g.f(0.35, 0.5)),
      r: unit * g.f(0.04, 0.06),
      fill: sky.sun,
    });
  // The gap for the side canal and its bridge.
  const gw = unit * g.f(0.24, 0.32) * Math.sqrt(stretch);
  const gx = w * g.f(0.3, 0.7);
  // Houses far down the side canal, pale with distance.
  let far = "";
  for (let x = gx - gw / 2; x < gx + gw / 2;) {
    const fw = gw * g.f(0.18, 0.3);
    const fh = base * g.f(0.18, 0.3);
    far += s`M${x} ${base}V${base - fh}l${fw / 2} ${-fw * 0.5}l${fw / 2} ${fw * 0.5}V${base}Z`;
    x += fw;
  }
  scene += el("path", { d: far, fill: hsl(sky.hue + 10, 14, 66 + dim) });
  // The houses.
  const lit = time !== "day";
  const glass = hsl(210, 22, 26 + dim / 2);
  const glow = hsl(45, 95, 70);
  const frame = "#f4f1ea";
  let panes = "";
  let shine = "";
  let doors = "";
  let cornices = "";
  for (let x = -unit * g.f(0, 0.08); x < w;) {
    const hw = unit * g.f(0.12, 0.16) * stretch;
    if (x + hw > gx - gw / 2 && x < gx + gw / 2) {
      x = gx + gw / 2;
      continue;
    }
    const hh = Math.min(unit * g.f(0.28, 0.42) * Math.min(stretch, 1.4), base - hw * 0.6 - unit * 0.03);
    const yt = base - hh;
    const gable = g.pick(["point", "step", "neck", "flat"] as const);
    const outline: Point[] =
      gable === "point"
        ? [
            [x + hw / 2, yt - hw * 0.5],
            [x + hw, yt],
          ]
        : gable === "step"
          ? [0.15, 0.3, 0.42, 0.58, 0.7, 0.85].flatMap((f, j): Point[] => {
              const up = (j < 3 ? j + 1 : 6 - j) * hw * 0.13;
              const was = (j < 3 ? j : 7 - j) * hw * 0.13;
              return [
                [x + hw * f, yt - was],
                [x + hw * f, yt - up],
              ];
            })
          : gable === "neck"
            ? [
                [x + hw * 0.22, yt - hw * 0.08],
                [x + hw * 0.22, yt - hw * 0.38],
                [x + hw * 0.5, yt - hw * 0.55],
                [x + hw * 0.78, yt - hw * 0.38],
                [x + hw * 0.78, yt - hw * 0.08],
                [x + hw, yt],
              ]
            : [[x + hw, yt]];
    const color = g.pick([
      hsl(g.f(0, 22), 45, 42 + dim / 2),
      hsl(g.f(30, 50), 45, 72 + dim / 2),
      hsl(g.f(180, 220), 28, 55 + dim / 2),
      hsl(g.f(90, 140), 22, 52 + dim / 2),
      hsl(g.f(340, 360), 35, 60 + dim / 2),
      hsl(g.f(15, 30), 30, 30 + dim / 2),
    ]);
    scene += el("path", { d: s`M${x} ${base}V${yt}L` + pts(outline).replace(/,/g, " ") + s`V${base}Z`, fill: color });
    if (gable === "flat")
      cornices += s`M${x - unit * 0.004} ${yt - unit * 0.012}h${hw + unit * 0.008}v${unit * 0.016}h${-hw - unit * 0.008}Z`;
    // Windows floor by floor, a door at the bottom, and one in the gable.
    const cols = hw > unit * 0.15 ? 3 : 2;
    const floors = Math.max(2, Math.min(4, Math.round((hh * 0.78) / (unit * 0.08))));
    const fl = (hh * 0.8) / floors;
    const ww = hw / (cols * 2);
    for (let f = 0; f < floors; f++)
      for (let c = 0; c < cols; c++) {
        const r = s`M${x + ww * (0.5 + 2 * c)} ${yt + hh * 0.05 + fl * (f + 0.2)}h${ww}v${fl * 0.6}h${-ww}Z`;
        if (lit && g.chance(0.4)) shine += r;
        else panes += r;
      }
    if (gable !== "flat")
      panes += s`M${x + hw / 2 - ww * 0.4} ${yt - hw * 0.25}h${ww * 0.8}v${hw * 0.16}h${-ww * 0.8}Z`;
    const dx = x + hw * g.f(0.15, 0.6);
    doors += s`M${dx} ${base}v${-hh * 0.15}h${hw * 0.22}v${hh * 0.15}Z`;
    x += hw;
  }
  if (cornices) scene += el("path", { d: cornices, fill: frame });
  scene += el("path", { d: panes, fill: glass, stroke: frame, "stroke-width": unit * 0.004 });
  if (shine) scene += el("path", { d: shine, fill: glow, stroke: frame, "stroke-width": unit * 0.004 });
  scene += el("path", { d: doors, fill: hsl(g.f(0, 360), 35, 24) });
  // The quay wall, and the bridge humped over the side canal with water showing under its arch.
  const stone = hsl(g.f(15, 35), 18, 44 + dim);
  scene += el("rect", { y: base, width: w, height: waterY - base, fill: stone });
  scene += el("rect", { y: base, width: w, height: unit * 0.008, fill: "#fff", opacity: "0.25" });
  const hump = unit * g.f(0.03, 0.05);
  const bl = gx - gw / 2 - unit * 0.01;
  const br = gx + gw / 2 + unit * 0.01;
  scene += el("path", {
    d: s`M${bl} ${waterY}V${base}Q${gx} ${base - hump * 2} ${br} ${base}V${waterY}Z`,
    fill: hsl(g.f(0, 20), 35, 38 + dim),
  });
  const ow = gw * g.f(0.5, 0.65);
  scene += el("path", {
    d: s`M${gx - ow / 2} ${waterY}A${ow / 2} ${waterY - base + hump * 0.4} 0 0 1 ${gx + ow / 2} ${waterY}Z`,
    fill: hsl(sky.hue, 30, 22 + dim / 2),
  });
  // A railing along the deck.
  const rail = (t: number) => qpt([bl, base], [gx, base - hump * 2], [br, base], t);
  let posts = "";
  for (let k = 0; k <= 8; k++) {
    const [px, py] = rail(k / 8);
    posts += s`M${px} ${py}v${-unit * 0.03}`;
  }
  const [r0, r1] = [rail(0), rail(1)];
  posts += s`M${r0[0]} ${r0[1] - unit * 0.03}Q${gx} ${base - hump * 2 - unit * 0.03} ${r1[0]} ${r1[1] - unit * 0.03}`;
  scene += el("path", { d: posts, fill: "none", stroke: hsl(0, 0, 20), "stroke-width": unit * 0.005 });
  let out = el("defs", {}, lin(skyId, sky.stops), el("g", { id: view }, scene));
  out += fill(w, h, hsl(sky.hue - 10, 35, 32 + dim));
  out += el("use", { href: `#${view}` });
  out += el("use", { href: `#${view}`, transform: s`matrix(1 0 0 -1 0 ${2 * waterY})`, opacity: "0.6" });
  out += el("rect", {
    y: waterY,
    width: w,
    height: h - waterY,
    fill: hsl(sky.hue - 10, 40, 30 + dim),
    opacity: "0.35",
  });
  let ripples = "";
  for (let k = g.i(5, 9); k > 0; k--) {
    const y = waterY + (h - waterY) * g.f(0.05, 0.95);
    ripples += s`M${w * g.f(-0.1, 0.95)} ${y}h${w * g.f(0.05, 0.2)}`;
  }
  out += el("path", { d: ripples, stroke: "#fff", "stroke-width": Math.max(1, unit * 0.005), opacity: "0.3" });
  // Boats: one moored at the quay, sometimes another out on the water.
  const len = unit * g.f(0.22, 0.3);
  const hull = () => g.pick([hsl(g.f(200, 230), 40, 30), hsl(g.f(0, 15), 50, 38), hsl(130, 25, 28), hsl(30, 35, 30)]);
  const mx = gx + g.pick([-1, 1]) * (gw / 2 + len * g.f(0.7, 1.2));
  const moored = Math.max(len * 0.6, Math.min(w - len * 0.6, mx));
  out += boat(g, moored, waterY + unit * 0.05, len, g.pick([-1, 1]), hull());
  const second = g.chance(0.55);
  if (second) {
    const bx = moored < w / 2 ? w * g.f(0.6, 0.85) : w * g.f(0.15, 0.4);
    out += boat(g, bx, waterY + (h - waterY) * g.f(0.55, 0.75), len * 1.15, g.pick([-1, 1]), hull());
  }
  const when = time === "day" ? "on a sunny day" : time === "dawn" ? "at dawn" : "at dusk, windows lit";
  note.alt(
    `Tall narrow houses along a canal with a little arched bridge and ${second ? "boats" : "a moored boat"}, ${when}`,
  );
  note.focus(gx, base - hump);
  return out;
});
