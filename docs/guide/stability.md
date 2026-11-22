# Stability

Placeholders end up in screenshots, visual tests and user avatars, so a picture that changes under
you is a breaking change. Bozzetto follows [semantic versioning](https://semver.org), and the
pictures themselves count as part of the API.

## What stays the same

Within a major version (every 1.x release, say):

- **Every picture.** The same kind, seed, size and options draw the same picture, with the same
  alt text, focus and color. That holds with palettes, mappings, textures and dark mode too.
- **Every name.** Kind ids, export names, categories and options are never removed or renamed, and
  a kind never moves to another category.
- **Every pick, nearly.** `placeholder`, `placeholders`, `avatar` and `avatars` keep choosing the
  same kinds for the same seeds, with one exception, below.

## What can change in a minor version

**New kinds.** A new kind joins `kinds` and its category, and `faces` if it has a face. When
`placeholder` or `avatar` chooses from a list the new kind joins, it takes a fair share of that
list's seeds: about one seed in however many kinds the list then holds. Every other seed keeps its
kind. For avatars chosen from the 40 faces, a new face changes about one user's avatar in 41, and
nobody else's. `placeholders` and `avatars` with `order: "random"` work the same way, picture by
picture.

Lists made with the default `order: "shuffle"`, or with `"cycle"`, go through every kind before
repeating any. The kinds keep their order, but the new one slots in among them, so from its place
onward, later pictures in the list can move along by one. A test that snapshots a whole list of
`placeholders` can change in a minor version this way; one that snapshots single pictures can't.

To keep every pick fixed for good, choose from a list of your own, or name the kind:

```ts
const mine = [owl, fox, cat, penguin];
avatar({ seed: user.id, kind: mine });
```

A kind fixed with `with` counts as a kind of its own when choosing, so `[cat, dog]` and
`[cat.with({ tabby: true }), dog]` pick differently. The order you fix options in doesn't matter.

**New options and features.** A kind can gain an option, as long as pictures that leave it unset
stay the same; their `options` then list the new option too. New palettes, adjustments and render options can be added at any time.

## What needs a new major version

Redrawing a kind, changing its alt text, removing or renaming a kind, an option or a category, or
moving a kind to another category. Bozzetto's tests keep fingerprints of sample pictures of every
kind, and of the categories, faces, picks, palettes, textures and dark mode, so none of these
slips into a release by accident.

A picture that is plainly broken, one that throws or doesn't render, can be fixed in a patch.

## Across browsers

Pictures are the same down to the byte in any one JavaScript engine. Node, Chrome, Firefox and
Safari compute trigonometry slightly differently in the last few bits, so in rare cases a
coordinate rounds differently in its last decimal. The picture looks the same, but compare markup
from the same engine, not from a server against a browser.
