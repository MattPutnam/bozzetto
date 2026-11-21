<script setup>
import { Avatar } from "../../src/frameworks/vue";
</script>

# Avatars

`avatar` draws a face framed around its head: a portrait or an animal, square or round, for user
lists, comments and profile menus. Give it a user's id as the seed, and each user keeps the same
avatar on every visit:

<<< @/examples/avatars.ts#users

<Figure name="avatars-users" alt="Eight round avatars of people and animals" />

```ts
img.src = avatar({ seed: user.id, size: 48 }).src;
```

An avatar is an ordinary [picture](./pictures): `src`, `svg`, `alt` and the rest. Its alt text is
the face's own, such as "A tabby cat's face with round pupils".

## Faces

The `faces` list holds the kinds that can be avatars: `portrait`, `cat`, `dog`, `fox`, `rabbit`,
`owl`, `frog` and `penguin`. With no `kind`, the seed picks one of them; pass a kind or a list to
narrow it, options included:

```ts
avatar({ seed: user.id, kind: portrait });
avatar({ seed: user.id, kind: [cat, dog] });
avatar({ seed: user.id, kind: portrait.with({ glasses: true }) });
```

<Figure name="avatars-everyFace" alt="Two avatars of each face kind" />

## Options

| Option                          | Default  |                                                  |
| ------------------------------- | -------- | ------------------------------------------------ |
| `kind`                          | any face | A face kind, or a list of them                   |
| `seed`                          | `1`      | A number, or any text such as a user id          |
| `size`                          | `64`     | Width and height in px: avatars are square       |
| `shape`                         | `circle` | `circle`, `rounded` or `square`                  |
| `margin`                        | `0.12`   | Space around the head, as a fraction of its size |
| `palette`, `mapping`, `texture` | none     | As for any picture: see [palettes](./colors)     |

<<< @/examples/avatars.ts#shapes

<Figure name="avatars-shapes" alt="The same avatar as a circle, rounded square and square" />

Round and rounded avatars are clipped inside the SVG, so their corners are transparent wherever
you use them.

## Lists

`avatars(count, options)` makes a list, using every face once (in a seeded order) before any
repeats, like [`placeholders`](./galleries):

<<< @/examples/avatars.ts#styled

<Figure name="avatars-styled" alt="Eight pastel avatars" />

## How it works

Each face kind reports where its head is. An avatar draws the kind on a square canvas, then sets
the SVG's `viewBox` to a square around the head. Nothing is redrawn or scaled as pixels, so an
avatar is as sharp at 24 px as at 240. At very small sizes, fine details such as whiskers blur
together, as they would in any drawing.

## In components and on the command line

React and Vue have an `<Avatar>` component (and `useAvatar` and `useAvatars`); the web component
takes an `avatar` attribute. Drawn live with the Vue component:

<div class="avatars-row">
  <Avatar seed="ada" :size="64" />
  <Avatar seed="grace" :size="64" />
  <Avatar seed="alan" :size="64" shape="rounded" />
  <Avatar seed="katherine" :size="64" palette="pastel" />
  <bozzetto-img avatar seed="linus" size="64"></bozzetto-img>
  <bozzetto-img avatar seed="margaret" size="64" shape="rounded"></bozzetto-img>
</div>

```tsx
<Avatar seed={user.id} size={40} />                 // React or Vue
<bozzetto-img avatar seed="alice" size="40"></bozzetto-img>
```

```bash
npx bozzetto --avatar --seed alice --size 96 -o alice.svg
npx bozzetto --avatar -n 20 --size 64 -o avatars/
```

<style>
.avatars-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 16px 0;
}
</style>
