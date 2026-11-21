import { defineKind, el, fill, hsl, lin, mix, s } from "../../draw/core";
import { at, disc, hexHsl, layered, type Part, petal, stem, type View } from "./shared";

/** Dots on a disc in the sunflower spiral, as one path of round-capped specks. */
function spiral(v: View, b: number, r: number, count: number, size: number, paint: string, from = 0): string {
  let d = "";
  for (let k = Math.round(count * from); k < count; k++) {
    const p = at(v, k * 2.39996, [r * Math.sqrt((k + 0.5) / count), b, 0]);
    d += s`M${p[0]} ${p[1]}h.1`;
  }
  return el("path", { d, stroke: paint, "stroke-width": size, "stroke-linecap": "round" });
}

/** A sacred lotus held above the water among round leaves, sometimes with a bud. */
export const lotus = /* @__PURE__ */ defineKind("lotus", "Lotus", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const water = g.id("water");
  const petalId = g.id("petal");
  const backId = g.id("back");
  const waterHue = g.f(160, 200);
  const white = g.chance(0.2);
  const hue = g.f(328, 345);
  const tipColor = white ? hsl(hue, 40, 92) : hsl(hue, g.f(60, 75), g.f(62, 70));
  const baseColor = white ? "#fdfcf6" : hsl(hue, 45, 93);
  let out = el(
    "defs",
    {},
    lin(water, [hsl(waterHue, 35, g.f(40, 48)), hsl(waterHue + 10, 40, g.f(24, 32))]),
    lin(petalId, [tipColor, baseColor]),
    lin(backId, white ? [hsl(hue, 25, 84), hsl(hue, 15, 80)] : [hsl(hue, 60, 56), hsl(hue, 40, 80)]),
  );
  out += fill(w, h, `url(#${water})`);
  // Glints and soft light on the water
  for (let k = g.i(5, 8); k > 0; k--)
    out += el("ellipse", {
      cx: g.f(0, w),
      cy: g.f(0, h),
      rx: unit * g.f(0.1, 0.3),
      ry: unit * g.f(0.015, 0.04),
      fill: "#ffffff",
      opacity: g.f(0.06, 0.14).toFixed(2),
    });
  const leafGreen = hexHsl(g.f(95, 125), g.f(35, 50), g.f(34, 42));
  const R = unit * g.f(0.4, 0.46);
  const v: View = {
    x: w / 2 + unit * g.f(-0.08, 0.08),
    y: Math.max(h * 0.56, R * 0.95 + unit * 0.04),
    tilt: g.f(0.3, 0.5),
    roll: g.f(-0.12, 0.12),
  };
  const surface = Math.min(h - unit * 0.06, v.y + R * g.f(0.45, 0.6));
  // A round leaf lying on the water, with a notch and veins.
  const pad = (cx: number, cy: number, r: number) => {
    const squash = 0.32;
    const notch = g.f(0, Math.PI * 2);
    const gap = 0.18;
    const a = [cx + Math.cos(notch + gap) * r, cy + Math.sin(notch + gap) * r * squash];
    const b = [cx + Math.cos(notch - gap) * r, cy + Math.sin(notch - gap) * r * squash];
    let veins = "";
    for (let k = 1; k < 9; k++) {
      const angle = notch + gap + (k / 9) * (Math.PI * 2 - gap * 2);
      veins += s`M${cx} ${cy}L${cx + Math.cos(angle) * r * 0.9} ${cy + Math.sin(angle) * r * squash * 0.9}`;
    }
    return (
      el("ellipse", { cx, cy: cy + r * 0.04, rx: r * 1.02, ry: r * squash, fill: "#000", opacity: "0.15" }) +
      el("path", { d: s`M${cx} ${cy}L${a[0]} ${a[1]}A${r} ${r * squash} 0 1 1 ${b[0]} ${b[1]}Z`, fill: leafGreen }) +
      el("path", { d: veins, stroke: mix(leafGreen, "#ffffff", 0.2), "stroke-width": r * 0.015, fill: "none" })
    );
  };
  // Leaves behind the flower
  const pads = g.i(1, 2) + (w > h * 1.6 ? 1 : 0);
  for (let k = 0; k < pads; k++) {
    const side = k % 2 ? -1 : 1;
    out += pad(
      v.x + side * unit * g.f(0.35, 0.6) * (k > 1 ? 1.8 : 1),
      surface - unit * g.f(0.05, 0.15),
      unit * g.f(0.2, 0.28),
    );
  }
  // A bud on its own stem
  const bud = g.chance(0.55);
  const budSide = g.chance(0.5) ? -1 : 1;
  if (bud) {
    const bx = Math.max(unit * 0.1, Math.min(w - unit * 0.1, v.x + budSide * (R + unit * g.f(0.12, 0.2))));
    const by = Math.max(unit * 0.16, v.y - R * g.f(0.3, 0.6));
    const bh = unit * g.f(0.12, 0.15);
    out += stem(
      bx,
      by,
      bx - budSide * unit * 0.02,
      surface + unit * 0.02,
      budSide * unit * 0.02,
      unit * 0.014,
      leafGreen,
    );
    out += el("path", {
      d: s`M${bx} ${by}C${bx - bh * 0.55} ${by - bh * 0.3} ${bx - bh * 0.25} ${by - bh * 0.85} ${bx} ${by - bh * 1.05}C${bx + bh * 0.25} ${by - bh * 0.85} ${bx + bh * 0.55} ${by - bh * 0.3} ${bx} ${by}Z`,
      fill: `url(#${petalId})`,
    });
    out += el("path", {
      d: s`M${bx} ${by}C${bx - bh * 0.15} ${by - bh * 0.4} ${bx - bh * 0.05} ${by - bh * 0.8} ${bx} ${by - bh * 1.05}`,
      stroke: "#000",
      "stroke-opacity": "0.1",
      "stroke-width": bh * 0.03,
      fill: "none",
    });
    out += el("ellipse", {
      cx: bx - budSide * unit * 0.02,
      cy: surface + unit * 0.02,
      rx: unit * 0.05,
      ry: unit * 0.012,
      fill: "#ffffff",
      opacity: "0.18",
    });
  }
  // The flower's stem and the ripple where it meets the water
  out += stem(v.x, v.y, v.x + unit * g.f(-0.02, 0.02), surface, 0, unit * 0.018, leafGreen);
  out += el("ellipse", {
    cx: v.x,
    cy: surface,
    rx: unit * 0.07,
    ry: unit * 0.016,
    fill: "none",
    stroke: "#ffffff",
    "stroke-width": unit * 0.005,
    opacity: "0.3",
  });
  // Three layers of pointed petals, the outer ones opening widest.
  const layers = [
    { count: 8, len: 1, lift: 0.5, shade: "out" },
    { count: 6, len: 0.9, lift: 0.95, shade: "mid" },
    { count: 5, len: 0.75, lift: 1.25, shade: "in" },
  ];
  const parts: (Part & { paint: string })[] = [];
  let turn = g.f(0, Math.PI);
  for (const layer of layers) {
    turn += Math.PI / layer.count;
    for (let k = 0; k < layer.count; k++) {
      const part = petal(v, turn + (k * Math.PI * 2) / layer.count + g.f(-0.08, 0.08), {
        from: R * 0.08,
        len: R * layer.len * g.f(0.93, 1.05),
        wid: R * layer.len * 0.72,
        lift: layer.lift + g.f(-0.08, 0.08),
        cup: 0.12,
        bend: 0.06,
        tip: 0.1,
      });
      parts.push({ ...part, paint: `url(#${part.lean > 0 ? petalId : backId})` });
    }
  }
  // The seed pod: a flat-topped cone ringed with stamens.
  const podR = R * 0.17;
  let stamens = "";
  for (let k = 0; k < 30; k++) {
    const theta = (k / 30) * Math.PI * 2;
    const a = at(v, theta, [podR * 0.9, R * 0.2, 0]);
    const b = at(v, theta, [podR * 1.5, R * 0.3, 0]);
    stamens += s`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
  }
  const middle =
    el("path", { d: stamens, stroke: "#f0c64a", "stroke-width": R * 0.02, "stroke-linecap": "round" }) +
    disc(v, R * 0.24, podR, "#d9c45a") +
    spiral(v, R * 0.245, podR * 0.75, 9, podR * 0.18, "#a99436");
  out += layered(parts, middle, unit);
  // A near leaf in front, low in the picture.
  if (g.chance(0.6)) {
    const side = budSide * -1;
    out += pad(
      v.x + side * unit * g.f(0.3, 0.45),
      Math.min(h - unit * 0.02, surface + unit * g.f(0.06, 0.12)),
      unit * g.f(0.18, 0.24),
    );
  }
  note.alt(`A lotus flower${bud ? " and a bud" : ""} above the water among round leaves`);
  note.focus(v.x, v.y - R * 0.3);
  return out;
});
