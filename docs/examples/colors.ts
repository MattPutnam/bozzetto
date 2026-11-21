import { ADJUSTMENTS, MAPPINGS, PALETTES, cat, fruitBowl, hills, render } from "../../src";
import { grid } from "./shared";

export const adjustments = () =>
  grid(
    [undefined, ...ADJUSTMENTS].flatMap(palette =>
      [hills, cat].map((kind, k) => ({
        picture: render(kind, { seed: 5, palette }),
        label: k === 0 ? (palette ?? "original") : "",
      })),
    ),
    6,
    112,
    84,
  );

export const palettes = () =>
  grid(
    Object.keys(PALETTES).map(palette => ({ picture: render(fruitBowl, { seed: 4, palette }), label: palette })),
    4,
  );

export const mappings = () =>
  grid(
    [hills, cat, fruitBowl].flatMap(kind =>
      MAPPINGS.map(mapping => ({ picture: render(kind, { seed: 6, palette: "riso", mapping }), label: mapping })),
    ),
    3,
  );

export const custom = () => {
  // #region custom
  const brand = ["#1d3557", "#457b9d", "#a8dadc", "#f1faee", "#e63946"];
  const picture = render(cat, { seed: 8, palette: brand });
  // #endregion custom
  return grid([{ picture, label: "brand colors" }], 1, 400, 300);
};

export const textures = () =>
  grid(
    ([undefined, "grain", "paper"] as const).map(texture => ({
      picture: render(hills, { seed: 2, texture, size: "200x150" }),
      label: texture ?? "no texture",
    })),
    3,
    224,
    168,
  );
