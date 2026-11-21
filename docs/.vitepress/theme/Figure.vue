<script setup lang="ts">
import { withBase } from "vitepress";
/** An example picture from docs/public/examples, by name (without .svg). */
defineProps<{ name: string; caption?: string; alt?: string }>();
</script>

<template>
  <figure class="bz-figure">
    <img :src="withBase(`/examples/${name}.svg`)" :alt="alt ?? caption ?? ''" loading="lazy" />
    <figcaption v-if="caption || $slots.default">
      <slot>{{ caption }}</slot>
    </figcaption>
  </figure>
</template>
