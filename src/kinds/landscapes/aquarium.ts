import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";
import { smallFish, whole } from "./shared";

/**
 * A home aquarium on a cabinet or table: gravel, plants, an ornament, bubbles and a few fish under a lit lid.
 *
 * @category Landscapes
 */
export const aquarium = /* @__PURE__ */ defineKind("aquarium", "Aquarium", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wallHue = g.f(0, 360);
  let out = fill(w, h, hsl(wallHue, g.f(12, 28), g.f(82, 90)));
  // The floor and skirting board.
  const fy = h * g.f(0.88, 0.92);
  out += el("rect", { y: fy, width: w, height: h - fy, fill: hsl(g.f(20, 40), 30, g.f(45, 60)) });
  out += el("rect", { y: fy - unit * 0.025, width: w, height: unit * 0.025, fill: "#fff", opacity: "0.6" });
  // The stand: a cabinet, or a table on legs.
  const cabinet = g.chance(0.55);
  const wood = hsl(g.f(15, 40), g.f(25, 45), g.f(28, 55));
  const sh = h * g.f(0.24, 0.3);
  const tb = fy - sh;
  // The tank's size, kept within the picture.
  let th = (tb - h * 0.12) * g.f(0.78, 0.9);
  const tw = Math.min(w * 0.76, th * g.f(1.5, 1.9));
  th = Math.min(th, tw * 0.72);
  const tx = w * g.f(0.47, 0.53) - tw / 2;
  const ty = tb - th;
  const sw = tw * 1.06;
  const sx = tx - tw * 0.03;
  const top = unit * 0.03;
  out += el("rect", { x: sx, y: tb, width: sw, height: top, fill: wood });
  if (cabinet) {
    out += el("rect", { x: sx + sw * 0.02, y: tb + top, width: sw * 0.96, height: sh - top, fill: wood });
    out += el("rect", {
      x: sx + sw * 0.02,
      y: tb + top,
      width: sw * 0.96,
      height: sh - top,
      fill: "#000",
      opacity: "0.12",
    });
    // Two doors with knobs.
    const dw = sw * 0.44;
    const dh = sh - top * 2.2;
    for (const d of [-1, 1]) {
      const dx = sx + sw / 2 + (d < 0 ? -dw - sw * 0.01 : sw * 0.01);
      out += el("rect", { x: dx, y: tb + top * 1.6, width: dw, height: dh, rx: unit * 0.006, fill: wood });
      out += el("circle", {
        cx: sx + sw / 2 + d * sw * 0.04,
        cy: tb + top * 1.6 + dh * 0.45,
        r: unit * 0.008,
        fill: "#000",
        opacity: "0.35",
      });
    }
  } else {
    let legs = "";
    for (const lx of [sx + sw * 0.04, sx + sw * 0.96 - unit * 0.025])
      legs += s`M${lx} ${tb + top}h${unit * 0.025}V${fy}h${-unit * 0.025}Z`;
    out += el("path", { d: legs, fill: wood });
    out += el("path", { d: legs, fill: "#000", opacity: "0.15" });
    out += el("rect", { x: sx + sw * 0.04, y: tb + top, width: sw * 0.92, height: unit * 0.03, fill: wood });
  }
  out += el("rect", { x: sx, y: tb + top * 0.75, width: sw, height: top * 0.25, fill: "#000", opacity: "0.12" });
  // A houseplant on the floor to one side, and a picture on the wall to the other, where there's room.
  const plantSide = g.pick([-1, 1]);
  const gap = Math.min(sx, w - sx - sw);
  const potted = gap > unit * 0.3 && g.chance(0.75);
  if (potted) {
    const off = Math.min(gap * 0.5, unit * g.f(0.16, 0.24));
    const px = plantSide < 0 ? sx - off : sx + sw + off;
    const pw = unit * g.f(0.1, 0.13);
    const ph = pw * 0.9;
    let fronds = "";
    for (let k = g.i(6, 9); k > 0; k--) {
      const a = g.f(-1.1, 1.1);
      const len = unit * g.f(0.18, 0.3) * (1 - Math.abs(a) * 0.3);
      const ex = px + Math.sin(a) * len;
      const ey = fy - ph - Math.cos(a) * len;
      const lw = len * 0.16;
      fronds += s`M${px} ${fy - ph}Q${(px + ex) / 2 - lw} ${(fy - ph + ey) / 2 - lw} ${ex} ${ey}
                  Q${(px + ex) / 2 + lw} ${(fy - ph + ey) / 2 + lw} ${px} ${fy - ph}Z`;
    }
    out += el("path", { d: whole(fronds), fill: hsl(g.f(100, 150), 40, 38) });
    out += el("path", {
      d: s`M${px - pw / 2} ${fy - ph}h${pw}l${-pw * 0.12} ${ph}h${-pw * 0.76}Z`,
      fill: hsl(g.f(0, 360), 30, g.f(45, 65)),
    });
  }
  const room = Math.max(sx, w - sx - sw);
  if (room > unit * 0.45 && g.chance(0.7)) {
    const pside = potted ? -plantSide : sx > w - sx - sw ? -1 : 1;
    const side = pside < 0 ? sx : w - sx - sw;
    if (side > unit * 0.45) {
      const fw = Math.min(side * 0.6, unit * 0.32);
      const fh = fw * 0.75;
      const cx = pside < 0 ? sx - side / 2 : sx + sw + side / 2;
      const cy = Math.min(ty + fh * 0.2, tb - fh * 0.8);
      const fx = cx - fw / 2;
      const fy2 = cy - fh / 2;
      const m = fw * 0.07;
      out += el("rect", { x: fx, y: fy2, width: fw, height: fh, fill: hsl(g.f(15, 40), 35, 32) });
      out += el("rect", {
        x: fx + m,
        y: fy2 + m,
        width: fw - m * 2,
        height: fh - m * 2,
        fill: hsl(g.f(190, 215), 45, 80),
      });
      out += el("path", {
        d: s`M${fx + m} ${fy2 + fh - m}V${fy2 + fh * 0.6}Q${cx - fw * 0.1} ${fy2 + fh * 0.35} ${cx + fw * 0.1} ${fy2 + fh * 0.55}T${fx + fw - m} ${fy2 + fh * 0.5}V${fy2 + fh - m}Z`,
        fill: hsl(g.f(90, 140), 30, 52),
      });
    }
  }
  // The water, below an air gap under the lid.
  const hue = g.f(180, 205);
  const water = g.id("tank");
  const wy = ty + th * 0.08;
  out += el("defs", {}, lin(water, [hsl(hue, 55, 78), hsl(hue + 10, 55, 52)]));
  out += el("rect", { x: tx, y: ty, width: tw, height: th, fill: hsl(hue, 25, 92) });
  out += el("rect", { x: tx, y: wy, width: tw, height: tb - wy, fill: `url(#${water})` });
  // Light from the lid falling through the water.
  let rays = "";
  for (let k = 0; k < 3; k++) {
    const rx = tx + tw * (0.1 + 0.3 * k + g.f(0, 0.1));
    rays += s`M${rx} ${wy}h${tw * 0.1}l${tw * 0.06} ${tb - wy}h${-tw * 0.14}Z`;
  }
  out += el("path", { d: rays, fill: "#fff", opacity: "0.12" });
  // Gravel along the bottom.
  const gh = th * g.f(0.13, 0.17);
  const gy = tb - gh;
  let gravel = s`M${tx} ${tb}V${gy + gh * 0.2}`;
  for (let k = 1; k <= 6; k++)
    gravel += s`Q${tx + (tw * (k - 0.5)) / 6} ${gy + gh * g.f(-0.15, 0.15)} ${tx + (tw * k) / 6} ${gy + gh * g.f(0.1, 0.3)}`;
  const gravelHue = g.f(20, 45);
  out += el("path", { d: whole(gravel + s`V${tb}Z`), fill: hsl(gravelHue, 25, 62) });
  const stones = ["", ""];
  for (let k = 0; k < 40; k++) {
    const px = tx + tw * g.f(0.02, 0.98);
    const py = gy + gh * g.f(0.4, 0.92);
    stones[k % 2] += s`M${px} ${py}h0`;
  }
  out += stones
    .map((d, k) =>
      el("path", {
        d: whole(d),
        stroke: hsl(gravelHue + k * 160, 20, k ? 45 : 78),
        "stroke-width": unit * 0.012,
        "stroke-linecap": "round",
      }),
    )
    .join("");
  // Tall plants at the back.
  const plantHue = g.f(95, 140);
  let leaves = "";
  for (let k = g.i(3, 5); k > 0; k--) {
    const px = tx + tw * g.f(0.06, 0.94);
    const ph = (tb - wy) * g.f(0.45, 0.85);
    for (let j = g.i(3, 5); j > 0; j--) {
      const lean = g.f(-0.25, 0.25) * ph;
      const lh = ph * g.f(0.6, 1);
      const lw = unit * g.f(0.012, 0.02);
      leaves += s`M${px - lw} ${gy + gh * 0.3}Q${px + lean * 0.3 - lw * 2} ${gy - lh * 0.6} ${px + lean} ${gy - lh}
                  Q${px + lean * 0.3 + lw * 2} ${gy - lh * 0.6} ${px + lw} ${gy + gh * 0.3}Z`;
    }
  }
  out += el("path", { d: whole(leaves), fill: hsl(plantHue, 45, 38) });
  // An ornament sitting in the gravel.
  const ornament = g.pick(["castle", "chest", "arch"] as const);
  const os = Math.min(th, tw * 0.55) * g.f(0.38, 0.46);
  const half = os * (ornament === "arch" ? 0.8 : ornament === "chest" ? 0.62 : 0.48) + tw * 0.03;
  const ox = Math.max(tx + half, Math.min(tx + tw - half, tx + tw * g.pick([g.f(0.18, 0.32), g.f(0.68, 0.82)])));
  const oy = gy + gh * 0.45;
  if (ornament === "castle") {
    const stone = hsl(g.f(20, 40), 12, g.f(66, 74));
    const tower = (cx: number, cw: number, ch: number) =>
      s`M${cx - cw / 2} ${oy}V${oy - ch}h${cw / 5}v${-cw / 5}h${cw / 5}v${cw / 5}h${cw / 5}v${-cw / 5}h${cw / 5}v${cw / 5}h${cw / 5}V${oy}Z`;
    out += el("path", {
      d: tower(ox - os * 0.3, os * 0.3, os) + tower(ox + os * 0.3, os * 0.3, os * 0.85) + tower(ox, os * 0.5, os * 0.6),
      fill: stone,
    });
    out += el("path", {
      d: s`M${ox - os * 0.1} ${oy}V${oy - os * 0.25}A${os * 0.1} ${os * 0.1} 0 0 1 ${ox + os * 0.1} ${oy - os * 0.25}V${oy}Z
           M${ox - os * 0.33} ${oy - os * 0.75}h${os * 0.06}v${os * 0.12}h${-os * 0.06}Z
           M${ox + os * 0.27} ${oy - os * 0.6}h${os * 0.06}v${os * 0.12}h${-os * 0.06}Z`,
      fill: "#000",
      opacity: "0.45",
    });
  } else if (ornament === "chest") {
    const cw = os * 1.1;
    const ch = os * 0.5;
    const box = hsl(g.f(15, 30), 45, 35);
    const trim = hsl(45, 80, 58);
    out += el("rect", { x: ox - cw / 2, y: oy - ch, width: cw, height: ch, fill: box });
    // The lid propped open, with treasure shining inside.
    out += el("ellipse", { cx: ox, cy: oy - ch, rx: cw * 0.44, ry: ch * 0.2, fill: trim });
    out += el("path", {
      d: s`M${ox - cw / 2} ${oy - ch}L${ox - cw * 0.42} ${oy - ch * 1.9}H${ox + cw * 0.58}L${ox + cw / 2} ${oy - ch}Z`,
      fill: box,
    });
    out += el("path", {
      d: s`M${ox - cw / 2} ${oy - ch * 0.55}h${cw}M${ox} ${oy - ch}v${ch * 0.3}`,
      stroke: trim,
      "stroke-width": unit * 0.012,
    });
  } else {
    const rock = hsl(g.f(20, 220), 10, g.f(48, 60));
    out += el("path", {
      d: s`M${ox - os * 0.75} ${oy}Q${ox - os * 0.8} ${oy - os * 1.1} ${ox} ${oy - os * 1.05}Q${ox + os * 0.85} ${oy - os} ${ox + os * 0.75} ${oy}Z
           M${ox - os * 0.35} ${oy}Q${ox - os * 0.35} ${oy - os * 0.6} ${ox} ${oy - os * 0.6}Q${ox + os * 0.35} ${oy - os * 0.6} ${ox + os * 0.35} ${oy}Z`,
      fill: rock,
      "fill-rule": "evenodd",
    });
    out += el("path", {
      d: s`M${ox - os * 0.55} ${oy - os * 0.75}Q${ox} ${oy - os * 1.0} ${ox + os * 0.5} ${oy - os * 0.8}`,
      fill: "none",
      stroke: "#fff",
      "stroke-width": unit * 0.01,
      "stroke-linecap": "round",
      opacity: "0.25",
    });
  }
  // An air stone sending up a stream of bubbles on the other side.
  const bx = ox < tx + tw / 2 ? tx + tw * g.f(0.72, 0.88) : tx + tw * g.f(0.12, 0.28);
  let stream = "";
  const br = unit * 0.008;
  for (let y = gy - br * 2, k = 0; y > wy + br * 3; y -= br * g.f(3.5, 5.5), k++) {
    const r = br * (0.7 + (0.6 * (gy - y)) / (gy - wy)) * g.f(0.8, 1.2);
    stream += s`M${bx + g.f(-1, 1) * br - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  out += el("path", { d: whole(stream), fill: "none", stroke: "#fff", "stroke-width": "1.5", opacity: "0.75" });
  out += el("ellipse", { cx: bx, cy: gy + gh * 0.1, rx: unit * 0.018, ry: unit * 0.008, fill: hsl(0, 0, 40) });
  // Fish.
  const fishCount = g.i(2, 5);
  const kind = g.pick(["goldfish", "tetra", "mixed"] as const);
  const swimTop = wy + (gy - wy) * 0.15;
  const swimBottom = gy - (gy - wy) * 0.2;
  for (let k = 0; k < fishCount; k++) {
    const fx = tx + tw * ((k + g.f(0.25, 0.75)) / fishCount) * 0.8 + tw * 0.1;
    const fy = g.f(swimTop, swimBottom);
    const r = unit * (kind === "tetra" ? g.f(0.022, 0.028) : g.f(0.03, 0.042));
    const fh = kind === "goldfish" ? g.f(20, 35) : kind === "tetra" ? g.f(190, 210) : g.f(0, 360);
    out += smallFish(
      fx,
      fy,
      r,
      g.pick([-1, 1]),
      hsl(fh, 85, kind === "tetra" ? 55 : 58),
      hsl(fh + 10, 80, 50),
      kind === "tetra" ? hsl(0, 80, 55) : "",
    );
  }
  // Short grass in front.
  let grass = "";
  for (let k = g.i(4, 7); k > 0; k--) {
    const px = tx + tw * g.f(0.04, 0.96);
    for (let j = -2; j <= 2; j++)
      grass += s`M${px + j * unit * 0.006} ${tb}q${j * unit * 0.008} ${-gh * 0.5} ${j * unit * 0.02} ${-gh * g.f(0.9, 1.4)}`;
  }
  out += el("path", {
    d: whole(grass),
    fill: "none",
    stroke: hsl(plantHue + 10, 50, 45),
    "stroke-width": unit * 0.007,
    "stroke-linecap": "round",
  });
  // The surface line, the glass with its trim and shine, and the lid with its light.
  out += el("rect", { x: tx, y: wy, width: tw, height: unit * 0.006, fill: "#fff", opacity: "0.6" });
  out += el("path", {
    d: s`M${tx + tw * 0.06} ${tb - th * 0.1}L${tx + tw * 0.2} ${ty + th * 0.1}h${tw * 0.05}L${tx + tw * 0.11} ${tb - th * 0.1}Z
         M${tx + tw * 0.75} ${tb - th * 0.15}L${tx + tw * 0.86} ${ty + th * 0.2}h${tw * 0.02}L${tx + tw * 0.77} ${tb - th * 0.15}Z`,
    fill: "#fff",
    opacity: "0.18",
  });
  const trim = hsl(0, 0, g.f(14, 24));
  const tt = unit * 0.012;
  out += el("path", {
    d: s`M${tx} ${ty}h${tw}v${th}h${-tw}Z M${tx + tt} ${ty + tt}v${th - tt * 2}h${tw - tt * 2}v${-th + tt * 2}Z`,
    fill: trim,
    "fill-rule": "evenodd",
  });
  const lh = unit * 0.035;
  out += el("rect", {
    x: tx - unit * 0.008,
    y: ty - lh,
    width: tw + unit * 0.016,
    height: lh,
    rx: unit * 0.006,
    fill: trim,
  });
  out += el("rect", { x: tx + tw * 0.15, y: ty, width: tw * 0.7, height: tt * 1.2, fill: hsl(50, 100, 88) });
  out += el("rect", {
    x: tx + tw * 0.15,
    y: ty - lh * 0.55,
    width: tw * 0.3,
    height: lh * 0.12,
    fill: "#fff",
    opacity: "0.25",
  });
  const stand = cabinet ? "a cabinet" : "a table";
  const what = ornament === "castle" ? "a little castle" : ornament === "chest" ? "a treasure chest" : "a rock arch";
  const words = ["", "", "Two", "Three", "Four", "Five"];
  note.alt(
    `A fish tank on ${stand} with plants, ${what} and bubbles, ${words[fishCount].toLowerCase()} fish swimming inside`,
  );
  note.focus(tx + tw / 2, ty + th / 2);
  return out;
});
