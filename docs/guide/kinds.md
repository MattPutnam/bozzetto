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

A kind listed twice comes up twice as often: `[animals, owl]` is every animal, with the owl favored.

`kinds` lists every kind, and `categories` maps each category's name to its kinds. `faces` lists
the kinds with a face, which can be [avatars](./avatars).

## Every kind

Drawn live in your browser. Change the palette or the seeds, and hover a picture to read its alt
text.

<KindGallery />

## Options

Some kinds let you fix parts of the picture with `kind.with(...)`. Whatever you leave out still
varies with the seed:

```ts
import { animals, cat, hills, placeholders, portrait, render } from "bozzetto";

render(cat.with({ tabby: true, pupils: "round" }), { seed: 3 });

placeholders(12, {
  kind: [hills.with({ tree: true }), portrait.with({ glasses: true }), animals],
});
```

A kind with options goes anywhere a kind does. Fixing one option never changes the picture's
other choices: `cat` and `cat.with({ tabby: true })` with the same seed differ only in the stripes.
Each picture's `options` field says what every option ended up as, and the alt text follows.

<KindOptions />

Options are about what's in the picture, not its colors: [palettes](./colors) handle color.
Try them in the [live example](./getting-started#try-it).

## Kinds by name

| Category     | Kinds                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `landscapes` | `hills`, `mountains`, `sea`, `dunes`, `forest`, `night`, `city`, `lake`, `beach`, `island`, `lighthouse`, `volcano`, `winter`, `autumn`, `farm`, `rainbow`, `canyon`, `savanna`, `aurora`, `rainyStreet`, `campsite`, `terraces`, `canal`, `reef`, `kelp`, `aquarium`                                                                                                                    |
| `art`        | `field`, `grid`, `squares`, `orbits`, `cutouts`, `bauhaus`, `waves`, `dots`, `arches`, `confetti`, `triangles`, `sunburst`, `pebbles`, `stripes`                                                                                                                                                                                                                                         |
| `people`     | `portrait`, `reader`, `worker`, `cafe`, `pair`, `group`, `walker`                                                                                                                                                                                                                                                                                                                        |
| `animals`    | `cat`, `bird`, `fish`, `owl`, `dog`, `fox`, `penguin`, `whale`, `frog`, `rabbit`, `snail`, `bear`, `panda`, `elephant`, `lion`, `giraffe`, `sheep`, `pig`, `koala`, `turtle`, `duck`, `hedgehog`, `mouse`, `butterfly`, `ladybug`, `bee`, `octopus`, `jellyfish`, `crab`, `horse`, `deer`, `cow`, `squirrel`, `chicken`, `parrot`, `flamingo`, `hummingbird`, `dolphin`, `shark`, `seal` |
| `food`       | `donut`, `pizza`, `iceCream`, `sushi`, `cake`, `egg`, `burger`, `taco`, `cupcake`, `watermelon`, `popsicle`, `pancakes`, `avocado`, `ramen`, `cookies`, `pie`, `salad`, `bread`, `croissant`, `cocktail`, `smoothie`, `cheeseBoard`, `dumplings`                                                                                                                                         |
| `objects`    | `fruitBowl`, `flowers`, `coffee`, `books`, `bottles`, `teapot`, `lamp`, `clock`, `candles`, `balloons`, `camera`, `armchair`                                                                                                                                                                                                                                                             |
| `plants`     | `cactus`, `houseplant`, `succulents`, `sunflower`, `rose`, `tulip`, `daisy`, `poppy`, `hibiscus`, `lotus`                                                                                                                                                                                                                                                                                |
| `buildings`  | `cottage`, `windmill`, `castle`, `bridge`, `rowHouses`, `greenhouse`                                                                                                                                                                                                                                                                                                                     |
| `vehicles`   | `car`, `bicycle`, `sailboat`, `hotAirBalloon`, `rocket`, `train`, `bus`, `airplane`                                                                                                                                                                                                                                                                                                      |
| `products`   | `sneakers`, `watch`, `backpack`, `sunglasses`, `handbag`, `perfume`, `headphones`, `phone`, `laptop`, `speaker`, `controller`                                                                                                                                                                                                                                                            |
| `music`      | `guitar`, `piano`, `drums`, `record`, `cds`, `notes`                                                                                                                                                                                                                                                                                                                                     |
| `sports`     | `baseball`, `basketball`, `football`, `hockey`, `tennis`, `skateboard`, `surfboard`                                                                                                                                                                                                                                                                                                      |
| `holidays`   | `fireworks`, `hearts`, `eggBasket`, `fallLeaves`, `pumpkins`, `snowflakes`, `snowman`, `holidayTree`, `gifts`                                                                                                                                                                                                                                                                            |
| `space`      | `planets`, `nebula`, `galaxy`, `blackHole`, `astronaut`, `moon`                                                                                                                                                                                                                                                                                                                          |
| `patterns`   | `terrazzo`, `marble`, `gingham`, `plaid`, `topography`, `gradient`                                                                                                                                                                                                                                                                                                                       |

A kind's id is its export name in kebab case: `iceCream` is `"ice-cream"` and `fruitBowl` is
`"fruit-bowl"`.
