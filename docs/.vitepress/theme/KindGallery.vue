<script setup lang="ts">
import { computed, ref } from "vue";
import { ADJUSTMENTS, PALETTES, categories, render, type Kind } from "../../../src";

/** Every kind by category, drawn live: change the palette or the seeds and every picture follows. */
const palette = ref("");
const base = ref(1);
const sections = Object.entries(categories) as [string, readonly Kind[]][];
const exportName = (id: string) => id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

const cards = computed(() =>
  sections.map(([name, kinds]) => ({
    name,
    kinds: kinds.map(kind => ({
      kind,
      pictures: [0, 1, 2].map(k =>
        render(kind, { seed: base.value + k, size: "240x180", palette: palette.value || undefined }),
      ),
    })),
  })),
);
</script>

<template>
  <div class="kind-gallery">
    <div class="bz-controls">
      <label
        >Palette
        <select v-model="palette">
          <option value="">Original colors</option>
          <optgroup label="Adjust each picture's colors">
            <option v-for="name in ADJUSTMENTS" :key="name" :value="name">{{ name }}</option>
          </optgroup>
          <optgroup label="Color palettes">
            <option v-for="name in Object.keys(PALETTES)" :key="name" :value="name">{{ name }}</option>
          </optgroup>
        </select>
      </label>
      <button class="bz-button" @click="base = Math.floor(Math.random() * 99999) + 1">New seeds</button>
      <span>Seeds {{ base }}–{{ base + 2 }}. Hover a picture for its alt text.</span>
    </div>
    <section v-for="section in cards" :key="section.name">
      <h3 :id="`kinds-${section.name}`">
        <code>{{ section.name }}</code>
      </h3>
      <div class="kind-grid">
        <div v-for="card in section.kinds" :key="card.kind.id" class="kind-card">
          <div class="kind-name">
            <code>{{ exportName(card.kind.id) }}</code>
            <span>{{ card.kind.name }}</span>
          </div>
          <div class="kind-pictures">
            <img v-for="p in card.pictures" :key="p.src" :src="p.src" :alt="p.alt" :title="p.alt" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.kind-gallery {
  margin: 20px 0;
}
.kind-gallery h3 {
  margin-top: 28px;
}
.kind-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 12px;
}
.kind-name {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.kind-pictures {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 3px;
  border-radius: 8px;
  overflow: hidden;
}
.kind-pictures img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  aspect-ratio: 4 / 3;
}
.kind-pictures img:first-child {
  grid-row: span 2;
}
</style>
