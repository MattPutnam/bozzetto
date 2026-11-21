import { animals, donut, food, kinds, landscapes, placeholders } from "../../src";
import { grid, justified } from "./shared";

/** The home page picture: a gallery wall of every kind of picture. */
export const hero = () =>
  justified(placeholders(16, { kind: kinds, size: ["400x300", "300x400", "320x320"], seed: 7 }), 720, 130);

export const wall = () => {
  // #region wall
  const photos = placeholders(12, {
    kind: [animals, food],
    size: ["400x300", "300x400", "300x300", "480x270"],
    seed: 4,
  });
  // #endregion wall
  return justified(photos);
};

export const each = () => {
  // #region each
  // Every animal plus the donut, once each, in a seeded order.
  const pictures = placeholders(12, { kind: [animals, donut], seed: 2 });
  // #endregion each
  return grid(
    pictures.map(picture => ({ picture, label: picture.kind })),
    4,
  );
};

export const cycle = () => {
  // #region cycle
  const pictures = placeholders(6, {
    kind: landscapes,
    order: "cycle",
    palette: ["pastel", "dusk"],
    numbered: true,
  });
  // #endregion cycle
  return grid(
    pictures.map(picture => ({ picture })),
    3,
  );
};
