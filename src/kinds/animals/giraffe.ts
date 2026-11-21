import { defineKind, el, facing, hsl, mix, type Point, pts, qpt, s } from "../../draw/core";
import { acacia, flipFrame, flipX, limb, savanna, tube } from "./shared";

const GIRAFFES = [
  { base: "#f0d39a", spot: "#a0592a" },
  { base: "#ecc98a", spot: "#7a4424" },
  { base: "#f4dcae", spot: "#b8722f" },
  { base: "#e8c690", spot: "#8a4f2e" },
] as const;

/** A giraffe on the savanna, side on, sometimes browsing an acacia. */
export const giraffe = /* @__PURE__ */ defineKind("giraffe", "Giraffe", (g, w, h, note) => {
  const coat = g.pick(GIRAFFES);
  const far = mix(coat.base, "#000000", 0.15);
  const dir = g.pick([-1, 1]);
  const tall = Math.min(h * 0.84, w * 1.15) * g.f(0.9, 1);
  const hz = h * g.f(0.6, 0.7);
  const gy = h * g.f(0.92, 0.95);
  const cx = w / 2 - dir * tall * 0.1 + w * g.f(-0.03, 0.03);
  const lean = (g.f(8, 30) * Math.PI) / 180;
  const legLen = tall * 0.4;
  const lw = tall * 0.045;
  const cy = gy - legLen - tall * 0.05;
  const n0: Point = [cx + tall * 0.15, cy - tall * 0.05];
  const nl = tall * 0.4;
  const n2: Point = [n0[0] + nl * Math.sin(lean), n0[1] - nl * Math.cos(lean)];
  const n1: Point = [(n0[0] + n2[0]) / 2 - nl * 0.04, (n0[1] + n2[1]) / 2];
  const browsing = g.chance(0.4);
  const stride = g.chance(0.5) ? tall * g.f(0.03, 0.05) : 0;
  const dusk = g.chance(0.3);
  let out = savanna(g.fork("scene"), w, h, hz, dusk);
  // Shadow
  out += el("ellipse", {
    cx: cx + dir * tall * 0.02,
    cy: gy,
    rx: tall * 0.3,
    ry: tall * 0.025,
    fill: "#000",
    opacity: "0.15",
  });
  out += facing(cx, dir);
  // An acacia it browses from, its crown at the height of the giraffe's head
  if (browsing) {
    const crownY = n2[1] + tall * 0.03;
    const treeBase = gy - tall * 0.04;
    out += acacia(n2[0] + tall * 0.22, treeBase, (treeBase - crownY) / 0.9, hsl(g.f(80, 110), 32, 40));
  }
  // Legs: far ones first and darker, all under the body
  const back = cx - tall * 0.14;
  const front = cx + tall * 0.13;
  const hoof = (x: number, foot: number, paint: string) => limb(x, foot - tall * 0.03, x, foot, lw, paint);
  out +=
    limb(back + lw, cy, back + lw - stride, gy - tall * 0.01, lw * 0.95, far) +
    hoof(back + lw - stride, gy - tall * 0.01, "#3a2a22");
  out +=
    limb(front + lw, cy, front + lw + stride, gy - tall * 0.01, lw * 0.95, far) +
    hoof(front + lw + stride, gy - tall * 0.01, "#3a2a22");
  out += limb(back, cy, back + stride, gy, lw, coat.base) + hoof(back + stride, gy, "#3a2a22");
  out += limb(front, cy, front - stride, gy, lw, coat.base) + hoof(front - stride, gy, "#3a2a22");
  // Tail with a tuft
  const tailEnd: Point = [cx - tall * 0.235, cy + tall * 0.17];
  out += el("path", {
    d: s`M ${cx - tall * 0.21} ${cy - tall * 0.03} Q ${cx - tall * 0.24} ${cy + tall * 0.05} ${tailEnd[0]} ${tailEnd[1]}`,
    stroke: coat.base,
    "stroke-width": tall * 0.012,
    fill: "none",
  });
  out += el("ellipse", {
    cx: tailEnd[0],
    cy: tailEnd[1] + tall * 0.02,
    rx: tall * 0.01,
    ry: tall * 0.025,
    fill: "#3a2a22",
  });
  // Mane, showing along the back of the neck
  out += el("path", {
    d: tube(
      [n0[0] - tall * 0.03, n0[1]],
      [n1[0] - tall * 0.022, n1[1]],
      [n2[0] - tall * 0.018, n2[1] + tall * 0.01],
      tall * 0.1,
      tall * 0.05,
    ),
    fill: coat.spot,
  });
  // Body and neck, with patches clipped to them
  const body = el("ellipse", { cx, cy, rx: tall * 0.22, ry: tall * 0.1, transform: s`rotate(-10 ${cx} ${cy})` });
  const neck = el("path", { d: tube(n0, n1, n2, tall * 0.11, tall * 0.05) });
  const clip = g.id("hide");
  out += el("defs", {}, el("clipPath", { id: clip }, body, neck));
  out += el("rect", {
    x: cx - tall * 0.25,
    y: n2[1] - tall * 0.05,
    width: tall * 0.6,
    height: cy - n2[1] + tall * 0.2,
    fill: coat.base,
    "clip-path": `url(#${clip})`,
  });
  // Patches on a jittered grid, kept to the body and neck
  const step = tall * g.f(0.05, 0.065);
  const centre: Point[] = [];
  for (let k = 0; k <= 10; k++) centre.push(qpt(n0, n1, n2, k / 10));
  let patches = "";
  for (let y = n2[1] - step; y < cy + tall * 0.12; y += step * 0.95)
    for (let x = cx - tall * 0.24; x < n2[0] + step; x += step) {
      const px = x + step * g.f(-0.2, 0.2) + (Math.round(y / step) % 2) * step * 0.5;
      const py = y + step * g.f(-0.2, 0.2);
      const inBody = ((px - cx) / (tall * 0.24)) ** 2 + ((py - cy) / (tall * 0.12)) ** 2 < 1;
      const nearNeck = centre.some(([nx, ny]) => Math.hypot(px - nx, py - ny) < tall * 0.07);
      if (!inBody && !nearNeck) continue;
      const r = step * 0.42 * g.f(0.85, 1.1);
      const ring: Point[] = [];
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI * 2 + g.f(-0.3, 0.3);
        ring.push([px + Math.cos(a) * r * g.f(0.75, 1.15), py + Math.sin(a) * r * g.f(0.75, 1.15)]);
      }
      patches += `M${pts(ring).replace(/ /g, "L")}Z`;
    }
  out += el("path", {
    d: patches,
    fill: coat.spot,
    stroke: coat.spot,
    "stroke-width": step * 0.12,
    "stroke-linejoin": "round",
    "clip-path": `url(#${clip})`,
  });
  // Head, pointing down and forward
  const hc: Point = [n2[0] + tall * 0.05, n2[1] + tall * 0.02];
  // Horns with dark knobs
  for (const k of [-1, 1]) {
    const bx = n2[0] - tall * 0.008 + k * tall * 0.012;
    out += limb(bx, n2[1] - tall * 0.01, bx - tall * 0.01, n2[1] - tall * 0.06, tall * 0.012, coat.base);
    out += el("circle", { cx: bx - tall * 0.01, cy: n2[1] - tall * 0.062, r: tall * 0.011, fill: coat.spot });
  }
  // Ear
  out += el("ellipse", {
    cx: n2[0] - tall * 0.03,
    cy: n2[1] - tall * 0.01,
    rx: tall * 0.03,
    ry: tall * 0.011,
    fill: coat.base,
    transform: s`rotate(-25 ${n2[0] - tall * 0.01} ${n2[1]})`,
  });
  out += el("ellipse", {
    cx: hc[0],
    cy: hc[1],
    rx: tall * 0.075,
    ry: tall * 0.034,
    fill: coat.base,
    transform: s`rotate(30 ${hc[0]} ${hc[1]})`,
  });
  // Darker muzzle, nostril and eye
  const snout: Point = [hc[0] + tall * 0.05, hc[1] + tall * 0.03];
  out += el("circle", { cx: snout[0], cy: snout[1], r: tall * 0.026, fill: mix(coat.base, coat.spot, 0.35) });
  out += el("circle", { cx: snout[0] + tall * 0.006, cy: snout[1] - tall * 0.004, r: tall * 0.005, fill: "#3a2a22" });
  out += el("circle", { cx: n2[0] + tall * 0.035, cy: n2[1] + tall * 0.002, r: tall * 0.008, fill: "#2a1e18" });
  out += "</g>";
  note.alt(
    `A giraffe ${browsing ? "browsing the top of an acacia" : "on the savanna"}${dusk ? " at dusk" : ""}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, n2[0] + tall * 0.035), n2[1]);
  // Head and horns.
  flipFrame(note, cx, dir, n2[0] - tall * 0.08, n2[1] - tall * 0.105, tall * 0.23, tall * 0.22);
  return out;
});
