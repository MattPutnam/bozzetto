import { defineKind, el, facing, mix, type Point, pts, s } from "../../draw/core";
import { fence, field, flipFrame, flipX } from "./shared";

const PIGS = [
  { skin: "#f4b4b0", snout: "#f9cdc9", ear: "#e89590", name: "pig" },
  { skin: "#f0a6a6", snout: "#f7c3c2", ear: "#e08888", name: "pig" },
  { skin: "#f5c3b6", snout: "#f9d8cf", ear: "#e3a090", name: "spotted pig", spots: "#3b3133" },
  { skin: "#2f2a2c", snout: "#5c4c50", ear: "#221e20", name: "saddleback pig", belt: "#f2ebe4" },
  { skin: "#d8854c", snout: "#eaa678", ear: "#bc6c38", name: "pig" },
] as const;

/**
 * A pig in a farmyard, side on with a curly tail, sometimes standing in a mud puddle.
 *
 * @category Animals
 */
export const pig = /* @__PURE__ */ defineKind("pig", "Pig", (g, w, h, note) => {
  const coat = g.pick(PIGS);
  const dir = g.pick([-1, 1]);
  const size = Math.min(w, h);
  const bw = size * g.f(0.22, 0.26);
  const bh = bw * g.f(0.6, 0.66);
  const hz = h * g.f(0.5, 0.6);
  const gy = h * g.f(0.82, 0.88);
  const cx = w / 2 - dir * bw * 0.2 + w * g.f(-0.04, 0.04);
  const cy = gy - bw * 0.42 - bh * 0.8;
  const hr = bw * 0.4;
  const hx = cx + bw * 0.8;
  const hy = cy - bh * g.f(0.05, 0.3);
  const floppy = g.chance(0.4);
  const mud = g.chance(0.45);
  const far = mix(coat.skin, "#000000", 0.15);
  const scene = g.fork("scene");
  let out = field(scene, w, h, hz, scene.f(190, 215), [scene.f(70, 110), 38, scene.f(52, 60)]);
  if (scene.chance(0.5)) out += fence(w, hz + (gy - hz) * 0.2, size * 0.12, "#9a7650");
  if (mud) {
    // Mud puddle under its feet
    out += el("ellipse", { cx, cy: gy - bw * 0.02, rx: bw * 1.5, ry: bw * 0.2, fill: "#7a5a3c" });
    out += el("ellipse", {
      cx: cx - bw * 0.6,
      cy: gy + bw * 0.04,
      rx: bw * 0.3,
      ry: bw * 0.04,
      fill: "#ffffff",
      opacity: "0.2",
    });
  } else
    out += el("ellipse", {
      cx: cx + dir * bw * 0.15,
      cy: gy,
      rx: bw * 1.2,
      ry: bw * 0.1,
      fill: "#000",
      opacity: "0.15",
    });
  out += facing(cx, dir);
  const lw = bw * 0.17;
  const leg = (x: number, foot: number, paint: string) =>
    el("rect", { x: x - lw / 2, y: cy, width: lw, height: foot - cy, rx: lw * 0.35, fill: paint }) +
    el("rect", {
      x: x - lw / 2,
      y: foot - (mud ? bw * 0.12 : lw * 0.4),
      width: lw,
      height: mud ? bw * 0.12 : lw * 0.4,
      rx: lw * 0.3,
      fill: mud ? "#6a4a30" : "#3a2c2a",
      opacity: mud ? "0.9" : "0.6",
    });
  const front = "belt" in coat ? coat.belt : coat.skin;
  // Far legs
  out += leg(cx - bw * 0.5, gy - bw * 0.03, far) + leg(cx + bw * 0.5, gy - bw * 0.03, mix(front, "#000000", 0.15));
  // Near legs
  out += leg(cx - bw * 0.62, gy, coat.skin) + leg(cx + bw * 0.38, gy, front);
  // Curly tail
  const tx = cx - bw * 0.97;
  const ty = cy - bh * 0.25;
  const t = bw * 0.13;
  out += el("path", {
    d: s`M ${tx + t * 0.3} ${ty} C ${tx - t * 1.2} ${ty - t * 0.6} ${tx - t * 1.2} ${ty + t * 0.6} ${tx - t * 0.5} ${ty + t * 0.1}
         C ${tx - t * 0.1} ${ty - t * 0.3} ${tx - t * 0.8} ${ty - t * 0.9} ${tx - t * 1.3} ${ty - t * 0.3}`,
    stroke: coat.skin,
    "stroke-width": bw * 0.04,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Far ear, behind the head
  const earTip: Point = floppy ? [hx + hr * 0.85, hy - hr * 0.35] : [hx + hr * 0.55, hy - hr * 1.55];
  out += el("polygon", {
    points: pts([
      [hx - hr * 0.7, hy - hr * 0.7],
      [earTip[0] - hr * 0.3, earTip[1] - hr * 0.05],
      [hx - hr * 0.05, hy - hr * 0.98],
    ]),
    fill: mix(coat.ear, "#000000", 0.15),
  });
  // Body and head
  const body = el("ellipse", { cx, cy, rx: bw, ry: bh });
  const head = el("circle", { cx: hx, cy: hy, r: hr });
  out += el("g", { fill: coat.skin }, body, head);
  // Spots or a pale belt, clipped to the body
  if ("spots" in coat || "belt" in coat) {
    const clip = g.id("hide");
    const m = g.fork("marks");
    let marks = "";
    if ("belt" in coat)
      marks = el("rect", { x: cx + bw * 0.15, y: cy - bh, width: bw * 0.36, height: bh * 2, fill: coat.belt });
    else
      for (let k = m.i(3, 5); k > 0; k--) {
        const r = bw * m.f(0.12, 0.22);
        marks += el("ellipse", {
          cx: cx + bw * m.f(-0.85, 0.5),
          cy: cy + bh * m.f(-0.7, 0.6),
          rx: r,
          ry: r * 0.75,
          fill: coat.spots,
        });
      }
    out += el("defs", {}, el("clipPath", { id: clip }, body, head));
    out += el("g", { "clip-path": `url(#${clip})` }, marks);
  }
  // A soft crease behind the cheek
  out += el("path", {
    d: s`M ${hx - hr * 0.3} ${hy - hr * 0.8} Q ${hx - hr * 0.75} ${hy} ${hx - hr * 0.25} ${hy + hr * 0.85}`,
    stroke: "#000",
    "stroke-opacity": "0.1",
    "stroke-width": hr * 0.08,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Snout and nostrils
  out += el("ellipse", { cx: hx + hr * 0.92, cy: hy + hr * 0.12, rx: hr * 0.2, ry: hr * 0.3, fill: coat.snout });
  for (const k of [0, 1])
    out += el("ellipse", {
      cx: hx + hr * 0.98,
      cy: hy + hr * (0.02 + k * 0.2),
      rx: hr * 0.045,
      ry: hr * 0.065,
      fill: "#000",
      opacity: "0.45",
    });
  // Eye, cheek and smile
  out += el("circle", { cx: hx + hr * 0.42, cy: hy - hr * 0.22, r: hr * 0.075, fill: "#1c1414" });
  out += el("circle", { cx: hx + hr * 0.44, cy: hy - hr * 0.24, r: hr * 0.025, fill: "#ffffff" });
  out += el("circle", { cx: hx + hr * 0.3, cy: hy + hr * 0.25, r: hr * 0.16, fill: "#ff7a8a", opacity: "0.25" });
  out += el("path", {
    d: s`M ${hx + hr * 0.5} ${hy + hr * 0.5} Q ${hx + hr * 0.62} ${hy + hr * 0.62} ${hx + hr * 0.76} ${hy + hr * 0.48}`,
    stroke: "#000",
    "stroke-opacity": "0.4",
    "stroke-width": hr * 0.05,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Near ear: pricked up, or flopping forward over the eye
  out += el("polygon", {
    points: pts([[hx - hr * 0.45, hy - hr * 0.85], earTip, [hx + hr * 0.3, hy - hr * 0.92]]),
    fill: coat.ear,
  });
  out += "</g>";
  note.alt(
    `A ${coat.name} with a curly tail ${mud ? "standing in a mud puddle" : "in a farmyard"}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(flipX(cx, dir, hx + hr * 0.42), hy - hr * 0.22);
  // Head, ears and snout.
  flipFrame(note, cx, dir, hx - hr * 1.1, hy - hr * 1.4, hr * 2.4, hr * 2.5);
  return out;
});
