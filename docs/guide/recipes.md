# Using it with…

Pictures are plain strings and numbers, so they fit any framework. A few patterns:

## React

```tsx
import { animals, placeholders } from "bozzetto";

const photos = placeholders(12, { kind: animals, size: ["400x300", "300x400"] });

export function Gallery() {
  return (
    <div className="gallery">
      {photos.map((photo, k) => (
        <img
          key={k}
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          style={{
            objectFit: "cover",
            objectPosition: `${photo.focus.x * 100}% ${photo.focus.y * 100}%`,
            background: photo.color,
          }}
        />
      ))}
    </div>
  );
}
```

Make the list outside the component (or in `useMemo`), so it isn't redrawn on every render.

## Vue

```vue
<script setup lang="ts">
import { animals, placeholders } from "bozzetto";
const photos = placeholders(12, { kind: animals });
</script>

<template>
  <img v-for="(photo, k) in photos" :key="k" :src="photo.src" :alt="photo.alt" />
</template>
```

## Inline SVG

`picture.svg` can go straight into the page. Every picture's element ids are unique, so any
number can share a page:

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
const avatar = placeholder({ kind: [animals, people], seed: user.id, size: "96x96" });
```

## Server rendering

Pictures are pure functions of their options, with no DOM, so they render the same on the
server and in the browser: no hydration mismatch.

## Tests and stories

Use fixed seeds in tests and stories, so screenshots stay the same from run to run. For fixture
files, the [command line](./cli) writes a folder of SVGs with a manifest.
