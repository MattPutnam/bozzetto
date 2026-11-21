import { defineKind, el, hsl, mix, pts, s } from "../../draw/core";
import { blob, table } from "../../draw/shapes";

/** An upholstered armchair, sometimes with a cushion, and sometimes beside a side table. */
export const armchair = /* @__PURE__ */ defineKind("armchair", "Armchair", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.8, 0.86);
  const withTable = g.chance(0.5);
  const side = g.chance(0.5) ? 1 : -1;
  // A smaller chair leaves room for the side table at every size.
  const u = unit * (withTable ? 0.8 : 0.95);
  const style = g.pick(["club", "wingback", "modern"]);
  const cw = u * g.f(0.66, 0.74);
  const tableW = u * 0.26;
  const cx = w / 2 - (withTable ? side * (tableW * 0.5 + u * 0.03) : 0);
  const floorY = top + unit * 0.05;
  const legH = u * (style === "modern" ? g.f(0.09, 0.12) : g.f(0.04, 0.06));
  const baseY = floorY - legH;
  const seatTop = baseY - u * 0.17;
  const armY = seatTop - u * g.f(0.1, 0.14);
  const backTop = armY - u * (style === "wingback" ? g.f(0.24, 0.28) : g.f(0.16, 0.22));
  const aw = cw * (style === "club" ? 0.2 : 0.15);
  const left = cx - cw / 2;
  const right = cx + cw / 2;
  const fabric = g.pick([
    "#3e6d8e",
    "#c4572f",
    "#2f6b58",
    "#e8b04b",
    "#7a5c9e",
    "#a8b5a2",
    "#8a5a3b",
    "#d98b6a",
    "#4f6d7a",
    "#b5838d",
    "#6b8f71",
    "#c9a46a",
    "#5c5470",
    "#9e3f3f",
  ]);
  const shadeOf = (t: number) => mix(fabric, t > 0 ? "#ffffff" : "#000000", Math.abs(t));
  const leg = g.pick(["#5b3a29", "#3b2f2a", "#8a5a3b", "#c9a477"]);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(15, 35), g.f(82, 90)), hsl(g.f(20, 40), g.f(20, 35), g.f(48, 62)));
  // Shadow
  out += el("ellipse", { cx, cy: floorY, rx: cw * 0.6, ry: unit * 0.025, fill: "#000", opacity: "0.15" });
  // Legs
  const legW = u * 0.025;
  const legs =
    style === "modern"
      ? s`M ${left + aw * 0.6} ${baseY} L ${left + aw * 0.2} ${floorY} M ${right - aw * 0.6} ${baseY} L ${right - aw * 0.2} ${floorY}`
      : s`M ${left + aw * 0.5} ${baseY} V ${floorY} M ${right - aw * 0.5} ${baseY} V ${floorY}`;
  out += el("path", { d: legs, stroke: leg, "stroke-width": legW, "stroke-linecap": "round" });
  // Back, with wings for a wingback
  const bx0 = left + aw * 0.4;
  const bx1 = right - aw * 0.4;
  if (style === "wingback")
    out += el("path", {
      d: s`M ${bx0} ${seatTop}
           V ${armY - u * 0.02}
           C ${left - aw * 0.15} ${armY - u * 0.08} ${left} ${backTop + u * 0.02} ${bx0 + aw * 0.5} ${backTop}
           Q ${cx} ${backTop - u * 0.06} ${bx1 - aw * 0.5} ${backTop}
           C ${right} ${backTop + u * 0.02} ${right + aw * 0.15} ${armY - u * 0.08} ${bx1} ${armY - u * 0.02}
           V ${seatTop}
           Z`,
      fill: shadeOf(-0.12),
    });
  else
    out += el("rect", {
      x: bx0,
      y: backTop,
      width: bx1 - bx0,
      height: seatTop - backTop + u * 0.02,
      rx: style === "club" ? u * 0.08 : u * 0.03,
      fill: shadeOf(-0.12),
    });
  // Buttons tufting the back
  if (style !== "club" && g.chance(0.5)) {
    let tufts = "";
    for (const [col, row] of [
      [-0.25, 0],
      [0, 0],
      [0.25, 0],
      [-0.125, 1],
      [0.125, 1],
    ])
      tufts += el("circle", {
        cx: cx + col * (bx1 - bx0),
        cy: backTop + (armY - backTop) * (0.35 + row * 0.35),
        r: u * 0.008,
        fill: "#000",
        opacity: "0.25",
      });
    out += tufts;
  }
  // Seat cushion and the front panel under it
  out += el("rect", {
    x: left + aw * 0.7,
    y: seatTop + u * 0.06,
    width: cw - aw * 1.4,
    height: baseY - seatTop - u * 0.06,
    fill: shadeOf(-0.06),
  });
  out += el("rect", {
    x: left + aw * 0.7,
    y: seatTop - u * 0.02,
    width: cw - aw * 1.4,
    height: u * 0.09,
    rx: u * 0.03,
    fill: shadeOf(0.08),
  });
  // A throw cushion leaning on the back
  const cushion = g.chance(0.55);
  if (cushion) {
    const pw = u * 0.17;
    const ph = u * 0.15;
    const room = (bx1 - bx0) / 2 - aw * 0.6 - pw / 2;
    const px = cx + g.f(-1, 1) * Math.max(0, room);
    const py = seatTop - ph * 0.45;
    const pillow = hsl(g.f(0, 360), g.f(35, 65), g.f(55, 75));
    out += el(
      "g",
      { transform: s`rotate(${g.f(-14, 14)} ${px} ${py})` },
      el("rect", { x: px - pw / 2, y: py - ph / 2, width: pw, height: ph, rx: u * 0.03, fill: pillow }),
      g.chance(0.5)
        ? el("rect", { x: px - pw / 2, y: py - ph * 0.08, width: pw, height: ph * 0.16, fill: "#fff", opacity: "0.5" })
        : "",
    );
  }
  // Arms, in front of the seat
  const armR = style === "club" ? aw * 0.5 : u * 0.02;
  out += el("rect", { x: left, y: armY, width: aw, height: baseY - armY, rx: armR, fill: fabric });
  out += el("rect", { x: right - aw, y: armY, width: aw, height: baseY - armY, rx: armR, fill: fabric });
  out += el("rect", {
    x: left + aw * 0.15,
    y: armY + u * 0.01,
    width: aw * 0.18,
    height: (baseY - armY) * 0.5,
    rx: aw * 0.09,
    fill: "#fff",
    opacity: "0.12",
  });
  let tableText = "";
  if (withTable) {
    // A round side table beside the chair, a little taller than the arm
    const tx = side > 0 ? right + u * 0.04 + tableW / 2 : left - u * 0.04 - tableW / 2;
    const tTop = armY - u * 0.02;
    const wood = g.pick(["#8a5a3b", "#c9a477", "#5b3a29", "#e9e3d5", "#3b3b3b"]);
    out += el("ellipse", { cx: tx, cy: floorY, rx: tableW * 0.4, ry: unit * 0.015, fill: "#000", opacity: "0.15" });
    out += el("rect", { x: tx - u * 0.012, y: tTop, width: u * 0.024, height: floorY - tTop, fill: wood });
    out += el("ellipse", { cx: tx, cy: floorY - u * 0.005, rx: tableW * 0.28, ry: u * 0.018, fill: wood });
    out += el("rect", {
      x: tx - tableW / 2,
      y: tTop - u * 0.02,
      width: tableW,
      height: u * 0.025,
      rx: u * 0.01,
      fill: mix(wood, "#000000", 0.1),
    });
    const thing = g.pick(["mug", "plant", "books"]);
    const ty = tTop - u * 0.02;
    if (thing === "mug") {
      const mw = u * 0.035;
      out += el("path", {
        d: s`M ${tx + mw} ${ty - mw * 1.5} c ${mw * 0.6} 0 ${mw * 0.6} ${mw} 0 ${mw}`,
        stroke: "#f4f1ea",
        "stroke-width": mw * 0.3,
        fill: "none",
      });
      out += el("rect", { x: tx - mw, y: ty - mw * 2, width: mw * 2, height: mw * 2, rx: mw * 0.2, fill: "#f4f1ea" });
      tableText = " beside a side table with a mug";
    } else if (thing === "plant") {
      const pr = u * 0.04;
      out += el("path", { d: blob(g, tx, ty - pr * 2.4, pr * 1.3, pr * 1.1, 6, 0.22, 0.08), fill: "#4f8a5a" });
      out += el("polygon", {
        points: pts([
          [tx - pr, ty - pr * 1.4],
          [tx + pr, ty - pr * 1.4],
          [tx + pr * 0.75, ty],
          [tx - pr * 0.75, ty],
        ]),
        fill: "#c4572f",
      });
      tableText = " beside a side table with a plant";
    } else {
      let y = ty;
      for (let k = 0; k < 3; k++) {
        const bh = u * g.f(0.02, 0.03);
        const bw2 = tableW * g.f(0.55, 0.75);
        y -= bh;
        out += el("rect", {
          x: tx - bw2 / 2 + g.f(-0.05, 0.05) * tableW,
          y,
          width: bw2,
          height: bh,
          rx: u * 0.003,
          fill: hsl(g.f(0, 360), g.f(30, 55), g.f(35, 60)),
        });
      }
      tableText = " beside a side table with books";
    }
  }
  const name =
    style === "wingback" ? "A wingback armchair" : style === "modern" ? "A mid-century armchair" : "A club armchair";
  note.alt(`${name}${cushion ? " with a cushion" : ""}${tableText}`);
  note.focus(cx, (backTop + seatTop) / 2);
  return out;
});
