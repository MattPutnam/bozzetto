# Palettes and adjustments

Every picture has its own colors, which vary with the seed. The `palette` option changes them in
one of three ways.

## Adjustments

An **adjustment** changes each picture's own colors, so every picture keeps its variety:
`vivid`, `pastel`, `muted`, `dusk` and `grayscale`.

```ts
placeholders(12, { palette: "pastel" });
```

<Figure name="colors-adjustments" alt="Hills and a cat in their original colors and in each adjustment" />

## Built-in palettes

A **palette** replaces a picture's colors with a fixed set. The built-in ones are `sunset`,
`sea glass`, `riso`, `orchard`, `candy`, `sepia` and `mono`.

<Figure name="colors-palettes" alt="A fruit bowl in each built-in palette" />

## Your own colors

Give a list of colors (hex, `rgb()` or `hsl()`), or the same colors as a palette code such as
`"1d3557-457b9d-a8dadc-f1faee-e63946"`:

<<< @/examples/colors.ts#custom

<Figure name="colors-custom" alt="A cat in five brand colors" />

To come up with colors, see [Making a palette](./making-palettes), or try the
[palette picker](https://mattputnam.github.io/bozzetto/demo/picker.html).

## Mapping

`mapping` says how a palette's colors are matched to a picture's:

- **`balanced`** (the default) uses only your exact colors. It keeps the picture's light and dark
  where they were, and picks among similar lightnesses by hue, so a sky and a hill stay different.
- **`ramp`** keeps light and dark too, but blends between your colors, for softer shading.
- **`nearest`** snaps every color to its closest palette color. Bold, like a poster, but areas
  can merge.

<Figure name="colors-mappings" alt="Hills, a cat and a fruit bowl in the riso palette with each mapping" />

## Texture

`texture: "grain"` adds fine noise, and `texture: "paper"` adds the tooth of watercolor paper.
Both are a single filtered layer on top, and work with any palette.

<Figure name="colors-textures" alt="Hills with no texture, grain, and paper" />

## Mixing palettes

In `placeholders`, `palette`, `mapping` and `texture` each take a list, gone through picture by
picture:

```ts
placeholders(12, { palette: ["pastel", "riso", ["#264653", "#e9c46a"]] });
```
