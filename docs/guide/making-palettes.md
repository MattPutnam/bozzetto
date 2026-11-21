# Making a palette

Picking colors that work together is hard. `makePalette` builds a palette from a starting point
and a few plain settings:

```ts
import { makePalette } from "bozzetto";

makePalette({ base: "#e76f51", scheme: "triadic", count: 5, contrast: 0.7, vibrance: 0.55 });
// ["#13382b", "#3f5996", "#e76f51", "#7bc696", "#e0dfff"]
```

The [palette picker](https://mattputnam.github.io/bozzetto/demo/picker.html) does the same
interactively, with previews, and gives you the code.

## Options

| Option     | Default     |                                                                             |
| ---------- | ----------- | --------------------------------------------------------------------------- |
| `base`     | from `seed` | A starting color, which appears in the palette exactly, or a hue in degrees |
| `scheme`   | `analogous` | Which hues go together: see below                                           |
| `count`    | `5`         | Number of colors, 2–9                                                       |
| `contrast` | `0.7`       | How far apart the darkest and lightest colors are, 0–1                      |
| `vibrance` | `0.55`      | How colorful, from 0 (grey) to 1 (as vivid as the screen shows)             |
| `seed`     | `1`         | Varies small details, and the hue when there's no base                      |
| `locked`   | none        | Colors to keep exactly, by position, such as `[null, "#123456"]`            |

Colors come back dark to light.

## Schemes

A scheme picks hues by their places on the color wheel:

- **monochrome**: one hue, in different lightness and strength. Quiet and unified.
- **analogous**: neighboring hues. Calm and natural.
- **complementary**: two opposite hues. Strong contrast.
- **split-complementary**: one hue and the two beside its opposite. Contrast with less tension.
- **triadic**: three hues evenly spaced. Lively.
- **tetradic**: four hues evenly spaced. The most varied; try a lower vibrance.

<Figure name="making-schemes" alt="A palette from the same starting color in each scheme" />

## Contrast and vibrance

<Figure name="making-contrast" alt="Analogous palettes at four contrasts, each at low and high vibrance" />

## Locking colors

`locked` keeps chosen colors in place. The other colors don't change when you lock one, so you
can build a palette up a color at a time:

<<< @/examples/making.ts#locked

<Figure name="making-locked" alt="A generated palette, and the same palette with its fourth color locked" />

## A random palette

`randomPalette(seed)` picks everything from a seed: scheme, hue, contrast and vibrance.

<Figure name="making-random" alt="Five random palettes" />

## Using a palette

A palette is a plain list of colors, so it goes anywhere a palette does:

<<< @/examples/making.ts#applied

<Figure name="making-applied" alt="Eight pictures in a split-complementary palette" />

## How it works

Palettes are built in OKLCH, a color space where equal steps look equal: a light blue and a light
yellow at the same OKLCH lightness really do look equally light, which isn't true in HSL. Like a
painter's palette, light colors lean slightly warm and dark ones slightly cool, and the darkest
and lightest colors are less saturated than the middle ones.

## Sharing a palette

`encodePalette(colors)` turns a palette into a short code such as `"264653-2a9d8f-e9c46a"`, and
`decodePalette(code)` turns it back. Codes work anywhere a palette is accepted, and the palette
picker keeps one in its link.
