<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  ADJUSTMENTS,
  MAPPINGS,
  PALETTES,
  kinds,
  render,
  toImageBlob,
  type Mapping,
  type Size,
  type Texture,
} from "../../../src";

/** A single picture with every option to play with, and the code that makes it. */
const props = withDefaults(defineProps<{ kind?: string; seed?: number }>(), { kind: "owl", seed: 3 });

const kind = ref(props.kind);
const seed = ref(props.seed);
const size = ref<Size>("400x300");
const palette = ref("");
const mapping = ref<Mapping>("balanced");
const texture = ref<Texture | "">("");
const SIZES: Size[] = ["400x300", "300x400", "320x320", "640x240"];
const chosenKind = computed(() => kinds.find(k => k.id === kind.value)!);
/** The options fixed in the playground, by name; "" means the seed chooses. */
const fixed = ref<Record<string, string>>({});
watch(kind, () => (fixed.value = {}));
const fixedValues = computed(() => {
  const values: Record<string, string | number | boolean> = {};
  for (const [option, text] of Object.entries(fixed.value)) {
    const value = chosenKind.value.options[option]?.find(v => String(v) === text);
    if (value !== undefined) values[option] = value;
  }
  return values;
});
const exportName = (id: string) => id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const isPalette = computed(() => palette.value !== "" && !(ADJUSTMENTS as readonly string[]).includes(palette.value));

const picture = computed(() =>
  render(chosenKind.value.with(fixedValues.value), {
    seed: seed.value,
    size: size.value,
    palette: palette.value || undefined,
    mapping: isPalette.value ? mapping.value : undefined,
    texture: texture.value || undefined,
  }),
);

/** Saves the picture as a PNG at twice its size, through the browser's own download. */
const saved = ref("");
async function savePng() {
  const blob = await toImageBlob(picture.value, { scale: 2 });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${kind.value}-${seed.value}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  saved.value = `Saved ${link.download}: ${picture.value.width * 2}×${picture.value.height * 2}, ${(blob.size / 1024).toFixed(1)} KB`;
}

const code = computed(() => {
  const values = Object.entries(fixedValues.value);
  const kindCode = values.length
    ? `${exportName(kind.value)}.with({ ${values.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")} })`
    : `"${kind.value}"`;
  const lines = [`  kind: ${kindCode},`, `  seed: ${seed.value},`];
  if (size.value !== "400x300") lines.push(`  size: "${size.value}",`);
  if (palette.value) lines.push(`  palette: "${palette.value}",`);
  if (isPalette.value && mapping.value !== "balanced") lines.push(`  mapping: "${mapping.value}",`);
  if (texture.value) lines.push(`  texture: "${texture.value}",`);
  return `const picture = placeholder({\n${lines.join("\n")}\n});`;
});
</script>

<template>
  <div class="live-picture">
    <div class="bz-controls">
      <label
        >Kind
        <select v-model="kind">
          <option v-for="k in kinds" :key="k.id" :value="k.id">{{ k.id }}</option>
        </select>
      </label>
      <label v-for="(values, option) in chosenKind.options" :key="option"
        >{{ option }}
        <select v-model="fixed[option]">
          <option value="">by seed</option>
          <option v-for="v in values" :key="String(v)" :value="String(v)">{{ v }}</option>
        </select>
      </label>
      <label>Seed <input v-model.number="seed" type="number" min="0" /></label>
      <button class="bz-button" @click="seed = Math.floor(Math.random() * 99999) + 1">Random seed</button>
      <label
        >Size
        <select v-model="size">
          <option v-for="s in SIZES" :key="String(s)" :value="s">{{ s }}</option>
        </select>
      </label>
      <label
        >Palette
        <select v-model="palette">
          <option value="">Original colors</option>
          <optgroup label="Adjustments">
            <option v-for="name in ADJUSTMENTS" :key="name" :value="name">{{ name }}</option>
          </optgroup>
          <optgroup label="Color palettes">
            <option v-for="name in Object.keys(PALETTES)" :key="name" :value="name">{{ name }}</option>
          </optgroup>
        </select>
      </label>
      <label v-if="isPalette"
        >Mapping
        <select v-model="mapping">
          <option v-for="m in MAPPINGS" :key="m" :value="m">{{ m }}</option>
        </select>
      </label>
      <label
        >Texture
        <select v-model="texture">
          <option value="">none</option>
          <option value="grain">grain</option>
          <option value="paper">paper</option>
        </select>
      </label>
    </div>
    <div class="live-body">
      <div class="live-stage">
        <img :src="picture.src" :alt="picture.alt" />
        <span
          class="live-focus"
          :style="{ left: `${picture.focus.x * 100}%`, top: `${picture.focus.y * 100}%` }"
          title="Focal point"
        ></span>
      </div>
      <div class="live-facts">
        <div class="language-ts">
          <pre><code>{{ code }}</code></pre>
        </div>
        <dl>
          <dt>alt</dt>
          <dd>{{ picture.alt }}</dd>
          <dt>focus</dt>
          <dd>x {{ picture.focus.x.toFixed(2) }}, y {{ picture.focus.y.toFixed(2) }}</dd>
          <dt>color</dt>
          <dd><span class="chip" :style="{ background: picture.color }"></span>{{ picture.color }}</dd>
          <dt>size</dt>
          <dd>{{ (picture.src.length / 1024).toFixed(1) }} KB as a data URI</dd>
        </dl>
        <p class="live-save">
          <button class="bz-button" @click="savePng">Save PNG</button>
          <span>{{ saved }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live-picture {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid var(--bz-border);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
}
.live-body {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 16px;
  margin-top: 14px;
  align-items: start;
}
@media (max-width: 720px) {
  .live-body {
    grid-template-columns: 1fr;
  }
}
.live-stage {
  position: relative;
}
.live-stage img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 10px;
}
.live-focus {
  position: absolute;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow:
    0 0 0 1.5px rgba(0, 0, 0, 0.55),
    inset 0 0 0 1.5px rgba(0, 0, 0, 0.55);
  pointer-events: none;
}
.live-facts pre {
  margin: 0 !important;
}
.live-facts div[class*="language-"] {
  margin: 0 0 12px !important;
  border-radius: 8px;
}
.live-facts dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 0;
  font-size: 13px;
}
.live-facts dt {
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
}
.live-facts dd {
  margin: 0;
}
.live-save {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.chip {
  display: inline-block;
  width: 0.9em;
  height: 0.9em;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: -1px;
  border: 1px solid var(--bz-border);
}
</style>
