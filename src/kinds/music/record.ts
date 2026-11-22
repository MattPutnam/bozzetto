import { defineKind, el, fill, hsl, type Point, type Rand, s } from "../../draw/core";
import { room } from "./shared";

/** Simple sleeve art in a square: a sun over stripes, bold blocks, or rings. No lettering. */
function sleeveArt(g: Rand, x: number, y: number, q: number): string {
  const hue = g.f(0, 360);
  const base = hsl(hue, g.f(30, 60), g.f(55, 75));
  const a = hsl(hue + g.f(120, 240), g.f(45, 70), g.f(40, 60));
  const b = hsl(hue + g.f(30, 90), g.f(40, 70), g.f(25, 45));
  const id = g.id(`art-${Math.round(x)}-${Math.round(y)}`); // one per sleeve, since a picture can show several
  const style = g.pick(["sun", "blocks", "rings"]);
  let art = el("rect", { x, y, width: q, height: q, fill: base });
  if (style === "sun") {
    art += el("circle", { cx: x + q * g.f(0.35, 0.65), cy: y + q * 0.55, r: q * g.f(0.2, 0.3), fill: a });
    for (let k = 0; k < 4; k++)
      art += el("rect", { x, y: y + q * (0.62 + k * 0.1), width: q, height: q * 0.05, fill: b });
  } else if (style === "blocks") {
    art += el("rect", {
      x: x + q * 0.12,
      y: y + q * 0.12,
      width: q * g.f(0.3, 0.5),
      height: q * g.f(0.4, 0.6),
      fill: a,
    });
    art += el("circle", { cx: x + q * 0.68, cy: y + q * 0.66, r: q * g.f(0.14, 0.22), fill: b });
    art += el("rect", { x: x + q * 0.12, y: y + q * 0.82, width: q * 0.4, height: q * 0.04, fill: b });
  } else {
    const cx = x + q * g.f(0.3, 0.7);
    const cy = y + q * g.f(0.3, 0.7);
    for (let k = 5; k > 0; k--) art += el("circle", { cx, cy, r: q * 0.14 * k, fill: k % 2 ? a : b });
  }
  return (
    el("defs", {}, el("clipPath", { id }, el("rect", { x, y, width: q, height: q }))) +
    el("g", { "clip-path": `url(#${id})` }, art)
  );
}

/** A vinyl record at (cx, cy) with radius r: grooves, a sheen and a center label. */
function vinyl(g: Rand, cx: number, cy: number, r: number): string {
  let out = el("circle", { cx, cy, r, fill: "#151416" });
  // Grooves, with a couple of brighter gaps between tracks
  let grooves = "";
  for (let k = 0; k < 9; k++)
    grooves += el("circle", {
      cx,
      cy,
      r: r * (0.42 + k * 0.065),
      fill: "none",
      stroke: "#fff",
      "stroke-opacity": "0.06",
      "stroke-width": r * 0.012,
    });
  out += grooves;
  for (const t of [g.f(0.55, 0.65), g.f(0.75, 0.85)])
    out += el("circle", {
      cx,
      cy,
      r: r * t,
      fill: "none",
      stroke: "#fff",
      "stroke-opacity": "0.14",
      "stroke-width": r * 0.008,
    });
  // Two wedges of reflected light
  const a = g.f(0, Math.PI);
  let sheen = "";
  for (const off of [0, Math.PI]) {
    const p = (t: number, rr: number) => s`${cx + Math.cos(a + off + t) * rr} ${cy + Math.sin(a + off + t) * rr}`;
    sheen += `M ${p(-0.25, r * 0.36)} L ${p(-0.25, r * 0.96)} A ${r * 0.96} ${r * 0.96} 0 0 1 ${p(0.25, r * 0.96)} L ${p(0.25, r * 0.36)} Z `;
  }
  out += el("path", { d: sheen, fill: "#fff", opacity: "0.07" });
  // The label: a color, a ring and a few lines where the print would be
  const label = hsl(g.f(0, 360), g.f(40, 75), g.f(45, 65));
  out += el("circle", { cx, cy, r: r * 0.34, fill: label });
  out += el("circle", {
    cx,
    cy,
    r: r * 0.28,
    fill: "none",
    stroke: "#fff",
    "stroke-opacity": "0.35",
    "stroke-width": r * 0.01,
  });
  out += el("path", {
    d: s`M ${cx - r * 0.14} ${cy - r * 0.15} h ${r * 0.28} M ${cx - r * 0.1} ${cy + r * 0.13} h ${r * 0.2} M ${cx - r * 0.07} ${cy + r * 0.19} h ${r * 0.14}`,
    stroke: "#fff",
    "stroke-opacity": "0.55",
    "stroke-width": r * 0.025,
    "stroke-linecap": "round",
  });
  out += el("circle", { cx, cy, r: r * 0.018, fill: "#d9dcdf" });
  return out;
}

/**
 * A vinyl record playing on a turntable seen from above, or sliding out of its sleeve on a shelf.
 *
 * @category Music
 */
export const record = /* @__PURE__ */ defineKind(
  "record",
  "Vinyl record",
  { scene: ["turntable", "sleeve"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const scene = g.option("scene", g.chance(0.6) ? "turntable" : "sleeve");
    if (scene === "sleeve") {
      const shelfY = h * g.f(0.78, 0.84);
      let out = room(g, w, h, shelfY);
      const q = Math.min(unit * 0.6, (w * 0.85) / 1.55, shelfY - h * 0.08) * g.f(0.92, 1);
      const pulled = q * g.f(0.3, 0.55);
      const r = q * 0.48;
      const sx = w / 2 - (q + pulled) / 2 + w * g.f(-0.04, 0.04);
      const sy = shelfY - q;
      const rcx = sx + q - r - q * 0.01 + pulled;
      const rcy = sy + q / 2;
      out += el("ellipse", {
        cx: sx + (q + pulled) / 2,
        cy: shelfY,
        rx: (q + pulled) * 0.55,
        ry: unit * 0.02,
        fill: "#000",
        opacity: "0.18",
      });
      // A second sleeve leaning behind, sometimes
      if (g.chance(0.5)) {
        const q2 = q * g.f(0.95, 1);
        const bx = sx - q * g.f(0.2, 0.3);
        out += `<g transform="${s`rotate(${g.f(4, 8)} ${bx + q2} ${shelfY})`}">${sleeveArt(g, bx, shelfY - q2, q2)}</g>`;
      }
      out += vinyl(g, rcx, rcy, r);
      out += sleeveArt(g, sx, sy, q);
      // The open edge of the sleeve casts a little shadow on the record
      out += el("rect", { x: sx + q, y: rcy - r, width: q * 0.015, height: r * 2, fill: "#000", opacity: "0.25" });
      out += el("rect", { x: sx, y: sy, width: q, height: q * 0.012, fill: "#fff", opacity: "0.3" });
      note.alt("A vinyl record sliding out of its sleeve on a shelf");
      note.focus(rcx, rcy);
      return out;
    }
    // A turntable from above, on a tabletop
    let out = fill(w, h, hsl(g.f(15, 40), g.f(20, 40), g.f(45, 65)));
    let grain = "";
    for (let k = 0; k < 7; k++) {
      const y = (h * (k + g.f(0, 1))) / 7;
      grain += s`M 0 ${y} C ${w * 0.3} ${y + unit * g.f(-0.03, 0.03)} ${w * 0.7} ${y + unit * g.f(-0.03, 0.03)} ${w} ${y} `;
    }
    out += el("path", {
      d: grain,
      stroke: "#000",
      "stroke-opacity": "0.06",
      "stroke-width": unit * 0.006,
      fill: "none",
    });
    const R = Math.min(h / 2.9, w / 3.1) * g.f(0.9, 1);
    const cx = w / 2 - R * 0.1 + w * g.f(-0.03, 0.03);
    const cy = h / 2;
    const plinth = g.pick(["#1f1f22", "#2b2b2b", hsl(g.f(20, 35), g.f(35, 50), g.f(30, 45)), "#d9dcdf", "#eee8da"]);
    const px = cx - R * 1.3;
    const py = cy - R * 1.3;
    // A second record's sleeve lying beside it on wide pictures
    if (w / h > 1.7) {
      const q = R * 2.2;
      const bx = px - q * 0.95;
      out += `<g transform="${s`rotate(${g.f(-12, 12)} ${bx + q / 2} ${cy})`}">${el("rect", { x: bx + R * 0.05, y: cy - q / 2 + R * 0.07, width: q, height: q, fill: "#000", opacity: "0.2" })}${sleeveArt(g, bx, cy - q / 2, q)}</g>`;
    }
    out += el("rect", {
      x: px + R * 0.05,
      y: py + R * 0.08,
      width: R * 2.8,
      height: R * 2.6,
      rx: R * 0.08,
      fill: "#000",
      opacity: "0.22",
    });
    out += el("rect", { x: px, y: py, width: R * 2.8, height: R * 2.6, rx: R * 0.08, fill: plinth });
    // Platter with a mat, then the record
    out += el("circle", { cx, cy, r: R * 1.06, fill: "#9a9ea4" });
    out += el("circle", { cx, cy, r: R * 1.03, fill: "#2a2a2d" });
    out += vinyl(g, cx, cy, R);
    // Start button and speed buttons in the near left corner
    out += el("rect", {
      x: px + R * 0.1,
      y: py + R * 2.28,
      width: R * 0.3,
      height: R * 0.2,
      rx: R * 0.03,
      fill: "#c9cdd2",
    });
    for (let k = 0; k < 2; k++)
      out += el("rect", {
        x: px + R * (0.5 + k * 0.2),
        y: py + R * 2.33,
        width: R * 0.14,
        height: R * 0.1,
        rx: R * 0.02,
        fill: "#8d9196",
      });
    // The tonearm: from its pivot in the far right corner to the stylus, either in the groove or on its rest
    const pivot: Point = [cx + R * 1.15, cy - R * 0.9];
    const armLen = R * 1.55;
    const playing = g.chance(0.75);
    let stylus: Point;
    if (playing) {
      // Where a circle of the arm's length round the pivot crosses the groove at radius rr
      const rr = R * g.f(0.5, 0.95);
      const dx = pivot[0] - cx;
      const dy = pivot[1] - cy;
      const d = Math.hypot(dx, dy);
      const along = (rr * rr - armLen * armLen + d * d) / (2 * d);
      const across = Math.sqrt(Math.max(0, rr * rr - along * along));
      const ux = dx / d;
      const uy = dy / d;
      // Take the crossing on the near side (below and left of the pivot line)
      const c1: Point = [cx + ux * along - uy * across, cy + uy * along + ux * across];
      const c2: Point = [cx + ux * along + uy * across, cy + uy * along - ux * across];
      stylus = c1[1] > c2[1] ? c1 : c2;
    } else stylus = [pivot[0], pivot[1] + armLen];
    const ang = Math.atan2(stylus[1] - pivot[1], stylus[0] - pivot[0]);
    const deg = (ang * 180) / Math.PI;
    const metal = "#c9cdd2";
    // Arm rest post
    out += el("circle", { cx: pivot[0], cy: pivot[1] + armLen * 0.72, r: R * 0.05, fill: "#8d9196" });
    // Pivot base and counterweight behind it
    out += el("circle", { cx: pivot[0], cy: pivot[1], r: R * 0.17, fill: "#8d9196" });
    out += el(
      "g",
      { transform: s`rotate(${deg} ${pivot[0]} ${pivot[1]})` },
      el("rect", {
        x: pivot[0] - R * 0.42,
        y: pivot[1] - R * 0.08,
        width: R * 0.2,
        height: R * 0.16,
        rx: R * 0.03,
        fill: "#3a3a3d",
      }),
      el("rect", {
        x: pivot[0] - R * 0.22,
        y: pivot[1] - R * 0.025,
        width: armLen * 0.86 + R * 0.22,
        height: R * 0.05,
        rx: R * 0.025,
        fill: metal,
      }),
      el("rect", {
        x: pivot[0] + armLen * 0.84,
        y: pivot[1] - R * 0.07,
        width: armLen * 0.18,
        height: R * 0.14,
        rx: R * 0.02,
        fill: "#2b2b2b",
      }),
      el("rect", {
        x: pivot[0] + armLen * 0.95,
        y: pivot[1] + R * 0.07,
        width: armLen * 0.06,
        height: R * 0.06,
        fill: metal,
      }),
    );
    out += el("circle", { cx: pivot[0], cy: pivot[1], r: R * 0.07, fill: metal });
    note.alt(playing ? "A vinyl record playing on a turntable" : "A vinyl record on a turntable with the arm at rest");
    note.focus(cx, cy);
    return out;
  },
);
