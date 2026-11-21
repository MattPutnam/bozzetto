import { SCHEMES, makePalette, placeholders, randomPalette, type Scheme } from "../../src";
import { justified, swatches } from "./shared";

export const schemes = () =>
  swatches(
    (Object.keys(SCHEMES) as Scheme[]).map(scheme => ({
      colors: makePalette({ base: "#e76f51", scheme, seed: 2 }),
      label: scheme,
    })),
  );

export const contrast = () =>
  swatches(
    [0.2, 0.5, 0.8, 1].flatMap(contrast =>
      [0.2, 0.8].map(vibrance => ({
        colors: makePalette({ base: 200, scheme: "analogous", contrast, vibrance }),
        label: `contrast ${contrast} vibrance ${vibrance}`,
      })),
    ),
    720,
    30,
  );

export const locked = () => {
  // #region locked
  const free = makePalette({ base: "#2a9d8f", scheme: "triadic", seed: 5 });
  const kept = makePalette({ base: "#2a9d8f", scheme: "triadic", seed: 5, locked: [null, null, null, "#ffb703"] });
  // kept is free with its fourth color replaced; the others don't move.
  // #endregion locked
  return swatches([
    { colors: free, label: "generated" },
    { colors: kept, label: "fourth locked" },
  ]);
};

export const random = () =>
  swatches(["a", "b", "c", "d", "e"].map(seed => ({ colors: randomPalette(seed), label: `randomPalette("${seed}")` })));

export const applied = () => {
  // #region applied
  const palette = makePalette({ base: "#e76f51", scheme: "split-complementary", contrast: 0.8 });
  const pictures = placeholders(8, { palette, seed: 3, size: ["400x300", "300x400"] });
  // #endregion applied
  return justified(pictures, 720, 120);
};
