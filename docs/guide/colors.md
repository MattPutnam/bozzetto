# Palettes and adjustments

Every picture has its own colors, which vary with the seed. The `palette` option changes them in
one of three ways.

## Adjustments

An **adjustment** changes each picture's own colors, so every picture keeps its variety:
`vivid`, `pastel`, `muted`, `dusk`, `dim` and `grayscale`. `dim` darkens a picture for dark pages
while keeping every hue: see [dark mode](#dark-mode).

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

## Dark mode

`dark` builds a dark version into the picture, which it switches to by itself when the viewer's
system is in dark mode: in an `<img>`, a CSS background or inline SVG, with no code on your page.

```ts
render(hills, { seed: 4, dark: true }); // dark mode uses the dim adjustment
render(hills, { seed: 4, palette: "pastel", dark: "sea glass" }); // or any palette
```

<Figure name="colors-dark" alt="The same pictures in their light colors, and in their dark-mode colors" />

`dark: true` uses the `dim` adjustment: everything darker and a little softer, with every hue kept
and pale colors staying pale, so a bright sun doesn't glare on a dark page. Any palette works
instead, as for `palette`. The picture's `darkColor` is its background color in dark mode.

How it works: each color in the picture gets a class, and a `<style>` inside the SVG gives each
class its dark color under `@media (prefers-color-scheme: dark)`. The light picture is unchanged.

### Pages with their own theme switch

An `<img>` follows the viewer's system setting, because it can't see your page's classes. For
inline SVG, `darkSelector` also applies the dark colors under a selector of your own:

```ts
container.innerHTML = render(hills, { dark: true, darkSelector: "html.dark" }).svg;
```

## Mixing palettes

In `placeholders`, `palette`, `mapping` and `texture` each take a list, gone through picture by
picture:

```ts
placeholders(12, { palette: ["pastel", "riso", ["#264653", "#e9c46a"]] });
```
