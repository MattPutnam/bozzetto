# API reference

Everything the package exports, from all five import paths, generated from the source's doc
comments: see the [full list](./api/).

- [`bozzetto`](./api/bozzetto/): the kinds, drawing, choosing kinds, avatars and color.
- [`bozzetto/node`](./api/bozzetto/node/): `toPng`, for PNG files in Node.
- [`bozzetto/react`](./api/bozzetto/react/) and [`bozzetto/vue`](./api/bozzetto/vue/): `<Placeholder>`
  and `<Avatar>` components, and hooks or composables.
- [`bozzetto/element`](./api/bozzetto/element/): the `<bozzetto-img>` web component and its attributes.

## Where to start

- **Drawing:** [`render`](./api/bozzetto/functions/render.md),
  [`Picture`](./api/bozzetto/interfaces/Picture.md),
  [`RenderOptions`](./api/bozzetto/interfaces/RenderOptions.md),
  [`toSvg`](./api/bozzetto/functions/toSvg.md), [`toDataUri`](./api/bozzetto/functions/toDataUri.md),
  [`toImageBlob`](./api/bozzetto/functions/toImageBlob.md).
- **Choosing kinds:** [`placeholder`](./api/bozzetto/functions/placeholder.md),
  [`placeholders`](./api/bozzetto/functions/placeholders.md),
  [`PlaceholdersOptions`](./api/bozzetto/interfaces/PlaceholdersOptions.md),
  [`KindChoice`](./api/bozzetto/type-aliases/KindChoice.md).
- **Avatars:** [`avatar`](./api/bozzetto/functions/avatar.md),
  [`avatars`](./api/bozzetto/functions/avatars.md),
  [`AvatarOptions`](./api/bozzetto/interfaces/AvatarOptions.md).
- **Color:** [`makePalette`](./api/bozzetto/functions/makePalette.md),
  [`PaletteOptions`](./api/bozzetto/interfaces/PaletteOptions.md),
  [`PaletteSpec`](./api/bozzetto/type-aliases/PaletteSpec.md),
  [`StyleOptions`](./api/bozzetto/interfaces/StyleOptions.md).
- **Your own kinds:** [`defineKind`](./api/bozzetto/functions/defineKind.md),
  [`Draw`](./api/bozzetto/type-aliases/Draw.md), [`Rand`](./api/bozzetto/interfaces/Rand.md),
  [`Notes`](./api/bozzetto/interfaces/Notes.md).
