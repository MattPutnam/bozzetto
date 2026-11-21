---
outline: [2, 3]
---

<script setup>
import { Placeholder } from "../../src/vue";
import { cat } from "../../src";
</script>

# React, Vue and web components

Each of these renders a picture as an `<img>` with its alt text, width and height. Styled with
`object-fit: cover`, the image crops around the picture's focus, and it shows the picture's color
while it loads. They take the same options as `placeholder`: `kind`, `seed`, `size`, `palette`,
`mapping`, `texture`, `label`, `dark` and `darkSelector`, plus `alt` to replace the picture's alt text and `inline` to
draw the SVG into the page instead of an image.

React and Vue are optional peer dependencies: install whichever you use. The web component
needs nothing.

There's an `<Avatar>` component too, and an `avatar` attribute on the web component: see
[Avatars](./avatars#in-components-and-on-the-command-line).

## React

```tsx
import { Placeholder } from "bozzetto/react";
import { cat } from "bozzetto";

<Placeholder kind="owl" seed={3} size="320x240" palette="pastel" />
<Placeholder kind={cat.with({ tabby: true })} className="avatar" loading="lazy" />
```

Other `<img>` props (`className`, `style`, `loading`, `onClick`, …) pass through. The hooks give
you pictures for your own markup. They draw again only when the options' contents change, so an
inline options object is fine:

```tsx
import { usePlaceholders } from "bozzetto/react";

function Gallery() {
  const photos = usePlaceholders(12, { kind: animals, size: ["400x300", "300x400"] });
  return photos.map((photo, k) => <img key={k} src={photo.src} alt={photo.alt} />);
}
```

`usePlaceholder(options)` does the same for one picture.

## Vue

```vue
<script setup lang="ts">
import { Placeholder } from "bozzetto/vue";
import { cat } from "bozzetto";
</script>

<template>
  <Placeholder kind="owl" :seed="3" size="320x240" palette="pastel" />
  <Placeholder :kind="cat.with({ tabby: true })" class="avatar" loading="lazy" />
</template>
```

Drawn live on this page:

<div class="components-row">
  <Placeholder kind="owl" :seed="3" size="320x240" palette="pastel" class="components-demo" />
  <Placeholder :kind="cat.with({ tabby: true })" :seed="2" size="240x240" class="components-demo" />
</div>

Attributes such as `class` fall through to the `<img>`. `usePlaceholder` and `usePlaceholders`
take options as plain values, refs or getters, and return computed pictures:

```ts
import { usePlaceholders } from "bozzetto/vue";

const count = ref(12);
const photos = usePlaceholders(count, () => ({ kind: animals, palette: palette.value }));
```

## Web component

For Svelte, Angular, Solid, plain HTML, or anywhere else, `<bozzetto-img>` needs no framework.
Importing `bozzetto/element` registers it:

```html
<script type="module">
  import "bozzetto/element";
</script>

<bozzetto-img kind="owl" seed="3" size="320x240" palette="pastel"></bozzetto-img>
<bozzetto-img kind="cat:tabby,pupils=round" seed="2"></bozzetto-img>
<bozzetto-img
  kind="animals donut"
  seed="user-42"
  style="width: 96px; height: 96px; border-radius: 50%"
></bozzetto-img>
```

Drawn live on this page:

<div class="components-row">
  <bozzetto-img kind="owl" seed="3" size="320x240" palette="pastel"></bozzetto-img>
  <bozzetto-img kind="cat:tabby,pupils=round" seed="2" size="240x240"></bozzetto-img>
  <bozzetto-img kind="animals donut" seed="user-42" style="width: 96px; height: 96px; border-radius: 50%; overflow: hidden"></bozzetto-img>
</div>

Attributes are text, so `kind` is written like on the [command line](./cli#kinds): ids, export
names or categories separated by spaces, with options after a colon. The element changes picture
when an attribute changes.

The element is an inline block the picture's size until you size it with CSS; then the picture
fills it, cropped around its focus. Style the image itself with `::part(image)`, and read the
drawn picture (alt text, focus, color) from the element's `picture` property.

<style>
.components-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin: 16px 0;
}
.components-demo {
  border-radius: 8px;
  max-width: 100%;
  height: auto;
}
</style>
