# What is Bozzetto?

Bozzetto draws placeholder pictures: small SVG images of landscapes, modern-art homages,
people, animals, food and still lifes, for galleries, cards, avatars and mockups while the real
pictures aren't ready. A _bozzetto_ is a painter's small preliminary sketch, made before the real
work.

<Figure name="galleries-wall" alt="A gallery of animals and food in mixed shapes" />

Every picture is drawn from a **seed**, so the same seed always gives the same picture, on any
machine. That keeps screenshots and visual tests stable, and lets a user id or a record's key
pick a picture that stays with it.

## What you get

- **Pictures as data, not URLs.** Each picture is SVG markup and a data URI you can put straight
  into `<img src>` or CSS. No placeholder service, no network request, nothing to host.
- **Small.** Most pictures are 2–8 KB as a data URI, because they are drawn from a handful of
  shapes: ellipses, curves and gradients.
- **Any size.** Pictures are drawn to the size you ask for, so a portrait fills a tall frame and a
  landscape fills a wide one.
- **Ready for a real gallery.** Each picture comes with its width and height, alt text that
  describes what was drawn, a focal point for cropping, and a background color to show while it
  loads.
- **Your colors.** Use the pictures' own colors, adjust them, or recolor them with a built-in
  palette or your brand's exact colors.
- **No dependencies,** and every kind is a separate export, so a bundle only carries the kinds it
  uses.

## Where next

- [Getting started](./getting-started): install it and draw a first picture.
- [Kinds and categories](./kinds): every kind, live.
- [Filling a gallery](./galleries): lists of pictures in mixed kinds and sizes.
- [Palettes](./colors): recoloring pictures.
- The [gallery](https://mattputnam.github.io/bozzetto/demo/) and
  [palette picker](https://mattputnam.github.io/bozzetto/demo/picker.html), to play with
  everything at once.
