<script setup lang="ts">
import { cat, fruitBowl, hills, render } from "../../../src";

/** Inline pictures that follow this site's own theme switch, which sets `dark` on `<html>`. */
const pictures = [hills, cat, fruitBowl].map(kind => render(kind, { seed: 4, dark: true, darkSelector: "html.dark" }));
</script>

<template>
  <div class="bz-dark-demo">
    <figure v-for="picture in pictures" :key="picture.kind">
      <!-- eslint-disable-next-line vue/no-v-html -- the picture is our own markup -->
      <div role="img" :aria-label="picture.alt" v-html="picture.svg"></div>
    </figure>
  </div>
</template>

<style scoped>
.bz-dark-demo {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.bz-dark-demo figure {
  margin: 0;
}
.bz-dark-demo :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 10px;
}
</style>
