# Stability

Placeholders end up in screenshots, visual tests and user avatars, so a picture that changes under
you is a breaking change. Bozzetto follows [semantic versioning](https://semver.org), and the
pictures themselves count as part of the API.

## What stays the same

Within a major version (every 1.x release, say):

- **Every picture.** The same kind, seed, size and options draw the same picture, with the same
  alt text, focus, color and `options`. That holds with palettes, mappings, textures and dark mode
  too.
- **Every name.** Kind ids, export names, categories and options are never removed or renamed, and
  a kind never moves to another category.
- **Every pick, nearly.** `placeholder`, `placeholders` and `avatar` keep choosing the same kinds for
  the same seeds, with one exception, below.

## What can change in a minor version

**New kinds.** A new kind joins `kinds` and its category, and `faces` if it has a face. When it
joins a list you choose from, it takes a fair share of that list's seeds: about one seed in however
many kinds the list then holds. Every other seed keeps its kind. For avatars chosen from the 40
faces, a new face changes about one user's avatar in 41, and nobody else's.

To keep every pick fixed for good, choose from a list of your own, or name the kind:

```ts
const mine = [owl, fox, cat, penguin];
avatar({ seed: user.id, kind: mine });
```

**New options and features.** A kind can gain an option, as long as pictures that leave it unset
stay the same. New palettes, adjustments and render options can be added at any time.

## What needs a new major version

Redrawing a kind, changing its alt text, removing or renaming a kind, an option or a category, or
moving a kind to another category. Bozzetto's tests keep a fingerprint of every kind's pictures, so
none of these can happen by accident.

A picture that is plainly broken, one that throws or doesn't render, can be fixed in a patch.

## Across browsers

Pictures are the same down to the byte in any one JavaScript engine. Node, Chrome, Firefox and
Safari compute trigonometry slightly differently in the last few bits, so in rare cases a
coordinate rounds differently in its last decimal. The picture looks the same, but compare markup
from the same engine, not from a server against a browser.
