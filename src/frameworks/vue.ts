/**
 * `bozzetto/vue`: `<Placeholder>` and `<Avatar>` components and composables for Vue 3.
 *
 *     import { Placeholder } from "bozzetto/vue";
 *     <Placeholder kind="owl" :seed="3" size="320x240" palette="pastel" />
 */
import { computed, defineComponent, h, toValue, type ComputedRef, type MaybeRefOrGetter, type PropType } from "vue";
import {
  avatar,
  avatars,
  placeholder,
  placeholders,
  type AvatarOptions,
  type AvatarShape,
  type AvatarsOptions,
  type KindChoice,
  type Mapping,
  type PaletteSpec,
  type Picture,
  type PlaceholderOptions,
  type PlaceholdersOptions,
  type Size,
  type Texture,
} from "../index";
import { focusStyle } from "./shared";

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

/** A picture as an `<img>` (or inline SVG), as both components render it. */
function pictureVNode(p: Picture, inline: boolean, alt: string | undefined, shape?: AvatarShape) {
  return inline
    ? h("span", {
        role: "img",
        "aria-label": alt ?? p.alt,
        style: { display: "inline-block", lineHeight: 0 },
        innerHTML: p.svg,
      })
    : h("img", { src: p.src, alt: alt ?? p.alt, width: p.width, height: p.height, style: focusStyle(p, shape) });
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
    /** A dark-mode version: true for the `dim` adjustment, or a palette. */
    dark: { type: [Boolean, String, Array] as PropType<boolean | PaletteSpec>, default: undefined },
    darkSelector: String,
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
        dark: props.dark,
        darkSelector: props.darkSelector,
      }),
    );
    return () => pictureVNode(picture.value, props.inline, props.alt);
  },
});

/** One avatar, drawn again when the options change. */
export function useAvatar(options: MaybeRefOrGetter<AvatarOptions> = {}): ComputedRef<Picture> {
  return computed(() => avatar(toValue(options)));
}

/** A list of avatars, drawn again when the count or options change. */
export function useAvatars(
  count: MaybeRefOrGetter<number>,
  options: MaybeRefOrGetter<AvatarsOptions> = {},
): ComputedRef<Picture[]> {
  return computed(() => avatars(toValue(count), toValue(options)));
}

/**
 * An avatar as an `<img>`: a face framed around its head, round by default, with its alt text.
 * Pass a user id as `seed` to give each user their own. Other attributes fall through.
 */
export const Avatar = defineComponent({
  name: "Avatar",
  props: {
    kind: [String, Object, Array] as PropType<KindChoice>,
    seed: [Number, String] as PropType<number | string>,
    size: Number,
    shape: String as PropType<AvatarShape>,
    margin: Number,
    palette: [String, Array] as PropType<PaletteSpec>,
    mapping: String as PropType<Mapping>,
    texture: String as PropType<Texture>,
    /** A dark-mode version: true for the `dim` adjustment, or a palette. */
    dark: { type: [Boolean, String, Array] as PropType<boolean | PaletteSpec>, default: undefined },
    darkSelector: String,
    alt: String,
    /** Draw the SVG markup into the page instead of an `<img>`. */
    inline: Boolean,
  },
  setup(props) {
    const picture = computed(() =>
      avatar({
        kind: props.kind,
        seed: props.seed,
        size: props.size,
        shape: props.shape,
        margin: props.margin,
        palette: props.palette,
        mapping: props.mapping,
        texture: props.texture,
        dark: props.dark,
        darkSelector: props.darkSelector,
      }),
    );
    return () => pictureVNode(picture.value, props.inline, props.alt, props.shape ?? "circle");
  },
});
