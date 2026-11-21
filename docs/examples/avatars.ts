import { avatar, avatars, faces, type Picture } from "../../src";

/** Avatars in a row (or rows), on the page's paper color. */
function row(pictures: Picture[], perRow = pictures.length, gap = 12): string {
  const size = pictures[0].width;
  const rows = Math.ceil(pictures.length / perRow);
  const width = gap + perRow * (size + gap);
  const height = gap + rows * (size + gap);
  const body = pictures
    .map((p, k) =>
      p.svg.replace(
        /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="[^"]+" height="[^"]+"/,
        `<svg x="${gap + (k % perRow) * (size + gap)}" y="${gap + Math.floor(k / perRow) * (size + gap)}" width="${size}" height="${size}"`,
      ),
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f1f3ee"/>${body}</svg>`;
}

export const users = () => {
  // #region users
  const ids = ["ada", "grace", "alan", "katherine", "linus", "margaret", "dennis", "barbara"];
  const pictures = ids.map(id => avatar({ seed: id, size: 72 }));
  // #endregion users
  return row(pictures);
};

export const everyFace = () =>
  row(
    faces.flatMap(kind => [1, 2].map(seed => avatar({ kind, seed, size: 72 }))),
    8,
  );

export const shapes = () => {
  // #region shapes
  const round = avatar({ seed: "ada", size: 96 });
  const rounded = avatar({ seed: "ada", size: 96, shape: "rounded" });
  const square = avatar({ seed: "ada", size: 96, shape: "square" });
  // #endregion shapes
  return row([round, rounded, square]);
};

export const styled = () => {
  // #region styled
  const team = avatars(8, { seed: "team", size: 72, palette: "pastel" });
  // #endregion styled
  return row(team);
};
