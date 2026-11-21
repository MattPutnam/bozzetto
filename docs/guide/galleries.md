# Filling a gallery

`placeholders(count, options)` makes a list of pictures for a gallery, a feed or a grid of cards.

<<< @/examples/galleries.ts#wall

<Figure name="galleries-wall" alt="Animals and food in four different shapes, in justified rows" />

## One value or a list

`kind`, `size`, `palette`, `mapping` and `texture` each take a single value or a list of values
to go through, picture by picture. Each option goes through its own list, so three sizes and two
palettes mix freely.

A list made only of colors counts as **one** palette: `["#264653", "#e76f51"]` is one palette,
while `["pastel", "riso"]` is two, and `["pastel", ["#264653", "#e76f51"]]` is two as well.

## Order

`order` says how lists are gone through:

- **`shuffle`** (the default): every value once, in a seeded order, then again in a new order.
  `kind: animals` with eleven pictures gives every animal exactly once.
- **`cycle`**: every value once, in the order given, and around again.
- **`random`**: an independent seeded pick each time, so values can repeat or be skipped.

<<< @/examples/galleries.ts#each

<Figure name="galleries-each" alt="Eleven animals and a donut, each once" />

<<< @/examples/galleries.ts#cycle

<Figure name="galleries-cycle" alt="Six numbered landscapes, alternating pastel and dusk palettes" />

## Seeds

Picture _k_ of a list uses seed `seed + k`. Asking for more pictures later keeps the first ones
the same, so a gallery can grow as a user scrolls without its pictures changing.

## Labels

`numbered: true` puts 1, 2, 3… in each picture's corner, handy for checking a layout's order.
For a single picture, `label` puts any short text there.

## Next

Each picture in the list comes with its size, alt text, focal point and color: see
[Alt text, focus and color](./pictures).
