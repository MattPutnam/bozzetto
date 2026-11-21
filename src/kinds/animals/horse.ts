import { defineKind, el, facing, mix, type Point, pts, qpt, s } from "../../draw/core";
import { atLeast, blob } from "../../draw/shapes";
import { bounds, fence, field, flipFrame, flipX, headAxis, hoofLeg, leafShape, meadowFlowers, tube } from "./shared";

/** Path data for a circle, so many small ones can share one path. */
const dot = (x: number, y: number, r: number): string =>
  s`M ${x - r} ${y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 `;

const HORSES = [
  { coat: "#8b4a26", mane: "#231a16", points: "#2a1d17" },
  { coat: "#b45f2c", mane: "#8f431c" },
  { coat: "#a8562a", mane: "#ecd7a6" },
  { coat: "#bdbab5", mane: "#77726f", dapple: "#dedbd6" },
  { coat: "#2c2725", mane: "#151211" },
  { coat: "#d8a85c", mane: "#f5ebd3" },
  { coat: "#7d4a2b", mane: "#2a1d17", patch: "#f5f0e8" },
] as const;

/** A horse side on in a paddock or meadow, standing, walking or grazing, with a flowing mane and tail. */
export const horse = /* @__PURE__ */ defineKind("horse", "Horse", (g, w, h, note) => {
  const coat = g.pick(HORSES);
  const dir = g.pick([-1, 1]);
  const sz = Math.min(h * 0.64, w * 0.5) * g.f(0.9, 1);
  const hz = h * g.f(0.48, 0.58);
  const gy = h * g.f(0.86, 0.91);
  const grazing = g.chance(0.35);
  const walking = !grazing && g.chance(0.45);
  const brx = sz * 0.36;
  const bry = sz * 0.15;
  const legLen = sz * 0.42;
  const cy = gy - legLen - bry * 0.75;
  const cx = w / 2 - dir * sz * 0.08 + w * g.f(-0.03, 0.03);
  const far = mix(coat.coat, "#000000", 0.2);
  const hoofPaint = "#3b322d";
  // Neck from the shoulders up to the poll, then the head
  const n0: Point = [cx + brx * 0.58, cy + bry * 0.1];
  const a = grazing ? g.f(10, 25) : g.f(40, 58);
  const hl = sz * 0.24;
  const poll: Point = grazing
    ? [cx + brx * 1.42, gy - sz * 0.03 - hl * Math.cos((a * Math.PI) / 180)]
    : [cx + brx * 1.1 + sz * 0.04, cy - sz * g.f(0.36, 0.42)];
  const n1: Point = grazing ? [cx + brx * 1.2, cy - bry * 0.5] : [cx + brx * 0.9, cy - sz * 0.22];
  const at = headAxis(poll, a);
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(190, 215), [scene.f(80, 115), 40, scene.f(50, 58)]);
  const fenced = scene.chance(0.6);
  if (fenced) out += fence(w, hz + (gy - hz) * 0.2, Math.min(w, h) * 0.12, scene.pick(["#a07a54", "#efe9df"]));
  out += meadowFlowers(scene, w, h, hz, Math.min(w, h));
  // Shadow
  out += el("ellipse", {
    cx: cx + dir * sz * 0.08,
    cy: gy,
    rx: sz * 0.55,
    ry: sz * 0.04,
    fill: "#000",
    opacity: "0.15",
  });
  out += facing(cx, dir);
  const fx = cx + brx * 0.55;
  const bx = cx - brx * 0.6;
  const ty = cy + bry * 0.3;
  const hoofLen = sz * 0.035;
  const socks = !("points" in coat) && g.chance(0.35);
  const sock = "points" in coat ? coat.points : socks ? "#f5f0e8" : "";
  const sockLen = "points" in coat ? 1 : 0.55;
  const front = (x: number, paint: string, lift: boolean, up: number) =>
    lift
      ? hoofLeg(
          [x, ty],
          [x + sz * 0.07, gy - legLen * 0.52],
          [x + sz * 0.02, gy - legLen * 0.2],
          sz * 0.085,
          sz * 0.042,
          paint,
          hoofPaint,
          hoofLen,
          sock,
          sockLen,
        )
      : hoofLeg(
          [x, ty],
          [x + sz * 0.005, gy - legLen * 0.42 - up],
          [x, gy - hoofLen - up],
          sz * 0.085,
          sz * 0.042,
          paint,
          hoofPaint,
          hoofLen,
          sock,
          sockLen,
        );
  const hind = (x: number, paint: string, reach: number, up: number) =>
    hoofLeg(
      [x, ty - bry * 0.2],
      [x - sz * 0.04 - reach * 0.5, gy - legLen * 0.38 - up],
      [x - sz * 0.012 - reach, gy - hoofLen - up],
      sz * 0.11,
      sz * 0.042,
      paint,
      hoofPaint,
      hoofLen,
      sock,
      sockLen,
    );
  // Far legs, a step behind and darker
  out += hind(bx + sz * 0.04, far, walking ? sz * 0.07 : 0, sz * 0.012);
  out += front(fx + sz * 0.04, far, false, sz * 0.012);
  // Tail, in two overlapping locks
  const swish = g.f(-0.04, 0.06) * sz;
  const tailTop: Point = [cx - brx * 0.95, cy - bry * 0.6];
  const tailEnd: Point = [cx - brx * 1.16 - swish, cy + bry + legLen * g.f(0.45, 0.65)];
  out += el("path", {
    d:
      tube(tailTop, [cx - brx * 1.3, cy - bry * 0.1], tailEnd, sz * 0.045, sz * 0.06, 6) +
      tube(tailTop, [cx - brx * 1.18, cy], [tailEnd[0] + sz * 0.035, tailEnd[1] - sz * 0.03], sz * 0.04, sz * 0.05, 6),
    fill: coat.mane,
  });
  // Body: rump, barrel and chest
  const body =
    el("ellipse", { cx: cx - brx * 0.55, cy: cy - bry * 0.08, rx: brx * 0.5, ry: bry * 1.05 }) +
    el("ellipse", { cx, cy, rx: brx, ry: bry }) +
    el("ellipse", { cx: cx + brx * 0.6, cy: cy - bry * 0.05, rx: brx * 0.45, ry: bry });
  const neck = el("path", { d: tube(n0, n1, poll, sz * 0.3, sz * 0.16, 6) });
  out += el("g", { fill: coat.coat }, body, neck);
  // Pinto patches or dapples, clipped to the body and neck
  if ("patch" in coat || "dapple" in coat) {
    const clip = g.id("hide");
    const m = g.fork("marks");
    let marks = "";
    if ("patch" in coat)
      for (let k = m.i(3, 5); k > 0; k--)
        marks += el("path", {
          d: blob(
            m,
            cx + brx * m.f(-1, 1.2),
            cy + bry * m.f(-1.4, 0.8),
            sz * m.f(0.08, 0.14),
            sz * m.f(0.07, 0.11),
            2,
            0.2,
          ),
          fill: coat.patch,
        });
    else {
      let d = "";
      for (let k = m.i(14, 22); k > 0; k--)
        d += dot(cx + brx * m.f(-1, 0.9), cy + bry * m.f(-0.9, 0.6), sz * m.f(0.018, 0.03));
      marks = el("path", { d, fill: coat.dapple, opacity: "0.7" });
    }
    out += el("defs", {}, el("clipPath", { id: clip }, body, neck));
    out += el("g", { "clip-path": `url(#${clip})` }, marks);
  }
  // Near legs
  out += hind(bx, coat.coat, 0, 0);
  out += front(fx, coat.coat, walking, 0);
  // Mane along the crest of the neck
  const cl = Math.hypot(poll[0] - n0[0], poll[1] - n0[1]) || 1;
  const nb: Point = [(poll[1] - n0[1]) / cl, -(poll[0] - n0[0]) / cl];
  const crest = (p: Point, off: number): Point => [p[0] + nb[0] * off, p[1] + nb[1] * off];
  out += el("path", {
    d: tube(
      crest(qpt(n0, n1, poll, 0.25), sz * 0.11),
      crest(n1, sz * 0.1),
      crest(poll, sz * 0.065),
      sz * 0.065,
      sz * 0.055,
      6,
    ),
    fill: coat.mane,
  });
  // Far ear, then the head and cheek
  const ear = (t: number, k: number, paint: string) =>
    el("polygon", {
      points: pts([
        at(sz * 0.01 + t, sz * 0.032 + k),
        at(-sz * 0.095 + t, sz * 0.07 + k),
        at(sz * 0.025 + t, -sz * 0.012 + k),
      ]),
      fill: paint,
    });
  out += ear(-sz * 0.008, -sz * 0.016, far);
  out += el("path", { d: tube(poll, at(hl * 0.5, 0), at(hl, 0), sz * 0.13, sz * 0.09, 2), fill: coat.coat });
  const cheek = at(hl * 0.25, -sz * 0.015);
  out += el("circle", { cx: cheek[0], cy: cheek[1], r: sz * 0.068, fill: coat.coat });
  // A blaze or a star on the face
  const marking = g.pick(["none", "none", "blaze", "star"]);
  if (marking === "blaze")
    out += el("path", {
      d: tube(
        at(hl * 0.12, sz * 0.042),
        at(hl * 0.55, sz * 0.042),
        at(hl * 0.96, sz * 0.03),
        sz * 0.025,
        sz * 0.035,
        2,
      ),
      fill: "#f5f0e8",
    });
  if (marking === "star") {
    const star = at(hl * 0.18, sz * 0.04);
    out += el("circle", { cx: star[0], cy: star[1], r: sz * 0.016, fill: "#f5f0e8" });
  }
  // Soft muzzle, nostril and mouth
  const muzzle = at(hl * 0.98, 0);
  out += el("circle", { cx: muzzle[0], cy: muzzle[1], r: sz * 0.045, fill: "#000", opacity: "0.12" });
  const nostril = at(hl * 0.9, sz * 0.018);
  out += el("circle", { cx: nostril[0], cy: nostril[1], r: sz * 0.011, fill: "#000", opacity: "0.45" });
  const m0 = at(hl * 0.86, -sz * 0.03);
  const m1 = at(hl * 1.02, -sz * 0.03);
  out += el("path", {
    d: s`M ${m0[0]} ${m0[1]} L ${m1[0]} ${m1[1]}`,
    stroke: "#000",
    "stroke-opacity": "0.35",
    "stroke-width": sz * 0.008,
    "stroke-linecap": "round",
  });
  // Eye with a highlight
  const eye = at(hl * 0.3, sz * 0.022);
  out += el("circle", { cx: eye[0], cy: eye[1], r: sz * 0.016, fill: "#1a1412" });
  out += el("circle", { cx: eye[0] + sz * 0.005, cy: eye[1] - sz * 0.005, r: sz * 0.005, fill: "#ffffff" });
  // Near ear and forelock
  out += ear(0, 0, coat.coat);
  const fl0 = at(-sz * 0.005, sz * 0.035);
  const fl1 = at(sz * 0.06, sz * 0.05);
  const flAngle = (Math.atan2(fl1[1] - fl0[1], fl1[0] - fl0[0]) * 180) / Math.PI;
  out += el("path", { d: leafShape(fl0[0], fl0[1], flAngle, sz * 0.075, 0.3), fill: coat.mane });
  out += "</g>";
  const pose = grazing ? "grazing" : walking ? "walking" : "standing";
  const kind = "patch" in coat ? "A pinto horse" : "dapple" in coat ? "A dappled horse" : "A horse";
  note.alt(
    `${kind}${marking === "blaze" ? " with a blaze" : ""} ${pose} in a ${fenced ? "paddock" : "meadow"}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, eye[0]), eye[1]);
  // Head and ears, grown to a size an avatar can crop when the horse is small.
  const [x, y, fw, fh] = atLeast(
    bounds(
      [at(-sz * 0.095, sz * 0.07), at(0, sz * 0.06), at(0, -sz * 0.06), at(hl, sz * 0.05), at(hl, -sz * 0.05)],
      sz * 0.04,
    ),
    Math.min(w, h) * 0.26,
  );
  flipFrame(note, cx, dir, x, y, fw, fh);
  return out;
});
