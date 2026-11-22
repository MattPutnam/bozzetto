import { defineKind, el, facing, fill, hsl, lin, mix, type Point, qpt, type Rand, s } from "../../draw/core";
import { atLeast } from "../../draw/shapes";
import { bounds, flipFrame, flipX, headAxis, hoofLeg, leafShape, pine, tube } from "./shared";

/** A forest clearing: sky, a wall of round treetops and pines on the horizon, and a grassy floor. */
function clearing(g: Rand, w: number, h: number, hz: number): string {
  const size = Math.min(w, h);
  const sky = g.id("sky");
  const hue = g.f(95, 135);
  let out =
    el("defs", {}, lin(sky, [hsl(g.f(190, 210), 45, 78), hsl(g.f(170, 190), 45, 92)])) + fill(w, h, `url(#${sky})`);
  // Far treetops, then nearer and darker ones, standing on the horizon
  for (const [shade, lift, scale] of [
    [44, 0.55, 0.11],
    [34, 0.25, 0.13],
  ]) {
    let d = s`M 0 ${hz} `;
    // Treetops grow with a wide picture's width, so a panorama doesn't need dozens
    const unit = Math.max(size, w * 0.4);
    for (let x = -unit * 0.05; x < w + unit * 0.1; x += unit * scale * g.f(0.9, 1.3)) {
      const r = unit * scale * g.f(0.8, 1.15);
      const y = hz - r * lift - size * g.f(0.02, 0.08);
      d += s`M ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y} V ${hz + 1} H ${x + r} Z `;
    }
    out += el("path", { d, fill: hsl(hue, 30, shade) });
  }
  for (let k = g.i(2, 4); k > 0; k--)
    out += pine(w * g.f(0, 1), hz + size * 0.01, size * g.f(0.3, 0.42), hsl(hue + 20, 30, g.f(26, 32)));
  // The grassy clearing, with a patch of sunlight
  out += el("rect", { y: hz, width: w, height: h - hz, fill: hsl(hue - 20, 40, g.f(52, 58)) });
  out += el("ellipse", {
    cx: w * g.f(0.3, 0.7),
    cy: hz + (h - hz) * 0.6,
    rx: w * 0.4,
    ry: (h - hz) * 0.3,
    fill: "#fff6c8",
    opacity: "0.18",
  });
  return out;
}

const DEER = [
  { coat: "#a8703f", pale: "#f4ece0" },
  { coat: "#94603a", pale: "#efe5d6" },
  { coat: "#b9824f", pale: "#f6efe4" },
  { coat: "#8a6046", pale: "#ece3d6" },
] as const;

/**
 * A deer in a forest clearing: a buck with antlers, a doe, or a spotted fawn, alert or grazing.
 *
 * @category Animals
 */
export const deer = /* @__PURE__ */ defineKind("deer", "Deer", (g, w, h, note) => {
  const coat = g.pick(DEER);
  const dir = g.pick([-1, 1]);
  const age = g.pick(["buck", "buck", "doe", "doe", "fawn"] as const);
  const fawn = age === "fawn";
  const sz = Math.min(h * 0.68, w * 0.56) * g.f(0.9, 1) * (fawn ? 0.78 : 1);
  const hz = h * g.f(0.5, 0.58);
  const gy = h * g.f(0.86, 0.91);
  const grazing = g.chance(0.35);
  const brx = sz * (fawn ? 0.27 : 0.3);
  const bry = sz * 0.13;
  const legLen = sz * (fawn ? 0.48 : 0.44);
  const cy = gy - legLen - bry * 0.75;
  const cx = w / 2 - dir * sz * 0.06 + w * g.f(-0.03, 0.03);
  const far = mix(coat.coat, "#000000", 0.2);
  const hoofPaint = "#2e2622";
  const a = grazing ? g.f(15, 30) : g.f(58, 78);
  const hl = sz * 0.17;
  const n0: Point = [cx + brx * 0.6, cy + bry * 0.1];
  const poll: Point = grazing
    ? [cx + brx * 1.45, gy - sz * 0.02 - hl * Math.cos((a * Math.PI) / 180)]
    : [cx + brx * 1.05, cy - sz * g.f(0.3, 0.36)];
  const n1: Point = grazing ? [cx + brx * 1.2, cy - bry * 0.4] : [cx + brx * 0.95, cy - sz * 0.15];
  const at = headAxis(poll, a);
  let out = clearing(g.fork("scene"), w, h, hz);
  // Shadow
  out += el("ellipse", {
    cx: cx + dir * sz * 0.08,
    cy: gy,
    rx: sz * 0.45,
    ry: sz * 0.035,
    fill: "#000",
    opacity: "0.15",
  });
  out += facing(cx, dir);
  const fx = cx + brx * 0.6;
  const bx = cx - brx * 0.65;
  const ty = cy + bry * 0.3;
  const hoofLen = sz * 0.03;
  const stride = g.chance(0.4) ? sz * 0.05 : 0;
  const front = (x: number, paint: string, up: number, reach: number) =>
    hoofLeg(
      [x, ty],
      [x + reach * 0.5, gy - legLen * 0.45 - up],
      [x + reach, gy - hoofLen - up],
      sz * 0.065,
      sz * 0.03,
      paint,
      hoofPaint,
      hoofLen,
    );
  const hind = (x: number, paint: string, up: number, reach: number) =>
    hoofLeg(
      [x, ty - bry * 0.2],
      [x - sz * 0.045 - reach * 0.5, gy - legLen * 0.4 - up],
      [x - sz * 0.01 - reach, gy - hoofLen - up],
      sz * 0.09,
      sz * 0.03,
      paint,
      hoofPaint,
      hoofLen,
    );
  // Far legs
  out += hind(bx + sz * 0.035, far, sz * 0.012, stride);
  out += front(fx + sz * 0.035, far, sz * 0.012, -stride);
  // Body and neck
  const body =
    el("ellipse", { cx: cx - brx * 0.5, cy: cy - bry * 0.1, rx: brx * 0.52, ry: bry * 1.05 }) +
    el("ellipse", { cx, cy, rx: brx, ry: bry }) +
    el("ellipse", { cx: cx + brx * 0.55, cy: cy - bry * 0.05, rx: brx * 0.48, ry: bry });
  const neck = el("path", { d: tube(n0, n1, poll, sz * 0.2, sz * 0.1, 6) });
  out += el("g", { fill: coat.coat }, body, neck);
  // Pale belly and, on a fawn, rows of spots, clipped to the body
  const clip = g.id("hide");
  let marks = el("ellipse", {
    cx,
    cy: cy + bry * 1.05,
    rx: brx * 0.75,
    ry: bry * 0.4,
    fill: coat.pale,
    opacity: "0.8",
  });
  if (fawn) {
    // Rows of spots: dotted lines of zero-length dashes with round caps
    const m = g.fork("spots");
    let d = "";
    for (const row of [-0.55, -0.15, 0.25]) d += s`M ${cx - brx * m.f(0.9, 1)} ${cy + bry * row} h ${brx * 1.9} `;
    marks += el("path", {
      d,
      stroke: coat.pale,
      "stroke-width": sz * 0.024,
      "stroke-linecap": "round",
      "stroke-dasharray": s`0 ${brx * m.f(0.17, 0.22)}`,
    });
  }
  out += el("defs", {}, el("clipPath", { id: clip }, body));
  out += el("g", { "clip-path": `url(#${clip})` }, marks);
  // Pale rump and a short tail
  out += el("ellipse", { cx: cx - brx * 0.92, cy: cy - bry * 0.05, rx: brx * 0.12, ry: bry * 0.55, fill: coat.pale });
  out += el("ellipse", {
    cx: cx - brx * 1.03,
    cy: cy - bry * 0.55,
    rx: sz * 0.022,
    ry: sz * 0.05,
    fill: coat.coat,
    transform: s`rotate(${g.f(15, 40)} ${cx - brx * 1.03} ${cy - bry * 0.55})`,
  });
  // Near legs
  out += hind(bx, coat.coat, 0, -stride);
  out += front(fx, coat.coat, 0, stride);
  // Ears: long leaves out from behind the poll; the near one has a pale lining
  const earAngle = (spread: number) => {
    const tip = at(-sz * 0.06, sz * (0.03 + spread));
    return (Math.atan2(tip[1] - poll[1], tip[0] - poll[0]) * 180) / Math.PI;
  };
  const earBase = at(sz * 0.01, sz * 0.005);
  out += el("path", { d: leafShape(earBase[0], earBase[1], earAngle(0.03), sz * 0.13, 0.33), fill: far });
  // Antlers: a beam sweeping back and up, then forward, with tines; drawn for a head held at 70 degrees
  if (age === "buck") {
    const base = at(-sz * 0.005, sz * 0.035);
    const tines = g.i(2, 3);
    const lean = g.f(-6, 6);
    const antler = (dx: number, paint: string) => {
      const p0: Point = [base[0] + dx, base[1]];
      const p1: Point = [p0[0] - sz * 0.1, p0[1] - sz * 0.1];
      const p2: Point = [p0[0] + sz * 0.035, p0[1] - sz * 0.2];
      let d = s`M ${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`;
      const brow = qpt(p0, p1, p2, 0.12);
      d += s` M ${brow[0]} ${brow[1]} l ${sz * 0.035} ${-sz * 0.03}`;
      for (let k = 0; k < tines; k++) {
        const [x, y] = qpt(p0, p1, p2, 0.42 + (k * 0.45) / tines);
        d += s` M ${x} ${y} l ${sz * 0.012} ${-sz * (0.075 - k * 0.012)}`;
      }
      return el("path", {
        d,
        stroke: paint,
        "stroke-width": sz * 0.016,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none",
      });
    };
    out += s`<g transform="rotate(${70 - a + lean} ${base[0]} ${base[1]})">`;
    out += antler(sz * 0.03, "#b8a684") + antler(0, "#e3d4b4");
    out += "</g>";
  }
  // Head, tapering to the nose
  out += el("path", { d: tube(poll, at(hl * 0.5, 0), at(hl, 0), sz * 0.1, sz * 0.05, 2), fill: coat.coat });
  // A pale band behind the dark nose
  const band = at(hl * 0.8, 0);
  out += el("circle", { cx: band[0], cy: band[1], r: sz * 0.024, fill: coat.pale, opacity: "0.6" });
  const nose = at(hl * 0.98, sz * 0.006);
  out += el("circle", { cx: nose[0], cy: nose[1], r: sz * 0.02, fill: "#2a2220" });
  // Big dark eye
  const eye = at(hl * 0.32, sz * 0.016);
  out += el("circle", { cx: eye[0], cy: eye[1], r: sz * 0.017, fill: "#1a1412" });
  out += el("circle", { cx: eye[0] + sz * 0.005, cy: eye[1] - sz * 0.005, r: sz * 0.005, fill: "#ffffff" });
  // Near ear
  out += el("path", { d: leafShape(earBase[0], earBase[1], earAngle(-0.01), sz * 0.14, 0.33), fill: coat.coat });
  out += el("path", {
    d: leafShape(earBase[0], earBase[1], earAngle(-0.01), sz * 0.1, 0.2),
    fill: coat.pale,
    opacity: "0.7",
  });
  out += "</g>";
  const who = age === "buck" ? "A deer with antlers" : age === "fawn" ? "A spotted fawn" : "A deer";
  note.alt(
    `${who} ${grazing ? "grazing" : "standing alert"} in a forest clearing, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, eye[0]), eye[1]);
  // Head and ears; antlers would make the frame too tall to read as a face. A deer's head is small in
  // the scene, so the frame grows about its center to a size an avatar can crop.
  const [x, y, fw, fh] = atLeast(
    bounds([at(-sz * 0.1, sz * 0.06), at(0, -sz * 0.05), at(hl, sz * 0.03), at(hl, -sz * 0.03)], sz * 0.04),
    Math.min(w, h) * 0.26,
  );
  flipFrame(note, cx, dir, x, y, fw, fh);
  return out;
});
