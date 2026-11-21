# Changelog

Bozzetto follows [semantic versioning](https://semver.org), with pictures as part of the API: see
[Stability](https://mattputnam.github.io/bozzetto/guide/stability) for what each kind of release
can change.

## 1.0.0

The first release.

- 191 kinds of picture in 15 categories: landscapes, art, people, animals, food, objects, plants,
  buildings, vehicles, products, music, sports, holidays, space and patterns. Each kind is its own
  export, and a bundle carries only the kinds it uses.
- Options for some kinds, fixed with `kind.with(...)`.
- `render`, `toSvg`, `toDataUri`, `placeholder` and `placeholders`, with alt text, a focus point and
  a main color for every picture.
- Avatars cropped to a face, from 40 kinds with faces.
- Named palettes, adjustments, your own colors or palette codes, three ways of mapping colors,
  textures, and dark mode built into the picture.
- React, Vue and `<bozzetto-img>` web components; PNG in Node through resvg, and PNG, WebP and JPEG
  in browsers.
- The `bozzetto` command for SVG, PNG, data URIs and JSON.
