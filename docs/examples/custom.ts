import { defineKind, owl, placeholders } from "../../src";
import { grid } from "./shared";

// #region kind
/** Balloons on a plain sky: a handful of circles on strings. */
export const balloons = defineKind("balloons", "Balloons", (r, w, h, note) => {
  const count = r.i(3, 6);
  let shapes = `<rect width="${w}" height="${h}" fill="#cfe8ef"/>`;
  for (let k = 0; k < count; k++) {
    const x = w * (0.15 + (0.7 * (k + r.f(0.2, 0.8))) / count);
    const y = h * r.f(0.2, 0.5);
    const radius = Math.min(w, h) * r.f(0.07, 0.11);
    const color = r.pick(["#e63946", "#f4a261", "#2a9d8f", "#e9c46a", "#8d5aa7"]);
    shapes += `<path d="M${x} ${y + radius} q 8 ${h * 0.15} -4 ${h}" stroke="#555" fill="none"/>`;
    shapes += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`;
  }
  note.alt(`A bunch of ${count} balloons floating in a clear sky`);
  note.focus(w / 2, h * 0.35);
  return shapes;
});
// #endregion kind

export const examples = () => {
  // #region use
  const pictures = placeholders(6, { kind: [balloons, owl], order: "cycle", palette: [undefined, "pastel"] });
  // render(balloons, { seed: 2 }).alt is "A bunch of 5 balloons floating in a clear sky"
  // #endregion use
  return grid(
    pictures.map(picture => ({ picture })),
    3,
  );
};
