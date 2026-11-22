import { defineKind, el, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { AT, curve, daySky, TIMES } from "./shared";

const FIELDS: readonly (readonly [number, number, number])[] = [
  [95, 45, 45],
  [80, 50, 55],
  [48, 70, 62],
  [38, 60, 52],
  [25, 35, 42],
  [110, 38, 58],
  [60, 60, 50],
];

/**
 * Patchwork fields over rolling farmland, with hedgerows and a barn.
 *
 * @category Landscapes
 */
export const farm = /* @__PURE__ */ defineKind("farm", "Farmland", (g, w, h, note) => {
  const time = g.chance(0.6) ? "day" : g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  let out = el("defs", {}, lin(skyId, sky.stops));
  out += fill(w, h, `url(#${skyId})`);
  const horizon = h * g.f(0.3, 0.4);
  out += el("circle", {
    cx: w * g.f(0.15, 0.85),
    cy: horizon * (time === "day" ? g.f(0.3, 0.55) : g.f(0.6, 0.8)),
    r: unit * g.f(0.04, 0.06),
    fill: sky.sun,
  });
  // Far blue hills on the horizon.
  const hills = curve(w, horizon - h * g.f(0, 0.05), horizon - h * g.f(0, 0.05), -h * g.f(0.02, 0.06));
  out += el("path", { d: hills.d() + s`V${h}H0Z`, fill: hsl(sky.hue + 10, 22, 62 + sky.dim) });
  // Four bands of fields, back to front, each a curve split into fields by lines that spread toward the viewer.
  const vx = w * g.f(0.35, 0.65);
  const tops = [0, 0.17, 0.4, 0.68].map((f, k) =>
    curve(
      w,
      horizon + (h - horizon) * (f + g.f(-0.04, 0.04)) + (k ? 0 : h * 0.01),
      horizon + (h - horizon) * (f + g.f(-0.04, 0.04)) + (k ? 0 : h * 0.01),
      -h * g.f(-0.02, 0.05),
    ),
  );
  const hedge = hsl(g.f(110, 140), 35, 26 + sky.dim);
  let last = -1;
  let striped = 0;
  const clips: string[] = [];
  let fields = "";
  let lines = "";
  let bushes = "";
  tops.forEach((band, k) => {
    const cuts = [-0.2 * w];
    const n = g.i(2, 4) + (k < 2 ? 1 : 0);
    for (let j = 1; j < n; j++) cuts.push((w * (j + g.f(-0.3, 0.3))) / n);
    cuts.push(1.2 * w);
    // Where a cut line meets the bottom of the picture.
    const foot = (x: number) => vx + (x - vx) * (1.3 + 0.4 * k);
    for (let j = 0; j < cuts.length - 1; j++) {
      const a = cuts[j];
      const b = cuts[j + 1];
      const edge = Array.from({ length: 6 }, (_, i): Point => {
        const x = a + ((b - a) * i) / 5;
        return [x, band.at(x)];
      });
      const shape = pts([...edge, [foot(b), h + 1], [foot(a), h + 1]]);
      let pick = g.i(0, FIELDS.length - 1);
      if (pick === last) pick = (pick + 1) % FIELDS.length;
      last = pick;
      const [fh, fs, fl] = FIELDS[pick];
      fields += el("polygon", { points: shape, fill: hsl(fh, fs, fl + sky.dim) });
      // Rows of crops in some fields, running toward the horizon.
      if (striped < 4 && k > 0 && g.chance(0.4)) {
        const id = g.id(`field${striped++}`);
        clips.push(el("clipPath", { id }, el("polygon", { points: shape })));
        let rows = "";
        const count = 6 + k * 2;
        for (let i = 1; i < count; i++) {
          const top = a + ((b - a) * i) / count;
          rows += s`M${top} ${band.at(top)}L${foot(top)} ${h}`;
        }
        fields += el("path", {
          d: rows,
          stroke: "#000",
          opacity: "0.13",
          "stroke-width": unit * (0.004 + 0.003 * k),
          "clip-path": `url(#${id})`,
        });
      }
      // A hedge along each cut, down to the next band.
      if (j > 0) lines += s`M${a} ${band.at(a)}L${foot(a)} ${h}`;
    }
    if (k > 0) lines += band.d();
    // Round trees dotted along the band's top hedge, bigger nearer the viewer.
    for (let i = g.i(1, 3); i > 0; i--) {
      const x = w * g.f(0.03, 0.97);
      const r = unit * (0.012 + 0.008 * k) * g.f(0.8, 1.3);
      bushes += s`M${x - r} ${band.at(x)}a${r} ${r} 0 1 1 ${2 * r} 0Z`;
    }
    out += fields + el("path", { d: lines, fill: "none", stroke: hedge, "stroke-width": unit * (0.006 + 0.003 * k) });
    out += el("path", { d: bushes, fill: hedge });
    fields = "";
    lines = "";
    bushes = "";
  });
  out = out.replace("</defs>", clips.join("") + "</defs>");
  // The barn, standing in the third band, and sometimes a silo.
  const bw = unit * g.f(0.16, 0.21);
  const bx = w * g.f(0.22, 0.78);
  const band = tops[2];
  const below = tops[3];
  const by = Math.min(
    band.at(bx) + (below.at(bx) - band.at(bx)) * 0.55,
    below.at(bx - bw) - unit * 0.01,
    below.at(bx + bw) - unit * 0.01,
  );
  const bh = bw * 0.6;
  const red = hsl(g.f(-6, 12), g.f(50, 65), 42 + sky.dim / 2);
  const silo = g.chance(0.6);
  const sx = bx + g.pick([-1, 1]) * bw * 0.72;
  const sw = bw * 0.26;
  out += el("ellipse", { cx: bx, cy: by, rx: bw * 0.85, ry: bw * 0.08, fill: "#000", opacity: "0.12" });
  if (silo) {
    const sh = bh * 1.9;
    out += el("rect", { x: sx - sw / 2, y: by - sh, width: sw, height: sh, fill: hsl(200, 8, 74 + sky.dim) });
    out += el("path", {
      d: s`M${sx - sw / 2} ${by - sh} A ${sw / 2} ${sw / 2} 0 0 1 ${sx + sw / 2} ${by - sh}Z`,
      fill: hsl(200, 10, 60 + sky.dim),
    });
    out += el("rect", { x: sx, y: by - sh, width: sw / 2, height: sh, fill: "#000", opacity: "0.1" });
  }
  out += el("rect", { x: bx - bw / 2, y: by - bh, width: bw, height: bh, fill: red });
  out += el("polygon", {
    points: pts([
      [bx - bw * 0.56, by - bh],
      [bx - bw * 0.4, by - bh - bw * 0.28],
      [bx, by - bh - bw * 0.42],
      [bx + bw * 0.4, by - bh - bw * 0.28],
      [bx + bw * 0.56, by - bh],
    ]),
    fill: g.chance(0.5) ? hsl(0, 0, 28) : hsl(g.f(0, 12), 40, 26),
  });
  // A big door with a crossed frame, and a loft window.
  const dw = bw * 0.36;
  const dh = bh * 0.68;
  const trim = { fill: "none", stroke: "#f4f1ea", "stroke-width": bw * 0.025 };
  out += el("rect", { x: bx - dw / 2, y: by - dh, width: dw, height: dh, fill: "#000", opacity: "0.15" });
  out += el("rect", { x: bx - dw / 2, y: by - dh, width: dw, height: dh, ...trim });
  out += el("path", {
    d: s`M${bx - dw / 2} ${by - dh}L${bx + dw / 2} ${by}M${bx + dw / 2} ${by - dh}L${bx - dw / 2} ${by}`,
    ...trim,
  });
  out += el("rect", { x: bx - bw * 0.07, y: by - bh - bw * 0.2, width: bw * 0.14, height: bw * 0.12, fill: "#f4f1ea" });
  note.alt(`A barn${silo ? " and silo" : ""} among patchwork fields and hedgerows ${AT[time]}`);
  note.focus(bx, by - bh * 0.7);
  return out;
});
