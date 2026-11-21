import { defineKind, el, hsl, type Point, pts, type Rand, s } from "../../draw/core";
import { smoothClosed } from "../../draw/shapes";
import { smallFish, underwater, whole } from "./shared";

/** A few bubbles rising above (x, y). */
function bubbles(g: Rand, x: number, y: number, spread: number, r: number): string {
  let out = "";
  for (let k = g.i(2, 4); k > 0; k--)
    out += el("circle", { cx: x + g.f(-0.5, 0.5) * spread, cy: y - k * r * 4.5, r: r * g.f(0.6, 1.2) });
  return el("g", { fill: "none", stroke: "#fff", "stroke-width": "1.5", opacity: "0.6" }, out);
}

/** A copy of `items` in a random order. */
function shuffled<T>(g: Rand, items: readonly T[]): T[] {
  const out = [...items];
  for (let k = out.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [out[k], out[j]] = [out[j], out[k]];
  }
  return out;
}

type Hsl = readonly [number, number, number];

const tone = ([hh, ss, ll]: Hsl, dl: number, ds = 0) => hsl(hh, ss + ds, ll + dl);

const CORAL: readonly Hsl[] = [
  [350, 70, 66],
  [12, 78, 64],
  [28, 85, 62],
  [45, 80, 62],
  [285, 45, 64],
  [315, 55, 68],
  [170, 45, 55],
  [200, 55, 60],
  [80, 45, 55],
];

/** Branching coral growing up from (x, y), about `ht` tall: forked limbs with round tips. */
function branchCoral(g: Rand, x: number, y: number, ht: number, c: Hsl): string {
  const d = ["", "", ""];
  const grow = (px: number, py: number, len: number, angle: number, depth: number) => {
    const bend = g.f(-0.3, 0.3);
    const ex = px + Math.cos(angle) * len;
    const ey = py + Math.sin(angle) * len;
    const cx = px + Math.cos(angle + bend) * len * 0.55;
    const cy = py + Math.sin(angle + bend) * len * 0.55;
    d[depth] += s`M${px} ${py}Q${cx} ${cy} ${ex} ${ey}`;
    if (depth < 2)
      for (let k = g.i(2, 3 - depth); k > 0; k--) {
        const turn = Math.max(-Math.PI + 0.35, Math.min(-0.35, angle + g.f(-0.75, 0.75)));
        grow(ex, ey, len * g.f(0.65, 0.85), turn, depth + 1);
      }
  };
  for (let k = g.i(1, 2); k > 0; k--) grow(x + g.f(-0.05, 0.05) * ht, y, ht * 0.4, -Math.PI / 2 + g.f(-0.35, 0.35), 0);
  return d
    .map((path, k) =>
      el("path", {
        d: whole(path),
        fill: "none",
        stroke: tone(c, -k * 3),
        "stroke-width": ht * (0.1 - k * 0.025),
        "stroke-linecap": "round",
      }),
    )
    .join("");
}

/** A brain coral: a low dome on (x, y), `rw` wide each side, with winding grooves. */
function brainCoral(g: Rand, x: number, y: number, rw: number, c: Hsl): string {
  const rh = rw * g.f(0.6, 0.8);
  let out = el("path", { d: s`M${x - rw} ${y}A${rw} ${rh} 0 0 1 ${x + rw} ${y}Z`, fill: tone(c, 0) });
  let grooves = "";
  for (let j = 1; j <= 2; j++) {
    const sc = 1 - j * 0.3;
    const ph = g.f(0, 6);
    for (let k = 0; k <= 9; k++) {
      const a = Math.PI + (Math.PI * k) / 9;
      const wob = sc * (1 + 0.07 * Math.sin(a * 11 + ph));
      grooves += `${k ? "L" : "M"}` + s`${x + Math.cos(a) * rw * wob} ${y + Math.sin(a) * rh * wob}`;
    }
  }
  out += el("path", {
    d: whole(grooves),
    fill: "none",
    stroke: tone(c, -16),
    "stroke-width": rw * 0.05,
    "stroke-linejoin": "round",
  });
  out += el("path", {
    d: s`M${x - rw * 0.55} ${y - rh * 0.62}Q${x} ${y - rh * 1.08} ${x + rw * 0.5} ${y - rh * 0.68}`,
    fill: "none",
    stroke: "#fff",
    "stroke-width": rw * 0.06,
    "stroke-linecap": "round",
    opacity: "0.2",
  });
  return out;
}

/** A sea fan on a short stem at (x, y): a lacy fan `fw` wide and `fh` tall with radiating veins. */
function fanCoral(g: Rand, x: number, y: number, fw: number, fh: number, c: Hsl): string {
  const cy = y - fh * 0.55;
  const ring: Point[] = [
    [x + fw * 0.08, y - fh * 0.1],
    [x - fw * 0.08, y - fh * 0.1],
  ];
  const veins: Point[] = [];
  for (let k = 0; k <= 6; k++) {
    const a = Math.PI * 1.08 + (Math.PI * 0.84 * k) / 6;
    const r = g.f(0.9, 1.05);
    const p: Point = [x + Math.cos(a) * fw * 0.5 * r, cy + Math.sin(a) * fh * 0.45 * r];
    ring.push(p);
    veins.push(p);
  }
  let out = el("path", { d: whole(smoothClosed(ring)), fill: tone(c, 4), opacity: "0.8" });
  let d = "";
  for (const [vx, vy] of veins)
    d += s`M${x} ${y - fh * 0.12}Q${x + (vx - x) * 0.3} ${cy} ${vx * 0.9 + x * 0.1} ${vy * 0.9 + cy * 0.1}`;
  d += s`M${x} ${y}V${y - fh * 0.14}`;
  out += el("path", {
    d: whole(d),
    fill: "none",
    stroke: tone(c, -14),
    "stroke-width": fw * 0.025,
    "stroke-linecap": "round",
  });
  return out;
}

/** A cluster of tube corals standing on (x, y), up to `ht` tall, open at the top. */
function tubeCoral(g: Rand, x: number, y: number, ht: number, c: Hsl): string {
  const count = g.i(3, 5);
  const tw = ht * 0.24;
  const tubes = Array.from({ length: count }, (_, k) => ({
    tx: x + (k - (count - 1) / 2) * tw * 0.85 + g.f(-0.1, 0.1) * tw,
    th: ht * g.f(0.5, 1),
    lean: (k - (count - 1) / 2) * g.f(0.08, 0.16),
  })).sort((a, b) => b.th - a.th);
  let out = "";
  let holes = "";
  for (const { tx, th, lean } of tubes) {
    // Each tube leans out from the middle of the cluster, rounded at its open top.
    const top = tx + lean * th;
    const r = tw / 2;
    out += el("path", {
      d: whole(
        s`M${tx - r} ${y + 2}L${top - r} ${y - th}A${r} ${r * 0.36} 0 0 1 ${top + r} ${y - th}L${tx + r} ${y + 2}Z`,
      ),
      fill: tone(c, g.f(-6, 4)),
    });
    holes += s`M${top - r * 0.5} ${y - th}h${r}`;
  }
  // The openings: short, thick round-capped strokes, which read as ovals.
  return (
    out + el("path", { d: whole(holes), stroke: tone(c, -24), "stroke-width": tw * 0.24, "stroke-linecap": "round" })
  );
}

/** A sea anemone on (x, y): a short column topped with swaying tentacles, `ah` tall. */
function anemone(g: Rand, x: number, y: number, ah: number, c: Hsl): string {
  const aw = ah * g.f(0.9, 1.2);
  let out = el("path", {
    d: s`M${x - aw * 0.3} ${y}Q${x - aw * 0.22} ${y - ah * 0.2} ${x - aw * 0.3} ${y - ah * 0.35}H${x + aw * 0.3}
         Q${x + aw * 0.22} ${y - ah * 0.2} ${x + aw * 0.3} ${y}Z`,
    fill: tone(c, -18),
  });
  let d = "";
  let tips = "";
  const count = g.i(10, 12);
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1) - 0.5;
    const sx = x + u * aw * 0.55;
    const sy = y - ah * 0.33;
    const a = -Math.PI / 2 + u * 2.2 + g.f(-0.15, 0.15);
    const len = ah * 0.65 * g.f(0.8, 1.1);
    const ex = sx + Math.cos(a) * len;
    const ey = sy + Math.sin(a) * len;
    d += s`M${sx} ${sy}Q${(sx + ex) / 2 + g.f(-0.12, 0.12) * len} ${(sy + ey) / 2} ${ex} ${ey}`;
    tips += s`M${ex} ${ey}h0`;
  }
  const sw = aw * 0.075;
  out += el("path", { d: whole(d), fill: "none", stroke: tone(c, 0), "stroke-width": sw, "stroke-linecap": "round" });
  out += el("path", { d: whole(tips), stroke: tone(c, 14), "stroke-width": sw * 1.4, "stroke-linecap": "round" });
  return out;
}

/** A coral reef on a sandy floor: corals of several kinds, an anemone, small fish and light from above. */
export const reef = /* @__PURE__ */ defineKind("reef", "Coral reef", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.f(180, 200);
  let out = underwater(g, w, h, hsl(hue - 5, 60, 66), hsl(hue + 12, 62, 34));
  // The floor, gently rolling.
  const gy = h * g.f(0.74, 0.8);
  const ph = g.f(0, 6);
  const waves = g.f(1, 2.5);
  const floorY = (x: number) => gy + h * 0.02 * Math.sin((x / w) * Math.PI * waves + ph);
  // A far reef, faded by the water.
  let far = s`M-5 ${gy + unit * 0.02}`;
  for (let x = -5; x < w + unit * 0.1;) {
    const step = unit * g.f(0.14, 0.26);
    far += s`Q${x + step / 2} ${gy - unit * g.f(0.06, 0.16)} ${x + step} ${gy - unit * g.f(0, 0.02)}`;
    x += step;
  }
  out += el("path", { d: whole(far + s`V${h}H-5Z`), fill: hsl(hue + 15, 40, 40), opacity: "0.3" });
  let sand = s`M-5 ${h}`;
  for (let k = 0; k <= 12; k++) sand += s`L${(w * k) / 12} ${floorY((w * k) / 12)}`;
  out += el("path", { d: whole(sand + s`L${w + 5} ${floorY(w)}V${h}Z`), fill: hsl(g.f(38, 50), 45, g.f(70, 78)) });
  // Corals in two rows: a hazy back row along the floor line and a nearer one on the sand.
  const colors = shuffled(g, CORAL);
  let ci = 0;
  const color = () => colors[ci++ % colors.length];
  const coral = (x: number, y: number, size: number, kind: number) => {
    const c = color();
    if (kind === 0) return branchCoral(g, x, y, size, c);
    if (kind === 1) return brainCoral(g, x, y, size * 0.55, c);
    if (kind === 2) return fanCoral(g, x, y, size * 0.9, size, c);
    return tubeCoral(g, x, y, size * 0.75, c);
  };
  // Larger corals in a wide picture, where there are fewer of them for the width.
  const grow = Math.min(1.3, Math.max(1, w / h / 2.2));
  const slots = Math.max(3, Math.min(5, Math.round(w / (unit * 0.3))));
  let back = "";
  for (let k = 0; k < slots; k++) {
    const x = (w * (k + g.f(0.2, 0.8))) / slots;
    back += coral(x, floorY(x) + unit * 0.02, unit * g.f(0.2, 0.3) * grow, g.i(0, 3));
  }
  out += el("g", { opacity: "0.65" }, back);
  // The near row, with one anemone (sometimes with its clownfish).
  const near = Math.max(4, Math.min(5, Math.round(w / (unit * 0.3))));
  const anemoneAt = g.i(0, near - 1);
  const kinds = shuffled(g, [0, 1, 2, 3]);
  let clown: Point | undefined;
  let focus: Point = [w / 2, gy];
  for (let k = 0; k < near; k++) {
    const x = (w * (k + g.f(0.25, 0.75))) / near;
    const y = Math.min(h - unit * 0.02, floorY(x) + (h - floorY(x)) * g.f(0.35, 0.7));
    const size = unit * g.f(0.32, 0.42) * grow;
    if (k === anemoneAt) {
      out += anemone(g, x, y, size * 0.6, color());
      if (g.chance(0.65)) clown = [x + g.pick([-1, 1]) * size * 0.4, y - size * 0.75];
      focus = [x, y - size * 0.4];
    } else {
      out += coral(x, y, size, kinds[k % 4]);
    }
  }
  // A sea star and a few pebbles on the sand.
  if (g.chance(0.5)) {
    const sx = w * g.f(0.1, 0.9);
    const sy = Math.min(h - unit * 0.03, floorY(sx) + (h - floorY(sx)) * g.f(0.6, 0.85));
    const r = unit * 0.06;
    const spin = g.f(0, 1);
    const star: Point[] = [];
    for (let k = 0; k < 10; k++) {
      const a = ((k + spin) * Math.PI) / 5;
      const rr = k % 2 ? r * 0.42 : r;
      star.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * 0.6]);
    }
    out += el("polygon", { points: pts(star), fill: hsl(g.f(0, 30), 70, 60) });
  }
  // Fish swimming above the reef.
  const top = h * 0.12;
  const bottom = Math.max(top + unit * 0.05, gy - unit * 0.4);
  const count = g.i(3, 5);
  const fishHue = g.f(0, 360);
  for (let k = 0; k < count; k++) {
    const fh = fishHue + g.pick([0, 0, 60, 180]);
    out += smallFish(
      w * ((k + g.f(0.2, 0.8)) / count),
      g.f(top, bottom),
      unit * g.f(0.035, 0.055),
      g.pick([-1, 1]),
      hsl(fh, 80, 62),
      hsl(fh + 15, 75, 50),
      g.chance(0.4) ? hsl(fh + 180, 70, 85) : "",
    );
  }
  if (clown) {
    const r = unit * 0.05;
    out += smallFish(clown[0], clown[1], r, clown[0] < focus[0] ? 1 : -1, hsl(22, 92, 56), hsl(18, 85, 48), "#fff");
    out += bubbles(g, clown[0], clown[1] - r, r, unit * 0.008);
  }
  note.alt(
    clown
      ? "A coral reef with an anemone and its clownfish, small fish swimming above"
      : "A coral reef of many kinds of coral on a sandy floor, small fish swimming above",
  );
  note.focus(...focus);
  return out;
});
