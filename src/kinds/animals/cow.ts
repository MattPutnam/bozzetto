import { defineKind, el, facing, mix, type Point, qpt, s } from "../../draw/core";
import { blob } from "../../draw/shapes";
import { andList } from "../../draw/words";
import {
  bounds,
  fence,
  field,
  flipFrame,
  flipX,
  headAxis,
  hoofLeg,
  leafShape,
  limb,
  meadowFlowers,
  tube,
} from "./shared";

const COWS = [
  { coat: "#f6f3ee", patch: "#262224", muzzle: "#f0bdb8", dairy: true },
  { coat: "#f4efe6", patch: "#b7703a", muzzle: "#f2c6b4", dairy: true },
  { coat: "#c98b52", muzzle: "#4a3a34", dairy: true },
  { coat: "#2a2526", muzzle: "#463c3e" },
  { coat: "#9c4a2a", face: "#f4efe6", muzzle: "#f2c6b4" },
  { coat: "#b8865a", muzzle: "#e8c8b0" },
] as const;

/**
 * A cow side on in a pasture, grazing or looking up, sometimes with horns or a bell.
 *
 * @category Animals
 */
export const cow = /* @__PURE__ */ defineKind("cow", "Cow", (g, w, h, note) => {
  const coat = g.pick(COWS);
  const dir = g.pick([-1, 1]);
  const sz = Math.min(h * 0.62, w * 0.5) * g.f(0.9, 1);
  const hz = h * g.f(0.48, 0.58);
  const gy = h * g.f(0.86, 0.91);
  const grazing = g.chance(0.35);
  const horns = g.chance(0.4);
  const bell = g.chance(0.4);
  const brx = sz * 0.4;
  const bry = sz * 0.19;
  const legLen = sz * 0.26;
  const cy = gy - legLen - bry * 0.85;
  const cx = w / 2 - dir * sz * 0.08 + w * g.f(-0.03, 0.03);
  const far = mix(coat.coat, "#000000", 0.2);
  const face = "face" in coat ? coat.face : coat.coat;
  const a = grazing ? g.f(12, 25) : g.f(40, 62);
  const hl = sz * 0.25;
  const n0: Point = [cx + brx * 0.7, cy + bry * 0.25];
  const poll: Point = grazing
    ? [cx + brx * 1.25, gy - sz * 0.02 - hl * Math.cos((a * Math.PI) / 180)]
    : [cx + brx * 1.22, cy - bry * g.f(0.6, 1.1)];
  const n1: Point = grazing ? [cx + brx * 1.1, cy - bry * 0.1] : [cx + brx * 1.05, cy - bry * 0.4];
  const at = headAxis(poll, a);
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(190, 215), [scene.f(75, 115), 42, scene.f(50, 58)]);
  const fenced = scene.chance(0.45);
  if (fenced) out += fence(w, hz + (gy - hz) * 0.2, Math.min(w, h) * 0.12, "#9a7650");
  out += meadowFlowers(scene, w, h, hz, Math.min(w, h));
  // Shadow
  out += el("ellipse", {
    cx: cx + dir * sz * 0.08,
    cy: gy,
    rx: sz * 0.55,
    ry: sz * 0.045,
    fill: "#000",
    opacity: "0.15",
  });
  out += facing(cx, dir);
  const fx = cx + brx * 0.62;
  const bx = cx - brx * 0.68;
  const ty = cy + bry * 0.3;
  const hoofLen = sz * 0.03;
  const front = (x: number, paint: string, up: number) =>
    hoofLeg(
      [x, ty],
      [x, gy - legLen * 0.45 - up],
      [x, gy - hoofLen - up],
      sz * 0.1,
      sz * 0.06,
      paint,
      "#3a302b",
      hoofLen,
    );
  const hind = (x: number, paint: string, up: number) =>
    hoofLeg(
      [x, ty - bry * 0.2],
      [x - sz * 0.03, gy - legLen * 0.45 - up],
      [x - sz * 0.005, gy - hoofLen - up],
      sz * 0.13,
      sz * 0.06,
      paint,
      "#3a302b",
      hoofLen,
    );
  // Far legs
  out += hind(bx + sz * 0.05, far, sz * 0.012) + front(fx + sz * 0.05, far, sz * 0.012);
  // Tail with a tuft
  const tailEnd: Point = [cx - brx * 1.06 - sz * g.f(0, 0.04), cy + bry + legLen * g.f(0.5, 0.7)];
  out += el("path", {
    d: s`M ${cx - brx * 0.95} ${cy - bry * 0.7} Q ${cx - brx * 1.08} ${cy} ${tailEnd[0]} ${tailEnd[1]}`,
    stroke: coat.coat,
    "stroke-width": sz * 0.018,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("ellipse", {
    cx: tailEnd[0],
    cy: tailEnd[1] + sz * 0.03,
    rx: sz * 0.02,
    ry: sz * 0.045,
    fill: "patch" in coat ? coat.patch : mix(coat.coat, "#000000", 0.3),
  });
  // Body: a boxy barrel with a bony hip, and the neck
  const body =
    el("rect", { x: cx - brx, y: cy - bry, width: brx * 2, height: bry * 2, rx: bry * 0.75 }) +
    el("ellipse", { cx: cx + brx * 0.05, cy: cy + bry * 0.3, rx: brx * 0.85, ry: bry * 0.85 }) +
    el("circle", { cx: cx - brx * 0.72, cy: cy - bry * 0.78, r: bry * 0.3 });
  const neck = el("path", { d: tube(n0, n1, poll, sz * 0.32, sz * 0.18, 5) });
  const headD = tube(poll, at(hl * 0.5, 0), at(hl, 0), sz * 0.17, sz * 0.14, 2);
  const headShape = el("path", { d: headD });
  out += el("g", { fill: coat.coat }, body, neck);
  // Udder, between the hind legs
  if ("dairy" in coat) {
    out += el("ellipse", { cx: cx - brx * 0.4, cy: cy + bry * 1.05, rx: sz * 0.07, ry: sz * 0.05, fill: "#f0b4b0" });
    for (const k of [-1, 1])
      out += limb(
        cx - brx * 0.4 + k * sz * 0.03,
        cy + bry * 1.1,
        cx - brx * 0.4 + k * sz * 0.032,
        cy + bry * 1.1 + sz * 0.05,
        sz * 0.016,
        "#e8a19c",
      );
  }
  // Near legs
  out += hind(bx, coat.coat, 0) + front(fx, coat.coat, 0);
  // Far ear, then the head
  const earBase = at(sz * 0.04, -sz * 0.01);
  const back = at(-sz, -sz * 1.6);
  const earAngle = (Math.atan2(back[1] - earBase[1], back[0] - earBase[0]) * 180) / Math.PI;
  out += el("path", { d: leafShape(earBase[0], earBase[1], earAngle - 25, sz * 0.13, 0.42), fill: far });
  out += el("path", { d: headD, fill: face });
  // Patches, clipped to the body, neck and head
  if ("patch" in coat) {
    const clip = g.id("hide");
    const m = g.fork("patches");
    let marks = "";
    for (let k = m.i(4, 5); k > 0; k--)
      marks += el("path", {
        d: blob(
          m,
          cx + brx * m.f(-1.1, 1.3),
          cy + bry * m.f(-1.6, 1),
          sz * m.f(0.08, 0.15),
          sz * m.f(0.07, 0.12),
          2,
          0.25,
        ),
        fill: coat.patch,
      });
    const eyePatch = at(hl * 0.3, sz * 0.045);
    if (m.chance(0.5)) marks += el("circle", { cx: eyePatch[0], cy: eyePatch[1], r: sz * 0.05, fill: coat.patch });
    out += el("defs", {}, el("clipPath", { id: clip }, body, neck, headShape));
    out += el("g", { "clip-path": `url(#${clip})` }, marks);
  }
  // Horns curving up from the poll
  if (horns)
    out += el("path", {
      d: tube(
        at(sz * 0.01, sz * 0.05),
        at(-sz * 0.05, sz * 0.045),
        at(-sz * 0.08, sz * 0.09),
        sz * 0.035,
        sz * 0.014,
        5,
      ),
      fill: "#efe6d2",
    });
  // Broad muzzle, nostril and eye
  const muzzle = at(hl * 0.95, -sz * 0.005);
  out += el("circle", { cx: muzzle[0], cy: muzzle[1], r: sz * 0.078, fill: coat.muzzle });
  const nostril = at(hl * 1.02, sz * 0.035);
  out += el("ellipse", {
    cx: nostril[0],
    cy: nostril[1],
    rx: sz * 0.012,
    ry: sz * 0.009,
    fill: "#000",
    opacity: "0.4",
  });
  const eye = at(hl * 0.3, sz * 0.045);
  out += el("circle", { cx: eye[0], cy: eye[1], r: sz * 0.017, fill: "#1a1412" });
  out += el("circle", { cx: eye[0] + sz * 0.005, cy: eye[1] - sz * 0.005, r: sz * 0.005, fill: "#ffffff" });
  // Near ear, sticking out sideways with a pale lining
  out += el("path", { d: leafShape(earBase[0], earBase[1], earAngle, sz * 0.14, 0.45), fill: face });
  out += el("path", {
    d: leafShape(earBase[0], earBase[1], earAngle, sz * 0.1, 0.3),
    fill: "#f0b4b0",
    opacity: "0.6",
  });
  // A bell on a strap around the neck
  if (bell) {
    const c = qpt(n0, n1, poll, 0.42);
    const nl = Math.hypot(poll[0] - n0[0], poll[1] - n0[1]) || 1;
    const nx = -(poll[1] - n0[1]) / nl;
    const ny = (poll[0] - n0[0]) / nl;
    const half = sz * 0.11;
    const low: Point = [c[0] - nx * half, c[1] - ny * half];
    out += el("path", {
      d: s`M ${c[0] + nx * half} ${c[1] + ny * half} L ${low[0]} ${low[1]}`,
      stroke: "#6a4a32",
      "stroke-width": sz * 0.028,
      "stroke-linecap": "round",
    });
    const bw = sz * 0.06;
    const [lx, ly] = low[1] > c[1] ? low : [c[0] + nx * half, c[1] + ny * half];
    out += el("path", {
      d: s`M ${lx - bw * 0.4} ${ly} L ${lx + bw * 0.4} ${ly} L ${lx + bw * 0.6} ${ly + bw * 1.1}
           Q ${lx} ${ly + bw * 1.3} ${lx - bw * 0.6} ${ly + bw * 1.1} Z`,
      fill: "#e2b544",
    });
    out += el("circle", { cx: lx, cy: ly + bw * 1.2, r: bw * 0.18, fill: "#8a6a2a" });
  }
  out += "</g>";
  const features = andList([horns && "horns", bell && "a bell"]);
  note.alt(
    `A ${"patch" in coat ? "patched " : ""}cow${features ? ` with ${features}` : ""} ${grazing ? "grazing" : "standing"} in a pasture, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, eye[0]), eye[1]);
  // Head, ears and horns.
  const [x, y, fw, fh] = bounds(
    [
      at(-sz * 0.09, sz * 0.1),
      at(0, -sz * 0.09),
      at(hl + sz * 0.07, sz * 0.08),
      at(hl + sz * 0.07, -sz * 0.08),
      [
        earBase[0] + Math.cos((earAngle * Math.PI) / 180) * sz * 0.14,
        earBase[1] + Math.sin((earAngle * Math.PI) / 180) * sz * 0.14,
      ],
    ],
    sz * 0.03,
  );
  flipFrame(note, cx, dir, x, y, fw, fh);
  return out;
});
