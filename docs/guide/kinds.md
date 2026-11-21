---
outline: [2, 3]
---

# Kinds and categories

Each kind of picture is its own export, like icons in an icon library: `owl`, `iceCream`,
`hills`. Every kind varies with the seed: coats and markings, toppings, hair, which way an
animal faces, what's in the bowl.

**Categories** are plain arrays of kinds, for convenience. Use a category anywhere a list of kinds
is accepted, alone or mixed with single kinds:

```ts
import { animals, donut, placeholders } from "bozzetto";

placeholders(12, { kind: [animals, donut] }); // every animal, plus the donut
placeholders(6, { kind: ["owl", "ice-cream"] }); // kinds can be named by id, too
```

`kinds` lists every kind, and `categories` maps each category's name to its kinds.

## Every kind

Drawn live in your browser. Change the palette or the seeds, and hover a picture to read its alt
text.

<KindGallery />

## Kinds by name

| Category     | Kinds                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| `landscapes` | `hills`, `mountains`, `sea`, `dunes`, `forest`, `night`, `city`                           |
| `art`        | `field`, `grid`, `squares`, `orbits`, `cutouts`, `bauhaus`                                |
| `people`     | `portrait`                                                                                |
| `animals`    | `cat`, `bird`, `fish`, `owl`, `dog`, `fox`, `penguin`, `whale`, `frog`, `rabbit`, `snail` |
| `food`       | `donut`, `pizza`, `iceCream`, `sushi`, `cake`, `egg`                                      |
| `objects`    | `fruitBowl`, `flowers`, `cactus`, `coffee`, `books`, `bottles`                            |

A kind's id is its export name in kebab case: `iceCream` is `"ice-cream"` and `fruitBowl` is
`"fruit-bowl"`.
