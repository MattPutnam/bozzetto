import { defineKind, el, fill, hsl } from "../../draw/core";

/** A soft mesh of colors melting into one another. */
export const gradient = /* @__PURE__ */ defineKind("gradient", "Mesh gradient", (g, w, h, note) => {
  const unit = Math.min(w, h);
  // Neighboring hues, soft and light, with the odd complementary accent.
  const hue = g.f(0, 360);
  const spread = g.f(30, 80);
  const sat = g.f(55, 80);
  const light = g.f(72, 84);
  const colors = [0, 1, 2, 3].map(k => hsl(hue + (k - 1.5) * (spread / 1.5), sat + g.f(-10, 10), light + g.f(-6, 6)));
  if (g.chance(0.3)) colors.push(hsl(hue + 180, sat * 0.8, light + 4));
  const blur = g.id("mesh");
  let out = el(
    "defs",
    {},
    el(
      "filter",
      { id: blur, x: -w * 0.5, y: -h * 0.5, width: w * 2, height: h * 2, filterUnits: "userSpaceOnUse" },
      el("feGaussianBlur", { stdDeviation: unit * g.f(0.18, 0.25) }),
    ),
  );
  out += fill(w, h, colors[0]);
  // Big blobs on a jittered grid, so color is spread across the whole frame.
  const cols = Math.max(2, Math.round((w / unit) * 2));
  const rows = Math.max(2, Math.round((h / unit) * 2));
  let blobs = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + g.f(0.1, 0.9)) / cols) * w;
      const y = ((r + g.f(0.1, 0.9)) / rows) * h;
      const rx = unit * g.f(0.3, 0.5);
      blobs += el("ellipse", {
        cx: x,
        cy: y,
        rx,
        ry: rx * g.f(0.6, 1),
        fill: g.pick(colors.slice(1)),
        opacity: String(g.f(0.6, 0.95).toFixed(2)),
      });
    }
  }
  out += el("g", { filter: `url(#${blur})` }, blobs);
  note.focus(w / 2, h / 2);
  note.alt(
    g.chance(0.5)
      ? "A soft mesh gradient of colors melting into each other"
      : "Soft blended washes of color with no hard edges",
  );
  return out;
});
