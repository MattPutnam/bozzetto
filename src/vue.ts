/**
 * `bozzetto/vue`: a `<Placeholder>` component and composables for Vue 3.
 *
 *     import { Placeholder } from "bozzetto/vue";
 *     <Placeholder kind="owl" :seed="3" size="320x240" palette="pastel" />
 */
import { computed, defineComponent, h, toValue, type ComputedRef, type MaybeRefOrGetter, type PropType } from "vue";
import {
  placeholder,
  placeholders,
  type KindChoice,
  type Mapping,
  type PaletteSpec,
  type Picture,
  type PlaceholderOptions,
  type PlaceholdersOptions,
  type Size,
  type Texture,
} from "./index";
import { focusStyle } from "./frameworks";

/** One picture, drawn again when the options (a ref, getter or plain object) change. */
export function usePlaceholder(options: MaybeRefOrGetter<PlaceholderOptions>): ComputedRef<Picture> {
  return computed(() => placeholder(toValue(options)));
}

/** A list of pictures, drawn again when the count or options change. */
export function usePlaceholders(
  count: MaybeRefOrGetter<number>,
  options: MaybeRefOrGetter<PlaceholdersOptions> = {},
): ComputedRef<Picture[]> {
  return computed(() => placeholders(toValue(count), toValue(options)));
}

/**
 * A placeholder picture as an `<img>`, with its alt text and size. It's cropped around the
 * picture's focus when you size it with `object-fit: cover`, and shows the picture's color while
 * loading. Other attributes, such as `class`, fall through to the `<img>`; `alt` replaces the
 * picture's own alt text.
 */
export const Placeholder = defineComponent({
  name: "Placeholder",
  props: {
    kind: [String, Object, Array] as PropType<KindChoice>,
    seed: [Number, String] as PropType<number | string>,
    size: [String, Object] as PropType<Size>,
    palette: [String, Array] as PropType<PaletteSpec>,
    mapping: String as PropType<Mapping>,
    texture: String as PropType<Texture>,
    label: [String, Number] as PropType<string | number>,
    alt: String,
    /** Draw the SVG markup into the page instead of an `<img>`. */
    inline: Boolean,
  },
  setup(props) {
    const picture = computed(() =>
      placeholder({
        kind: props.kind,
        seed: props.seed,
        size: props.size,
        palette: props.palette,
        mapping: props.mapping,
        texture: props.texture,
        label: props.label,
      }),
    );
    return () => {
      const p = picture.value;
      return props.inline
        ? h("span", {
            role: "img",
            "aria-label": props.alt ?? p.alt,
            style: { display: "inline-block", lineHeight: 0 },
            innerHTML: p.svg,
          })
        : h("img", { src: p.src, alt: props.alt ?? p.alt, width: p.width, height: p.height, style: focusStyle(p) });
    };
  },
});
