# Alt text, focus and color

`render`, `placeholder`, `placeholders`, `avatar` and `avatars` return **pictures**, with what a gallery needs to lay
them out and describe them:

| Field             |                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `src`             | A `data:image/svg+xml` URI, for `<img src>` or CSS `url()`                                    |
| `svg`             | The SVG markup, for inlining. Element ids are unique to the picture, so many can share a page |
| `darkColor`       | With the `dark` option: the main background color in dark mode                                |
| `frame`           | For kinds with a face: the head's bounds, as fractions of the width and height                |
| `width`, `height` | The size in px                                                                                |
| `kind`            | The id of the kind that drew it, such as `"owl"`                                              |
| `alt`             | A short description for screen readers                                                        |
| `focus`           | The point of interest, as fractions of the width and height                                   |
| `color`           | The main background color as `#rrggbb`                                                        |
| `options`         | The value each of the kind's [options](./kinds#options) took                                  |

```ts
for (const photo of placeholders(12, { kind: animals, size: ["400x300", "300x400"] })) {
  const img = new Image(photo.width, photo.height);
  img.src = photo.src;
  img.alt = photo.alt;
  img.style.objectFit = "cover";
  img.style.objectPosition = `${photo.focus.x * 100}% ${photo.focus.y * 100}%`;
  img.style.background = photo.color;
  gallery.append(img);
}
```

## Alt text

Every kind describes what it actually drew, so the text changes with the picture:

- "A crescent moon and a sky full of stars over rolling hills"
- "A dog's face with floppy ears, its tongue out and a collar"
- "Portrait of a person with long hair, a broad smile and glasses"
- "A bowl of apples, a lemon, a pear and an orange on a table"

Alt text never names colors, because a palette can change them: a cat that's orange in its own
colors could be teal in yours.

## Focus

`focus` is the picture's point of interest: an animal's eyes, a face, the sun, the top scoop of
ice cream. Use it as `object-position` when cropping a picture into a different shape, so the
subject stays in view. In the [live example](./getting-started#try-it), a ring marks it.

## Color

`color` is the picture's main background color, after any palette. Show it while the picture
loads, or use it to tint a card behind the picture.

## Just the markup

`toSvg(kind, options)` and `toDataUri(kind, options)` return only the markup or the data URI, for
when that's all you need.
