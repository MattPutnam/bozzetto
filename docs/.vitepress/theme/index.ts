import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import DarkDemo from "./DarkDemo.vue";
import Figure from "./Figure.vue";
import KindGallery from "./KindGallery.vue";
import KindOptions from "./KindOptions.vue";
import LivePicture from "./LivePicture.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // The web component only works in a browser, so register it there.
    if (!import.meta.env.SSR) void import("../../../src/element");
    app.component("DarkDemo", DarkDemo);
    app.component("Figure", Figure);
    app.component("KindGallery", KindGallery);
    app.component("KindOptions", KindOptions);
    app.component("LivePicture", LivePicture);
  },
} satisfies Theme;
