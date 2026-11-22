# Using it with…

Pictures are plain strings and numbers, so they fit any framework. A few patterns:

## React, Vue and web components

`bozzetto/react`, `bozzetto/vue` and `bozzetto/element` give you a ready-made `<Placeholder>`
component (or `<bozzetto-img>` element) with alt text, size and focus-based cropping built in: see
[React, Vue and web components](./components). The patterns below are for doing it by hand.

## Inline SVG

`picture.svg` can go straight into the page. Every picture's element ids are unique to it (its
kind, seed, size and styling), so any number can share a page:

```ts
container.innerHTML = render(owl, { seed: 3 }).svg;
```

## CSS backgrounds

```ts
element.style.backgroundImage = `url("${render(hills, { size: "1200x400" }).src}")`;
```

## A picture per user

Text seeds are hashed, so a user id gives each user their own picture, the same on every visit:

```ts
const cover = placeholder({ kind: [landscapes, art], seed: user.id, size: "960x240" });
```

For a face framed around its head, use [`avatar`](./avatars).

## Server rendering

Pictures are pure functions of their options, with no DOM, so they render the same on the
server and in the browser: no hydration mismatch.

## Tests and stories

Use fixed seeds in tests and stories, so screenshots stay the same from run to run. For fixture
files, the [command line](./cli) writes a folder of SVGs with a manifest.
