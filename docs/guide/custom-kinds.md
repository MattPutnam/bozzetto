# Your own kinds

A kind is a function that draws a picture's contents from a seeded random source and a size.
Define one with `defineKind(id, name, draw)`:

<<< @/examples/custom.ts#kind

Your kinds work everywhere built-in ones do, including palettes, lists and the `placeholders`
options:

<<< @/examples/custom.ts#use

<Figure name="custom-examples" alt="Balloons and owls, alternating, in original and pastel colors" />

## The draw function

`draw(r, width, height, note)` returns the markup that goes inside `<svg>`: shapes, gradients,
anything SVG allows. The picture's size is the size you were asked for; draw to fill it.

`r` is the random source. Every random choice must come from it, never from `Math.random`, so the
same seed always gives the same picture:

| Method          |                                                                      |
| --------------- | -------------------------------------------------------------------- |
| `r.f(min, max)` | A number in [min, max)                                               |
| `r.i(min, max)` | A whole number in [min, max], both ends included                     |
| `r.pick(list)`  | One item of a list                                                   |
| `r.chance(p)`   | `true` with probability p                                            |
| `r.next()`      | A number in [0, 1)                                                   |
| `r.id(name)`    | An element id unique to this picture, for gradients, masks and clips |

Use `r.id` for every `id` your markup defines. Pictures are often inlined many to a page, and
plain ids such as `"sky"` would clash.

## Notes

`note.alt(text)` describes what was drawn, for screen readers. Mention what varies, and don't name
colors, since palettes change them. `note.focus(x, y)` marks the point of interest, in px. Both
are optional: a kind without them gets its name as alt text and the center as its focus.

## Colors that palettes can change

Palettes recolor `#rgb`, `#rrggbb` and `hsl(…)` colors in the markup, so write colors in those
forms. Masks are left alone, since their black and white define a shape.
